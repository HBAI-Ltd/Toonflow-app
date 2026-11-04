import { modelProviderSchema, modelProvidersSchema } from "@toonflow/multi-tenant-models/config";
import type { ManagedModelProvider, ModelProvider } from "@toonflow/multi-tenant-models/config";
import conf from "@/utils/conf";
import { getConfiguredProviders, providerSchema } from "@/utils/ai/provider";
import { getMediaProvider, listMediaProviders, mediaModelsSchema, replaceMediaProviderModels, validateMediaProviderSource, validateTextProviderSource } from "@/utils/media/provider";

function invalid(message: string): never { throw Object.assign(new Error(message), { status: 400 }); }

function jsonConfig(value: unknown): ModelProvider["config"] {
  return JSON.parse(JSON.stringify(value));
}

function normalizeProvider(input: ModelProvider): ModelProvider {
  const provider = modelProviderSchema.parse(input);
  if (provider.id.toLowerCase() === "toonflow") invalid("平台模型不能使用个人云端凭据");
  if (provider.kind === "media") {
    if (!provider.source) invalid("供应商源码不能为空");
    const metadata = validateMediaProviderSource(provider.source);
    if (metadata.id !== provider.id) invalid("供应商 ID 与代码不一致");
    return { ...provider, label: metadata.label };
  }
  const metadata = provider.source ? validateTextProviderSource(provider.source) : undefined;
  if (metadata && metadata.id !== provider.id) invalid("供应商 ID 与代码不一致");
  const defaults = metadata ? {
    ...metadata.configuration,
    ...Object.fromEntries(metadata.rules.flatMap(rule => typeof rule.field === "string" && rule.value !== undefined ? [[rule.field, rule.value]] : [])),
  } : {};
  const parsed = providerSchema.safeParse({ ...defaults, ...provider.config });
  if (!parsed.success) invalid("文本供应商配置无效");
  mediaModelsSchema.parse(parsed.data.models.map(model => ({ ...model, type: "text" })));
  return { ...provider, label: metadata?.label ?? provider.label, config: jsonConfig({ ...provider.config, ...parsed.data }) };
}

function normalize(providers: ModelProvider[]): ModelProvider[] {
  return modelProvidersSchema.parse(providers).map(normalizeProvider);
}

function describe(providers: ModelProvider[]): ManagedModelProvider[] {
  return normalize(providers).map(provider => {
    if (provider.kind === "media") {
      const metadata = validateMediaProviderSource(provider.source!);
      return { ...provider, models: metadata.models, rules: metadata.rules,
        icon: metadata.icon, version: metadata.version, readme: metadata.readme };
    }
    const metadata = provider.source ? validateTextProviderSource(provider.source) : undefined;
    const configuration = providerSchema.parse(provider.config);
    return {
      ...provider, models: configuration.models.map(model => ({ ...model, type: "text" as const })), rules: metadata?.rules ?? [],
      icon: metadata?.icon ?? (typeof provider.config.icon === "string" ? provider.config.icon : undefined),
      version: metadata?.version ?? (typeof provider.config.version === "string" ? provider.config.version : undefined),
      readme: metadata?.readme ?? (typeof provider.config.readme === "string" ? provider.config.readme : undefined),
    };
  });
}

async function legacy(): Promise<ModelProvider[]> {
  const providers: ModelProvider[] = [];
  for (const value of getConfiguredProviders()) {
    if (typeof value?.id !== "string" || value.id.toLowerCase() === "toonflow" || !providerSchema.safeParse(value).success) continue;
    providers.push({ kind: "text", id: value.id, label: typeof value.label === "string" ? value.label : value.id, config: jsonConfig(value) });
  }
  const configurations = conf.get("settings", {}).mediaProviderConfigs as Record<string, unknown> | undefined;
  for (const metadata of await listMediaProviders()) {
    if (metadata.id.toLowerCase() === "toonflow" || metadata.loadError) continue;
    const provider = await getMediaProvider(metadata.id);
    const config = configurations?.[provider.id] ?? {};
    providers.push({ kind: "media", id: provider.id, label: provider.label, source: provider.source,
      config: modelProviderSchema.shape.config.parse(config) });
  }
  return normalize(providers);
}

function inspect(kind: ModelProvider["kind"], source: string, config: ModelProvider["config"], models?: unknown): ManagedModelProvider {
  if (kind === "media" && models !== undefined) source = replaceMediaProviderModels(source, mediaModelsSchema.parse(models));
  const metadata = kind === "media" ? validateMediaProviderSource(source) : validateTextProviderSource(source);
  const configuration = kind === "text" && models !== undefined ? { ...config, models } : config;
  return describe([{ kind, id: metadata.id, label: metadata.label, source, config: modelProviderSchema.shape.config.parse(configuration) }])[0]!;
}

export const providerAdapters = { legacy, normalize, describe, inspect };
