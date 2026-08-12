/**
 * Toonflow AI供应商模板 - MiniMax(海螺AI)
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

interface VoiceCloneCapability {
  name: string;
  type: "voiceClone";
  models: string[];
  audioFormats: ("mp3" | "m4a" | "wav")[];
  operations: { operationId: string; method: "POST"; path: string }[];
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
  capabilities?: VoiceCloneCapability[];
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

interface VoiceCloneConfig {
  cloneAudio: string;
  voiceId: string;
  model: "speech-2.8-hd" | "speech-2.6-hd" | "speech-02-hd" | "speech-01-hd";
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
declare const Buffer: any;
declare const FormData: any;
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
  uploadCloneAudio: (source: string) => Promise<string>;
  uploadPromptAudio: (source: string) => Promise<string>;
  voiceClone: (c: VoiceCloneConfig) => Promise<string>;
  checkForUpdates?: () => Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }>;
  updateVendor?: () => Promise<string>;
};

// ============================================================
// 供应商配置
// ============================================================

const vendor: VendorConfig = {
  id: "minimax",
  version: "2.2",
  author: "Toonflow",
  name: "MiniMax(海螺AI)",
  description: "MiniMax官方接口适配，支持M系列推理文本模型、文生图/图生图、视频生成（文生视频、图生视频、首尾帧生成）能力 \n [前往平台](https://minimaxi.com/)",
  inputs: [
    { key: "apiKey", label: "API密钥", type: "password", required: true },
    { key: "baseUrl", label: "请求地址", type: "url", required: true, placeholder: "示例：https://api.minimaxi.com" },
  ],
  inputValues: { apiKey: "", baseUrl: "https://api.minimaxi.com" },
  models: [
    // 文本模型
    { name: "MiniMax-M2.7 (推理版)", modelName: "MiniMax-M2.7", type: "text", think: true },
    { name: "MiniMax-M2.7 极速版 (推理版)", modelName: "MiniMax-M2.7-highspeed", type: "text", think: true },
    { name: "MiniMax-M2.5 (推理版)", modelName: "MiniMax-M2.5", type: "text", think: true },
    { name: "MiniMax-M2.5 极速版 (推理版)", modelName: "MiniMax-M2.5-highspeed", type: "text", think: true },
    { name: "MiniMax-M2.1 (编程版)", modelName: "MiniMax-M2.1", type: "text", think: true },
    { name: "MiniMax-M2.1 极速版 (编程版)", modelName: "MiniMax-M2.1-highspeed", type: "text", think: true },
    { name: "MiniMax-M2 (Agent版)", modelName: "MiniMax-M2", type: "text", think: false },
    // 图片模型
    { name: "海螺图像V1", modelName: "image-01", type: "image", mode: ["text", "singleImage"] },
    { name: "海螺图像V1 Live版", modelName: "image-01-live", type: "image", mode: ["text", "singleImage"], associationSkills: "支持自定义画风" },
    // 视频模型
    {
      name: "海螺2.3",
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
      name: "海螺2.3极速版",
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
      name: "海螺02",
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
  capabilities: [
    {
      name: "MiniMax Voice Clone",
      type: "voiceClone",
      models: ["speech-2.8-hd", "speech-2.6-hd", "speech-02-hd", "speech-01-hd"],
      audioFormats: ["mp3", "m4a", "wav"],
      operations: [
        { operationId: "uploadCloneAudio", method: "POST", path: "/v1/files/upload" },
        { operationId: "uploadPromptAudio", method: "POST", path: "/v1/files/upload" },
        { operationId: "voiceClone", method: "POST", path: "/v1/voice_clone" },
      ],
    },
  ],
};

// ============================================================
// 辅助工具
// ============================================================

/**
 * 获取请求头
 */
const getHeaders = (): Record<string, string> => {
  const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
};

/**
 * 获取基础请求地址
 */
const getBaseUrl = (): string => {
  return vendor.inputValues.baseUrl.replace(/\/$/, "");
};

/**
 * 从 ReferenceList 条目中提取有头 base64 字符串
 */
const extractBase64WithHead = (ref: ReferenceList): string => {
  return ref.base64.startsWith("data:") ? ref.base64 : `data:image/png;base64,${ref.base64}`;
};

