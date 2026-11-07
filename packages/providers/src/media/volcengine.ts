/// <reference path="../../types.d.ts" />

const rules = [
  {
    type: "input",
    field: "apiKey" as const,
    title: "API Key",
    value: "",
    props: { type: "password", showPassword: true, autocomplete: "off" },
    validate: [{ required: true, message: "请填写火山方舟 API Key", trigger: "blur" }],
  },
];

const baseUrl = "https://ark.cn-beijing.volces.com/api/v3";

type ReferencedVideoRequest = VideoRequest & {
  referenceOrder?: ({ type: "image" | "video" | "audio"; index: number } | { type: "firstFrame" | "lastFrame" | "text" })[];
};

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("火山方舟响应格式错误");
  return value as Record<string, unknown>;
}

function mediaAddress(value: unknown, allowAsset = true): string {
  if (typeof value !== "string" || !value.trim()) throw new Error("火山方舟素材地址为空");
  if (allowAsset && /^asset:\/\/[^/?#\s]+$/.test(value)) return value;
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("素材须使用不含账号密码的 HTTP(S) 地址或 asset:// 素材 ID");
  return url.href;
}

function mediaBytes(input: Exclude<MediaInput, { type: "url" }>, type: "image" | "video" | "audio") {
  const mimeType = input.mimeType.toLowerCase();
  const formats = {
    image: ["image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff", "image/gif", "image/heic", "image/heif"],
    video: ["video/mp4", "video/quicktime"],
    audio: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav"],
  };
  if (!formats[type].includes(mimeType)) throw new Error(`火山方舟不支持此${{ image: "图片", video: "视频", audio: "音频" }[type]}格式：${mimeType}`);
  let bytes: Uint8Array;
  if (input.type === "binary") bytes = input.data;
  else {
    const data = input.data.replace(/^data:[^;,]+;base64,/i, "").replace(/\s/g, "");
    if (!data || !/^[A-Za-z0-9+/]+={0,2}$/.test(data) || data.length % 4 === 1) throw new Error("参考素材 Base64 无效");
    bytes = Buffer.from(data, "base64");
  }
  const limit = { image: 30, video: 100, audio: 15 }[type] * 1024 * 1024;
  if (!bytes.byteLength || bytes.byteLength > limit || type === "image" && bytes.byteLength === limit) throw new Error("参考素材为空或超过火山方舟大小限制（图片小于 30 MB、视频不超过 100 MB、音频不超过 15 MB）");
  return { bytes, mimeType: mimeType === "audio/x-wav" ? "audio/wav" : mimeType };
}

function mediaUrl(input: MediaInput, type: "image" | "audio") {
  if (input.type === "url") return mediaAddress(input.url);
  const { bytes, mimeType } = mediaBytes(input, type);
  return `data:${mimeType};base64,${Buffer.from(bytes).toString("base64")}`;
}

function videoPrompt(request: ReferencedVideoRequest) {
  const labels = request.model === "doubao-seedance-2-5-260628"
    ? { image: "@image", video: "@video", audio: "@audio" }
    : { image: "图片", video: "视频", audio: "音频" };
  return request.prompt.replace(/\{\{ref (\d+)\}\}/g, (marker, number: string) => {
    const reference = request.referenceOrder?.[Number(number) - 1];
    if (!reference) throw new Error(`引用标记 ${marker} 缺少素材映射，请重新选择引用`);
    if (reference.type === "text") return `参考 ${Number(number)}`;
    if (reference.type === "firstFrame" || reference.type === "lastFrame") {
      if (!request[reference.type]) throw new Error(`引用标记 ${marker} 对应的首尾帧未提交`);
      return reference.type === "firstFrame" ? "首帧" : "尾帧";
    }
    if (!("index" in reference)) throw new Error(`引用标记 ${marker} 的素材类型无效`);
    const media = { image: request.images, video: request.videos, audio: request.audios };
    if (!Number.isSafeInteger(reference.index) || reference.index < 0 || !media[reference.type]?.[reference.index]) throw new Error(`引用标记 ${marker} 对应的素材未提交`);
    return `${labels[reference.type]}${reference.index + 1}`;
  });
}

function wait(signal: AbortSignal) {
  signal.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, 5000);
    signal.addEventListener("abort", abort, { once: true });
  });
}

