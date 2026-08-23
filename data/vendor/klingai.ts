/**
 * Toonflow AI供应商模板 - 可灵AI
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
  id: "klingai",
  version: "2.0",
  author: "Toonflow",
  name: "Kling AI",
  description:
    "Kling AI video generation\n\nSupports the full Kling video model lineup, including kling-video-o1, kling-v3-omni, kling-v3, kling-v2-6, kling-v2-5-turbo, kling-v2-1, kling-v2-master, kling-v1-6, kling-v1-5, kling-v1, and more.\n\nGet your Access Key and Secret Key from the [Kling AI Open Platform](https://klingai.com).",
  inputs: [
    { key: "accessKey", label: "Access Key", type: "password", required: true, placeholder: "Enter your Kling AI Access Key" },
    { key: "secretKey", label: "Secret Key", type: "password", required: true, placeholder: "Enter your Kling AI Secret Key" },
    { key: "baseUrl", label: "Request URL", type: "url", required: true, placeholder: "Default: https://api-beijing.klingai.com" },
  ],
  inputValues: { accessKey: "", secretKey: "", baseUrl: "https://api-beijing.klingai.com" },
  models: [
    // kling-video-o1 (Omni)
    {
      name: "kling-video-o1 Standard",
      modelName: "kling-video-o1:std",
      type: "video",
      mode: ["text", "singleImage", "startEndRequired", ["imageReference:7", "videoReference:1"]],
      audio: false,
      durationResolutionMap: [{ duration: [5, 10], resolution: ["720p"] }],
    },
    {
      name: "kling-video-o1 Expert",
      modelName: "kling-video-o1:pro",
      type: "video",
      mode: ["text", "singleImage", "startEndRequired", ["imageReference:7", "videoReference:1"]],
      audio: false,
      durationResolutionMap: [{ duration: [5, 10], resolution: ["720p"] }],
    },
    // kling-v3-omni (Omni)
    {
      name: "kling-v3-omni Standard",
      modelName: "kling-v3-omni:std",
      type: "video",
      mode: ["text", "singleImage", "startEndRequired", ["imageReference:7", "videoReference:1"]],
      audio: false,
      durationResolutionMap: [{ duration: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["720p"] }],
    },
    {
      name: "kling-v3-omni Expert",
      modelName: "kling-v3-omni:pro",
      type: "video",
      mode: ["text", "singleImage", "startEndRequired", ["imageReference:7", "videoReference:1"]],
      audio: false,
      durationResolutionMap: [{ duration: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["720p"] }],
    },
    // kling-v3
    {
      name: "kling-v3 Standard",
      modelName: "kling-v3:std",
      type: "video",
      mode: ["text", "singleImage", "startEndRequired"],
      audio: false,
      durationResolutionMap: [{ duration: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["720p"] }],
    },
    {
      name: "kling-v3 Expert",
      modelName: "kling-v3:pro",
      type: "video",
      mode: ["text", "singleImage", "startEndRequired"],
      audio: false,
      durationResolutionMap: [{ duration: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["720p"] }],
    },
    // kling-v2-6
    {
      name: "kling-v2-6 Standard",
      modelName: "kling-v2-6:std",
      type: "video",
      mode: ["text", "singleImage"],
      audio: false,
      durationResolutionMap: [{ duration: [5, 10], resolution: ["720p"] }],
    },
    {
      name: "kling-v2-6 Expert",
      modelName: "kling-v2-6:pro",
      type: "video",
      mode: ["text", "singleImage", "startEndRequired"],
      audio: "optional",
      durationResolutionMap: [{ duration: [5, 10], resolution: ["1080p"] }],
    },
    // kling-v2-5-turbo
    {
      name: "kling-v2-5-turbo Standard",
      modelName: "kling-v2-5-turbo:std",
      type: "video",
      mode: ["text", "singleImage"],
      audio: false,
      durationResolutionMap: [{ duration: [5, 10], resolution: ["1080p"] }],
    },
    {
      name: "kling-v2-5-turbo Expert",
      modelName: "kling-v2-5-turbo:pro",
      type: "video",
      mode: ["text", "singleImage", "startEndRequired"],
      audio: false,
      durationResolutionMap: [{ duration: [5, 10], resolution: ["1080p"] }],
    },
    // kling-v2-1
    {
      name: "kling-v2-1 Standard",
      modelName: "kling-v2-1:std",
      type: "video",
      mode: ["singleImage"],
      audio: false,
      durationResolutionMap: [{ duration: [5, 10], resolution: ["720p"] }],
    },
    {
      name: "kling-v2-1 Expert",
      modelName: "kling-v2-1:pro",
      type: "video",
      mode: ["singleImage", "startEndRequired"],
      audio: false,
      durationResolutionMap: [{ duration: [5, 10], resolution: ["1080p"] }],
    },
    // kling-v2-1-master
    {
      name: "kling-v2-1 Master",
      modelName: "kling-v2-1-master:pro",
      type: "video",
      mode: ["text", "singleImage"],
      audio: false,
      durationResolutionMap: [{ duration: [5, 10], resolution: ["1080p"] }],
    },
    // kling-v2-master
    {
      name: "kling-v2 Master",
      modelName: "kling-v2-master:pro",
      type: "video",
      mode: ["text", "singleImage"],
      audio: false,
      durationResolutionMap: [{ duration: [5, 10], resolution: ["720p"] }],
    },
    // kling-v1-6
    {
      name: "kling-v1-6 Standard",
      modelName: "kling-v1-6:std",
      type: "video",
      mode: ["text", "singleImage", ["imageReference:4"]],
      audio: false,
      durationResolutionMap: [{ duration: [5, 10], resolution: ["720p"] }],
    },
    {
      name: "kling-v1-6 Expert",
      modelName: "kling-v1-6:pro",
      type: "video",
      mode: ["text", "singleImage", "endFrameOptional", ["imageReference:4"]],
      audio: false,
      durationResolutionMap: [{ duration: [5, 10], resolution: ["1080p"] }],
    },
    // kling-v1-5
    {
      name: "kling-v1-5 Standard",
      modelName: "kling-v1-5:std",
      type: "video",
      mode: ["singleImage"],
      audio: false,
      durationResolutionMap: [{ duration: [5, 10], resolution: ["720p"] }],
    },
    {
      name: "kling-v1-5 Expert",
      modelName: "kling-v1-5:pro",
      type: "video",
      mode: ["singleImage", "endFrameOptional"],
      audio: false,
      durationResolutionMap: [{ duration: [5, 10], resolution: ["1080p"] }],
    },
    // kling-v1
    {
      name: "kling-v1 Standard",
      modelName: "kling-v1:std",
      type: "video",
      mode: ["text", "singleImage", "startEndRequired"],
      audio: false,
      durationResolutionMap: [{ duration: [5, 10], resolution: ["720p"] }],
    },
    {
      name: "kling-v1 Expert",
      modelName: "kling-v1:pro",
      type: "video",
      mode: ["text", "singleImage", "startEndRequired"],
      audio: false,
      durationResolutionMap: [{ duration: [5, 10], resolution: ["720p"] }],
    },
  ],
};

// ============================================================
// 辅助工具
// ============================================================

/**
 * 生成可灵AI的JWT鉴权Token
 */
