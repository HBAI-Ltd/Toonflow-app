/**
 * 优云智算 ModelVerse 媒体模型适配器
 *
 * 依据（开发者提供的平台文档：https://www.compshare.cn/docs/modelverse/models/quick-start 及各模型页）：
 * - 认证鉴权：请求头 Authorization: Bearer <API Key>，主地址 https://api.modelverse.cn
 * - 图片：OpenAI 生图 /v1/images/generations、OpenAI 编辑 /v1/images/edits、Gemini /v1beta/models/{id}:generateContent
 * - 视频：任务提交 /v1/tasks/submit + 状态查询 /v1/tasks/status?task_id=
 *
 * 代码按「协议」而不是按模型名分支，因此同一协议的模型以后可在界面里直接新增。
 */

type MediaType = "image" | "video" | "audio";

type ProviderFormRule = {
  type: string;
  field: string;
  title: string;
  value: unknown;
  props?: Record<string, unknown>;
};

type ProviderModel = {
  id: string;
  label: string;
  type: "text" | "image" | "video" | "audio";
  mode?: (string | string[])[];
  audio?: "optional" | boolean;
  imageSizes?: string[];
  imageRatios?: string[];
  durationResolutionMap?: { duration: number[]; resolution: string[] }[];
};

type MediaInput =
  | { type: "url"; url: string; mimeType?: string }
  | { type: "base64"; data: string; mimeType: string }
  | { type: "binary"; data: Uint8Array; mimeType: string };

type MediaAsset = MediaInput & { mediaType: MediaType };

type ImageRequest = {
  model: string;
  prompt: string;
  images?: MediaInput[];
  mask?: MediaInput;
  n?: number;
  ratio?: string;
  size?: string;
  quality?: string;
  outputFormat?: string;
  other?: Record<string, unknown>;
};

type VideoRequest = {
  model: string;
  prompt: string;
  mode?: string | string[];
  images?: MediaInput[];
  videos?: MediaInput[];
  audios?: MediaInput[];
  firstFrame?: MediaInput;
  lastFrame?: MediaInput;
  duration?: number;
  ratio?: string;
  resolution?: string;
  generateAudio?: boolean;
  watermark?: boolean;
  other?: Record<string, unknown>;
};

type Context = {
  config: { apiKey?: string; minimaxApiKey?: string };
  signal?: AbortSignal;
  tool: {
    fetch: typeof fetch;
    errorMessage(value: unknown): string;
    audio: {
      convert(input: Uint8Array, options: { format: "wav" | "mp3" }): Promise<{ data: Uint8Array; mimeType: string }>;
    };
  };
};

const API_BASE = "https://api.modelverse.cn";
/** MiniMax H3 视频工作台（优云智算）的接口地址。 */
const H3_BASE = "https://cp.compshare.cn";
/** MiniMax H3 任务轮询间隔（文档建议 3 秒一次）。 */
const H3_POLL_INTERVAL = 3000;
/** MiniMax H3 任务总等待上限（毫秒）。 */
const H3_TOTAL_TIMEOUT = 1800000;

const IMAGE_RATIOS = ["1:1", "3:2", "2:3", "4:3", "3:4", "4:5", "5:4", "16:9", "9:16", "21:9"];

/** 图片生成总超时（毫秒）。 */
const IMAGE_TIMEOUT = 300000;
/** 视频提交请求超时（毫秒）。 */
const SUBMIT_TIMEOUT = 120000;
/** 单个状态查询请求超时（毫秒）。 */
const STATUS_TIMEOUT = 60000;
/** 视频任务总等待上限（毫秒）。 */
const VIDEO_TOTAL_TIMEOUT = 1800000;
/** 状态轮询间隔（毫秒）。 */
const POLL_INTERVAL = 5000;

/**
 * gpt-image-2 尺寸归一化表：界面选「比例 + 1K/2K/4K」，这里换算成平台支持的像素尺寸。
 * 换算规则：长边取该档基准（1K=1024、2K=2048、4K=3840），另一边按比例换算并对齐 16；
 * 若超过平台限制（长边 ≤ 3840、像素 655360~8294400、宽高比 ≤ 3:1），再按比例收一档。
 * 例：4K 的 1:1 收为 2880x2880，21:9 收为 3808x1632。
 */
const GPT_IMAGE_SIZE_MAP: Record<string, Record<string, string>> = {
  "1K": {
    "1:1": "1024x1024",
    "3:2": "1248x832",
    "2:3": "832x1248",
    "4:3": "1152x864",
    "3:4": "864x1152",
    "4:5": "896x1120",
    "5:4": "1120x896",
    "16:9": "1360x768",
    "9:16": "768x1360",
    "21:9": "1568x672",
  },
  "2K": {
    "1:1": "2048x2048",
    "3:2": "2496x1664",
    "2:3": "1664x2496",
    "4:3": "2368x1776",
    "3:4": "1776x2368",
    "4:5": "1856x2320",
    "5:4": "2320x1856",
    "16:9": "2736x1536",
    "9:16": "1536x2736",
    "21:9": "3136x1344",
  },
  "4K": {
    "1:1": "2880x2880",
    "3:2": "3504x2336",
    "2:3": "2336x3504",
    "4:3": "3312x2480",
    "3:4": "2480x3312",
    "4:5": "2560x3200",
    "5:4": "3200x2560",
    "16:9": "3840x2160",
    "9:16": "2160x3840",
    "21:9": "3808x1632",
  },
};

/** 保留 HTTP 状态码，便于外层给出可读文案而不暴露原始响应体。 */
class RequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "RequestError";
    this.status = status;
  }
}

/** MiniMax H3 走视频工作台接口，使用单独的一份密钥。 */
function isH3Model(model: string): boolean {
  const lower = model.toLowerCase();
  // 注意：ModelVerse 里也有 MiniMax-Hailuo 这样的模型，不能按 minimax 前缀判断
  if (lower.indexOf("hailuo") !== -1) {
    return false;
  }
  return lower.indexOf("minimax-h3") !== -1 || lower.indexOf("h3") !== -1;
}

function normalizeKey(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }
  return value
    .trim()
    .replace(/^Bearer\s+/i, "")
    .trim();
}

/** ModelVerse 模型用的密钥。 */
function requireModelVerseKey(context: Context): string {
  const apiKey = normalizeKey(context.config.apiKey);
  if (!apiKey) {
    throw new Error("请先在供应商配置中填写 API Key");
  }
  return apiKey;
}

/** MiniMax H3 用的密钥，与 ModelVerse 的 API Key 分开填写。 */
function requireH3Key(context: Context): string {
  const apiKey = normalizeKey(context.config.minimaxApiKey);
  if (!apiKey) {
    throw new Error("请先填写 MiniMax API Key（在优云智算视频工作台的 API 窗口创建，通常是 sk-ml- 开头）");
  }
  return apiKey;
}

function authHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: "Bearer " + apiKey,
    "Content-Type": "application/json",
  };
}

/**
 * 合并超时与外部取消信号。宿主提供 AbortSignal，
 * 但这里不依赖 AbortSignal.any，避免不同运行时的差异。
 */
function createSignal(context: Context, timeoutMs: number): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const external = context.signal;
  if (!external) {
    return timeoutSignal;
  }
  const controller = new AbortController();
  const abort = (): void => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  };
  if (timeoutSignal.aborted || external.aborted) {
    abort();
    return controller.signal;
  }
  const onTimeout = (): void => abort();
  const onExternal = (): void => abort();
  timeoutSignal.addEventListener("abort", onTimeout, { once: true });
  external.addEventListener("abort", onExternal, { once: true });
  controller.signal.addEventListener(
    "abort",
    () => {
      timeoutSignal.removeEventListener("abort", onTimeout);
      external.removeEventListener("abort", onExternal);
    },
    { once: true },
  );
  return controller.signal;
}

async function readErrorBody(response: { status: number; text(): Promise<string> }, tool: Context["tool"]): Promise<RequestError> {
  let raw = "";
  try {
    raw = await response.text();
  } catch {
    raw = "";
  }
  if (!raw) {
    return new RequestError(response.status, "请求失败，HTTP " + response.status);
  }
  let parsed: unknown = undefined;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }
  if (parsed && typeof parsed === "object") {
    const root = parsed as Record<string, unknown>;
    const nested = root.error && typeof root.error === "object" ? (root.error as Record<string, unknown>) : undefined;
    const source = nested ?? root;
    const code = typeof source.code === "string" ? source.code : "";
    const detail = tool.errorMessage(source);
    if (detail && code) {
      return new RequestError(response.status, "请求失败，HTTP " + response.status + "（" + code + "）：" + detail);
    }
    if (detail) {
      return new RequestError(response.status, "请求失败，HTTP " + response.status + "：" + detail);
    }
  }
  return new RequestError(response.status, "请求失败，HTTP " + response.status + "：" + tool.errorMessage(raw));
}