async function requestJson(context: { tool: Pick<ProviderTools, "fetch" | "errorMessage"> }, path: string, apiKey: string, signal: AbortSignal, body?: string | Blob, contentType = "application/json") {
  const response = await context.tool.fetch(`${baseUrl}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${apiKey}`, ...(body === undefined ? {} : { "Content-Type": contentType }) },
    body,
    signal,
    redirect: "error",
  });
  if (!response.ok) {
    const message = context.tool.errorMessage(await response.text());
    throw new Error(`火山方舟请求失败（HTTP ${response.status}）${message ? `：${message}` : ""}`);
  }
  return object(await response.json());
}

async function uploadReferenceVideo(context: ProviderContext, input: MediaInput, signal: AbortSignal, uploads: ProviderTaskData[]) {
  if (input.type === "url") return mediaAddress(input.url);
  if (!context.tool.uploadMedia) throw new Error("请更新 Toonflow，并在插件设置中安装、启用和配置阿里云 OSS");
  const { bytes, mimeType } = mediaBytes(input, "video");
  const uploaded = await context.tool.uploadMedia({ data: bytes, mimeType }, {
    signal,
    onPrepared: async record => {
      uploads.push({ storageId: record.storageId, bucket: record.bucket, objectKey: record.objectKey });
      await context.saveTaskData?.({ kind: "uploading", uploads });
    },
  });
  const record = uploads.at(-1);
  if (!record || record.objectKey !== uploaded.objectKey || record.bucket !== uploaded.bucket) throw new Error("OSS 上传记录与返回对象不一致，请先核对云端对象");
  record.expiresAt = uploaded.expiresAt;
  await context.saveTaskData?.({ kind: "uploading", uploads });
  return mediaAddress(uploaded.url, false);
}

async function waitForVideo(context: ProviderContext, apiKey: string, taskId: string, signal: AbortSignal): Promise<MediaAsset[]> {
  while (true) {
    const data = await requestJson(context, `/contents/generations/tasks/${encodeURIComponent(taskId)}`, apiKey, signal);
    if (data.id !== taskId) throw new Error("火山方舟返回的任务 ID 不匹配");
    if (data.status === "succeeded") {
      const content = object(data.content);
      return [{ mediaType: "video", type: "url", url: mediaAddress(content.video_url, false), mimeType: data.output_format === "mov" ? "video/quicktime" : "video/mp4" }];
    }
    if (["failed", "cancelled", "expired"].includes(String(data.status))) throw Object.assign(new Error(context.tool.errorMessage(data) || `火山方舟视频任务已结束：${data.status}`), { code: "MEDIA_TASK_FAILED" });
    if (data.status !== "queued" && data.status !== "running") throw new Error("火山方舟返回未知任务状态，请稍后恢复查询");
    await wait(signal);
  }
}

