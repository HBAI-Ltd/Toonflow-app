/**
 * Toonflow AI vendor template - MiniMax
 * @version 2.2
 */

// ============================================================
// Type definitions
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
  thinking?: ("adaptive" | "disabled" | "always_on")[];
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
// Global declarations
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
  uploadReference: (base64: string, fileType: "image" | "audio" | "video") => Promise<ReferenceList>;
  imageRequest: (c: ImageConfig, m: ImageModel) => Promise<string>;
  videoRequest: (c: VideoConfig, m: VideoModel) => Promise<string>;
  ttsRequest: (c: TTSConfig, m: TTSModel) => Promise<string>;
  checkForUpdates?: () => Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }>;
  updateVendor?: () => Promise<string>;
};

// ============================================================
// Vendor configuration
// ============================================================

const vendor: VendorConfig = {
  id: "minimax",
  version: "2.2",
  author: "Toonflow",
  name: "MiniMax",
  description:
    "Official text and media integration with selectable regional endpoints and OpenAI-compatible or Anthropic-compatible text protocols. [Global documentation](https://platform.minimax.io/docs) [China documentation](https://platform.minimaxi.com/docs)",
  inputs: [
    { key: "apiKey", label: "API key", type: "password", required: true },
    { key: "baseUrl", label: "Custom API base URL", type: "url", required: false, placeholder: "Optional custom API root" },
    { key: "region", label: "Region", type: "text", required: true, placeholder: "global_en or cn_zh" },
    { key: "protocol", label: "Text protocol", type: "text", required: true, placeholder: "openai or anthropic" },
  ],
  inputValues: { apiKey: "", baseUrl: "", region: "global_en", protocol: "openai" },
  models: [
    // Text models
    { name: "MiniMax M3", modelName: "MiniMax-M3", type: "text", think: true, thinking: ["adaptive", "disabled"] },
    { name: "MiniMax M2.7", modelName: "MiniMax-M2.7", type: "text", think: true, thinking: ["always_on"] },
    { name: "MiniMax M2.7 High-Speed (Reasoning)", modelName: "MiniMax-M2.7-highspeed", type: "text", think: true },
    { name: "MiniMax M2.5 (Reasoning)", modelName: "MiniMax-M2.5", type: "text", think: true },
    { name: "MiniMax M2.5 High-Speed (Reasoning)", modelName: "MiniMax-M2.5-highspeed", type: "text", think: true },
    { name: "MiniMax M2.1 (Coding)", modelName: "MiniMax-M2.1", type: "text", think: true },
    { name: "MiniMax M2.1 High-Speed (Coding)", modelName: "MiniMax-M2.1-highspeed", type: "text", think: true },
    { name: "MiniMax M2 (Agent)", modelName: "MiniMax-M2", type: "text", think: false },
    // Image models
    { name: "Hailuo Image V1", modelName: "image-01", type: "image", mode: ["text", "singleImage"] },
    { name: "Hailuo Image V1 Live", modelName: "image-01-live", type: "image", mode: ["text", "singleImage"], associationSkills: "Supports custom styles" },
    // Video models
    {
      name: "Hailuo 2.3",
      modelName: "MiniMax-Hailuo-2.3",
      type: "video",
      mode: ["text", "singleImage"],
      audio: false,
      durationResolutionMap: [
        { duration: [6], resolution: ["768P", "1080P"] },
        { duration: [10], resolution: ["768P"] },
      ],
    },
    {
      name: "Hailuo 2.3 Fast",
      modelName: "MiniMax-Hailuo-2.3-Fast",
      type: "video",
      mode: ["text", "singleImage"],
      audio: false,
      durationResolutionMap: [
        { duration: [6], resolution: ["768P", "1080P"] },
        { duration: [10], resolution: ["768P"] },
      ],
    },
    {
      name: "Hailuo 02",
      modelName: "MiniMax-Hailuo-02",
      type: "video",
      mode: ["text", "singleImage", "startEndRequired"],
      audio: false,
      durationResolutionMap: [
        { duration: [6], resolution: ["512P", "768P", "1080P"] },
        { duration: [10], resolution: ["512P", "768P"] },
      ],
    },
  ],
};

// ============================================================
// Helper utilities
// ============================================================

/**
 * Get request headers.
 */
const getHeaders = (): Record<string, string> => {
  const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
};

/**
 * Get the base request URL.
 */
type Region = "global_en" | "cn_zh";
type TextProtocol = "openai" | "anthropic";

const endpointByRegion: Record<
  Region,
  { apiBaseUrl: string; openaiBaseUrl: string; anthropicBaseUrl: string }
> = {
  global_en: {
    apiBaseUrl: "https://api.minimax.io",
    openaiBaseUrl: "https://api.minimax.io/v1",
    anthropicBaseUrl: "https://api.minimax.io/anthropic",
  },
  cn_zh: {
    apiBaseUrl: "https://api.minimaxi.com",
    openaiBaseUrl: "https://api.minimaxi.com/v1",
    anthropicBaseUrl: "https://api.minimaxi.com/anthropic",
  },
};

