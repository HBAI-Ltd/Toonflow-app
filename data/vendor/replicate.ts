/**
 * Toonflow AI供应商插件 - Replicate
 * @version 1.0
 */

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
  | { type: "image"; sourceType?: "base64"; base64: string; role?: string }
  | { type: "audio"; sourceType?: "base64"; base64: string; role?: string }
  | { type: "video"; sourceType?: "base64"; base64: string; role?: string };

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

declare const axios: any;
declare const logger: (msg: string) => void;
declare const urlToBase64: (url: string) => Promise<string>;
declare const pollTask: (fn: () => Promise<PollResult>, interval?: number, timeout?: number) => Promise<PollResult>;
declare const exports: {
  vendor: VendorConfig;
  textRequest: (m: TextModel, t: boolean, tl: 0 | 1 | 2 | 3) => any;
  imageRequest: (c: ImageConfig, m: ImageModel) => Promise<string>;
  videoRequest: (c: VideoConfig, m: VideoModel) => Promise<string>;
  ttsRequest: (c: TTSConfig, m: TTSModel) => Promise<string>;
  checkForUpdates?: () => Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }>;
  updateVendor?: () => Promise<string>;
};

const vendor: VendorConfig = {
  id: "replicate",
  version: "2.0",
  author: "Toonflow",
  name: "Replicate",
  description:
    "Replicate 官方 API 接入。当前内置本项目验证过的 Nano Banana 2 图片生成，以及 P-Video、Veo 3.1 Lite、Seedance 2.0 Fast、Kling、HappyHorse 视频模型；API Key 填 Replicate token。",
  inputs: [
    { key: "apiKey", label: "API密钥", type: "password", required: true, placeholder: "Replicate API token" },
    { key: "baseUrl", label: "请求地址", type: "url", required: true, placeholder: "https://api.replicate.com/v1" },
  ],
  inputValues: {
    apiKey: "",
    baseUrl: "https://api.replicate.com/v1",
  },
  models: [
    {
      name: "Nano Banana 2",
      modelName: "google/nano-banana-2",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
      associationSkills: "适合分镜图生成；最多建议传入 14 张角色/场景/控制参考图。",
    },
    {
      name: "P-Video",
      modelName: "prunaai/p-video",
      type: "video",
      mode: ["text", "singleImage", "endFrameOptional", ["audioReference:1"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], resolution: ["720p", "1080p"] }],
      associationSkills: "支持文生视频、单图图生视频、首尾帧、单音频输入；不支持 reference_images 多参考图。",
    },
    {
      name: "P-Video Draft",
      modelName: "prunaai/p-video:draft",
      type: "video",
      mode: ["text", "singleImage", "endFrameOptional", ["audioReference:1"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], resolution: ["720p", "1080p"] }],
      associationSkills: "P-Video 草稿模式，支持单图/首尾帧/单音频；不支持 reference_images 多参考图。",
    },
    {
      name: "Veo 3.1 Lite",
      modelName: "google/veo-3.1-lite",
      type: "video",
      mode: ["text", "singleImage", "endFrameOptional"],
      audio: true,
      durationResolutionMap: [
        { duration: [4, 6], resolution: ["720p"] },
        { duration: [8], resolution: ["720p", "1080p"] },
      ],
      associationSkills: "支持文生视频、单图图生视频、首尾帧插值；不支持多参考图，1080p 必须 8 秒，音频始终开启。",
    },
    {
      name: "Seedance 2.0 Fast",
      modelName: "bytedance/seedance-2.0-fast",
      type: "video",
      mode: ["text", "singleImage", "endFrameOptional", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10], resolution: ["480p", "720p"] }],
      associationSkills: "支持单图首帧，也支持最多 9 张图片、3 个视频、3 个音频的多参考；多参考时 prompt 用 [Image1] / [Video1] / [Audio1] 引用。",
    },
    {
      name: "Kling V3 Omni Video",
      modelName: "kwaivgi/kling-v3-omni-video",
      type: "video",
      mode: ["text", "singleImage", "endFrameOptional", ["imageReference:7", "videoReference:1"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["720p", "1080p", "4K"] }],
      associationSkills: "支持文生视频、首尾帧、最多 7 张参考图或 1 个参考视频；prompt 用 <<<image_1>>> / <<<video_1>>> 引用。",
    },
    {
      name: "Kling V3 Video",
      modelName: "kwaivgi/kling-v3-video",
      type: "video",
      mode: ["text", "singleImage", "endFrameOptional"],
      audio: "optional",
      durationResolutionMap: [{ duration: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["720p", "1080p", "4K"] }],
      associationSkills: "支持文生视频、单图图生视频、首尾帧、多镜头 multi_prompt；不支持 reference_images 多参考图。",
    },
    {
      name: "HappyHorse 1.1",
      modelName: "alibaba/happyhorse-1.1",
      type: "video",
      mode: ["text", "singleImage", ["imageReference:9"]],
      audio: false,
      durationResolutionMap: [{ duration: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["720p", "1080p"] }],
      associationSkills: "支持文生视频、单图图生视频、多参考图最多 9 张；多参考时 prompt 用 [Image 1] / [Image 2] 引用。",
    },
  ],
};

