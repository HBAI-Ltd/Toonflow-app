import fs from "node:fs/promises";
import path from "node:path";
import u from "@/utils";
import type { o_sr_frame_sample } from "@/types/database";
import { fromOssRelPath } from "./artifactPaths";
import { getTaskBundle, saveFrameUnderstanding } from "./repository";
import type { SrJobProgressReporter } from "./jobService";
import { FrameUnderstandingSchema, ShotDetectionSchema, TranscriptSchema, type FrameUnderstanding } from "./schemas";

interface VisionConfig {
  enabled: boolean;
  provider: string;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  concurrency: number;
  requestTimeoutMs: number;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

const FRAME_TYPES = ["start", "middle", "end"] as const;
const RETRYABLE_VISION_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const DEFAULT_VISION_CONCURRENCY = 3;
const DEFAULT_VISION_REQUEST_TIMEOUT_MS = 120_000;

async function getSetting(key: string, fallback = ""): Promise<string> {
  const row = await u.db("o_setting").where("key", key).first();
  return row?.value || fallback;
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

function normalizeModelName(model: string): string {
  if (model === "GPT5.5") return "gpt-5.5";
  return model;
}

function positiveInt(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseJsonObject(raw: string | null | undefined): unknown {
  if (!raw) return undefined;
  return JSON.parse(raw);
}

async function getVisionConfig(): Promise<VisionConfig> {
  const enabledValue = (await getSetting("sr.visionEnabled", "0")).toLowerCase();
  const enabled = ["1", "true", "yes", "on"].includes(enabledValue);
  const provider = await getSetting("sr.visionProvider", "worldclawpro");

  let baseUrl = await getSetting("sr.visionBaseUrl");
  let apiKey = await getSetting("sr.visionApiKey");
  let model = await getSetting("sr.visionModel");
  const concurrency = Math.min(positiveInt(await getSetting("sr.visionConcurrency"), DEFAULT_VISION_CONCURRENCY), 6);
  const requestTimeoutMs = positiveInt(await getSetting("sr.visionRequestTimeoutMs"), DEFAULT_VISION_REQUEST_TIMEOUT_MS);

  if ((!baseUrl || !apiKey || !model) && provider) {
    const vendor = await u.db("o_vendorConfig").where("id", provider).first();
    const inputValues = JSON.parse(vendor?.inputValues || "{}") as Record<string, string>;
    baseUrl ||= inputValues.baseUrl || inputValues.chatBaseUrl || "";
    apiKey ||= inputValues.apiKey || "";

    if (!model) {
      try {
        const models = await u.vendor.getModelList(provider);
        model = models.find((item) => item.type === "text")?.modelName || "";
      } catch {
        model = "";
      }
    }
  }

  return {
    enabled,
    provider,
    baseUrl: baseUrl ? normalizeBaseUrl(baseUrl) : undefined,
    apiKey: apiKey ? apiKey.replace(/^Bearer\s+/i, "") : undefined,
    model: model ? normalizeModelName(model) : undefined,
    concurrency,
    requestTimeoutMs,
  };
}

function resolveFramePath(filePath: string): string {
  if (/^[a-zA-Z]:[\\/]/.test(filePath) || filePath.startsWith("\\\\")) return filePath;
  return fromOssRelPath(filePath);
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

async function readFrameDataUrl(sample: o_sr_frame_sample): Promise<string | null> {
  if (!sample.filePath) return null;
  const absolutePath = resolveFramePath(sample.filePath);
  try {
    const data = await fs.readFile(absolutePath);
    return `data:${getMimeType(absolutePath)};base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}

function samplesForShot(samples: o_sr_frame_sample[], shotId: string): o_sr_frame_sample[] {
  const byType = new Map(samples.filter((sample) => sample.shotId === shotId).map((sample) => [sample.frameType, sample]));
  const preferred = FRAME_TYPES.map((type) => byType.get(type)).filter((sample): sample is o_sr_frame_sample => Boolean(sample));
  if (preferred.length) return preferred;
  return samples.filter((sample) => sample.shotId === shotId).slice(0, 3);
}

function transcriptForShot(transcriptRaw: unknown, startSec: number, endSec: number): string {
  if (!transcriptRaw) return "";
  const transcript = TranscriptSchema.parse(transcriptRaw);
  return transcript.segments
    .filter((segment) => segment.endSec > startSec && segment.startSec < endSec)
    .map((segment) => segment.text.trim())
    .filter(Boolean)
    .join(" ");
}

function manualReviewRecord(shotId: string, provider: string, reason: string): FrameUnderstanding {
  return FrameUnderstandingSchema.parse({
    shotId,
    provider,
    characterSlots: [],
    sceneSlots: [],
    propSlots: [],
    productSlots: [],
    visibleText: [],
    notReusableEntities: [],
    reviewRequired: true,
    reason,
  });
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced?.[1] || text.match(/\{[\s\S]*\}/)?.[0] || text;
  return JSON.parse(source);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryVisionStatus(status: number): boolean {
  return RETRYABLE_VISION_STATUS.has(status);
}

async function fetchVisionCompletion(config: VisionConfig, body: unknown): Promise<Response> {
  let lastResponse: Response | null = null;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
    try {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (response.ok || !shouldRetryVisionStatus(response.status) || attempt === 2) return response;
      lastResponse = response;
      const retryAfter = Number(response.headers.get("retry-after"));
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * (attempt + 1));
    } catch (error) {
      lastError = error;
      if (attempt === 2) break;
      await sleep(1000 * (attempt + 1));
    } finally {
      clearTimeout(timeout);
    }
  }
  if (lastError) throw lastError;
  return lastResponse!;
}

async function visionHttpFailureReason(response: Response): Promise<string> {
  let suffix = "";
  try {
    const data = await response.clone().json();
    const message = String(data?.error?.message || data?.message || "").toLowerCase();
    if (message.includes("no access") || message.includes("permission")) suffix = "_model_access_denied";
    else if (message.includes("overload") || message.includes("busy")) suffix = "_overloaded";
  } catch {
    suffix = "";
  }
  return `vision_request_failed_${response.status}${suffix}`;
}

function visionExceptionReason(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "AbortError") return "vision_request_timeout";
    if (/json/i.test(error.message)) return "vision_response_invalid_json";
    if (/fetch failed/i.test(error.message)) return "vision_request_network_error";
  }
  return "vision_understanding_failed";
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, worker: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(Math.max(concurrency, 1), items.length || 1);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await worker(items[currentIndex], currentIndex);
      }
    }),
  );

  return results;
}

async function requestVisionUnderstanding(args: {
  config: VisionConfig;
  shotId: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  transcriptText: string;
  frameDataUrls: string[];
}): Promise<FrameUnderstanding> {
  const { config, shotId, startSec, endSec, durationSec, transcriptText, frameDataUrls } = args;
  if (!config.baseUrl || !config.apiKey || !config.model) {
    return manualReviewRecord(shotId, config.provider, "vision_provider_not_configured");
  }
  if (!frameDataUrls.length) return manualReviewRecord(shotId, config.provider, "frame_samples_not_found");

  const prompt = [
    "Analyze this source video shot for structural remake planning.",
    "All user-facing text values in the returned JSON must be Simplified Chinese. Keep JSON field names unchanged.",
    "Return JSON only with these fields:",
    "visualSummary, shotSize, cameraAngle, cameraMotion, composition, characterSlots, sceneSlots, propSlots, productSlots, visibleText, notReusableEntities, reviewRequired.",
    "Use concrete Chinese asset slot names, such as 讲解者, 顾客, 咨询室, 蓝色躺椅, 领夹麦, 字幕贴片.",
    "Do not copy original faces, brands, store signs, watermarks, or private identity. Put them in notReusableEntities using Simplified Chinese.",
    `shotId: ${shotId}`,
    `timeRangeSec: ${startSec}-${endSec}`,
    `durationSec: ${durationSec}`,
    `transcript: ${transcriptText || "(none)"}`,
  ].join("\n");

  const body = {
    model: config.model,
    messages: [
      {
        role: "system",
        content: "You are a video structural analysis assistant. Return compact valid JSON only.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          ...frameDataUrls.map((url) => ({ type: "image_url", image_url: { url } })),
        ],
      },
    ],
    temperature: 0.2,
    max_tokens: 1200,
  };

  const response = await fetchVisionCompletion(config, body);

  if (!response.ok) {
    return manualReviewRecord(shotId, config.provider, await visionHttpFailureReason(response));
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content || "";
  const parsed = extractJson(content);

  return FrameUnderstandingSchema.parse({
    ...(typeof parsed === "object" && parsed ? parsed : {}),
    shotId,
    provider: config.provider,
  });
}

export async function runFrameUnderstanding(taskId: number, report?: SrJobProgressReporter): Promise<{
  total: number;
  reviewRequiredCount: number;
  results: FrameUnderstanding[];
}> {
  const bundle = await getTaskBundle(taskId);
  if (!bundle.shotDetection?.dataJson) throw new Error("shot detection result not found");

  const shotDetection = ShotDetectionSchema.parse(parseJsonObject(bundle.shotDetection.dataJson));
  const transcriptRaw = parseJsonObject(bundle.transcript?.dataJson);
  const config = await getVisionConfig();
  let completed = 0;
  await report?.({ progress: 5, stage: "vision_preparing" });
  const results = await mapWithConcurrency(shotDetection.shots, config.concurrency, async (shot) => {
    const shotSamples = samplesForShot(bundle.frameSamples, shot.shotId);
    let understanding: FrameUnderstanding;

    if (!config.enabled) {
      understanding = manualReviewRecord(shot.shotId, config.provider, "vision_provider_not_configured");
    } else {
      try {
        const frameDataUrls = (await Promise.all(shotSamples.map(readFrameDataUrl))).filter((item): item is string => Boolean(item));
        understanding = await requestVisionUnderstanding({
          config,
          shotId: shot.shotId,
          startSec: shot.startSec,
          endSec: shot.endSec,
          durationSec: shot.durationSec,
          transcriptText: transcriptForShot(transcriptRaw, shot.startSec, shot.endSec),
          frameDataUrls,
        });
      } catch (error) {
        understanding = manualReviewRecord(shot.shotId, config.provider, visionExceptionReason(error));
      }
    }

    const saved = await saveFrameUnderstanding(taskId, understanding);
    completed += 1;
    await report?.({
      progress: 5 + Math.round((completed / Math.max(shotDetection.shots.length, 1)) * 90),
      stage: `vision_${completed}_${shotDetection.shots.length}`,
      result: { completed, total: shotDetection.shots.length },
    });
    return FrameUnderstandingSchema.parse(parseJsonObject(saved.dataJson));
  });

  return {
    total: results.length,
    reviewRequiredCount: results.filter((item) => item.reviewRequired).length,
    results,
  };
}
