import tfRouter from "@toonflow/providers/language/tfRouter";
import tfRouterMedia from "@toonflow/providers/media/tfRouter";
import conf from "@/utils/conf";
import { fetchProviderModels } from "@/utils/ai/models";

let initialization: Promise<void> | undefined;

const mediaModelIds = new Set(tfRouterMedia.models.map(model => model.id.toLowerCase()));

function normalizeApiKey(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/^Bearer(?:\s+|$)/i, "").trim() : "";
}

function getLanguageProvider(settings: Record<string, unknown>) {
  const providers = settings.customProviders;
  if (!Array.isArray(providers)) return;
  return providers.find(item => typeof item?.id === "string" && item.id.toLowerCase() === tfRouter.id.toLowerCase()
    && typeof item.apiUrl === "string" && URL.canParse(item.apiUrl) && new URL(item.apiUrl).origin === new URL(tfRouter.apiUrl).origin);
}

async function refreshLanguageModels(previousSettings?: Record<string, unknown>) {
  const provider = getLanguageProvider(conf.get("settings", {}));
  const apiKey = normalizeApiKey(provider?.apiKey);
  if (!apiKey || (previousSettings && apiKey === normalizeApiKey(getLanguageProvider(previousSettings)?.apiKey))) return;
  // ACT: 平台同时返回媒体模型，文本链路仅保留用户自己添加的对话模型。
  const models = (await fetchProviderModels({ apiUrl: provider.apiUrl, protocol: provider.protocol, apiKey }))
    .filter(model => !mediaModelIds.has(model.id.toLowerCase()));
  if (!models.length) throw new Error("未获取到文本模型，保留原有列表");
  const current = conf.get("settings.customProviders");
  if (!Array.isArray(current)) return;
  const index = current.findIndex(item => item?.id === provider.id && item.apiUrl === provider.apiUrl
    && item.protocol === provider.protocol && item.apiKey === provider.apiKey);
  if (index === -1) return;
  const providers = current.map((item, itemIndex) => itemIndex === index ? { ...item, models } : item);
  conf.set("settings.customProviders", providers);
  return providers;
}

export async function refreshProviderModels(previousSettings?: Record<string, unknown>) {
  try {
    const customProviders = await refreshLanguageModels(previousSettings);
    return customProviders ? { customProviders } : {};
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return { modelRefreshErrors: [`影幻文本模型更新失败：${message}`] };
  }
}

export default function initializeProviderModels() {
  // ACT: 每个进程启动时仅尝试一次；失败保留已有模型，下次启动再更新。
  return initialization ??= refreshProviderModels().then(result => {
    result.modelRefreshErrors?.forEach(error => console.warn(error));
  });
}
