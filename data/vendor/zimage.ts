/**
 * Toonflow AI供应商模板 - Z-Image Turbo 本地生图
 * @version 2.1
 *
 * 说明：
 * 1) 连接本地 Z-Image Turbo Gradio 服务
 * 2) 默认地址 http://127.0.0.1:9000
 * 3) 通过 Gradio API 调用生图（先尝试 v2，fallback v1）
 * 4) 仅支持图片生成，不支持文本/视频/TTS
 *
 * v2.1 changes:
 * - Gradio v2 submit endpoint: /gradio_api/call/v2/{apiName}
 * - Fallback v1: /gradio_api/call/{apiName}
 * - Named parameter payload: { p, w, h, st, sd, cfg, vae, llm, l_list, l_str }
 * - w/h enforced as number type
 * - FileData object parsing for Gradio results
 * - Local file path → base64 conversion
 * - Debug logging
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

// ============================================================
// 全局声明
// ============================================================

declare const axios: any;
declare const logger: (msg: string) => void;
declare const urlToBase64: (url: string) => Promise<string>;
declare const pollTask: (fn: () => Promise<{ completed: boolean; data?: string; error?: string }>, interval?: number, timeout?: number) => Promise<{ completed: boolean; data?: string; error?: string }>;
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
  id: "zimage",
  version: "2.1",
  author: "Local AI",
  name: "Z-Image Turbo 本地生图",
  description:
    "连接本地 Z-Image Turbo Gradio 服务，无需联网，无需付费 API。\n\n1. 启动 Z-Image Turbo 服务（默认端口 9000）\n2. 默认地址 http://127.0.0.1:9000\n3. 通过 Gradio API 调用生图\n4. 支持自定义 width/height/steps/cfg/seed 等参数",
  inputs: [
    { key: "baseUrl", label: "服务地址", type: "url", required: true, placeholder: "http://127.0.0.1:9000" },
    { key: "apiName", label: "API名称", type: "text", required: true, placeholder: "run_and_return" },
    { key: "width", label: "宽度", type: "text", required: false, placeholder: "512" },
    { key: "height", label: "高度", type: "text", required: false, placeholder: "896" },
    { key: "steps", label: "Steps", type: "text", required: false, placeholder: "8" },
    { key: "cfg", label: "CFG", type: "text", required: false, placeholder: "1" },
    { key: "seed", label: "Seed", type: "text", required: false, placeholder: "0" },
    { key: "vaePath", label: "VAE路径", type: "text", required: false, placeholder: "" },
    { key: "llmPath", label: "LLM路径", type: "text", required: false, placeholder: "" },
    { key: "loras", label: "LoRA", type: "text", required: false, placeholder: "" },
    { key: "loraStrength", label: "LoRA强度", type: "text", required: false, placeholder: "1" },
  ],
  inputValues: {
    baseUrl: "http://127.0.0.1:9000",
    apiName: "run_and_return",
    width: "",
    height: "",
    steps: "8",
    cfg: "1",
    seed: "0",
    vaePath: "",
    llmPath: "",
    loras: "",
    loraStrength: "1",
  },
  models: [
    {
      name: "Z-Image Turbo",
      modelName: "z-image-turbo",
      type: "image",
      mode: ["text"],
      associationSkills: "Local image generation via Z-Image Turbo",
    },
  ],
};

// ============================================================
// 辅助函数
// ============================================================

/** 解析图片结果，统一返回 data:image/xxx;base64,... 格式 */
const resolveImageResult = async (raw: any, baseUrl: string): Promise<string> => {
  // 1) 字符串类型
  if (typeof raw === "string") {
    const s = raw.trim();

    // 已有 data URI header
    if (s.startsWith("data:image/")) {
      logger(`[zimage] 结果类型: base64带header (长度=${s.length})`);
      return s;
    }

    // 纯 base64（无 header）
    if (/^[A-Za-z0-9+/=]+$/.test(s) && s.length > 100) {
      logger(`[zimage] 结果类型: 纯base64 (长度=${s.length})`);
      return `data:image/png;base64,${s}`;
    }

    // 绝对 URL
    if (s.startsWith("http://") || s.startsWith("https://")) {
      logger(`[zimage] 结果类型: 绝对URL → ${s.substring(0, 80)}`);
      return await urlToBase64(s);
    }

    // Gradio 相对路径 /gradio_api/file=... 或 /file=...
    if (s.startsWith("/gradio_api/") || s.startsWith("/file=")) {
      const fullUrl = baseUrl.replace(/\/+$/, "") + s;
      logger(`[zimage] 结果类型: 相对URL → ${fullUrl.substring(0, 80)}`);
      return await urlToBase64(fullUrl);
    }

    // Local file path (Windows or Linux absolute path)
    if (/^[A-Za-z]:[\\\/]/.test(s) || s.startsWith("/home/") || s.startsWith("/tmp/") || s.startsWith("/data/")) {
      logger(`[zimage] 结果类型: 本地文件路径 → ${s}`);
      try {
        const fs = require("fs");
        const fileBuffer = fs.readFileSync(s);
        const b64 = fileBuffer.toString("base64");
        logger(`[zimage] 本地文件读取成功, 大小=${fileBuffer.length}`);
        return `data:image/png;base64,${b64}`;
      } catch (readErr: any) {
        logger(`[zimage] 本地文件读取失败: ${readErr.message}`);
        // Fallback: try as Gradio file path
        const fileUrl = `${baseUrl.replace(/\/+$/, "")}/file=${s}`;
        logger(`[zimage] 尝试 Gradio file URL → ${fileUrl.substring(0, 80)}`);
        return await urlToBase64(fileUrl);
      }
    }

    // 尝试作为纯 base64
    logger(`[zimage] 结果类型: 未知字符串，尝试base64解码 (长度=${s.length})`);
    return `data:image/png;base64,${s}`;
  }

  // 2) 数组类型（Gradio 可能返回 [url] 或 [FileData] 或 [image]）
  if (Array.isArray(raw)) {
    logger(`[zimage] 结果类型: 数组 (长度=${raw.length})`);
    if (raw.length > 0) {
      const first = raw[0];
      // Gradio FileData object: { path, url, mime_type, meta, ... }
      if (first && typeof first === "object") {
        // Try url first (Gradio v4+)
        if (first.url) {
          return await resolveImageResult(first.url, baseUrl);
        }
        // Try path with Gradio file serving
        if (first.path) {
          return await resolveImageResult(first.path, baseUrl);
        }
        // Try image field
        if (first.image) {
          return await resolveImageResult(first.image, baseUrl);
        }
        // Try mime_type + data
        if (first.mime_type && first.data) {
          return await resolveImageResult(first.data, baseUrl);
        }
      }
      return await resolveImageResult(first, baseUrl);
    }
  }

  // 3) FileData 对象类型 { url, path, mime_type, meta, ... }
  if (raw && typeof raw === "object") {
    // Gradio FileData: has url field (may be relative path like /gradio_api/file=...)
    if (raw.url) {
      return await resolveImageResult(raw.url, baseUrl);
    }
    // Gradio FileData: has path field (local filesystem path)
    if (raw.path) {
      return await resolveImageResult(raw.path, baseUrl);
    }
    if (raw.image) {
      return await resolveImageResult(raw.image, baseUrl);
    }
    // Nested data field
    if (raw.data) {
      return await resolveImageResult(raw.data, baseUrl);
    }
    // mime_type + direct base64
    if (raw.mime_type && typeof raw.data === "string") {
      return await resolveImageResult(raw.data, baseUrl);
    }
  }

  throw new Error(`[zimage] 无法解析图片结果，类型: ${typeof raw}, 值: ${JSON.stringify(raw).substring(0, 200)}`);
};