async function parseJsonBody(response: { json(): Promise<unknown> }): Promise<Record<string, unknown>> {
  let payload: unknown = undefined;
  try {
    payload = await response.json();
  } catch {
    throw new Error("接口返回的内容不是有效 JSON，无法解析生成结果");
  }
  if (!payload || typeof payload !== "object") {
    throw new Error("接口返回结构异常，未找到生成结果");
  }
  return payload as Record<string, unknown>;
}

async function requestJson(
  context: Context,
  url: string,
  init: { method: string; headers: Record<string, string>; body?: RequestInit["body"]; signal: AbortSignal },
): Promise<Record<string, unknown>> {
  const response = await context.tool.fetch(url, {
    method: init.method,
    headers: init.headers,
    body: init.body,
    signal: init.signal,
  });
  if (!response.ok) {
    throw await readErrorBody(response, context.tool);
  }
  return parseJsonBody(response);
}

/** 保留本地校验文案（例如「请填写 API Key」）。 */
function friendlyError(error: unknown): Error {
  if (error instanceof RequestError) {
    return new Error(error.message);
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error("调用 ModelVerse 失败，请稍后重试");
}

function ensureHttpUrl(value: unknown): string {
  if (typeof value !== "string" || !value) {
    return "";
  }
  const trimmed = value.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "";
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "";
  }
  return trimmed;
}

function extensionOf(url: string): string {
  let pathname = url;
  try {
    pathname = new URL(url).pathname;
  } catch {
    pathname = url;
  }
  const matched = /\.([a-zA-Z0-9]+)$/.exec(pathname);
  return matched ? matched[1].toLowerCase() : "";
}

function guessMimeFromUrl(url: string, fallback: string): string {
  const ext = extensionOf(url);
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "bmp") return "image/bmp";
  return fallback;
}

function guessAudioMimeFromUrl(url: string): string {
  const ext = extensionOf(url);
  if (ext === "wav") return "audio/wav";
  if (ext === "mp3") return "audio/mpeg";
  if (ext === "m4a") return "audio/mp4";
  if (ext === "aac") return "audio/aac";
  if (ext === "flac") return "audio/flac";
  if (ext === "ogg" || ext === "opus") return "audio/ogg";
  return "audio/mpeg";
}

function decodeBase64(data: string): Uint8Array {
  const cleaned = data.replace(/\s/g, "");
  if (!cleaned || !/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned)) {
    throw new Error("参考素材的 Base64 数据无效，无法上传给 ModelVerse");
  }
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function splitBase64(data: string): { mimeType: string; payload: string } {
  const trimmed = data.trim();
  const matched = /^data:([^;,]+);base64,(.*)$/i.exec(trimmed);
  if (matched) {
    return { mimeType: matched[1].toLowerCase(), payload: matched[2] };
  }
  return { mimeType: "", payload: trimmed };
}

function bytesToBase64(data: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < data.length; index += 1) {
    binary += String.fromCharCode(data[index]);
  }
  return btoa(binary);
}

/** 把任何来源的素材统一成可上传字节。 */
async function toBinaryBytes(
  context: Context,
  input: MediaInput,
  timeoutMs: number,
  fallbackMime: string,
): Promise<{ data: Uint8Array; mimeType: string }> {
  if (input.type === "binary") {
    return { data: input.data, mimeType: input.mimeType || fallbackMime };
  }
  if (input.type === "base64") {
    const split = splitBase64(input.data);
    return { data: decodeBase64(split.payload), mimeType: input.mimeType || split.mimeType || fallbackMime };
  }
  const url = ensureHttpUrl(input.url);
  if (!url) {
    throw new Error("参考素材地址无效，只支持 HTTP(S) 地址或素材数据");
  }
  const response = await context.tool.fetch(url, { signal: createSignal(context, timeoutMs) });
  if (!response.ok) {
    throw new Error("读取参考素材失败，HTTP " + response.status);
  }
  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get("content-type");
  const mimeType = input.mimeType || (contentType ? contentType.split(";")[0].trim() : "") || guessMimeFromUrl(url, fallbackMime);
  return { data: new Uint8Array(buffer), mimeType };
}

/** 参考图统一成 URL 或 Data URL（文档要求 data:image/xxx;base64,... 且格式小写）。 */
function toImageUrl(input: MediaInput, fallbackMime: string): string {
  if (input.type === "url") {
    const url = ensureHttpUrl(input.url);
    if (!url) {
      throw new Error("参考图地址无效，只支持 HTTP(S) 地址或图片数据");
    }
    return url;
  }
  if (input.type === "base64") {
    const split = splitBase64(input.data);
    const mimeType = input.mimeType || split.mimeType || fallbackMime;
    return "data:" + mimeType + ";base64," + split.payload;
  }
  return "data:" + (input.mimeType || fallbackMime) + ";base64," + bytesToBase64(input.data);
}

/** 参考音频：优先直接给地址，否则按文档包成 Data URL。 */
async function toAudioUrl(context: Context, input: MediaInput): Promise<string> {
  if (input.type === "url") {
    const url = ensureHttpUrl(input.url);
    if (!url) {
      throw new Error("参考音频地址无效，只支持 HTTP(S) 地址或音频数据");
    }
    return url;
  }
  const source = await toBinaryBytes(context, input, SUBMIT_TIMEOUT, "audio/mpeg");
  const declared = (source.mimeType || "audio/mpeg").toLowerCase().split(";")[0].trim();
  return "data:" + declared + ";base64," + bytesToBase64(source.data);
}

/** 极简 multipart/form-data 构造，避免依赖宿主不保证存在的 FormData / File。 */
class MultipartBody {
  readonly boundary: string;
  private chunks: Uint8Array[] = [];
  private finished = false;

  constructor(boundary: string) {
    this.boundary = boundary;
  }

  appendField(name: string, value: string): void {
    this.pushText("--" + this.boundary + "\r\n");
    this.pushText('Content-Disposition: form-data; name="' + name + '"\r\n\r\n');
    this.pushText(value + "\r\n");
  }

  appendFile(name: string, filename: string, mimeType: string, data: Uint8Array): void {
    this.pushText("--" + this.boundary + "\r\n");
    this.pushText('Content-Disposition: form-data; name="' + name + '"; filename="' + filename + '"\r\n');
    this.pushText("Content-Type: " + mimeType + "\r\n\r\n");
    this.chunks.push(data);
    this.pushText("\r\n");
  }

  finish(): Uint8Array<ArrayBuffer> {
    if (!this.finished) {
      this.pushText("--" + this.boundary + "--\r\n");
      this.finished = true;
    }
    let total = 0;
    for (const chunk of this.chunks) {
      total += chunk.length;
    }
    const output = new Uint8Array(total);
    let offset = 0;
    for (const chunk of this.chunks) {
      output.set(chunk, offset);
      offset += chunk.length;
    }
    return output;
  }

  private pushText(text: string): void {
    this.chunks.push(new TextEncoder().encode(text));
  }
}

const MEDIA_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/bmp": "bmp",
};

function extensionFor(mimeType: string, fallback: string): string {
  const value = MEDIA_EXTENSIONS[mimeType.toLowerCase()];
  return value ? value : fallback;
}

function parseSizeValue(size: string): { width: number; height: number } | undefined {
  const matched = /^(\d{2,5})\s*[x*×]\s*(\d{2,5})$/i.exec(size.trim());
  if (!matched) {
    return undefined;
  }
  return { width: Number(matched[1]), height: Number(matched[2]) };
}

function validateGptImagePixels(size: string): string {
  const trimmed = size.trim();
  const parsed = parseSizeValue(trimmed);
  if (!parsed) {
    throw new Error("这类模型的尺寸需要写成 1K、2K、4K，或 1024x1024 这样的宽x高像素值");
  }
  const { width, height } = parsed;
  if (width % 16 !== 0 || height % 16 !== 0) {
    throw new Error("这类模型的宽和高都必须是 16 的倍数");
  }
  const pixels = width * height;
  if (pixels < 655360 || pixels > 8294400) {
    throw new Error("这类模型的像素总数需在 655360 到 8294400 之间，例如 1024x1024");
  }
  const maxSide = Math.max(width, height);
  const minSide = Math.min(width, height);
  if (maxSide > 3840) {
    throw new Error("这类模型的宽高最大 3840 像素");
  }
  if (maxSide / minSide > 3) {
    throw new Error("这类模型的宽高比最大 3:1");
  }
  return width + "x" + height;
}

/** 把「比例 + 1K/2K/4K」折算成 gpt-image-2 支持的像素尺寸。 */
function resolveGptImageSize(rawSize: string, rawRatio: string): string {
  const size = rawSize.trim();
  const ratio = rawRatio.trim();
  const tierKey = size.toUpperCase();
  const isTier = tierKey === "1K" || tierKey === "2K" || tierKey === "4K";
  if (size && !isTier && !parseSizeValue(size) && /^[\d.]+k$/i.test(tierKey)) {
    throw new Error("这类模型的清晰度只支持 1K、2K、4K");
  }
  let effectiveRatio = ratio;
  if (size && !isTier && !parseSizeValue(size)) {
    if (ratio && ratio !== size) {
      throw new Error("比例和尺寸都填了，请只填一处");
    }
    effectiveRatio = size;
  }
  if (!isTier && !effectiveRatio) {
    return size ? validateGptImagePixels(size) : "";
  }
  const tier = isTier ? tierKey : "1K";
  const ratioKey = effectiveRatio || "1:1";
  if (IMAGE_RATIOS.indexOf(ratioKey) === -1) {
    throw new Error("这类模型支持的画面比例为：" + IMAGE_RATIOS.join("、"));
  }
  return GPT_IMAGE_SIZE_MAP[tier][ratioKey];
}

