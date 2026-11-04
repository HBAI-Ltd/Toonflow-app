import { z } from "zod";
import { t } from "@/lib/i18n";
import u from "@/utils";
import type { Plugin, PluginsParams } from "@/utils/channel/types";

export const searchPluginMarketSchema = z.strictObject({
  searchKeyword: z.string().trim().max(1000).optional(),
  type: z.enum(["all", "node", "tool", "skill", "ext", "agent"]).default("all"),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(50).default(20),
});
export const installMarketPluginSchema = z.strictObject({ id: z.number().int().positive() });

function pluginDetails(item: Plugin) {
  return Object.freeze({
    id: item.id, type: item.type, identifier: item.identifier.trim(), name: item.name.trim() || item.identifier.trim(),
    version: item.version?.trim() || undefined, supplier: item.supplier?.trim() || undefined,
    desc: item.desc?.slice(0, 1000), fileName: item.fileName?.trim() || "", installable: item.type !== "agent",
  });
}

type MarketPlugin = ReturnType<typeof pluginDetails>;
// ACT: 市场仅提供分页搜索。保留最近 500 个结果十分钟，用原查询复核选中的发布记录。
const recentPlugins = new Map<number, MarketPlugin>();
const sources = new WeakMap<MarketPlugin, { query: PluginsParams; token: string; link: string; expiresAt: number }>();

async function queryMarket(query: PluginsParams, token: string, signal?: AbortSignal) {
  signal?.throwIfAborted();
  if (!token || u.ai.getAccountToken() !== token) throw new Error(t`账号已变更或未登录，请重新登录`);
  const result = await u.channel.getChannel().getPlugins(query, { token, signal });
  signal?.throwIfAborted();
  if (u.ai.getAccountToken() !== token) throw new Error(t`账号已变更，请刷新后重试`);
  return result;
}

export async function searchPluginMarket(input: unknown, signal?: AbortSignal) {
  const query = searchPluginMarketSchema.parse(input);
  const token = u.ai.getAccountToken();
  const { list, total } = await queryMarket(query, token, signal);
  const expiresAt = Date.now() + 10 * 60_000;
  const results = list.filter(item => item.state === 1 && item.fileName && item.link).map(item => {
    const plugin = pluginDetails(item);
    sources.set(plugin, { query, token, link: item.link!, expiresAt });
    recentPlugins.delete(plugin.id);
    recentPlugins.set(plugin.id, plugin);
    return plugin;
  });
  while (recentPlugins.size > 500) recentPlugins.delete(recentPlugins.keys().next().value!);
  return { list: results, total, page: query.page, limit: query.limit };
}

function selectedSource(plugin: MarketPlugin) {
  const source = sources.get(plugin);
  if (!source || source.expiresAt <= Date.now()) throw new Error(t`分页已失效，请重新搜索`);
  if (source.token !== u.ai.getAccountToken()) throw new Error(t`账号已变更，请刷新后重试`);
  return source;
}

export function resolveMarketPlugin(input: unknown, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const { id } = installMarketPluginSchema.parse(input);
  const plugin = recentPlugins.get(id);
  if (!plugin) throw new Error(t`分页已失效，请重新搜索`);
  selectedSource(plugin);
  if (!plugin.installable) throw new Error(t`Agent 功能处于测试阶段，暂未开放安装`);
  return plugin;
}

function artifactAddress(link: string) {
  const url = URL.parse(link);
  if (!url) throw new Error(t`下载地址格式无效，请提供完整的 HTTP / HTTPS 文件地址`);
  // ACT: 市场 TOS 临时签名会刷新。只忽略鉴权参数，保留对象路径、versionId 和其他内容选择参数。
  if (url.hostname.endsWith(".volces.com") && url.searchParams.has("X-Tos-Signature")) {
    for (const key of ["X-Tos-Date", "X-Tos-Expires", "X-Tos-Credential", "X-Tos-Signature", "X-Tos-Security-Token"]) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
  return url.href;
}

export async function installMarketPlugin(plugin: MarketPlugin, signal?: AbortSignal) {
  if (plugin.type === "agent") throw new Error(t`Agent 功能处于测试阶段，暂未开放安装`);
  const source = selectedSource(plugin);
  const { list } = await queryMarket(source.query, source.token, signal);
  const item = list.find(item => item.id === plugin.id && item.state === 1);
  if (!item?.link || !item.fileName) throw new Error(t`分页已失效，请重新搜索`);
  const current = pluginDetails(item);
  if (current.type !== plugin.type || current.identifier !== plugin.identifier || current.version !== plugin.version
    || current.name !== plugin.name || current.supplier !== plugin.supplier || current.fileName !== plugin.fileName
    || artifactAddress(item.link) !== artifactAddress(source.link)) {
    throw new Error(t`分页已失效，请重新搜索`);
  }
  const account = new AbortController();
  const unsubscribe = u.conf.onDidChange("settings.toonflowAccount.token", () => {
    if (u.ai.getAccountToken() !== source.token) account.abort(new Error(t`账号已变更，请刷新后重试`));
  });
  try {
    selectedSource(plugin);
    const installSignal = signal ? AbortSignal.any([signal, account.signal]) : account.signal;
    const { name } = await u.pluginInstall.installRemotePlugin(plugin.type, item.link, plugin.fileName, false, plugin.version, installSignal);
    return { type: plugin.type, name };
  } finally { unsubscribe(); }
}
