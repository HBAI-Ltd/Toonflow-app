import { z } from "zod";
import type { ModelAdapter, ModelExecution } from "@toonflow/multi-tenant-gateway/types";
import { modelRouteSchema } from "@toonflow/multi-tenant-models/config";
import type { ModelPrice, ModelRoute } from "@toonflow/multi-tenant-models/config";
import { translateMessage } from "@/lib/i18n";
import { getModelLimits, getModelReasoning, providerSchema } from "@/utils/ai/provider";
import { getChannel } from "@/utils/channel";
import { mediaModelsSchema, parseAccountProviderSources, validateMediaProviderSource } from "@/utils/media/provider";

const mediaTypeSchema = z.enum(["image", "video", "audio"]);
const cloudLanguageSchema = providerSchema.extend({ token: z.string().trim().min(1).max(16384).optional() })
  .transform(value => ({ ...value, apiKey: value.token ?? value.apiKey }))
  .pipe(providerSchema.refine(value => !!value.apiKey.trim()));
export const cloudSchema = z.object({
  accountToken: z.string().trim().min(1).max(16384),
  language: cloudLanguageSchema,
  mediaSource: z.string().min(1).max(2 * 1024 * 1024),
  mediaModels: mediaModelsSchema,
  mediaToken: z.string().trim().min(1).max(16384).optional(),
});
export type Cloud = z.infer<typeof cloudSchema>;

const textUpstreamSchema = z.strictObject({ provider: providerSchema, model: providerSchema.shape.models.element });
export type TextUpstream = z.infer<typeof textUpstreamSchema>;
const mediaUpstreamSchema = z.object({
  source: z.string().min(1).max(2 * 1024 * 1024),
  config: z.record(z.string(), z.json()),
  upstreamModelId: z.string().min(1).max(256),
  cloud: z.boolean(),
  secretValues: z.array(z.string().min(1)).default([]),
});
export type MediaUpstream = z.infer<typeof mediaUpstreamSchema> & { model: z.infer<typeof mediaModelsSchema>[number] };
const legacyMediaSchema = mediaUpstreamSchema.extend({
  kind: z.literal("multiTenantMediaRoute"), route: modelRouteSchema,
  revision: z.number().int().min(1).max(2147483647),
});
const requestSchema = z.object({ other: z.unknown().optional(), duration: z.number().finite().positive().optional() });
const secretField = /^keys?$|^host(?:name)?$|^port$|^protocol$|^proxy$|^model(?:Id)?$|^provider(?:Id)?$|api.?key|token|secret|password|auth|bearer|headers|cookie|credential|private.?key|access.?key|signature|url|endpoint|source|config/i;

function fail(message: string, status = 400): never { throw Object.assign(new Error(message), { status }); }

export function formatModelPrice(price: ModelPrice) {
  if (price.mode === "perMillionTokens") return `${translateMessage("输入")} ${price.input} / ${translateMessage("输出")} ${price.output} ${price.currency}/1M Token`;
  return `${price.amount} ${price.currency}/${translateMessage(price.mode === "perRequest" ? "次" : "秒")}`;
}

export async function loadModelCloud(token: string, signal?: AbortSignal): Promise<Cloud> {
  let parsed: ReturnType<typeof parseAccountProviderSources>;
  try {
    const sources = await getChannel().getProviderSource({ token, signal });
    signal?.throwIfAborted();
    parsed = parseAccountProviderSources(sources);
  } catch {
    if (signal?.aborted) fail("请求已取消", 499);
    fail("平台 Toonflow 云端配置获取失败", 502);
  }
  const payload = cloudSchema.safeParse({ accountToken: token, ...parsed });
  if (!payload.success) fail("平台 Toonflow 云端配置无效", 502);
  return JSON.parse(JSON.stringify(payload.data));
}

function textCapabilities({ route, upstream: { provider, model } }: ModelExecution<TextUpstream>) {
  const limits = getModelLimits(route.providerId, model);
  return {
    protocol: provider.protocol, contextWindow: limits.contextWindow, maxOutputTokens: limits.maxTokens,
    reasoningLevels: getModelReasoning(route.providerId, model, provider.protocol).reasoningLevels,
  };
}
export type TextCapabilities = ReturnType<typeof textCapabilities>;

function validateText({ route, upstream: { provider, model } }: Pick<ModelExecution<TextUpstream>, "route" | "upstream">) {
  if (provider.protocol === "openai-responses" && getModelLimits(route.providerId, model).maxTokens < 16) {
    fail("Responses 模型的输出上限不能低于 16 Token");
  }
}