/** Qwen 图片接口的尺寸格式是「宽*高」。 */
function resolveQwenSize(rawSize: string, rawRatio: string): string {
  const size = rawSize.trim();
  const ratio = rawRatio.trim();
  const parsed = parseSizeValue(size);
  if (parsed) {
    const pixels = parsed.width * parsed.height;
    if (parsed.width < 512 || parsed.height < 512 || pixels > 4194304) {
      throw new Error("这类模型的尺寸需在 512x512 到 2048x2048 之间");
    }
    const ratioValue = parsed.width / parsed.height;
    if (ratioValue < 1 / 8 || ratioValue > 8) {
      throw new Error("这类模型的宽高比需在 1:8 到 8:1 之间");
    }
    return parsed.width + "*" + parsed.height;
  }
  const ratioKey = size || ratio;
  if (!ratioKey) {
    return "";
  }
  if (IMAGE_RATIOS.indexOf(ratioKey) === -1) {
    throw new Error("这类模型支持的画面比例为：" + IMAGE_RATIOS.join("、"));
  }
  return GPT_IMAGE_SIZE_MAP["1K"][ratioKey].replace("x", "*");
}

function ensureNoUnsupportedImageOptions(protocol: string, request: ImageRequest): void {
  if (Object.keys(request.other ?? {}).length > 0) {
    throw new Error("这类模型暂不支持自定义扩展参数");
  }
  if (protocol !== "gpt" && request.quality !== undefined && request.quality.trim()) {
    throw new Error("这类模型不支持画质档位参数");
  }
}

/** 图片协议：gemini / gpt-image 系列 / Qwen Image 3.0 / 其它 OpenAI 兼容图片模型。 */
function imageProtocolOf(model: string): string {
  const lower = model.toLowerCase();
  if (lower.indexOf("gemini") !== -1) {
    return "gemini";
  }
  if (lower.indexOf("gpt-image") !== -1) {
    return "gpt";
  }
  if (lower.indexOf("qwen-image-3") !== -1) {
    return "qwen3";
  }
  return "openai";
}

/** 视频协议：seedance / hailuo / vidu / wan。 */
function videoProtocolOf(model: string): string {
  const lower = model.toLowerCase();
  if (lower.indexOf("seedance") !== -1) {
    return "seedance";
  }
  if (lower.indexOf("hailuo") !== -1 || lower.indexOf("minimax") !== -1) {
    return "hailuo";
  }
  if (lower.indexOf("vidu") !== -1) {
    return "vidu";
  }
  if (lower.indexOf("wan") !== -1) {
    return "wan";
  }
  return "seedance";
}

function normalizeMode(mode: string | string[] | undefined): string {
  if (mode === undefined) {
    return "";
  }
  return Array.isArray(mode) ? mode.join(",") : mode;
}

function collectImageAssets(payload: Record<string, unknown>, fallbackMime: string): MediaAsset[] {
  const data = payload.data;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("接口未返回生成结果");
  }
  const assets: MediaAsset[] = [];
  const failures: string[] = [];
  for (const item of data) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const entry = item as Record<string, unknown>;
    if (entry.error && typeof entry.error === "object") {
      const failed = entry.error as Record<string, unknown>;
      failures.push(typeof failed.message === "string" ? failed.message : "接口未说明原因");
      continue;
    }
    const url = ensureHttpUrl(entry.url);
    if (url) {
      assets.push({ mediaType: "image", type: "url", url, mimeType: fallbackMime });
      continue;
    }
    const base64Value = entry.b64_json ?? entry.b64 ?? entry.base64;
    if (typeof base64Value === "string" && base64Value.trim()) {
      const split = splitBase64(base64Value);
      assets.push({
        mediaType: "image",
        type: "base64",
        data: split.payload,
        mimeType: split.mimeType || fallbackMime,
      });
    }
  }
  if (assets.length === 0) {
    if (failures.length > 0) {
      throw new Error("生成失败：" + failures.join("；"));
    }
    throw new Error("接口未返回可用的生成结果");
  }
  return assets;
}

function collectGeminiImageAssets(payload: Record<string, unknown>): MediaAsset[] {
  const candidates = payload.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error("接口未返回生成结果");
  }
  const assets: MediaAsset[] = [];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }
    const content = (candidate as Record<string, unknown>).content;
    if (!content || typeof content !== "object") {
      continue;
    }
    const parts = (content as Record<string, unknown>).parts;
    if (!Array.isArray(parts)) {
      continue;
    }
    for (const part of parts) {
      if (!part || typeof part !== "object") {
        continue;
      }
      const entry = part as Record<string, unknown>;
      // 思考过程里的中间图要跳过
      if (entry.thought === true) {
        continue;
      }
      const inline = entry.inlineData ?? entry.inline_data;
      if (!inline || typeof inline !== "object") {
        continue;
      }
      const inlineEntry = inline as Record<string, unknown>;
      const data = inlineEntry.data;
      if (typeof data !== "string" || !data.trim()) {
        continue;
      }
      const mimeType = typeof inlineEntry.mimeType === "string" ? inlineEntry.mimeType : "image/png";
      assets.push({ mediaType: "image", type: "base64", data: data.trim(), mimeType });
    }
  }
  if (assets.length === 0) {
    throw new Error("接口未返回图片，可能只返回了文字说明");
  }
  return assets;
}

async function generateGeminiImage(context: Context, request: ImageRequest, apiKey: string): Promise<MediaAsset[]> {
  const prompt = request.prompt.trim();
  if (!prompt) {
    throw new Error("请先填写图片提示词");
  }
  const size = (request.size ?? "").trim().toUpperCase();
  const ratio = (request.ratio ?? "").trim();
  if (size && ["512", "1K", "2K", "4K"].indexOf(size) === -1) {
    throw new Error("这类模型的清晰度只支持 512、1K、2K、4K");
  }
  if (ratio && IMAGE_RATIOS.indexOf(ratio) === -1) {
    throw new Error("这类模型支持的画面比例为：" + IMAGE_RATIOS.join("、"));
  }
  const images = request.images ?? [];
  if (images.length > 0 || request.mask) {
    throw new Error("这类模型目前只支持文字生成图片，暂不能传入参考图");
  }
  const imageConfig: Record<string, unknown> = {};
  if (ratio) {
    imageConfig.aspectRatio = ratio;
  }
  if (size) {
    imageConfig.imageSize = size;
  }
  const generationConfig: Record<string, unknown> = { responseModalities: ["TEXT", "IMAGE"] };
  if (Object.keys(imageConfig).length > 0) {
    generationConfig.imageConfig = imageConfig;
  }
  const payload = await requestJson(context, API_BASE + "/v1beta/models/" + request.model + ":generateContent", {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    }),
    signal: createSignal(context, IMAGE_TIMEOUT),
  });
  return collectGeminiImageAssets(payload);
}

