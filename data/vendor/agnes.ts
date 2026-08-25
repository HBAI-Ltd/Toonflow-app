/**
 * ToonFlow Agnes AI 供应商适配器
 * @version 2.5
 * @see https://www.agnes-ai.com/zh-Hans/docs/overview
 */

// ============================================================
// 类型定义
// ============================================================

type VideoMode =
  | "singleImage"
  | "startEndRequired"
  | "endFrameOptional"
  | "startFrameOptional"
  | "text"
  | (`videoReference:${number}` | `imageReference:${number}` | `audioReference:${number}`)[];

interface TextModel {
  name: string;
  modelName: string;
  type: "text";
  think: boolean;
}

interface ImageModel {
  name: string;
  modelName: string;
  type: "image";
  mode: ("text" | "singleImage" | "multiReference")[];
  associationSkills?: string;
  maxReferenceImages?: number;
}

interface VideoModel {
  name: string;
  modelName: string;
  type: "video";
  mode: VideoMode[];
  associationSkills?: string;
  audio: "optional" | false | true;
  durationResolutionMap: { duration: number[]; resolution: string[] }[];
}

interface TTSModel {
  name: string;
  modelName: string;
  type: "tts";
  voices: { title: string; voice: string }[];
}

interface VendorConfig {
  id: string;
  version: string;
  name: string;
  author: string;
  description?: string;
  icon?: string;
  inputs: { key: string; label: string; type: "text" | "password" | "url"; required: boolean; placeholder?: string }[];
  inputValues: Record<string, string>;
  models: (TextModel | ImageModel | VideoModel | TTSModel)[];
}

type ReferenceList =
  | { type: "image"; sourceType: "base64"; base64: string }
  | { type: "audio"; sourceType: "base64"; base64: string }
  | { type: "video"; sourceType: "base64"; base64: string };

interface ImageConfig {
  prompt: string;
  referenceList?: Extract<ReferenceList, { type: "image" }>[];
  size: "1K" | "2K" | "4K";
  aspectRatio: `${number}:${number}`;
}

interface VideoConfig {
  duration: number;
  resolution: string;
  aspectRatio: "16:9" | "9:16";
  prompt: string;
  referenceList?: ReferenceList[];
  audio?: boolean;
  mode: VideoMode[] | VideoMode;
  resumeTask?: {
    videoId?: string;
    taskId?: string;
    retry?: number;
  };
  onTaskCheckpoint?: (checkpoint: VideoTaskCheckpoint) => Promise<void> | void;
}

interface VideoTaskCheckpoint {
  vendorId: "agnes";
  modelName: string;
  videoId?: string;
  taskId?: string;
  stage: "poll" | "download" | "completed" | "failed";
  retry: number;
}

interface TTSConfig {
  text: string;
  voice: string;
  speechRate: number;
  pitchRate: number;
  volume: number;
  referenceList?: Extract<ReferenceList, { type: "audio" }>[];
}

interface PollResult {
  completed: boolean;
  data?: string;
  error?: string;
}

// ============================================================
// 全局声明
// ============================================================

declare const axios: any;
declare const fetch: any;
declare const logger: (msg: string) => void;
declare const jsonwebtoken: any;
declare const zipImage: (base64: string, size: number) => Promise<string>;
declare const zipImageResolution: (base64: string, w: number, h: number) => Promise<string>;
declare const mergeImages: (base64Arr: string[], maxSize?: string) => Promise<string>;
declare const urlToBase64: (url: string, config?: any) => Promise<string>;
declare const sleep: (milliseconds: number) => Promise<void>;
declare const pollTask: (fn: () => Promise<PollResult>, interval?: number, timeout?: number) => Promise<PollResult>;
declare const createOpenAI: any;
declare const createDeepSeek: any;
declare const createZhipu: any;
declare const createQwen: any;
declare const createAnthropic: any;
declare const createOpenAICompatible: any;
declare const createXai: any;
declare const createMinimax: any;
declare const createGoogleGenerativeAI: any;
declare const exports: {
  vendor: VendorConfig;
  textRequest: (m: TextModel, t: boolean, tl: 0 | 1 | 2 | 3) => any;
  imageRequest: (c: ImageConfig, m: ImageModel) => Promise<string>;
  videoRequest: (c: VideoConfig, m: VideoModel) => Promise<string>;
  ttsRequest: (c: TTSConfig, m: TTSModel) => Promise<string>;
  checkForUpdates?: () => Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }>;
  updateVendor?: () => Promise<string>;
};