function textUpstream(value: unknown, route: ModelRoute): TextUpstream {
  const parsed = providerSchema.safeParse(value);
  if (!parsed.success) fail("平台模型上游配置无效", 503);
  const model = parsed.data.models.find(item => item.id === route.upstreamModelId);
  if (!model) fail("平台模型上游不存在", 503);
  const upstream = { provider: parsed.data, model };
  validateText({ route, upstream });
  return upstream;
}

const textAdapter: ModelAdapter<TextUpstream, TextCapabilities, Cloud> = {
  sources: {
    backend: {
      async available(type, { providers }) {
        if (type !== "text") return [];
        return providers.flatMap(value => {
          if (value.kind !== "text" || value.id.toLowerCase() === "toonflow") return [];
          const parsed = providerSchema.safeParse(value.config);
          if (!parsed.success) return [];
          return parsed.data.models.map(model => ({ target: "backend" as const, providerId: value.id,
            providerLabel: value.label ?? value.id, modelId: model.id, label: model.label, type }));
        });
      },
      async resolve(route, resources) {
        if (route.providerId.toLowerCase() === "toonflow") fail("平台模型不能使用个人云端凭据", 503);
        const providers = await resources.providers();
        return textUpstream(providers.find(item => item.kind === "text" && item.id === route.providerId)?.config, route);
      },
    },
    toonflowCloud: {
      async available(type, { cloud }) {
        if (type !== "text") return [];
        return cloud?.language.models.map(model => ({ target: "toonflowCloud" as const,
          providerId: "toonflow", providerLabel: "Toonflow", modelId: model.id, label: model.label, type })) ?? [];
      },
      async resolve(route, resources) {
        if (route.providerId.toLowerCase() !== "toonflow") fail("平台模型上游配置无效", 503);
        return textUpstream((await resources.cloud()).language, route);
      },
    },
  },
  restore(value, route) {
    const parsed = textUpstreamSchema.safeParse(value);
    if (!parsed.success || parsed.data.model.id !== route.upstreamModelId
      || !parsed.data.provider.models.some(item => item.id === route.upstreamModelId)) fail("平台模型上游配置无效", 503);
    validateText({ route, upstream: parsed.data });
    return parsed.data;
  },
  publicModel: textCapabilities,
  validate: validateText,
  maximumUsage(execution) {
    validateText(execution);
    const { contextWindow, maxOutputTokens } = textCapabilities(execution);
    // ACT: 沿用上下文、输出及缓存上限的保守预占；实际用量由协议适配层证明后交给网关结算。
    return { input: contextWindow, output: maxOutputTokens, cacheRead: contextWindow, cacheWrite: contextWindow };
  },
};

function secretsFrom(config: Record<string, unknown>, rules?: unknown) {
  const values: string[] = [];
  const visit = (value: unknown, sensitive = false) => {
    if (typeof value === "string") { if (sensitive && value.length) values.push(value); return; }
    if (value && typeof value === "object") {
      for (const [key, item] of Object.entries(value)) visit(item, sensitive || secretField.test(key));
    }
  };
  visit(config);
  if (Array.isArray(rules)) {
    for (const rule of rules) if (typeof rule?.field === "string" && secretField.test(rule.field)) visit(rule.value, true);
  }
  return values;
}

function containsSecret(value: unknown, secrets: string[]): boolean {
  if (typeof value === "string") return secrets.some(secret => value.includes(secret));
  return !!value && typeof value === "object" && Object.values(value).some(item => containsSecret(item, secrets));
}

function publicRules(value: unknown, secrets: string[]) {
  if (!Array.isArray(value)) return [];
  // ACT: 供应商脚本格式由宿主适配；目录只发布简单参数，排除任意事件、HTML、请求及嵌套规则。
  const scalar = z.union([z.string().max(512), z.number().finite(), z.boolean(), z.null()]);
  const schema = z.object({
    type: z.enum(["select", "radio", "checkbox", "switch", "inputNumber", "slider"]),
    field: z.string().regex(/^[a-zA-Z][a-zA-Z0-9]{0,63}$/), title: z.string().max(200).optional(),
    value: z.union([scalar, z.array(scalar).max(100)]).optional(),
    options: z.array(z.object({ label: z.string().max(200), value: scalar })).max(200).optional(),
    props: z.object({ min: z.number().finite().optional(), max: z.number().finite().optional(), step: z.number().finite().positive().optional(),
      precision: z.number().int().min(0).max(10).optional(), multiple: z.boolean().optional(), clearable: z.boolean().optional() }).optional(),
  });
  return value.flatMap(item => {
    const parsed = schema.safeParse(item);
    if (!parsed.success || secretField.test(parsed.data.field) || ["constructor", "prototype", "__proto__"].includes(parsed.data.field)) return [];
    const text = JSON.stringify(parsed.data);
    if (containsSecret(parsed.data, secrets) || /https?:\/\/|Bearer\s|\bsk-[a-zA-Z0-9_-]{8}/i.test(text)) return [];
    return [parsed.data];
  });
}

