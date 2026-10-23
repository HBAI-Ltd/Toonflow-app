import { t, translateMessage } from "@/lib/i18n";
import { mkdir, readFile, realpath, stat, unlink } from "@toonflow/file";
import { join, relative } from "node:path";
import { mediaProviders, type Provider } from "@toonflow/providers";
import type { GeneratedMedia, MediaGenerationRequest, MediaModel, MediaReference } from "@toonflow/tools-scaffold/runtime";
import conf from "@/utils/conf";
import { getMediaProvider, listMediaProviders, loadMediaProviderSource } from "@/utils/media/provider";
import { lockWorkspaceFiles, resolveWorkspacePath, writeWorkspaceFile } from "@/utils/workspace/files";
import { downloadPublicFile } from "@/utils/workspace/download";
import { beginGeneration, getProviderPrice } from "@/utils/media/billing";
import { detectMimeType, readPriceReference } from "@/utils/media/priceReference";
import { z } from "zod";

const maxMediaSize = 100 * 1024 * 1024;
const maxRequestMediaSize = 100 * 1024 * 1024;
const maxRequestMediaCount = 256;
const mediaExtensions: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif",
  "image/avif": "avif", "image/bmp": "bmp", "image/tiff": "tiff",
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov", "video/ogg": "ogv",
  "audio/mpeg": "mp3", "audio/wav": "wav", "audio/ogg": "ogg", "audio/webm": "webm",
  "audio/flac": "flac", "audio/aac": "aac", "audio/mp4": "m4a", "audio/opus": "opus", "audio/pcm": "pcm",
};

const mediaGenerationMetadataSchema = z.strictObject({
  promptRequired: z.boolean().optional(),
  promptMaxLength: z.number().int().min(1).max(100000).optional(),
  inputs: z.array(z.strictObject({
    id: z.string().regex(/^[a-z][a-zA-Z0-9]{0,63}$/),
    label: z.string().trim().min(1).max(200),
    mediaType: z.enum(["image", "video", "audio"]),
    fallback: z.enum(["images", "videos", "audios", "firstFrame", "lastFrame"]).optional(),
    fallbackIndex: z.number().int().min(0).max(63).optional(),
    required: z.boolean().optional(),
    minItems: z.number().int().min(0).max(64).optional(),
    maxItems: z.number().int().min(1).max(64).optional(),
    accept: z.array(z.string().max(100).regex(/^(image|video|audio)\/(?:\*|[a-z0-9.+-]+)$/i)).max(32).optional(),
  })).max(64).optional(),
  parameters: z.array(z.strictObject({
    id: z.string().regex(/^[a-z][a-zA-Z0-9]{0,63}$/),
    label: z.string().trim().min(1).max(200),
    type: z.enum(["string", "number", "boolean"]),
    required: z.boolean().optional(),
    allowCustom: z.boolean().optional(),
    options: z.array(z.union([z.string().max(4096), z.number().finite()])).max(100).optional(),
    min: z.number().finite().optional(),
    max: z.number().finite().optional(),
    step: z.number().positive().finite().optional(),
    defaultValue: z.union([z.string().max(4096), z.number().finite(), z.boolean()]).optional(),
  })).max(64).optional(),
});

function mediaGenerationMetadata(value: unknown): MediaModel["generation"] | undefined {
  const result = mediaGenerationMetadataSchema.safeParse(value);
  return result.success ? result.data : undefined;
}

function invalid(message: string): never {
  throw Object.assign(new Error(message), { status: 400 });
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function imageOptions(value: unknown, pattern: RegExp) {
  return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.length <= 64 && item === item.trim() && pattern.test(item)))] : undefined;
}

function matchesMimeType(mimeType: string, accepted: string[]) {
  const normalized = mimeType.split(";")[0]!.trim().toLowerCase();
  return accepted.some(item => {
    const type = item.toLowerCase();
    return type.endsWith("/*") ? normalized.startsWith(type.slice(0, -1)) : normalized === type;
  });
}

