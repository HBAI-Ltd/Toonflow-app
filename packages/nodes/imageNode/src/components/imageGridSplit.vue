<template>
  <el-popover
    v-model:visible="visible"
    virtualTriggering
    :virtualRef="trigger"
    placement="bottom-start"
    :width="340"
    :persistent="false"
    :showArrow="false"
    :disabled="disabled || !src"
    :popperStyle="{ maxWidth: 'calc(100vw - 24px)', padding: '16px', borderRadius: '12px' }">
    <div class="gridSplitPanel nodrag nopan nowheel" @pointerdown.stop @mousedown.stop @dblclick.stop @keydown.stop @keydown.esc.prevent="visible = false; trigger?.focus()">
      <div class="panelHeader">
        <strong>宫格切分</strong>
        <span>保留原图</span>
      </div>
      <div class="gridPresets" aria-label="常用宫格">
        <button
          v-for="size in [2, 3, 4, 5]"
          :key="size"
          type="button"
          class="presetButton"
          :class="{ active: rows === size && columns === size }"
          :aria-pressed="rows === size && columns === size"
          :disabled="splitting"
          @click="rows = columns = size">
          <span class="presetIcon" :style="{ gridTemplateColumns: `repeat(${size}, 1fr)` }" aria-hidden="true">
            <i v-for="cell in size * size" :key="cell" />
          </span>
          <span>{{ size * size }} 宫格</span>
          <small>{{ size }} × {{ size }}</small>
        </button>
      </div>
      <div class="customGrid">
        <label><span>行数</span><el-input-number v-model="rows" :min="1" :max="10" :precision="0" :disabled="splitting" controlsPosition="right" aria-label="切分行数" /></label>
        <span class="gridMultiply">×</span>
        <label><span>列数</span><el-input-number v-model="columns" :min="1" :max="10" :precision="0" :disabled="splitting" controlsPosition="right" aria-label="切分列数" /></label>
      </div>
      <div v-if="visible" class="previewArea">
        <div class="previewImage">
          <img :src="src" alt="宫格切分预览" @load="readSize" @error="imageSize = { width: 0, height: 0 }" />
          <div v-if="validGrid" class="previewGrid" :style="{ gridTemplateColumns: `repeat(${columns}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }" aria-hidden="true">
            <span v-for="cell in rows * columns" :key="cell"><small>{{ cell }}</small></span>
          </div>
        </div>
      </div>
      <div class="splitSummary" aria-live="polite">
        <span>{{ validGrid ? `共 ${rows * columns} 张图片` : '请设置有效行列数' }}</span>
        <span>从左到右，逐行切分</span>
      </div>
      <el-button class="splitButton" type="primary" :loading="splitting" :disabled="!canSplit || disabled" @click="splitImage">
        {{ splitting ? `正在切分 ${completed} / ${rows * columns}` : '切分为图片节点' }}
      </el-button>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, watch } from "vue";
import { useNode, useVueFlow, type Node } from "@vue-flow/core";
import { ElButton, ElInputNumber, ElMessage, ElPopover } from "element-plus";
import { uploadNodeFile, useNodeFiles } from "@toonflow/nodes-scaffold/runtime";
import { showNodeError } from "@toonflow/node-shared/showNodeError";

const props = defineProps<{ src: string; disabled?: boolean; active: boolean }>();
const { node } = useNode();
const { addNodes, findNode, getNodes, getSelectedNodes, nodeTypes, onNodeDragStart, onSelectionStart, onMoveStart } = useVueFlow();
const files = useNodeFiles();
const getCanvas = inject<(() => { id: string } | undefined) | undefined>("canvas", undefined);
const batchHistory = inject<(action: () => Promise<void>) => Promise<void>>("batchCanvasHistory", action => action());
const visible = ref(false);
const trigger = ref<HTMLElement>();
const rows = ref(3);
const columns = ref(3);
const splitting = ref(false);
const completed = ref(0);
const imageSize = ref({ width: 0, height: 0 });
// ACT: 每轴最多 10 格（100 张），逐张编码上传以控制内存；更大批量需加入分批任务后再放开。
const validGrid = computed(() => [rows.value, columns.value].every(value => Number.isInteger(value) && value >= 1 && value <= 10));
const canSplit = computed(() => validGrid.value && rows.value * columns.value > 1 && imageSize.value.width >= columns.value && imageSize.value.height >= rows.value);
let splitController: AbortController | undefined;