const generateAuthToken = (): string => {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: vendor.inputValues.accessKey,
    exp: now + 1800,
    nbf: now - 5,
  };
  return jsonwebtoken.sign(payload, vendor.inputValues.secretKey, {
    algorithm: "HS256",
    header: { alg: "HS256", typ: "JWT" },
  });
};

/**
 * 获取基础请求地址
 */
const getBaseUrl = (): string => {
  return vendor.inputValues.baseUrl || "https://api-beijing.klingai.com";
};

/**
 * 从 ReferenceList 条目中提取可用的数据字符串
 * 对于 url 类型返回 url，对于 base64 类型返回纯 base64（去掉 data: 前缀）
 */
const extractRawBase64 = (ref: ReferenceList): string => {
  return ref.base64.replace(/^data:[^;]+;base64,/, "");
};

/**
 * 从 ReferenceList 条目中提取带头的 base64 或 url
 * 用于 omni-video 接口，该接口的 image_url 支持带前缀的 base64 和 url
 */
const extractImageUrl = (ref: ReferenceList): string => {
  return ref.base64.startsWith("data:") ? ref.base64 : `data:image/jpeg;base64,${ref.base64}`;
};

/**
 * 提交任务并轮询获取结果的通用函数
 */
const submitAndPoll = async (submitUrl: string, queryUrlBase: string, requestBody: any): Promise<string> => {
  const token = generateAuthToken();

  logger(`Starting Kling AI video generation task submission: ${submitUrl}`);
  logger(
    `Request parameters: ${JSON.stringify({
      ...requestBody,
      image: requestBody.image ? "[BASE64]" : undefined,
      image_tail: requestBody.image_tail ? "[BASE64]" : undefined,
      image_list: requestBody.image_list ? "[IMAGES]" : undefined,
    })}`,
  );

  const submitResp = await axios.post(submitUrl, requestBody, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (submitResp.data.code !== 0) {
    throw new Error(`Task submission failed: ${submitResp.data.message || JSON.stringify(submitResp.data)}`);
  }

  const taskId = submitResp.data.data.task_id;
  logger(`Task submitted, task ID: ${taskId}`);

  const result = await pollTask(
    async () => {
      const freshToken = generateAuthToken();
      const queryResp = await axios.get(`${queryUrlBase}/${taskId}`, {
        headers: {
          Authorization: `Bearer ${freshToken}`,
        },
      });

      if (queryResp.data.code !== 0) {
        return { completed: true, error: `Task query failed: ${queryResp.data.message}` };
      }

      const taskData = queryResp.data.data;
      const status = taskData.task_status;
      logger(`Polling... task status: ${status}`);

      if (status === "succeed") {
        const videoUrl = taskData.task_result?.videos?.[0]?.url;
        if (!videoUrl) {
          return { completed: true, error: "Task completed but no video URL was obtained" };
        }
        return { completed: true, data: videoUrl };
      }

      if (status === "failed") {
        return { completed: true, error: `Video generation failed: ${taskData.task_status_msg || "Unknown error"}` };
      }

      return { completed: false };
    },
    5000,
    600000,
  );

  if (result.error) throw new Error(result.error);
  logger(`Video generation complete, converting to Base64...`);
  return await urlToBase64(result.data!);
};

// ============================================================
// 适配器函数
// ============================================================

const textRequest = (model: TextModel, think: boolean, thinkLevel: 0 | 1 | 2 | 3) => {
  throw new Error("Kling AI does not support text models");
};

const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
  throw new Error("Kling AI does not support image models");
};

