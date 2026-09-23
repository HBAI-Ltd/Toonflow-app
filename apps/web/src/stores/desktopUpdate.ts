import axios from "axios";
import { computed, ref, shallowRef, watch } from "vue";
import type { updateSnapshot } from "@toonflow/server/desktop";
import { settings } from "@/stores/settings";

export const desktopUpdateCustomUrl = computed(() => typeof settings.value.desktopUpdateCustomUrl === "string" ? settings.value.desktopUpdateCustomUrl : "");
export const desktopUpdateSource = computed(() => settings.value.desktopUpdateSource === "custom" && desktopUpdateCustomUrl.value ? "custom"
  : settings.value.desktopUpdateSource === "github" ? "github" : "official");
export const desktopUpdateKey = computed(() => desktopUpdateSource.value === "custom" ? `custom:${desktopUpdateCustomUrl.value}` : desktopUpdateSource.value);
export const desktopUpdateSnapshot = shallowRef<updateSnapshot | null>(null);
export const desktopUpdateChecking = ref(false);
export const desktopUpdateError = ref("");
export const hasDesktopUpdate = computed(() => desktopUpdateSnapshot.value?.channel !== "dev"
  && !!(desktopUpdateSnapshot.value?.updateAvailable || desktopUpdateSnapshot.value?.updateReady));

watch(desktopUpdateKey, () => {
  if (desktopUpdateSnapshot.value) desktopUpdateSnapshot.value = {
    ...desktopUpdateSnapshot.value, latestVersion: "", latestHash: "", error: "", updateAvailable: false, updateReady: false,
  };
  desktopUpdateError.value = "";
}, { flush: "sync" });

let pendingCheck: Promise<updateSnapshot> | undefined;

export function checkDesktopUpdate(readFirst = false) {
  if (pendingCheck) return pendingCheck;
  const source = desktopUpdateKey.value;
  desktopUpdateChecking.value = true;
  desktopUpdateError.value = "";
  pendingCheck = (async () => {
    if (readFirst) {
      const { data } = await axios.get<{ data: updateSnapshot }>("/api/desktop/update", { timeout: 10000 });
      if (desktopUpdateKey.value !== source) return data.data;
      desktopUpdateSnapshot.value = data.data;
      desktopUpdateError.value = data.data.error;
      if (data.data.channel === "dev" || data.data.updating || data.data.updateAvailable || data.data.updateReady) return data.data;
    }
    const { data } = await axios.post<{ data: updateSnapshot }>("/api/desktop/update/check", null, {
      headers: { "x-toonflow-desktop": "1" }, timeout: 45000,
    });
    if (desktopUpdateKey.value !== source) return data.data;
    desktopUpdateSnapshot.value = data.data;
    desktopUpdateError.value = data.data.error;
    return data.data;
  })().catch(error => {
    if (desktopUpdateKey.value === source)
      desktopUpdateError.value = axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || error.message : String(error);
    throw error;
  }).finally(() => {
    pendingCheck = undefined;
    desktopUpdateChecking.value = false;
  });
  return pendingCheck;
}
