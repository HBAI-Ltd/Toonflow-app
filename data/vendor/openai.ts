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
interface ImageConfig {
  prompt: string;
  referenceList?: { type: "image"; base64: string }[];
  imageBase64?: string[];
  size: "1K" | "2K" | "4K";
  aspectRatio: `${number}:${number}`;
}
type ReferenceList = { type: "image"; base64: string } | { type: "audio"; base64: string } | { type: "video"; base64: string };
interface VideoConfig {
  duration: number;
  resolution: string;
  aspectRatio: "16:9" | "9:16";
  prompt: string;
  referenceList?: ReferenceList[];
  audio?: boolean;
  mode: VideoMode;
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
  if (!vendor.inputValues.baseUrl) throw new Error("缺少请求地址");

  const referenceImages = config.referenceList ?? [];
  if (referenceImages.length > 0 || (config.imageBase64?.length ?? 0) > 0) {
    throw new Error("OpenAI图片生成暂不支持参考图，请使用纯文本提示词");
  }

  const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
  const baseUrl = vendor.inputValues.baseUrl.replace(/\/+$/, "");
  const [ratioWidth, ratioHeight] = config.aspectRatio.split(":").map(Number);
  const orientation = ratioWidth === ratioHeight ? "square" : ratioWidth > ratioHeight ? "landscape" : "portrait";
  const imageSize = model.modelName === "dall-e-3"
    ? { square: "1024x1024", landscape: "1792x1024", portrait: "1024x1792" }[orientation]
    : model.modelName.startsWith("gpt-image")
      ? { square: "1024x1024", landscape: "1536x1024", portrait: "1024x1536" }[orientation]
      : "1024x1024";

  try {
    const response = await axios.post(
      `${baseUrl}/images/generations`,
      {
        model: model.modelName,
        prompt: config.prompt,
        n: 1,
        size: imageSize,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const firstImage = response.data?.data?.[0];
    if (typeof firstImage?.b64_json === "string" && firstImage.b64_json.length > 0) {
      return firstImage.b64_json;
    }
    if (typeof firstImage?.url === "string" && firstImage.url.length > 0) {
      return await urlToBase64(firstImage.url);
    }
    throw new Error("接口未返回 b64_json 或图片URL");
  } catch (e: any) {
    const message = e?.response?.data?.error?.message ?? e?.response?.data?.message ?? e?.message ?? String(e);
    throw new Error(`OpenAI图片生成失败：${message}`);
  }
};
const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");
  if (!vendor.inputValues.baseUrl) throw new Error("缺少请求地址");

  const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
  const baseUrl = vendor.inputValues.baseUrl.replace(/\/+$/, "");
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  const references = config.referenceList ?? [];
  const imageReferences = references.filter((reference) => reference.type === "image");
  const videoReferences = references.filter((reference) => reference.type === "video");
  const audioReferences = references.filter((reference) => reference.type === "audio");

  if (audioReferences.length > 0) {
    throw new Error("OpenAI视频接口不支持音频参考");
  }
  if (videoReferences.length > 1) {
    throw new Error("OpenAI视频编辑仅支持一个视频参考");
  }
  if (videoReferences.length > 0 && imageReferences.length > 0) {
    throw new Error("OpenAI视频接口不能同时使用图片和视频参考");
  }

  const body: Record<string, any> = {
    model: model.modelName,
    prompt: config.prompt,
  };
  let endpoint = `${baseUrl}/videos/generations`;

  if (videoReferences.length === 1) {
    endpoint = `${baseUrl}/videos/edits`;
    body.video = { url: videoReferences[0].base64 };
  } else {
    const resolution = config.resolution.endsWith("p") ? config.resolution : `${config.resolution}p`;
    body.duration = config.duration;
    body.aspect_ratio = config.aspectRatio;
    body.resolution = resolution;

    if (Array.isArray(config.mode)) {
      if (imageReferences.length === 0) throw new Error("OpenAI参考生视频需要至少一张参考图");
      if (imageReferences.length > 7) throw new Error("OpenAI参考生视频最多支持七张参考图");
      body.reference_images = imageReferences.map((reference) => ({ url: reference.base64 }));
    } else if (config.mode === "startEndRequired") {
      throw new Error("OpenAI视频接口不支持首尾帧模式");
    } else if (["singleImage", "startFrameOptional", "endFrameOptional"].includes(config.mode)) {
      if (imageReferences.length > 1) throw new Error("OpenAI图生视频仅支持一张起始图");
      if (config.mode === "singleImage" && imageReferences.length === 0) throw new Error("OpenAI图生视频需要一张起始图");
      if (imageReferences.length === 1) body.image = { url: imageReferences[0].base64 };
    } else if (imageReferences.length > 0) {
      throw new Error("OpenAI文生视频模式不支持参考图");
    }
  }

  const extractErrorMessage = (value: any): string =>
    value?.response?.data?.error?.message ??
    value?.response?.data?.message ??
    value?.error?.message ??
    value?.message ??
    String(value);

  let createResponse: any;
  try {
    createResponse = await axios.post(endpoint, body, { headers });
  } catch (e: any) {
    throw new Error(`OpenAI视频生成任务创建失败：${extractErrorMessage(e)}`);
  }

  const requestId = createResponse.data?.request_id;
  if (typeof requestId !== "string" || requestId.length === 0) {
    throw new Error("OpenAI视频生成任务创建失败：未返回 request_id");
  }
  logger(`OpenAI视频任务已创建，ID：${requestId}`);

  const pollResult = await pollTask(
    async (): Promise<PollResult> => {
      let queryResponse: any;
      try {
        queryResponse = await axios.get(`${baseUrl}/videos/${requestId}`, { headers });
      } catch (e: any) {
        return { completed: true, error: `查询OpenAI视频任务失败：${extractErrorMessage(e)}` };
      }

      if (queryResponse.status === 202) return { completed: false };
      const data = queryResponse.data;
      const status = data?.status;
      const videoUrl = data?.video?.url;
      logger(`OpenAI视频任务状态：${status ?? "pending"}`);

      if (status === "done" || (!status && typeof videoUrl === "string" && videoUrl.length > 0)) {
        if (data?.video?.respect_moderation === false) {
          return { completed: true, error: "OpenAI视频生成因内容安全策略被拦截" };
        }
        if (typeof videoUrl !== "string" || videoUrl.length === 0) {
          return { completed: true, error: "OpenAI视频任务已完成但未返回视频URL" };
        }
        return { completed: true, data: videoUrl };
      }
      if (status === "failed" || status === "expired") {
        const message = data?.error?.message ?? data?.error?.code ?? `视频任务状态为 ${status}`;
        return { completed: true, error: message };
      }
      return { completed: false };
    },
    5000,
    600000,
  );

  if (pollResult.error) throw new Error(`OpenAI视频生成失败：${pollResult.error}`);
  if (typeof pollResult.data !== "string" || pollResult.data.length === 0) {
    throw new Error("OpenAI视频生成失败：轮询未返回视频URL");
  }
  return pollResult.data;
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
