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
  textRequest: (m: TextModel, t?: boolean, tl?: 0 | 1 | 2 | 3) => any;
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
  id: "bg",
  version: "2.0",
  author: "Toonflow",
  name: "百度BG多模态",
  description:
    "## 百度 VOD BG/Gemini 多模态接口\n\n支持 Gemini 原生格式的文本、多模态理解和图片生成。默认使用 API Key 鉴权地址 `https://vod.bj.baidubce.com/v3/chat/gc`。",
  inputs: [
    { key: "apiKey", label: "API密钥", type: "password", required: true, placeholder: "Bearer token，可直接粘贴 token 或 Bearer token" },
    { key: "baseUrl", label: "请求地址", type: "url", required: true, placeholder: "https://vod.bj.baidubce.com/v3/chat/gc" },
  ],
  inputValues: {
    apiKey: "",
    baseUrl: "https://vod.bj.baidubce.com/v3/chat/gc",
  },
  models: [
    { name: "Gemini 3.1 Pro Preview", modelName: "gemini-3.1-pro-preview", type: "text", think: true },
    { name: "Gemini 2.5 Pro", modelName: "gemini-2.5-pro", type: "text", think: true },
    { name: "Gemini 2.5 Flash", modelName: "gemini-2.5-flash", type: "text", think: true },
    { name: "Gemini 3 Flash Preview", modelName: "gemini-3-flash-preview", type: "text", think: true },
    { name: "Gemini 3.1 Flash Lite Preview", modelName: "gemini-3.1-flash-lite-preview", type: "text", think: false },
    { name: "Gemini 2.5 Flash Lite", modelName: "gemini-2.5-flash-lite", type: "text", think: false },
    { name: "Gemini 3.1 Flash Image Preview", modelName: "gemini-3.1-flash-image-preview", type: "image", mode: ["text", "singleImage", "multiReference"] },
    { name: "Gemini 3 Pro Image Preview", modelName: "gemini-3-pro-image-preview", type: "image", mode: ["text", "singleImage", "multiReference"] },
    { name: "Gemini 2.5 Flash Image", modelName: "gemini-2.5-flash-image", type: "image", mode: ["text", "singleImage", "multiReference"] },
  ],
};

// ============================================================
// 辅助工具
// ============================================================

const getBaseUrl = () => vendor.inputValues.baseUrl.replace(/\/+$/, "");

const getApiKey = () => vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");

const getHeaders = () => {
  return { Authorization: `Bearer ${getApiKey()}`, "Content-Type": "application/json" };
};

const getPlainBase64 = (base64: string) => {
  return base64.includes(",") ? base64.split(",").pop() || "" : base64;
};

const getImageMimeType = (base64: string) => {
  const match = base64.match(/^data:([^;]+);base64,/);
  return match?.[1] || "image/png";
};

const normalizeAspectRatio = (aspectRatio: string) => {
  const supportedMap: Record<string, string> = {
    "1:1": "1:1",
    "3:4": "3:4",
    "4:3": "4:3",
    "9:16": "9:16",
    "16:9": "16:9",
    "2:3": "2:3",
    "3:2": "3:2",
    "5:4": "5:4",
    "4:5": "4:5",
  };
  return supportedMap[aspectRatio] || aspectRatio;
};

const findGeneratedImage = (value: any): { mimeType: string; data: string } | null => {
  if (!value) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const result = findGeneratedImage(item);
      if (result) return result;
    }
    return null;
  }
  if (typeof value === "object") {
    const inlineData = value.inlineData ?? value.inline_data;
    if (inlineData?.data) {
      return { mimeType: inlineData.mimeType ?? inlineData.mime_type ?? "image/png", data: inlineData.data };
    }
    if (typeof value.text === "string") {
      const dataUrlMatch = value.text.match(/data:(image\/[^;]+);base64,([A-Za-z0-9+/=]+)/);
      if (dataUrlMatch) return { mimeType: dataUrlMatch[1], data: dataUrlMatch[2] };
    }
    for (const key of Object.keys(value)) {
      const result = findGeneratedImage(value[key]);
      if (result) return result;
    }
  }
  return null;
};

// ============================================================
// 适配器函数
// ============================================================

const textRequest = (model: TextModel, think?: boolean, thinkLevel?: 0 | 1 | 2 | 3) => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");
  return createGoogleGenerativeAI({
    baseURL: `${getBaseUrl()}/v1beta`,
    apiKey: getApiKey(),
    headers: { Authorization: `Bearer ${getApiKey()}` },
  }).chat(model.modelName);
};

const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");
  const parts: any[] = [];
  for (const ref of config.referenceList ?? []) {
    parts.push({
      inlineData: {
        mimeType: getImageMimeType(ref.base64),
        data: getPlainBase64(ref.base64),
      },
    });
  }
  parts.push({ text: config.prompt });

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 1,
      maxOutputTokens: 32768,
      responseModalities: ["TEXT", "IMAGE"],
      topP: 0.95,
      imageConfig: {
        aspectRatio: normalizeAspectRatio(config.aspectRatio),
        imageSize: config.size,
        imageOutputOptions: { mimeType: "image/png" },
        personGeneration: "ALLOW_ALL",
      },
      thinkingConfig: { thinkingLevel: "HIGH" },
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "OFF" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "OFF" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "OFF" },
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "OFF" },
    ],
  };

  logger(`开始提交BG图片生成请求，模型：${model.modelName}`);
  const response = await axios.post(`${getBaseUrl()}/v1beta/models/${model.modelName}:generateContent`, body, { headers: getHeaders() });
  const result = findGeneratedImage(response.data);
  if (!result?.data) {
    const text = response.data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("\n");
    throw new Error(text || "BG模型未返回图片数据");
  }
  return `data:${result.mimeType};base64,${getPlainBase64(result.data)}`;
};

const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
  return "";
};

const ttsRequest = async (config: TTSConfig, model: TTSModel): Promise<string> => {
  return "";
};

const checkForUpdates = async (): Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }> => {
  return { hasUpdate: false, latestVersion: "2.0", notice: "## 新版本更新公告\n当前版本基于 BG模型-多模态API文档适配。" };
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
