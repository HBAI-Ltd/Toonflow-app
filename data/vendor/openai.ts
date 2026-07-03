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
  imageBase64?: string[];
  audio?: boolean;
  mode: VideoMode[];
}
interface TTSConfig {
  text: string;
  voice: string;
  speechRate: number;
  pitchRate: number;
  volume: number;
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
  id: "openai",
  version: "2.0",
  author: "Toonflow",
  name: "OpenAI标准接口",
  description: "OpenAI标准格式接口，可修改请求地址并手动添加模型。",
  icon: "",
  inputs: [
    { key: "apiKey", label: "API密钥", type: "password", required: true },
    { key: "baseUrl", label: "请求地址", type: "url", required: true, placeholder: "以v1结束，示例：https://api.openai.com/v1" },
  ],
  inputValues: {
    apiKey: "",
    baseUrl: "https://api.openai.com/v1",
  },
  models: [
    { name: "GPT-4o", modelName: "gpt-4o", type: "text", think: false },
    { name: "GPT-4.1", modelName: "gpt-4.1", type: "text", think: false },
    { name: "GPT-5.1", modelName: "gpt-5.1", type: "text", think: false },
    { name: "GPT-5.2", modelName: "gpt-5.2", type: "text", think: false },
    { name: "GPT-5.4", modelName: "gpt-5.4", type: "text", think: false },
  ],
};
// ============================================================
// 适配器函数
// ============================================================
const textRequest = (model: TextModel, think: boolean, thinkLevel: 0 | 1 | 2 | 3) => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");
  const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
  return createOpenAI({ baseURL: vendor.inputValues.baseUrl, apiKey }).chat(model.modelName);
};
const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");
  const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
  const baseUrl = vendor.inputValues.baseUrl;
  const imageBase64List = (config.referenceList ?? []).map((r) => r.base64).filter(Boolean);

  // 分辨率映射
  const sizeMap: Record<string, Record<string, string>> = {
    "16:9": { "1K": "1024x576", "2K": "2048x1152", "4K": "4096x2304" },
    "9:16": { "1K": "576x1024", "2K": "1152x2048", "4K": "2304x4096" },
    "1:1": { "1K": "1024x1024", "2K": "2048x2048", "4K": "4096x4096" },
    "4:3": { "1K": "1024x768", "2K": "2048x1536", "4K": "4096x3072" },
    "3:4": { "1K": "768x1024", "2K": "1536x2048", "4K": "3072x4096" },
  };
  const size = sizeMap[config.aspectRatio]?.[config.size] ?? "1024x1024";

  const body: Record<string, any> = {
    model: model.modelName,
    prompt: config.prompt,
    n: 1,
    size: size,
    response_format: "b64_json",
  };

  logger(`[imageRequest] openai adapter, model: ${model.modelName}, size: ${size}`);
  const response = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`图片生成请求失败，状态码: ${response.status}, 错误信息: ${errorText}`);
  }

  const data = await response.json();

  if (data.data && data.data[0]) {
    if (data.data[0].b64_json) {
      return data.data[0].b64_json;
    }
    if (data.data[0].url) {
      return await urlToBase64(data.data[0].url);
    }
  }

  throw new Error("图片生成失败：未返回图片数据");
};
const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
  return "";
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