export default {
  id: "volcengine",
  label: "火山方舟（官方 Seedance）",
  icon: "",
  version: "2.3.0",
  supportsProviderAssets: true,
  readme: `使用已开通对应 Seedance 模型的火山方舟 API Key，直连北京地域官方接口。[获取 API Key](https://console.volcengine.com/ark/region:cn-beijing/apiKey)。

支持 Seedance 2.5、2.0、2.0 Fast、2.0 Mini 的文生视频、首帧/首尾帧、图片/视频/音频混合参考、视频编辑与延长。编辑或延长时选择「混合参考」，并在提示词中明确编辑或延长意图；2.5 还可在模型设置中选择任务类型。

Seedance 2.5 编辑自动使用原视频的画幅和时长；延长自动使用原视频画幅；首尾帧自动使用首帧画幅。自动识别且带参考视频时使用智能画幅和时长，若要指定输出时长与比例，请选择「参考生视频」。这些情况下通用比例或时长选项不会覆盖官方锁定值。

Seedance 2.5 参考视频编辑要求 4～30 秒，其他视频参考要求 2～30 秒；视频总时长、音频总时长分别不超过 30 秒。官方建议编辑控制在 20 秒以内，使用 1～5 张参考图。

Seedance 2.0 系列输出 4～15 秒 MP4。标准版支持 480p/720p/1080p/4k，Fast 和 Mini 支持 480p/720p。参考素材最多 9 张图片、3 段视频、3 段音频；单段音视频为 2～15 秒，视频总时长、音频总时长分别不超过 15 秒。音频参考须搭配图片或视频，不能单独提交。2.0 系列按通用比例与时长生成，不使用 2.5 的画幅/时长锁定和任务类型、输出格式参数。4k 使用 10bit HEVC 编码，播放兼容性需核对。尺寸、时长和人像审核由官方接口校验。

本地视频由已启用的「阿里云 OSS」插件自动上传，生成私有 Bucket 的 HTTPS 签名地址后提交。请在插件设置中配置 OSS 的地域、Endpoint、Bucket、AccessKey、上传目录和链接有效期；模型 API Key 仍在本供应商配置中填写。图片与音频继续使用 Base64。项目单个本地视频上限为 100 MB，生成请求体不超过 64 MB。上传产生 OSS 存储与流量消耗，停止本地等待不会取消官方生成任务，也不会删除云端文件。上传对象键会保留在任务记录中，输入签名地址不长期保存。

含真人人脸的图/视频不能任意直接上传，需要符合官方肖像素材流程。通过「官方肖像素材库」工具查询并选择已就绪的素材后，视频节点使用官方素材 ID 生成，提交前重新核对审核状态。编辑不保证背景逐像素不变，商品标识与人物一致性需验收。

[2.5 教程](https://docs.volcengine.com/docs/ark/seedance-2-5?lang=zh) · [2.0 系列教程](https://console.volcengine.com/ark/region:cn-beijing/docs/seedance-2-0) · [提示词指南](https://docs.volcengine.com/docs/ark/seedance-2-5-prompt-guide?lang=zh) · [肖像素材说明](https://docs.volcengine.com/docs/ark/guide-preview?lang=zh)`,
  rules,
  models: [
    {
      id: "doubao-seedance-2-5-260628",
      label: "Seedance 2.5（官方 · 生成 / 编辑 / 延长）",
      type: "video",
      mode: ["text", "singleImage", "endFrameOptional", ["imageReference:30", "videoReference:10", "audioReference:10"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30], resolution: ["480p", "720p", "1080p"] }],
      rules: [
        {
          type: "select", field: "taskType", title: "参考任务类型", value: "auto",
          options: [
            { label: "自动识别（带视频时智能选择画幅与时长）", value: "auto" },
            { label: "参考生视频（使用通用比例与时长）", value: "reference" },
            { label: "视频编辑（使用原视频画幅与时长）", value: "edit" },
            { label: "视频延长（使用原视频画幅）", value: "extend" },
          ],
        },
        { type: "select", field: "outputFormat", title: "输出格式", value: "mov", options: [{ label: "MOV（官方推荐用于编辑和延长）", value: "mov" }, { label: "MP4", value: "mp4" }] },
      ],
    },
    {
      id: "doubao-seedance-2-0-260128",
      label: "Seedance 2.0（官方 · 最高 4K）",
      type: "video",
      mode: ["text", "singleImage", "endFrameOptional", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "720p", "1080p", "4k"] }],
    },
    {
      id: "doubao-seedance-2-0-fast-260128",
      label: "Seedance 2.0 Fast（官方）",
      type: "video",
      mode: ["text", "singleImage", "endFrameOptional", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "720p"] }],
    },
    {
      id: "doubao-seedance-2-0-mini-260615",
      label: "Seedance 2.0 Mini（官方）",
      type: "video",
      mode: ["text", "singleImage", "endFrameOptional", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "720p"] }],
    },
  ] satisfies ProviderModel[],
  async generateVideo(request: ReferencedVideoRequest): Promise<MediaAsset[]> {
    const apiKey = this.config.apiKey?.trim();
    if (!apiKey) throw new Error("请填写火山方舟 API Key");
    const isSeedance25 = request.model === "doubao-seedance-2-5-260628";
    const isSeedance20 = request.model === "doubao-seedance-2-0-260128";
    if (!isSeedance25 && !isSeedance20 && !["doubao-seedance-2-0-fast-260128", "doubao-seedance-2-0-mini-260615"].includes(request.model)) throw new Error("不支持的火山方舟视频模型");
    if (!request.prompt.trim()) throw new Error("请填写视频提示词");
    const other = request.other ?? {};
    if (Object.keys(other).some(key => !isSeedance25 || !["taskType", "outputFormat"].includes(key))) throw new Error("存在不支持的火山方舟视频参数；taskType 和 outputFormat 仅适用于 Seedance 2.5");
    const taskType = other.taskType ?? "auto";
    const outputFormat = other.outputFormat ?? (isSeedance25 ? "mov" : "mp4");
    if (typeof taskType !== "string" || !["auto", "reference", "edit", "extend"].includes(taskType)) throw new Error("请选择有效的参考任务类型");
    if (outputFormat !== "mov" && outputFormat !== "mp4") throw new Error("输出格式须为 MOV 或 MP4");
    const providerAssets = request.providerAssets ?? [];
    if (providerAssets.some(asset => !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,199}$/.test(asset.id) || !["image", "video", "audio"].includes(asset.mediaType))) throw new Error("官方素材 ID 或类型无效");
    const assets = (mediaType: "image" | "video" | "audio"): MediaInput[] => providerAssets.filter(asset => asset.mediaType === mediaType)
      .map(asset => ({ type: "url", url: `asset://${asset.id}` }));
    const images = [...(request.images ?? []), ...assets("image")];
    const videos = [...(request.videos ?? []), ...assets("video")];
    const audios = [...(request.audios ?? []), ...assets("audio")];
    const hasFrames = !!(request.firstFrame || request.lastFrame);
    const mode = request.mode ?? (hasFrames ? "endFrameOptional" : images.length || videos.length || audios.length ? [] : "text");
    const frameMode = typeof mode === "string" && ["endFrameOptional", "startFrameOptional", "startEndRequired"].includes(mode);
    if (frameMode) {
      if (!request.firstFrame || mode === "startEndRequired" && !request.lastFrame) throw new Error("请提供所选模式要求的首尾帧");
      if (images.length || videos.length || audios.length || taskType !== "auto") throw new Error("首尾帧不能与参考素材或参考任务类型混用");
    } else {
      if (hasFrames) throw new Error("请切换到首尾帧模式，或将图片作为混合参考提交");
      if (mode === "text" && (images.length || videos.length || audios.length || taskType !== "auto")) throw new Error("文生视频不能包含参考素材或参考任务类型");
      if (mode === "singleImage" && (images.length !== 1 || videos.length || audios.length)) throw new Error("单图参考模式需要且仅接受一张参考图");
      if (Array.isArray(mode) && !images.length && !videos.length && !audios.length) throw new Error("混合参考模式至少需要一个参考素材");
      if (typeof mode === "string" && mode !== "text" && mode !== "singleImage") throw new Error("不支持的视频生成模式");
    }
    const imageLimit = isSeedance25 ? 30 : 9;
    const mediaLimit = isSeedance25 ? 10 : 3;
    if (images.length > imageLimit || videos.length > mediaLimit || audios.length > mediaLimit) throw new Error(`参考素材最多为 ${imageLimit} 张图片、${mediaLimit} 段视频和 ${mediaLimit} 段音频`);
    if (!isSeedance25 && audios.length && !images.length && !videos.length) throw new Error("Seedance 2.0 系列的音频参考须搭配图片或视频");
    if ((taskType === "edit" || taskType === "extend") && !videos.length) throw new Error("视频编辑和延长至少需要一段参考视频");
    const adaptive = isSeedance25 && (frameMode || taskType === "edit" || taskType === "extend" || taskType === "auto" && videos.length > 0);
    const duration = isSeedance25 && (taskType === "edit" || taskType === "auto" && videos.length > 0) ? -1 : request.duration ?? -1;
    const ratio = adaptive ? "adaptive" : request.ratio ?? "adaptive";
    const maxDuration = isSeedance25 ? 30 : 15;
    if (!Number.isInteger(duration) || duration !== -1 && (duration < 4 || duration > maxDuration)) throw new Error(`当前 Seedance 模型时长须为 4～${maxDuration} 秒的整数`);
    if (!["adaptive", "16:9", "4:3", "1:1", "3:4", "9:16", "21:9"].includes(ratio)) throw new Error("Seedance 不支持所选比例");
    const resolution = request.resolution ?? "720p";
    const resolutions = isSeedance25 ? ["480p", "720p", "1080p"] : isSeedance20 ? ["480p", "720p", "1080p", "4k"] : ["480p", "720p"];
    if (!resolutions.includes(resolution)) throw new Error(`当前 Seedance 模型仅支持 ${resolutions.join("、")}`);
    const content: Record<string, unknown>[] = [{ type: "text", text: videoPrompt({ ...request, images, videos, audios }) }];
    for (const [input, role] of [[request.firstFrame, "first_frame"], [request.lastFrame, "last_frame"]] as const) {
      if (input) content.push({ type: "image_url", image_url: { url: mediaUrl(input, "image") }, role });
    }
    for (const input of images) content.push({ type: "image_url", image_url: { url: mediaUrl(input, "image") }, role: "reference_image" });
    for (const input of audios) content.push({ type: "audio_url", audio_url: { url: mediaUrl(input, "audio") }, role: "reference_audio" });
    const body = {
      model: request.model, content, ratio, duration, resolution,
      ...(isSeedance25 ? { output_format: outputFormat } : {}),
      generate_audio: request.generateAudio ?? true, watermark: request.watermark ?? true,
      ...(isSeedance25 && !frameMode && mode !== "text" ? { omni_reference_task_type: taskType } : {}),
    };
    // 内联素材已是 base64 data URL，字符串长度即字节数；上传前做廉价估算，超限时不启动 OSS 上传。
    const inlineLength = content.reduce((total, part) => {
      const media = (part.image_url ?? part.audio_url) as { url: string } | undefined;
      return total + (media?.url.length ?? 0);
    }, 0);
    if (inlineLength > 64 * 1024 * 1024) throw new Error("火山方舟请求体超过 64 MB，请减少参考图片或音频大小");
    // ACT: 上传阶段最多 60 分钟，只中止尚未提交的 OSS 上传；提交与轮询另起 30 分钟 deadline，超时后凭任务 ID 继续查询，不重新付费提交。
    const uploadSignal = AbortSignal.any([AbortSignal.timeout(60 * 60_000), ...(this.signal ? [this.signal] : [])]);
    const uploads: ProviderTaskData[] = [];
    for (const input of videos) content.push({ type: "video_url", video_url: { url: await uploadReferenceVideo(this, input, uploadSignal, uploads) }, role: "reference_video" });
    const payload = JSON.stringify(body);
    if (Buffer.byteLength(payload, "utf8") > 64 * 1024 * 1024) throw new Error("火山方舟请求体超过 64 MB，请减少参考素材大小");
    const signal = AbortSignal.any([AbortSignal.timeout(30 * 60_000), ...(this.signal ? [this.signal] : [])]);
    await this.saveTaskData?.({ kind: "submitting", ...(uploads.length ? { uploads } : {}) });
    const data = await requestJson(this, "/contents/generations/tasks", apiKey, signal, payload);
    if (typeof data.id !== "string" || !data.id.trim()) throw new Error("火山方舟未返回任务 ID，请先在平台确认提交结果");
    await this.saveTaskData?.({ kind: "video", taskId: data.id, ...(uploads.length ? { uploads } : {}) });
    return waitForVideo(this, apiKey, data.id, signal);
  },
  async resumeTask(data: ProviderTaskData): Promise<MediaAsset[]> {
    if (data.kind === "uploading") throw new Error("上次 OSS 上传阶段中断，尚未提交视频生成；请按任务中的对象键核对上传结果，再明确发起新任务");
    if (data.kind === "submitting") throw new Error("上次火山方舟提交结果未知，不能自动重新提交，请先在平台确认任务");
    if (data.kind !== "video" || typeof data.taskId !== "string" || !data.taskId.trim()) throw new Error("火山方舟任务恢复数据无效");
    const apiKey = this.config.apiKey?.trim();
    if (!apiKey) throw new Error("请填写火山方舟 API Key");
    const signal = AbortSignal.any([AbortSignal.timeout(30 * 60_000), ...(this.signal ? [this.signal] : [])]);
    return waitForVideo(this, apiKey, data.taskId, signal);
  },
} satisfies ProviderDefinition<typeof rules>;