// ============================================================
// 供应商配置
// ============================================================

const vendor: VendorConfig = {
  id: "agnes",
  version: "2.5",
  author: "Agnes AI",
  name: "Agnes AI",
  description:
    "Agnes AI 官方全模态 API 适配。支持 Agnes 2.0/2.5 Flash、Agnes 2.5 Pro/Pro Alpha 文本与视觉语言模型，Image 2.0/2.1 Flash 图像生成与编辑，以及 Video V2.0 视频生成。",
  inputs: [
    { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "Agnes AI API Key" },
    {
      key: "baseUrl",
      label: "API 地址",
      type: "url",
      required: true,
      placeholder: "https://apihub.agnes-ai.com",
    },
  ],
  inputValues: {
    apiKey: "",
    baseUrl: "https://apihub.agnes-ai.com",
  },
  models: [
    {
      name: "Agnes 2.5 Flash",
      modelName: "agnes-2.5-flash",
      type: "text",
      think: true,
    },
    {
      name: "Agnes 2.0 Flash",
      modelName: "agnes-2.0-flash",
      type: "text",
      think: true,
    },
    {
      name: "Agnes 2.5 Pro（付费）",
      modelName: "agnes-2.5-pro",
      type: "text",
      think: true,
    },
    {
      name: "Agnes 2.5 Pro Alpha（付费）",
      modelName: "agnes-2.5-pro-alpha",
      type: "text",
      think: true,
    },
    {
      name: "Agnes Image 2.1 Flash",
      modelName: "agnes-image-2.1-flash",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
      maxReferenceImages: 6,
      associationSkills: "高信息密度图像、复杂构图、文生图、图像编辑和多图合成；支持 1K/2K/4K 与多种宽高比。",
    },
    {
      name: "Agnes Image 2.0 Flash",
      modelName: "agnes-image-2.0-flash",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
      maxReferenceImages: 6,
      associationSkills: "快速文生图、图像编辑和多图合成。",
    },
    {
      name: "Agnes Video V2.0",
      modelName: "agnes-video-v2.0",
      type: "video",
      mode: ["text", "singleImage", "startEndRequired"],
      associationSkills: "异步文生视频、单图生视频与双关键帧动画。",
      audio: false,
      durationResolutionMap: [
        {
          duration: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
          resolution: ["480p", "720p", "1080p"],
        },
      ],
    },
  ],
};

// ============================================================
// 辅助工具
// ============================================================

const getBaseUrl = (): string => {
  const configured = (vendor.inputValues.baseUrl || "https://apihub.agnes-ai.com")
    .trim()
    .replace(/^http:\/\/apihub\.agnes-ai\.com(?::443)?/i, "https://apihub.agnes-ai.com")
    .replace(/\/+$/, "");
  return configured.replace(/\/v1$/i, "");
};

const getOpenAIBaseUrl = (): string => `${getBaseUrl()}/v1`;

const getHeaders = () => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少 Agnes AI API Key");
  return {
    Authorization: `Bearer ${vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "")}`,
    "Content-Type": "application/json",
  };
};

const getErrorMessage = (error: any, fallback: string): string => {
  const data = error?.response?.data;
  const message =
    data?.error?.message ||
    data?.error ||
    data?.detail ||
    data?.message ||
    data?.msg ||
    (typeof data === "string" ? data : undefined) ||
    (data && typeof data === "object" ? JSON.stringify(data) : undefined) ||
    error?.message;
  const status = error?.response?.status;
  const statusText = status ? `（HTTP ${status}）` : "";
  return message
    ? `${fallback}${statusText}：${typeof message === "string" ? message : JSON.stringify(message)}`
    : `${fallback}${statusText}`;
};