async function generateGptImage(context: Context, request: ImageRequest, apiKey: string): Promise<MediaAsset[]> {
  const prompt = request.prompt.trim();
  if (!prompt) {
    throw new Error("请先填写图片提示词");
  }
  if (request.n !== undefined && (request.n < 1 || request.n > 10)) {
    throw new Error("这类图片模型一次可生成 1 到 10 张图片");
  }
  const outputFormat = request.outputFormat ? request.outputFormat.trim().toLowerCase().replace("jpg", "jpeg") : "png";
  if (outputFormat !== "png" && outputFormat !== "jpeg") {
    throw new Error("这类模型只支持 png 或 jpeg 输出格式");
  }
  // 画质默认 medium
  let quality = "medium";
  if (request.quality !== undefined && request.quality.trim()) {
    quality = request.quality.trim().toLowerCase();
    if (quality !== "low" && quality !== "medium" && quality !== "high") {
      throw new Error("这类模型的画质只支持 low、medium、high");
    }
  }
  const size = resolveGptImageSize(request.size ?? "", request.ratio ?? "");
  const images = request.images ?? [];
  if (images.length > 1) {
    throw new Error("这类模型只支持传入 1 张参考图");
  }
  if (images.length === 0 && request.mask) {
    throw new Error("遮罩需要配合一张参考图一起使用");
  }
  const fields: Array<[string, string]> = [
    ["model", request.model],
    ["prompt", prompt],
  ];
  if (request.n !== undefined) {
    fields.push(["n", String(request.n)]);
  }
  if (size) {
    fields.push(["size", size]);
  }
  fields.push(["quality", quality]);
  fields.push(["output_format", outputFormat]);

  const signal = createSignal(context, IMAGE_TIMEOUT);
  let payload: Record<string, unknown>;
  if (images.length === 1) {
    const main = await toBinaryBytes(context, images[0], IMAGE_TIMEOUT, "image/png");
    const body = new MultipartBody("----modelverse" + Date.now().toString(16) + Math.random().toString(16).slice(2, 10));
    body.appendFile("image", "reference." + extensionFor(main.mimeType, "png"), main.mimeType, main.data);
    if (request.mask) {
      const mask = await toBinaryBytes(context, request.mask, IMAGE_TIMEOUT, "image/png");
      body.appendFile("mask", "mask." + extensionFor(mask.mimeType, "png"), mask.mimeType, mask.data);
    }
    for (const field of fields) {
      body.appendField(field[0], field[1]);
    }
    const response = await context.tool.fetch(API_BASE + "/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "multipart/form-data; boundary=" + body.boundary,
      },
      body: body.finish(),
      signal,
    });
    if (!response.ok) {
      throw await readErrorBody(response, context.tool);
    }
    payload = await parseJsonBody(response);
  } else {
    const bodyObject: Record<string, unknown> = { model: request.model, prompt };
    if (request.n !== undefined) {
      bodyObject.n = request.n;
    }
    if (size) {
      bodyObject.size = size;
    }
    bodyObject.quality = quality;
    bodyObject.output_format = outputFormat;
    payload = await requestJson(context, API_BASE + "/v1/images/generations", {
      method: "POST",
      headers: authHeaders(apiKey),
      body: JSON.stringify(bodyObject),
      signal,
    });
  }
  signal.throwIfAborted();
  return collectImageAssets(payload, outputFormat === "jpeg" ? "image/jpeg" : "image/png");
}

/**
 * 豆包 Seedream 系的 size 写法归一：
 * 官网示例里档位大小写混用（2k / 2K），像素值也允许 2048x2048、2048*2048 等写法，
 * 这里统一成平台推荐的 2K / 2048x2048；其它写法（例如 auto）原样透传。
 */
function normalizeSeedreamSize(size: string): string {
  const trimmed = size.trim();
  const tier = /^(\d+(?:\.\d+)?)\s*k$/i.exec(trimmed);
  if (tier) {
    return tier[1] + "K";
  }
  const parsed = parseSizeValue(trimmed);
  return parsed ? parsed.width + "x" + parsed.height : trimmed;
}

/**
 * 豆包 Seedream 系「分辨率档位 + 画面比例」对应的官方像素尺寸。
 * 来源：火山方舟「图片生成 API」→ size 参数里“采用方式 1 时，模型实际映射的宽高像素参考值”。
 * 平台的图片接口只认 size，不能单独传比例，所以只要选了比例，就换成这里对应的宽高像素值提交（方式 2），
 * 否则比例会被平台忽略、出图和所选比例不符。
 */
const SEEDREAM_RATIO_TABLES: { pattern: RegExp; defaultTier: string; tiers: Record<string, Record<string, string>> }[] = [
  {
    // Seedream 5.0 pro（doubao-seedream-5-0-pro-260628）：档位 1K、1.5K、2K，默认 2K
    pattern: /seedream-5-0-pro/,
    defaultTier: "2K",
    tiers: {
      "1K": {
        "1:1": "1024x1024",
        "4:3": "1152x864",
        "3:4": "864x1152",
        "16:9": "1424x800",
        "9:16": "800x1424",
        "3:2": "1248x832",
        "2:3": "832x1248",
        "21:9": "1568x672",
      },
      "1.5K": {
        "1:1": "1536x1536",
        "4:3": "1792x1344",
        "3:4": "1344x1792",
        "16:9": "2048x1152",
        "9:16": "1152x2048",
        "3:2": "1872x1248",
        "2:3": "1248x1872",
        "21:9": "2352x1008",
      },
      "2K": {
        "1:1": "2048x2048",
        "4:3": "2368x1776",
        "3:4": "1776x2368",
        "16:9": "2816x1584",
        "9:16": "1584x2816",
        "3:2": "2496x1664",
        "2:3": "1664x2496",
        "21:9": "3136x1344",
      },
    },
  },
  {
    // Seedream 5.0 / 5.0 lite（doubao-seedream-5-0-260128）：档位 2K、3K、4K，默认 2K
    pattern: /seedream-5-0/,
    defaultTier: "2K",
    tiers: {
      "2K": {
        "1:1": "2048x2048",
        "4:3": "2304x1728",
        "3:4": "1728x2304",
        "16:9": "2848x1600",
        "9:16": "1600x2848",
        "3:2": "2496x1664",
        "2:3": "1664x2496",
        "21:9": "3136x1344",
      },
      "3K": {
        "1:1": "3072x3072",
        "4:3": "3456x2592",
        "3:4": "2592x3456",
        "16:9": "4096x2304",
        "9:16": "2304x4096",
        "3:2": "3744x2496",
        "2:3": "2496x3744",
        "21:9": "4704x2016",
      },
      "4K": {
        "1:1": "4096x4096",
        "4:3": "4704x3520",
        "3:4": "3520x4704",
        "16:9": "5504x3040",
        "9:16": "3040x5504",
        "3:2": "4992x3328",
        "2:3": "3328x4992",
        "21:9": "6240x2656",
      },
    },
  },
  {
    // Seedream 4.5（doubao-seedream-4.5）：档位 2K、4K
    pattern: /seedream-4[.\-]?5/,
    defaultTier: "2K",
    tiers: {
      "2K": {
        "1:1": "2048x2048",
        "4:3": "2304x1728",
        "3:4": "1728x2304",
        "16:9": "2848x1600",
        "9:16": "1600x2848",
        "3:2": "2496x1664",
        "2:3": "1664x2496",
        "21:9": "3136x1344",
      },
      "4K": {
        "1:1": "4096x4096",
        "4:3": "4704x3520",
        "3:4": "3520x4704",
        "16:9": "5504x3040",
        "9:16": "3040x5504",
        "3:2": "4992x3328",
        "2:3": "3328x4992",
        "21:9": "6240x2656",
      },
    },
  },
  {
    // Seedream 4.0：档位 1K、2K、4K
    pattern: /seedream-4/,
    defaultTier: "2K",
    tiers: {
      "1K": {
        "1:1": "1024x1024",
        "4:3": "1152x864",
        "3:4": "864x1152",
        "16:9": "1280x720",
        "9:16": "720x1280",
        "3:2": "1248x832",
        "2:3": "832x1248",
        "21:9": "1512x648",
      },
      "2K": {
        "1:1": "2048x2048",
        "4:3": "2304x1728",
        "3:4": "1728x2304",
        "16:9": "2848x1600",
        "9:16": "1600x2848",
        "3:2": "2496x1664",
        "2:3": "1664x2496",
        "21:9": "3136x1344",
      },
      "4K": {
        "1:1": "4096x4096",
        "4:3": "4704x3520",
        "3:4": "3520x4704",
        "16:9": "5504x3040",
        "9:16": "3040x5504",
        "3:2": "4992x3328",
        "2:3": "3328x4992",
        "21:9": "6240x2656",
      },
    },
  },
];

function seedreamRatioTableOf(model: string): (typeof SEEDREAM_RATIO_TABLES)[number] | undefined {
  const lower = model.toLowerCase();
  for (const entry of SEEDREAM_RATIO_TABLES) {
    if (entry.pattern.test(lower)) {
      return entry;
    }
  }
  return undefined;
}

/** 像素值落在哪个档位：按各档 1:1 的像素总量取最接近的一档。 */
function closestSeedreamTier(entry: (typeof SEEDREAM_RATIO_TABLES)[number], width: number, height: number): string {
  const target = width * height;
  let best = entry.defaultTier;
  let bestGap = Number.POSITIVE_INFINITY;
  for (const tier of Object.keys(entry.tiers)) {
    const square = parseSizeValue(entry.tiers[tier]["1:1"]);
    if (!square) {
      continue;
    }
    const gap = Math.abs(square.width * square.height - target);
    if (gap < bestGap) {
      bestGap = gap;
      best = tier;
    }
  }
  return best;
}

/**
 * 豆包 Seedream：把「档位（可选）+ 比例」折算成官方像素尺寸。
 * 比例可能放在 request.ratio，也可能被宿主塞进 request.size（界面上比例和尺寸是同一个位置），两处都认。
 * 返回空串表示“没选比例、不需要换算”，此时按档位或原样像素值提交。
 */