const normalizeUrl = (value: string | undefined): string => (value || "").replace(/\/+$/, "");

const getRegion = (): Region => {
  const configuredBaseUrl = normalizeUrl(vendor.inputValues.baseUrl);
  return configuredBaseUrl === endpointByRegion.cn_zh.apiBaseUrl ||
    configuredBaseUrl === endpointByRegion.cn_zh.openaiBaseUrl ||
    configuredBaseUrl === endpointByRegion.cn_zh.anthropicBaseUrl
    ? "cn_zh"
    : vendor.inputValues.region?.trim() === "cn_zh"
      ? "cn_zh"
      : "global_en";
};

const getTextProtocol = (): TextProtocol =>
  vendor.inputValues.protocol?.trim().toLowerCase() === "anthropic" ? "anthropic" : "openai";

const isOfficialEndpoint = (value: string): boolean =>
  Object.values(endpointByRegion).some((endpoint) =>
    [endpoint.apiBaseUrl, endpoint.openaiBaseUrl, endpoint.anthropicBaseUrl].includes(value),
  );

const getBaseUrl = (): string => {
  const configuredBaseUrl = normalizeUrl(vendor.inputValues.baseUrl);
  return !configuredBaseUrl || isOfficialEndpoint(configuredBaseUrl)
    ? endpointByRegion[getRegion()].apiBaseUrl
    : configuredBaseUrl;
};

const getOpenAIBaseUrl = (): string => {
  const configuredBaseUrl = normalizeUrl(vendor.inputValues.baseUrl);
  if (!configuredBaseUrl || isOfficialEndpoint(configuredBaseUrl)) return endpointByRegion[getRegion()].openaiBaseUrl;
  return configuredBaseUrl.endsWith("/v1") ? configuredBaseUrl : `${configuredBaseUrl}/v1`;
};

const getAnthropicBaseUrl = (): string => {
  const configuredBaseUrl = normalizeUrl(vendor.inputValues.baseUrl);
  if (!configuredBaseUrl || isOfficialEndpoint(configuredBaseUrl)) return endpointByRegion[getRegion()].anthropicBaseUrl;
  return configuredBaseUrl.endsWith("/anthropic") ? configuredBaseUrl : `${configuredBaseUrl}/anthropic`;
};

/**
 * Extract a data URL from a ReferenceList item.
 */
const extractBase64WithHead = (ref: ReferenceList): string => {
  return ref.base64.startsWith("data:") ? ref.base64 : `data:image/png;base64,${ref.base64}`;
};

// ============================================================
// Adapter functions
// ============================================================

const textRequest = (model: TextModel, think: boolean, thinkLevel: 0 | 1 | 2 | 3) => {
  if (!vendor.inputValues.apiKey) throw new Error("Missing API key");
  const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
  const thinkingModes = model.thinking || [];
  const shouldThink = model.think && (think || thinkingModes.includes("always_on"));

  if (getTextProtocol() === "anthropic") {
    const anthropicThinking = thinkingModes.includes("adaptive")
      ? { type: shouldThink ? "adaptive" : "disabled" }
      : undefined;
    const anthropicOptions: any = {
      baseURL: `${getAnthropicBaseUrl()}/v1`,
      authToken: apiKey,
    };

    if (anthropicThinking) {
      anthropicOptions.fetch = async (url: string, options?: any) => {
        const rawBody = JSON.parse(options?.body || "{}");
        return fetch(url, {
          ...options,
          body: JSON.stringify({ ...rawBody, thinking: anthropicThinking }),
        });
      };
    }

    return createAnthropic(anthropicOptions).chat(model.modelName);
  }

  const extraBody = shouldThink ? { reasoning_split: true } : {};
  return createOpenAI({ baseURL: getOpenAIBaseUrl(), apiKey, extraBody }).chat(model.modelName);
};

const uploadReference = async (base64: string, fileType: "image" | "audio" | "video"): Promise<ReferenceList> => {
  // The image endpoint accepts base64 directly and returns the compressed data unchanged.
  if (fileType === "image") {
    const compressed = await zipImage(base64, 10 * 1024);
    return { type: "image", sourceType: "base64", base64: compressed };
  }
  // The video endpoint also accepts base64 image parameters; compress them to 20 MB.
  return { type: fileType, sourceType: "base64", base64 } as ReferenceList;
};