type VideoStage = "submit" | "poll" | "download";

const formatUnknownError = (value: any, fallback = "unknown error"): string => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const safeDetails = ["stage", "code", "status", "name"]
      .flatMap((key) => {
        const field = value[key];
        return typeof field === "string" || typeof field === "number" ? [`${key}=${field}`] : [];
      })
      .join(" ");
    return safeDetails || fallback;
  }
  return value == null ? fallback : String(value);
};

const getProviderErrorDetails = (error: any) => {
  const data = error?.response?.data;
  const rawMessage =
    data?.error?.message ||
    data?.detail ||
    data?.message ||
    data?.msg ||
    (typeof data === "string" ? data : undefined) ||
    error?.message ||
    formatUnknownError(error);
  return {
    httpStatus: Number(error?.response?.status || 0) || undefined,
    providerCode: data?.error?.code || data?.code || error?.code,
    message: formatUnknownError(rawMessage),
  };
};

const formatVideoError = (
  stage: VideoStage,
  error: any,
  ids: { videoId?: string; taskId?: string },
  retry: number,
): string => {
  const details = getProviderErrorDetails(error);
  return [
    "[Agnes Video]",
    `stage=${stage}`,
    `httpStatus=${details.httpStatus ?? "none"}`,
    `providerCode=${details.providerCode ?? "none"}`,
    `video_id=${ids.videoId ?? "none"}`,
    `task_id=${ids.taskId ?? "none"}`,
    `retry=${retry}`,
    `message=${details.message}`,
  ].join(" ");
};

const isRetryableVideoTransportError = (error: any): boolean => {
  const details = getProviderErrorDetails(error);
  const httpStatus = details.httpStatus || 0;
  if (httpStatus === 408 || httpStatus === 429 || (httpStatus >= 500 && httpStatus <= 599)) return true;
  return /ECONNRESET|ECONNREFUSED|ETIMEDOUT|ECONNABORTED|EAI_AGAIN|ENOTFOUND|EHOSTUNREACH|socket hang up|timeout/i.test(
    `${details.providerCode || ""} ${details.message}`,
  );
};

const getVideoRetryBackoffMs = (retry: number): number => {
  const exponential = Math.min(60000, 1000 * 2 ** Math.max(0, retry - 1));
  const jitter = Math.floor(Math.random() * Math.max(250, exponential * 0.25));
  return exponential + jitter;
};

const isExplicitQueueFullError = (error: any): boolean => {
  const details = getProviderErrorDetails(error);
  return (
    /video_queue_full|queue[_ -]?full/i.test(String(details.providerCode || "")) ||
    /video queue is full|queue capacity|队列.*满/i.test(details.message)
  );
};

const getSubmitQueueBackoffMs = (retry: number): number => {
  const exponential = Math.min(60000, 10000 * 2 ** Math.max(0, retry - 1));
  const jitter = Math.floor(Math.random() * Math.max(1000, exponential * 0.2));
  return exponential + jitter;
};

let imageRequestQueue: Promise<void> = Promise.resolve();

const runImageRequestSerially = async <T>(task: () => Promise<T>): Promise<T> => {
  const previous = imageRequestQueue;
  let release = () => {};
  imageRequestQueue = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;
  try {
    return await task();
  } finally {
    release();
  }
};

const waitWithPollTask = async (waitMs: number): Promise<void> => {
  const startedAt = Date.now();
  const result = await pollTask(
    async (): Promise<PollResult> => ({ completed: Date.now() - startedAt >= waitMs }),
    Math.min(500, Math.max(100, waitMs)),
    waitMs + 5000,
  );

  if (result.error) throw new Error(`等待重试失败：${result.error}`);
};