const parseAudio = (source: string): { data: any; filename: string; contentType: string } => {
  const match = source.match(/^data:audio\/(mpeg|mp3|mp4|x-m4a|wav|wave|x-wav);base64,(.+)$/);
  if (!match) throw new Error("Voice clone audio must be an MP3, M4A, or WAV data URL");
  const formats: Record<string, { extension: string; contentType: string }> = {
    mpeg: { extension: "mp3", contentType: "audio/mpeg" },
    mp3: { extension: "mp3", contentType: "audio/mpeg" },
    mp4: { extension: "m4a", contentType: "audio/mp4" },
    "x-m4a": { extension: "m4a", contentType: "audio/mp4" },
    wav: { extension: "wav", contentType: "audio/wav" },
    wave: { extension: "wav", contentType: "audio/wav" },
    "x-wav": { extension: "wav", contentType: "audio/wav" },
  };
  const format = formats[match[1]];
  const data = Buffer.from(match[2], "base64");
  if (!data.length) throw new Error("Voice clone audio must not be empty");
  return { data, filename: `voice.${format.extension}`, contentType: format.contentType };
};

const uploadVoiceAudio = async (source: string, purpose: "voice_clone" | "prompt_audio"): Promise<string> => {
  if (!vendor.inputValues.apiKey) throw new Error("Missing API key");
  const audio = parseAudio(source);
  const form = new FormData();
  form.append("purpose", purpose);
  form.append("file", audio.data, { filename: audio.filename, contentType: audio.contentType });
  const response = await axios.post(`${getBaseUrl()}/v1/files/upload`, form, {
    headers: { Authorization: getHeaders().Authorization, ...form.getHeaders() },
  });
  if (response.data?.base_resp?.status_code !== 0) {
    throw new Error(`Voice audio upload failed: ${response.data?.base_resp?.status_msg || "unknown error"}`);
  }
  const fileId = response.data?.file?.file_id ?? response.data?.file_id;
  if (!fileId) throw new Error("Voice audio upload response did not include a file ID");
  return String(fileId);
};

const uploadCloneAudio = (source: string): Promise<string> => uploadVoiceAudio(source, "voice_clone");

const uploadPromptAudio = (source: string): Promise<string> => uploadVoiceAudio(source, "prompt_audio");

// ============================================================
// 适配器函数
// ============================================================

const textRequest = (model: TextModel, think: boolean, thinkLevel: 0 | 1 | 2 | 3) => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");
  const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
  const baseUrl = getBaseUrl();

  const openaiBaseUrl = `${baseUrl}/v1`;
  const extraBody = model.think ? { reasoning_split: true } : {};
  return createOpenAI({ baseURL: openaiBaseUrl, apiKey, extraBody }).chat(model.modelName);
};

const uploadReference = async (base64: string, fileType: "image" | "audio" | "video"): Promise<ReferenceList> => {
  // MiniMax的图片接口直接接受 base64，压缩后原样返回
  if (fileType === "image") {
    const compressed = await zipImage(base64, 10 * 1024);
    return { type: "image", sourceType: "base64", base64: compressed };
  }
  // 视频接口的图片参数也是 base64，压缩到20MB
  return { type: fileType, sourceType: "base64", base64 } as ReferenceList;
};

const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");
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

  // 处理图生图参考
  const imageRefs = config.referenceList || [];
  if (imageRefs.length > 0) {
    const refBase64 = extractBase64WithHead(imageRefs[0]);
    reqBody.subject_reference = [{ type: "character", image_file: refBase64 }];
  }

  logger("开始提交MiniMax图像生成任务");
  const resp = await axios.post(`${baseUrl}/v1/image_generation`, reqBody, { headers });
  if (resp.data.base_resp.status_code !== 0) {
    throw new Error(`图像生成失败：${resp.data.base_resp.status_msg}`);
  }
  if (resp.data.metadata.success_count === 0) {
    throw new Error("图像生成被安全策略拦截，请调整prompt或参考图");
  }

  const imgBase64 = resp.data.data.image_base64[0];
  return imgBase64.startsWith("data:") ? imgBase64 : `data:image/png;base64,${imgBase64}`;
};

