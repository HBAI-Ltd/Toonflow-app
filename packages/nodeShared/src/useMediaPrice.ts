import { computed, inject, onScopeDispose, ref, shallowRef, toValue, watch, type MaybeRefOrGetter } from "vue";
import { getQuoteTotal } from "@toonflow/providers";
import { getMediaPriceKey, subscribeNodeModels, type NodeMediaPrice, type NodeMediaPriceRequest, type useNodeAi } from "@toonflow/nodes-scaffold/nodeAi";

type MediaPriceState = { supported: boolean; loading: boolean; price: NodeMediaPrice | null; error: string };
type MediaPriceInput = Omit<NodeMediaPriceRequest, "directory" | "mediaType">;
export type MediaQuote = ReturnType<typeof useMediaPrice>;

/** 批量任务合计报价；任一项无法得出总额时返回 null，与无报价一样由供应商结算。 */
export function sumMediaPrices(prices: readonly (NodeMediaPrice | null)[]): NodeMediaPrice | null {
  if (prices.length === 1) return prices[0] ?? null;
  const totals = prices.map(price => price ? price.totalAmount ?? getQuoteTotal(price.price, price.tips) : undefined);
  if (!totals.length || totals.some(total => total === undefined)) return null;
  const digits = Math.max(...totals.map(total => String(total).split(".")[1]?.length ?? 0));
  const totalAmount = Number(totals.reduce((sum, total) => sum! + total!, 0)!.toFixed(digits));
  // ACT: 合计沿用第一项的币种和前缀写法，只替换金额；各项明细放进提示。
  return {
    price: prices[0]!.price.replace(/\d[\d,]*(?:\.\d+)?/, String(totalAmount)),
    tips: prices.map((price, index) => `任务 ${index + 1}：${price!.price}`).join("\n"),
    totalAmount,
  };
}

export function useMediaPrice(
  ai: Pick<ReturnType<typeof useNodeAi>, "getMediaPrice">,
  mediaType: MaybeRefOrGetter<NodeMediaPriceRequest["mediaType"]>,
  getInput: () => MediaPriceInput | MediaPriceInput[] | undefined,
  isSupported: () => boolean,
) {
  const getDirectory = inject<(() => string) | undefined>("workspaceDirectory", undefined);
  const remindersEnabled = inject<(providerId: string) => boolean>("mediaCostReminderEnabled", () => true);
  const visible = ref(false);
  const revision = ref(0);
  const state = shallowRef<MediaPriceState>({ supported: false, loading: false, price: null, error: "" });
  const getInputs = () => [getInput() ?? []].flat();
  const blocked = computed(() => state.value.loading && remindersEnabled(getInputs()[0]?.providerId ?? ""));
  let current: { keys: string[]; start: () => void } | undefined;

  onScopeDispose(subscribeNodeModels(type => { if (type === "media") revision.value++; }));
  const requestKey = computed(() => {
    if (!visible.value) return;
    const inputs = getInputs();
    if (!inputs.length) return;
    let directory: string | undefined;
    try { directory = getDirectory?.(); } catch { /* 工作区关闭时由价签显示失败。 */ }
    return JSON.stringify(inputs.map(input => getMediaPriceKey({ ...input, mediaType: toValue(mediaType), directory: directory ?? "" } as NodeMediaPriceRequest)));
  });
  watch([requestKey, isSupported, revision], ([key, supported], _previous, onCleanup) => {
    current = undefined;
    const keys: string[] = key && supported ? JSON.parse(key) : [];
    const inputs = getInputs();
    const requests: NodeMediaPriceRequest[] = keys.map((item, index) => ({ ...JSON.parse(item), outputDirectory: inputs[index]!.outputDirectory }));
    const directory = requests[0]?.directory;
    state.value = { supported, loading: !!directory, price: null, error: requests.length && !directory ? "请先选择工作目录" : "" };
    if (!directory) return;
    const controller = new AbortController();
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      void Promise.all(requests.map(request => ai.getMediaPrice(request, controller.signal))).then(prices => {
        if (!controller.signal.aborted) state.value = { supported, loading: false, price: sumMediaPrices(prices), error: "" };
      }, failure => {
        if (!controller.signal.aborted) state.value = { supported, loading: false, price: null, error: failure instanceof Error ? failure.message : "价格查询失败" };
      });
    };
    current = { keys, start };
    // 仅在价签挂载后查询；连续编辑共享防抖，按钮从参数改变时起等待这一份报价。
    const timer = setTimeout(start, 800);
    onCleanup(() => { clearTimeout(timer); controller.abort(); });
  }, { immediate: true, flush: "sync" });

  async function getQuote(request: NodeMediaPriceRequest, signal: AbortSignal) {
    signal.throwIfAborted();
    const input = getInputs()[0];
    if (input?.providerId === request.providerId && input.modelId === request.modelId && !isSupported()) return null;
    if (current?.keys.length === 1 && current.keys[0] === getMediaPriceKey(request)) {
      if (!state.value.loading) return state.value.price;
      // 工具也可触发生成；若仍在防抖中，立即开始，由节点 AI 复用同一个进行中的请求。
      current.start();
    }
    return ai.getMediaPrice(request, signal);
  }

  return { state, blocked, visible, getQuote };
}