const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
  if (!vendor.inputValues.apiKey) throw new Error("Missing API key");
  const baseUrl = getBaseUrl();
  const headers = getHeaders();

  const reqBody: any = {
    model: model.modelName,
    prompt: config.prompt,
    aspect_ratio: config.aspectRatio,
    response_format: "base64",
    n: 1,
    prompt_optimizer: true,
    aigc_watermark: false,
  };

  // Handle image-to-image references.
  const imageRefs = config.referenceList || [];
  if (imageRefs.length > 0) {
    const refBase64 = extractBase64WithHead(imageRefs[0]);
    reqBody.subject_reference = [{ type: "character", image_file: refBase64 }];
  }

  logger("Submitting image generation task");
  const resp = await axios.post(`${baseUrl}/v1/image_generation`, reqBody, { headers });
  if (resp.data.base_resp.status_code !== 0) {
    throw new Error(`Image generation failed: ${resp.data.base_resp.status_msg}`);
  }
  if (resp.data.metadata.success_count === 0) {
    throw new Error("Image generation was blocked by the safety policy; adjust the prompt or reference image");
  }

  const imgBase64 = resp.data.data.image_base64[0];
  return imgBase64.startsWith("data:") ? imgBase64 : `data:image/png;base64,${imgBase64}`;
};

const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
  if (!vendor.inputValues.apiKey) throw new Error("Missing API key");
  const baseUrl = getBaseUrl();
  const headers = getHeaders();

  const reqBody: any = {
    model: model.modelName,
    prompt: config.prompt,
    duration: config.duration,
    resolution: config.resolution,
    aigc_watermark: false,
    prompt_optimizer: true,
  };

  // Extract image references.
  const imageRefs = (config.referenceList || []).filter((r) => r.type === "image");

  if (imageRefs.length > 0) {
    // Compress images to 20 MB or less.
    const compressedImages: string[] = [];
    for (const ref of imageRefs) {
      const base64 = extractBase64WithHead(ref);
      const compressed = await zipImage(base64, 20 * 1024);
      compressedImages.push(compressed);
    }

    if (config.mode.includes("startEndRequired")) {
      if (compressedImages.length < 2) throw new Error("Start/end frame mode requires two images");
      reqBody.first_frame_image = compressedImages[0];
      reqBody.last_frame_image = compressedImages[1];
    } else if (config.mode.includes("singleImage")) {
      reqBody.first_frame_image = compressedImages[0];
    }
  }

  logger("Submitting video generation task");
  const submitResp = await axios.post(`${baseUrl}/v1/video_generation`, reqBody, { headers });
  if (submitResp.data.base_resp.status_code !== 0) {
    throw new Error(`Task submission failed: ${submitResp.data.base_resp.status_msg}`);
  }
  const taskId = submitResp.data.task_id;
  logger(`Video task submitted successfully, task ID: ${taskId}`);

  // Poll task status.
  const pollResult = await pollTask(
    async () => {
      const queryResp = await axios.get(`${baseUrl}/v1/query/video_generation`, {
        headers: getHeaders(),
        params: { task_id: taskId },
      });
      if (queryResp.data.base_resp.status_code !== 0) {
        return { completed: true, error: queryResp.data.base_resp.status_msg };
      }
      const status = queryResp.data.status;
      if (status === "Success") {
        return { completed: true, data: queryResp.data.file_id };
      }
      if (status === "Fail") {
        return { completed: true, error: "Video generation failed" };
      }
      logger(`Video task in progress, current status: ${status}`);
      return { completed: false };
    },
    5000,
    600000,
  );

  if (pollResult.error) throw new Error(pollResult.error);
  const fileId = pollResult.data!;
  logger(`Video task completed, file ID: ${fileId}`);

  // Get the download URL.
  const fileResp = await axios.get(`${baseUrl}/v1/files/retrieve`, {
    headers: getHeaders(),
    params: { file_id: fileId },
  });
  if (fileResp.data.base_resp.status_code !== 0) {
    throw new Error(`Failed to get the file URL: ${fileResp.data.base_resp.status_msg}`);
  }
  const downloadUrl = fileResp.data.file.download_url;
  logger(`Video download URL retrieved successfully; converting to base64`);

  return await urlToBase64(downloadUrl);
};

const ttsRequest = async (config: TTSConfig, model: TTSModel): Promise<string> => {
  return "";
};

const checkForUpdates = async (): Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }> => {
  return {
    hasUpdate: false,
    latestVersion: "2.2",
    notice:
      "## Update notice\n1. Updated the provider template architecture and unified ReferenceList handling\n2. Added the uploadReference preprocessing hook\n3. Improved image compression and reference extraction",
  };
};

const updateVendor = async (): Promise<string> => {
  return "";
};

// ============================================================
// Exports
// ============================================================

exports.vendor = vendor;
exports.textRequest = textRequest;
exports.uploadReference = uploadReference;
exports.imageRequest = imageRequest;
exports.videoRequest = videoRequest;
exports.ttsRequest = ttsRequest;
exports.checkForUpdates = checkForUpdates;
exports.updateVendor = updateVendor;

// Keep this file as a module to avoid global variable collisions.
export {};