function restoreMedia(value: unknown, route: ModelRoute): MediaUpstream {
  const parsed = mediaUpstreamSchema.safeParse(value);
  if (!parsed.success || parsed.data.upstreamModelId !== route.upstreamModelId
    || parsed.data.cloud !== (route.target === "toonflowCloud")) fail("媒体任务路由快照无效", 409);
  let metadata: ReturnType<typeof validateMediaProviderSource>;
  try { metadata = validateMediaProviderSource(parsed.data.source); }
  catch { fail("媒体任务路由快照无效", 409); }
  if (metadata.id !== (parsed.data.cloud ? "toonflow" : route.providerId)) fail("媒体任务路由快照无效", 409);
  const model = metadata.models.find(item => item.id === route.upstreamModelId && item.type === route.type);
  if (!model) fail("媒体任务路由快照无效", 409);
  return { ...parsed.data, model,
    secretValues: [...new Set([...parsed.data.secretValues, ...secretsFrom(parsed.data.config, metadata.rules)])] };
}

function validateMedia({ upstream }: ModelExecution<MediaUpstream>, request: unknown) {
  const parsed = requestSchema.safeParse(request);
  if (!parsed.success) fail("模型参数不在平台允许的范围内");
  const { other } = parsed.data;
  if (other === undefined) return;
  function invalid(): never { fail("模型参数不在平台允许的范围内"); }
  if (!other || typeof other !== "object" || Array.isArray(other)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(other))) invalid();
  const values = Object.entries(other);
  if (!values.length) return;
  const rules = new Map(publicRules(upstream.model.rules, upstream.secretValues).map(rule => [rule.field, rule]));
  for (const [field, value] of values) {
    const rule = rules.get(field);
    if (!rule || secretField.test(field) || containsSecret(value, upstream.secretValues)) invalid();
    if (rule.type === "switch" || rule.type === "checkbox" && !rule.options?.length) {
      if (typeof value !== "boolean") invalid();
    } else if (rule.type === "inputNumber" || rule.type === "slider") {
      if (typeof value !== "number" || !Number.isFinite(value)) invalid();
      const { min, max, precision, step } = rule.props ?? {};
      if (min !== undefined && value < min || max !== undefined && value > max) invalid();
      if (precision !== undefined) {
        const tolerance = Math.min(Math.abs(value) * Number.EPSILON * 8, 10 ** -precision * 1e-8);
        if (Math.abs(value - Number(value.toFixed(precision))) > tolerance) invalid();
      }
      if (step !== undefined) {
        const base = min ?? 0;
        const steps = (value - base) / step;
        const tolerance = Math.min(1e-8, Math.max(Math.abs(value / step), Math.abs(base / step), Math.abs(steps)) * Number.EPSILON * 8);
        if (!Number.isFinite(steps) || Math.abs(steps - Math.round(steps)) > tolerance) invalid();
      }
    } else {
      const options = rule.options ?? [];
      const selected = rule.type === "checkbox" || rule.props?.multiple ? value : [value];
      if (!Array.isArray(selected) || selected.length > 200
        || selected.some(item => !options.some(option => option.value === item))) invalid();
    }
  }
}

