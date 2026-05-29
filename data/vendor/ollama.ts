/**
 * Toonflow AI供应商模板 - Ollama 本地模型
 * @version 1.0
 *
 * 说明：
 * 1) 连接本地 Ollama 服务，使用 OpenAI 兼容接口
 * 2) 默认地址 http://localhost:11434/v1
 * 3) Ollama 不需要 API Key，填任意值即可（如 "ollama"）
 * 4) 仅支持文本模型，不支持图片/视频/TTS
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

// ============================================================
// 全局声明
// ============================================================

declare const axios: any;
declare const logger: (msg: string) => void;
declare const createOpenAICompatible: any;
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
  id: "ollama",
  version: "1.0",
  author: "Local AI",
  name: "Ollama 本地模型",
  description:
    "连接本地 Ollama 服务，无需联网，无需付费 API。\n\n1. 安装 Ollama：https://ollama.com/download\n2. 拉取模型：ollama pull qwen3:8b\n3. 启动后默认地址 http://localhost:11434\n4. API Key 填任意值即可（如 ollama）",
  inputs: [
    { key: "apiKey", label: "API密钥", type: "password", required: true, placeholder: "填任意值即可，如 ollama" },
    { key: "baseUrl", label: "请求地址", type: "url", required: true, placeholder: "http://localhost:11434/v1" },
  ],
  inputValues: {
    apiKey: "ollama",
    baseUrl: "http://localhost:11434/v1",
  },
  models: [
    { name: "Qwen3 8B", modelName: "qwen3:8b", type: "text", think: true },
    { name: "Qwen2.5 7B", modelName: "qwen2.5:7b", type: "text", think: false },
    { name: "Qwen2.5 Coder", modelName: "qwen2.5-coder:latest", type: "text", think: false },
    { name: "Llama 3.1", modelName: "llama3.1:latest", type: "text", think: false },
    { name: "Llama 3", modelName: "llama3:latest", type: "text", think: false },
  ],
};

// ============================================================
// 适配器函数
// ============================================================

const textRequest = (model: TextModel, think: boolean, thinkLevel: 0 | 1 | 2 | 3) => {
  const baseUrl = vendor.inputValues.baseUrl.replace(/\/+$/, "");
  const apiKey = vendor.inputValues.apiKey || "ollama";

  return createOpenAICompatible({
    name: "ollama",
    baseURL: baseUrl,
    apiKey,
  }).chatModel(model.modelName);
};

const imageRequest = async (_config: ImageConfig, _model: ImageModel): Promise<string> => {
  return "";
};

const videoRequest = async (_config: VideoConfig, _model: VideoModel): Promise<string> => {
  return "";
};

const ttsRequest = async (_config: TTSConfig, _model: TTSModel): Promise<string> => {
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