const postImageWithRetry = async (url: string, body: any, headers: any): Promise<any> => {
  let lastError: any;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await axios.post(url, body, { headers, timeout: 360000, proxy: false });
    } catch (error: any) {
      lastError = error;
      const status = Number(error?.response?.status || 0);
      const responseValue =
        error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.response?.data?.detail ||
          error?.response?.data ||
          error?.message ||
          "";
      const responseText =
        typeof responseValue === "string" ? responseValue : JSON.stringify(responseValue);
      const isNetworkError = /ECONNRESET|ETIMEDOUT|ECONNABORTED|EAI_AGAIN|ENOTFOUND|socket hang up|timeout/i.test(
        responseText,
      );
      const isRetryableStatus = [408, 409, 429, 500, 502, 503, 504, 520, 522, 524].includes(status);
      const isBusy400 = status === 400 && /busy|queue|concurr|rate|limit|frequent|频繁|并发|稍后/i.test(responseText);

      if (attempt >= 3 || (!isNetworkError && !isRetryableStatus && !isBusy400)) throw error;

      const waitMs = attempt * 3000;
      logger(`[Agnes 图片] 请求暂时失败，将在 ${waitMs / 1000} 秒后重试（${attempt}/3）`);
      await waitWithPollTask(waitMs);
    }
  }

  throw lastError;
};

const normalizeImageRatio = (ratio: string): string => {
  const supported = ["1:1", "3:4", "4:3", "16:9", "9:16", "2:3", "3:2", "21:9"];
  return supported.includes(ratio) ? ratio : "1:1";
};

const getImage20Size = (size: ImageConfig["size"], ratio: string): string => {
  const dimensions: Record<string, Record<ImageConfig["size"], string>> = {
    "1:1": { "1K": "1024x1024", "2K": "2048x2048", "4K": "4096x4096" },
    "3:4": { "1K": "864x1152", "2K": "1728x2304", "4K": "3456x4608" },
    "4:3": { "1K": "1152x864", "2K": "2304x1728", "4K": "4608x3456" },
    "16:9": { "1K": "1312x736", "2K": "2624x1472", "4K": "5248x2944" },
    "9:16": { "1K": "736x1312", "2K": "1472x2624", "4K": "2944x5248" },
    "2:3": { "1K": "832x1248", "2K": "1664x2496", "4K": "3328x4992" },
    "3:2": { "1K": "1248x832", "2K": "2496x1664", "4K": "4992x3328" },
    "21:9": { "1K": "1568x672", "2K": "3136x1344", "4K": "6272x2688" },
  };
  return dimensions[ratio]?.[size] || dimensions["1:1"][size] || "1024x1024";
};

const ensureImageDataUri = (value: string): string => {
  if (value.startsWith("data:")) return value;
  return `data:image/png;base64,${value}`;
};

const normalizeVideoModes = (mode: VideoConfig["mode"]): VideoMode[] => {
  if (Array.isArray(mode)) return mode as VideoMode[];
  return mode ? [mode] : ["text"];
};

const getVideoDimensions = (resolution: string, ratio: VideoConfig["aspectRatio"]): { width: number; height: number } => {
  const normalized = String(resolution || "720p").toLowerCase();
  const landscape = normalized.includes("1080")
    ? { width: 1920, height: 1088 }
    : normalized.includes("480")
      ? { width: 832, height: 448 }
      : { width: 1280, height: 704 };
  return ratio === "9:16" ? { width: landscape.height, height: landscape.width } : landscape;
};

const getVideoFrames = (duration: number): number => {
  const seconds = Math.max(1, Math.min(18, Math.round(Number(duration) || 5)));
  const frameRate = 24;
  const n = Math.max(1, Math.min(55, Math.round((seconds * frameRate - 1) / 8)));
  return Math.min(441, n * 8 + 1);
};

const unwrapVideoData = (payload: any): any => {
  if (payload?.data && !Array.isArray(payload.data)) return payload.data;
  return payload;
};

const extractVideoUrl = (payload: any): string | undefined => {
  const data = unwrapVideoData(payload);
  return data?.metadata?.url || data?.url || data?.video_url || data?.output?.url;
};

