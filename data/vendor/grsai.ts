/**
 * Toonflow AI供应商模板
 * @version 2.0
 */

// ============================================================
// 类型定义
// ============================================================

type VideoMode =
  | "singleImage" //单图参考
  | "startEndRequired" //首尾帧（两张都得有）
  | "endFrameOptional" //首尾帧（尾帧可选）
  | "startFrameOptional" //首尾帧（首帧可选）
  | "text" //文本
  | (`videoReference:${number}` | `imageReference:${number}` | `audioReference:${number}`)[]; //多参考（数字代表限制数量）

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
  id: string; //唯一ID，作为文件名存储用户磁盘上，禁止符号
  version: string; //版本号，格式为x.y，需遵守语义化版本控制
  name: string; //供应商名称
  author: string; //作者
  description?: string; //描述，支持Markdown格式
  icon?: string; //图标，仅支持Base64格式，建议尺寸为128x128像素
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
// 全局声明
// ============================================================

declare const logger: (msg: string) => void; // 日志函数
declare const jsonwebtoken: any; // JWT处理库
declare const zipImage: (base64: string, size: number) => Promise<string>; // 图片压缩函数，返回有头base64字符串
declare const zipImageResolution: (base64: string, w: number, h: number) => Promise<string>; // 图片分辨率调整函数，返回有头base64字符串
declare const mergeImages: (base64Arr: string[], maxSize?: string) => Promise<string>; // 图片合成函数，返回有头base64字符串
declare const urlToBase64: (url: string) => Promise<string>; // URL转Base64函数，返回有头base64字符串
declare const pollTask: (fn: () => Promise<PollResult>, interval?: number, timeout?: number) => Promise<PollResult>; // 轮询函数，fn为异步函数，interval为轮询间隔，timeout为超时时间，返回fn的结果
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
  textRequest: (m: TextModel, t: boolean, tl: 0 | 1 | 2 | 3) => any; //文本模型
  imageRequest: (c: ImageConfig, m: ImageModel) => Promise<string>; //图片模型，返回有头base64字符串
  videoRequest: (c: VideoConfig, m: VideoModel) => Promise<string>; //视频模型，返回有头base64字符串
  ttsRequest: (c: TTSConfig, m: TTSModel) => Promise<string>; //（暂未开放）语音模型，返回有头base64字符串
  checkForUpdates?: () => Promise<{
    hasUpdate: boolean;
    latestVersion: string;
    notice: string;
  }>; //检查更新函数，返回是否有更新和最新版本号和更公告（支持Markdown格式）
  updateVendor?: () => Promise<string>; //更新函数，返回最新的代码文本
};

// ============================================================
// 供应商配置
// ============================================================

