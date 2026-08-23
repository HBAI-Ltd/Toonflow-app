/**
 * Toonflow AI供应商模板 - 火山引擎(豆包)
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
  id: "volcengine",
  version: "2.4",
  author: "leeqi",
  name: "Volcengine (Doubao)",
  description: "Volcengine Doubao large model, supports text, image generation, video generation, and more.\n\nGet your API Key from the [Volcengine Console](https://console.volcengine.com/ark).",
  icon: "",
  inputs: [
    { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "Volcengine API Key" },
    { key: "baseUrl", label: "Request URL", type: "url", required: true, placeholder: "Ends with v3, example: https://ark.cn-beijing.volces.com/api/v3" },
  ],
  inputValues: {
    apiKey: "",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
  },
  models: [
    // ===================== 文本模型 - 推荐 =====================
    { name: "Doubao-Seed-2.0-Pro", modelName: "doubao-seed-2-0-pro-260215", type: "text", think: true },
    { name: "Doubao-Seed-2.0-Lite", modelName: "doubao-seed-2-0-lite-260215", type: "text", think: true },
    { name: "Doubao-Seed-2.0-Mini", modelName: "doubao-seed-2-0-mini-260215", type: "text", think: true },
    { name: "Doubao-Seed-2.0-Code-Preview", modelName: "doubao-seed-2-0-code-preview-260215", type: "text", think: true },
    { name: "Doubao-Seed-Character", modelName: "doubao-seed-character-251128", type: "text", think: false },
    // ===================== 文本模型 - 往期 =====================
    { name: "Doubao-Seed-1.8", modelName: "doubao-seed-1-8-251228", type: "text", think: true },
    { name: "Doubao-Seed-Code-Preview", modelName: "doubao-seed-code-preview-251028", type: "text", think: true },
    { name: "Doubao-Seed-1.6-Lite", modelName: "doubao-seed-1-6-lite-251015", type: "text", think: true },
    { name: "Doubao-Seed-1.6-Flash(0828)", modelName: "doubao-seed-1-6-flash-250828", type: "text", think: true },
    { name: "Doubao-Seed-1.6-Vision", modelName: "doubao-seed-1-6-vision-250815", type: "text", think: true },
    { name: "Doubao-Seed-1.6(1015)", modelName: "doubao-seed-1-6-251015", type: "text", think: true },
    { name: "Doubao-Seed-1.6(0615)", modelName: "doubao-seed-1-6-250615", type: "text", think: true },
    { name: "Doubao-Seed-1.6-Flash(0615)", modelName: "doubao-seed-1-6-flash-250615", type: "text", think: true },
    { name: "Doubao-Seed-Translation", modelName: "doubao-seed-translation-250915", type: "text", think: false },
    { name: "Doubao-1.5-Pro-32K", modelName: "doubao-1-5-pro-32k-250115", type: "text", think: false },
    { name: "Doubao-1.5-Pro-32K-Character(0715)", modelName: "doubao-1-5-pro-32k-character-250715", type: "text", think: false },
    { name: "Doubao-1.5-Pro-32K-Character(0228)", modelName: "doubao-1-5-pro-32k-character-250228", type: "text", think: false },
    { name: "Doubao-1.5-Lite-32K", modelName: "doubao-1-5-lite-32k-250115", type: "text", think: false },
    { name: "Doubao-1.5-Vision-Pro-32K", modelName: "doubao-1-5-vision-pro-32k-250115", type: "text", think: false },
    // ===================== 文本模型 - 第三方(火山引擎托管) =====================
    { name: "GLM-4-7", modelName: "glm-4-7-251222", type: "text", think: true },
    { name: "DeepSeek-V3-2", modelName: "deepseek-v3-2-251201", type: "text", think: true },
    { name: "DeepSeek-V3-1-Terminus", modelName: "deepseek-v3-1-terminus", type: "text", think: true },
    { name: "DeepSeek-V3(0324)", modelName: "deepseek-v3-250324", type: "text", think: false },
    { name: "DeepSeek-R1(0528)", modelName: "deepseek-r1-250528", type: "text", think: true },
    { name: "Qwen3-32B", modelName: "qwen3-32b-20250429", type: "text", think: false },
    { name: "Qwen3-14B", modelName: "qwen3-14b-20250429", type: "text", think: false },
    { name: "Qwen3-8B", modelName: "qwen3-8b-20250429", type: "text", think: false },
    { name: "Qwen3-0.6B", modelName: "qwen3-0-6b-20250429", type: "text", think: false },
    { name: "Qwen2.5-72B", modelName: "qwen2-5-72b-20240919", type: "text", think: false },
    { name: "GLM-4.5-Air", modelName: "glm-4-5-air", type: "text", think: false },
    // ===================== 图片生成模型 =====================
    {
      name: "Seedream-5.0",
      modelName: "doubao-seedream-5-0-260128",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
    },
    {
      name: "Seedream-5.0-Lite",
      modelName: "doubao-seedream-5-0-lite-260128",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
    },
    {
      name: "Seedream-4.5",
      modelName: "doubao-seedream-4-5-251128",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
    },
    {
      name: "Seedream-4.0",
      modelName: "doubao-seedream-4-0-250828",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
    },
    {
      name: "Seedream-3.0-T2I",
      modelName: "doubao-seedream-3-0-t2i-250415",
      type: "image",
      mode: ["text"],
    },
    // ===================== 视频生成模型 =====================
    {
      name: "Seedance-2.0 (Synced Audio&Video)",
      modelName: "doubao-seedance-2-0-260128",
      type: "video",
      mode: ["text", "startFrameOptional", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "720p"] }],
    },
    {
      name: "Seedance-2.0-Fast (Synced Audio&Video)",
      modelName: "doubao-seedance-2-0-fast-260128",
      type: "video",
      mode: ["text", "startFrameOptional", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "720p"] }],
    },
    {
      name: "Seedance-1.5-Pro (Synced Audio&Video)",
      modelName: "doubao-seedance-1-5-pro-251215",
      type: "video",
      mode: ["text", "startFrameOptional"],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12], resolution: ["480p", "720p", "1080p"] }],
    },
    {
      name: "Seedance-1.0-Pro",
      modelName: "doubao-seedance-1-0-pro-250528",
      type: "video",
      mode: ["text", "startFrameOptional"],
      audio: false,
      durationResolutionMap: [{ duration: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], resolution: ["480p", "720p", "1080p"] }],
    },
    {
      name: "Seedance-1.0-Pro-Fast",
      modelName: "doubao-seedance-1-0-pro-fast-251015",
      type: "video",
      mode: ["text", "singleImage"],
      audio: false,
      durationResolutionMap: [{ duration: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], resolution: ["480p", "720p", "1080p"] }],
    },
    {
      name: "Seedance-1.0-Lite-T2V",
      modelName: "doubao-seedance-1-0-lite-t2v-250428",
      type: "video",
      mode: ["text"],
      audio: false,
      durationResolutionMap: [{ duration: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], resolution: ["480p", "720p", "1080p"] }],
    },
    {
      name: "Seedance-1.0-Lite-I2V",
      modelName: "doubao-seedance-1-0-lite-i2v-250428",
      type: "video",
      mode: ["startFrameOptional", ["imageReference:4"]],
      audio: false,
      durationResolutionMap: [{ duration: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], resolution: ["480p", "720p", "1080p"] }],
    },
  ],
};

// ============================================================
// 辅助工具
// ============================================================

const getHeaders = () => {
  if (!vendor.inputValues.apiKey) throw new Error("Missing API Key");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "")}`,
  };
};

const getBaseUrl = () => vendor.inputValues.baseUrl.replace(/\/+$/, "");

// ============================================================
// 适配器函数
// ============================================================

const textRequest = (model: TextModel, think: boolean, thinkLevel: 0 | 1 | 2 | 3) => {
  if (!vendor.inputValues.apiKey) throw new Error("Missing API Key");
  const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");

  const effortMap: Record<number, string> = {
    0: "minimal",
    1: "low",
    2: "medium",
    3: "high",
  };

  return createOpenAICompatible({
    name: "volcengine",
    baseURL: getBaseUrl(),
    apiKey,
    fetch: async (url: string, options?: RequestInit) => {
      const rawBody = JSON.parse((options?.body as string) ?? "{}");
      const modifiedBody = {
        ...rawBody,
        thinking: {
          type: "enabled",
        },
        reasoning_effort: effortMap[thinkLevel],
      };
      return await fetch(url, {
        ...options,
        body: JSON.stringify(modifiedBody),
      });
    },
  }).chatModel(model.modelName);
};

const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
  const baseUrl = getBaseUrl();
  const headers = getHeaders();

  const body: any = {
    model: model.modelName,
    prompt: config.prompt || "",
    response_format: "url",
    watermark: false,
  };

  const isOldModel = model.modelName.includes("seedream-3-0");
  const is5Lite = model.modelName.includes("seedream-5-0-lite");

  // sequential_image_generation 仅 seedream 5.0-lite/4.5/4.0 支持
  if (!isOldModel) {
    body.sequential_image_generation = "disabled";
  }

  // 参考图片：单图为 string，多图为 array（seedream-3.0-t2i 不支持 image 参数）
  if (!isOldModel && config.referenceList && config.referenceList.length > 0) {
    const images = config.referenceList.map((ref) => ref.base64);
    body.image = images.length === 1 ? images[0] : images;
  }

  // 尺寸处理：优先使用推荐像素值，未匹配则直接传分辨率字符串让模型自行决定
  const [w, h] = config.aspectRatio.split(":").map(Number);
  const sizeTable: Record<string, Record<string, string>> = {
    "1K": {
      "1:1": "1024x1024",
      "4:3": "1152x864",
      "3:4": "864x1152",
      "16:9": "1280x720",
      "9:16": "720x1280",
      "3:2": "1248x832",
      "2:3": "832x1248",
      "21:9": "1512x648",
    },
    "2K": {
      "1:1": "2048x2048",
      "4:3": "2304x1728",
      "3:4": "1728x2304",
      "16:9": "2848x1600",
      "9:16": "1600x2848",
      "3:2": "2496x1664",
      "2:3": "1664x2496",
      "21:9": "3136x1344",
    },
    "4K": {
      "1:1": "4096x4096",
      "4:3": "4704x3520",
      "3:4": "3520x4704",
      "16:9": "5504x3040",
      "9:16": "3040x5504",
      "3:2": "4992x3328",
      "2:3": "3328x4992",
      "21:9": "6240x2656",
    },
  };

  const sizeKey = config.size || "2K";
  const ratioKey = config.aspectRatio;
  const table = sizeTable[sizeKey];

  if (table && table[ratioKey]) {
    // 推荐像素值匹配到了，但需要检查是否满足模型最低像素要求
    const [pw, ph] = table[ratioKey].split("x").map(Number);
    const totalPixels = pw * ph;
    if (isOldModel) {
      // seedream-3.0-t2i: 像素范围 [512x512, 2048x2048]
      body.size = table[ratioKey];
    } else if (totalPixels < 3686400) {
      // 1K 像素值不满足新模型最低要求，直接传 "2K" 让模型自行决定
      body.size = "2K";
    } else if (is5Lite && totalPixels > 10404496) {
      // seedream-5.0-lite 最高 10404496，4K 超限，回退传 "2K"
      body.size = "2K";
    } else {
      body.size = table[ratioKey];
    }
  } else if (isOldModel) {
    // seedream-3.0-t2i: 像素范围 [512x512, 2048x2048]，直接按比例计算
    const base = sizeKey === "1K" ? 1024 : 2048;
    const calcW = Math.min(2048, Math.round(base * Math.sqrt(w / h)));
    const calcH = Math.min(2048, Math.round(base * Math.sqrt(h / w)));
    body.size = `${Math.max(512, calcW)}x${Math.max(512, calcH)}`;
  } else {
    // 新模型未匹配推荐值时，直接传分辨率字符串（方式1），由模型根据 prompt 自行决定尺寸
    // seedream 5.0-lite 支持 "2K"/"3K"，seedream 4.5 支持 "2K"/"4K"，seedream 4.0 支持 "1K"/"2K"/"4K"
    if (is5Lite) {
      body.size = sizeKey === "4K" ? "3K" : sizeKey === "1K" ? "2K" : sizeKey;
    } else {
      body.size = sizeKey === "1K" ? "2K" : sizeKey;
    }
  }

  logger(`[Image generation] Requesting model: ${model.modelName}, size: ${body.size}`);
  const res = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Image generation request failed: ${errorText}`);
  }
  const response = await res.json();
  logger(response);

  if (response?.error) {
    throw new Error(`Image generation failed: ${response.error.message || response.error.code}`);
  }

  // 从 data 数组中提取第一张成功的图片
  if (response?.data && response.data.length > 0) {
    for (const item of response.data) {
      if (item.url) {
        return await urlToBase64(item.url);
      }
      if (item.b64_json) {
        return item.b64_json;
      }
      if (item.error) {
        throw new Error(`Image generation failed: ${item.error.message || item.error.code}`);
      }
    }
  }

  throw new Error("Image generation failed: no valid result returned");
};

const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
  const baseUrl = getBaseUrl();
  const headers = getHeaders();

  const content: any[] = [];

  if (config.prompt) {
    content.push({ type: "text", text: config.prompt });
  }

  if (typeof config.mode === "string") {
    switch (config.mode) {
      case "singleImage": {
        const firstImage = config.referenceList?.find((r) => r.type === "image");
        if (firstImage) {
          content.push({
            type: "image_url",
            image_url: { url: firstImage.base64 },
            role: "first_frame",
          });
        }
        break;
      }
      case "startFrameOptional": {
        const images = config.referenceList?.filter((r) => r.type === "image") ?? [];
        if (images.length > 0) {
          content.push({
            type: "image_url",
            image_url: { url: images[0].base64 },
            role: "first_frame",
          });
          if (images.length > 1) {
            content.push({
              type: "image_url",
              image_url: { url: images[1].base64 },
              role: "last_frame",
            });
          }
        }
        break;
      }
      case "startEndRequired": {
        const images = config.referenceList?.filter((r) => r.type === "image") ?? [];
        if (images.length >= 2) {
          content.push({
            type: "image_url",
            image_url: { url: images[0].base64 },
            role: "first_frame",
          });
          content.push({
            type: "image_url",
            image_url: { url: images[1].base64 },
            role: "last_frame",
          });
        }
        break;
      }
      case "endFrameOptional": {
        const images = config.referenceList?.filter((r) => r.type === "image") ?? [];
        if (images.length > 0) {
          content.push({
            type: "image_url",
            image_url: { url: images[0].base64 },
            role: "first_frame",
          });
          if (images.length > 1) {
            content.push({
              type: "image_url",
              image_url: { url: images[1].base64 },
              role: "last_frame",
            });
          }
        }
        break;
      }
      case "text":
      default:
        break;
    }
  } else if (Array.isArray(config.mode)) {
    // 多模态参考模式：按类型分别提取并添加
    const imageRefs = config.referenceList?.filter((r) => r.type === "image") ?? [];
    const videoRefs = config.referenceList?.filter((r) => r.type === "video") ?? [];
    const audioRefs = config.referenceList?.filter((r) => r.type === "audio") ?? [];

    for (const refDef of config.mode) {
      if (typeof refDef === "string") {
        if (refDef.startsWith("imageReference:")) {
          const maxCount = parseInt(refDef.split(":")[1], 10);
          for (const ref of imageRefs.slice(0, maxCount)) {
            content.push({
              type: "image_url",
              image_url: { url: ref.base64 },
              role: "reference_image",
            });
          }
        } else if (refDef.startsWith("videoReference:")) {
          const maxCount = parseInt(refDef.split(":")[1], 10);
          for (const ref of videoRefs.slice(0, maxCount)) {
            content.push({
              type: "video_url",
              video_url: { url: ref.base64 },
              role: "reference_video",
            });
          }
        } else if (refDef.startsWith("audioReference:")) {
          const maxCount = parseInt(refDef.split(":")[1], 10);
          for (const ref of audioRefs.slice(0, maxCount)) {
            content.push({
              type: "audio_url",
              audio_url: { url: ref.base64 },
              role: "reference_audio",
            });
          }
        }
      }
    }
  }

  const body: any = {
    model: model.modelName,
    content,
    ratio: config.aspectRatio,
    duration: config.duration,
    resolution: config.resolution || "720p",
    watermark: false,
  };

  if (model.audio === "optional") {
    body.generate_audio = config.audio !== false;
  } else if (model.audio === true) {
    body.generate_audio = true;
  } else {
    body.generate_audio = false;
  }

  logger(`[Video generation] Submitting task, model: ${model.modelName}, duration: ${config.duration}s, resolution: ${config.resolution}`);
  const res = await fetch(`${baseUrl}/contents/generations/tasks`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create video generation task: ${errorText}`);
  }
  const createResponse = await res.json();
  logger(createResponse);
  const taskId = createResponse?.id;

  if (!taskId) {
    throw new Error("Failed to create video generation task: no task ID returned");
  }

  logger(`[Video generation] Task created, ID: ${taskId}`);

  const result = await pollTask(
    async (): Promise<PollResult> => {
      const queryRes = await fetch(`${baseUrl}/contents/generations/tasks/${taskId}`, {
        method: "GET",
        headers,
      });
      if (!queryRes.ok) {
        const errorText = await queryRes.text();
        throw new Error(`Failed to query video generation task status: ${errorText}`);
      }
      const task = await queryRes.json();

      logger(`[Video generation] Task status: ${JSON.stringify(task)}`);

      switch (task.status) {
        case "succeeded":
          if (task.content?.video_url) {
            return { completed: true, data: task.content.video_url };
          }
          return { completed: true, error: "Task succeeded but no video URL was returned" };
        case "failed":
          return { completed: true, error: task.error?.message || "Video generation failed" };
        case "expired":
          return { completed: true, error: "Video generation task timed out" };
        case "cancelled":
          return { completed: true, error: "Video generation task was cancelled" };
        default:
          return { completed: false };
      }
    },
    10000,
    600000 * 3,
  );

  if (result.error) {
    throw new Error(result.error);
  }

  return result.data!;
};

const ttsRequest = async (config: TTSConfig, model: TTSModel): Promise<string> => {
  return "";
};

const checkForUpdates = async (): Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }> => {
  return { hasUpdate: false, latestVersion: "2.0", notice: "" };
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