const extractTaskError = (payload: any): string | undefined => {
  const data = unwrapVideoData(payload);
  const error = data?.error?.message || data?.error || data?.message || data?.msg;
  return error ? (typeof error === "string" ? error : JSON.stringify(error)) : undefined;
};

// ============================================================
// 适配器函数
// ============================================================

const textRequest = (model: TextModel, think: boolean, _thinkLevel: 0 | 1 | 2 | 3) => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少 Agnes AI API Key");

  const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");

  return createOpenAICompatible({
    name: "agnes",
    baseURL: getOpenAIBaseUrl(),
    apiKey,
    fetch: async (url: string, options?: any) => {
      if (!options?.body || typeof options.body !== "string") {
        return await fetch(url, options);
      }

      let rawBody: any;
      try {
        rawBody = JSON.parse(options.body);
      } catch {
        return await fetch(url, options);
      }

      const body = think
        ? {
            ...rawBody,
            chat_template_kwargs: {
              ...(rawBody.chat_template_kwargs || {}),
              enable_thinking: true,
            },
          }
        : rawBody;

      return await fetch(url, {
        ...options,
        body: JSON.stringify(body),
      });
    },
  }).chatModel(model.modelName);
};

const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
  const headers = getHeaders();
  const baseUrl = getBaseUrl();
  const ratio = normalizeImageRatio(config.aspectRatio || "1:1");
  const rawImageRefs = (config.referenceList || [])
    .map((item) => item.base64)
    .filter(Boolean)
    .map(ensureImageDataUri);
  const configuredLimit = Number(model.maxReferenceImages);
  const maxReferenceImages = Number.isInteger(configuredLimit) && configuredLimit > 0 ? configuredLimit : rawImageRefs.length;
  const imageRefs = rawImageRefs.slice(0, maxReferenceImages);
  const isImage21 = model.modelName === "agnes-image-2.1-flash";
  const body: any = {
    model: model.modelName,
    prompt: config.prompt || "",
    size: isImage21 ? config.size || "1K" : getImage20Size(config.size || "1K", ratio),
    return_base64: true,
    extra_body: {
      response_format: "b64_json",
    },
  };

  if (isImage21) body.ratio = ratio;
  if (imageRefs.length > 0) body.extra_body.image = imageRefs;

  const referenceCount = imageRefs.length === rawImageRefs.length ? `${imageRefs.length}` : `${imageRefs.length}/${rawImageRefs.length}`;
  logger(`[Agnes 图片] 提交 ${model.modelName}，参考图 ${referenceCount} 张，尺寸 ${body.size}，比例 ${ratio}`);

  return await runImageRequestSerially(async (): Promise<string> => {
    logger(`[Agnes 图片] 已进入生成队列：${model.modelName}`);
    try {
      const response = await postImageWithRetry(`${baseUrl}/v1/images/generations`, body, headers);
      const payload = response?.data;
      const item = Array.isArray(payload?.data) ? payload.data[0] : payload?.data?.[0] || payload;
      const b64 = item?.b64_json || payload?.b64_json;
      const url = item?.url || payload?.url;

      if (b64) return ensureImageDataUri(b64);
      if (url) return await urlToBase64(url);
      throw new Error(`响应中没有图片数据：${JSON.stringify(payload).slice(0, 500)}`);
    } catch (error: any) {
      throw new Error(getErrorMessage(error, "Agnes 图片生成失败"));
    }
  });
};