export async function listMediaModels(): Promise<MediaModel[]> {
  const installedProviders = await listMediaProviders();
  return installedProviders.flatMap(provider => provider.models.flatMap(model => {
    if (model.type !== "image" && model.type !== "video" && model.type !== "audio") return [];
    const builtIn = (mediaProviders as readonly Provider[]).find(item => item.id === provider.id)?.models.find(item => item.id === model.id);
    return [{
      providerId: provider.id, providerLabel: provider.label, modelId: model.id, label: model.label, type: model.type,
      supportsPrice: "supportsPrice" in provider && provider.supportsPrice === true,
      mode: model.mode, durationResolutionMap: model.durationResolutionMap, audio: model.audio,
      generation: mediaGenerationMetadata(model.generation),
      ...(model.type === "audio" ? { voices: model.voices } : {}),
      ...(model.type === "image" ? {
        imageSizes: imageOptions(Array.isArray(model.imageSizes) ? model.imageSizes : builtIn?.imageSizes, /^[^\u0000-\u001f\u007f]+$/),
        imageRatios: imageOptions(Array.isArray(model.imageRatios) ? model.imageRatios : builtIn?.imageRatios, /^[1-9]\d{0,3}:[1-9]\d{0,3}$/),
      } : {}),
    } as MediaModel];
  }));
}

type ReferenceReadBudget = {
  usedBytes: number;
  cache: Map<string, { revision: string; value: Promise<Extract<MediaInput, { type: "base64" }>> }>;
};

export async function readReference(cwd: string, reference: MediaReference, mediaType: string, signal?: AbortSignal, budget?: ReferenceReadBudget): Promise<Extract<MediaInput, { type: "base64" }>> {
  signal?.throwIfAborted();
  const { path } = await resolveWorkspacePath(cwd, reference.path);
  const info = await stat(path);
  if (!info.isFile() || !info.size || info.size > maxMediaSize) invalid("参考媒体须为不超过 100 MB 的非空文件");
  const key = JSON.stringify([path, mediaType, reference.mimeType]);
  const revision = `${info.mtimeMs}:${info.ctimeMs}:${info.size}`;
  const cached = budget?.cache.get(key);
  if (cached) {
    if (cached.revision !== revision) invalid("参考媒体已变化，请重试生成");
    return cached.value;
  }
  if (budget) {
    budget.usedBytes += info.size;
    if (budget.usedBytes > maxRequestMediaSize) invalid("单次请求的参考素材总量不能超过 100 MB");
  }
  const value = (async () => {
    const bytes = await readFile(path, { signal });
    const latest = await stat(path);
    if (`${latest.mtimeMs}:${latest.ctimeMs}:${latest.size}` !== revision) invalid("参考媒体已变化，请重试生成");
    if (!bytes.length || bytes.length > maxMediaSize) invalid("参考媒体为空或超过 100 MB");
    const mimeType = detectMimeType(bytes, reference.mimeType);
    if (!mimeType.startsWith(`${mediaType}/`)) invalid(t`参考媒体类型须为 ${mediaType}`);
    return { type: "base64" as const, data: bytes.toString("base64"), mimeType, name: reference.path };
  })();
  budget?.cache.set(key, { revision, value });
  try {
    return await value;
  } catch (error) {
    if (budget?.cache.get(key)?.value === value) budget.cache.delete(key);
    throw error;
  }
}

async function downloadAsset(url: string, signal?: AbortSignal) {
  let mimeType = "";
  const bytes = await downloadPublicFile(url, {
    signal: signal ?? new AbortController().signal,
    maxBytes: maxMediaSize,
    label: "生成文件",
    accept: "image/*,video/*,audio/*",
    onContentType: value => { mimeType = value ?? ""; },
  });
  return { bytes, mimeType };
}