const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
  if (!vendor.inputValues.accessKey) throw new Error("Missing Access Key");
  if (!vendor.inputValues.secretKey) throw new Error("Missing Secret Key");

  const baseUrl = getBaseUrl();

  // 解析 modelName，格式：kling-video-o1:pro => modelName=kling-video-o1, mode=pro
  const colonIdx = model.modelName.indexOf(":");
  const modelName = colonIdx > -1 ? model.modelName.substring(0, colonIdx) : model.modelName;
  const mode = colonIdx > -1 ? model.modelName.substring(colonIdx + 1) : "pro";

  // 判断是否为 Omni 模型
  const isOmniModel = modelName === "kling-video-o1" || modelName === "kling-v3-omni";

  // 判断当前选中的视频生成模式
  const currentMode = config.mode;
  const isText = currentMode.includes("text");
  const isSingleImage = currentMode.includes("singleImage");
  const isStartEndRequired = currentMode.includes("startEndRequired");
  const isEndFrameOptional = currentMode.includes("endFrameOptional");
  const isStartFrameOptional = currentMode.includes("startFrameOptional");
  const hasMultiRef = Array.isArray(currentMode) && currentMode.some((m) => Array.isArray(m));

  // 提取不同类型的引用
  const imageRefs = (config.referenceList || []).filter((r) => r.type === "image");
  const videoRefs = (config.referenceList || []).filter((r) => r.type === "video");

  // =====================================================
  // Omni 模型 —— 使用 /v1/videos/omni-video 接口
  // =====================================================
  if (isOmniModel) {
    const requestBody: any = {
      model_name: modelName,
      mode: mode,
      duration: String(config.duration),
      sound: config.audio === true ? "on" : "off",
    };

    if (config.prompt) {
      requestBody.prompt = config.prompt;
    }

    if (isSingleImage && imageRefs.length > 0) {
      const imageUrl = extractImageUrl(imageRefs[0]);
      requestBody.image_list = [{ image_url: imageUrl, type: "first_frame" }];
      if (!requestBody.prompt) requestBody.prompt = "Generate video from image";
    } else if (isStartEndRequired && imageRefs.length >= 2) {
      const firstUrl = extractImageUrl(imageRefs[0]);
      const endUrl = extractImageUrl(imageRefs[1]);
      requestBody.image_list = [
        { image_url: firstUrl, type: "first_frame" },
        { image_url: endUrl, type: "end_frame" },
      ];
      if (!requestBody.prompt) requestBody.prompt = "Generate a transition video from the first and last frame images";
    } else if (isEndFrameOptional && imageRefs.length >= 1) {
      const firstUrl = extractImageUrl(imageRefs[0]);
      requestBody.image_list = [{ image_url: firstUrl, type: "first_frame" }];
      if (imageRefs.length >= 2) {
        const endUrl = extractImageUrl(imageRefs[1]);
        requestBody.image_list.push({ image_url: endUrl, type: "end_frame" });
      }
      if (!requestBody.prompt) requestBody.prompt = "Generate video from image";
    } else if (isStartFrameOptional && imageRefs.length >= 1) {
      if (imageRefs.length >= 2) {
        const firstUrl = extractImageUrl(imageRefs[0]);
        const endUrl = extractImageUrl(imageRefs[1]);
        requestBody.image_list = [
          { image_url: firstUrl, type: "first_frame" },
          { image_url: endUrl, type: "end_frame" },
        ];
      } else {
        const endUrl = extractImageUrl(imageRefs[0]);
        requestBody.image_list = [{ image_url: endUrl, type: "end_frame" }];
      }
      if (!requestBody.prompt) requestBody.prompt = "Generate video from image";
    } else if (hasMultiRef && (imageRefs.length > 0 || videoRefs.length > 0)) {
      requestBody.image_list = [];
      for (let i = 0; i < imageRefs.length; i++) {
        const imageUrl = extractImageUrl(imageRefs[i]);
        requestBody.image_list.push({ image_url: imageUrl });
      }
      if (!requestBody.prompt) {
        const refs = imageRefs.map((_, idx) => `<<<image_${idx + 1}>>>`).join(", ");
        requestBody.prompt = `Generate video referencing ${refs}`;
      }
    }

    // 文生视频或无图片输入时需要设置宽高比
    const hasImageInput = requestBody.image_list && requestBody.image_list.length > 0;
    if (!hasImageInput) {
      requestBody.aspect_ratio = config.aspectRatio || "16:9";
      if (!requestBody.prompt) throw new Error("Text-to-video mode requires a prompt");
    }

    const apiPath = "/v1/videos/omni-video";
    return await submitAndPoll(`${baseUrl}${apiPath}`, `${baseUrl}${apiPath}`, requestBody);
  }

  // =====================================================
  // 非 Omni 模型 —— 根据模式选择不同接口
  // =====================================================

  // 多图参考模式 —— 使用 /v1/videos/multi-image2video 接口（仅 kling-v1-6 支持）
  if (hasMultiRef && imageRefs.length > 0) {
    const imageList = [];
    for (let i = 0; i < imageRefs.length; i++) {
      const rawBase64 = extractRawBase64(imageRefs[i]);
      imageList.push({ image: rawBase64 });
    }

    const requestBody: any = {
      model_name: modelName,
      image_list: imageList,
      prompt: config.prompt || "Generate video from the reference image",
      mode: mode,
      duration: String(config.duration),
      aspect_ratio: config.aspectRatio || "16:9",
    };

    const apiPath = "/v1/videos/multi-image2video";
    return await submitAndPoll(`${baseUrl}${apiPath}`, `${baseUrl}${apiPath}`, requestBody);
  }

  // 文生视频模式 —— 使用 /v1/videos/text2video 接口
  if (isText) {
    if (!config.prompt) throw new Error("Text-to-video mode requires a prompt");

    const requestBody: any = {
      model_name: modelName,
      prompt: config.prompt,
      mode: mode,
      duration: String(config.duration),
      aspect_ratio: config.aspectRatio || "16:9",
      sound: config.audio === true ? "on" : "off",
    };

    const apiPath = "/v1/videos/text2video";
    return await submitAndPoll(`${baseUrl}${apiPath}`, `${baseUrl}${apiPath}`, requestBody);
  }

  // 图生视频模式（单图 / 首尾帧 / 尾帧可选等）—— 使用 /v1/videos/image2video 接口
  if ((isSingleImage || isStartEndRequired || isEndFrameOptional || isStartFrameOptional) && imageRefs.length > 0) {
    const requestBody: any = {
      model_name: modelName,
      prompt: config.prompt || "Generate video from image",
      mode: mode,
      duration: String(config.duration),
      sound: config.audio === true ? "on" : "off",
    };

    if (isSingleImage) {
      requestBody.image = extractRawBase64(imageRefs[0]);
    } else if (isStartEndRequired && imageRefs.length >= 2) {
      requestBody.image = extractRawBase64(imageRefs[0]);
      requestBody.image_tail = extractRawBase64(imageRefs[1]);
    } else if (isEndFrameOptional) {
      requestBody.image = extractRawBase64(imageRefs[0]);
      if (imageRefs.length >= 2) {
        requestBody.image_tail = extractRawBase64(imageRefs[1]);
      }
    } else if (isStartFrameOptional) {
      if (imageRefs.length >= 2) {
        requestBody.image = extractRawBase64(imageRefs[0]);
        requestBody.image_tail = extractRawBase64(imageRefs[1]);
      } else {
        requestBody.image = extractRawBase64(imageRefs[0]);
      }
    }

    const apiPath = "/v1/videos/image2video";
    return await submitAndPoll(`${baseUrl}${apiPath}`, `${baseUrl}${apiPath}`, requestBody);
  }

  throw new Error("Unsupported video generation mode or missing required input parameters");
};

const ttsRequest = async (config: TTSConfig, model: TTSModel): Promise<string> => {
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

// 这行代码用于确保当前文件被识别为模块，避免全局变量冲突
export {};
