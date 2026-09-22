import axios from "axios";
import { computed, ref, shallowRef } from "vue";
import type { updateSnapshot } from "@toonflow/server/desktop";

export const desktopUpdateSnapshot = shallowRef<updateSnapshot | null>(null);
export const desktopUpdateChecking = ref(false);
export const desktopUpdateError = ref("");
export const hasDesktopUpdate = computed(() => desktopUpdateSnapshot.value?.channel !== "dev"
  && !!(desktopUpdateSnapshot.value?.updateAvailable || desktopUpdateSnapshot.value?.updateReady));

let pendingCheck: Promise<updateSnapshot> | undefined;

export function checkDesktopUpdate(readFirst = false) {
  if (pendingCheck) return pendingCheck;
  desktopUpdateChecking.value = true;
  desktopUpdateError.value = "";
  pendingCheck = (async () => {
    if (readFirst) {
      const { data } = await axios.get<{ data: updateSnapshot }>("/api/desktop/update", { timeout: 10000 });
      desktopUpdateSnapshot.value = data.data;
      desktopUpdateError.value = data.data.error;
      if (data.data.channel === "dev" || data.data.updating || data.data.updateAvailable || data.data.updateReady) return data.data;
    }
    const { data } = await axios.post<{ data: updateSnapshot }>("/api/desktop/update/check", null, {
      headers: { "x-toonflow-desktop": "1" }, timeout: 45000,
    });
    desktopUpdateSnapshot.value = data.data;
    desktopUpdateError.value = data.data.error;
    return data.data;
  })().catch(error => {
    desktopUpdateError.value = axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || error.message : String(error);
    throw error;
  }).finally(() => {
    pendingCheck = undefined;
    desktopUpdateChecking.value = false;
  });
  return pendingCheck;
}