function resolveSeedreamRatioSize(model: string, rawSize: string, rawRatio: string): string {
  const entry = seedreamRatioTableOf(model);
  if (!entry) {
    return "";
  }
  const pixelSize = parseSizeValue(rawSize);
  const ratio = rawRatio.trim() || (pixelSize ? "" : /^\d{1,2}:\d{1,2}$/.test(rawSize.trim()) ? rawSize.trim() : "");
  if (!ratio) {
    return "";
  }
  const supported = Object.keys(entry.tiers[entry.defaultTier]);
  if (supported.indexOf(ratio) === -1) {
    throw new Error("这类模型支持的画面比例为：" + supported.join("、"));
  }
  let tier = entry.defaultTier;
  if (pixelSize) {
    // 同时给了像素值和比例：保留像素值所在的档位，只把比例换成官方值
    tier = closestSeedreamTier(entry, pixelSize.width, pixelSize.height);
  } else {
    const wanted = rawSize.trim().toUpperCase();
    if (entry.tiers[wanted]) {
      tier = wanted;
    }
  }
  return entry.tiers[tier][ratio];
}

/**
 * 其它 OpenAI 兼容图片模型：
 * - seedream：size 支持分辨率档位或像素值；参考图上限 5.0 pro / flash 为 10 张，其余（5.0 lite / 4.5 / 4.0）为 14 张
 * - Qwen/Qwen-Image-Edit、stepfun-ai/step1x-edit：单张参考图，走 image 字段
 * - Qwen/Qwen-Image：纯文生图
 */
async function generateOpenAiImage(context: Context, request: ImageRequest, apiKey: string): Promise<MediaAsset[]> {
  const prompt = request.prompt.trim();
  if (!prompt) {
    throw new Error("请先填写图片提示词");
  }
  const lower = request.model.toLowerCase();
  const isSeedream = lower.indexOf("seedream") !== -1;
  const isStep1x = lower.indexOf("step1x") !== -1;
  const isQwenImageEdit = lower.indexOf("qwen-image-edit") !== -1;
  const singleOnly = isStep1x || isQwenImageEdit;
  const images = request.images ?? [];
  if (singleOnly && images.length > 1) {
    throw new Error("这类模型只支持传入 1 张参考图");
  }
  // 官网「图片生成 API」：Seedream 5.0 pro / flash 最多 10 张参考图，5.0 lite / 4.5 / 4.0 最多 14 张
  const seedreamMaxReferences = /seedream-5-0-(pro|flash)/.test(lower) ? 10 : 14;
  if (isSeedream && images.length > seedreamMaxReferences) {
    throw new Error("这类模型最多支持 " + seedreamMaxReferences + " 张参考图");
  }
  if (isStep1x && images.length === 0) {
    throw new Error("这类模型需要一张参考图");
  }
  if (isSeedream && request.n !== undefined && request.n > 1) {
    throw new Error("这类模型每次只生成一张图片");
  }
  const bodyObject: Record<string, unknown> = { model: request.model, prompt };
  if (request.n !== undefined && !isSeedream) {
    bodyObject.n = request.n;
  }
  const rawSize = request.size !== undefined ? request.size.trim() : "";
  const rawRatio = request.ratio !== undefined ? request.ratio.trim() : "";
  if (isSeedream) {
    // 选了比例就换成官方像素尺寸，否则平台的 size 只认档位/像素值，比例会被丢掉
    const mapped = resolveSeedreamRatioSize(lower, rawSize, rawRatio);
    const size = mapped || normalizeSeedreamSize(rawSize);
    if (size) {
      bodyObject.size = size;
    }
  } else if (rawSize) {
    bodyObject.size = rawSize;
  }
  if (images.length > 0) {
    const urls = images.map((image) => toImageUrl(image, "image/png"));
    if (singleOnly) {
      bodyObject.image = urls[0];
    } else {
      bodyObject.images = urls;
    }
  }
  if (isSeedream) {
    bodyObject.response_format = "url";
    bodyObject.watermark = false;
  }
  const payload = await requestJson(context, API_BASE + "/v1/images/generations", {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify(bodyObject),
    signal: createSignal(context, IMAGE_TIMEOUT),
  });
  return collectImageAssets(payload, "image/png");
}

/** Qwen Image 3.0：同步生图，支持 1-3 张参考图与反向提示词。 */
async function generateQwen3Image(context: Context, request: ImageRequest, apiKey: string): Promise<MediaAsset[]> {
  const prompt = request.prompt.trim();
  if (!prompt) {
    throw new Error("请先填写图片提示词");
  }
  const images = request.images ?? [];
  if (images.length > 3) {
    throw new Error("这类模型最多支持 3 张参考图");
  }
  if (request.n !== undefined && (request.n < 1 || request.n > 6)) {
    throw new Error("这类模型一次可生成 1 到 6 张图片");
  }
  const size = resolveQwenSize(request.size ?? "", request.ratio ?? "");
  const bodyObject: Record<string, unknown> = { model: request.model, prompt };
  if (request.n !== undefined) {
    bodyObject.n = request.n;
  }
  if (size) {
    bodyObject.size = size;
  }
  if (images.length === 1) {
    bodyObject.image = toImageUrl(images[0], "image/png");
  } else if (images.length > 1) {
    bodyObject.images = images.map((image) => toImageUrl(image, "image/png"));
  }
  bodyObject.watermark = false;
  const payload = await requestJson(context, API_BASE + "/v1/images/generations", {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify(bodyObject),
    signal: createSignal(context, IMAGE_TIMEOUT),
  });
  return collectImageAssets(payload, "image/png");
}

type VideoSkeleton = {
  input: Record<string, unknown>;
  parameters: Record<string, unknown>;
};

/** 豆包 Seedance 系列：content 数组 + parameters。 */
async function buildSeedanceBody(context: Context, request: VideoRequest): Promise<VideoSkeleton> {
  const mode = normalizeMode(request.mode);
  const images = request.images ?? [];
  const videos = request.videos ?? [];
  const audios = request.audios ?? [];
  const hasFirstFrame = request.firstFrame !== undefined;
  const hasLastFrame = request.lastFrame !== undefined;
  const content: Record<string, unknown>[] = [{ type: "text", text: request.prompt.trim() }];
  if (mode === "singleImage") {
    if (!hasFirstFrame) {
      throw new Error("这种模式需要一张首帧图片");
    }
    content.push({
      type: "image_url",
      image_url: { url: toImageUrl(request.firstFrame as MediaInput, "image/png") },
      role: "first_frame",
    });
  } else if (mode === "startEndRequired" || mode === "endFrameOptional" || mode === "startFrameOptional") {
    if (hasFirstFrame) {
      content.push({
        type: "image_url",
        image_url: { url: toImageUrl(request.firstFrame as MediaInput, "image/png") },
        role: "first_frame",
      });
    }
    if (hasLastFrame) {
      content.push({
        type: "image_url",
        image_url: { url: toImageUrl(request.lastFrame as MediaInput, "image/png") },
        role: "last_frame",
      });
    }
  } else if (mode.indexOf("Reference") !== -1) {
    for (const image of images) {
      content.push({ type: "image_url", image_url: { url: toImageUrl(image, "image/png") }, role: "reference_image" });
    }
    for (const video of videos) {
      const url = ensureHttpUrl(video.type === "url" ? video.url : "");
      if (!url) {
        throw new Error("参考视频目前只支持 HTTP(S) 地址");
      }
      content.push({ type: "video_url", video_url: { url }, role: "reference_video" });
    }
    for (const audio of audios) {
      content.push({ type: "audio_url", audio_url: { url: await toAudioUrl(context, audio) }, role: "reference_audio" });
    }
  } else if (hasFirstFrame || hasLastFrame || images.length > 0 || videos.length > 0 || audios.length > 0) {
    throw new Error("当前是纯文字生成视频模式，不能同时传入图片、视频或音频");
  }
  const parameters: Record<string, unknown> = {};
  if (request.duration !== undefined) {
    parameters.duration = Math.round(request.duration);
  }
  if (request.resolution !== undefined && request.resolution.trim()) {
    parameters.resolution = request.resolution.trim().toLowerCase();
  }
  if (request.ratio !== undefined && request.ratio.trim()) {
    parameters.ratio = request.ratio.trim();
  }
  if (request.generateAudio !== undefined) {
    parameters.generate_audio = request.generateAudio;
  }
  if (request.watermark !== undefined) {
    parameters.watermark = request.watermark;
  }
  return { input: { content }, parameters };
}

/** MiniMax Hailuo 2.3：first_frame_image + prompt。 */
async function buildHailuoBody(context: Context, request: VideoRequest): Promise<VideoSkeleton> {
  const mode = normalizeMode(request.mode);
  const input: Record<string, unknown> = { prompt: request.prompt.trim() };
  if (mode !== "text" && request.firstFrame) {
    const frame = await toBinaryBytes(context, request.firstFrame, SUBMIT_TIMEOUT, "image/jpeg");
    input.first_frame_image = "data:" + frame.mimeType + ";base64," + bytesToBase64(frame.data);
  } else if (mode !== "text") {
    throw new Error("这种模式需要一张首帧图片");
  }
  const parameters: Record<string, unknown> = {};
  if (request.duration !== undefined) {
    parameters.duration = Math.round(request.duration);
  }
  if (request.resolution !== undefined && request.resolution.trim()) {
    parameters.resolution = request.resolution.trim().toUpperCase();
  }
  if (request.watermark !== undefined) {
    parameters.aigc_watermark = request.watermark;
  }
  return { input, parameters };
}

