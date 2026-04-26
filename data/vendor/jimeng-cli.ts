/**
 * 即梦官方 CLI (jimeng-cli-api wrapper) 供应商适配
 * @version 1.0
 *
 * 通过自部署 jimeng-cli-api wrapper 调用即梦官方 dreamina CLI（OAuth Device
 * Flow，账号合规，不会风控封号）。OpenAI 兼容 /v1/images/generations，返回
 * data:image/png;base64 形式。
 *
 * 仅文生图。image2image / image_upscale / 视频走后续 issue。
 *
 * 详见 opshub#92。
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
// 全局声明（沙盒注入）
// ============================================================
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

// ============================================================
// 供应商配置
// ============================================================
const vendor: VendorConfig = {
  id: "jimeng-cli",
  version: "1.0",
  author: "gog5-ops",
  name: "即梦 CLI (官方)",
  description:
    "通过自部署 jimeng-cli-api wrapper 调用即梦官方 dreamina CLI，OAuth Device Flow 登录，合规，不会风控封号。仅文生图，不需要 API key（容器内 OAuth 持久化）。",
  icon: "",
  inputs: [
    { key: "baseUrl", label: "baseURL（含 /v1）", type: "url", required: true, placeholder: "http://jimeng-cli-api:8000/v1" },
  ],
  inputValues: {
    baseUrl: "http://jimeng-cli-api:8000/v1",
  },
  models: [
    { name: "即梦 3.0 (1k)", modelName: "jimeng-3.0", type: "image", mode: ["text"] },
    { name: "即梦 4.0 (2k)", modelName: "jimeng-4.0", type: "image", mode: ["text"] },
    { name: "即梦 4.6 (2k)", modelName: "jimeng-4.6", type: "image", mode: ["text"] },
    { name: "即梦 5.0 (2k)", modelName: "jimeng-5.0", type: "image", mode: ["text"] },
  ],
};

// ============================================================
// 辅助
// ============================================================
function pickOpenAISize(_size: ImageConfig["size"], aspectRatio: ImageConfig["aspectRatio"]): string {
  // 跟 wrapper 端 _SIZE_TO_RATIO 对齐的子集；其他 ratio 走默认 1:1。
  const table: Record<string, string> = {
    "16:9": "1920x1080",
    "9:16": "1080x1920",
    "1:1": "1024x1024",
    "4:3": "1024x768",
    "3:4": "768x1024",
    "3:2": "1536x1024",
    "2:3": "1024x1536",
  };
  return table[aspectRatio] ?? "1024x1024";
}

// ============================================================
// 适配器函数
// ============================================================
const textRequest = (_model: TextModel, _think: boolean, _thinkLevel: 0 | 1 | 2 | 3) => {
  throw new Error("即梦 CLI 不支持文本对话，请用文生图模型");
};

const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
  const baseUrl = vendor.inputValues.baseUrl;
  const size = pickOpenAISize(config.size, config.aspectRatio);
  const body = {
    model: model.modelName,
    prompt: config.prompt,
    size,
    n: 1,
  };
  logger(`[imageRequest] jimeng-cli model=${model.modelName} size=${size}`);
  const response = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`即梦请求失败 ${response.status}: ${errorText}`);
  }
  const data = await response.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("响应缺少 b64_json");
  return `data:image/png;base64,${b64}`;
};

const videoRequest = async (_config: VideoConfig, _model: VideoModel): Promise<string> => {
  throw new Error("即梦 CLI image MVP 不支持视频；视频走单独 issue");
};

const ttsRequest = async (_config: TTSConfig, _model: TTSModel): Promise<string> => "";

const checkForUpdates = async () => ({ hasUpdate: false, latestVersion: "1.0", notice: "" });
const updateVendor = async () => "";

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
