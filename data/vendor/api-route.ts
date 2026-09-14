/**
 * Toonflow AI供应商模板 - API Route
 * @version 1.0
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

interface ImageConfig {
  prompt: string;
  imageBase64: string[];
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
  id: "api-route",
  version: "1.0",
  author: "API Route",
  name: "API Route",
  description:
    "API Route 高并发 AI 网关适配，支持 Claude、GPT-4o、DeepSeek、Gemini 等主流大语言模型，赋能 AI 剧本生成与分镜创意。\n\n[访问官网](https://www.api-route.com)",
  icon: "",
  inputs: [
    { key: "apiKey", label: "API密钥", type: "password", required: true, placeholder: "请输入 API Route API Key (sk-...)" },
    { key: "baseUrl", label: "请求地址", type: "url", required: true, placeholder: "示例：https://global.api-route.com/v1" },
  ],
  inputValues: {
    apiKey: "",
    baseUrl: "https://global.api-route.com/v1",
  },
  models: [
    { name: "Claude 3.7 Sonnet", modelName: "claude-sonnet-4-5", type: "text", think: true },
    { name: "Claude 3.5 Haiku", modelName: "claude-haiku-4-5", type: "text", think: false },
    { name: "GPT-4o", modelName: "gpt-4o", type: "text", think: false },
    { name: "GPT-4o Mini", modelName: "gpt-4o-mini", type: "text", think: false },
    { name: "DeepSeek Chat (V3)", modelName: "deepseek-chat", type: "text", think: false },
    { name: "DeepSeek Reasoner (R1)", modelName: "deepseek-reasoner", type: "text", think: true },
    { name: "Gemini 2.5 Pro", modelName: "gemini-2.5-pro", type: "text", think: true },
    { name: "Gemini 2.5 Flash", modelName: "gemini-2.5-flash", type: "text", think: false },
  ],
};

// ============================================================
// 适配器函数
// ============================================================

const textRequest = (model: TextModel, think: boolean, thinkLevel: 0 | 1 | 2 | 3) => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少 API Key");
  const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");

  const effortMap: Record<0 | 1 | 2 | 3, "low" | "medium" | "high" | "high"> = {
    0: "low",
    1: "low",
    2: "medium",
    3: "high",
  };

  const enableThinking = model.think && think;
  const extraBody: Record<string, any> = {};
  if (enableThinking) {
    extraBody.thinking = { type: "enabled" };
    extraBody.reasoning_effort = effortMap[thinkLevel];
  }

  return createOpenAICompatible({
    name: "api-route",
    baseURL: vendor.inputValues.baseUrl,
    apiKey,
    fetch: async (url: string, options?: RequestInit) => {
      const rawBody = JSON.parse((options?.body as string) ?? "{}");
      const modifiedBody = {
        ...rawBody,
        ...extraBody,
      };
      return await fetch(url, {
        ...options,
        body: JSON.stringify(modifiedBody),
      });
    },
  }).chatModel(model.modelName);
};

const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
  return "";
};

const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
  return "";
};

const ttsRequest = async (config: TTSConfig, model: TTSModel): Promise<string> => {
  return "";
};

const checkForUpdates = async (): Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }> => {
  return { hasUpdate: false, latestVersion: "1.0", notice: "" };
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