/** Vidu 系列：按 vidu_type 区分接口类型。 */
async function buildViduBody(context: Context, request: VideoRequest): Promise<VideoSkeleton> {
  const mode = normalizeMode(request.mode);
  const lower = request.model.toLowerCase();
  const input: Record<string, unknown> = { prompt: request.prompt.trim() };
  const parameters: Record<string, unknown> = {};
  const modeLower = mode.toLowerCase();
  const videos = request.videos ?? [];
  const audios = request.audios ?? [];
  const isLipSync = lower.indexOf("lip-sync") !== -1;
  // 视频延长：模型名带 extend，或只给了参考视频（对口型要同时给音频/文字）
  const isExtend = lower.indexOf("extend") !== -1 || (!isLipSync && videos.length > 0 && audios.length === 0 && modeLower.indexOf("video") !== -1);
  // 参考图模式：模式串里出现 imageReference，或模型名带 reference 且确实给了参考图
  const isReference = modeLower.indexOf("imagereference") !== -1 || (lower.indexOf("reference") !== -1 && (request.images ?? []).length > 0);
  if (isExtend) {
    if (!request.videos || request.videos.length === 0) {
      throw new Error("视频延长需要传入一段参考视频");
    }
    const video = request.videos[0];
    const url = ensureHttpUrl(video.type === "url" ? video.url : "");
    if (!url) {
      throw new Error("视频延长只支持 HTTP(S) 地址的参考视频");
    }
    input.video_url = url;
    if (request.lastFrame) {
      input.last_frame_url = toImageUrl(request.lastFrame, "image/png");
    }
    parameters.vidu_type = "extend";
  } else if (isLipSync) {
    if (!request.videos || request.videos.length === 0) {
      throw new Error("对口型需要传入一段参考视频");
    }
    const video = request.videos[0];
    const url = ensureHttpUrl(video.type === "url" ? video.url : "");
    if (!url) {
      throw new Error("对口型只支持 HTTP(S) 地址的参考视频");
    }
    input.video_url = url;
    const text = typeof request.other?.text === "string" ? (request.other.text as string) : "";
    if (request.audios && request.audios.length > 0) {
      input.audio_url = await toAudioUrl(context, request.audios[0]);
    } else if (text) {
      input.text = text;
    } else {
      throw new Error("对口型需要一段参考音频，或一段要朗读的文字");
    }
    parameters.vidu_type = "lip-sync";
  } else if (isReference) {
    const images = request.images ?? [];
    if (images.length === 0) {
      throw new Error("参考生视频需要至少 1 张参考图");
    }
    if (images.length > 7) {
      throw new Error("参考生视频最多支持 7 张参考图");
    }
    input.images = images.map((image) => toImageUrl(image, "image/png"));
    parameters.vidu_type = "reference2video";
    if (request.ratio !== undefined && request.ratio.trim()) {
      parameters.aspect_ratio = request.ratio.trim();
    }
  } else if (mode === "startEndRequired") {
    if (!request.firstFrame || !request.lastFrame) {
      throw new Error("这种模式需要同时提供首帧和尾帧两张图片");
    }
    input.first_frame_url = toImageUrl(request.firstFrame, "image/png");
    input.last_frame_url = toImageUrl(request.lastFrame, "image/png");
    parameters.vidu_type = "start-end2video";
  } else if (mode === "text") {
    parameters.vidu_type = "text2video";
    if (request.ratio !== undefined && request.ratio.trim()) {
      parameters.aspect_ratio = request.ratio.trim();
    }
  } else {
    if (!request.firstFrame) {
      throw new Error("这种模式需要一张首帧图片");
    }
    input.first_frame_url = toImageUrl(request.firstFrame, "image/png");
    parameters.vidu_type = "img2video";
  }
  if (request.duration !== undefined) {
    parameters.duration = Math.round(request.duration);
  }
  if (request.resolution !== undefined && request.resolution.trim()) {
    parameters.resolution = request.resolution.trim().toLowerCase();
  }
  return { input, parameters };
}

/**
 * 阿里 Wan 系列：i2v 用首尾帧字段，t2v 按型号用尺寸字段；
 * 2.5/2.6 部分型号支持参考音频。
 */
async function buildWanBody(context: Context, request: VideoRequest): Promise<VideoSkeleton> {
  const mode = normalizeMode(request.mode);
  const lower = request.model.toLowerCase();
  const isI2V = lower.indexOf("i2v") !== -1 || (mode !== "" && mode !== "text" && mode.indexOf("Reference") === -1);
  const input: Record<string, unknown> = { prompt: request.prompt.trim() };
  const parameters: Record<string, unknown> = {};
  if (isI2V) {
    if (!request.firstFrame) {
      throw new Error("这种模式需要一张首帧图片");
    }
    input.first_frame_url = toImageUrl(request.firstFrame, "image/png");
    if (request.lastFrame && lower.indexOf("wan2.2-i2v") !== -1) {
      input.last_frame_url = toImageUrl(request.lastFrame, "image/png");
    }
  }
  if (request.audios && request.audios.length > 0) {
    input.audio_url = await toAudioUrl(context, request.audios[0]);
  }
  // 文生视频型号按尺寸选择画面：优先用扩展参数里的 size，否则按清晰度档位取常用尺寸。
  if (!isI2V) {
    const explicitSize = typeof request.other?.size === "string" ? (request.other.size as string).trim() : "";
    const resolution = (request.resolution ?? "").trim().toUpperCase();
    const fallback = resolution === "1080P" ? "1920x1080" : resolution === "480P" ? "832x480" : "1280x720";
    const size = explicitSize || fallback;
    if (parseSizeValue(size)) {
      parameters.size = size;
    }
    const ratioKey = (request.ratio ?? "").trim();
    if (ratioKey === "9:16") {
      const parts = size.split(/[x*×]/i);
      parameters.size = parts[1] + "x" + parts[0];
    }
  }
  if (request.resolution !== undefined && request.resolution.trim()) {
    parameters.resolution = request.resolution.trim().toUpperCase();
  }
  if (request.duration !== undefined) {
    parameters.duration = Math.round(request.duration);
  }
  return { input, parameters };
}

type TaskHandle = {
  taskId: string;
  apiKey: string;
};

/** 提交通用异步任务（图片任务与视频任务共用）。 */
async function submitTask(context: Context, body: unknown, apiKey: string): Promise<TaskHandle> {
  const payload = await requestJson(context, API_BASE + "/v1/tasks/submit", {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify(body),
    signal: createSignal(context, SUBMIT_TIMEOUT),
  });
  const output = payload.output && typeof payload.output === "object" ? (payload.output as Record<string, unknown>) : undefined;
  const taskId = output && typeof output.task_id === "string" ? output.task_id : "";
  if (!taskId) {
    throw new Error("提交任务失败：接口未返回任务编号");
  }
  return { taskId, apiKey };
}

/** 轮询任务直到完成，返回结果地址列表。 */
async function waitForTask(context: Context, handle: TaskHandle, totalTimeout: number): Promise<string[]> {
  const deadline = Date.now() + totalTimeout;
  while (true) {
    if (context.signal?.aborted) {
      throw new Error("已取消等待生成结果，远端任务可能仍在运行");
    }
    if (Date.now() >= deadline) {
      throw new Error("等待生成结果超时，可以稍后重新发起");
    }
    const statusPayload = await requestJson(context, API_BASE + "/v1/tasks/status?task_id=" + encodeURIComponent(handle.taskId), {
      method: "GET",
      headers: authHeaders(handle.apiKey),
      signal: createSignal(context, STATUS_TIMEOUT),
    });
    const output = statusPayload.output && typeof statusPayload.output === "object" ? (statusPayload.output as Record<string, unknown>) : undefined;
    const status = output && typeof output.task_status === "string" ? output.task_status : "";
    if (status === "Success") {
      const urls = output && Array.isArray(output.urls) ? output.urls : [];
      const valid = urls.map((value) => ensureHttpUrl(value)).filter((value) => Boolean(value));
      if (valid.length === 0) {
        throw new Error("任务已完成，但没有返回可用的结果地址");
      }
      return valid;
    }
    if (status === "Failure") {
      const reason = output && typeof output.error_message === "string" ? output.error_message : "接口未说明原因";
      throw new Error("生成失败：" + reason);
    }
    if (status === "Expired") {
      throw new Error("任务已过期，请重新发起");
    }
    if (status === "Cancelled" || status === "Canceled") {
      throw new Error("任务已被取消");
    }
    // 除上述终态外都按「还在处理中」继续轮询（例如平台新增的 moderating 之类状态），
    // 避免因为状态名不认识就提前报错；真正的失败仍由 Failure/Expired 分支处理。
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, POLL_INTERVAL);
      context.signal?.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
    });
  }
}

