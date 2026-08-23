/**
 * Toonflow AI provider template
 * @version 2.0
 */

// ============================================================
// Type definitions
// ============================================================

type VideoMode =
  | "singleImage" // single image reference
  | "startEndRequired" // first/last frame (both required)
  | "endFrameOptional" // first/last frame (last frame optional)
  | "startFrameOptional" // first/last frame (first frame optional)
  | "text" // text
  | (`videoReference:${number}` | `imageReference:${number}` | `audioReference:${number}`)[]; // multi-reference (the number indicates the limit)

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
  id: string; // unique ID, used as the filename stored on the user's disk, symbols forbidden
  version: string; // version number, format x.y, must follow semantic versioning
  name: string; // provider name
  author: string; // author
  description?: string; // description, supports Markdown format
  icon?: string; // icon, Base64 format only, recommended size 128x128 pixels
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

declare const logger: (msg: string) => void; // logging function
declare const jsonwebtoken: any; // JWT handling library
declare const zipImage: (base64: string, size: number) => Promise<string>; // image compression function, returns a headed base64 string
declare const zipImageResolution: (base64: string, w: number, h: number) => Promise<string>; // image resolution adjustment function, returns a headed base64 string
declare const mergeImages: (base64Arr: string[], maxSize?: string) => Promise<string>; // image compositing function, returns a headed base64 string
declare const urlToBase64: (url: string) => Promise<string>; // URL-to-Base64 function, returns a headed base64 string
declare const pollTask: (fn: () => Promise<PollResult>, interval?: number, timeout?: number) => Promise<PollResult>; // polling function, fn is an async function, interval is the polling interval, timeout is the timeout, returns fn's result
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
  textRequest: (m: TextModel, t: boolean, tl: 0 | 1 | 2 | 3) => any; // text model
  imageRequest: (c: ImageConfig, m: ImageModel) => Promise<string>; // image model, returns a headed base64 string
  videoRequest: (c: VideoConfig, m: VideoModel) => Promise<string>; // video model, returns a headed base64 string
  ttsRequest: (c: TTSConfig, m: TTSModel) => Promise<string>; // (not yet available) speech model, returns a headed base64 string
  checkForUpdates?: () => Promise<{
    hasUpdate: boolean;
    latestVersion: string;
    notice: string;
  }>; // update-check function, returns whether an update is available, the latest version, and release notes (supports Markdown format)
  updateVendor?: () => Promise<string>; // update function, returns the latest code text
};

// ============================================================
// Provider configuration
// ============================================================

const vendor: VendorConfig = {
  id: "grsai",
  version: "2.2",
  author: "Toonflow",
  name: "Grsai",
  description: "Grsai AI platform adapter, supports text-to-image, image-to-image, text-to-video, and Gemini-compatible text models \n [Go to relay platform](https://tf.grsai.ai/zh)",
  inputs: [
    { key: "apiKey", label: "API Key", type: "password", required: true },
    {
      key: "baseUrl",
      label: "Request URL",
      type: "url",
      required: true,
      placeholder: "Example: https://grsai.dakka.com.cn",
    },
  ],
  inputValues: { apiKey: "", baseUrl: "https://grsai.dakka.com.cn" },
  models: [
    {
      name: "GPT Image 2",
      modelName: "gpt-image-2",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
    },
    {
      name: "Nano Banana Fast",
      modelName: "nano-banana-fast",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
    },
    {
      name: "Nano Banana 2",
      modelName: "nano-banana-2",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
    },
    {
      name: "Nano Banana Pro",
      modelName: "nano-banana-pro",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
    },
  ],
};

// ============================================================
// Helper utilities
// ============================================================

const getHeaders = () => {
  const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
};

// ============================================================
// Adapter functions
// ============================================================

const textRequest = (model: TextModel, think: boolean, thinkLevel: 0 | 1 | 2 | 3) => {
  if (!vendor.inputValues.apiKey) throw new Error("Missing API Key");
  const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
  return createGoogleGenerativeAI({
    baseURL: `${vendor.inputValues.baseUrl}/v1beta`,
    apiKey,
  }).chat(model.modelName);
};

