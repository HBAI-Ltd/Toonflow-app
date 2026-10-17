const rules = [
  {
    type: "input",
    field: "apiKey" as const,
    title: "API Key",
    value: "",
    props: { type: "password", showPassword: true, autocomplete: "off" },
  },
];

const siteUrl = "https://api.safillu.com";
const version = "3.0.0";

const videoResolutions = ["768p", "1080p", "2k"];
const videoRatios = ["adaptive", "16:9", "9:16", "1:1", "4:3", "3:4", "21:9"];
const imageRatios = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9"];
const referenceRules: Record<"image" | "video" | "audio", { label: string; mimeTypes: string[] }> = {
  image: { label: "图片", mimeTypes: ["image/png", "image/jpeg", "image/webp"] },
  video: { label: "视频", mimeTypes: ["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska"] },
  audio: { label: "音频", mimeTypes: ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/flac"] },
};
const audioMimeTypes: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  flac: "audio/flac",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  aac: "audio/aac",
};

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("影幻响应格式错误");
  return value as Record<string, unknown>;
}

function errorMessage(context: ProviderContext, value: unknown) {
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object") {
    const message = (value as Record<string, unknown>).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return context.tool.errorMessage?.(value) || "";
}

function statusOf(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isSuccessStatus(status: string) {
  return status === "success" || status === "succeeded" || status === "completed";
}

function isFailedStatus(status: string) {
  return ["failed", "failure", "error", "rejected"].includes(status);
}

function wait(signal: AbortSignal, ms = 5000) {
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

async function requestJson(context: ProviderContext, path: string, body?: unknown, signal = context.signal) {
  const apiKey =
    typeof context.config.apiKey === "string"
      ? context.config.apiKey
          .trim()
          .replace(/^Bearer\s+/i, "")
          .trim()
      : "";
  if (!apiKey) throw new Error("请填写影幻 API Key");
  signal?.throwIfAborted();
  const response = await context.tool.fetch(`${siteUrl}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    const error = new Error(`影幻请求失败（HTTP ${response.status}）`);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  const payload = await response.json().catch(() => {
    throw new Error("影幻响应格式错误");
  });
  return object(payload);
}

function isTransientError(error: unknown) {
  if (error instanceof TypeError) return true;
  const status = (error as { status?: unknown } | undefined)?.status;
  return typeof status === "number" && (status === 429 || status >= 500);
}

async function pollTask(context: ProviderContext, query: () => Promise<Record<string, unknown>>, signal: AbortSignal, failLabel: string) {
  let failures = 0;
  while (true) {
    try {
      const result = await query();
      failures = 0;
      const status = statusOf(result.status);
      if (isSuccessStatus(status)) return result;
      if (isFailedStatus(status)) {
        const data = result.data;
        const failReason = result.error ?? (data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>).failReason : undefined);
        throw new Error(errorMessage(context, failReason) || failLabel);
      }
    } catch (error) {
      // ACT: 状态查询幂等，429、5xx 与网络抖动按文档退避重试；业务失败直接抛出。
      if (!isTransientError(error) || ++failures >= 5) throw error;
      await wait(signal, 10000);
      continue;
    }
    await wait(signal);
  }
}

async function downloadProxy(context: ProviderContext, path: string, mediaType: MediaAsset["mediaType"], mimeType: string, signal: AbortSignal) {
  const apiKey =
    typeof context.config.apiKey === "string"
      ? context.config.apiKey
          .trim()
          .replace(/^Bearer\s+/i, "")
          .trim()
      : "";
  const response = await context.tool.fetch(`${siteUrl}${path}`, { headers: { Authorization: `Bearer ${apiKey}` }, signal });
  if (!response.ok) throw new Error(`下载生成结果失败（HTTP ${response.status}）`);
  return [{ mediaType, type: "binary" as const, data: new Uint8Array(await response.arrayBuffer()), mimeType }];
}

async function mediaDataUrl(context: ProviderContext, input: MediaInput) {
  if (input.type !== "url") {
    const data = input.type === "binary" ? Buffer.from(input.data).toString("base64") : input.data;
    return data.startsWith("data:") ? data : `data:${input.mimeType};base64,${data}`;
  }
  if (/^data:/i.test(input.url)) return input.url;
  if (!/^https?:\/\//i.test(input.url)) throw new Error("参考媒体需要 HTTP 或 HTTPS 地址");
  const response = await context.tool.fetch(input.url, { signal: context.signal });
  if (!response.ok) throw new Error(`读取参考媒体失败（HTTP ${response.status}）`);
  const mimeType = (input.mimeType || response.headers.get("content-type")?.split(";")[0] || "application/octet-stream").trim();
  return `data:${mimeType};base64,${Buffer.from(new Uint8Array(await response.arrayBuffer())).toString("base64")}`;
}

async function referenceEntry(context: ProviderContext, type: "image" | "video" | "audio", role: string, input: MediaInput) {
  const dataUrl = await mediaDataUrl(context, input);
  const delimiter = dataUrl.startsWith("data:") ? dataUrl.indexOf(";base64,") : -1;
  const mimeType = delimiter > 5 ? dataUrl.slice(5, delimiter).toLowerCase() : "";
  if (!referenceRules[type].mimeTypes.includes(mimeType)) throw new Error(`影幻参考${referenceRules[type].label}格式不支持（${mimeType || "未知"}）`);
  const bytes = Math.ceil((dataUrl.length - delimiter - 8) * 0.75);
  if (bytes > 30 * 1024 * 1024) throw new Error("影幻参考素材单个文件不能超过 30 MB");
  return { bytes, payload: { role, type: `${type}_url`, [`${type}_url`]: { url: dataUrl } } as Record<string, unknown> };
}

function mediaAsset(value: unknown, mediaType: MediaAsset["mediaType"], mimeType?: string, failLabel = "影幻未返回生成结果"): MediaAsset[] {
  if (typeof value !== "string" || !value.trim()) throw new Error(failLabel);
  const url = value.trim();
  if (/^https?:\/\//i.test(url)) return [{ mediaType, type: "url", url, ...(mimeType ? { mimeType } : {}) }];
  const data = /^data:([^;,]+);base64,([\s\S]+)$/.exec(url);
  if (!data || !data[1].startsWith(`${mediaType}/`)) throw new Error("影幻返回的媒体地址无效");
  return [{ mediaType, type: "base64", mimeType: data[1], data: data[2] }];
}

export default {
  id: "tfRouter" as const,
  label: "影幻",
  version,
  apiUrl: siteUrl,
  protocol: "openai-completions",
  readme: `## 影幻\n\n提供视频、图像、语音、BGM 生成服务。\n\n[前往平台](https://api.safillu.com)`,
  rules,
  models: [
    {
      id: "MiniMax-H3",
      label: "MiniMax-H3",
      type: "video",
      mode: ["text", "startEndRequired", ["imageReference:5", "audioReference:3", "videoReference:1"]],
      audio: true,
      durationResolutionMap: [
        { duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["768p", "1080p", "2k"] },
      ],
    },
    {
      id: "Z-Image-Base",
      label: "Z-Image-Base",
      type: "image",
      mode: ["text"],
      imageSizes: ["1K", "2K"],
      imageRatios,
    },
    {
      id: "Qwen3-TTS-VoiceDesign",
      label: "Qwen3 TTS 音色设计",
      type: "audio",
      voices: [
        { title: "温柔女声", voice: "温柔自然的成年女声，标准普通话，咬字清晰，语气亲切放松" },
        { title: "沉稳男声", voice: "沉稳有力的成年男声，标准普通话，语速平稳，吐字清晰" },
        { title: "活泼少女", voice: "活泼甜美的年轻女声，标准普通话，语气轻快自然" },
        { title: "纪录片旁白", voice: "低沉磁性的纪录片旁白男声，标准普通话，节奏舒缓，庄重自然" },
      ],
    },
    {
      id: "YuE2-BGM",
      label: "YuE2 BGM",
      type: "audio",
    },
  ] satisfies ProviderModel[],
  async generateVideo(request: VideoRequest): Promise<MediaAsset[]> {
    if (request.model !== "MiniMax-H3") throw new Error("影幻暂不支持该视频模型");
    const prompt = request.prompt.trim();
    if (!prompt) throw new Error("请输入视频生成提示词");
    if (prompt.length > 12000) throw new Error("影幻视频提示词最长 12000 个字符");
    const duration = request.duration ?? 5;
    if (!Number.isInteger(duration) || duration < 4 || duration > 15) throw new Error("影幻视频时长须为 4 至 15 秒的整数");
    const resolution = (request.resolution ?? "768p").toLowerCase();
    if (!videoResolutions.includes(resolution)) throw new Error("影幻视频分辨率仅支持 768p、1080p、2k");
    const mode = request.mode ?? (request.firstFrame || request.lastFrame ? "startEndRequired" : Array.isArray(request.images) || Array.isArray(request.videos) || Array.isArray(request.audios) ? [] : "text");
    const isFrames = mode === "startEndRequired" || mode === "endFrameOptional" || mode === "startFrameOptional";
    const references: Record<string, unknown>[] = [];
    let totalBytes = 0;
    const push = async (type: "image" | "video" | "audio", role: string, input: MediaInput) => {
      const entry = await referenceEntry(this, type, role, input);
      totalBytes += entry.bytes;
      if (totalBytes > 64 * 1024 * 1024) throw new Error("影幻参考素材合计不能超过 64 MB");
      references.push(entry.payload);
    };
    if (Array.isArray(mode)) {
      // ACT: 平台按数组顺序映射各类参考；图片最多 5、音频最多 3、视频最多 1。
      if ((request.images?.length ?? 0) > 5 || (request.videos?.length ?? 0) > 1 || (request.audios?.length ?? 0) > 3) throw new Error("影幻参考素材上限为 5 图、3 音频、1 视频");
      for (const input of request.images ?? []) await push("image", "reference_image", input);
      for (const input of request.audios ?? []) await push("audio", "reference_audio", input);
      for (const input of request.videos ?? []) await push("video", "reference_video", input);
    } else if (isFrames || request.firstFrame || request.lastFrame) {
      if (!request.firstFrame || !request.lastFrame) throw new Error("影幻首尾帧模式需要同时提供首帧和尾帧");
      await push("image", "first_frame", request.firstFrame);
      await push("image", "last_frame", request.lastFrame);
    } else if (request.images?.length) {
      for (const input of request.images) await push("image", "reference_image", input);
    }
    const ratio = request.ratio ?? (isFrames ? "adaptive" : "16:9");
    if (!videoRatios.includes(ratio)) throw new Error("影幻视频比例不合法");
    if (isFrames && resolution === "1080p") throw new Error("影幻首尾帧模式不支持 1080p，请选择 768p 或 2k");
    if (!isFrames && ratio === "adaptive") throw new Error("影幻参考模式不支持 adaptive 比例");
    const signal = AbortSignal.any([AbortSignal.timeout(30 * 60_000), ...(this.signal ? [this.signal] : [])]);
    const task = await requestJson(this, "/tfrouter-frames/v1/video/generateVideo", {
      model: request.model,
      prompt,
      duration,
      resolution,
      metadata: {
        resolution,
        ratio,
        generate_audio: true,
        ...(references.length ? { references } : {}),
      },
    }, signal);
    if (typeof task.data !== "string" || !task.data.trim()) throw new Error("影幻未返回任务 ID");
    const taskId = task.data.trim();
    const result = await pollTask(this, () => requestJson(this, "/tfrouter-frames/v1/video/getVideoStatus", { taskICode: taskId }, signal), signal, "影幻视频生成失败");
    const url = object(result.data).data;
    const asset = mediaAsset(url, "video", "video/mp4");
    // ACT: 平台成品链接可能指向内部 localhost，需要改走带鉴权的成品代理下载。
    if (asset[0]?.type === "url" && /^https?:\/\/(localhost|127\.0\.0\.1)([:/]|$)/i.test(asset[0].url)) {
      return downloadProxy(this, `/v1/tasks/${encodeURIComponent(taskId)}/artifacts/video/content`, "video", "video/mp4", signal);
    }
    return asset;
  },
  async generateImage(request: ImageRequest): Promise<MediaAsset[]> {
    if (request.model !== "Z-Image-Base") throw new Error("影幻暂不支持该图片模型");
    if (request.images?.length || request.mask) throw new Error("Z-Image-Base 暂不支持参考图");
    const prompt = request.prompt.trim();
    if (!prompt) throw new Error("请输入图片生成提示词");
    if (prompt.length > 12000) throw new Error("影幻图片提示词最长 12000 个字符");
    const count = request.n ?? 1;
    if (!Number.isInteger(count) || count < 1 || count > 4) throw new Error("影幻图片生成数量须为 1 至 4 张");
    const ratio = request.ratio ?? "1:1";
    if (!imageRatios.includes(ratio)) throw new Error("影幻图片比例不合法");
    const resolution = (request.size ?? "1K").toUpperCase();
    if (resolution !== "1K" && resolution !== "2K") throw new Error("影幻图片分辨率仅支持 1K、2K");
    const signal = AbortSignal.any([AbortSignal.timeout(30 * 60_000), ...(this.signal ? [this.signal] : [])]);
    const task = await requestJson(this, "/runninghub-image/v1/generations", { model: request.model, prompt, ratio, resolution, n: count }, signal);
    if (typeof task.task_id !== "string" || !task.task_id.trim()) throw new Error("影幻未返回任务 ID");
    const taskId = task.task_id.trim();
    const result = await pollTask(this, () => requestJson(this, `/runninghub-image/v1/tasks/${encodeURIComponent(taskId)}`, undefined, signal), signal, "影幻图片生成失败");
    const items = result.data;
    if (!Array.isArray(items) || !items.length) throw new Error("影幻未返回生成结果");
    return items.map(item => {
      const entry = object(item);
      const format = typeof entry.format === "string" ? entry.format.trim().toLowerCase() : "";
      return mediaAsset(entry.url, "image", format ? `image/${format === "jpg" ? "jpeg" : format}` : undefined)[0]!;
    });
  },
  async generateAudio(request: AudioRequest): Promise<MediaAsset[]> {
    const signal = AbortSignal.any([AbortSignal.timeout(30 * 60_000), ...(this.signal ? [this.signal] : [])]);
    let task: Record<string, unknown>;
    if (request.model === "Qwen3-TTS-VoiceDesign") {
      const text = (request.text ?? request.prompt ?? "").trim();
      if (!text) throw new Error("请输入待朗读文本");
      if (text.length > 4000) throw new Error("影幻语音文本最长 4000 个字符");
      const voicePrompt = (request.voice ?? "").trim() || "自然清晰的标准普通话女声，语气亲切放松";
      if (voicePrompt.length > 4000) throw new Error("影幻音色描述最长 4000 个字符");
      const speed = request.speed ?? 0.9;
      if (!Number.isFinite(speed) || speed < 0.5 || speed > 2) throw new Error("影幻语速须在 0.5 到 2 倍之间");
      task = await requestJson(this, "/runninghub-audio/v1/voice-design", { model: request.model, text, voice_prompt: voicePrompt, speed }, signal);
    } else if (request.model === "YuE2-BGM") {
      const prompt = (request.text ?? request.prompt ?? "").trim();
      if (!prompt) throw new Error("请输入音乐风格描述");
      if (prompt.length > 4000) throw new Error("影幻音乐描述最长 4000 个字符");
      // ACT: 平台 duration 为 1～120 秒，现有音频节点没有时长参数，使用服务端默认 10 秒。
      task = await requestJson(this, "/runninghub-audio/v1/bgm", { model: request.model, prompt }, signal);
    } else {
      throw new Error("影幻暂不支持该音频模型");
    }
    if (typeof task.task_id !== "string" || !task.task_id.trim()) throw new Error("影幻未返回任务 ID");
    const taskId = task.task_id.trim();
    const result = await pollTask(this, () => requestJson(this, `/runninghub-audio/v1/tasks/${encodeURIComponent(taskId)}`, undefined, signal), signal, "影幻音频生成失败");
    const format = typeof result.format === "string" ? result.format.trim().toLowerCase() : "";
    return mediaAsset(result.audio_url, "audio", audioMimeTypes[format]);
  },
} satisfies ProviderDefinition<typeof rules>;
