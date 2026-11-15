/**
 * 火山引擎方舟（Ark）视频模型适配器
 * 文档：https://www.volcengine.com/docs/82379/1520757（创建视频生成任务）
 * 异步任务：POST /api/v3/contents/generations/tasks 创建，GET 同路径 /{id} 轮询，
 * 终态 queued/running → succeeded/failed/cancelled/expired。
 */

const API_BASE = "https://ark.cn-beijing.volces.com/api/v3";
/** 视频任务轮询间隔（毫秒），官方示例为 10 秒。 */
const POLL_INTERVAL = 5000;
/** 视频任务总等待上限（毫秒）。 */
const TOTAL_TIMEOUT = 1800000;
/** 单次请求（提交与查询）超时（毫秒）。 */
const REQUEST_TIMEOUT = 60000;

const rules = [
  {
    type: "input",
    field: "apiKey" as const,
    title: "API Key",
    value: "",
    props: { type: "password", showPassword: true, autocomplete: "off", placeholder: "在火山方舟控制台的 API Key 管理页获取" },
  },
] as const;

const version = "1.0.0";

type ReferencedVideoRequest = VideoRequest & {
  referenceOrder?: ({ type: "image" | "video" | "audio"; index: number } | { type: "firstFrame" | "lastFrame" | "text" })[];
};

/** Seedance 2.5 的提示词引用素材使用 @ 前缀，2.0 系列使用中文序号；素材上限与仅音频能力也按此版本区分。 */
function isSeedance25(model: string) {
  const lower = model.toLowerCase();
  return lower.includes("seedance-2.5") || lower.includes("seedance-2-5");
}

function videoPrompt(request: ReferencedVideoRequest, mode: VideoMode) {
  const labels = isSeedance25(request.model)
    ? { image: "@图片", video: "@视频", audio: "@音频" }
    : { image: "图片", video: "视频", audio: "音频" };
  const isFrames = mode === "startEndRequired" || mode === "endFrameOptional" || mode === "startFrameOptional";
  return request.prompt.replace(/\{\{ref (\d+)\}\}/g, (marker, number: string) => {
    const reference = request.referenceOrder?.[Number(number) - 1];
    if (!reference) throw new Error(`引用标记 ${marker} 缺少素材映射，请更新视频节点或提供 referenceOrder`);
    if (reference.type === "text") return `参考 ${Number(number)}`;
    if (reference.type === "firstFrame" || reference.type === "lastFrame") {
      if (!isFrames || !request[reference.type]) throw new Error(`引用标记 ${marker} 对应的首尾帧未提交`);
      return reference.type === "firstFrame" ? "首帧" : "尾帧";
    }
    if (!("index" in reference)) throw new Error(`引用标记 ${marker} 的素材类型无效`);
    const media = { image: request.images, video: request.videos, audio: request.audios };
    if (!Number.isSafeInteger(reference.index) || reference.index < 0 || !media[reference.type]?.[reference.index]) {
      throw new Error(`引用标记 ${marker} 对应的素材未提交，请重新选择引用`);
    }
    return `${labels[reference.type]}${reference.index + 1}`;
  });
}

/** 已是 URL 的输入直接透传；字节与 base64 输入转成 data URL（文档要求格式小写）。 */
function mediaUrl(input: MediaInput) {
  if (input.type === "url") return input.url;
  const data = input.type === "binary" ? Buffer.from(input.data).toString("base64") : input.data;
  return data.startsWith("data:") ? data : `data:${input.mimeType};base64,${data}`;
}

function wait(signal: AbortSignal, ms: number) {
  signal.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}

function taskSignal(context: ProviderContext): AbortSignal {
  return AbortSignal.any([AbortSignal.timeout(REQUEST_TIMEOUT), ...(context.signal ? [context.signal] : [])]);
}

async function createTask(context: ProviderContext, apiKey: string, body: Record<string, unknown>): Promise<string> {
  const response = await context.tool.fetch(`${API_BASE}/contents/generations/tasks`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: taskSignal(context),
  });
  const data = await response.json().catch(() => undefined);
  if (!response.ok) {
    // 优先取响应体 error.message，其次交给宿主工具提取可读原因。
    const message = data && typeof data === "object" && "error" in data
      && data.error && typeof data.error === "object" && "message" in data.error
      && typeof data.error.message === "string" ? data.error.message : context.tool.errorMessage(data);
    throw new Error(`提交任务失败：HTTP ${response.status} ${message}`);
  }
  if (!data || typeof data !== "object" || !("id" in data) || typeof data.id !== "string" || !data.id) {
    throw new Error("提交任务失败：接口未返回任务 ID");
  }
  return data.id;
}

