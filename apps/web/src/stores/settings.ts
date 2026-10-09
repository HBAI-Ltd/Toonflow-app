import axios from "axios";
import { normalizeLocale } from "@toonflow/i18n";
import { computed, nextTick, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { invalidateNodeModels } from "@toonflow/nodes-scaffold/nodeAi";
import { canvasShortcutFields, defaultCanvasShortcuts, getShortcutBindings, isShortcutAllowed, normalizeShortcut, type CanvasShortcuts } from "@/lib/canvasShortcuts";
import "element-plus/es/components/message/style/css";

export const settings = ref<Record<string, unknown>>({});
// ACT: 页面在 loadSettings 完成后才挂载，加载标记仅保留在设置初始化与自动保存内部。
let settingsReady = false;
let saveQueue = Promise.resolve();
let applyingSettings = false;

export const settingsStorage = {
  getItem(key: string) {
    const stores = settings.value.stores as Record<string, unknown> | undefined;
    if (stores && Object.hasOwn(stores, key)) return JSON.stringify(stores[key]);
    // ACT: 只迁移当前来源可读取的旧缓存，保留原值；不同端口的 localStorage 不能互读。
    const value = localStorage.getItem(key);
    if (value !== null) settingsStorage.setItem(key, value);
    return value;
  },
  setItem(key: string, value: string) {
    settings.value.stores = { ...(settings.value.stores as Record<string, unknown> | undefined), [key]: JSON.parse(value) };
  },
};

export const defaultUiSettings = { theme: "light", language: "system", primaryColor: "#409eff", fontScale: 100, mobileScale: 75, radius: 8, startupAnimation: true };
export const uiSettings = computed(() => {
  const raw = settings.value.ui;
  const ui = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  return {
    language: normalizeLocale(ui.language) ?? "system" as const,
    theme: ui.theme === "dark" || ui.theme === "system" ? ui.theme : "light",
    primaryColor: typeof ui.primaryColor === "string" && /^#[\da-f]{6}$/i.test(ui.primaryColor) ? ui.primaryColor : defaultUiSettings.primaryColor,
    fontScale: typeof ui.fontScale === "number" && Number.isFinite(ui.fontScale) ? Math.min(125, Math.max(85, ui.fontScale)) : defaultUiSettings.fontScale,
    mobileScale: typeof ui.mobileScale === "number" && Number.isFinite(ui.mobileScale) ? Math.min(100, Math.max(50, ui.mobileScale)) : defaultUiSettings.mobileScale,
    radius: typeof ui.radius === "number" && Number.isFinite(ui.radius) ? Math.min(16, Math.max(0, ui.radius)) : defaultUiSettings.radius,
    startupAnimation: ui.startupAnimation !== false,
  };
});

export function updateUiSettings(patch: Partial<typeof defaultUiSettings>) {
  const current = settings.value.ui;
  settings.value = { ...settings.value, ui: { ...(current && typeof current === "object" && !Array.isArray(current) ? current : {}), ...patch } };
}

export const generalSettings = computed(() => {
  const raw = settings.value.general;
  const general = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const shortcuts = general.canvasShortcuts && typeof general.canvasShortcuts === "object" && !Array.isArray(general.canvasShortcuts)
    ? general.canvasShortcuts as Record<string, unknown> : {};
  const savedBindings = new Map(canvasShortcutFields.flatMap(field => {
    const value = shortcuts[field.id];
    const binding = typeof value === "string" ? normalizeShortcut(value) : undefined;
    return binding !== undefined && isShortcutAllowed(field, binding) ? [[field.id, binding] as const] : [];
  }));
  return {
    canvasCompositingEnabled: general.canvasCompositingEnabled === true,
    canvasEdgeAnimationEnabled: general.canvasEdgeAnimationEnabled !== false,
    canvasEdgeColorMode: general.canvasEdgeColorMode === "none" || general.canvasEdgeColorMode === "custom" ? general.canvasEdgeColorMode : "theme",
    canvasEdgeColor: typeof general.canvasEdgeColor === "string" && /^#[\da-f]{6}$/i.test(general.canvasEdgeColor) ? general.canvasEdgeColor : defaultUiSettings.primaryColor,
    canvasShortcuts: Object.fromEntries(canvasShortcutFields.map(field => {
      if (savedBindings.has(field.id)) return [field.id, savedBindings.get(field.id)];
      const binding = defaultCanvasShortcuts[field.id];
      const conflicts = canvasShortcutFields.some(other => other.gesture === field.gesture
        && getShortcutBindings(savedBindings.get(other.id) ?? "").some(value => getShortcutBindings(binding).includes(value)));
      return [field.id, conflicts ? "" : binding];
    })) as CanvasShortcuts,
  };
});

export function updateGeneralSettings(patch: Partial<typeof generalSettings.value>) {
  const current = settings.value.general;
  settings.value = { ...settings.value, general: { ...(current && typeof current === "object" && !Array.isArray(current) ? current : {}), ...patch } };
}

export const privacySettings = computed(() => {
  const raw = settings.value.privacy;
  const privacy = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  return {
    dataCollectionEnabled: privacy.dataCollectionEnabled !== false,
    anonymousId: typeof privacy.anonymousId === "string" ? privacy.anonymousId : "",
  };
});

export type CustomProviderModel = { id: string; label: string; contextWindow?: number; maxOutputTokens?: number };
export type CustomProvider = { id: string; label: string; icon?: string; version?: string; apiUrl: string; apiKey: string; protocol: string; models: CustomProviderModel[] };
export const customProviders = computed<CustomProvider[]>(() => Array.isArray(settings.value.customProviders)
  ? settings.value.customProviders.filter((item): item is CustomProvider => !!item && typeof item.id === "string" && typeof item.label === "string" && Array.isArray(item.models)
    && item.models.every((model: CustomProviderModel) => !!model && typeof model.id === "string" && typeof model.label === "string"))
  : []);

export const modelChoices = computed(() => customProviders.value.flatMap(provider => provider.models.map(model => ({
  value: JSON.stringify([provider.id, model.id]), providerId: provider.id, modelId: model.id, label: model.label, contextWindow: model.contextWindow,
}))));

export async function loadSettings() {
  if (settingsReady) return;
  const { data } = await axios.get("/api/settings/get", { headers: { "Cache-Control": "no-cache", "x-toonflow-workspace": "1" } });
  if (settingsReady) return;
  if (data.code !== 200 || !data.data || typeof data.data !== "object" || Array.isArray(data.data)) {
    throw new Error("读取设置失败");
  }
  settings.value = data.data;
  // 等初始化引发的监听执行完，再允许自动保存。
  await nextTick();
  settingsReady = true;
}

export function saveSettings(update?: (current: Record<string, unknown>) => Record<string, unknown> | undefined) {
  // ACT: 队列内读取最新配置再计算变更，确认成功后发布；仅协调当前页面的保存。
  const saving = saveQueue.then(async () => {
    const patch = update?.(settings.value);
    if (update && !patch) return false;
    const { data } = await axios.put<{ code: number; data: { customProviders?: CustomProvider[]; mediaProvider?: { id: string }; modelRefreshErrors?: string[] } | null }>(
      "/api/settings/save", { settings: { ...settings.value, ...patch } }, { headers: { "x-toonflow-workspace": "1" } },
    );
    if (data.code !== 200) throw new Error("保存设置失败");
    const providers = data.data?.customProviders;
    if ((patch && Object.hasOwn(patch, "customProviders")) || providers) invalidateNodeModels("language");
    if (patch || providers) {
      applyingSettings = true;
      try { settings.value = { ...settings.value, ...patch, ...(providers ? { customProviders: providers } : {}) }; }
      finally { applyingSettings = false; }
    }
    if (data.data?.mediaProvider) {
      invalidateNodeModels("media");
      window.dispatchEvent(new CustomEvent("toonflow:plugin-installed", { detail: { type: "provider", name: data.data.mediaProvider.id } }));
    }
    if (data.data?.modelRefreshErrors?.length) ElMessage.warning(`API Key 已保存，部分模型获取失败：${data.data.modelRefreshErrors.join("；")}`);
    return true;
  });
  saveQueue = saving.then(() => {}, () => {});
  return saving;
}

watch(settings, () => {
  if (!settingsReady || applyingSettings) return;
  void saveSettings().catch(() => { ElMessage.error("设置保存失败，请稍后重试"); });
}, { deep: true, flush: "sync" });
