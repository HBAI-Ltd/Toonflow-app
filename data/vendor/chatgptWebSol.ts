/**
 * ChatGPT 网页 GPT-5.6 SOL + Image2 供应商
 * @version 1.1
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
  models: (TextModel | ImageModel)[];
}

type ReferenceList = {
  type: "image";
  sourceType?: "base64";
  base64: string;
};

interface ImageConfig {
  prompt: string;
  referenceList?: ReferenceList[];
  size: "1K" | "2K" | "4K";
  aspectRatio: `${number}:${number}`;
}

interface ImageModel {
  name: string;
  modelName: string;
  type: "image";
  mode: ("text" | "singleImage" | "multiReference")[];
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
const IMAGE_MODEL_NAME = "gpt-image-2";
const EXTREME_REASONING_EFFORT = "xhigh";

const vendor: VendorConfig = {
  id: "chatgptWebSol",
  version: "1.1",
  author: "Toonflow",
  name: "ChatGPT 网页 GPT-5.6 SOL + Image2",
  description:
    "通过本机 chatgpt2api 调用 ChatGPT 网页 GPT-5.6 SOL（固定极高推理强度）与 GPT Image 2 图片生成能力。",
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
      placeholder: "示例：http://127.0.0.1:8000/v1",
    },
  ],
  inputValues: {
    apiKey: "",
    baseUrl: "http://127.0.0.1:8000/v1",
  },
  models: [
    {
      name: "GPT-5.6 SOL（极高）",
      modelName: MODEL_NAME,
      type: "text",
      think: true,
    },
    {
      name: "GPT Image 2",
      modelName: IMAGE_MODEL_NAME,
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
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

function imageSizeForRatio(aspectRatio: string): string {
  const [widthValue, heightValue] = aspectRatio.split(":").map(Number);
  if (!Number.isFinite(widthValue) || !Number.isFinite(heightValue) || heightValue <= 0) {
    return "1024x1024";
  }
  const ratio = widthValue / heightValue;
  if (ratio > 1.1) return "1536x1024";
  if (ratio < 0.9) return "1024x1536";
  return "1024x1024";
}

function toImageInput(reference: ReferenceList, index: number) {
  const value = (reference.base64 || "").trim();
  const dataUrlMatch = value.match(/^data:([^;]+);base64,([\s\S]+)$/i);
  const mimeType = dataUrlMatch?.[1] || "image/png";
  const base64 = dataUrlMatch?.[2] || value;
  const subtype = mimeType.split("/")[1]?.toLowerCase() || "png";
  const extension = subtype === "jpeg" ? "jpg" : subtype.replace(/[^a-z0-9]/g, "") || "png";
  return {
    b64_json: base64,
    filename: `reference-${index + 1}.${extension}`,
    mime_type: mimeType,
  };
}

function imageErrorMessage(data: any, fallback: string): string {
  const candidates = [
    data?.error?.message,
    data?.error,
    data?.detail?.error?.message,
    data?.detail?.error,
    data?.detail?.message,
    data?.detail,
    data?.message,
  ];
  const message = candidates.find((value) => typeof value === "string" && value.trim());
  return message || fallback;
}

const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
  const apiKey = (vendor.inputValues.apiKey || "").trim().replace(/^Bearer\s+/i, "");
  if (!apiKey) throw new Error("缺少代理 API Key");

  const prompt = (config.prompt || "").trim();
  if (!prompt) throw new Error("图片提示词不能为空");

  const references = (config.referenceList || []).filter(
    (reference) => reference?.type === "image" && reference.base64?.trim(),
  );
  const endpoint = references.length > 0 ? "images/edits" : "images/generations";
  const body: Record<string, any> = {
    model: model.modelName,
    prompt,
    n: 1,
    size: imageSizeForRatio(config.aspectRatio),
    quality: "auto",
    response_format: "b64_json",
  };
  if (references.length > 0) {
    body.images = references.map(toImageInput);
  }

  const response = await fetch(`${normalizeBaseUrl(vendor.inputValues.baseUrl)}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error(`图片生成请求失败：服务返回了无效 JSON（HTTP ${response.status}）`);
  }
  if (!response.ok) {
    throw new Error(
      `图片生成请求失败（HTTP ${response.status}）：${imageErrorMessage(data, response.statusText)}`,
    );
  }

  const firstImage = data?.data?.[0];
  if (typeof firstImage?.b64_json === "string" && firstImage.b64_json) {
    return firstImage.b64_json.startsWith("data:")
      ? firstImage.b64_json
      : `data:image/png;base64,${firstImage.b64_json}`;
  }
  if (typeof firstImage?.url === "string" && firstImage.url) {
    return firstImage.url;
  }
  throw new Error("图片生成成功但未返回图片数据");
};

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