const vendor: VendorConfig = {
  id: "grsai",
  version: "2.2",
  author: "Toonflow",
  name: "Grsai",
  description: "Grsai AI平台适配，支持文生图、图生图、文生视频、Gemini兼容文本模型 \n [前往中转平台](https://tf.grsai.ai/zh)",
  inputs: [
    { key: "apiKey", label: "API密钥", type: "password", required: true },
    {
      key: "baseUrl",
      label: "请求地址",
      type: "url",
      required: true,
      placeholder: "示例：https://grsai.dakka.com.cn",
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
// 辅助工具
// ============================================================

const getHeaders = () => {
  const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
};

// ============================================================
// 适配器函数
// ============================================================

const textRequest = (model: TextModel, think: boolean, thinkLevel: 0 | 1 | 2 | 3) => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");
  const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
  return createGoogleGenerativeAI({
    baseURL: `${vendor.inputValues.baseUrl}/v1beta`,
    apiKey,
  }).chat(model.modelName);
};

const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");
  const baseUrl = vendor.inputValues.baseUrl;
  const headers = getHeaders();

  // 构造请求参数
  const requestBody: any = {
    model: model.modelName,
    prompt: config.prompt,
    aspectRatio: config.aspectRatio,
    webHook: "-1",
    shutProgress: true,
  };

  // 补充模型专属参数
  if (model.modelName.startsWith("nano-banana")) {
    requestBody.imageSize = config.size;
  } else {
    requestBody.size = config.aspectRatio;
    requestBody.variants = 1;
  }

  // 处理参考图
  if (config.referenceList && config.referenceList.length > 0) {
    requestBody.urls = config.referenceList.map((img) => img.base64);
  }

  // 选择接口路径
  const apiPath = model.modelName.startsWith("nano-banana") ? "/v1/draw/nano-banana" : "/v1/draw/completions";

  logger(`开始提交图片生成任务，模型：${model.modelName}`);
  logger(`${baseUrl}${apiPath}`)
  const submitResp = await fetch(`${baseUrl}${apiPath}`, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
  });
  if (!submitResp.ok) {
    const errorReason = await submitResp.text();
    throw new Error(`任务提交失败：${errorReason}`);
  }
  const submitData = await submitResp.json();
  if (submitData.code !== 0) throw new Error(`任务提交失败：${submitData.msg}`);

  const taskId = submitData.data.id;
  logger(`图片任务提交成功，任务ID：${taskId}`);

  // 轮询结果
  const pollResult = await pollTask(
    async () => {
      const resp = await fetch(`${baseUrl}/v1/draw/result`, {
        method: "POST",
        headers,
        body: JSON.stringify({ id: taskId }),
      });
      if (!resp.ok) {
        const errorReason = await resp.text();
        throw new Error(`查询任务失败：${errorReason}`);
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
      logger(`图片任务生成中，进度：${taskData.progress}%`);
      return { completed: false };
    },
    3000,
    600000,
  );

  if (pollResult.error) throw new Error(pollResult.error);
  logger(`图片生成完成，开始转换Base64`);
  return await urlToBase64(pollResult.data!);
};

const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
  if (!vendor.inputValues.apiKey) throw new Error("缺少API Key");
  const baseUrl = vendor.inputValues.baseUrl;
  const headers = getHeaders();

  // 构造请求参数
  const requestBody: any = {
    model: model.modelName,
    prompt: config.prompt,
    aspectRatio: config.aspectRatio,
    webHook: "-1",
    shutProgress: true,
  };

  // 处理参考资源
  if (config.referenceList && config.referenceList.length > 0) {
    const imageRefs = config.referenceList.filter((item) => item.type === "image") as Extract<ReferenceList, { type: "image" }>[];
    if (config.mode.includes("endFrameOptional") && imageRefs.length >= 1) {
      requestBody.firstFrameUrl = imageRefs[0].base64;
      if (imageRefs.length >= 2) requestBody.lastFrameUrl = imageRefs[1].base64;
    } else if (config.mode.some((m) => Array.isArray(m) && m.includes("imageReference:3"))) {
      requestBody.urls = imageRefs.map((img) => img.base64);
    }
  }

  logger(`开始提交视频生成任务，模型：${model.modelName}`);
  const submitResp = await fetch(`${baseUrl}/v1/video/veo`, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
  });
  if (!submitResp.ok) {
    const errorReason = await submitResp.text();
    throw new Error(`任务提交失败： ${errorReason}`);
  }
  const submitData = await submitResp.json();
  if (submitData.code !== 0) throw new Error(`任务提交失败：${submitData.msg}`);

  const taskId = submitData.data.id;
  logger(`视频任务提交成功，任务ID：${taskId}`);

  // 轮询结果
  const pollResult = await pollTask(
    async () => {
      const resp = await fetch(`${baseUrl}/v1/draw/result`, {
        method: "POST",
        headers,
        body: JSON.stringify({ id: taskId }),
      });
      if (!resp.ok) {
        const errorReason = await resp.text();
        throw new Error(`查询视频任务失败 ${errorReason}`);
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
      logger(`视频任务生成中，进度：${taskData.progress}%`);
      return { completed: false };
    },
    5000,
    1800000,
  );

  if (pollResult.error) throw new Error(pollResult.error);
  logger(`视频生成完成，开始转换Base64`);
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
    notice: "## 新版本更新公告",
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
exports.imageRequest = imageRequest;
exports.videoRequest = videoRequest;
exports.ttsRequest = ttsRequest;
exports.checkForUpdates = checkForUpdates;
exports.updateVendor = updateVendor;

// 这行代码用于确保当前文件被识别为模块，避免全局变量冲突
export {};
