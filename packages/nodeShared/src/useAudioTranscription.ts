import { computed, inject, onScopeDispose, ref, toValue, watch, type MaybeRefOrGetter } from "vue";
import { useNode, useVueFlow } from "@vue-flow/core";
import { ElMessage } from "element-plus";
import { translate } from "@toonflow/i18n/vue";
import { useNodeAsr, type NodeMediaValue } from "@toonflow/nodes-scaffold/runtime";

export function useAudioTranscription(source: MaybeRefOrGetter<NodeMediaValue | undefined>) {
  const { node } = useNode();
  const { addNodes, findNode, getNodes, nodeTypes } = useVueFlow();
  const asr = useNodeAsr();
  const getCanvas = inject<(() => { id: string } | undefined) | undefined>("canvas", undefined);
  const getDirectory = inject<(() => string) | undefined>("workspaceDirectory", undefined);
  const directory = computed(() => {
    try { return getDirectory?.(); }
    catch { return undefined; }
  });
  const batchHistory = inject<(action: () => Promise<void>) => Promise<void>>("batchCanvasHistory", action => action());
  const processing = ref(false);
  let controller: AbortController | undefined;
  let job: Promise<void> | undefined;

  function cancel() { controller?.abort(); }
  watch(() => toValue(source)?.url, cancel, { flush: "sync" });
  watch(() => getCanvas?.()?.id, cancel, { flush: "sync" });
  watch(directory, cancel, { flush: "sync" });
  onScopeDispose(cancel);

  async function cancelAndWait() {
    cancel();
    await job;
  }

  function transcribe() {
    if (processing.value || !toValue(source)) return;
    job = run();
  }

  async function run() {
    const current = controller = new AbortController();
    const path = toValue(source)!.url;
    const canvasId = getCanvas?.()?.id;
    const sourceDirectory = directory.value;
    processing.value = true;
    try {
      if (!nodeTypes?.value?.["remote-textNode"]) throw new Error("请先启用文本节点插件");
      if (findNode(node.id) !== node) throw new Error("原节点已变化，请重新操作");
      const text = await asr.transcribe(path, { signal: current.signal });
      current.signal.throwIfAborted();
      if (!text.trim()) throw new Error("音频中未识别到文本");
      await batchHistory(async () => {
        current.signal.throwIfAborted();
        if (getCanvas?.()?.id !== canvasId || directory.value !== sourceDirectory || findNode(node.id) !== node || !nodeTypes?.value?.["remote-textNode"]) throw new Error("画布节点已变化，请重新转文本");
        const x = node.computedPosition.x + (node.dimensions.width || 360) + 80;
        const height = 360;
        let y = node.computedPosition.y;
        for (const other of [...getNodes.value].sort((left, right) => left.computedPosition.y - right.computedPosition.y)) {
          const position = other.computedPosition;
          if (position.x < x + 320 && position.x + (other.dimensions.width || 320) > x && position.y < y + height && position.y + (other.dimensions.height || 300) > y) y = position.y + (other.dimensions.height || 300) + 40;
        }
        addNodes({ id: crypto.randomUUID(), type: "remote-textNode", position: { x, y }, data: { label: `${node.data.label || translate("音频")} · ${translate("语音转文字")}`, outputs: { text: { dataType: "STRING", value: text } } } });
      });
    } catch (error) {
      if (!current.signal.aborted && !(error instanceof Error && error.name === "AbortError")) {
        console.warn("音频转文本未完成", error);
        ElMessage({ type: "warning", message: error instanceof Error ? error.message : "这次没能完成音频转文本，请稍后再试。原音频不受影响。", duration: 6000, showClose: true });
      }
    } finally {
      processing.value = false;
      controller = undefined;
    }
  }

  return { processing, transcribe, cancel, cancelAndWait };
}
