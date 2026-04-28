/**
 * Toonflow AI供应商模板
 * @version 2.0
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
  mode: VideoMode[];
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
declare const logger: (msg: string) => void;
declare const jsonwebtoken: any;
declare const zipImage: (base64: string, size: number) => Promise<string>;
declare const zipImageResolution: (base64: string, w: number, h: number) => Promise<string>;
declare const mergeImages: (base64Arr: string[], maxSize?: string) => Promise<string>;
declare const urlToBase64: (url: string) => Promise<string>;
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
  textRequest: (m: TextModel) => any;
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
  id: "bv",
  version: "2.0",
  author: "Toonflow",
  name: "百度BV模型",
  description:
    "## 百度 VOD BV/Vidu 透传接口\n\n支持 API Key 认证，适配参考生图、文生视频、图生视频、首尾帧生视频和参考生视频。默认地址使用 PDF 中的 `v3/aigc/vd` 接口。",
  inputs: [
    { key: "apiKey", label: "API密钥", type: "password", required: true, placeholder: "Bearer token，可直接粘贴 token 或 Bearer token" },
    { key: "baseUrl", label: "生成接口地址", type: "url", required: true, placeholder: "https://vod.bj.baidubce.com/v3/aigc/vd" },
    { key: "taskBaseUrl", label: "任务查询地址", type: "url", required: true, placeholder: "https://vod.bj.baidubce.com/v3" },
  ],
  inputValues: {
    apiKey: "",
    baseUrl: "https://vod.bj.baidubce.com/v3/aigc/vd",
    taskBaseUrl: "https://vod.bj.baidubce.com/v3",
  },
  models: [
    { name: "BV ViduQ2 生图", modelName: "viduq2", type: "image", mode: ["text", "singleImage", "multiReference"] },
    {
      name: "BV ViduQ3 Pro",
      modelName: "viduq3-pro",
      type: "video",
      mode: ["text", "singleImage", "startEndRequired"],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 8], resolution: ["720p", "1080p"] }],
    },
    {
      name: "BV ViduQ3 Turbo",
      modelName: "viduq3-turbo",
      type: "video",
      mode: ["text", "singleImage", "startEndRequired"],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 8], resolution: ["720p", "1080p"] }],
    },
    {
      name: "BV ViduQ3 参考生视频",
      modelName: "viduq3",
      type: "video",
      mode: [["imageReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 8], resolution: ["720p", "1080p"] }],
    },
    {
      name: "BV ViduQ3 Mix 参考生视频",
      modelName: "viduq3-mix",
      type: "video",
      mode: [["imageReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 8], resolution: ["720p", "1080p"] }],
    },
  ],
};

// ============================================================
// 辅助工具
// ============================================================

const getBaseUrl = () => vendor.inputValues.baseUrl.replace(/\/+$/, "");

const getTaskBaseUrl = () => vendor.inputValues.taskBaseUrl.replace(/\/+$/, "");

const getHeaders = () => {
  const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
  return { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
};

const withImageHead = (base64: string) => {
  return base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`;
};

const resolveActiveMode = (config: VideoConfig, model: VideoModel): VideoMode => {
  const rawMode = config.mode as any;
  const imageRefs = (config.referenceList ?? []).filter((r) => r.type === "image");
  if (Array.isArray(rawMode) && rawMode.length) {
    const selectedMode = rawMode[0];
    if (typeof selectedMode === "string" || Array.isArray(selectedMode)) return selectedMode as VideoMode;
  }
  if (typeof rawMode === "string") {
    const modeSupported = model.mode.some((m) => m === rawMode || (Array.isArray(m) && rawMode !== "text"));
    if (modeSupported) return rawMode as VideoMode;
  }
  const referenceMode = model.mode.find((m) => Array.isArray(m));
  if (referenceMode && imageRefs.length) return referenceMode;
  const startEndMode = model.mode.find((m) => m === "startEndRequired" || m === "endFrameOptional" || m === "startFrameOptional");
  if (startEndMode && imageRefs.length >= 2) return startEndMode;
  if (model.mode.includes("singleImage") && imageRefs.length) return "singleImage";
  if (model.mode.includes("text")) return "text";
  if (referenceMode) return referenceMode;
  return model.mode[0] ?? "text";
};

const getTaskId = (data: any) => {
  return data?.task_id ?? data?.taskId ?? data?.id ?? data?.data?.task_id ?? data?.data?.taskId ?? data?.data?.id;
};

const getErrorMessage = (data: any) => {
  return (
    data?.message ??
    data?.error ??
    data?.error_msg ??
    data?.errMsg ??
    data?.videoGenerateTaskInfo?.errMsg ??
    data?.imageGenerateTaskInfo?.errMsg ??
    data?.data?.message ??
    data?.data?.error ??
    data?.data?.errMsg ??
    "任务失败"
  );
};

const findResultUrl = (value: any, mediaType: "image" | "video"): string => {
  if (!value) return "";
  if (typeof value === "string") {
    if (/^https?:\/\//i.test(value)) {
      if (mediaType === "video" && /\.(mp4|mov|m3u8)(\?|$)/i.test(value)) return value;
      if (mediaType === "image" && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(value)) return value;
    }
    return "";
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = findResultUrl(item, mediaType);
      if (url) return url;
    }
    return "";
  }
  if (typeof value === "object") {
    const preferredKeys = mediaType === "video" ? ["url", "video_url", "videoUrl", "download_url", "downloadUrl"] : ["url", "image_url", "imageUrl"];
    for (const key of preferredKeys) {
      if (typeof value[key] === "string" && /^https?:\/\//i.test(value[key])) return value[key];
      const url = findResultUrl(value[key], mediaType);
      if (url) return url;
    }
    for (const key of Object.keys(value)) {
      const url = findResultUrl(value[key], mediaType);
      if (url) return url;
    }
  }
  return "";
};

const pollBvTask = async (taskId: string, mediaType: "image" | "video") => {
  const result = await pollTask(
    async () => {
      const response = await axios.get(`${getTaskBaseUrl()}/tasks/${taskId}`, { headers: getHeaders() });
      const data = response.data;
      const status = data?.status ?? data?.state ?? data?.data?.status ?? data?.data?.state;
      if (status === "SUCCESS" || status === "completed" || status === "success") {
        const resultUrl = findResultUrl(data, mediaType);
        if (!resultUrl) return { completed: true, error: "任务成功但未找到生成物URL" };
        return { completed: true, data: resultUrl };
      }
      if (status === "FAILED" || status === "FAILURE" || status === "failed" || status === "fail") {
        return { completed: true, error: getErrorMessage(data) };
      }
      logger(`任务生成中，当前状态：${status || "UNKNOWN"}`);
      return { completed: false };
    },
    5000,
    900000,
  );
  if (result.error) throw new Error(result.error);
  if (!result.data) throw new Error("任务完成但没有返回生成物URL");
  return result.data;
};

// ============================================================
// 适配器函数
// ============================================================

const textRequest = (model: TextModel) => {
  throw new Error(`百度BV模型不支持文本对话模型：${model.modelName}`);
};

const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");
  const imageRefs = (config.referenceList ?? []).map((r) => withImageHead(r.base64));
  const body: Record<string, any> = {
    model: model.modelName,
    prompt: config.prompt,
    aspect_ratio: config.aspectRatio,
    resolution: config.size,
  };
  if (imageRefs.length) body.images = imageRefs;

  logger("开始提交BV图片生成任务");
  const response = await axios.post(`${getBaseUrl()}/ent/v2/reference2image`, body, { headers: getHeaders() });
  const taskId = getTaskId(response.data);
  if (!taskId) throw new Error(`图片任务提交失败：${getErrorMessage(response.data)}`);
  logger(`BV图片任务ID: ${taskId}`);

  const resultUrl = await pollBvTask(taskId, "image");
  return await urlToBase64(resultUrl);
};

const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");
  const activeMode = resolveActiveMode(config, model);
  const imageRefs = (config.referenceList ?? []).filter((r) => r.type === "image").map((r) => withImageHead(r.base64));
  const body: Record<string, any> = {
    model: model.modelName,
    prompt: config.prompt,
    duration: config.duration,
    resolution: config.resolution,
    aspect_ratio: config.aspectRatio,
    off_peak: false,
  };
  if (typeof config.audio === "boolean") body.audio = config.audio;

  let endpoint = "/ent/v2/text2video";
  if (Array.isArray(activeMode)) {
    if (!imageRefs.length) throw new Error("参考生视频至少需要一张图片参考");
    endpoint = "/ent/v2/reference2video";
    body.images = imageRefs.slice(0, 3);
  } else if (activeMode === "singleImage") {
    if (!imageRefs.length) throw new Error("图生视频需要一张首帧图片");
    endpoint = "/ent/v2/img2video";
    body.images = [imageRefs[0]];
  } else if (activeMode === "startEndRequired" || activeMode === "endFrameOptional" || activeMode === "startFrameOptional") {
    if (activeMode === "startEndRequired" && imageRefs.length < 2) throw new Error("首尾帧模式需要两张图片");
    if (activeMode === "endFrameOptional" && imageRefs.length < 1) throw new Error("首帧必填，尾帧可选");
    if (activeMode === "startFrameOptional" && imageRefs.length < 1) throw new Error("尾帧必填，首帧可选");
    endpoint = "/ent/v2/start-end2video";
    body.images = imageRefs.slice(0, 2);
  }

  logger(`开始提交BV视频生成任务，模型：${model.modelName}，模式：${Array.isArray(activeMode) ? activeMode.join(",") : activeMode}，接口：${endpoint}`);
  const response = await axios.post(`${getBaseUrl()}${endpoint}`, body, { headers: getHeaders() });
  const taskId = getTaskId(response.data);
  if (!taskId) throw new Error(`视频任务提交失败：${getErrorMessage(response.data)}`);
  logger(`BV视频任务ID: ${taskId}`);

  const resultUrl = await pollBvTask(taskId, "video");
  return await urlToBase64(resultUrl);
};

const ttsRequest = async (config: TTSConfig, model: TTSModel): Promise<string> => {
  return "";
};

const checkForUpdates = async (): Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }> => {
  return { hasUpdate: false, latestVersion: "2.0", notice: "## 新版本更新公告\n当前版本基于 BV模型 API 文档适配。" };
};

const updateVendor = async (): Promise<string> => {
  return "";
};

// ============================================================
// 导出区
// ============================================================

exports.vendor = vendor;
exports.textRequest = textRequest;
exports.imageRequest = imageRequest;
exports.videoRequest = videoRequest;
exports.ttsRequest = ttsRequest;
exports.checkForUpdates = checkForUpdates;
exports.updateVendor = updateVendor;

export {};
