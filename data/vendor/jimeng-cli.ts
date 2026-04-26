/**
 * 即梦官方 CLI (jimeng-cli-api wrapper) 供应商适配
 * @version 1.0
 *
 * 通过自部署 jimeng-cli-api wrapper 调用即梦官方 dreamina CLI（OAuth Device
 * Flow，账号合规，不会风控封号）。OpenAI 兼容 /v1/images/generations，返回
 * data:image/png;base64 形式。
 *
 * 仅文生图。image2image / image_upscale / 视频走后续 issue。
 *
 * 详见 opshub#92。
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
  imageBase64: string[];
  size: "1K" | "2K" | "4K";
  aspectRatio: `${number}:${number}`;
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
interface PollResult {
  completed: boolean;
  data?: string;
  error?: string;
}

// ============================================================
// 全局声明（沙盒注入）
// ============================================================
declare const axios: any;
declare const logger: (msg: string) => void;
declare const urlToBase64: (url: string) => Promise<string>;
declare const pollTask: (fn: () => Promise<PollResult>, interval?: number, timeout?: number) => Promise<PollResult>;
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
  id: "jimeng-cli",
  version: "2.0",
  author: "gog5-ops",
  name: "即梦 CLI (官方)",
  description:
    "通过自部署 jimeng-cli-api wrapper 调用即梦官方 dreamina CLI，OAuth Device Flow 登录，合规，不会风控封号。支持文生图 + 视频（image2video / multimodal2video / multiframe2video / frames2video）。不需要 API key（容器内 OAuth 持久化）。",
  icon: "",
  inputs: [
    { key: "baseUrl", label: "baseURL（含 /v1）", type: "url", required: true, placeholder: "http://jimeng-cli-api:8000/v1" },
  ],
  inputValues: {
    baseUrl: "http://jimeng-cli-api:8000/v1",
  },
  models: [
    // 文生图 (text2image) — opshub#92
    { name: "即梦 3.0 (1k)", modelName: "jimeng-3.0", type: "image", mode: ["text"] },
    { name: "即梦 4.0 (2k)", modelName: "jimeng-4.0", type: "image", mode: ["text"] },
    { name: "即梦 4.6 (2k)", modelName: "jimeng-4.6", type: "image", mode: ["text"] },
    { name: "即梦 5.0 (2k)", modelName: "jimeng-5.0", type: "image", mode: ["text"] },

    // 视频 — opshub#94 — 模型 ID 跟 wrapper /v1/videos model 字段一一对应
    {
      name: "即梦 image2video 3.0 (单图)",
      modelName: "dreamina-image2video-3.0",
      type: "video",
      mode: ["singleImage"],
      audio: false,
      durationResolutionMap: [{ duration: [3, 4, 5, 6, 7, 8, 9, 10], resolution: ["720p", "1080p"] }],
    },
    {
      name: "即梦 image2video Seedance 2.0 Fast (单图)",
      modelName: "dreamina-image2video-seedance2.0fast",
      type: "video",
      mode: ["singleImage"],
      audio: false,
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["720p"] }],
    },
    {
      name: "即梦 frames2video Seedance 2.0 Fast (首尾帧)",
      modelName: "dreamina-frames2video-seedance2.0fast",
      type: "video",
      mode: ["startEndRequired"],
      audio: false,
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["720p"] }],
    },
    {
      name: "即梦 multimodal2video Seedance 2.0 Fast (全能参考)",
      modelName: "dreamina-multimodal2video-seedance2.0fast",
      type: "video",
      mode: ["singleImage", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["720p"] }],
    },
    {
      name: "即梦 multiframe2video (多图叙事)",
      modelName: "dreamina-multiframe2video",
      type: "video",
      mode: [["imageReference:20"]],
      audio: false,
      durationResolutionMap: [{ duration: [2, 3, 4, 5, 6, 7, 8, 9, 10], resolution: ["720p"] }],
    },
  ],
};

// ============================================================
// 辅助
// ============================================================
function pickOpenAISize(_size: ImageConfig["size"], aspectRatio: ImageConfig["aspectRatio"]): string {
  // 跟 wrapper 端 _SIZE_TO_RATIO 对齐的子集；其他 ratio 走默认 1:1。
  const table: Record<string, string> = {
    "16:9": "1920x1080",
    "9:16": "1080x1920",
    "1:1": "1024x1024",
    "4:3": "1024x768",
    "3:4": "768x1024",
    "3:2": "1536x1024",
    "2:3": "1024x1536",
  };
  return table[aspectRatio] ?? "1024x1024";
}

// ============================================================
// 适配器函数
// ============================================================
const textRequest = (_model: TextModel, _think: boolean, _thinkLevel: 0 | 1 | 2 | 3) => {
  throw new Error("即梦 CLI 不支持文本对话，请用文生图模型");
};

const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
  const baseUrl = vendor.inputValues.baseUrl;
  const size = pickOpenAISize(config.size, config.aspectRatio);
  const body = {
    model: model.modelName,
    prompt: config.prompt,
    size,
    n: 1,
  };
  logger(`[imageRequest] jimeng-cli model=${model.modelName} size=${size}`);
  const response = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`即梦请求失败 ${response.status}: ${errorText}`);
  }
  const data = await response.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("响应缺少 b64_json");
  return `data:image/png;base64,${b64}`;
};

// 把 toonflow VideoConfig 翻译成 wrapper /v1/videos request body。
function buildVideoBody(config: VideoConfig, modelName: string): Record<string, any> {
  // 收集多 input：v2 referenceList 优先（按 type 分组），fallback 到 imageBase64
  const refList: any[] = (config as any).referenceList ?? [];
  const imageRefs: string[] = refList.filter((r) => r?.type === "image").map((r) => r.base64);
  const videoRefs: string[] = refList.filter((r) => r?.type === "video").map((r) => r.base64);
  const audioRefs: string[] = refList.filter((r) => r?.type === "audio").map((r) => r.base64);
  const fallbackImages: string[] = (config as any).imageBase64 ?? [];
  const allImages = imageRefs.length ? imageRefs : fallbackImages;

  const body: Record<string, any> = {
    model: modelName,
    prompt: config.prompt,
    duration: config.duration,
    resolution: config.resolution,
  };

  if (modelName.startsWith("dreamina-image2video-")) {
    if (allImages.length < 1) throw new Error("image2video 需要 1 张参考图");
    body.image = allImages[0];
  } else if (modelName.startsWith("dreamina-frames2video-")) {
    if (allImages.length < 2) throw new Error("frames2video 需要首尾两张图");
    body.first = allImages[0];
    body.last = allImages[1];
  } else if (modelName === "dreamina-multiframe2video") {
    if (allImages.length < 2) throw new Error("multiframe2video 需要至少 2 张图（最多 20）");
    body.images = allImages;
  } else if (modelName.startsWith("dreamina-multimodal2video-")) {
    body.images = allImages;
    if (videoRefs.length) body.videos = videoRefs;
    if (audioRefs.length) body.audios = audioRefs;
    body.size = pickOpenAISize("1K", config.aspectRatio); // multimodal 用 size→ratio
  } else {
    throw new Error(`未知视频模型: ${modelName}`);
  }
  return body;
}

const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
  const baseUrl = vendor.inputValues.baseUrl;
  const body = buildVideoBody(config, model.modelName);

  logger(`[videoRequest] jimeng-cli ${model.modelName} duration=${config.duration} resolution=${config.resolution}`);

  const submitResp = await fetch(`${baseUrl}/videos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!submitResp.ok) {
    const errorText = await submitResp.text();
    throw new Error(`视频提交失败 ${submitResp.status}: ${errorText}`);
  }
  const submit = await submitResp.json();
  const taskId = submit.id;
  if (!taskId) throw new Error("视频提交响应缺少 id");
  logger(`[videoRequest] submitted taskId=${taskId}`);

  const result = await pollTask(
    async () => {
      const resp = await fetch(`${baseUrl}/videos/${taskId}`, { method: "GET" });
      if (!resp.ok) {
        const errorText = await resp.text();
        return { completed: true, error: `视频查询失败 ${resp.status}: ${errorText}` };
      }
      const data = await resp.json();
      if (data.status === "completed") {
        return { completed: true, data: data.result_url };
      }
      if (data.status === "failed") {
        return { completed: true, error: data.fail_reason ?? "视频生成失败" };
      }
      return { completed: false };
    },
    5000,
    600000, // 10min timeout for video generation
  );

  if (result.error) throw new Error(result.error);
  if (!result.data) throw new Error("视频生成完成但 wrapper 缺少 result_url");
  return result.data; // data:video/mp4;base64,... 直接返回
};

const ttsRequest = async (_config: TTSConfig, _model: TTSModel): Promise<string> => "";

const checkForUpdates = async () => ({ hasUpdate: false, latestVersion: "2.0", notice: "" });
const updateVendor = async () => "";

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
