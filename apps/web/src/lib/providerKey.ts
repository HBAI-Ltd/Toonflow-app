import axios from "axios";
import tfRouter from "@toonflow/providers/language/tfRouter";
import tfRouterMedia from "@toonflow/providers/media/tfRouter";
import { customProviders, saveSettings, settings, type CustomProvider, type CustomProviderModel } from "@/stores/settings";

const mediaModelIds = new Set(tfRouterMedia.models.map(model => model.id.toLowerCase()));

export function getProviderApiKey() {
  const provider = customProviders.value.find(item => item.id.toLowerCase() === tfRouter.id.toLowerCase());
  if (typeof provider?.apiKey === "string" && provider.apiKey.trim()) return provider.apiKey.trim();
  const configs = settings.value.mediaProviderConfigs as Record<string, { apiKey?: unknown }> | undefined;
  const apiKey = configs?.[tfRouter.id]?.apiKey;
  return typeof apiKey === "string" ? apiKey.trim() : "";
}

export async function saveProviderApiKey(apiKey: string) {
  const key = apiKey.trim();
  if (!key) throw new Error("请填写 API Key");
  await saveSettings(current => {
    const providers = Array.isArray(current.customProviders) ? current.customProviders as CustomProvider[] : [];
    const index = providers.findIndex(item => typeof item?.id === "string" && item.id.toLowerCase() === tfRouter.id.toLowerCase());
    const previous = providers[index];
    const provider: CustomProvider = {
      ...previous,
      id: tfRouter.id,
      label: tfRouter.label,
      version: tfRouter.version,
      apiUrl: tfRouter.apiUrl,
      protocol: tfRouter.protocol,
      apiKey: key,
      models: previous?.models ?? [],
    };
    const rawConfigs = current.mediaProviderConfigs;
    const configs = rawConfigs && typeof rawConfigs === "object" && !Array.isArray(rawConfigs) ? rawConfigs as Record<string, unknown> : {};
    const existing = configs[tfRouter.id];
    const config = existing && typeof existing === "object" && !Array.isArray(existing) ? existing as Record<string, unknown> : {};
    return {
      customProviders: index < 0 ? [...providers, provider] : providers.map((item, position) => position === index ? provider : item),
      mediaProviderConfigs: { ...configs, [tfRouter.id]: { ...config, apiKey: key } },
    };
  });
}

export async function fetchProviderModels(apiKey: string) {
  try {
    const { data } = await axios.post<{ code: number; data: CustomProviderModel[]; message?: string }>("/api/providers/models", {
      apiUrl: tfRouter.apiUrl, protocol: tfRouter.protocol, apiKey,
    }, { timeout: 35000 });
    if (data.code !== 200 || !Array.isArray(data.data)) throw new Error(data.message || "获取模型列表失败");
    return data.data.filter(model => !mediaModelIds.has(model.id.toLowerCase()));
  } catch (error) {
    throw new Error(axios.isAxiosError<{ message?: string }>(error)
      ? error.response?.data?.message || error.message
      : error instanceof Error ? error.message : "获取模型列表失败，请重试");
  }
}
