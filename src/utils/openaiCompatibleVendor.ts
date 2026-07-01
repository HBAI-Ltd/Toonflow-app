import crypto from "node:crypto";

export interface OpenAICompatibleVendorOptions {
  baseUrl: string;
  id?: string;
  name?: string;
  author?: string;
  defaultModel?: string;
}

export function normalizeOpenAICompatibleBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  const url = new URL(trimmed);
  const pathname = url.pathname.replace(/\/+$/, "");

  if (!/\/v\d+(?:beta)?$/i.test(pathname)) {
    url.pathname = `${pathname}/v1`.replace(/\/{2,}/g, "/");
  } else {
    url.pathname = pathname || "/";
  }

  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/+$/, "");
}

export function isOpenAICompatibleBaseUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function vendorIdFromBaseUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  const raw = `${url.hostname}${url.pathname}`
    .replace(/\/v\d+(?:beta)?$/i, "")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  const slug = raw || "custom";
  const hash = crypto.createHash("sha1").update(baseUrl).digest("hex").slice(0, 8);
  return `openai_${slug}_${hash}`.slice(0, 64);
}

function displayNameFromBaseUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  return `${url.hostname} OpenAI Compatible`;
}

function q(value: string): string {
  return JSON.stringify(value);
}

export function generateOpenAICompatibleVendorCode(options: OpenAICompatibleVendorOptions): string {
  const baseUrl = normalizeOpenAICompatibleBaseUrl(options.baseUrl);
  const id = options.id?.trim() || vendorIdFromBaseUrl(baseUrl);
  const name = options.name?.trim() || displayNameFromBaseUrl(baseUrl);
  const author = options.author?.trim() || "OpenAI Compatible";
  const defaultModel = options.defaultModel?.trim() || "gpt-4o";

  return `/**
 * Toonflow AI provider - OpenAI compatible endpoint
 * Generated from ${baseUrl}
 * @version 2.0
 */

type VideoMode =
  | "singleImage"
  | "startEndRequired"
  | "endFrameOptional"
  | "startFrameOptional"
  | "text"
  | (\`videoReference:\${number}\` | \`imageReference:\${number}\` | \`audioReference:\${number}\`)[];

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
  aspectRatio: \`\${number}:\${number}\`;
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

const vendor: VendorConfig = {
  id: ${q(id)},
  version: "2.0",
  author: ${q(author)},
  name: ${q(name)},
  description: "OpenAI compatible text endpoint. Configure API key, base URL, and add the exact model ids exposed by your relay.",
  icon: "",
  inputs: [
    { key: "apiKey", label: "API密钥", type: "password", required: true },
    { key: "baseUrl", label: "请求地址", type: "url", required: true, placeholder: ${q(baseUrl)} },
  ],
  inputValues: {
    apiKey: "",
    baseUrl: ${q(baseUrl)},
  },
  models: [{ name: ${q(defaultModel)}, modelName: ${q(defaultModel)}, type: "text", think: false }],
};

const normalizeBaseUrl = (baseUrl: string) => {
  const trimmed = (baseUrl || "").trim().replace(/\\/+$/, "");
  if (!trimmed) return ${q(baseUrl)};
  return /\\/v\\d+(?:beta)?$/i.test(trimmed) ? trimmed : \`\${trimmed}/v1\`;
};

const textRequest = (model: TextModel, _think: boolean, _thinkLevel: 0 | 1 | 2 | 3) => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");
  const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\\s+/i, "");
  return createOpenAICompatible({
    name: vendor.id,
    baseURL: normalizeBaseUrl(vendor.inputValues.baseUrl),
    apiKey,
  }).chatModel(model.modelName);
};

const imageRequest = async (_config: ImageConfig, _model: ImageModel): Promise<string> => {
  throw new Error("该 OpenAI 兼容供应商当前仅支持文本模型。如需图片或视频，请在模型服务中添加专用供应商适配。");
};

const videoRequest = async (_config: VideoConfig, _model: VideoModel): Promise<string> => {
  throw new Error("该 OpenAI 兼容供应商当前仅支持文本模型。如需图片或视频，请在模型服务中添加专用供应商适配。");
};

const ttsRequest = async (_config: TTSConfig, _model: TTSModel): Promise<string> => "";

const checkForUpdates = async (): Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }> => {
  return { hasUpdate: false, latestVersion: vendor.version, notice: "" };
};

const updateVendor = async (): Promise<string> => "";

exports.vendor = vendor;
exports.textRequest = textRequest;
exports.imageRequest = imageRequest;
exports.videoRequest = videoRequest;
exports.ttsRequest = ttsRequest;
exports.checkForUpdates = checkForUpdates;
exports.updateVendor = updateVendor;

export {};
`;
}