/** 解析 Gradio SSE 流，提取最终数据 */
const parseGradioSSE = (sseText: string): any => {
  const lines = sseText.split("\n");
  let lastData: any = null;
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      try {
        lastData = JSON.parse(line.substring(6));
      } catch {
        // 忽略解析失败的行
      }
    }
  }
  return lastData;
};

// ============================================================
// 适配器函数
// ============================================================

const textRequest = (_model: TextModel, _think: boolean, _thinkLevel: 0 | 1 | 2 | 3) => {
  throw new Error("Z-Image Turbo 仅支持图片生成，不支持文本对话");
};

const imageRequest = async (config: ImageConfig, _model: ImageModel): Promise<string> => {
  const baseUrl = vendor.inputValues.baseUrl.replace(/\/+$/, "");
  const apiName = vendor.inputValues.apiName || "run_and_return";

  logger(`[zimage] apiName: ${apiName}`);

  // width/height: 如果 user mengisi, gunakan nilai user
  // jika kosong, hitung dari aspectRatio
  let width: number;
  let height: number;

  const userWidth = parseInt(vendor.inputValues.width);
  const userHeight = parseInt(vendor.inputValues.height);

  if (userWidth > 0 && userHeight > 0) {
    width = userWidth;
    height = userHeight;
  } else if (config.aspectRatio === "16:9") {
    width = 896;
    height = 512;
  } else if (config.aspectRatio === "1:1") {
    width = 768;
    height = 768;
  } else {
    // default 9:16
    width = 512;
    height = 896;
  }

  const steps = parseInt(vendor.inputValues.steps) || 8;
  const cfg = parseFloat(vendor.inputValues.cfg) || 1;
  const seed = parseInt(vendor.inputValues.seed) || 0;
  const vaePath = vendor.inputValues.vaePath || "";
  const llmPath = vendor.inputValues.llmPath || "";
  const loras = vendor.inputValues.loras || "";
  const loraStrength = parseFloat(vendor.inputValues.loraStrength) || 1;

  const prompt = config.prompt;

  // w and h MUST be number type, not string
  const params = {
    p: prompt,
    w: Number(width),
    h: Number(height),
    st: Number(steps),
    sd: Number(seed),
    cfg: Number(cfg),
    vae: vaePath,
    llm: llmPath,
    l_list: loras ? loras.split(",").map((s: string) => s.trim()) : [],
    l_str: Number(loraStrength),
  };

  logger(`[zimage] request params: w=${params.w}(${typeof params.w}), h=${params.h}(${typeof params.h}), st=${params.st}, sd=${params.sd}, cfg=${params.cfg}`);
  logger(`[zimage] 开始生图 → prompt="${prompt.substring(0, 60)}..."`);

  // ===== 尝试1: Gradio v2 API =====
  try {
    const v2Payload = { data: params };
    const v2Endpoint = `${baseUrl}/gradio_api/call/v2/${apiName}`;

    logger(`[zimage] submit endpoint used: POST ${v2Endpoint}`);
    const submitResp = await axios.post(v2Endpoint, v2Payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });

    logger(`[zimage] v2 submit status: ${submitResp.status}`);
    const eventId = submitResp.data?.event_id;

    if (eventId) {
      logger(`[zimage] event_id: ${eventId}`);
      const imageBase64 = await pollGradioResult(baseUrl, `/gradio_api/call/v2/${apiName}`, eventId);
      if (imageBase64) return imageBase64;
    }

    // No event_id, try sync response
    logger(`[zimage] v2 无 event_id，尝试同步响应解析`);
    const syncResult = submitResp.data?.data || submitResp.data;
    if (syncResult) {
      const imageBase64 = await resolveImageResult(syncResult, baseUrl);
      if (imageBase64.startsWith("data:image/")) {
        logger(`[zimage] v2 同步生图成功! 图片长度: ${imageBase64.length}`);
        return imageBase64;
      }
    }
  } catch (e: any) {
    logger(`[zimage] v2 API 失败: ${e.message}`);
  }

  // ===== 尝试2: Gradio v1 API (fallback) =====
  try {
    const v1Payload = { data: params };
    const v1Endpoint = `${baseUrl}/gradio_api/call/${apiName}`;

    logger(`[zimage] submit endpoint used: POST ${v1Endpoint} (fallback)`);
    const submitResp = await axios.post(v1Endpoint, v1Payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });

    logger(`[zimage] v1 submit status: ${submitResp.status}`);
    const eventId = submitResp.data?.event_id;

    if (eventId) {
      logger(`[zimage] event_id: ${eventId}`);
      const imageBase64 = await pollGradioResult(baseUrl, `/gradio_api/call/${apiName}`, eventId);
      if (imageBase64) return imageBase64;
    }

    // No event_id, try sync response
    logger(`[zimage] v1 无 event_id，尝试同步响应解析`);
    const syncResult = submitResp.data?.data || submitResp.data;
    if (syncResult) {
      const imageBase64 = await resolveImageResult(syncResult, baseUrl);
      if (imageBase64.startsWith("data:image/")) {
        logger(`[zimage] v1 同步生图成功! 图片长度: ${imageBase64.length}`);
        return imageBase64;
      }
    }
  } catch (e: any) {
    logger(`[zimage] v1 API 失败: ${e.message}`);
  }

  // ===== 尝试3: /generate 端点 (fallback) =====
  try {
    logger(`[zimage] submit endpoint used: POST ${baseUrl}/generate (fallback)`);
    const fallbackPayload = { prompt, width, height, steps, seed, cfg };
    const resp = await axios.post(`${baseUrl}/generate`, fallbackPayload, {
      headers: { "Content-Type": "application/json" },
      timeout: 120000,
    });

    logger(`[zimage] /generate response status: ${resp.status}`);
    const result = resp.data?.image || resp.data?.data || resp.data?.url || resp.data;
    const imageBase64 = await resolveImageResult(result, baseUrl);
    if (imageBase64.startsWith("data:image/")) {
      logger(`[zimage] /generate 生图成功!`);
      return imageBase64;
    }
  } catch (e: any) {
    logger(`[zimage] /generate 失败: ${e.message}`);
  }

  // ===== 尝试4: /v1/images/generations 端点 (fallback) =====
  try {
    logger(`[zimage] submit endpoint used: POST ${baseUrl}/v1/images/generations (fallback)`);
    const oaiPayload = {
      model: "z-image-turbo",
      prompt,
      size: `${width}x${height}`,
      n: 1,
      response_format: "b64_json",
    };
    const resp = await axios.post(`${baseUrl}/v1/images/generations`, oaiPayload, {
      headers: { "Content-Type": "application/json" },
      timeout: 120000,
    });

    logger(`[zimage] /v1/images/generations response status: ${resp.status}`);
    const b64 = resp.data?.data?.[0]?.b64_json;
    if (b64) {
      logger(`[zimage] /v1/images/generations 生图成功!`);
      return `data:image/png;base64,${b64}`;
    }
    const url = resp.data?.data?.[0]?.url;
    if (url) {
      return await urlToBase64(url);
    }
  } catch (e: any) {
    logger(`[zimage] /v1/images/generations 失败: ${e.message}`);
  }

  throw new Error("[zimage] 所有端点均失败：v2 API、v1 API、/generate、/v1/images/generations");
};

