<template>
  <div class="maskEditor">
    <span class="maskHint">{{ hint }}</span>
    <div class="maskStage">
      <div class="maskFrame">
        <img :src="src" alt="待修复的图片" draggable="false" @load="resetImage" @error="emit('ready', false)" />
        <canvas ref="mask" tabindex="0" :aria-label="hint" :aria-description="mode === 'box' ? translate('方向键移动，空格确定两个对角。') : undefined" @pointerdown.prevent="start" @pointermove.prevent="move"
          @pointerleave="showCursor = false" @blur="blurSelection" @pointerup="finish" @pointercancel="cancel" @lostpointercapture="cancel" @keydown="keyPaint" />
        <i v-if="boxStyle" class="boxPreview" :style="boxStyle" />
        <i v-if="showCursor" class="brushCursor" :class="{ erasing, boxCursor: mode === 'box' }" :style="{left: cursor.x * 100 + '%', top: cursor.y * 100 + '%', width: mode === 'box' ? '8px' : diameter / (mask?.width || 1) * 100 + '%'}" />
      </div>
    </div>
    <div class="maskControls">
      <el-radio-group v-model="mode" size="small" aria-label="修复选区" @change="boxStart = undefined">
        <el-radio-button value="box">框选物体</el-radio-button>
        <el-radio-button value="paint">涂抹选区</el-radio-button><el-radio-button value="erase" :disabled="!painted">擦除选区</el-radio-button>
      </el-radio-group>
      <label v-if="mode !== 'box'">笔刷大小 <input v-model.number="size" type="range" min="1" max="30" aria-label="笔刷大小（图片短边百分比）" />{{ size }}%</label>
      <div class="maskActions"><el-button size="small" :disabled="!history.length || restoring" @click="undo">撤销</el-button>
        <el-button size="small" :disabled="!painted || restoring" @click="clearSelection">清空选区</el-button></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElButton, ElRadioButton, ElRadioGroup } from "element-plus";
import { translate } from "@toonflow/i18n/vue";

const props = defineProps<{ src: string; values: Record<string, string | number> }>();
const emit = defineEmits<{ updateValues: [values: Record<string, string | number>]; ready: [value: boolean] }>();
const mode = ref<"box" | "paint" | "erase">("box");
const hint = computed(() => mode.value === "box" ? translate("在图上拖出方框，圈住要擦除的物体。") : translate("涂抹要消除的物体，用「擦除选区」修正边缘。方向键移动画笔，空格落笔。"));
const mask = ref<HTMLCanvasElement>();
const size = ref(8);
const painted = ref(false);
const erasing = computed(() => mode.value === "erase");
const showCursor = ref(false);
const restoring = ref(false);
const history = ref<string[]>([]);
const cursor = ref({ x: 0.5, y: 0.5 });
const boxStart = ref<{ x: number; y: number }>();
const boxStyle = computed(() => {
  const start = boxStart.value, end = cursor.value;
  if (!start) return;
  return { left: Math.min(start.x, end.x) * 100 + "%", top: Math.min(start.y, end.y) * 100 + "%",
    width: Math.abs(end.x - start.x) * 100 + "%", height: Math.abs(end.y - start.y) * 100 + "%" };
});
const shorterSide = ref(1);
const diameter = computed(() => Math.max(2, shorterSide.value * size.value / 100));
let activePointer: number | undefined;
let previous = { x: 0, y: 0 };

function clear() {
  const canvas = mask.value;
  if (canvas) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  painted.value = false;
  if (erasing.value) mode.value = "paint";
  emit("updateValues", { mask: "" });
  emit("ready", false);
}

async function resetImage(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  const canvas = mask.value;
  if (!canvas) return;
  const scale = Math.min(1, 1024 / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  shorterSide.value = Math.min(canvas.width, canvas.height);
  boxStart.value = undefined;
  history.value = [];
  const saved = props.values.mask;
  if (typeof saved !== "string" || !saved.startsWith("data:image/png;base64,")) { clear(); return; }
  const previousMask = new Image();
  previousMask.src = saved;
  try {
    await previousMask.decode();
    if (canvas !== mask.value || props.values.mask !== saved) return;
    canvas.getContext("2d")?.drawImage(previousMask, 0, 0, canvas.width, canvas.height);
    painted.value = true;
    emit("ready", true);
  } catch { clear(); }
}

function point(event: PointerEvent) {
  const bounds = mask.value!.getBoundingClientRect();
  return { x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)), y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)) };
}

function paint(next: typeof previous, first = false) {
  const canvas = mask.value!;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const x = next.x * canvas.width, y = next.y * canvas.height;
  ctx.globalCompositeOperation = erasing.value ? "destination-out" : "source-over";
  ctx.strokeStyle = ctx.fillStyle = "#ff5871";
  ctx.lineCap = "round";
  ctx.lineWidth = diameter.value;
  ctx.beginPath();
  if (first) { ctx.arc(x, y, diameter.value / 2, 0, Math.PI * 2); ctx.fill(); }
  else { ctx.moveTo(previous.x * canvas.width, previous.y * canvas.height); ctx.lineTo(x, y); ctx.stroke(); }
  previous = next;
  ctx.globalCompositeOperation = "source-over";
}