const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
  if (!vendor.inputValues.apiKey) throw new Error("Missing API Key");
  const baseUrl = vendor.inputValues.baseUrl;
  const headers = getHeaders();

  // Build request parameters
  const requestBody: any = {
    model: model.modelName,
    prompt: config.prompt,
    aspectRatio: config.aspectRatio,
    webHook: "-1",
    shutProgress: true,
  };

  // Add model-specific parameters
  if (model.modelName.startsWith("nano-banana")) {
    requestBody.imageSize = config.size;
  } else {
    requestBody.size = config.aspectRatio;
    requestBody.variants = 1;
  }

  // Handle reference image
  if (config.referenceList && config.referenceList.length > 0) {
    requestBody.urls = config.referenceList.map((img) => img.base64);
  }

  // Choose the API path
  const apiPath = model.modelName.startsWith("nano-banana") ? "/v1/draw/nano-banana" : "/v1/draw/completions";

  logger(`Starting image generation task submission, model: ${model.modelName}`);
  logger(`${baseUrl}${apiPath}`)
  const submitResp = await fetch(`${baseUrl}${apiPath}`, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
  });
  if (!submitResp.ok) {
    const errorReason = await submitResp.text();
    throw new Error(`Task submission failed: ${errorReason}`);
  }
  const submitData = await submitResp.json();
  if (submitData.code !== 0) throw new Error(`Task submission failed: ${submitData.msg}`);

  const taskId = submitData.data.id;
  logger(`Image task submitted successfully, task ID: ${taskId}`);

  // Poll for the result
  const pollResult = await pollTask(
    async () => {
      const resp = await fetch(`${baseUrl}/v1/draw/result`, {
        method: "POST",
        headers,
        body: JSON.stringify({ id: taskId }),
      });
      if (!resp.ok) {
        const errorReason = await resp.text();
        throw new Error(`Task query failed: ${errorReason}`);
      }
      const respData = await resp.json();
      if (respData.code !== 0) return { completed: true, error: respData.msg };

      const taskData = respData.data;
      if (taskData.status === "failed")
        return {
          completed: true,
          error: taskData.failure_reason || taskData.error,
        };
      if (taskData.status === "succeeded") {
        const imgUrl = taskData.results?.[0]?.url || taskData.url;
        return { completed: true, data: imgUrl };
      }
      logger(`Image task generating, progress: ${taskData.progress}%`);
      return { completed: false };
    },
    3000,
    600000,
  );

  if (pollResult.error) throw new Error(pollResult.error);
  logger(`Image generation complete, converting to Base64`);
  return await urlToBase64(pollResult.data!);
};

const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
  if (!vendor.inputValues.apiKey) throw new Error("Missing API Key");
  const baseUrl = vendor.inputValues.baseUrl;
  const headers = getHeaders();

  // Build request parameters
  const requestBody: any = {
    model: model.modelName,
    prompt: config.prompt,
    aspectRatio: config.aspectRatio,
    webHook: "-1",
    shutProgress: true,
  };

  // Handle reference resources
  if (config.referenceList && config.referenceList.length > 0) {
    const imageRefs = config.referenceList.filter((item) => item.type === "image") as Extract<ReferenceList, { type: "image" }>[];
    if (config.mode.includes("endFrameOptional") && imageRefs.length >= 1) {
      requestBody.firstFrameUrl = imageRefs[0].base64;
      if (imageRefs.length >= 2) requestBody.lastFrameUrl = imageRefs[1].base64;
    } else if (config.mode.some((m) => Array.isArray(m) && m.includes("imageReference:3"))) {
      requestBody.urls = imageRefs.map((img) => img.base64);
    }
  }

  logger(`Starting video generation task submission, model: ${model.modelName}`);
  const submitResp = await fetch(`${baseUrl}/v1/video/veo`, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
  });
  if (!submitResp.ok) {
    const errorReason = await submitResp.text();
    throw new Error(`Task submission failed: ${errorReason}`);
  }
  const submitData = await submitResp.json();
  if (submitData.code !== 0) throw new Error(`Task submission failed: ${submitData.msg}`);

  const taskId = submitData.data.id;
  logger(`Video task submitted successfully, task ID: ${taskId}`);

  // Poll for the result
  const pollResult = await pollTask(
    async () => {
      const resp = await fetch(`${baseUrl}/v1/draw/result`, {
        method: "POST",
        headers,
        body: JSON.stringify({ id: taskId }),
      });
      if (!resp.ok) {
        const errorReason = await resp.text();
        throw new Error(`Video task query failed ${errorReason}`);
      }
      const respData = await resp.json();
      logger(respData);
      if (respData.code !== 0) return { completed: true, error: respData.msg };

      const taskData = respData.data;
      if (taskData.status === "failed")
        return {
          completed: true,
          error: taskData.failure_reason || taskData.error,
        };
      if (taskData.status === "succeeded") {
        return { completed: true, data: taskData.url };
      }
      logger(`Video task generating, progress: ${taskData.progress}%`);
      return { completed: false };
    },
    5000,
    1800000,
  );

  if (pollResult.error) throw new Error(pollResult.error);
  logger(`Video generation complete, converting to Base64`);
  return await urlToBase64(pollResult.data!);
};

const ttsRequest = async (config: TTSConfig, model: TTSModel): Promise<string> => {
  return "";
};

const checkForUpdates = async (): Promise<{
  hasUpdate: boolean;
  latestVersion: string;
  notice: string;
}> => {
  return {
    hasUpdate: false,
    latestVersion: "1.0",
    notice: "## New version release notes",
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
exports.imageRequest = imageRequest;
exports.videoRequest = videoRequest;
exports.ttsRequest = ttsRequest;
exports.checkForUpdates = checkForUpdates;
exports.updateVendor = updateVendor;

// This line ensures the current file is recognized as a module, avoiding global variable conflicts
export {};