const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
  const headers = getHeaders();
  const baseUrl = getBaseUrl();
  const imageRefs = (config.referenceList || [])
    .filter((item) => item.type === "image")
    .map((item) => item.base64)
    .filter(Boolean)
    .map(ensureImageDataUri);
  const modes = normalizeVideoModes(config.mode);
  const wantsKeyframes = modes.some((mode) => mode === "startEndRequired") || imageRefs.length >= 2;
  const wantsSingleImage = modes.some((mode) => mode === "singleImage");

  if (wantsKeyframes && imageRefs.length < 2) {
    throw new Error("Agnes 关键帧视频需要首帧和尾帧两张图片");
  }
  if (!wantsKeyframes && wantsSingleImage && imageRefs.length < 1) {
    throw new Error("Agnes 图生视频需要一张参考图片");
  }

  const dimensions = getVideoDimensions(config.resolution, config.aspectRatio || "16:9");
  const body: any = {
    model: model.modelName,
    prompt: config.prompt || "",
    width: dimensions.width,
    height: dimensions.height,
    num_frames: getVideoFrames(config.duration),
    frame_rate: 24,
  };

  if (wantsKeyframes) {
    body.extra_body = {
      image: imageRefs.slice(0, 2),
      mode: "keyframes",
    };
  } else if (imageRefs.length > 0) {
    body.image = imageRefs[0];
  }

  let videoId = config.resumeTask?.videoId;
  let taskId = config.resumeTask?.taskId;
  let submitData: any;

  const checkpoint = async (stage: VideoTaskCheckpoint["stage"], retry: number): Promise<void> => {
    if (!config.onTaskCheckpoint) return;
    await config.onTaskCheckpoint({
      vendorId: "agnes",
      modelName: model.modelName,
      videoId,
      taskId,
      stage,
      retry,
    });
  };

  const downloadResult = async (resultUrl: string, retry: number): Promise<string> => {
    const maxDownloadRetries = 2;
    let downloadRetryCount = 0;

    while (true) {
      const currentRetry = retry + downloadRetryCount;
      await checkpoint("download", currentRetry);
      try {
        return await urlToBase64(resultUrl, { proxy: false, timeout: 120000 });
      } catch (error: any) {
        const message = formatVideoError("download", error, { videoId, taskId }, currentRetry);
        if (!isRetryableVideoTransportError(error) || downloadRetryCount >= maxDownloadRetries) {
          logger(message);
          throw new Error(message);
        }
        downloadRetryCount += 1;
        const waitMs = getVideoRetryBackoffMs(downloadRetryCount);
        logger(`${message} backoffMs=${waitMs}`);
        await sleep(waitMs);
      }
    }
  };

  if (!videoId && !taskId) {
    logger(
      `[Agnes 视频] 提交 ${wantsKeyframes ? "关键帧" : imageRefs.length > 0 ? "图生视频" : "文生视频"}任务，${dimensions.width}x${dimensions.height}，${body.num_frames} 帧`,
    );

    const maxQueueRetries = 4;
    let submitRetry = 0;
    while (true) {
      try {
        const submitResponse = await axios.post(`${baseUrl}/v1/videos`, body, {
          headers,
          timeout: 120000,
          proxy: false,
        });
        submitData = unwrapVideoData(submitResponse?.data);
        break;
      } catch (error: any) {
        if (!isExplicitQueueFullError(error) || submitRetry >= maxQueueRetries) {
          const message = formatVideoError("submit", error, {}, submitRetry);
          logger(message);
          throw new Error(message);
        }
        submitRetry += 1;
        const waitMs = getSubmitQueueBackoffMs(submitRetry);
        const message = formatVideoError("submit", error, {}, submitRetry);
        logger(`${message} backoffMs=${waitMs}`);
        await sleep(waitMs);
      }
    }

    videoId = submitData?.video_id;
    taskId = submitData?.task_id || submitData?.id;
    const directUrl = extractVideoUrl(submitData);
    if (directUrl && String(submitData?.status || "").toLowerCase() === "completed") {
      return await downloadResult(directUrl, 0);
    }
    if (!videoId && !taskId) {
      const message = formatVideoError(
        "submit",
        { message: `未返回 video_id 或 task_id。原始响应：${JSON.stringify(submitData).slice(0, 500)}` },
        {},
        0,
      );
      logger(message);
      throw new Error(message);
    }
    logger(`[Agnes 视频] 任务已创建：${videoId || taskId}`);
  } else {
    logger(`[Agnes 视频] 恢复已有任务：${videoId || taskId}`);
  }

  let pollRetryCount = Math.max(0, Number(config.resumeTask?.retry || 0));
  await checkpoint("poll", pollRetryCount);

  let consecutivePollRetries = 0;
  const maxPollRetries = 8;

  const queryTask = async (): Promise<any> => {
    if (videoId) {
      const query = `video_id=${encodeURIComponent(videoId)}&model_name=${encodeURIComponent(model.modelName)}`;
      try {
        const response = await axios.get(`${baseUrl}/agnesapi?${query}`, {
          headers,
          timeout: 60000,
          proxy: false,
        });
        return response?.data;
      } catch (error: any) {
        if (!taskId || error?.response?.status !== 404) throw error;
      }
    }
    const response = await axios.get(`${baseUrl}/v1/videos/${encodeURIComponent(taskId)}`, {
      headers,
      timeout: 60000,
      proxy: false,
    });
    return response?.data;
  };

  const pollResult = await pollTask(
    async (): Promise<PollResult> => {
      let payload: any;

      while (true) {
        try {
          payload = await queryTask();
          consecutivePollRetries = 0;
          break;
        } catch (error: any) {
          if (!isRetryableVideoTransportError(error) || pollRetryCount >= maxPollRetries) {
            const message = formatVideoError("poll", error, { videoId, taskId }, pollRetryCount);
            logger(message);
            throw new Error(message);
          }
          pollRetryCount += 1;
          consecutivePollRetries += 1;
          const waitMs = getVideoRetryBackoffMs(consecutivePollRetries);
          const message = formatVideoError("poll", error, { videoId, taskId }, pollRetryCount);
          logger(`${message} backoffMs=${waitMs}`);
          await checkpoint("poll", pollRetryCount);
          await sleep(waitMs);
        }
      }

      const data = unwrapVideoData(payload);
      const status = String(data?.status || data?.state || "").toLowerCase();
      const url = extractVideoUrl(data);

      if (["completed", "succeeded", "success", "done"].includes(status)) {
        return url
          ? { completed: true, data: url }
          : {
              completed: true,
              error: formatVideoError(
                "poll",
                { message: "Agnes 视频任务已完成，但响应中没有 metadata.url" },
                { videoId, taskId },
                pollRetryCount,
              ),
            };
      }
      if (["failed", "error", "cancelled", "canceled", "expired"].includes(status)) {
        await checkpoint("failed", pollRetryCount);
        return {
          completed: true,
          error: formatVideoError(
            "poll",
            { message: extractTaskError(data) || "Agnes 视频生成失败", response: { data } },
            { videoId, taskId },
            pollRetryCount,
          ),
        };
      }
      if (url && !status) return { completed: true, data: url };
      return { completed: false };
    },
    5000,
    1800000,
  );

  if (pollResult.error) {
    throw new Error(
      pollResult.error.startsWith("[Agnes Video]")
        ? pollResult.error
        : formatVideoError("poll", { message: pollResult.error }, { videoId, taskId }, pollRetryCount),
    );
  }
  if (!pollResult.data) {
    throw new Error(
      formatVideoError("poll", { message: "轮询结束但没有返回视频地址" }, { videoId, taskId }, pollRetryCount),
    );
  }
  return await downloadResult(pollResult.data, pollRetryCount);
};

const ttsRequest = async (_config: TTSConfig, _model: TTSModel): Promise<string> => {
  return "";
};

const checkForUpdates = async (): Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }> => {
  return {
    hasUpdate: false,
    latestVersion: vendor.version,
    notice:
      "Agnes AI ToonFlow 供应商适配器 2.5：保留视频提示词路由，新增 Agnes Video 串行队列、503 退避重试、任务恢复、分阶段错误和无代理结果下载。",
  };
};

const updateVendor = async (): Promise<string> => {
  return "";
};

// ============================================================
// 导出
// ============================================================

exports.vendor = vendor;
exports.textRequest = textRequest;
exports.imageRequest = imageRequest;
exports.videoRequest = videoRequest;
exports.ttsRequest = ttsRequest;
exports.checkForUpdates = checkForUpdates;
exports.updateVendor = updateVendor;

export {};
