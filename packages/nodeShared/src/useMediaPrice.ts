import { computed, inject, onScopeDispose, ref, shallowRef, toValue, watch, type MaybeRefOrGetter } from "vue";
import { getMediaPriceKey, subscribeNodeModels, type NodeMediaPrice, type NodeMediaPriceRequest, type useNodeAi } from "@toonflow/nodes-scaffold/nodeAi";

type MediaPriceState = { supported: boolean; loading: boolean; price: NodeMediaPrice | null; error: string };
export type MediaQuote = ReturnType<typeof useMediaPrice>;

export function useMediaPrice(
  ai: Pick<ReturnType<typeof useNodeAi>, "getMediaPrice">,
  mediaType: MaybeRefOrGetter<NodeMediaPriceRequest["mediaType"]>,
  getInput: () => Omit<NodeMediaPriceRequest, "directory" | "mediaType"> | undefined,
  isSupported: () => boolean,
) {
  const getDirectory = inject<(() => string) | undefined>("workspaceDirectory", undefined);
  const remindersEnabled = inject<(providerId: string) => boolean>("mediaCostReminderEnabled", () => true);
  const visible = ref(false);
  const revision = ref(0);
  const state = shallowRef<MediaPriceState>({ supported: false, loading: false, price: null, error: "" });
  const blocked = computed(() => state.value.loading && remindersEnabled(getInput()?.providerId ?? ""));
  let current: { key: string; start: () => void } | undefined;

  onScopeDispose(subscribeNodeModels(type => { if (type === "media") revision.value++; }));
  const requestKey = computed(() => {
    if (!visible.value) return;
    const input = getInput();
    if (!input) return;
    let directory: string | undefined;
    try { directory = getDirectory?.(); } catch { /* 工作区关闭时由价签显示失败。 */ }
    return getMediaPriceKey({ ...input, mediaType: toValue(mediaType), directory: directory ?? "" });
  });
  watch([requestKey, isSupported, revision], ([key, supported], _previous, onCleanup) => {
    current = undefined;
    const request: NodeMediaPriceRequest | undefined = key && supported
      ? { ...JSON.parse(key), outputDirectory: getInput()!.outputDirectory } : undefined;
    state.value = { supported, loading: !!request?.directory, price: null, error: request && !request.directory ? "请先选择工作目录" : "" };
    if (!key || !request?.directory) return;
    const controller = new AbortController();
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      void ai.getMediaPrice(request, controller.signal).then(price => {
        if (!controller.signal.aborted) state.value = { supported, loading: false, price, error: "" };
      }, failure => {
        if (!controller.signal.aborted) state.value = { supported, loading: false, price: null, error: failure instanceof Error ? failure.message : "价格查询失败" };
      });
    };
    current = { key, start };
    // 仅在价签挂载后查询；连续编辑共享防抖，按钮从参数改变时起等待这一份报价。
    const timer = setTimeout(start, 800);
    onCleanup(() => { clearTimeout(timer); controller.abort(); });
  }, { immediate: true, flush: "sync" });

  async function getQuote(request: NodeMediaPriceRequest, signal: AbortSignal) {
    signal.throwIfAborted();
    const input = getInput();
    if (input?.providerId === request.providerId && input.modelId === request.modelId && !isSupported()) return null;
    if (current?.key === getMediaPriceKey(request)) {
      if (!state.value.loading) return state.value.price;
      // 工具也可触发生成；若仍在防抖中，立即开始，由节点 AI 复用同一个进行中的请求。
      current.start();
    }
    return ai.getMediaPrice(request, signal);
  }

  return { state, blocked, visible, getQuote };
}