async function assetBytes(asset: MediaAsset, mediaType: "image" | "video" | "audio", signal?: AbortSignal) {
  if (!asset || asset.mediaType !== mediaType) invalid("供应商返回的媒体类型不正确");
  let bytes: Uint8Array;
  let mimeType = asset.mimeType ?? "";
  if (asset.type === "url") {
    const result = await downloadAsset(asset.url, signal);
    bytes = result.bytes;
    const responseMimeType = result.mimeType.split(";")[0].trim().toLowerCase();
    mimeType = responseMimeType && responseMimeType !== "application/octet-stream" ? result.mimeType : mimeType;
  } else if (asset.type === "base64") {
    const data = /^data:([^;,]+);base64,([\s\S]+)$/.exec(asset.data);
    const content = (data?.[2] ?? asset.data).replace(/\s/g, "");
    if (content.length > Math.ceil(maxMediaSize / 3) * 4 || !/^[a-zA-Z0-9+/]*={0,2}$/.test(content) || content.length % 4 === 1) invalid("生成结果的 base64 内容无效或超过 100 MB");
    bytes = Buffer.from(content, "base64");
    mimeType = data?.[1] ?? mimeType;
  } else if (asset.type === "binary" && ArrayBuffer.isView(asset.data) && asset.data.BYTES_PER_ELEMENT === 1) {
    bytes = asset.data;
  } else { return invalid("供应商返回了无效的媒体结果"); }
  if (!bytes.byteLength || bytes.byteLength > maxMediaSize) invalid("生成文件为空或超过 100 MB");
  mimeType = detectMimeType(bytes, mimeType);
  if (!mimeType.startsWith(`${mediaType}/`) || !mediaExtensions[mimeType]) invalid("生成结果不是支持的图片、视频或音频格式");
  return { bytes, mimeType };
}

