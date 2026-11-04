import { getBuiltinModels, getBuiltinProviders } from "@earendil-works/pi-ai/providers/all";
import { getSupportedThinkingLevels, type KnownApi, type Model, type ThinkingLevelMap } from "@earendil-works/pi-ai";
import { defaultThinkingLevels, thinkingLevels, type ThinkingLevel } from "@/lib/modelReasoning";
import conf from "@/utils/conf";
import { findModelContextLimits } from "@/utils/ai/modelContextLimits";
import { validateHeaderName, validateHeaderValue } from "node:http";
import { z } from "zod";

export const providerHeadersSchema = z.record(
  z.string().refine(name => {
    try { validateHeaderName(name); return true; } catch { return false; }
  }, "请求头名称无效"),
  z.string().refine(value => {
    try { validateHeaderValue("header", value); return true; } catch { return false; }
  }, "请求头值包含无效字符"),
).refine(headers => new Set(Object.keys(headers).map(name => name.toLowerCase())).size === Object.keys(headers).length,
  "请求头名称不能重复（不区分大小写）");

export function getProviderBaseUrl(apiUrl: string, protocol: string) {
  const url = new URL(apiUrl);
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  // Anthropic SDK 自带 /v1/messages；兼容旧配置中的 /v1，同时保留网关路径前缀。
  if (protocol === "anthropic-messages") url.pathname = url.pathname.replace(/\/v1$/, "") || "/";
  else if (url.pathname === "/") url.pathname = "/v1";
  return url.href.replace(/\/+$/, "");
}

export const reasoningEffortsSchema = z.union([
  z.literal(false),
  z.partialRecord(z.enum(thinkingLevels), z.string().min(1).refine(value => value.trim() === value, "接口值不能包含首尾空白").nullable())
    .refine(value => Object.entries(value).every(([level, wire]) => level === "off" || typeof wire === "string"), "仅关闭档位可省略接口值")
    .refine(value => Object.keys(value).some(level => level !== "off"), "请至少声明一个推理档位"),
]);

export const providerSchema = z.object({
  apiUrl: z.url({ protocol: /^https?$/ }),
  apiKey: z.string(),
  headers: providerHeadersSchema.optional(),
  protocol: z.enum(["openai-completions", "openai-responses", "anthropic-messages"]),
  maxRequestImageBytes: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
  maxRequestBytes: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
  models: z.array(z.object({
    id: z.string(), label: z.string(),
    contextWindow: z.number().int().positive().optional(),
    maxOutputTokens: z.number().int().positive().optional(),
    reasoningEfforts: reasoningEffortsSchema.optional(),
  })),
});

export const accountProviderSchema = providerSchema.extend({
  id: z.enum(["Toonflow", "toonflow"]), label: z.string().min(1), apiKey: z.literal(""),
  token: z.string().trim().min(1).max(16384).optional(),
  icon: z.string().optional(), version: z.string().optional(),
});

export function getAccountToken() {
  const account = conf.get("settings", {}).toonflowAccount as { token?: unknown } | null | undefined;
  return typeof account?.token === "string" ? account.token.trim() : "";
}

export function getAccountProvider() {
  const accountToken = getAccountToken();
  const parsed = accountProviderSchema.safeParse(conf.get("settings", {}).toonflowProvider);
  return accountToken && parsed.success && parsed.data.token ? { ...parsed.data, apiKey: parsed.data.token } : undefined;
}

export function getConfiguredProviders() {
  const providers = conf.get("settings", {}).customProviders;
  const account = getAccountProvider();
  return [...(account ? [account] : []), ...(Array.isArray(providers) ? providers.filter(item => typeof item?.id !== "string" || item.id.toLowerCase() !== "toonflow") : [])];
}

const builtinModels: Model<KnownApi>[] = getBuiltinProviders().flatMap(provider => getBuiltinModels(provider));

export function getModelReasoning(providerId: string, model: z.infer<typeof providerSchema>["models"][number], protocol: string) {
  const matches = builtinModels.filter(item => item.id === model.id);
  const base = matches.find(item => item.provider.toLowerCase() === providerId.toLowerCase() && item.api === protocol);
  const candidates = base ? [base] : matches;
  const efforts = model.reasoningEfforts;
  const supported = candidates.map(item => item.reasoning ? getSupportedThinkingLevels(item) : []);
  const wireValue = (item: Model<KnownApi>, level: ThinkingLevel) => item.thinkingLevelMap?.[level] ?? (level === "off" ? undefined : level);
  // ACT: 中转站仅继承同 ID 模型共同支持且接口值一致的档位，不猜别名或取能力全集。
  const inheritedLevels: ThinkingLevel[] = candidates.length
    ? thinkingLevels.filter(level => candidates.every((item, index) => supported[index]!.includes(level)
      && wireValue(item, level) === wireValue(candidates[0]!, level)))
    // ACT: 目录未知不等于禁用，保留旧版低中高；额外档位由模型显式声明。
    : [...defaultThinkingLevels];
  const reasoningLevels = efforts === false ? [] : efforts
    ? thinkingLevels.filter(level => Object.hasOwn(efforts, level))
    : inheritedLevels;
  const reasoning = reasoningLevels.length > 0;
  const thinkingLevelMap: ThinkingLevelMap = {};
  for (const level of thinkingLevels) {
    if (!reasoningLevels.includes(level)) { thinkingLevelMap[level] = null; continue; }
    const wire = efforts ? efforts[level] : candidates[0] ? wireValue(candidates[0], level) : level;
    if (wire != null) thinkingLevelMap[level] = wire;
  }
  // ACT: 显式接口值声明使用 Anthropic effort 协议，避免 SDK 将映射值改为 token 预算。
  const compat = protocol === "anthropic-messages" && efforts
    ? { ...base?.compat, forceAdaptiveThinking: true, supportsMidConvoEffort: false }
    : base?.compat;
  return { reasoning, thinkingLevelMap, reasoningLevels, compat };
}

export function getModelLimits(providerId: string, model: z.infer<typeof providerSchema>["models"][number]) {
  const limits = findModelContextLimits(model.id);
  if (limits) return { contextWindow: limits.contextWindow, maxTokens: limits.maxTokens };
  if (model.contextWindow != null && model.maxOutputTokens != null) {
    return { contextWindow: model.contextWindow, maxTokens: model.maxOutputTokens };
  }
  const matches = builtinModels.filter(item => item.id === model.id);
  const exact = matches.find(item => item.provider === providerId);
  const candidates = exact ? [exact] : matches;
  // ACT: 只精确匹配 ID；跨供应商同名参数逐项一致才采用，不猜别名。
  const contextWindow = candidates.every(item => item.contextWindow === candidates[0]?.contextWindow) ? candidates[0]?.contextWindow : undefined;
  const maxTokens = candidates.every(item => item.maxTokens === candidates[0]?.maxTokens) ? candidates[0]?.maxTokens : undefined;
  return {
    contextWindow: model.contextWindow ?? contextWindow ?? 262144,
    maxTokens: model.maxOutputTokens ?? maxTokens ?? 32768,
  };
}
