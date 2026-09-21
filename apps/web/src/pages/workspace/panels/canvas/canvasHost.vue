<template>
  <div class="canvasHost">
    <canvasPanel
      v-for="entry in entries"
      :key="entry.key"
      :ref="value => setInstance(entry.key, value)"
      class="canvasRuntime"
      :class="{ backgroundCanvas: entry.key !== activeKey }"
      :aria-hidden="entry.key !== activeKey"
      :inert="entry.key !== activeKey"
      :runtimeKey="entry.key"
      :initialCanvasId="entry.fileName"
      :active="active && entry.key === activeKey"
      :settingsVisible="settingsVisible"
      :activateCanvas="activateCanvas"
      :resolveCanvasContext="resolveCanvasContext"
      :flushCanvases="flushSave" />
  </div>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, provide, shallowReactive, shallowRef, ref, type ComponentPublicInstance } from "vue";
import type { CanvasContext } from "@toonflow/tool-canvas/runtime";
import { waitForControlValue } from "@/lib/mcpControl";
import canvasPanel from "./index.vue";

const props = withDefaults(defineProps<{ active?: boolean; settingsVisible?: boolean }>(), { active: true, settingsVisible: false });
type CanvasInstance = InstanceType<typeof canvasPanel>;
const entries = shallowRef<{ key: string; fileName?: string }[]>([{ key: crypto.randomUUID() }]);
const activeKey = ref(entries.value[0]!.key);
const instances = shallowReactive(new Map<string, CanvasInstance>());
const activeInstance = computed(() => instances.get(activeKey.value));
const canvasId = computed(() => activeInstance.value?.canvasId ?? "");
const canvasReady = computed(() => activeInstance.value?.canvasReady ?? false);
const lifetime = new AbortController();
provide("canvasList", shallowRef([]));
onScopeDispose(() => lifetime.abort(new Error("工作区已关闭")));

function setInstance(key: string, value: Element | ComponentPublicInstance | null) {
  if (value) instances.set(key, value as CanvasInstance);
  else instances.delete(key);
}

async function activateCanvas(fileName: string, signal?: AbortSignal) {
  const callSignal = AbortSignal.any([lifetime.signal, AbortSignal.timeout(120000), ...(signal ? [signal] : [])]);
  callSignal.throwIfAborted();
  const previousKey = activeKey.value;
  let entry = entries.value.find(item => instances.get(item.key)?.canvasId === fileName || (!instances.get(item.key)?.canvasId && item.fileName === fileName));
  if (!entry) {
    // ACT: 已打开的画布保留至退出工作区，避免卸载后台节点任务；大量画布时可按任务引用回收空闲实例。
    entry = { key: crypto.randomUUID(), fileName };
    entries.value = [...entries.value, entry];
  }
  activeKey.value = entry.key;
  const key = entry.key;
  try {
    const panel = await waitForControlValue(() => {
      const instance = instances.get(key);
      return instance?.canvasReady || instance?.loadError ? instance : undefined;
    }, callSignal);
    if (panel.loadError) throw new Error(panel.loadError);
  } catch (error) {
    if (activeKey.value === key) activeKey.value = previousKey;
    if (!instances.get(key)?.canvasId) entries.value = entries.value.filter(item => item.key !== key);
    throw error;
  }
}

function resolveCanvasContext(fileName: string): CanvasContext | undefined {
  return [...instances.values()].find(instance => instance.canvasId === fileName)?.getCanvasContext();
}

function getCanvasContext() {
  return props.active ? activeInstance.value?.getCanvasContext() : undefined;
}

async function flushSave(action?: () => Promise<void>) {
  const panels = entries.value.map(entry => instances.get(entry.key)).filter((panel): panel is CanvasInstance => !!panel);
  if (!action) {
    await Promise.all(panels.map(panel => panel.flushSave()));
    return;
  }
  // 重命名文件期间暂停所有实例自动保存，目标实例同步新路径后再恢复。
  const run = (index: number): Promise<void> => index < panels.length ? panels[index]!.flushSave(() => run(index + 1)) : action();
  await run(0);
}

function documentInstance(canvasPath: string) {
  const instance = [...instances.values()].find(panel => panel.canvasId === canvasPath) ?? activeInstance.value;
  if (!instance) throw new Error("画布尚未就绪");
  return instance;
}

function readDocumentNode(...args: Parameters<CanvasInstance["readDocumentNode"]>) {
  return documentInstance(args[1]).readDocumentNode(...args);
}

function saveDocumentNode(...args: Parameters<CanvasInstance["saveDocumentNode"]>) {
  return documentInstance(args[1]).saveDocumentNode(...args);
}

function cancelSave() {
  for (const panel of instances.values()) panel.cancelSave();
}

defineExpose({ canvasId, canvasReady, getCanvasContext, readDocumentNode, saveDocumentNode, flushSave, cancelSave,
  get saveBusy() { return [...instances.values()].some(panel => panel.saveBusy); },
});
</script>

<style scoped lang="scss">
.canvasHost {
  position: relative;
  width: 100%;
  height: 100%;

  .canvasRuntime {
    position: absolute;
    inset: 0;

    &.backgroundCanvas {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
  }
}
</style>
