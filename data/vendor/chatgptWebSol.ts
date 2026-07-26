/**
 * ChatGPT 网页 GPT-5.6 SOL 供应商
 * @version 1.0
 */

interface TextModel {
  name: string;
  modelName: string;
  type: "text";
  think: boolean;
}

interface VendorConfig {
  id: string;
  version: string;
  name: string;
  author: string;
  description?: string;
  icon?: string;
  inputs: {
    key: string;
    label: string;
    type: "text" | "password" | "url";
    required: boolean;
    placeholder?: string;
  }[];
  inputValues: Record<string, string>;
  models: TextModel[];
}

interface ImageConfig {
  prompt: string;
  imageBase64: string[];
  size: "1K" | "2K" | "4K";
  aspectRatio: `${number}:${number}`;
}

interface ImageModel {
  name: string;
  modelName: string;
  type: "image";
}

interface VideoConfig {
  duration: number;
  resolution: string;
  aspectRatio: "16:9" | "9:16";
  prompt: string;
}

interface VideoModel {
  name: string;
  modelName: string;
  type: "video";
}

interface TTSConfig {
  text: string;
  voice: string;
  speechRate: number;
  pitchRate: number;
  volume: number;
}

interface TTSModel {
  name: string;
  modelName: string;
  type: "tts";
}

declare const createOpenAI: any;
declare const fetch: (input: any, init?: any) => Promise<any>;
declare const exports: {
  vendor: VendorConfig;
  textRequest: (model: TextModel, think: boolean, thinkLevel: 0 | 1 | 2 | 3) => any;
  imageRequest: (config: ImageConfig, model: ImageModel) => Promise<string>;
  videoRequest: (config: VideoConfig, model: VideoModel) => Promise<string>;
  ttsRequest: (config: TTSConfig, model: TTSModel) => Promise<string>;
  checkForUpdates: () => Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }>;
  updateVendor: () => Promise<string>;
};

const MODEL_NAME = "gpt-5.6-sol-wm";
const EXTREME_REASONING_EFFORT = "xhigh";

const vendor: VendorConfig = {
  id: "chatgptWebSol",
  version: "1.0",
  author: "Toonflow",
  name: "ChatGPT 网页 GPT-5.6 SOL",
  description: "通过本机 chatgpt2api 调用 ChatGPT 网页 GPT-5.6 SOL，固定使用极高推理强度。",
  icon: "",
  inputs: [
    {
      key: "apiKey",
      label: "代理 API Key",
      type: "password",
      required: true,
      placeholder: "填写 CHATGPT2API_AUTH_KEY",
    },
    {
      key: "baseUrl",
      label: "请求地址",
      type: "url",
      required: true,
      placeholder: "示例：http://127.0.0.1:5173/v1",
    },
  ],
  inputValues: {
    apiKey: "",
    baseUrl: "http://127.0.0.1:5173/v1",
  },
  models: [
    {
      name: "GPT-5.6 SOL（极高）",
      modelName: MODEL_NAME,
      type: "text",
      think: true,
    },
  ],
};

function normalizeBaseUrl(value: string): string {
  let baseUrl = (value || "").trim().replace(/\/+$/, "");
  if (!baseUrl) throw new Error("缺少请求地址");
  if (!/^https?:\/\//i.test(baseUrl)) throw new Error("请求地址必须使用 http:// 或 https://");

  baseUrl = baseUrl.replace(/\/chat\/completions$/i, "");
  if (!/\/v1$/i.test(baseUrl)) baseUrl = `${baseUrl}/v1`;
  return baseUrl;
}

const fetchWithExtremeReasoning = async (input: any, init?: any): Promise<any> => {
  if (typeof init?.body !== "string") {
    throw new Error("ChatGPT 网页文本请求缺少 JSON 请求体");
  }

  let body: Record<string, any>;
  try {
    body = JSON.parse(init.body);
  } catch {
    throw new Error("ChatGPT 网页文本请求体不是有效 JSON");
  }

  return fetch(input, {
    ...init,
    body: JSON.stringify({
      ...body,
      reasoning_effort: EXTREME_REASONING_EFFORT,
    }),
  });
};

const textRequest = (model: TextModel, _think: boolean, _thinkLevel: 0 | 1 | 2 | 3) => {
  const apiKey = (vendor.inputValues.apiKey || "").trim().replace(/^Bearer\s+/i, "");
  if (!apiKey) throw new Error("缺少代理 API Key");

  return createOpenAI({
    baseURL: normalizeBaseUrl(vendor.inputValues.baseUrl),
    apiKey,
    fetch: fetchWithExtremeReasoning,
  }).chat(model.modelName);
};

const imageRequest = async (_config: ImageConfig, _model: ImageModel): Promise<string> => "";

const videoRequest = async (_config: VideoConfig, _model: VideoModel): Promise<string> => "";

const ttsRequest = async (_config: TTSConfig, _model: TTSModel): Promise<string> => "";

const checkForUpdates = async (): Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }> => ({
  hasUpdate: false,
  latestVersion: vendor.version,
  notice: "",
});

const updateVendor = async (): Promise<string> => "";

exports.vendor = vendor;
exports.textRequest = textRequest;
exports.imageRequest = imageRequest;
exports.videoRequest = videoRequest;
exports.ttsRequest = ttsRequest;
exports.checkForUpdates = checkForUpdates;
exports.updateVendor = updateVendor;

export {};