/** Poll Gradio SSE result with named parameter format */
const pollGradioResult = async (baseUrl: string, apiPath: string, eventId: string): Promise<string | null> => {
  const pollUrl = `${baseUrl}${apiPath}/${eventId}`;
  logger(`[zimage] 开始轮询: GET ${pollUrl}`);

  const pollResult = await pollTask(async () => {
    try {
      const resultResp = await axios.get(pollUrl, {
        timeout: 30000,
      });

      const resultData = resultResp.data;

      // Log preview
      const preview = typeof resultData === "string" ? resultData.substring(0, 500) : JSON.stringify(resultData).substring(0, 500);
      logger(`[zimage] poll preview first 500 chars: ${preview}`);

      // ===== SSE 文本格式 =====
      if (typeof resultData === "string") {
        const parsed = parseGradioSSE(resultData);

        if (parsed) {
          const msg = parsed.msg || "";

          // 仍在生成中
          if (msg === "process_generating" || msg === "estimation" || msg === "heartbeat") {
            return { completed: false };
          }

          // 生成完成
          if (msg === "process_completed" || msg === "complete") {
            const output = parsed.output?.data || parsed.data;
            if (output) {
              return { completed: true, data: JSON.stringify(output) };
            }
            return { completed: false };
          }

          // 有 output.data 或 data 字段 → 视为最终结果
          if (parsed.output?.data) {
            return { completed: true, data: JSON.stringify(parsed.output.data) };
          }
          if (parsed.data) {
            return { completed: true, data: JSON.stringify(parsed.data) };
          }

          // 无法判断 → 继续轮询
          return { completed: false };
        }

        // SSE 文本无法解析 → 继续轮询
        return { completed: false };
      }

      // ===== JSON 格式响应 =====
      if (resultData?.msg === "process_completed" || resultData?.msg === "complete") {
        const output = resultData?.output?.data || resultData?.data;
        if (output) {
          return { completed: true, data: JSON.stringify(output) };
        }
        return { completed: false };
      }
      if (resultData?.msg === "process_generating" || resultData?.msg === "estimation" || resultData?.msg === "heartbeat") {
        return { completed: false };
      }

      // 有 data 字段直接返回
      if (resultData?.data) {
        return { completed: true, data: JSON.stringify(resultData.data) };
      }

      // 其他未知响应 → 继续轮询
      return { completed: false };
    } catch (e: any) {
      logger(`[zimage] 轮询出错: ${e.message}`);
      return { completed: false };
    }
  }, 3000, 300000);

  if (pollResult.error) {
    throw new Error(`[zimage] Gradio 轮询失败: ${pollResult.error}`);
  }

  const rawResult = JSON.parse(pollResult.data!);
  logger(`[zimage] result image path/url: ${JSON.stringify(rawResult).substring(0, 200)}`);
  logger(`[zimage] 轮询完成，解析图片结果`);
  const imageBase64 = await resolveImageResult(rawResult, baseUrl);

  if (!imageBase64.startsWith("data:image/")) {
    throw new Error("[zimage] 图片结果格式错误，未获取到有效的 base64 图片");
  }

  logger(`[zimage] 生图成功! 图片长度: ${imageBase64.length}`);
  return imageBase64;
};

const videoRequest = async (_config: VideoConfig, _model: VideoModel): Promise<string> => {
  return "";
};

const ttsRequest = async (_config: TTSConfig, _model: TTSModel): Promise<string> => {
  return "";
};

const checkForUpdates = async (): Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }> => {
  return { hasUpdate: false, latestVersion: "2.1", notice: "" };
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