function commitBox() {
  const canvas = mask.value, start = boxStart.value, end = cursor.value;
  boxStart.value = undefined;
  if (!canvas || !start) return;
  const width = (end.x - start.x) * canvas.width, height = (end.y - start.y) * canvas.height;
  if (Math.abs(width) < 1 || Math.abs(height) < 1) return;
  const ctx = canvas.getContext("2d")!;
  remember();
  ctx.fillStyle = "#ff5871";
  ctx.fillRect(start.x * canvas.width, start.y * canvas.height, width, height);
  publish();
}

function publish() {
  const canvas = mask.value!;
  if (erasing.value) {
    const pixels = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    painted.value = false;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) { painted.value = true; break; }
    if (!painted.value) mode.value = "paint";
  } else painted.value = true;
  emit("updateValues", { mask: painted.value ? canvas.toDataURL("image/png") : "" });
  emit("ready", painted.value);
}

function remember() {
  // ACT: 仅保留最近十笔压缩遮罩，避免按笔数累积整幅像素缓冲区。
  history.value = [...history.value.slice(-9), String(props.values.mask || "")];
}

function clearSelection() {
  remember();
  clear();
}

async function undo() {
  if (!history.value.length || restoring.value || activePointer !== undefined) return;
  const saved = history.value.pop()!;
  if (!saved) { clear(); return; }
  restoring.value = true;
  emit("ready", false);
  const image = new Image();
  image.src = saved;
  try {
    await image.decode();
    const canvas = mask.value;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    painted.value = true;
    emit("updateValues", { mask: saved });
  } finally { restoring.value = false; emit("ready", painted.value); }
}

function start(event: PointerEvent) {
  if (event.button !== 0 || activePointer !== undefined || restoring.value || (erasing.value && !painted.value)) return;
  cursor.value = point(event);
  showCursor.value = true;
  activePointer = event.pointerId;
  mask.value!.setPointerCapture(event.pointerId);
  mask.value!.focus({ preventScroll: true });
  if (mode.value === "box") boxStart.value = cursor.value;
  else { remember(); paint(cursor.value, true); }
}
function move(event: PointerEvent) {
  if (activePointer !== undefined && activePointer !== event.pointerId) return;
  cursor.value = point(event);
  showCursor.value = true;
  if (activePointer === event.pointerId && mode.value !== "box") paint(cursor.value);
}
function finish(event: PointerEvent) {
  if (event.pointerId !== activePointer) return;
  cursor.value = point(event);
  if (mode.value === "box") commitBox();
  else { paint(cursor.value); publish(); }
  activePointer = undefined;
  if (mask.value?.hasPointerCapture(event.pointerId)) mask.value.releasePointerCapture(event.pointerId);
}
function cancel(event: PointerEvent) {
  if (event.pointerId !== activePointer) return;
  activePointer = undefined;
  if (mode.value === "box") boxStart.value = undefined;
  else publish();
}
function blurSelection() {
  showCursor.value = false;
  if (activePointer === undefined) boxStart.value = undefined;
}
function keyPaint(event: KeyboardEvent) {
  if (activePointer !== undefined || restoring.value) return;
  if (event.key === "Escape" && boxStart.value) { event.stopPropagation(); boxStart.value = undefined; return; }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); void undo(); return; }
  if (event.key === " ") {
    event.preventDefault();
    if (event.repeat) return;
    if (erasing.value && !painted.value) return;
    showCursor.value = true;
    if (mode.value === "box") {
      if (boxStart.value) commitBox();
      else boxStart.value = cursor.value;
      return;
    }
    remember();
    paint(cursor.value, true);
    publish();
    return;
  }
  const steps: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const step = steps[event.key];
  if (!step) return;
  event.preventDefault();
  showCursor.value = true;
  const delta = event.shiftKey ? 0.05 : 0.01;
  cursor.value = { x: Math.max(0, Math.min(1, cursor.value.x + step[0] * delta)), y: Math.max(0, Math.min(1, cursor.value.y + step[1] * delta)) };
}
</script>

<style scoped lang="scss">
.maskEditor {
  display: grid; gap: 10px;
  .maskStage {
    display: grid; place-items: center; overflow: hidden; background: var(--el-fill-color-darker);
    .maskFrame {
      position: relative; max-width: 100%; overflow: hidden;
      img { display: block; max-height: min(48dvh, 416px); max-width: 100%; }
      canvas { position: absolute; inset: 0; width: 100%; height: 100%; opacity: .62; touch-action: none; cursor: crosshair; }
      canvas:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
      .brushCursor { position: absolute; aspect-ratio: 1; border: 1px solid white; border-radius: 50%; box-shadow: 0 0 0 1px #000a; transform: translate(-50%, -50%); pointer-events: none; }
      .brushCursor.erasing { border-style: dashed; }
      .brushCursor.boxCursor { border-radius: 0; }
      .boxPreview { position: absolute; background: #ff58719e; outline: 1px dashed white; pointer-events: none; }
    }
  }
  .maskControls { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center;
    label { display: inline-flex; align-items: center; gap: 8px; }
    input { accent-color: var(--el-color-primary); }
    .maskActions { display: flex; align-items: center; }
  }
  .maskHint { color: var(--el-text-color-secondary); font-size: var(--el-font-size-small); }
}
</style>