const getBaseUrl = () => (vendor.inputValues.baseUrl || "https://api.replicate.com/v1").replace(/\/+$/, "");

const getApiKey = () => {
  const apiKey = (vendor.inputValues.apiKey || "").replace(/^Bearer\s+/i, "").trim();
  if (!apiKey) throw new Error("缺少 Replicate API Key");
  return apiKey;
};

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getApiKey()}`,
});

const asDataUri = (value: string, fallbackMime: string): string => {
  if (!value) return value;
  if (/^data:/i.test(value) || /^https?:\/\//i.test(value)) return value;
  return `data:${fallbackMime};base64,${value}`;
};

const mediaRefs = <T extends ReferenceList["type"]>(list: ReferenceList[] | undefined, type: T): Extract<ReferenceList, { type: T }>[] => {
  return ((list || []).filter((item) => item.type === type) as Extract<ReferenceList, { type: T }>[]);
};

const refsByRole = <T extends ReferenceList["type"]>(list: Extract<ReferenceList, { type: T }>[], roles: string[]) => {
  const roleSet = new Set(roles);
  return list.filter((item) => item.role && roleSet.has(item.role));
};

const refsWithoutRole = <T extends ReferenceList["type"]>(list: Extract<ReferenceList, { type: T }>[]) => list.filter((item) => !item.role);

const clamp = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
};

const safeStringify = (value: any): string => {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const extractUrlFromValue = (value: any): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = extractUrlFromValue(item);
      if (url) return url;
    }
    return undefined;
  }
  if (typeof value === "object") {
    const direct = value.url || value.image || value.video || value.output || value.file || value.href;
    if (direct) {
      const url = extractUrlFromValue(direct);
      if (url) return url;
    }
    for (const key of ["images", "videos", "outputs", "files"]) {
      const url = extractUrlFromValue(value[key]);
      if (url) return url;
    }
  }
  return undefined;
};

const extractPredictionError = (prediction: any): string => {
  const error = prediction?.error || prediction?.logs || prediction?.detail || prediction;
  return safeStringify(error).slice(0, 800);
};

const createPrediction = async (modelName: string, input: Record<string, any>): Promise<any> => {
  const replicateModel = modelName.replace(/:draft$/, "");
  const url = `${getBaseUrl()}/models/${replicateModel}/predictions`;
  try {
    logger(`[Replicate] 提交任务: ${replicateModel}`);
    const res = await axios.post(url, { input }, { headers: getHeaders() });
    return res.data;
  } catch (err: any) {
    const detail = err?.response?.data ? safeStringify(err.response.data) : err?.message || String(err);
    throw new Error(`Replicate 任务提交失败: ${detail.slice(0, 800)}`);
  }
};

const nearestDuration = (value: number, allowed: number[], fallback: number) => {
  const raw = Number.isFinite(value) ? Math.floor(value) : fallback;
  return allowed.reduce((best, item) => (Math.abs(item - raw) < Math.abs(best - raw) ? item : best), fallback);
};

const klingMode = (resolution: string | undefined, allow4k: boolean) => {
  if (allow4k && /^4k$/i.test(resolution || "")) return "4k";
  if (resolution === "1080p") return "pro";
  return "standard";
};

const buildVideoInput = (config: VideoConfig, model: VideoModel): Record<string, any> => {
  const imageItems = mediaRefs(config.referenceList, "image");
  const videoItems = mediaRefs(config.referenceList, "video");
  const audioItems = mediaRefs(config.referenceList, "audio");
  const unroledImages = refsWithoutRole(imageItems);
  const firstFrame = refsByRole(imageItems, ["firstFrame"])[0] || unroledImages[0];
  const lastFrame = refsByRole(imageItems, ["lastFrame"])[0] || unroledImages[1];
  const imageReferences = refsByRole(imageItems, ["imageReference", "assetReference"]);
  const unroledVideos = refsWithoutRole(videoItems);
  const videoReferences = refsByRole(videoItems, ["videoReference"]);
  const unroledAudios = refsWithoutRole(audioItems);
  const audioReferences = refsByRole(audioItems, ["audioReference"]);
  const images = (imageReferences.length ? imageReferences : unroledImages).map((ref) => asDataUri(ref.base64, "image/png"));
  const videos = (videoReferences.length ? videoReferences : unroledVideos).map((ref) => asDataUri(ref.base64, "video/mp4"));
  const audios = (audioReferences.length ? audioReferences : unroledAudios).map((ref) => asDataUri(ref.base64, "audio/mpeg"));
  const firstFrameUrl = firstFrame ? asDataUri(firstFrame.base64, "image/png") : undefined;
  const lastFrameUrl = lastFrame ? asDataUri(lastFrame.base64, "image/png") : undefined;
  const base: Record<string, any> = {
    prompt: config.prompt || "",
    aspect_ratio: config.aspectRatio || "16:9",
  };

  if (model.modelName === "google/veo-3.1-lite") {
    const duration = nearestDuration(config.duration || 4, [4, 6, 8], 4);
    const resolution = config.resolution === "1080p" && duration === 8 ? "1080p" : "720p";
    if (firstFrameUrl) base.image = firstFrameUrl;
    if (lastFrameUrl) base.last_frame = lastFrameUrl;
    return { ...base, duration, resolution };
  }

  if (model.modelName === "bytedance/seedance-2.0-fast") {
    const input = {
      ...base,
      duration: clamp(config.duration || 5, 4, 10),
      resolution: config.resolution === "480p" ? "480p" : "720p",
      generate_audio: config.audio !== false,
    };
    if (Array.isArray(config.mode)) {
      return {
        ...input,
        ...(images.length > 0 && { reference_images: images.slice(0, 9) }),
        ...(videos.length > 0 && { reference_videos: videos.slice(0, 3) }),
        ...(audios.length > 0 && { reference_audios: audios.slice(0, 3) }),
      };
    }
    if (firstFrameUrl) input.image = firstFrameUrl;
    return input;
  }

  if (model.modelName === "kwaivgi/kling-v3-video") {
    if (firstFrameUrl) base.start_image = firstFrameUrl;
    if (lastFrameUrl) base.end_image = lastFrameUrl;
    return {
      ...base,
      mode: klingMode(config.resolution, true),
      duration: clamp(config.duration || 5, 3, 15),
      generate_audio: config.audio !== false,
    };
  }

  if (model.modelName === "kwaivgi/kling-v3-omni-video") {
    const hasMultiRef = Array.isArray(config.mode) && config.mode.some((item) => typeof item === "string" && /Reference:/i.test(item));
    const input: Record<string, any> = {
      ...base,
      mode: klingMode(config.resolution, videos.length === 0),
      duration: clamp(config.duration || 5, 3, 15),
    };
    if (hasMultiRef) {
      if (images.length > 0) input.reference_images = images.slice(0, videos.length > 0 ? 4 : 7);
      if (videos[0]) {
        input.reference_video = videos[0];
        input.video_reference_type = "feature";
        input.keep_original_sound = false;
      } else {
        input.generate_audio = config.audio !== false;
      }
      return input;
    }
    if (firstFrameUrl) input.start_image = firstFrameUrl;
    if (lastFrameUrl) input.end_image = lastFrameUrl;
    input.generate_audio = config.audio !== false;
    return input;
  }

  if (model.modelName === "alibaba/happyhorse-1.1") {
    const input: Record<string, any> = {
      ...base,
      duration: clamp(config.duration || 5, 3, 15),
      resolution: config.resolution === "720p" ? "720p" : "1080p",
    };
    const happyHorseImages = Array.isArray(config.mode) ? images : [firstFrameUrl].filter(Boolean);
    if (happyHorseImages.length !== 1) input.aspect_ratio = config.aspectRatio || "16:9";
    if (happyHorseImages.length > 0) input.images = happyHorseImages.slice(0, 9);
    return input;
  }

  const input: Record<string, any> = {
    ...base,
    duration: clamp(config.duration || 5, 1, 20),
    resolution: config.resolution || "720p",
    fps: 24,
    draft: /:draft$/.test(model.modelName),
    prompt_upsampling: false,
    save_audio: model.audio === true || (model.audio === "optional" && config.audio !== false),
  };
  if (firstFrameUrl) input.image = firstFrameUrl;
  if (lastFrameUrl) input.last_frame_image = lastFrameUrl;
  if (audios[0]) input.audio = audios[0];
  return input;
};

const pollPrediction = async (prediction: any, mediaType: "image" | "video"): Promise<string> => {
  if (!prediction?.urls?.get) {
    throw new Error(`Replicate 任务提交失败：未返回轮询地址。响应：${safeStringify(prediction).slice(0, 500)}`);
  }
  if (prediction?.id) logger(`[Replicate] 任务ID: ${prediction.id}`);

  const result = await pollTask(
    async (): Promise<PollResult> => {
      let res: any;
      try {
        res = await axios.get(prediction.urls.get, { headers: getHeaders() });
      } catch (err: any) {
        const status = err?.response?.status;
        if ([408, 425, 429, 500, 502, 503, 504].includes(status)) {
          logger(`[Replicate] 轮询临时失败: HTTP ${status}，继续等待`);
          return { completed: false };
        }
        throw err;
      }
      const data = res.data;
      const status = data?.status;
      logger(`[Replicate] 任务状态: ${status}`);

      if (status === "succeeded") {
        const url = extractUrlFromValue(data?.output) || extractUrlFromValue(data);
        if (!url) return { completed: true, error: "Replicate 任务成功但未返回媒体地址" };
        return { completed: true, data: url };
      }
      if (["failed", "canceled", "cancelled"].includes(status)) {
        return { completed: true, error: extractPredictionError(data) || `Replicate 任务${status}` };
      }
      return { completed: false };
    },
    mediaType === "image" ? 3000 : 10000,
    mediaType === "image" ? 900000 : 2400000,
  );

  if (result.error) throw new Error(result.error);
  if (!result.data) throw new Error("Replicate 任务轮询未返回结果");
  if (result.data.startsWith("data:")) return result.data;
  return await urlToBase64(result.data);
};

const textRequest = (_model: TextModel, _think: boolean, _thinkLevel: 0 | 1 | 2 | 3) => {
  throw new Error("Replicate 插件当前未接入文本模型");
};

const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
  const imageInput = (config.referenceList || []).map((ref) => asDataUri(ref.base64, "image/png")).filter(Boolean).slice(0, 14);
  const input: Record<string, any> = {
    prompt: config.prompt || "",
    aspect_ratio: config.aspectRatio || "16:9",
    resolution: config.size || "2K",
    output_format: "jpg",
  };
  if (imageInput.length > 0) input.image_input = imageInput;

  const prediction = await createPrediction(model.modelName, input);
  return await pollPrediction(prediction, "image");
};

const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
  const input = buildVideoInput(config, model);
  const prediction = await createPrediction(model.modelName, input);
  return await pollPrediction(prediction, "video");
};

const ttsRequest = async (_config: TTSConfig, _model: TTSModel): Promise<string> => {
  return "";
};

const checkForUpdates = async (): Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }> => {
  return { hasUpdate: false, latestVersion: vendor.version, notice: "Replicate 插件初版。" };
};

const updateVendor = async (): Promise<string> => {
  return "";
};

exports.vendor = vendor;
exports.textRequest = textRequest;
exports.imageRequest = imageRequest;
exports.videoRequest = videoRequest;
exports.ttsRequest = ttsRequest;
exports.checkForUpdates = checkForUpdates;
exports.updateVendor = updateVendor;
export {};
