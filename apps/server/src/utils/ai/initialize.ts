import tfRouter from "@toonflow/providers/language/tfRouter";
import tfRouterMedia from "@toonflow/providers/media/tfRouter";
import conf from "@/utils/conf";
import { fetchProviderModels } from "@/utils/ai/models";
import { getMediaProviderApiKey, refreshMediaProviderModels } from "@/utils/media/provider";

let initialization: Promise<void> | undefined;

async function refreshLanguageModels() {
  const providers = conf.get("settings.customProviders");
  if (!Array.isArray(providers)) return;
  const provider = providers.find(item => typeof item?.id === "string" && item.id.toLowerCase() === tfRouter.id.toLowerCase()
    && typeof item.apiUrl === "string" && URL.canParse(item.apiUrl) && new URL(item.apiUrl).origin === new URL(tfRouter.apiUrl).origin);
  const apiKey = typeof provider?.apiKey === "string" ? provider.apiKey.trim().replace(/^Bearer(?:\s+|$)/i, "").trim() : "";
  if (!apiKey) return;
  const models = await fetchProviderModels({ apiUrl: provider.apiUrl, protocol: provider.protocol, apiKey });
  if (!models.length) throw new Error("未获取到文本模型，保留原有列表");
  const current = conf.get("settings.customProviders");
  if (!Array.isArray(current)) return;
  conf.set("settings.customProviders", current.map(item => item?.id === provider.id && item.apiUrl === provider.apiUrl
    && item.protocol === provider.protocol && item.apiKey === provider.apiKey ? { ...item, models } : item));
}

async function refreshVideoModels() {
  if (!getMediaProviderApiKey(tfRouterMedia.id)) return;
  await refreshMediaProviderModels(`${tfRouterMedia.id}.ts`);
}

export default function initializeProviderModels() {
  // ACT: 每个进程启动时仅尝试一次；失败保留已有模型，下次启动再更新。
  return initialization ??= Promise.allSettled([refreshLanguageModels(), refreshVideoModels()]).then(results => {
    results.forEach((result, index) => {
      if (result.status === "rejected") console.warn(`TF-Router ${index === 0 ? "文本" : "视频"}模型启动更新失败：`,
        result.reason instanceof Error ? result.reason.message : "未知错误");
    });
  });
}