async function prepareRequest<T>(directory: string | undefined, mediaType: "image" | "video" | "audio", request: MediaGenerationRequest,
  read: (cwd: string, reference: MediaReference, type: string, signal?: AbortSignal, budget?: ReferenceReadBudget) => Promise<T>, generation?: MediaModel["generation"], signal?: AbortSignal) {
  const definitions = generation?.inputs ?? [];
  const namedInputs = record(request.inputs);
  if (Object.keys(namedInputs).some(key => !definitions.some(item => item.id === key))) invalid("请求包含当前模型未声明的素材输入角色");
  const fallbackReferences: Record<string, MediaReference[] | undefined> = {
    images: request.images,
    videos: request.videos,
    audios: request.audios,
    firstFrame: request.firstFrame ? [request.firstFrame] : undefined,
    lastFrame: request.lastFrame ? [request.lastFrame] : undefined,
  };
  const plannedInputs = new Map<string, MediaReference[]>();
  let referenceCount = (request.images?.length ?? 0) + (request.videos?.length ?? 0) + (request.audios?.length ?? 0)
    + Number(!!request.firstFrame) + Number(!!request.lastFrame);
  for (const definition of definitions) {
    const value = namedInputs[definition.id];
    if (value !== undefined && !Array.isArray(value)) invalid(`素材输入“${definition.label}”必须是数组`);
    const fallback = fallbackReferences[definition.fallback ?? ""] ?? [];
    const fromFallback = definition.fallbackIndex === undefined
      ? fallback
      : fallback[definition.fallbackIndex] === undefined ? [] : [fallback[definition.fallbackIndex]!];
    const items = value === undefined ? fromFallback : value as MediaReference[];
    const minimum = definition.minItems ?? (definition.required ? 1 : 0);
    if (items.length < minimum) invalid(`素材输入“${definition.label}”至少需要 ${minimum} 个文件`);
    if (definition.maxItems !== undefined && items.length > definition.maxItems) invalid(`素材输入“${definition.label}”最多接受 ${definition.maxItems} 个文件`);
    plannedInputs.set(definition.id, items);
    referenceCount += items.length;
  }
  if (referenceCount > maxRequestMediaCount) invalid(`单次请求最多接受 ${maxRequestMediaCount} 个参考素材`);

  const other = record(request.other);
  const strictParameters = request.providerId === "dreamApi" || generation !== undefined;
  const parameters = generation?.parameters ?? [];
  const parameterMap = new Map(parameters.map(item => [item.id, item]));
  if (strictParameters && Object.keys(other).some(key => !parameterMap.has(key))) invalid("请求包含当前模型未声明的专属参数");
  for (const definition of parameters) {
    const requestParameters = request as unknown as Record<string, unknown>;
    const value = Object.hasOwn(other, definition.id) ? other[definition.id] : requestParameters[definition.id] ?? definition.defaultValue;
    if (value === undefined || value === null || value === "") {
      if (definition.required) invalid(`模型参数“${definition.label}”为必填项`);
      continue;
    }
    if (definition.type === "string" && typeof value !== "string" || definition.type === "number" && (typeof value !== "number" || !Number.isFinite(value)) || definition.type === "boolean" && typeof value !== "boolean") invalid(`模型参数“${definition.label}”的值类型不正确`);
    if (typeof value === "string" && definition.required && !value.trim()) invalid(`模型参数“${definition.label}”不能为空`);
    if (typeof value === "number") {
      const stepOffset = value - (definition.min ?? 0);
      if (definition.min !== undefined && value < definition.min || definition.max !== undefined && value > definition.max
        || definition.step && Math.abs(stepOffset / definition.step - Math.round(stepOffset / definition.step)) > 1e-8) invalid(`模型参数“${definition.label}”超出允许范围`);
    }
    if (definition.options?.length && !definition.allowCustom && !definition.options.includes(value as string | number)) invalid(`模型参数“${definition.label}”不在允许选项中`);
  }

  const budget: ReferenceReadBudget = { usedBytes: 0, cache: new Map() };
  const references = async (items: MediaReference[] | undefined, type: string) => {
    if (!items?.length) return items ? [] : undefined;
    if (!directory) invalid("参考媒体需要工作目录");
    // ACT: 单次请求顺序处理引用，避免数十个参考媒体同时启动探测进程。
    const result: T[] = [];
    for (const item of items) result.push(await read(directory, item, type, signal, budget));
    return result;
  };
  const images = await references(request.images, "image");
  const videos = await references(request.videos, "video");
  const audios = await references(request.audios, "audio");
  const firstFrame = (await references(request.firstFrame ? [request.firstFrame] : undefined, "image"))?.[0];
  const lastFrame = (await references(request.lastFrame ? [request.lastFrame] : undefined, "image"))?.[0];
  const inputs: Record<string, T[]> = {};
  for (const definition of definitions) {
    const items = plannedInputs.get(definition.id) ?? [];
    const loaded = await references(items, definition.mediaType) ?? [];
    if (definition.accept?.length && loaded.some(item => {
      const mimeType = record(item).mimeType;
      return typeof mimeType !== "string" || !matchesMimeType(mimeType, definition.accept!);
    })) invalid(`素材输入“${definition.label}”的文件格式不受支持`);
    if (loaded.length) inputs[definition.id] = loaded;
  }
  const prompt = request.prompt ?? "";
  if (mediaType === "audio") return {
    type: "audio" as const, model: request.modelId, prompt, text: prompt, images, audios,
    voice: request.voice, speed: request.speed, volume: request.volume, pitch: request.pitch, language: request.language, format: request.format, sampleRate: request.sampleRate,
    inputs, other,
  };
  if (mediaType === "image") return { type: "image" as const, model: request.modelId, prompt, images, ratio: request.ratio, size: request.size, inputs, other };
  return {
    type: "video" as const, model: request.modelId, prompt, images,
    videos, audios, firstFrame, lastFrame,
    ratio: request.ratio, resolution: request.resolution, duration: request.duration, generateAudio: request.generateAudio, mode: request.mode, inputs, other,
  };
}

async function configuredProvider(request: MediaGenerationRequest, mediaType: "image" | "video" | "audio", signal?: AbortSignal, directory?: string) {
  const info = await getMediaProvider(request.providerId);
  const selectedModel = info.models.find(item => item.id === request.modelId && item.type === mediaType);
  if (!selectedModel) invalid("所选媒体模型不存在或类型不匹配，请重新选择");
  const model = { ...selectedModel, generation: mediaGenerationMetadata(selectedModel.generation) };
  const configurations = record(conf.get("settings", {}).mediaProviderConfigs);
  return { model, provider: await loadMediaProviderSource(info.source, record(configurations[info.id]), signal, undefined, directory) };
}

