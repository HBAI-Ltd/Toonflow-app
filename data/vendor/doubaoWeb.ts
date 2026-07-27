/**
 * Toonflow 豆包网页视频供应商
 * @version 2.1
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
}

interface VideoModel {
  name: string;
  modelName: string;
  type: "video";
  mode: VideoMode[];
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
  inputs: {
    key: string;
    label: string;
    type: "text" | "password" | "url";
    required: boolean;
    placeholder?: string;
  }[];
  inputValues: Record<string, string>;
  models: (TextModel | ImageModel | VideoModel | TTSModel)[];
}

type ReferenceList =
  | { type: "image"; base64: string }
  | { type: "audio"; base64: string }
  | { type: "video"; base64: string };

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
  mode: VideoMode[] | VideoMode;
}

interface TTSConfig {
  text: string;
  voice: string;
  speechRate: number;
  pitchRate: number;
  volume: number;
  referenceList?: Extract<ReferenceList, { type: "audio" }>[];
}

declare const fetch: (url: string, init?: Record<string, any>) => Promise<any>;
declare const logger: (message: any) => void;
declare const exports: {
  vendor: VendorConfig;
  textRequest: (model: TextModel, think: boolean, thinkLevel: 0 | 1 | 2 | 3) => any;
  imageRequest: (config: ImageConfig, model: ImageModel) => Promise<string>;
  videoRequest: (config: VideoConfig, model: VideoModel) => Promise<string>;
  ttsRequest: (config: TTSConfig, model: TTSModel) => Promise<string>;
  checkForUpdates?: () => Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }>;
  updateVendor?: () => Promise<string>;
};

const vendor: VendorConfig = {
  id: "doubaoWeb",
  version: "2.1",
  author: "Toonflow",
  name: "豆包网页视频",
  description:
    "通过 doubao2api 调用已登录的豆包网页多图参考视频能力。必须上传 1 至 10 张参考图；请先启动 doubao2api 并完成豆包扫码登录。",
  inputs: [
    {
      key: "baseUrl",
      label: "doubao2api 服务地址",
      type: "url",
      required: true,
      placeholder: "http://127.0.0.1:9090",
    },
    {
      key: "apiKey",
      label: "API Key（可选）",
      type: "password",
      required: false,
      placeholder: "仅在 doubao2api 配置了 API Key 时填写",
    },
  ],
  inputValues: {
    baseUrl: "http://127.0.0.1:9090",
    apiKey: "",
  },
  models: [
    {
      name: "豆包网页多图视频生成（自动路由）",
      modelName: "doubao-video",
      type: "video",
      mode: [["imageReference:10"]],
      audio: false,
      durationResolutionMap: [{ duration: [5], resolution: ["自动"] }],
    },
  ],
};

function getEndpoint(): string {
  const baseUrl = (vendor.inputValues.baseUrl || "").trim().replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("缺少 doubao2api 服务地址");
  }
  if (baseUrl.endsWith("/v1/video/generations")) {
    return baseUrl;
  }
  return `${baseUrl}/v1/video/generations`;
}

function getErrorMessage(data: any, fallback: string): string {
  return (
    data?.error?.message ||
    data?.error ||
    data?.detail ||
    data?.message ||
    data?.msg ||
    fallback
  );
}

function toImageInput(
  reference: Extract<ReferenceList, { type: "image" }>,
  index: number,
): { b64_json: string; filename: string; mime_type: string } {
  const value = (reference.base64 || "").trim();
  if (!value) {
    throw new Error(`第 ${index + 1} 张参考图内容为空`);
  }

  const dataUrlMatch = value.match(
    /^data:(image\/[a-z0-9.+-]+);base64,([\s\S]+)$/i,
  );
  if (value.startsWith("data:") && !dataUrlMatch) {
    throw new Error(`第 ${index + 1} 张参考图 Data URI 格式无效`);
  }

  const mimeType = dataUrlMatch?.[1].toLowerCase() || "image/png";
  const base64 = (dataUrlMatch?.[2] || value).replace(/\s+/g, "");
  const subtype = mimeType.split("/")[1]?.toLowerCase() || "png";
  const extension =
    subtype === "jpeg"
      ? "jpg"
      : subtype.replace(/[^a-z0-9]/g, "") || "png";
  return {
    b64_json: base64,
    filename: `reference-${index + 1}.${extension}`,
    mime_type: mimeType,
  };
}

const textRequest = (_model: TextModel, _think: boolean, _thinkLevel: 0 | 1 | 2 | 3) => {
  throw new Error("豆包网页视频供应商不支持文本对话");
};

const imageRequest = async (_config: ImageConfig, _model: ImageModel): Promise<string> => {
  throw new Error("豆包网页视频供应商不支持图片生成");
};

const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
  const prompt = (config.prompt || "").trim();
  if (!prompt) {
    throw new Error("视频提示词不能为空");
  }
  const references = config.referenceList || [];
  if (references.some((reference) => reference.type !== "image")) {
    throw new Error("豆包多图视频仅支持图片参考");
  }
  const imageReferences = references as Extract<
    ReferenceList,
    { type: "image" }
  >[];
  if (imageReferences.length === 0) {
    throw new Error("请至少上传 1 张参考图");
  }
  if (imageReferences.length > 10) {
    throw new Error("最多上传 10 张参考图");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const apiKey = (vendor.inputValues.apiKey || "").trim().replace(/^Bearer\s+/i, "");
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const endpoint = getEndpoint();
  const body = {
    model: model.modelName,
    prompt,
    ratio: config.aspectRatio || "16:9",
    images: imageReferences.map(toImageInput),
  };
  logger(
    `[豆包网页视频] 提交多图请求: model=${model.modelName}, ratio=${body.ratio}, images=${body.images.length}`,
  );

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const responseText = await response.text();
  let data: any = {};
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      if (!response.ok) {
        throw new Error(`豆包视频生成请求失败 (${response.status}): ${responseText}`);
      }
      throw new Error("豆包视频生成响应不是有效的 JSON");
    }
  }

  if (!response.ok) {
    const detail = getErrorMessage(data, response.statusText || "未知错误");
    if (/710022004|rate limited/i.test(String(detail))) {
      throw new Error("豆包触发人工验证，请在 doubao2api 托管浏览器中完成验证或重新登录后再试");
    }
    throw new Error(`豆包视频生成请求失败 (${response.status}): ${detail}`);
  }

  const videoUrl = data?.data?.[0]?.video_url;
  if (typeof videoUrl !== "string" || !videoUrl.startsWith("http")) {
    const detail = getErrorMessage(data, "未返回视频地址");
    throw new Error(`豆包视频生成失败: ${detail}`);
  }

  logger("[豆包网页视频] 视频生成成功");
  return videoUrl;
};

const ttsRequest = async (_config: TTSConfig, _model: TTSModel): Promise<string> => {
  throw new Error("豆包网页视频供应商不支持语音生成");
};

const checkForUpdates = async (): Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }> => {
  return { hasUpdate: false, latestVersion: vendor.version, notice: "" };
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
