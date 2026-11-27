import { computed, ref, shallowReactive, shallowRef, watch } from "vue";
import { locale, translate } from "@toonflow/i18n/vue";
import { EventSourceParserStream } from "eventsource-parser/stream";
import type { LocalModelItem, LocalModelsStatus } from "@toonflow/server/localModels";
import http from "@/lib/http";

export function modelTitle(item: LocalModelItem) {
  const title = item.displayName ?? item.name;
  return item.owner ? title : translate(title);
}

export function formatModelSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MiB` : `${Math.ceil(bytes / 1024)} KiB`;
}

type ModelProgress = NonNullable<LocalModelItem["progress"]>;
const submissions = shallowReactive(new Map<string, ModelProgress>());

export function installPhaseLabel(progress?: ModelProgress) {
  switch (progress?.phase) {
    case "downloading": return translate("正在下载");
    case "importing": return translate("正在导入");
    case "verifying": return translate("正在校验");
    default: return translate("正在安装");
  }
}

export function getModelSource(item: LocalModelItem, sourceId?: string) {
  return item.sources.find(source => source.id === sourceId) ?? item.sources[0];
}

export async function installModelAsset(item: LocalModelItem, input: string | File) {
  const download = typeof input === "string";
  if (submissions.has(item.id)) throw new Error(translate("正在安装此文件，请稍后再试"));
  submissions.set(item.id, { phase: download ? "downloading" : "importing", received: 0, total: item.size });
  try {
    await http({
      method: "POST", url: download ? "/api/localModels/download" : "/api/localModels/importFile",
      params: download ? undefined : { id: item.id },
      headers: download ? undefined : { "Content-Type": "application/octet-stream" },
      data: download ? { id: item.id, source: input } : input, timeout: 0,
    });
  } finally {
    submissions.delete(item.id);
  }
}

const status = shallowRef<LocalModelsStatus>();
const checking = ref(false);
const statusError = ref("");
let subscribers = 0;
let connection: AbortController | undefined;

async function refresh() {
  if (!subscribers) return;
  connection?.abort();
  const current = connection = new AbortController();
  const { signal } = current;
  checking.value = true;
  statusError.value = "";
  try {
    const response = await fetch("/api/localModels/status", {
      headers: { Accept: "text/event-stream", "Accept-Language": locale.value, "x-toonflow-workspace": "1" }, signal, cache: "no-store",
    });
    if (!response.ok || !response.body || !response.headers.get("Content-Type")?.includes("text/event-stream")) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.message || translate("检测失败"));
    }
    const reader = response.body.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream()).getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        signal.throwIfAborted();
        if (done) throw new Error(translate("请求失败，请检查网络连接"));
        const data = JSON.parse(value.data);
        if (value.event === "error") throw new Error(data.message || translate("检测失败"));
        if (value.event === "status") {
          status.value = data;
          checking.value = false;
        }
        if (value.event === "progress" && status.value) {
          status.value = { ...status.value, items: status.value.items.map(item =>
            item.id === data.id ? { ...item, installing: true, progress: data.progress } : item) };
        }
      }
    } finally {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
  } catch (error) {
    if (!signal.aborted) statusError.value = error instanceof Error ? error.message : translate("检测失败");
  } finally {
    if (connection === current) {
      checking.value = false;
      connection = undefined;
    }
  }
}

export function useModelCatalog(scope: () => unknown) {
  watch(() => !!scope(), (active, _, onCleanup) => {
    if (!active) return;
    if (++subscribers === 1) void refresh();
    onCleanup(() => {
      if (--subscribers) return;
      connection?.abort();
      status.value = undefined;
    });
  }, { immediate: true, flush: "sync" });
  const displayedStatus = computed(() => {
    const current = status.value;
    if (!current || !submissions.size) return current;
    return { ...current, items: current.items.map(item => {
      const submitted = submissions.get(item.id);
      return submitted && !item.progress ? { ...item, installing: true, progress: submitted } : item;
    }) };
  });
  return { status: displayedStatus, checking, statusError, refresh };
}