function mediaCapabilities({ route, upstream: { model, secretValues } }: ModelExecution<MediaUpstream>) {
  const safeString = z.string().min(1).max(128).refine(value => !/[\u0000-\u001f\u007f]|https?:\/\//i.test(value));
  const mode = z.enum(["text", "singleImage", "multiReference", "startEndRequired", "endFrameOptional", "startFrameOptional"]);
  const referenceMode = z.string().regex(/^(?:image|video|audio)Reference:(?:[1-9]\d?|1\d{2}|2[0-4]\d|25[0-6])$/);
  const safe = z.object({
    mode: z.array(z.union([mode, z.array(referenceMode).min(1).max(3)])).max(32).optional(),
    durationResolutionMap: z.array(z.object({ duration: z.array(z.number().positive()).max(100), resolution: z.array(safeString).max(100) })).max(100).optional(),
    audio: z.union([z.boolean(), z.literal("optional")]).optional(),
    imageSizes: z.array(safeString).max(100).optional(), imageRatios: z.array(z.string().regex(/^[1-9]\d{0,3}:[1-9]\d{0,3}$/)).max(100).optional(),
    voices: z.array(z.object({ title: safeString, voice: safeString })).max(1000).optional(),
  }).safeParse(model);
  if (!safe.success || containsSecret(safe.data, secretValues)) fail("平台模型能力配置无效", 503);
  return { type: mediaTypeSchema.parse(route.type), supportsPrice: true, ...safe.data, rules: publicRules(model.rules, secretValues) };
}
export type MediaCapabilities = ReturnType<typeof mediaCapabilities>;

const mediaAdapter: ModelAdapter<MediaUpstream, MediaCapabilities, Cloud> = {
  sources: {
    backend: {
      async available(type, { providers }) {
        if (type === "text") return [];
        return providers.flatMap(provider => {
          if (provider.kind !== "media" || provider.id.toLowerCase() === "toonflow" || !provider.source) return [];
          const metadata = validateMediaProviderSource(provider.source);
          return metadata.models.filter(model => model.type === type).map(model => ({ target: "backend" as const,
            providerId: provider.id, providerLabel: provider.label, modelId: model.id, label: model.label, type }));
        });
      },
      async resolve(route, resources) {
        if (route.providerId.toLowerCase() === "toonflow") fail("平台模型不能使用个人云端凭据", 503);
        const providers = await resources.providers();
        const provider = providers.find(item => item.kind === "media" && item.id === route.providerId);
        if (!provider?.source) fail("平台模型上游配置无效", 503);
        const metadata = validateMediaProviderSource(provider.source);
        if (metadata.id !== route.providerId) fail("平台模型上游配置无效", 503);
        const model = metadata.models.find(item => item.id === route.upstreamModelId && item.type === route.type);
        if (!model) fail("平台模型上游不存在", 503);
        return { source: provider.source, config: provider.config, model, upstreamModelId: route.upstreamModelId, cloud: false,
          secretValues: secretsFrom(provider.config, metadata.rules) };
      },
    },
    toonflowCloud: {
      async available(type, { cloud }) {
        if (type === "text") return [];
        return cloud?.mediaModels.filter(model => model.type === type).map(model => ({ target: "toonflowCloud" as const,
          providerId: "toonflow", providerLabel: "Toonflow", modelId: model.id, label: model.label, type })) ?? [];
      },
      async resolve(route, resources) {
        if (route.providerId.toLowerCase() !== "toonflow") fail("平台模型上游配置无效", 503);
        const cloud = await resources.cloud();
        const model = cloud.mediaModels.find(item => item.id === route.upstreamModelId && item.type === route.type);
        if (!model) fail("平台模型上游不存在", 503);
        let metadata: ReturnType<typeof validateMediaProviderSource>;
        try { metadata = validateMediaProviderSource(cloud.mediaSource); }
        catch { fail("平台模型上游配置无效", 503); }
        if (metadata.id !== "toonflow") fail("平台模型上游配置无效", 503);
        return { source: cloud.mediaSource, config: {}, model, upstreamModelId: route.upstreamModelId, cloud: true,
          secretValues: [cloud.accountToken, cloud.language.apiKey, ...(cloud.mediaToken ? [cloud.mediaToken] : []), ...secretsFrom({}, metadata.rules)] };
      },
    },
  },
  restore: restoreMedia,
  restoreLegacy(value) {
    if (!value || typeof value !== "object" || !("kind" in value) || value.kind !== "multiTenantMediaRoute") return;
    const parsed = legacyMediaSchema.safeParse(value);
    if (!parsed.success) fail("媒体任务路由快照无效", 409);
    return { route: parsed.data.route, revision: parsed.data.revision, upstream: restoreMedia(parsed.data, parsed.data.route) };
  },
  publicModel: mediaCapabilities,
  validate: validateMedia,
  maximumUsage(execution, request) {
    validateMedia(execution, request);
    const { duration } = requestSchema.parse(request);
    return { requests: 1, ...(execution.route.type === "video" && duration ? { seconds: duration } : {}) };
  },
};

export type ModelUpstreams = { text: TextUpstream; image: MediaUpstream; video: MediaUpstream; audio: MediaUpstream };
export type ModelCapabilities = { text: TextCapabilities; image: MediaCapabilities; video: MediaCapabilities; audio: MediaCapabilities };
export const modelAdapters = { text: textAdapter, image: mediaAdapter, video: mediaAdapter, audio: mediaAdapter };
