/**
 * Toonflow AI provider template - TopAPI (Seedance / Seedream)
 * @version 2.0
 *
 * Notes:
 * 1) Single base URL: https://api.topapi.art — every endpoint lives under /v1/api.
 * 2) Auth is `Authorization: Bearer sk_live_…`; the key carries the credit wallet.
 * 3) Image and video share ONE async endpoint: POST /v1/api/media/tasks returns 202 +
 *    task_ref, then poll GET /v1/api/media/tasks/{task_ref} until SUCCEEDED/FAILED/EXPIRED.
 * 4) A submit REQUIRES the `Idempotency-Key` header. Retrying with the same key and payload
 *    replays the original task instead of charging credit twice; reusing a key with a
 *    different payload returns 409, so each submit generates a fresh UUID.
 * 5) Reference media is NOT inlined as base64. Every file is uploaded first through
 *    POST /v1/api/uploads (multipart), which returns a `file_key` used in
 *    reference_image_keys / reference_video_keys / reference_audio_keys and
 *    first_frame_image_key / last_frame_image_key.
 * 6) Reference order maps to [Image 1]..[Image N] / [Video 1].. / [Audio 1].. inside the
 *    prompt, matching how Toonflow's Seedance prompt skill already labels references.
 * 7) Text models are intentionally NOT exposed: TopAPI's POST /v1/api/chat is a synchronous
 *    {model, prompt} -> data.text call, not an OpenAI-compatible streaming endpoint, so it
 *    cannot back Toonflow's ai-sdk text pipeline. Pair this vendor with any text provider.
 *
 * Frame-role convention (see limitation in the README of this file): the app flattens
 * uploadData into an ordered base64 list without preserving startImage/endImage roles, so
 * in first/last-frame modes the FIRST image is treated as the first frame and, for
 * startEndRequired, the SECOND as the last frame; anything beyond that becomes an
 * omni-reference.
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
  inputs: { key: string; label: string; type: "text" | "password" | "url"; required: boolean; placeholder?: string; disabled?: boolean }[];
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

type UploadKind = "image" | "video" | "audio";

// ============================================================
// Global declarations
// ============================================================

declare const axios: any;
declare const FormData: any;
declare const crypto: any;
declare const Buffer: any;
declare const logger: (msg: string) => void;
declare const urlToBase64: (url: string) => Promise<string>;
declare const zipImage: (completeBase64: string, size: number) => Promise<string>;
declare const pollTask: (fn: () => Promise<PollResult>, interval?: number, timeout?: number) => Promise<PollResult>;
declare const exports: {
  vendor: VendorConfig;
  textRequest: (m: TextModel, t: boolean, tl: 0 | 1 | 2 | 3) => any;
  uploadReference: (base64: string, fileType: UploadKind) => Promise<string>;
  imageRequest: (c: ImageConfig, m: ImageModel) => Promise<string>;
  videoRequest: (c: VideoConfig, m: VideoModel) => Promise<string>;
  ttsRequest: (c: TTSConfig, m: TTSModel) => Promise<string>;
  checkForUpdates?: () => Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }>;
  updateVendor?: () => Promise<string>;
};

// ============================================================
// Provider configuration
// ============================================================

const vendor: VendorConfig = {
  id: "topapi",
  version: "2.0",
  author: "Toonflow",
  name: "TopAPI (Seedance / Seedream)",
  description:
    "TopAPI media integration for Toonflow: Seedance 2.5 / 2.0 video and Seedream 5.0 images through one async task API with reference uploads. Text models are not exposed — pair with any text provider. \n [Go to platform](https://topapi.art)",
  inputs: [
    { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "sk_live_..." },
    { key: "baseUrl", label: "Base URL", type: "url", required: true, placeholder: "https://api.topapi.art", disabled: true },
  ],
  inputValues: {
    apiKey: "",
    baseUrl: "https://api.topapi.art",
  },
  models: [
    {
      name: "Seedream 5.0 Pro",
      modelName: "seedream-5-0-pro",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
    },
    {
      name: "Seedream 5.0 Lite",
      modelName: "seedream-5-0-lite",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
    },
    {
      name: "Seedance 2.5",
      modelName: "seedance-2-5",
      type: "video",
      mode: ["text", "startFrameOptional", "startEndRequired", ["imageReference:30", "videoReference:10", "audioReference:10"]],
      audio: "optional",
      durationResolutionMap: [
        { duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30], resolution: ["480p", "720p", "1080p"] },
      ],
    },
    {
      name: "Seedance 2.0 Pro",
      modelName: "seedance-2-0-pro",
      type: "video",
      mode: ["text", "startFrameOptional", "startEndRequired", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "720p", "1080p", "4k"] }],
    },
    {
      name: "Seedance 2.0 Fast",
      modelName: "seedance-2-0-fast",
      type: "video",
      mode: ["text", "startFrameOptional", "startEndRequired", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "720p"] }],
    },
    {
      name: "Seedance 2.0 Mini",
      modelName: "seedance-2-0-mini",
      type: "video",
      mode: ["text", "startFrameOptional", "startEndRequired", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "720p"] }],
    },
  ],
};

// ============================================================
// Helper utilities
// ============================================================

const getBaseUrl = () => (vendor.inputValues.baseUrl || "https://api.topapi.art").replace(/\/+$/, "");

const apiUrl = (path: string) => `${getBaseUrl()}/v1/api${path.startsWith("/") ? "" : "/"}${path}`;

const getApiKey = () => {
  const key = (vendor.inputValues.apiKey || "").replace(/^Bearer\s+/i, "").trim();
  if (!key) throw new Error("Missing API Key");
  return key;
};

const jsonHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getApiKey()}`,
});

/** Every TopAPI response is wrapped in { success, data, error }. */
const unwrap = (payload: any): any => {
  if (payload && typeof payload === "object" && "success" in payload) {
    if (payload.success === false) throw new Error(describeError(payload.error));
    return payload.data;
  }
  return payload;
};