const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");
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

  // 提取图片类型的引用
  const imageRefs = (config.referenceList || []).filter((r) => r.type === "image");

  if (imageRefs.length > 0) {
    // 压缩图片到20MB以内
    const compressedImages: string[] = [];
    for (const ref of imageRefs) {
      const base64 = extractBase64WithHead(ref);
      const compressed = await zipImage(base64, 20 * 1024);
      compressedImages.push(compressed);
    }

    if (config.mode.includes("startEndRequired")) {
      if (compressedImages.length < 2) throw new Error("首尾帧模式需要上传两张图片");
      reqBody.first_frame_image = compressedImages[0];
      reqBody.last_frame_image = compressedImages[1];
    } else if (config.mode.includes("singleImage")) {
      reqBody.first_frame_image = compressedImages[0];
    }
  }

  logger("开始提交MiniMax视频生成任务");
  const submitResp = await axios.post(`${baseUrl}/v1/video_generation`, reqBody, { headers });
  if (submitResp.data.base_resp.status_code !== 0) {
    throw new Error(`任务提交失败：${submitResp.data.base_resp.status_msg}`);
  }
  const taskId = submitResp.data.task_id;
  logger(`视频任务提交成功，任务ID: ${taskId}`);

  // 轮询任务状态
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
        return { completed: true, error: "视频生成失败" };
      }
      logger(`视频任务生成中，当前状态：${status}`);
      return { completed: false };
    },
    5000,
    600000,
  );

  if (pollResult.error) throw new Error(pollResult.error);
  const fileId = pollResult.data!;
  logger(`视频任务生成成功，文件ID: ${fileId}`);

  // 获取下载地址
  const fileResp = await axios.get(`${baseUrl}/v1/files/retrieve`, {
    headers: getHeaders(),
    params: { file_id: fileId },
  });
  if (fileResp.data.base_resp.status_code !== 0) {
    throw new Error(`获取文件地址失败：${fileResp.data.base_resp.status_msg}`);
  }
  const downloadUrl = fileResp.data.file.download_url;
  logger(`视频下载地址获取成功，开始转Base64`);

  return await urlToBase64(downloadUrl);
};

const ttsRequest = async (config: TTSConfig, model: TTSModel): Promise<string> => {
  return "";
};

const voiceClone = async (config: VoiceCloneConfig): Promise<string> => {
  if (!config.voiceId) throw new Error("Voice ID is required");
  const fileId = await uploadCloneAudio(config.cloneAudio);
  const response = await axios.post(
    `${getBaseUrl()}/v1/voice_clone`,
    { file_id: fileId, voice_id: config.voiceId, model: config.model },
    { headers: getHeaders() },
  );
  if (response.data?.base_resp?.status_code !== 0) {
    throw new Error(`Voice cloning failed: ${response.data?.base_resp?.status_msg || "unknown error"}`);
  }
  const voiceId = response.data?.voice_id;
  if (!voiceId) throw new Error("Voice cloning response did not include a voice ID");
  return String(voiceId);
};

const checkForUpdates = async (): Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }> => {
  return {
    hasUpdate: false,
    latestVersion: "2.0",
    notice:
      "## 新版本更新公告\n1. 适配新版模板架构，支持 ReferenceList 统一引用类型\n2. 新增 uploadReference 前置处理器\n3. 优化图片压缩和引用提取逻辑",
  };
};

const updateVendor = async (): Promise<string> => {
  return "";
};

// ============================================================
// 导出
// ============================================================

exports.vendor = vendor;
exports.textRequest = textRequest;
exports.uploadReference = uploadReference;
exports.imageRequest = imageRequest;
exports.videoRequest = videoRequest;
exports.ttsRequest = ttsRequest;
exports.uploadCloneAudio = uploadCloneAudio;
exports.uploadPromptAudio = uploadPromptAudio;
exports.voiceClone = voiceClone;
exports.checkForUpdates = checkForUpdates;
exports.updateVendor = updateVendor;

// 这行代码用于确保当前文件被识别为模块，避免全局变量冲突
export {};