async function pollTask(context: ProviderContext, apiKey: string, taskId: string, signal: AbortSignal): Promise<string> {
  const deadline = Date.now() + TOTAL_TIMEOUT;
  while (true) {
    const response = await context.tool.fetch(`${API_BASE}/contents/generations/tasks/${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal,
    });
    if (!response.ok) throw new Error(`查询任务失败：HTTP ${response.status}`);
    const data = await response.json() as { status?: string; error?: { message?: string }; content?: { video_url?: string } };
    if (data.status === "succeeded") {
      const url = data.content?.video_url;
      if (!url) throw new Error("视频生成成功但未返回视频地址");
      return url;
    }
    if (data.status === "failed" || data.status === "expired") {
      throw Object.assign(new Error(data.error?.message || "视频生成失败"), { code: "MEDIA_TASK_FAILED" });
    }
    if (data.status === "cancelled") {
      throw Object.assign(new Error("任务已被取消"), { code: "MEDIA_TASK_FAILED" });
    }
    // queued/running 及未知状态都继续等待；真正失败由 failed/expired 分支处理。
    if (Date.now() >= deadline) throw new Error("等待生成结果超时，可以稍后重新发起");
    await wait(signal, POLL_INTERVAL);
  }
}

export default {
  id: "volcengine",
  icon: "data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjFlbSIgc3R5bGU9ImZsZXg6bm9uZTtsaW5lLWhlaWdodDoxIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIxZW0iIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRpdGxlPlZvbGNlbmdpbmU8L3RpdGxlPjxwYXRoIGQ9Ik0xOS40NCAxMC4xNTNsLTIuOTM2IDExLjU4NmEuMjE1LjIxNSAwIDAwLjIxNC4yNjFoNS44N2EuMjE1LjIxNSAwIDAwLjIxNC0uMjYxbC0yLjk1LTExLjU4NmEuMjE0LjIxNCAwIDAwLS40MTIgMHpNMy4yOCAxMi43NzhsLTIuMjc1IDguOTZBLjIxNC4yMTQgMCAwMDEuMjIgMjJoNC41MzJhLjIxMi4yMTIgMCAwMC4yMTQtLjE2NS4yMTQuMjE0IDAgMDAwLS4wOTdsLTIuMjc2LTguOTZhLjIxNC4yMTQgMCAwMC0uNDEgMHoiIGZpbGw9IiMwMEU1RTUiPjwvcGF0aD48cGF0aCBkPSJNNy4yOSA1LjM1OUwzLjE0OCAyMS43MzhhLjIxNS4yMTUgMCAwMC4yMDMuMjYxaDguMjlhLjIxNC4yMTQgMCAwMC4yMTUtLjI2MUw3LjcgNS4zNThhLjIxNC4yMTQgMCAwMC0uNDEgMHoiIGZpbGw9IiMwMDZFRkYiPjwvcGF0aD48cGF0aCBkPSJNMTQuNDQuMTVhLjIxNC4yMTQgMCAwMC0uNDEgMEw4LjM2NiAyMS43MzlhLjIxNC4yMTQgMCAwMC4yMTQuMjYxSDE5LjlhLjIxNi4yMTYgMCAwMC4xNzEtLjA3OC4yMTQuMjE0IDAgMDAuMDQ0LS4xODNMMTQuNDM5LjE1eiIgZmlsbD0iIzAwNkVGRiI+PC9wYXRoPjxwYXRoIGQ9Ik0xMC4yNzggNy43NDFMNi42ODUgMjEuNzM2YS4yMTQuMjE0IDAgMDAuMjE0LjI2NGg3LjE3YS4yMTUuMjE1IDAgMDAuMjE0LS4yNjRMMTAuNjg4IDcuNzQxYS4yMTQuMjE0IDAgMDAtLjQxIDB6IiBmaWxsPSIjMDBFNUU1Ij48L3BhdGg+PC9zdmc+",
  label: "火山引擎方舟（Seedance）",
  version,
  apiUrl: API_BASE,
  readme: `火山引擎方舟平台提供豆包 Seedance 系列视频生成模型：Seedance 2.5 单次最长 30 秒，支持全模态参考（图片/视频/音频）与首尾帧；Seedance 2.0 系列单次最长 15 秒，支持参考图/视频/音频与首尾帧。
 \n 👉 点击 [前往平台](https://console.volcengine.com/ark) 开通模型并获取 API Key`,
  rules,
  models: [
    {
      id: "doubao-seedance-2-5-260628",
      label: "Doubao Seedance 2.5（文/图生视频 / 全模态参考）",
      type: "video",
      mode: ["text", "singleImage", "startEndRequired", ["imageReference:30", "videoReference:10", "audioReference:10"]],
      audio: "optional",
      imageRatios: ["adaptive", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30], resolution: ["480p", "720p", "1080p"] }],
    },
    {
      id: "doubao-seedance-2-0-260128",
      label: "Doubao Seedance 2.0（文/图生视频 / 参考素材）",
      type: "video",
      mode: ["text", "singleImage", "startEndRequired", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      imageRatios: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "adaptive"],
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "720p", "1080p"] }],
    },
  ] satisfies ProviderModel[],
  async generateVideo(request: ReferencedVideoRequest): Promise<MediaAsset[]> {
    this.signal?.throwIfAborted();
    const apiKey = this.config.apiKey?.trim();
    if (!apiKey) throw new Error("请填写 API Key");
    if (!request.prompt.trim()) throw new Error("请先填写视频提示词");

    const images = request.images ?? [];
    const videos = request.videos ?? [];
    const audios = request.audios ?? [];
    // Seedance 参考生视频的素材数量上限按模型版本区分。
    const limits = isSeedance25(request.model) ? { image: 30, video: 10, audio: 10 } : { image: 9, video: 3, audio: 3 };
    if (images.length > limits.image) throw new Error(`参考图最多支持 ${limits.image} 张`);
    if (videos.length > limits.video) throw new Error(`参考视频最多支持 ${limits.video} 个`);
    if (audios.length > limits.audio) throw new Error(`参考音频最多支持 ${limits.audio} 段`);

    const mode = request.mode ?? (request.firstFrame || request.lastFrame
      ? "startFrameOptional"
      : videos.length || audios.length ? [] : images.length ? "singleImage" : "text");
    const isFrames = mode === "startEndRequired" || mode === "endFrameOptional" || mode === "startFrameOptional";
    const isReference = Array.isArray(mode);

    // 图生视频-首帧、首尾帧、全模态参考是三种互斥场景，不可混用。
    const content: Record<string, unknown>[] = [{ type: "text", text: videoPrompt(request, mode) }];
    if (isReference) {
      if (request.firstFrame || request.lastFrame) throw new Error("参考素材模式不能同时传入首尾帧，请在引用中选择参考模式");
      if (audios.length > 0 && images.length === 0 && videos.length === 0 && !isSeedance25(request.model)) {
        throw new Error("Seedance 2.0 系列不支持仅传入参考音频，请同时提供参考图或参考视频");
      }
      for (const image of images) content.push({ type: "image_url", image_url: { url: mediaUrl(image) }, role: "reference_image" });
      for (const video of videos) content.push({ type: "video_url", video_url: { url: mediaUrl(video) }, role: "reference_video" });
      for (const audio of audios) content.push({ type: "audio_url", audio_url: { url: mediaUrl(audio) }, role: "reference_audio" });
      if (content.length === 1) throw new Error("参考素材模式需要至少传入一个参考素材");
    } else if (isFrames) {
      if (request.firstFrame) content.push({ type: "image_url", image_url: { url: mediaUrl(request.firstFrame) }, role: "first_frame" });
      if (request.lastFrame) content.push({ type: "image_url", image_url: { url: mediaUrl(request.lastFrame) }, role: "last_frame" });
      if (mode === "startEndRequired" && (!request.firstFrame || !request.lastFrame)) {
        throw new Error("这种模式需要同时提供首帧和尾帧两张图片");
      }
      if (mode === "startFrameOptional" && !request.firstFrame) throw new Error("这种模式需要一张首帧图片");
    } else if (mode === "singleImage") {
      const firstFrame = request.firstFrame ?? images[0];
      if (!firstFrame) throw new Error("这种模式需要一张首帧图片");
      content.push({ type: "image_url", image_url: { url: mediaUrl(firstFrame) }, role: "first_frame" });
    } else if (images.length || videos.length || audios.length || request.firstFrame || request.lastFrame) {
      throw new Error("当前是纯文字生成视频模式，不能同时传入图片、视频或音频");
    }

    // 首尾帧任务仅支持 adaptive 宽高比；未指定时交给平台默认值。
    const body: Record<string, unknown> = { model: request.model, content };
    if (request.resolution?.trim()) body.resolution = request.resolution.trim().toLowerCase();
    if (request.ratio?.trim()) body.ratio = request.ratio.trim();
    if (request.duration !== undefined) body.duration = Math.round(request.duration);
    if (request.generateAudio !== undefined) body.generate_audio = request.generateAudio;
    if (request.watermark !== undefined) body.watermark = request.watermark;

    const taskId = await createTask(this, apiKey, body);
    await this.saveTaskData?.({ kind: "volcengineVideo", taskId, model: request.model, deadline: Date.now() + TOTAL_TIMEOUT });
    const signal = AbortSignal.any([AbortSignal.timeout(TOTAL_TIMEOUT), ...(this.signal ? [this.signal] : [])]);
    const videoUrl = await pollTask(this, apiKey, taskId, signal);
    return [{ mediaType: "video", type: "url", url: videoUrl }];
  },
  async resumeTask(data: ProviderTaskData): Promise<MediaAsset[]> {
    if (data.kind !== "volcengineVideo" || typeof data.taskId !== "string" || !data.taskId
      || typeof data.model !== "string" || !data.model || typeof data.deadline !== "number" || !Number.isFinite(data.deadline)) {
      throw new Error("视频任务恢复数据无效");
    }
    const apiKey = this.config.apiKey?.trim();
    if (!apiKey) throw new Error("请填写 API Key");
    // ACT: 重启后仍查询原任务；每次恢复重新限定等待时长，不把本地超时当成远端失败。
    const signal = AbortSignal.any([AbortSignal.timeout(TOTAL_TIMEOUT), ...(this.signal ? [this.signal] : [])]);
    const videoUrl = await pollTask(this, apiKey, data.taskId, signal);
    return [{ mediaType: "video", type: "url", url: videoUrl }];
  },
} satisfies ProviderDefinition<typeof rules>;