async function runVideoTask(context: Context, request: VideoRequest, apiKey: string, skeleton: VideoSkeleton): Promise<MediaAsset[]> {
  const handle = await submitTask(context, { model: request.model, input: skeleton.input, parameters: skeleton.parameters }, apiKey);
  const urls = await waitForTask(context, handle, VIDEO_TOTAL_TIMEOUT);
  return urls.map((url) => ({ mediaType: "video" as MediaType, type: "url" as const, url, mimeType: "" }));
}

/** MiniMax H3：https://cp.compshare.cn/minimax/v2，content 数组 + 顶层参数。 */
async function buildH3Content(context: Context, request: VideoRequest, content: Record<string, unknown>[]): Promise<void> {
  const mode = normalizeMode(request.mode);
  const modeLower = mode.toLowerCase();
  const images = request.images ?? [];
  const videos = request.videos ?? [];
  const audios = request.audios ?? [];
  const isReference = modeLower.indexOf("reference") !== -1 || images.length > 1 || videos.length > 0 || audios.length > 0;
  if (isReference) {
    if (images.length > 9) {
      throw new Error("MiniMax H3 最多支持 9 张参考图");
    }
    if (videos.length > 3) {
      throw new Error("MiniMax H3 最多支持 3 个参考视频");
    }
    if (audios.length > 3) {
      throw new Error("MiniMax H3 最多支持 3 段参考音频");
    }
    if (images.length + videos.length + audios.length > 12) {
      throw new Error("MiniMax H3 的参考素材合计最多 12 个");
    }
    if (audios.length > 0 && images.length === 0 && videos.length === 0) {
      throw new Error("参考音频不能单独使用，请同时提供至少一张参考图或一个参考视频");
    }
    for (const image of images) {
      content.push({ type: "image_url", image_url: { url: toImageUrl(image, "image/png") }, role: "reference_image" });
    }
    for (const video of videos) {
      const url = ensureHttpUrl(video.type === "url" ? video.url : "");
      if (!url) {
        throw new Error("MiniMax H3 的参考视频目前只支持 HTTP(S) 地址");
      }
      content.push({ type: "video_url", video_url: { url }, role: "reference_video" });
    }
    for (const audio of audios) {
      content.push({ type: "audio_url", audio_url: { url: await toAudioUrl(context, audio) }, role: "reference_audio" });
    }
    return;
  }
  // 首尾帧模式：最多一张首帧 + 一张尾帧，且不能与参考素材混用
  if (request.firstFrame) {
    content.push({ type: "image_url", image_url: { url: toImageUrl(request.firstFrame, "image/png") }, role: "first_frame" });
  }
  if (request.lastFrame) {
    content.push({ type: "image_url", image_url: { url: toImageUrl(request.lastFrame, "image/png") }, role: "last_frame" });
  }
  if (!request.firstFrame && !request.lastFrame && images.length > 0) {
    content.push({ type: "image_url", image_url: { url: toImageUrl(images[0], "image/png") }, role: "first_frame" });
  }
}

async function generateH3Video(context: Context, request: VideoRequest, apiKey: string): Promise<MediaAsset[]> {
  const prompt = request.prompt ? request.prompt.trim() : "";
  const images = request.images ?? [];
  const videos = request.videos ?? [];
  const audios = request.audios ?? [];
  const hasFrame = request.firstFrame !== undefined || request.lastFrame !== undefined;
  if (!prompt && !hasFrame && images.length === 0 && videos.length === 0 && audios.length === 0) {
    throw new Error("请先填写视频提示词，或提供首帧/参考素材");
  }
  if (request.duration !== undefined && (request.duration < 4 || request.duration > 30)) {
    throw new Error("MiniMax H3 的视频时长需要在 4 到 30 秒之间");
  }
  const resolutions = ["480P", "768P", "1080P", "2K", "4K"];
  let resolution = "768P";
  if (request.resolution !== undefined && request.resolution.trim()) {
    resolution = request.resolution.trim().toUpperCase();
    if (resolutions.indexOf(resolution) === -1) {
      throw new Error("MiniMax H3 的分辨率只支持 480P、768P、1080P、2K、4K");
    }
  }
  const ratios = ["adaptive", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"];
  let ratio = "";
  if (request.ratio !== undefined && request.ratio.trim()) {
    ratio = request.ratio.trim();
    if (ratios.indexOf(ratio) === -1) {
      throw new Error("MiniMax H3 的画面比例只支持 adaptive、21:9、16:9、4:3、1:1、3:4、9:16");
    }
  }
  const other = request.other ?? {};
  const content: Record<string, unknown>[] = [];
  if (prompt) {
    content.push({ type: "text", text: prompt });
  }
  await buildH3Content(context, request, content);
  const body: Record<string, unknown> = {
    model: request.model,
    content,
    resolution,
    duration: request.duration !== undefined ? Math.round(request.duration) : 5,
  };
  if (ratio) {
    body.ratio = ratio;
  }
  // 提示词优化、Skill、静音、水印等按平台默认；如需开启可通过扩展参数传入
  if (other.use_context_ir === true) {
    body.use_context_ir = true;
    if (typeof other.skill_id === "string" && other.skill_id) {
      body.skill_id = other.skill_id;
    }
  }
  if (other.mute_audio === true) {
    body.mute_audio = true;
  }
  if (request.watermark !== undefined) {
    body.aigc_watermark = request.watermark;
  } else if (other.aigc_watermark === true) {
    body.aigc_watermark = true;
  }

  const submitPayload = await requestJson(context, H3_BASE + "/minimax/v2/video_generation", {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify(body),
    signal: createSignal(context, SUBMIT_TIMEOUT),
  });
  const taskId = typeof submitPayload.task_id === "string" ? submitPayload.task_id : "";
  if (!taskId) {
    throw new Error("提交 MiniMax H3 任务失败：接口未返回任务编号");
  }
  const deadline = Date.now() + H3_TOTAL_TIMEOUT;
  while (true) {
    if (context.signal?.aborted) {
      throw new Error("已取消等待视频生成结果，远端任务可能仍在运行");
    }
    if (Date.now() >= deadline) {
      throw new Error("等待 MiniMax H3 视频结果超时，可以稍后重新发起");
    }
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, H3_POLL_INTERVAL);
      context.signal?.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
    });
    if (context.signal?.aborted) {
      throw new Error("已取消等待视频生成结果，远端任务可能仍在运行");
    }
    const statusPayload = await requestJson(context, H3_BASE + "/minimax/v2/query/video_generation/" + encodeURIComponent(taskId), {
      method: "GET",
      headers: authHeaders(apiKey),
      signal: createSignal(context, STATUS_TIMEOUT),
    });
    const task = statusPayload.task && typeof statusPayload.task === "object" ? (statusPayload.task as Record<string, unknown>) : undefined;
    const status = task && typeof task.status === "string" ? task.status : "";
    if (status === "succeeded") {
      const contentField = task && task.content && typeof task.content === "object" ? (task.content as Record<string, unknown>) : undefined;
      const url = contentField ? ensureHttpUrl(contentField.url) : "";
      if (!url) {
        throw new Error("MiniMax H3 任务已完成，但没有返回可用的视频地址");
      }
      return [{ mediaType: "video" as MediaType, type: "url" as const, url, mimeType: "" }];
    }
    if (status === "failed") {
      const failed = task && task.error && typeof task.error === "object" ? (task.error as Record<string, unknown>) : undefined;
      const reason = failed && typeof failed.message === "string" ? failed.message : "接口未说明原因";
      throw new Error("MiniMax H3 生成失败：" + reason);
    }
    if (status === "cancelled") {
      throw new Error("MiniMax H3 任务已被取消");
    }
    if (status === "blocked") {
      const blocked = task && task.error && typeof task.error === "object" ? (task.error as Record<string, unknown>) : undefined;
      const reason = blocked && typeof blocked.message === "string" ? blocked.message : "内容未通过审核";
      throw new Error("MiniMax H3 任务被审核拦截：" + reason);
    }
    // 其余状态（queued、running、moderating 等，含平台后续新增的排队/审核阶段）继续轮询，
    // 直到成功、失败、被拦截，或到达总等待上限。
  }
}