watch(() => props.src, () => {
  splitController?.abort();
  imageSize.value = { width: 0, height: 0 };
}, { flush: "sync" });
watch(() => props.disabled, disabled => {
  if (disabled) { splitController?.abort(); visible.value = false; }
}, { flush: "sync" });
watch(() => props.active, active => { if (!active) visible.value = false; });
watch(() => getSelectedNodes.value.length, count => { if (count !== 1) visible.value = false; });
watch(() => getCanvas?.()?.id, () => { splitController?.abort(); visible.value = false; }, { flush: "sync" });
onNodeDragStart(() => { visible.value = false; });
onSelectionStart(() => { visible.value = false; });
onMoveStart(() => { visible.value = false; });
onBeforeUnmount(() => splitController?.abort());

function open(event: MouseEvent) {
  if (props.disabled || !props.src) return;
  trigger.value = event.currentTarget as HTMLElement;
  visible.value = !visible.value;
}

defineExpose({ open, splitting });

function readSize(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  imageSize.value = { width: image.naturalWidth, height: image.naturalHeight };
}

async function splitImage() {
  if (splitting.value || props.disabled || !canSplit.value) return;
  if (!nodeTypes?.value?.["remote-imageNode"]) return void ElMessage.error("请先启用图片节点插件");
  splitting.value = true;
  completed.value = 0;
  const controller = splitController = new AbortController();
  const rowCount = rows.value;
  const columnCount = columns.value;
  const source = new Image();
  const canvas = document.createElement("canvas");
  const pendingIds: string[] = [];
  const nodes: Node[] = [];
  let workspace: ReturnType<typeof files.getWorkspaceFiles> | undefined;
  let committed = false;
  try {
    workspace = files.getWorkspaceFiles();
    source.src = props.src;
    await source.decode();
    controller.signal.throwIfAborted();
    const { naturalWidth: width, naturalHeight: height } = source;
    if (width < columnCount || height < rowCount) throw new Error("图片尺寸小于切分行列数");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("无法创建图片画布");
    for (let row = 0; row < rowCount; row++) {
      for (let column = 0; column < columnCount; column++) {
        controller.signal.throwIfAborted();
        // 使用相邻整数边界，不能整除的尺寸也不会丢失或重复边缘像素。
        const left = Math.floor(column * width / columnCount);
        const top = Math.floor(row * height / rowCount);
        canvas.width = Math.floor((column + 1) * width / columnCount) - left;
        canvas.height = Math.floor((row + 1) * height / rowCount) - top;
        context.drawImage(source, left, top, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("图片切分失败")), "image/png"));
        controller.signal.throwIfAborted();
        const id = crypto.randomUUID();
        pendingIds.push(id);
        const path = await uploadNodeFile(workspace, id, new File([blob], "tile.png", { type: "image/png" }));
        controller.signal.throwIfAborted();
        nodes.push({
          id,
          type: "remote-imageNode",
          position: { x: 0, y: 0 },
          data: { label: `${node.data.label || "图片"} · ${row + 1}-${column + 1}`, outputs: { image: { dataType: "IMAGE", value: { url: path, mimeType: "image/png" } } } },
        });
        completed.value++;
      }
    }
    if (findNode(node.id) !== node || !nodeTypes?.value?.["remote-imageNode"]) throw new Error("画布节点已变化，请重新切分");
    const tileWidth = Math.ceil(width / columnCount) / Math.floor(height / rowCount) * 240 + 18;
    const gridWidth = columnCount * (tileWidth + 40) - 40;
    const gridHeight = rowCount * 320 - 20;
    const x = node.computedPosition.x + node.dimensions.width + 80;
    let y = node.computedPosition.y;
    for (const other of [...getNodes.value].sort((left, right) => left.computedPosition.y - right.computedPosition.y)) {
      const position = other.computedPosition;
      if (position.x < x + gridWidth && position.x + other.dimensions.width > x && position.y < y + gridHeight && position.y + other.dimensions.height > y) {
        y = position.y + other.dimensions.height + 40;
      }
    }
    nodes.forEach((item, index) => {
      item.position = { x: x + index % columnCount * (tileWidth + 40), y: y + Math.floor(index / columnCount) * 320 };
    });
    await batchHistory(async () => {
      controller.signal.throwIfAborted();
      addNodes(nodes);
      committed = true;
    });
    visible.value = false;
    ElMessage.success(`已切分为 ${nodes.length} 个图片节点`);
  } catch (error) {
    if (!controller.signal.aborted) showNodeError(error, "宫格切分失败");
  } finally {
    source.removeAttribute("src");
    canvas.width = canvas.height = 0;
    if (!committed && workspace) {
      const results = await Promise.allSettled(pendingIds.map(id => workspace!.remove(`assets/${id}`, true)));
      if (results.some(result => result.status === "rejected" && result.reason?.response?.data?.data?.code !== "ENOENT")) {
        ElMessage.error("切分中断，部分临时图片清理失败");
      }
    }
    splitting.value = false;
    splitController = undefined;
  }
}
</script>