const describeError = (err: any): string => {
  if (!err) return "TopAPI request failed";
  const base = [err.code, err.message].filter(Boolean).join(": ") || "TopAPI request failed";
  if (Array.isArray(err.details) && err.details.length > 0) {
    const detail = err.details
      .slice(0, 3)
      .map((d: any) => [d.field, d.reason || d.message].filter(Boolean).join("="))
      .join(", ");
    return detail ? `${base} (${detail})` : base;
  }
  return base;
};

const describeAxiosError = (err: any, action: string): string => {
  const body = err?.response?.data;
  if (body && typeof body === "object" && body.error) return `${action}: ${describeError(body.error)}`;
  const status = err?.response?.status;
  const raw = typeof body === "string" ? body.slice(0, 300) : body ? JSON.stringify(body).slice(0, 300) : "";
  return `${action}: ${status ? `HTTP ${status} ` : ""}${raw || err?.message || "unknown error"}`;
};

/** Idempotency-Key must be unique ASCII without whitespace, 8–200 chars. */
const newIdempotencyKey = (): string => {
  if (crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `tf-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const parseDataUrl = (input: string): { mime: string; ext: string; buffer: any } => {
  const match = /^data:([^;,]+)?(?:;charset=[^;,]+)?(?:;base64)?,(.*)$/s.exec(input);
  const mime = (match && match[1]) || "image/jpeg";
  const raw = match ? match[2] : input;
  const extFromMime = mime.split("/")[1] || "jpg";
  const ext = extFromMime.replace(/\+.*$/, "").replace("jpeg", "jpg").replace("quicktime", "mov").replace("mpeg", "mp3");
  return { mime, ext, buffer: Buffer.from(raw, "base64") };
};

const isDnsOrNetworkError = (err: any): boolean => {
  const msg = String(err?.message || err || "");
  return /ENOTFOUND|EAI_AGAIN|ECONNRESET|ETIMEDOUT|socket hang up|timeout/i.test(msg);
};

const withNetworkRetry = async <T>(fn: () => Promise<T>, maxRetry = 3, waitMs = 1500): Promise<T> => {
  let lastErr: any;
  for (let i = 0; i < maxRetry; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isDnsOrNetworkError(err) || i === maxRetry - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, waitMs * (i + 1)));
    }
  }
  throw lastErr;
};

const getReferenceLimit = (modes: VideoMode[], prefix: "imageReference" | "videoReference" | "audioReference"): number | undefined => {
  for (const mode of modes) {
    if (!Array.isArray(mode)) continue;
    for (const entry of mode) {
      if (!entry.startsWith(`${prefix}:`)) continue;
      const limit = Number(entry.split(":")[1]);
      if (Number.isFinite(limit) && limit > 0) return limit;
    }
  }
  return undefined;
};

const limitReferences = <T>(refs: T[], maxCount?: number): T[] => {
  if (!maxCount || maxCount < 1) return refs;
  return refs.slice(0, maxCount);
};

const modeFlags = (modes: VideoMode[]) => {
  const flat = (modes || []).filter((m) => typeof m === "string") as string[];
  return {
    startEnd: flat.includes("startEndRequired") || flat.includes("endFrameOptional"),
    startFrame: flat.includes("startFrameOptional") || flat.includes("singleImage"),
  };
};

const VIDEO_RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"];
const IMAGE_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9"];

const normalizeRatio = (value: unknown, allowed: string[], fallback: string): string => {
  const raw = String(value || "").trim();
  return allowed.includes(raw) ? raw : fallback;
};

const normalizeResolution = (value: unknown, allowed: string[], fallback: string): string => {
  const lower = String(value || "").toLowerCase();
  const matched = allowed.find((item) => item.toLowerCase() === lower);
  if (matched) return matched;
  if (/4k/.test(lower)) return allowed.find((item) => /4k/i.test(item)) || fallback;
  if (/1080/.test(lower)) return allowed.find((item) => /1080/i.test(item)) || fallback;
  if (/720/.test(lower)) return allowed.find((item) => /720/i.test(item)) || fallback;
  if (/480/.test(lower)) return allowed.find((item) => /480/i.test(item)) || fallback;
  return fallback;
};

const allowedResolutions = (model: VideoModel): string[] => {
  const list = (model.durationResolutionMap || []).flatMap((entry) => entry.resolution || []);
  return list.length > 0 ? list : ["480p", "720p"];
};

const allowedDurations = (model: VideoModel): number[] => {
  const list = (model.durationResolutionMap || []).flatMap((entry) => entry.duration || []);
  return list.length > 0 ? list : [4, 5, 6, 7, 8, 9, 10];
};

const clampDuration = (value: unknown, model: VideoModel): number => {
  const durations = allowedDurations(model);
  const num = Number(value);
  if (!Number.isFinite(num)) return durations.includes(5) ? 5 : durations[0];
  if (durations.includes(num)) return num;
  const min = Math.min(...durations);
  const max = Math.max(...durations);
  return Math.max(min, Math.min(max, Math.round(num)));
};

// ============================================================
// Uploads — TopAPI takes file_key, never inline base64
// ============================================================

const uploadReference = async (base64: string, fileType: UploadKind): Promise<string> => {
  // Images are compressed first: the upload cap is 30 MB and smaller payloads upload faster.
  const source = fileType === "image" ? await zipImage(base64, 8 * 1024 * 1024) : base64;
  const { mime, ext, buffer } = parseDataUrl(source);

  const form = new FormData();
  form.append("file", buffer, { filename: `reference.${ext}`, contentType: mime });
  form.append("kind", fileType);
  form.append("profile", "media");

  const resp: any = await withNetworkRetry(() =>
    axios.post(apiUrl("/uploads"), form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${getApiKey()}` },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    }),
  ).catch((err: any) => {
    throw new Error(describeAxiosError(err, `Uploading ${fileType} reference`));
  });

  const data = unwrap(resp.data);
  const fileKey = data?.file_key || data?.fileKey || data?.key;
  if (!fileKey) {
    throw new Error(`Upload succeeded but no file_key was returned: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return fileKey;
};

const uploadAll = async (items: string[], fileType: UploadKind): Promise<string[]> => {
  const keys: string[] = [];
  for (const item of items) {
    keys.push(await uploadReference(item, fileType));
  }
  return keys;
};

// ============================================================
// Task submit + poll (shared by image and video)
// ============================================================

const submitTask = async (body: any, label: string): Promise<string> => {
  const headers = { ...jsonHeaders(), "Idempotency-Key": newIdempotencyKey() };
  const resp: any = await withNetworkRetry(() => axios.post(apiUrl("/media/tasks"), body, { headers }), 3, 1500).catch((err: any) => {
    throw new Error(describeAxiosError(err, `${label} task submission failed`));
  });
  const data = unwrap(resp.data);
  const taskRef = data?.task_ref || data?.taskRef || data?.id;
  if (!taskRef) {
    throw new Error(`${label} task submission failed: no task_ref returned. Raw response: ${JSON.stringify(data).slice(0, 400)}`);
  }
  logger(`[TopAPI] ${label} task ${taskRef} queued, credit charged: ${data?.credit_charged ?? "n/a"}`);
  return taskRef;
};

/** SUCCEEDED payloads expose results as `assets[]` (objects or strings) and/or `urls[]`. */
const extractAssetUrls = (data: any): string[] => {
  const out: string[] = [];
  const push = (value: any) => {
    if (typeof value === "string" && value.startsWith("http")) out.push(value);
    else if (value && typeof value === "object") {
      const url = value.url || value.signed_url || value.asset_url || value.download_url;
      if (typeof url === "string" && url.startsWith("http")) out.push(url);
    }
  };
  if (Array.isArray(data?.assets)) data.assets.forEach(push);
  if (Array.isArray(data?.urls)) data.urls.forEach(push);
  if (out.length === 0) push(data?.url);
  return out;
};

const pollMediaTask = async (taskRef: string, label: string, intervalMs: number, timeoutMs: number): Promise<string> => {
  const result = await pollTask(
    async (): Promise<PollResult> => {
      const resp: any = await withNetworkRetry(() => axios.get(apiUrl(`/media/tasks/${taskRef}`), { headers: jsonHeaders() }), 3, 1200);
      const data = unwrap(resp.data);
      const status = String(data?.status || "").toUpperCase();

      if (status === "SUCCEEDED") {
        const urls = extractAssetUrls(data);
        if (urls.length > 0) return { completed: true, data: urls[0] };
        return { completed: true, error: `${label} task succeeded but returned no asset URL` };
      }
      if (status === "FAILED" || status === "EXPIRED" || status === "CANCELLED") {
        const reason = data?.error?.message || data?.failure_reason || data?.message || status;
        return { completed: true, error: `${label} task ${status}: ${reason}` };
      }
      return { completed: false };
    },
    intervalMs,
    timeoutMs,
  );

  if (result.error) throw new Error(result.error);
  if (!result.data) throw new Error(`${label} generation failed: polling returned no data`);
  return result.data;
};

// ============================================================
// Adapter functions
// ============================================================

const textRequest = (_model: TextModel, _think: boolean, _thinkLevel: 0 | 1 | 2 | 3) => {
  // TopAPI's POST /v1/api/chat is synchronous and not OpenAI-compatible, so it cannot back
  // Toonflow's ai-sdk text pipeline. This vendor deliberately ships no text models.
  throw new Error("TopAPI provides media models only. Configure a separate provider for text models.");
};

const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
  const isLite = model.modelName === "seedream-5-0-lite";
  const rawRefs = (config.referenceList || []).map((ref) => ref.base64).filter(Boolean);

  // Lite is limited to 2K; Pro accepts 1K/2K. Seedream has no 4K tier.
  const resolution = isLite ? "2K" : config.size === "2K" || config.size === "4K" ? "2K" : "1K";

  const body: any = {
    model: model.modelName,
    prompt: config.prompt || "",
    params: {
      resolution,
      ratio: normalizeRatio(config.aspectRatio, IMAGE_RATIOS, "1:1"),
      quantity: 1,
    },
  };

  if (rawRefs.length > 0) {
    logger(`[TopAPI Image] Uploading ${rawRefs.length} reference image(s)`);
    body.reference_image_keys = await uploadAll(rawRefs, "image");
  }

  logger(`[TopAPI Image] Submitting ${model.modelName}, resolution=${resolution}, ratio=${body.params.ratio}, refs=${rawRefs.length}`);
  const taskRef = await submitTask(body, "Image");
  const url = await pollMediaTask(taskRef, "Image", 3000, 600000);
  return await urlToBase64(url);
};

const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
  const refs = config.referenceList || [];
  const rawImages = refs.filter((r) => r.type === "image").map((r) => r.base64).filter(Boolean);
  const rawVideos = refs.filter((r) => r.type === "video").map((r) => r.base64).filter(Boolean);
  const rawAudios = refs.filter((r) => r.type === "audio").map((r) => r.base64).filter(Boolean);

  const flags = modeFlags(config.mode || []);
  let firstFrame: string | undefined;
  let lastFrame: string | undefined;
  let imagePool = rawImages;

  if (flags.startEnd && rawImages.length >= 2) {
    firstFrame = rawImages[0];
    lastFrame = rawImages[1];
    imagePool = rawImages.slice(2);
  } else if ((flags.startEnd || flags.startFrame) && rawImages.length >= 1) {
    firstFrame = rawImages[0];
    imagePool = rawImages.slice(1);
  }

  const imageRefs = limitReferences(imagePool, getReferenceLimit(model.mode, "imageReference"));
  const videoRefs = limitReferences(rawVideos, getReferenceLimit(model.mode, "videoReference"));
  const audioRefs = limitReferences(rawAudios, getReferenceLimit(model.mode, "audioReference"));

  const generateAudio = model.audio === true || (model.audio === "optional" && config.audio !== false);
  const resolution = normalizeResolution(config.resolution, allowedResolutions(model), "720p");
  const duration = clampDuration(config.duration, model);
  // First/last-frame mode on Seedance 2.5 only accepts "adaptive": the output keeps the
  // first frame's own ratio.
  const useAdaptive = Boolean(firstFrame) && model.modelName === "seedance-2-5";
  const ratio = useAdaptive ? "adaptive" : normalizeRatio(config.aspectRatio, VIDEO_RATIOS, "16:9");

  const body: any = {
    model: model.modelName,
    prompt: config.prompt || "",
    params: {
      resolution,
      duration,
      ratio,
      generate_audio: generateAudio,
      quantity: 1,
    },
  };

  const totalUploads = (firstFrame ? 1 : 0) + (lastFrame ? 1 : 0) + imageRefs.length + videoRefs.length + audioRefs.length;
  if (totalUploads > 0) {
    logger(`[TopAPI Video] Uploading ${totalUploads} reference file(s) before submit`);
  }

  if (firstFrame) body.first_frame_image_key = await uploadReference(firstFrame, "image");
  if (lastFrame) body.last_frame_image_key = await uploadReference(lastFrame, "image");
  if (imageRefs.length > 0) body.reference_image_keys = await uploadAll(imageRefs, "image");
  if (videoRefs.length > 0) body.reference_video_keys = await uploadAll(videoRefs, "video");
  if (audioRefs.length > 0) body.reference_audio_keys = await uploadAll(audioRefs, "audio");

  logger(
    `[TopAPI Video] Submitting ${model.modelName}, resolution=${resolution}, duration=${duration}s, ratio=${ratio}, audio=${generateAudio ? "on" : "off"}, frames=${[firstFrame ? "first" : "", lastFrame ? "last" : ""].filter(Boolean).join("+") || "none"}, refs=${imageRefs.length}img/${videoRefs.length}vid/${audioRefs.length}aud`,
  );

  const taskRef = await submitTask(body, "Video");
  const url = await pollMediaTask(taskRef, "Video", 5000, 1800000);
  return await urlToBase64(url);
};

const ttsRequest = async (_config: TTSConfig, _model: TTSModel): Promise<string> => {
  // TopAPI exposes no speech-synthesis endpoint.
  return "";
};

const checkForUpdates = async (): Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }> => {
  return {
    hasUpdate: false,
    latestVersion: vendor.version,
    notice: "TopAPI media integration, initial release.",
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

export { };