async function preparePriceRequest(directory: string | undefined, mediaType: "image" | "video" | "audio", request: MediaGenerationRequest, generation: MediaModel["generation"], signal?: AbortSignal) {
  const deadline = AbortSignal.timeout(5000);
  const combined = signal ? AbortSignal.any([signal, deadline]) : deadline;
  try {
    const prepared = await prepareRequest(directory, mediaType, request, readPriceReference, generation, combined);
    const { inputs, other, ...priceRequest } = prepared;
    void inputs;
    void other;
    return priceRequest;
  }
  catch (error) {
    signal?.throwIfAborted();
    if (deadline.aborted) throw new Error("读取参考媒体信息超时，请稍后重试");
    throw error;
  }
}

export async function getMediaPrice(directory: string | undefined, mediaType: "image" | "video" | "audio", request: MediaGenerationRequest, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const { provider, model } = await configuredProvider(request, mediaType, signal, directory);
  if (!provider.getPrice) return null;
  const prepared = await preparePriceRequest(directory, mediaType, request, model.generation, signal);
  signal?.throwIfAborted();
  return getProviderPrice(provider, prepared);
}

export async function generateMedia(
  cwd: string,
  mediaType: "image" | "video" | "audio",
  request: MediaGenerationRequest,
  signal?: AbortSignal,
): Promise<GeneratedMedia[]> {
  signal?.throwIfAborted();
  const directory = await realpath(cwd);
  const outputDirectory = request.outputDirectory ?? "assets/generated";
  await resolveWorkspacePath(directory, outputDirectory, true);
  const { provider, model } = await configuredProvider(request, mediaType, signal, directory);
  const prompt = request.prompt?.trim() ?? "";
  if (model.generation?.promptRequired !== false && !prompt) invalid("请输入生成提示词");
  if (model.generation?.promptMaxLength && prompt.length > model.generation.promptMaxLength) invalid(`提示词不能超过 ${model.generation.promptMaxLength} 个字符`);
  const generate = mediaType === "image" ? provider.generateImage : mediaType === "video" ? provider.generateVideo : provider.generateAudio;
  if (typeof generate !== "function") invalid(t`此供应商不支持${translateMessage({ image: "图片", video: "视频", audio: "音频" }[mediaType])}生成`);
  const rules = Array.isArray(provider.rules) ? provider.rules : [];
  if (rules.some(rule => rule.field === "apiKey") && (typeof provider.config.apiKey !== "string" || !provider.config.apiKey.trim())) invalid("请先在媒体模型设置中配置供应商 API Key");
  const prepared = await prepareRequest(directory, mediaType, { ...request, prompt }, readReference, model.generation, signal);
  signal?.throwIfAborted();
  const finish = beginGeneration(provider);
  const written: string[] = [];
  const result: GeneratedMedia[] = [];
  try {
    signal?.throwIfAborted();
    const { type, ...parameters } = prepared;
    const assets = type === "audio" ? await provider.generateAudio!(parameters as AudioRequest)
      : type === "image" ? await provider.generateImage!(parameters as ImageRequest) : await provider.generateVideo!(parameters as VideoRequest);
    if (!Array.isArray(assets) || !assets.length) invalid("供应商未返回生成结果");
    for (const asset of assets) {
      signal?.throwIfAborted();
      const { bytes, mimeType } = await assetBytes(asset, mediaType, signal);
      signal?.throwIfAborted();
      const output = await resolveWorkspacePath(directory, outputDirectory, true);
      const release = lockWorkspaceFiles([output.path]);
      try {
        await mkdir(output.path, { recursive: true });
        const file = join(outputDirectory, `${mediaType}${crypto.randomUUID()}.${mediaExtensions[mimeType]}`);
        const { path } = await resolveWorkspacePath(directory, file);
        signal?.throwIfAborted();
        await writeWorkspaceFile(path, bytes, true);
        written.push(path);
        result.push({ path: relative(directory, path).replace(/\\/g, "/"), mimeType, mediaType });
      } finally { release(); }
    }
    signal?.throwIfAborted();
    return result;
  } catch (err) {
    // ACT: 只回滚本次创建的文件，保留目录中已有的节点资源。
    await Promise.all(written.map(path => unlink(path).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; })));
    throw err;
  } finally { finish(); }
}