<style scoped lang="scss">
.gridSplitPanel {
  color: var(--el-text-color-primary);

  .panelHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;

    span { color: var(--el-text-color-secondary); font-size: 12px; }
  }

  .gridPresets {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;

    .presetButton {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 10px 4px;
      border: 1px solid var(--el-border-color-light);
      border-radius: 8px;
      background: var(--el-fill-color-blank);
      color: var(--el-text-color-regular);
      font: inherit;
      font-size: 13px;
      cursor: pointer;

      &:hover, &.active { border-color: var(--el-color-primary); color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
      &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
      &:disabled { cursor: wait; opacity: 0.65; }

      .presetIcon {
        display: grid;
        gap: 2px;
        width: 26px;
        height: 26px;
        margin-bottom: 2px;

        i { border-radius: 1px; background: currentColor; opacity: 0.65; }
      }

      small { font-size: 11px; opacity: 0.7; }
    }
  }

  .customGrid {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    margin: 14px 0;

    label {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
      font-size: 12px;
      color: var(--el-text-color-regular);

      .el-input-number { width: 100%; }
    }

    .gridMultiply { line-height: 32px; color: var(--el-text-color-secondary); }
  }

  .previewArea {
    display: grid;
    place-items: center;
    height: 156px;
    padding: 8px;
    border-radius: 8px;
    background: var(--el-fill-color-light);
    overflow: hidden;

    .previewImage {
      position: relative;
      max-width: 100%;

      img { display: block; max-width: 100%; max-height: 140px; }

      .previewGrid {
        position: absolute;
        inset: 0;
        display: grid;
        overflow: hidden;
        outline: 1px solid rgba(255, 255, 255, 0.8);

        > span {
          min-width: 0;
          min-height: 0;
          overflow: hidden;
          outline: 1px solid rgba(255, 255, 255, 0.8);

          small { display: inline-block; padding: 0 3px; background: rgba(0, 0, 0, 0.45); color: #fff; font-size: 10px; line-height: 14px; }
        }
      }
    }
  }

  .splitSummary {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin: 10px 0 14px;
    font-size: 12px;

    span:last-child { color: var(--el-text-color-secondary); }
  }

  .splitButton { width: 100%; }
}
</style>
