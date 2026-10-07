import axios from "axios";
import { computed, ref, shallowRef, watch } from "vue";
import type { updateSnapshot } from "@toonflow/server/desktop";
import { settings } from "@/stores/settings";

export const desktopUpdateCustomUrl = computed(() => typeof settings.value.desktopUpdateCustomUrl === "string" ? settings.value.desktopUpdateCustomUrl : "");
export const desktopUpdateSource = computed(() => settings.value.desktopUpdateSource === "custom" && desktopUpdateCustomUrl.value ? "custom"
  : settings.value.desktopUpdateSource === "github" ? "github" : "official");
export const desktopUpdateKey = computed(() => desktopUpdateSource.value === "custom" ? `custom:${desktopUpdateCustomUrl.value}` : desktopUpdateSource.value);
export const desktopUpdateSnapshot = shallowRef<updateSnapshot | null>(null);
export const desktopUpdateAction = ref<"read" | "check" | "download" | "apply" | null>(null);
export const desktopUpdateChecking = computed(() => desktopUpdateAction.value === "check");
export const desktopUpdateError = ref("");
export const hasDesktopUpdate = computed(() => desktopUpdateSnapshot.value?.channel !== "dev"
  && !!(desktopUpdateSnapshot.value?.updateAvailable || desktopUpdateSnapshot.value?.updateReady));

watch(desktopUpdateKey, () => {
  if (desktopUpdateSnapshot.value) desktopUpdateSnapshot.value = {
    ...desktopUpdateSnapshot.value, latestVersion: "", latestHash: "", error: "", updateAvailable: false, updateReady: false, updateProgress: undefined,
  };
  desktopUpdateError.value = "";
}, { flush: "sync" });

let pendingUpdate: Promise<updateSnapshot> | undefined;
let updateController: AbortController | undefined;

function getUpdateError(error: unknown) {
  return axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || error.message : String(error);
}

function publishUpdate(snapshot: updateSnapshot, source: string) {
  desktopUpdateSnapshot.value = desktopUpdateKey.value === source ? snapshot : {
    ...snapshot, latestVersion: "", latestHash: "", error: snapshot.installFailure?.message || "", updateAvailable: false, updateReady: false, updateProgress: undefined,
  };
  desktopUpdateError.value = desktopUpdateSnapshot.value.error;
  return snapshot;
}

function waitForUpdateRead(signal: AbortSignal) {
  signal.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const cancel = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", cancel); resolve(); }, 1500);
    signal.addEventListener("abort", cancel, { once: true });
  });
}

async function readUpdate(source: string, signal: AbortSignal, attempts = 3, timeout = 10000): Promise<updateSnapshot> {
  for (let attempt = 1; ; attempt++) {
    try {
      const { data } = await axios.get<{ data: updateSnapshot }>("/api/desktop/update", { signal, timeout });
      signal.throwIfAborted();
      return publishUpdate(data.data, source);
    } catch (error) {
      if (signal.aborted || attempt >= attempts) throw error;
      await waitForUpdateRead(signal);
    }
  }
}

async function observeDownloadProgress(source: string, signal: AbortSignal) {
  while (!signal.aborted) {
    try {
      await waitForUpdateRead(signal);
      await readUpdate(source, signal, 1);
    } catch {
      // ACT: 下载请求负责最终结果；进度查询短暂失败只等下一次读取，不重发下载。
    }
  }
}

async function observeUpdate(snapshot: updateSnapshot, source: string, signal: AbortSignal) {
  // ACT: 仅重复读取状态，最多观察三分钟；短暂断连不代表宿主已成功退出，不重发更新请求。
  const deadline = performance.now() + 180000;
  while (snapshot.updating && !snapshot.installFailure) {
    if (performance.now() >= deadline) throw new Error("暂时无法确认更新结果，请稍后重新读取状态，或重新打开客户端。");
    await waitForUpdateRead(signal);
    if (performance.now() >= deadline) continue;
    try { snapshot = await readUpdate(source, signal, 1, Math.max(1, Math.min(10000, deadline - performance.now()))); }
    catch (error) { if (signal.aborted) throw error; }
  }
  return snapshot;
}

export function stopDesktopUpdateObservation() {
  updateController?.abort();
}

export function checkDesktopUpdate(readFirst = false) {
  return runDesktopUpdate("check", readFirst);
}

export function runDesktopUpdate(nextAction: NonNullable<typeof desktopUpdateAction.value>, readFirst = false) {
  if (pendingUpdate) return pendingUpdate;
  // 上轮观察超时后只能重新读取，不能因客户端没有收到结果而再次提交安装。
  if (desktopUpdateSnapshot.value?.updating) nextAction = "read";
  const source = desktopUpdateKey.value;
  const controller = new AbortController();
  updateController = controller;
  desktopUpdateAction.value = nextAction;
  desktopUpdateError.value = "";
  pendingUpdate = (async () => {
    if (nextAction === "read" || readFirst) {
      const snapshot = await readUpdate(source, controller.signal);
      if (nextAction === "read" || desktopUpdateKey.value !== source || snapshot.channel === "dev" || snapshot.updating
        || snapshot.updateAvailable || snapshot.updateReady || snapshot.installFailure)
        return observeUpdate(snapshot, source, controller.signal);
    }
    let snapshot: updateSnapshot;
    if ((nextAction === "download" || nextAction === "apply") && desktopUpdateSnapshot.value)
      desktopUpdateSnapshot.value = { ...desktopUpdateSnapshot.value, updating: true, updateProgress: undefined };
    const progressController = nextAction === "download" ? new AbortController() : undefined;
    const progressTask = progressController && observeDownloadProgress(source, AbortSignal.any([controller.signal, progressController.signal]));
    try {
      const { data } = await axios.post<{ data: updateSnapshot }>(`/api/desktop/update/${nextAction}`, null, {
        headers: { "x-toonflow-desktop": "1" }, signal: controller.signal,
        timeout: nextAction === "check" ? 45000 : nextAction === "apply" ? 180000 : 0,
      }).finally(async () => {
        progressController?.abort();
        await progressTask;
      });
      controller.signal.throwIfAborted();
      snapshot = publishUpdate(data.data, source);
    } catch (error) {
      if (controller.signal.aborted) throw error;
      // POST 断连也可能已经交接，只读回查；请求随 App 存活，不随关于页卸载而取消。
      try { snapshot = await readUpdate(source, controller.signal); }
      catch (readError) {
        if (!desktopUpdateSnapshot.value?.updating || controller.signal.aborted) throw readError;
        return observeUpdate(desktopUpdateSnapshot.value, source, controller.signal);
      }
      if (!snapshot.updating && !snapshot.error && !snapshot.installFailure) throw error;
    }
    return observeUpdate(snapshot, source, controller.signal);
  })().catch(error => {
    // 切源后丢弃旧源的检查错误，已经交接或核验失败的安装结果仍需显示。
    if (!controller.signal.aborted && (nextAction !== "check" || desktopUpdateKey.value === source
      || desktopUpdateSnapshot.value?.updating || desktopUpdateSnapshot.value?.installFailure))
      desktopUpdateError.value = desktopUpdateSnapshot.value?.installFailure?.message || getUpdateError(error);
    throw error;
  }).finally(() => {
    pendingUpdate = undefined;
    updateController = undefined;
    desktopUpdateAction.value = null;
  });
  return pendingUpdate;
}