export default {
  id: "compshare",
  label: "优云智算",
  icon: "data:image/webp;base64,UklGRrIEAABXRUJQVlA4IKYEAACwHACdASqAAIAAPlEojkWjoqEUC4RUOAUEsZOACshg/IF9F9uuYENt15fvulv4nP+S/lfYO8xX7AetJ6L/QA/wHUO7xj+53oq3hpXLaX9PfNP8g2oN0ryI5xH8WBNYIxASaOpGWbHVhMRvffDAog2oVmCU+vla84NqXJGiLa51ZBlAnajgeDd5xodsqvUvGQfQhlnkJxos+18ksB+mszh7/L8eLkBBsP2HJaoWAYw8k1/nKoCh+S0qFY6+Iwg/Y09tMNh556MM9Z7/L7WQVU4ouPEscY/0ALZJhZ4tei+xRl6IertQnQqW/PgUJmcsAP79nJzusj9cFOfFWwhdNAIFr9+vv1hhKikDp6WFkU203jKYviAGyS+J4uQtQUMoW8aQAwghvdtOP93MJ6wasAcPa6A5QwIqRezhlJCfwV1ugcHA1WdIWulOwYn/y4MILLfa51Q6vXXxuYe/kZUMvkpa3aaHl4fsX6zrQSZY5qzPmpPpZ+1tFYDJP/y/rh6h9rK1aT/lQnX/FeSk4OO5/2WjXL0vWqVCWw1Kr29QxfQFaxM9noNALm8zW6Hk0JQLdUuBTtG7r7fPZV1fEybTq9WW9tzGReXxpYvi6RypTxLrAQC1O5d385YWaLWVFp1VSHAAutd0EIyGj4OMoQaOrneF0NVSX3krJiAITbJqXLe5ECt/lNYGoAt9Rybyej+YXQBIuEBn72/nnf90ztwvpSvMH/3MsfxF5o/WijNadedW1sY72FyVcOSmND6ZPVmgw/rEFPs1zAdfFhVX7JP9ffll0UknDyafjBdDMn7OGbiZ3DIsFJIqroxusWqEjizCrq4ds+TynGCPVQ/lp8//D6F8MmQ6R+aRn+f4yfTOj0RBeqfORZx4yM+7+bvIm7vRqJkPD7qLNL69IB32mrNe9o1T/gYHfcxMalvCUkLeWDDv5sQSUR3VMENHPlsSqaXOSC6AoVk9JYoTibLGc45B35u3an2nRXe9H8dQhNZ6MRpWhEmIEJ3oTVyCsTSfDTwm40dLormlbIJlROoyb011vm9l12kB0iROLxr96nk99vmiF8kY3QZcN2P/5SA3SqrncD3H5HTbvjzx5xvYmeb6F0EFpE/xI3/om1SiSR4O/bHOvkB15jaoIOzNmtX7PlAlYqspDgwRUyuH0nFepR/yx5JSOXmegKyiBuwz42YUmljSNrXasas6Wuz8y5egRWtvNi3HDtxURRkMCcDKIN5kUd7Zav0NT+rynTOSTN2SCmEm6At+NIP4qRCu9OXJAGw7+59ZNtDXK/IuwdWObWZo+b9wToBoypaMqyN/VKdnacmVMwzrEQK6mzqusSVDFExXBiHIdlyfiey59cQ5GLQD/lgnltTmEw6x8lj5YhnWhTUtQX8+96IShf4sDrtmtS5SA8uK+TNYjkTyvr0/7TulOe2n8Nd4JOyxp71t8k7Uwfo5bgpJR7UBgv2ZJgLU6t+zgOImh7hse1RE6ScNzhXpss0k5AMpMIqaz4wB36XHu3jPpLb1XyTv/CujPjDjUb2wOKJSerxrWjiZJekcLyy+MCaoWSUmF4kjKk6pNgDl0MkYdgeBTnCAAA==",
  version: "2.0.0",
  readme:
    "优云智算\n\n**优云智算 API Key**：图片与视频模型用，获取地址 https://console.compshare.cn/light-gpu/api-keys\n**MiniMax API Key**：只有 `MiniMax-H3` 用，获取地址 https://www.compshare.cn/video-studio",
  rules: [
    {
      type: "input",
      field: "apiKey",
      title: "API Key",
      value: "",
      props: { type: "password", showPassword: true, autocomplete: "off" },
    },
    {
      type: "input",
      field: "minimaxApiKey",
      title: "MiniMax API Key",
      value: "",
      props: { type: "password", showPassword: true, autocomplete: "off" },
    },
  ],
  models: [
    {
      id: "doubao-seedream-5-0-pro-260628",
      label: "doubao-seedream 5.0 Pro（文生图 / 多参考图）",
      type: "image",
      mode: ["text", "multiReference"],
      imageSizes: ["1K", "1.5K", "2K"],
      imageRatios: ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"],
    },
    {
      id: "doubao-seedream-5-0-260128",
      label: "doubao-seedream 5.0（文生图 / 多参考图）",
      type: "image",
      mode: ["text", "multiReference"],
      imageSizes: ["2K", "3K", "4K"],
      imageRatios: ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3", "21:9"],
    },
    {
      id: "qwen-image-3.0",
      label: "Qwen Image 3.0（文生图 / 参考图编辑）",
      type: "image",
      mode: ["text", "multiReference"],
      imageSizes: ["1024x1024", "1536x1024", "1024x1536", "2048x2048", "1280x720", "720x1280"],
      imageRatios: ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3"],
    },
    {
      id: "qwen-image-3.0-pro",
      label: "Qwen Image 3.0 Pro（文生图 / 参考图编辑）",
      type: "image",
      mode: ["text", "multiReference"],
      imageSizes: ["1024x1024", "1536x1024", "1024x1536", "2048x2048", "1280x720", "720x1280"],
      imageRatios: ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3"],
    },
    {
      id: "gpt-image-2",
      label: "gpt-image-2（文生图 / 单图编辑）",
      type: "image",
      mode: ["text", "singleImage"],
      imageSizes: ["1K", "2K", "4K"],
      imageRatios: ["1:1", "3:2", "2:3", "4:3", "3:4", "4:5", "5:4", "16:9", "9:16", "21:9"],
    },
    {
      id: "Qwen/Qwen-Image",
      label: "Qwen-Image（文生图）",
      type: "image",
      mode: ["text"],
      imageSizes: ["1024x1024", "1280x720", "720x1280", "1536x1536"],
      imageRatios: ["1:1", "4:3", "3:4", "16:9", "9:16"],
    },
    {
      id: "Qwen/Qwen-Image-Edit",
      label: "Qwen-Image-Edit（单图编辑）",
      type: "image",
      mode: ["singleImage"],
      imageSizes: ["1024x1024", "1280x720", "720x1280", "1536x1536"],
      imageRatios: ["1:1", "4:3", "3:4", "16:9", "9:16"],
    },
    {
      id: "doubao-seedance-2-0-260128",
      label: "doubao-seedance 2.0（文/图生视频 / 参考素材）",
      type: "video",
      mode: ["text", "singleImage", "startEndRequired", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      imageRatios: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "adaptive"],
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "720p", "1080p"] }],
    },
    {
      id: "MiniMax-H3",
      label: "MiniMax H3（文/图/参考素材生视频 · 视频工作台）",
      type: "video",
      mode: ["text", "singleImage", "endFrameOptional", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      imageRatios: ["adaptive", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
      durationResolutionMap: [
        {
          duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
          resolution: ["480P", "768P", "1080P", "2K", "4K"],
        },
      ],
    },
  ] satisfies ProviderModel[],
  async generateImage(this: Context, request: ImageRequest): Promise<MediaAsset[]> {
    this.signal?.throwIfAborted();
    const model = typeof request.model === "string" ? request.model.trim() : "";
    if (!model) {
      throw new Error("未指定图片模型");
    }
    const apiKey = requireModelVerseKey(this);
    const protocol = imageProtocolOf(model);
    ensureNoUnsupportedImageOptions(protocol, request);
    try {
      if (protocol === "gemini") {
        return await generateGeminiImage(this, request, apiKey);
      }
      if (protocol === "gpt") {
        return await generateGptImage(this, request, apiKey);
      }
      if (protocol === "qwen3") {
        return await generateQwen3Image(this, request, apiKey);
      }
      return await generateOpenAiImage(this, request, apiKey);
    } catch (error) {
      throw friendlyError(error);
    }
  },
  async generateVideo(this: Context, request: VideoRequest): Promise<MediaAsset[]> {
    this.signal?.throwIfAborted();
    const model = typeof request.model === "string" ? request.model.trim() : "";
    if (!model) {
      throw new Error("未指定视频模型");
    }
    if (isH3Model(model)) {
      const apiKey = requireH3Key(this);
      try {
        return await generateH3Video(this, request, apiKey);
      } catch (error) {
        throw friendlyError(error);
      }
    }
    const apiKey = requireModelVerseKey(this);
    const lower = model.toLowerCase();
    const promptOptional = lower.indexOf("lip-sync") !== -1 || lower.indexOf("extend") !== -1;
    const normalized: VideoRequest = Object.assign({}, request, {
      prompt: request.prompt && request.prompt.trim() ? request.prompt : promptOptional ? "" : "",
    });
    if (!promptOptional && !normalized.prompt.trim()) {
      throw new Error("请先填写视频提示词");
    }
    const protocol = videoProtocolOf(model);
    try {
      if (protocol === "hailuo") {
        return await runVideoTask(this, normalized, apiKey, await buildHailuoBody(this, normalized));
      }
      if (protocol === "vidu") {
        return await runVideoTask(this, normalized, apiKey, await buildViduBody(this, normalized));
      }
      if (protocol === "wan") {
        return await runVideoTask(this, normalized, apiKey, await buildWanBody(this, normalized));
      }
      return await runVideoTask(this, normalized, apiKey, await buildSeedanceBody(this, normalized));
    } catch (error) {
      throw friendlyError(error);
    }
  },
};
