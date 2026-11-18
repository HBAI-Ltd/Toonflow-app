<template>
  <div ref="root" class="cameraViewfinder" :class="[rightHalf ? 'rightHalf' : 'leftHalf', { gesturing: gestureKind !== '', moving: windowMoving, resizing, disabled, monitor, picking: trackPicking }]" :style="windowStyle" role="group" :aria-label="monitor ? '总监看' : '取景窗'">
    <header class="viewfinderHeader" @pointerdown="beginWindowDrag" @pointermove="moveWindowDrag" @pointerup="endWindowDrag" @pointercancel="endWindowDrag" @lostpointercapture="endWindowDrag">
      <span v-if="monitor" class="programBadge">监看</span>
      <i class="cameraDot" aria-hidden="true" />
      <strong class="cameraName" :title="name">{{ name }}</strong>
      <span v-if="rangeLabel" class="rangeChip">{{ rangeLabel }}</span>
      <el-popover v-if="formats.length" trigger="click" placement="bottom-end" :width="150" popperClass="filmFormatPopover">
        <template #reference><button type="button" class="formatChip" :disabled="disabled" title="成片画幅：横屏、宽银幕、竖屏短剧" @pointerdown.stop>{{ format }}</button></template>
        <div class="filmFormats" role="menu" aria-label="成片画幅">
          <button v-for="item in formats" :key="item.key" type="button" role="menuitemradio" :aria-checked="item.key === format" :class="{ active: item.key === format }" @click="emit('format', item.key)"><i :style="{ aspectRatio: String(item.aspect) }" />{{ item.name }}</button>
        </div>
      </el-popover>
    </header>
    <div class="pictureFrame">
      <div ref="picture" class="viewfinderPicture" :class="gestureKind" :style="{ aspectRatio: String(aspect) }" :title="monitor ? '成片按时间轴上的镜头段切换机位' : (keyActive ? '正在改选中的关键点 · ' : '') + '滚轮变焦 · 右键云台转向（按住时 WASD 移动、Q/E 翻滚）· 左键拖动平移'" @pointerdown="beginGesture" @pointermove="moveGesture" @pointerup="endGesture" @pointercancel="loseGesture" @lostpointercapture="loseGesture" @wheel="zoom" @contextmenu.prevent>
        <canvas ref="canvasElement" aria-hidden="true" />
        <i class="frameMarks" aria-hidden="true" />
        <i v-if="aspect < 1" class="safeArea" aria-hidden="true" title="竖屏安全区：上方标题栏、下方文案和按钮会挡住虚线外的画面" />
        <i v-if="!monitor && gestureKind === 'look'" class="horizon" :style="{ transform: `rotate(${roll}deg)` }" aria-hidden="true" />
        <i v-if="recording" class="recordingDot" aria-hidden="true" />
        <span v-if="caption" class="viewfinderCaption" :class="{ portrait: aspect < 1 }">{{ caption }}</span>
        <span v-if="!monitor && tracking" class="trackChip" :class="tracking" @pointerdown.stop>
          <icon-target :size="12" /><span>{{ trackName }}</span>
          <button type="button" :disabled="disabled" :title="tracking === 'aim' ? '改为跟拍：整台机位跟着走' : '改为瞄准：机位不动只转云台'" @click="emit('trackMode', tracking === 'aim' ? 'follow' : 'aim')">{{ tracking === 'aim' ? '瞄准' : '跟拍' }}</button>
          <el-popover trigger="click" placement="bottom-end" :width="260" popperClass="cameraFeelPopover" :disabled="disabled">
            <template #reference><button type="button" class="gimbalToggle" :disabled="disabled" aria-label="云台手感" title="云台手感：防抖、平滑、死区、限位"><icon-adjustments-horizontal :size="11" /></button></template>
            <div class="feelRows" role="group" aria-label="云台手感" @keydown.stop>
              <label v-for="item in gimbalFields" :key="item.key" class="feelRow" :title="item.title">
                <span>{{ item.label }}</span>
                <el-slider :modelValue="gimbalValue(item.key)" :min="item.min" :max="item.max" :step="item.step" :showTooltip="false" :aria-label="item.title" @input="value => setGimbal(item.key, value, true)" @change="value => setGimbal(item.key, value, false)" />
                <output>{{ item.format(gimbalValue(item.key)) }}</output>
              </label>
            </div>
          </el-popover>
          <button type="button" :disabled="disabled" aria-label="停止跟踪" title="停止跟踪" @click="emit('track')"><icon-x :size="11" /></button>
        </span>
        <span v-if="trackPicking" class="pickHint" aria-live="polite"><icon-target :size="13" />点场景里的物体</span>
        <div class="readouts" @pointerdown.stop>
          <el-popover v-if="!monitor" trigger="click" placement="top-start" :width="210" popperClass="cameraFeelPopover" :disabled="disabled">
            <template #reference><button type="button" class="focalReadout focalButton" :class="{ live: zooming }" :disabled="disabled" title="焦段：点开输入精确数值或选常用定焦">{{ Math.round(focalLength) }}mm</button></template>
            <div class="feelRows" role="group" aria-label="焦段" @keydown.stop>
              <label class="feelRow focalRow"><span>焦段</span><el-input-number :modelValue="Math.round(focalLength)" :min="12" :max="200" :step="1" size="small" controlsPosition="right" aria-label="焦段毫米" @change="value => setFocal(Number(value))" /><output>mm</output></label>
              <div class="cameraMoves" role="group" aria-label="常用定焦"><span>定焦</span><div><button v-for="lens in primeLenses" :key="lens" type="button" :class="{ active: Math.round(focalLength) === lens }" :title="lens + 'mm'" @click="setFocal(lens)">{{ lens }}</button></div></div>
            </div>
          </el-popover>
          <span v-else class="focalReadout" :class="{ live: zooming }">{{ Math.round(focalLength) }}mm</span>
          <template v-if="!monitor">
            <span v-if="keyActive" class="opticChip keyChip" title="滚轮、右键转向、Q/E 翻滚都记到选中的关键点"><i aria-hidden="true" />关键点</span>
            <span v-if="roll" class="opticChip rollChip" title="翻滚角">{{ Math.round(roll) }}°</span>
            <button v-if="hasPath" type="button" class="opticChip manual" :disabled="disabled" title="这段镜头有划出的机位轨迹 · 点击清除" @click="emit('clearPath')">轨迹 ×</button>
          </template>
        </div>
      </div>
      <div class="pictureActions">
        <template v-if="!monitor">
          <button type="button" :class="{ active: drawingPath }" :disabled="disabled" aria-label="画轨迹" title="画轨迹：拖出机位走的路线，按住 Shift 升降" @pointerdown.stop @click="emit('drawPath')"><icon-route :size="15" /></button>
          <button type="button" :class="{ active: keyActive }" :disabled="disabled || !hasShot" aria-label="加关键点" :title="hasShot ? '在播放头处加镜头关键点：之后滚轮调焦段、右键转向、Q/E 翻滚都记到这个点' : '先在时间轴上框出一段镜头'" @pointerdown.stop @click="emit('addKey')"><icon-keyframe :size="15" /></button>
          <el-popover trigger="click" placement="top-end" :width="260" popperClass="cameraFeelPopover" :disabled="disabled || !hasShot">
            <template #reference><button type="button" :class="{ active: shake > 0 }" :disabled="disabled || !hasShot" aria-label="这段镜头" :title="hasShot ? '这段镜头：景别、角度、运镜、手持晃动、缓动' : '先在时间轴上框出一段镜头'" @pointerdown.stop><icon-movie :size="15" /></button></template>
            <div class="feelRows" role="group" aria-label="这段镜头" @keydown.stop>
              <div class="cameraMoves" role="group" aria-label="景别"><span>景别</span><div><button v-for="size in shotSizes" :key="size.kind" type="button" :title="size.title + '（按跟拍或注视的人算焦段，焦段不够时前后挪机位）'" @click="emit('shotSize', size.kind)">{{ size.name }}</button></div></div>
              <div class="cameraMoves" role="group" aria-label="角度"><span>角度</span><div><button v-for="angle in cameraAngles" :key="angle.kind" type="button" :title="angle.title" @click="emit('cameraAngle', angle.kind)">{{ angle.name }}</button></div></div>
              <div class="cameraMoves" role="group" aria-label="运镜"><span>运镜</span><div><button v-for="move in cameraMoves" :key="move.kind" type="button" :title="move.title" @click="emit('cameraMove', move.kind)">{{ move.name }}</button></div></div>
              <label class="feelRow" title="晃动幅度，0为三脚架般稳定"><span>晃动</span><el-slider :modelValue="shake" :min="0" :max="1" :step="0.05" :showTooltip="false" aria-label="晃动幅度" @input="value => setFeel('shake', value, true)" @change="value => setFeel('shake', value, false)" /><output>{{ Math.round(shake * 100) }}%</output></label>
              <label class="feelRow" title="晃动快慢：慢像肩扛，快像奔跑"><span>节奏</span><el-slider :modelValue="shakeRate" :min="0.25" :max="4" :step="0.05" :showTooltip="false" :disabled="shake <= 0" aria-label="晃动节奏" @input="value => setFeel('shakeRate', value, true)" @change="value => setFeel('shakeRate', value, false)" /><output>{{ shakeRate.toFixed(2) }}×</output></label>
              <label class="feelRow" title="开：起步慢慢加速、结束慢慢停下；关：全程匀速"><span>缓动</span><el-switch :modelValue="easeInOut" size="small" aria-label="缓入缓出" @change="value => emit('shotFeel', { easing: value ? 'smooth' : 'linear' }, false)" /><output>{{ easeInOut ? '缓入缓出' : '匀速' }}</output></label>
            </div>
          </el-popover>
          <button type="button" :class="{ active: !!tracking || trackPicking }" :disabled="disabled" :aria-label="tracking ? '停止跟踪' : '跟踪物体'" :title="tracking ? '停止跟踪' : '跟踪物体：点了再去场景里点要跟的物体'" @pointerdown.stop @click="emit('track')"><icon-target :size="15" /></button>
        </template>
        <button type="button" aria-label="全屏预演" title="全屏预演" @pointerdown.stop @click="emit('expand')"><icon-maximize :size="15" /></button>
      </div>
    </div>
    <span class="resizeGrip" aria-hidden="true" @pointerdown="beginResize" @pointermove="moveResize" @pointerup="endResize" @pointercancel="endResize" @lostpointercapture="endResize" />
  </div>
</template>

<script lang="ts">
/** 取景窗手势的增量：宿主把它们累加到手势开始时记下的画面上。 */
export type ViewfinderDelta =
  | { kind: "look"; yaw: number; pitch: number }
  | { kind: "truck"; right: number; up: number }
  | { kind: "zoom"; factor: number }
  | { kind: "fly"; forward: number; right: number; lift: number }
  | { kind: "roll"; degrees: number }       // 横滚，向右倾为正
  | { kind: "focus"; factor: number };      // 对焦距离乘以factor
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch, type Component } from "vue";
import { IconMaximize, IconX, IconRoute, IconTarget, IconAdjustmentsHorizontal, IconMovie, IconKeyframe } from "@tabler/icons-vue";
import { ElInputNumber, ElPopover, ElSlider, ElSwitch } from "element-plus";
import { getCameraFov } from "./cameraDocument";

const props = withDefaults(defineProps<{
  name: string; color: string; focalLength: number; rangeLabel: string; recording?: boolean;
  // 字幕：成片这一刻镜头段的备注（台词或画面说明）。
  caption?: string; disabled?: boolean; speed?: number;
  hasPath?: boolean;
  // 画面当前的翻滚角；keyActive为true时画面里的改动记到时间轴上选中的镜头关键点。
  roll?: number; keyActive?: boolean;
  tracking?: "" | "aim" | "follow"; trackName?: string; trackPicking?: boolean; drawingPath?: boolean;
  // 云台手感：平滑时间（秒）、死区（度）、限位（度，180为不限）。
  trackSmooth?: number; trackDeadzone?: number; trackLimit?: number; trackStabilize?: number;
  // 这段镜头的手持感：晃动强度与节奏；hasShot为false时没有镜头段可设。
  shake?: number; shakeRate?: number; hasShot?: boolean;
  // 这段镜头是否缓入缓出。
  easeInOut?: boolean;
  // 总监看：只看成片，不能在这里改画面。
  monitor?: boolean; storageKey?: string; defaultRight?: number; defaultTop?: number;
  // 成片画幅（宽高比）：竖屏时窗口按长边（高）缩放。
  // 朗读台词开关：只在总监看上给（"on"/"off"），不给就不显示。
  aspect?: number; format?: string; formats?: { key: string; name: string; aspect: number }[];
}>(), { format: "16:9", formats: () => [], aspect: 16 / 9, hasPath: false, recording: false, disabled: false, speed: 6, roll: 0, keyActive: false, tracking: "", trackName: "", trackPicking: false, drawingPath: false, trackSmooth: 0.4, trackDeadzone: 0, trackLimit: 180, trackStabilize: 0.5, shake: 0, shakeRate: 1, hasShot: false, easeInOut: true, monitor: false, storageKey: "trumanMap.viewfinder", defaultRight: 16, defaultTop: 68 });
// ACT: 一键运镜：给这段镜头写入轨迹或关键点（不是开关），写完可在时间轴、取景窗里继续改。
const cameraMoves = [
  { kind: "push", name: "推近", title: "推：机位沿视线向前移，画面逐渐变紧" }, { kind: "pull", name: "拉远", title: "拉：机位沿视线后退，逐渐交代环境" },
  { kind: "truckLeft", name: "左移", title: "移：机位横向向左平移" }, { kind: "truckRight", name: "右移", title: "移：机位横向向右平移" },
  { kind: "craneUp", name: "升", title: "升：机位上升（升降臂）" }, { kind: "craneDown", name: "降", title: "降：机位下降" },
  { kind: "panLeft", name: "左摇", title: "摇：机位不动，镜头向左摇约35°" }, { kind: "panRight", name: "右摇", title: "摇：机位不动，镜头向右摇约35°" },
  { kind: "orbitLeft", name: "左绕", title: "环绕：绕注视点向左转40°" }, { kind: "orbitRight", name: "右绕", title: "环绕：绕注视点向右转40°" },
  { kind: "zoomIn", name: "变焦推", title: "变焦：焦段逐渐拉长到约1.8倍，机位不动" }, { kind: "clear", name: "清除", title: "清除这段镜头的轨迹和关键点，回到固定机位" },
] as const;
const cameraAngles = [
  { kind: "eye", name: "平视", title: "平视：机位和人眼差不多高，最自然的视角" }, { kind: "high", name: "俯拍", title: "俯拍：机位在上往下看，人显得弱小、被压迫" }, { kind: "low", name: "仰拍", title: "仰拍：机位在下往上看，人显得高大、有压迫感" },
  { kind: "overhead", name: "顶拍", title: "顶拍：几乎垂直往下，交代走位和空间关系" }, { kind: "dutch", name: "荷兰角", title: "荷兰角：画面倾斜15°，不安、失衡（再点一次扶正）" },
] as const;
// ACT: 精确焦段：输入数值或点常用定焦，走和滚轮变焦同一条手势通道（选中关键点时改关键点，否则改这段镜头）。
const primeLenses = [18, 24, 35, 50, 85, 135] as const;
function setFocal(value: number) {
  if (props.disabled || !Number.isFinite(value) || value <= 0 || !(props.focalLength > 0)) return;
  const target = Math.min(200, Math.max(12, value));
  if (Math.abs(target - props.focalLength) < 0.05) return;
  emit("gestureStart");
  emit("gesture", { kind: "zoom", factor: target / props.focalLength });
  emit("gestureEnd");
}
const shotSizes = [
  { kind: "extremeWide", name: "大全", title: "大全景：人很小，交代整个环境" }, { kind: "wide", name: "全景", title: "全景：人全身入画、头脚留余" }, { kind: "medium", name: "中景", title: "中景：膝盖或腰部以上" },
  { kind: "close", name: "近景", title: "近景：胸部以上" }, { kind: "closeUp", name: "特写", title: "特写：脸部" },
] as const;
const emit = defineEmits<{ format: [key: string]; cameraAngle: [kind: string]; shotSize: [kind: string]; cameraMove: [kind: string]; canvas: [canvas: HTMLCanvasElement | null]; gestureStart: []; gesture: [delta: ViewfinderDelta]; gestureEnd: []; gestureCancel: []; expand: [];
  track: []; trackMode: [mode: "aim" | "follow"]; trackSettings: [patch: { smooth?: number; deadzone?: number; limit?: number; stabilize?: number }, live: boolean]; shotFeel: [patch: { shake?: number; shakeRate?: number; easing?: "smooth" | "linear" }, live: boolean]; drawPath: []; addKey: []; clearPath: [] }>();

const storageKey = props.storageKey;
const headerHeight = 28, inset = 4, margin = 8, wheelIdleMs = 220;
const widthLimits = { min: 240, max: 720 } as const;
const flyCodes = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "Space", "ShiftLeft", "ShiftRight", "KeyQ", "KeyE"]);

const root = ref<HTMLElement>();
const picture = ref<HTMLElement>();
const canvasElement = ref<HTMLCanvasElement>();

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }

// ACT: 位置记成“贴靠哪一侧 + 离那一侧多远”：编辑器变宽变窄时窗口跟着那条边走，缩放手柄也总在朝向编辑器中央的下角。
const anchorRight = ref(true);
const offsetX = ref(props.defaultRight);
const offsetY = ref(props.defaultTop);
const width = ref(336);
const bounds = shallowRef({ width: 0, height: 0 });
// ACT: width存的是画面长边：横画面是宽，竖画面（9:16）是高；画面宽高 = 长边 × (wx, wy)。
const aspect = computed(() => Number.isFinite(props.aspect) && props.aspect > 0 ? props.aspect : 16 / 9);
const edge = computed(() => aspect.value >= 1 ? { x: 1, y: 1 / aspect.value } : { x: aspect.value, y: 1 });
function edgeLimit(left: number, top: number) { return Math.min(widthLimits.max, (left - inset * 2) / edge.value.x, (top - headerHeight - inset) / edge.value.y); }
const longEdge = computed(() => {
  const { width: parentWidth, height: parentHeight } = bounds.value;
  const fit = edgeLimit(parentWidth - margin * 2, parentHeight - margin * 2);
  return Math.round(clamp(width.value, widthLimits.min, Math.max(widthLimits.min, fit)));
});
const pictureWidth = computed(() => Math.round(longEdge.value * edge.value.x));
const windowWidth = computed(() => pictureWidth.value + inset * 2);
const windowHeight = computed(() => headerHeight + longEdge.value * edge.value.y + inset);
const placement = computed(() => ({
  x: clamp(offsetX.value, 0, Math.max(0, bounds.value.width - windowWidth.value)),
  y: clamp(offsetY.value, 0, Math.max(0, bounds.value.height - windowHeight.value)),
}));
const leftEdge = computed(() => anchorRight.value ? bounds.value.width - placement.value.x - windowWidth.value : placement.value.x);
const rightHalf = computed(() => leftEdge.value + windowWidth.value / 2 > bounds.value.width / 2);
const windowStyle = computed(() => ({ [anchorRight.value ? "right" : "left"]: `${placement.value.x}px`, top: `${placement.value.y}px`, width: `${windowWidth.value}px`, "--cameraColor": props.color }));

let hostWindow: Window = window;
let parentObserver: ResizeObserver | undefined;
let pictureObserver: ResizeObserver | undefined;
let pictureHeight = 0;

function measureParent(parent: HTMLElement) {
  const next = { width: parent.clientWidth, height: parent.clientHeight };
  if (next.width !== bounds.value.width || next.height !== bounds.value.height) bounds.value = next;
}

// ACT: 画布像素尺寸按成片画幅取整（宽取偶数，高按比例），宿主按它渲染时不会拉伸。
function sizeCanvas(cssWidth: number) {
  const element = canvasElement.value;
  if (!element || !(cssWidth > 0)) return;
  const ratio = Math.min(2, hostWindow.devicePixelRatio || 1);
  const pixels = Math.max(2, Math.round(cssWidth * ratio / 2) * 2);
  const height = Math.max(2, Math.round(pixels / aspect.value));
  if (element.width !== pixels) element.width = pixels;
  if (element.height !== height) element.height = height;
}

function restorePlacement() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null") as unknown;
    if (!saved || typeof saved !== "object") return;
    const { side, x, y, width: savedWidth } = saved as Record<string, unknown>;
    if (typeof x === "number" && Number.isFinite(x) && typeof y === "number" && Number.isFinite(y)) { anchorRight.value = side !== "left"; offsetX.value = Math.max(0, x); offsetY.value = Math.max(0, y); }
    if (typeof savedWidth === "number" && Number.isFinite(savedWidth)) width.value = Math.round(clamp(savedWidth, widthLimits.min, widthLimits.max));
  } catch { /* 读不到存档就用默认位置 */ }
}

function savePlacement() {
  try { localStorage.setItem(storageKey, JSON.stringify({ side: anchorRight.value ? "right" : "left", x: Math.round(offsetX.value), y: Math.round(offsetY.value), width: width.value })); } catch { /* 存不下时只在本次生效 */ }
}

// 窗口拖动：按住标题栏移动，始终整个留在编辑器里。
let windowDrag: { pointerId: number; x: number; y: number; left: number; top: number } | undefined;
const windowMoving = ref(false);
function beginWindowDrag(event: PointerEvent) {
  const element = root.value;
  if (!element || event.button !== 0 || windowDrag || resize) return;
  event.preventDefault();
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  windowDrag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: element.offsetLeft, top: element.offsetTop };
  windowMoving.value = true;
}
function moveWindowDrag(event: PointerEvent) {
  const drag = windowDrag;
  if (!drag || event.pointerId !== drag.pointerId) return;
  const { width: parentWidth, height: parentHeight } = bounds.value;
  const left = clamp(drag.left + event.clientX - drag.x, 0, Math.max(0, parentWidth - windowWidth.value));
  offsetY.value = clamp(drag.top + event.clientY - drag.y, 0, Math.max(0, parentHeight - windowHeight.value));
  anchorAt(left);
}
function anchorAt(left: number) {
  const parentWidth = bounds.value.width;
  anchorRight.value = left + windowWidth.value / 2 > parentWidth / 2;
  offsetX.value = anchorRight.value ? parentWidth - left - windowWidth.value : left;
}
function endWindowDrag(event: PointerEvent) {
  const drag = windowDrag;
  if (!drag || event.pointerId !== drag.pointerId) return;
  windowDrag = undefined; windowMoving.value = false;
  const target = event.currentTarget as HTMLElement;
  if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
  savePlacement();
}

// 缩放：手柄在朝向中央的下角，对侧上角不动，高度跟着成片画幅走。
let resize: { pointerId: number; x: number; y: number; width: number } | undefined;
const resizing = ref(false);
function beginResize(event: PointerEvent) {
  if (event.button !== 0 || windowDrag || resize) return;
  event.preventDefault(); event.stopPropagation();
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  // 编辑器缩小后窗口可能被挤到另一半，先按实际位置重新贴边，保证手柄朝向中央、对侧上角不动。
  anchorAt(leftEdge.value); offsetY.value = placement.value.y;
  resize = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, width: longEdge.value };
  resizing.value = true;
}
function moveResize(event: PointerEvent) {
  const current = resize;
  if (!current || event.pointerId !== current.pointerId) return;
  const dx = (event.clientX - current.x) * (anchorRight.value ? -1 : 1), dy = event.clientY - current.y;
  // 指针位移投影到画面的对角线上（按成片画幅），手柄始终贴着鼠标。
  const { x: wx, y: wy } = edge.value;
  const grow = (dx * wx + dy * wy) / (wx * wx + wy * wy);
  const { width: parentWidth, height: parentHeight } = bounds.value;
  const limit = edgeLimit(parentWidth - offsetX.value, parentHeight - offsetY.value);
  width.value = Math.round(clamp(current.width + grow, widthLimits.min, Math.max(widthLimits.min, limit)));
}
function endResize(event: PointerEvent) {
  const current = resize;
  if (!current || event.pointerId !== current.pointerId) return;
  resize = undefined; resizing.value = false;
  const target = event.currentTarget as HTMLElement;
  if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
  savePlacement();
}

// 画面手势：左键拖动平移、左键单击对焦、右键云台转向（按住时WASD飞行、Q/E横滚）、滚轮变焦、Alt+滚轮拉焦。同一时间只有一个手势，gestureStart推迟到第一个增量之前才发出，单击画面不会惊动宿主。
type PictureDrag = { kind: "look" | "truck"; pointerId: number; mask: number; x: number; y: number; startX: number; startY: number; moved: boolean };
let drag: PictureDrag | undefined;
let started = false;
let wheelTimer: ReturnType<typeof setTimeout> | undefined;
let listening = false;
let loopFrame = 0, loopTime = 0;
const heldKeys = new Set<string>();
const gestureKind = ref<"" | "look" | "truck">("");
const zooming = ref(false);
// ACT: 云台阻尼：右键拖动先累积目标转角，每帧按70ms时间常数吐出一部分，松手后余量继续滑完，手感像真实的稳定器云台。
let pendingYaw = 0, pendingPitch = 0, releasing = false;

function push(delta: ViewfinderDelta) {
  if (!started) { started = true; emit("gestureStart"); }
  emit("gesture", delta);
}

function settle(cancel: boolean) {
  const current = drag, element = picture.value;
  drag = undefined; gestureKind.value = "";
  clearTimeout(wheelTimer); wheelTimer = undefined; zooming.value = false;
  pendingYaw = pendingPitch = 0; releasing = false;
  stopLoop();
  listenWindow(false);
  if (current && current.pointerId >= 0 && element?.hasPointerCapture(current.pointerId)) element.releasePointerCapture(current.pointerId);
  if (current?.kind === "look") guardContextMenu();
  if (!started) return;
  started = false;
  if (cancel) emit("gestureCancel"); else emit("gestureEnd");
}

function beginGesture(event: PointerEvent) {
  if (props.disabled || props.monitor || drag) return;
  const look = event.button === 2;
  if (!look && event.button !== 0) return;
  event.preventDefault();
  if (wheelTimer !== undefined) settle(false);
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  drag = { kind: look ? "look" : "truck", pointerId: event.pointerId, mask: look ? 2 : 1, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, moved: false };
  gestureKind.value = drag.kind;
  listenWindow(true);
  if (look) startLoop();
}

function moveGesture(event: PointerEvent) {
  const current = drag;
  if (!current || event.pointerId !== current.pointerId) return;
  // 和弦按键时松开的那颗不会触发pointerup，这里补上结束。
  if (event.pointerType === "mouse" && !(event.buttons & current.mask)) { finishDrag(event); return; }
  if (!current.moved && Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < 3) return;
  current.moved = true;
  const dx = event.clientX - current.x, dy = event.clientY - current.y;
  if (!dx && !dy) return;
  current.x = event.clientX; current.y = event.clientY;
  const height = pictureHeight || picture.value?.clientHeight || 1;
  if (current.kind === "look") {
    // 拖过整个画面高度正好转过一个竖直视场角：长焦转得慢，广角转得快，画面跟手。
    const fov = getCameraFov(props.focalLength, aspect.value) * Math.PI / 180;
    pendingYaw += dx / height * fov; pendingPitch += -dy / height * fov;
  } else push({ kind: "truck", right: -dx / height, up: dy / height });
}

function finishDrag(event: PointerEvent) {
  const current = drag;
  if (!current) return;
  if (current.kind === "look" && Math.abs(pendingYaw) + Math.abs(pendingPitch) > 0.0005) {
    // 松手后让云台把余下的转角滑完再结束这次手势。
    const element = picture.value;
    if (element?.hasPointerCapture(current.pointerId)) element.releasePointerCapture(current.pointerId);
    current.pointerId = -1; releasing = true; heldKeys.clear();
    guardContextMenu();
    return;
  }
  settle(false);
}

function endGesture(event: PointerEvent) {
  if (drag && event.pointerId === drag.pointerId) finishDrag(event);
}

function loseGesture(event: PointerEvent) {
  if (drag && event.pointerId === drag.pointerId) settle(true);
}

function zoom(event: WheelEvent) {
  event.preventDefault(); event.stopPropagation();
  if (props.disabled || props.monitor) return;
  const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? pictureHeight || 200 : 1;
  const deltaY = clamp(event.deltaY * scale, -240, 240);
  if (!deltaY) return;
  // 拖动中滚轮并入当前手势；否则一串滚轮是一个手势，停220ms才结束。
  if (!drag) {
      clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => settle(false), wheelIdleMs);
    listenWindow(true);
  }
  zooming.value = true;
  push({ kind: "zoom", factor: Math.exp(-deltaY * 0.0015) });
}

function tick(time: number) {
  loopFrame = 0;
  if (drag?.kind !== "look") return;
  const seconds = Math.min(0.05, Math.max(0, (time - loopTime) / 1000));
  loopTime = time;
  if (seconds > 0) {
    const amount = 1 - Math.exp(-seconds / 0.07);
    const yaw = pendingYaw * amount, pitch = pendingPitch * amount;
    if (Math.abs(yaw) + Math.abs(pitch) > 0.00001) { pendingYaw -= yaw; pendingPitch -= pitch; push({ kind: "look", yaw, pitch }); }
    const axis = (positive: boolean, negative: boolean) => (positive ? 1 : 0) - (negative ? 1 : 0);
    const forward = axis(heldKeys.has("KeyW"), heldKeys.has("KeyS")), right = axis(heldKeys.has("KeyD"), heldKeys.has("KeyA")), lift = axis(heldKeys.has("Space"), heldKeys.has("ShiftLeft") || heldKeys.has("ShiftRight"));
    const size = Math.hypot(forward, right, lift);
    const speed = Number.isFinite(props.speed) ? Math.max(0, props.speed) : 6;
    if (size && speed) { const step = speed * seconds / size; push({ kind: "fly", forward: forward * step, right: right * step, lift: lift * step }); }
    const roll = axis(heldKeys.has("KeyE"), heldKeys.has("KeyQ"));
    if (roll) push({ kind: "roll", degrees: roll * 40 * seconds });
  }
  if (releasing && Math.abs(pendingYaw) + Math.abs(pendingPitch) <= 0.0005) { settle(false); return; }
  loopFrame = hostWindow.requestAnimationFrame(tick);
}

function startLoop() {
  if (loopFrame) return;
  loopTime = performance.now();
  loopFrame = hostWindow.requestAnimationFrame(tick);
}

function stopLoop() {
  if (loopFrame) hostWindow.cancelAnimationFrame(loopFrame);
  loopFrame = 0; loopTime = 0; heldKeys.clear();
}

// ACT: 按键在window捕获阶段截下：宿主自己的按键处理会拿WASD去飞主视角、拿Esc去关面板。
function onWindowKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    if (started) { event.preventDefault(); event.stopPropagation(); }
    settle(true);
    return;
  }
  if (drag?.kind !== "look" || releasing || !flyCodes.has(event.code) || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
  event.preventDefault(); event.stopPropagation();
  heldKeys.add(event.code);
  startLoop();
}

function onWindowKeyUp(event: KeyboardEvent) {
  if (!heldKeys.delete(event.code)) return;
  event.preventDefault(); event.stopPropagation();
}



function onWindowBlur() { settle(true); }

function listenWindow(active: boolean) {
  if (active === listening) return;
  listening = active;
  if (active) {
    hostWindow.addEventListener("keydown", onWindowKeyDown, true);
    hostWindow.addEventListener("keyup", onWindowKeyUp, true);
    hostWindow.addEventListener("blur", onWindowBlur);
  } else {
    hostWindow.removeEventListener("keydown", onWindowKeyDown, true);
    hostWindow.removeEventListener("keyup", onWindowKeyUp, true);
    hostWindow.removeEventListener("blur", onWindowBlur);
  }
}

// 右键转向时指针可能在画面外松开，那次右键菜单弹在别处，这里吞掉紧随其后的一次。
let menuGuard: ReturnType<typeof setTimeout> | undefined;
function blockContextMenu(event: Event) { event.preventDefault(); event.stopPropagation(); releaseMenuGuard(); }
function releaseMenuGuard() {
  clearTimeout(menuGuard); menuGuard = undefined;
  hostWindow.removeEventListener("contextmenu", blockContextMenu, true);
}
function guardContextMenu() {
  releaseMenuGuard();
  hostWindow.addEventListener("contextmenu", blockContextMenu, true);
  menuGuard = setTimeout(releaseMenuGuard, 400);
}

// 云台手感与手持：拖动滑块时实时预览（live），松手记一步撤销。
type GimbalKey = "stabilize" | "smooth" | "deadzone" | "limit";
const gimbalFields: { key: GimbalKey; label: string; title: string; min: number; max: number; step: number; format: (value: number) => string }[] = [
  { key: "stabilize", label: "防抖", title: "被拍物体剧烈抖动、高速旋转时，镜头不跟着乱晃乱甩", min: 0, max: 1, step: 0.05, format: value => Math.round(value * 100) + "%" },
  { key: "smooth", label: "平滑", title: "目标突然变化时，镜头追过去的柔和程度", min: 0, max: 2, step: 0.05, format: value => value.toFixed(2) + "s" },
  { key: "deadzone", label: "死区", title: "目标在这个角度内晃动时镜头不动", min: 0, max: 20, step: 0.5, format: value => value.toFixed(1) + "°" },
  { key: "limit", label: "限位", title: "相对这段镜头原本的朝向，云台最多能转多少度", min: 10, max: 180, step: 5, format: value => value >= 180 ? "不限" : "±" + value + "°" },
];
function gimbalValue(key: GimbalKey) { return key === "stabilize" ? props.trackStabilize : key === "smooth" ? props.trackSmooth : key === "deadzone" ? props.trackDeadzone : props.trackLimit; }
function sliderNumber(value: number | number[]) { const next = Array.isArray(value) ? value[0] : value; return next !== undefined && Number.isFinite(next) ? next : undefined; }
function setGimbal(key: GimbalKey, value: number | number[], live: boolean) { const next = sliderNumber(value); if (next !== undefined) emit("trackSettings", { [key]: next }, live); }
function setFeel(key: "shake" | "shakeRate", value: number | number[], live: boolean) { const next = sliderNumber(value); if (next !== undefined) emit("shotFeel", { [key]: next }, live); }


watch(() => props.disabled, disabled => { if (disabled) settle(true); });

onMounted(() => {
  const element = root.value;
  if (!element) return;
  hostWindow = element.ownerDocument.defaultView ?? window;
  restorePlacement();
  const parent = (element.offsetParent ?? element.parentElement) as HTMLElement | null;
  if (parent) {
    measureParent(parent);
    // 浏览器缩放会改变devicePixelRatio而画面的CSS尺寸不变，借编辑器尺寸变化顺带重算画布像素。
    parentObserver = new ResizeObserver(() => { measureParent(parent); sizeCanvas(picture.value?.clientWidth ?? 0); });
    parentObserver.observe(parent);
  }
  if (picture.value) {
    pictureObserver = new ResizeObserver(entries => {
      const rect = entries[entries.length - 1]?.contentRect;
      if (!rect) return;
      pictureHeight = rect.height;
      sizeCanvas(rect.width);
    });
    pictureObserver.observe(picture.value);
  }
  sizeCanvas(pictureWidth.value);
  emit("canvas", canvasElement.value ?? null);
});
// 换画幅时画面宽可能不变（只变高），不一定触发尺寸观察，这里直接按新比例重设画布像素。
watch(aspect, () => { pictureHeight = 0; sizeCanvas(pictureWidth.value); });

onBeforeUnmount(() => {
  settle(true);
  releaseMenuGuard();
  parentObserver?.disconnect(); pictureObserver?.disconnect();
  emit("canvas", null);
});
</script>

<style scoped lang="scss">
.cameraViewfinder {
  position: absolute; z-index: 10; display: flex; flex-direction: column; padding: 0 4px 4px; border-radius: 12px;
  background: var(--studioGlassBackground); outline: 1px solid var(--studioBorderColor); outline-offset: -1px;
  box-shadow: var(--studioShadow), 0 10px 30px rgb(0 0 0 / 16%);
  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
  color: var(--el-text-color-primary); font-size: 12px; line-height: 1.5;
  user-select: none; -webkit-user-select: none;
  transform-origin: top right;
  animation: viewfinderEnter 200ms cubic-bezier(0.16, 1, 0.3, 1);
  transition: box-shadow 180ms ease;
  &.leftHalf { transform-origin: top left; }
  &.moving { box-shadow: var(--studioShadow), 0 16px 40px rgb(0 0 0 / 24%); }
  * { box-sizing: border-box; }
  button { display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 0; border: 0; border-radius: 6px; background: transparent; color: inherit; font: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background-color 160ms ease, color 160ms ease, opacity 160ms ease;
    &:hover:not(:disabled) { background: var(--studioHoverBackground); }
    &:active:not(:disabled) { background: var(--studioPressedBackground); }
    &:disabled { opacity: 0.4; cursor: default; }
    &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
  }

  .viewfinderHeader { display: flex; align-items: center; gap: 6px; height: 28px; padding-left: 6px; cursor: grab; touch-action: none; }
  &.moving .viewfinderHeader { cursor: grabbing; }
  .cameraDot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; background: var(--cameraColor); box-shadow: 0 0 0 2px color-mix(in srgb, var(--cameraColor) 24%, transparent); }
  .cameraName { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
  .formatChip { flex-shrink: 0; height: 18px; padding: 0 6px; border: 0; border-radius: 999px; background: var(--studioControlBackground); color: var(--el-text-color-regular); font-size: 10px; font-weight: 600; line-height: 18px; cursor: pointer; font-variant-numeric: tabular-nums;
    &:hover:not(:disabled) { color: var(--el-color-primary); }
  }
  .rangeChip { flex-shrink: 0; padding: 0 6px; border-radius: 999px; background: var(--studioControlBackground); color: var(--el-text-color-secondary); font-size: 10px; line-height: 18px; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .keyNav { flex-shrink: 0; display: inline-flex; align-items: center; gap: 1px; margin-left: auto; padding: 2px; border-radius: 8px; background: var(--studioControlBackground);
    > button { width: 22px; height: 20px; color: var(--el-text-color-regular); }
  }
  .keyToggle { > i { display: block; width: 9px; height: 9px; border: 1.5px solid var(--cameraColor); border-radius: 2px; transform: rotate(45deg); transition: background-color 140ms ease, transform 140ms ease; }
    &.on > i { background: var(--cameraColor); transform: rotate(45deg) scale(1.15); }
  }
  .recButton { flex-shrink: 0; gap: 5px; height: 24px; min-width: 24px; padding: 0 6px; border-radius: 12px; color: var(--el-color-danger); font-size: 11px; font-weight: 600;
    > i { width: 10px; height: 10px; border-radius: 50%; background: var(--el-color-danger); box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-danger) 25%, transparent); }
    &.on { color: #fff; background: var(--el-color-danger); > i { background: #fff; border-radius: 2px; animation: viewfinderRecording 1s ease-in-out infinite; } }
  }
  .liveButton { flex-shrink: 0; height: 22px; padding: 0 8px; border-radius: 6px; background: var(--studioControlBackground); color: var(--el-text-color-regular); font-size: 11px; font-weight: 600;
    &.on { background: var(--el-color-danger); color: #fff; opacity: 1 !important; }
  }
  &.rec { outline: 2px solid var(--el-color-danger); }
  .framingToggle { flex-shrink: 0; display: inline-flex; gap: 1px; margin-left: auto; padding: 2px; border-radius: 8px; background: var(--studioControlBackground);
    > button { position: relative; height: 20px; padding: 0 7px; color: var(--el-text-color-regular); font-size: 11px;
      &.active { background: var(--studioActiveBackground); color: var(--studioActiveText); }
    }
  }
  .moveMark { position: absolute; top: 3px; right: 2px; width: 4px; height: 4px; border-radius: 50%; background: var(--cameraColor); }
  .clearMove { flex-shrink: 0; width: 20px; height: 20px; margin-left: -3px; color: var(--el-text-color-secondary);
    &:hover:not(:disabled) { color: var(--el-color-danger); }
  }

  .pictureFrame { position: relative; }
  .viewfinderPicture { position: relative; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 9px; background: #000; cursor: grab; touch-action: none;
    &.truck { cursor: grabbing; }
    &.look { cursor: crosshair; }
    > canvas { display: block; width: 100%; height: 100%; }
  }
  &.disabled .viewfinderPicture { cursor: default; }
  // 竖屏短剧安全区：上约9%、下约22%、左右约6%会被平台的标题、文案、点赞按钮挡住。
  .safeArea { position: absolute; top: 9%; bottom: 22%; left: 6%; right: 6%; border: 1px dashed rgb(255 255 255 / 55%); border-radius: 3px; pointer-events: none; }
  .frameMarks { position: absolute; inset: 8px; --mark: rgb(255 255 255 / 72%); pointer-events: none; filter: drop-shadow(0 0 1px rgb(0 0 0 / 60%));
    background:
      linear-gradient(var(--mark) 0 0) left top / 14px 1.5px,
      linear-gradient(var(--mark) 0 0) left top / 1.5px 14px,
      linear-gradient(var(--mark) 0 0) right top / 14px 1.5px,
      linear-gradient(var(--mark) 0 0) right top / 1.5px 14px,
      linear-gradient(var(--mark) 0 0) left bottom / 14px 1.5px,
      linear-gradient(var(--mark) 0 0) left bottom / 1.5px 14px,
      linear-gradient(var(--mark) 0 0) right bottom / 14px 1.5px,
      linear-gradient(var(--mark) 0 0) right bottom / 1.5px 14px;
    background-repeat: no-repeat;
    transition: inset 180ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  &.gesturing .frameMarks { inset: 5px; --mark: var(--cameraColor); }
  .viewfinderCaption.portrait { bottom: 23%; }
  .viewfinderCaption { position: absolute; left: 8%; right: 8%; bottom: 10px; text-align: center; color: #fff; font-size: 12px; line-height: 1.4; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9), 0 0 4px rgba(0, 0, 0, 0.7); pointer-events: none; }
  .recordingDot { position: absolute; top: 14px; left: 14px; width: 7px; height: 7px; border-radius: 50%; background: var(--el-color-danger); box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-danger) 30%, transparent); pointer-events: none; animation: viewfinderRecording 1.2s ease-in-out infinite; }
  .readouts { position: absolute; left: 12px; bottom: 10px; display: flex; flex-wrap: wrap; align-items: center; gap: 3px; max-width: calc(100% - 140px); }
  .opticChip { display: inline-flex; align-items: center; gap: 3px; height: 16px; padding: 0 5px; border-radius: 4px; background: rgb(0 0 0 / 40%); color: rgb(255 255 255 / 80%); font-size: 10px; line-height: 16px; font-variant-numeric: tabular-nums; white-space: nowrap;
    &.manual { color: #fff; background: color-mix(in srgb, var(--cameraColor) 55%, rgb(0 0 0 / 50%)); }
    &.keyChip { color: #fff; background: color-mix(in srgb, var(--cameraColor) 45%, rgb(0 0 0 / 55%)); pointer-events: none;
      > i { width: 6px; height: 6px; border-radius: 1px; background: currentColor; transform: rotate(45deg); }
    }
    &.live, &.active { color: #fff; background: color-mix(in srgb, var(--cameraColor) 80%, #000); }
    &:is(button):hover:not(:disabled) { background: rgb(0 0 0 / 62%); color: #fff; }
  }
  .apertureMenu { position: absolute; left: 10px; bottom: 30px; z-index: 2; display: grid; grid-template-columns: repeat(5, auto); gap: 2px; padding: 4px; border-radius: 9px; background: var(--el-bg-color-overlay); outline: 1px solid var(--studioBorderColor); outline-offset: -1px; box-shadow: 0 10px 28px rgb(0 0 0 / 22%); color: var(--el-text-color-regular); animation: viewfinderPop 140ms cubic-bezier(0.16, 1, 0.3, 1); transform-origin: left bottom;
    > button { height: 22px; padding: 0 7px; font-size: 11px; font-variant-numeric: tabular-nums; &.active { color: var(--studioActiveText); background: var(--studioActiveBackground); } }
    > button:first-child { grid-column: 1 / -1; }
  }
  .trackChip { position: absolute; top: 10px; right: 10px; display: inline-flex; align-items: center; gap: 3px; max-width: 60%; height: 20px; padding: 0 2px 0 6px; border-radius: 10px; background: color-mix(in srgb, var(--cameraColor) 72%, #000); color: #fff; font-size: 10px;
    > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    > button { height: 16px; padding: 0 5px; border-radius: 8px; background: rgb(255 255 255 / 18%); font-size: 10px; &:hover:not(:disabled) { background: rgb(255 255 255 / 30%); } }
    > button:last-child { width: 16px; padding: 0; background: transparent; }
    &.follow { background: color-mix(in srgb, var(--el-color-danger) 70%, #000); }
    > .gimbalToggle { width: 16px; padding: 0; background: transparent; display: grid; place-items: center; }
  }
  .pickHint { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 6px; background: rgb(0 0 0 / 38%); color: #fff; font-size: 12px; pointer-events: none; animation: viewfinderPulse 1.4s ease-in-out infinite; }
  .horizon { position: absolute; left: 30%; right: 30%; top: 50%; height: 0; border-top: 1px dashed rgb(255 255 255 / 70%); pointer-events: none; filter: drop-shadow(0 0 1px rgb(0 0 0 / 60%));
    &::before, &::after { content: ""; position: absolute; top: -4px; width: 1px; height: 7px; background: rgb(255 255 255 / 70%); }
    &::before { left: 0; } &::after { right: 0; }
  }
  .focusMark { position: absolute; width: 34px; height: 34px; margin: -17px 0 0 -17px; border: 1.5px solid #ffd54a; border-radius: 4px; pointer-events: none; animation: viewfinderFocus 900ms ease-out forwards; }
  .programBadge { flex-shrink: 0; padding: 0 5px; border-radius: 4px; background: var(--el-color-danger); color: #fff; font-size: 10px; font-weight: 600; line-height: 16px; }
  &.monitor .viewfinderPicture { cursor: default; }
  &.picking { outline: 2px solid var(--cameraColor); }
  .focalReadout.focalButton { border: 0; pointer-events: auto; cursor: pointer; &:hover:not(:disabled) { background: rgb(0 0 0 / 60%); color: #fff; } }
  .focalReadout { padding: 0 5px; border-radius: 4px; background: rgb(0 0 0 / 40%); color: rgb(255 255 255 / 88%); font-size: 10px; line-height: 16px; font-variant-numeric: tabular-nums; pointer-events: none; transform-origin: left bottom; transition: background-color 160ms ease, color 160ms ease, transform 160ms ease;
    &.live { background: color-mix(in srgb, var(--cameraColor) 72%, #000); color: #fff; transform: scale(1.08); }
  }

  .pictureActions { position: absolute; right: 8px; bottom: 8px; display: flex; gap: 2px; padding: 2px; border-radius: 8px; background: rgb(0 0 0 / 46%); color: #fff; opacity: 0; transform: translateY(3px); pointer-events: none; transition: opacity 160ms ease, transform 160ms ease;
    > button { width: 24px; height: 24px;
      &:hover:not(:disabled) { background: rgb(255 255 255 / 18%); }
      &:active:not(:disabled) { background: rgb(255 255 255 / 26%); }
      &.active { background: rgb(255 255 255 / 24%); }
    }
  }
  &:hover .pictureActions { opacity: 1; transform: none; pointer-events: auto; }
  &.gesturing .pictureActions { opacity: 0; pointer-events: none; }
  .resizeGrip { position: absolute; z-index: 1; bottom: 0; left: 0; width: 18px; height: 18px; cursor: nesw-resize; touch-action: none;
    &::after { content: ""; position: absolute; left: 3px; bottom: 3px; width: 10px; height: 10px; border-bottom: 2px solid; border-left: 2px solid; border-bottom-left-radius: 9px; color: rgb(255 255 255 / 78%); opacity: 0; transition: opacity 160ms ease; }
  }
  &.leftHalf .resizeGrip { left: auto; right: 0; cursor: nwse-resize;
    &::after { left: auto; right: 3px; border-left: 0; border-right: 2px solid; border-bottom-left-radius: 0; border-bottom-right-radius: 9px; }
  }
  &:hover .resizeGrip::after, &.resizing .resizeGrip::after { opacity: 1; }
  &.gesturing .resizeGrip::after { opacity: 0; }
}
// 键盘聚焦时按钮也要露出来；:has 不被支持时整条规则失效，所以单独写。
.cameraViewfinder .pictureActions:has(:focus-visible) { opacity: 1; transform: none; pointer-events: auto; }

@keyframes viewfinderEnter { from { opacity: 0; transform: scale(0.94); } }
@keyframes viewfinderPop { from { opacity: 0; transform: scale(0.95); } }
@keyframes viewfinderRecording { 50% { opacity: 0.3; } }
@keyframes viewfinderPulse { 50% { opacity: 0.6; } }
@keyframes viewfinderFocus { 0% { transform: scale(1.5); opacity: 0; } 25% { transform: scale(1); opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .cameraViewfinder, .cameraViewfinder .recordingDot, .cameraViewfinder .pickHint { animation: none; }
  .cameraViewfinder, .cameraViewfinder button, .cameraViewfinder .frameMarks, .cameraViewfinder .focalReadout, .cameraViewfinder .pictureActions, .cameraViewfinder .resizeGrip::after { transition: none; }
}
</style>

<style lang="scss">
/* 成片画幅弹层：每项前面画一个按比例的小框。 */
.filmFormatPopover.el-popover.el-popper { padding: 6px; }
.filmFormatPopover .filmFormats { display: grid; gap: 2px;
  button { display: flex; align-items: center; gap: 8px; height: 30px; padding: 0 8px; border: 0; border-radius: 6px; background: transparent; color: var(--el-text-color-regular); font-size: 12px; text-align: left; cursor: pointer;
    i { display: block; width: 22px; max-height: 20px; border: 1.5px solid currentColor; border-radius: 2px; flex-shrink: 0; }
    &:hover { background: var(--el-fill-color-light); }
    &.active { color: var(--el-color-primary); font-weight: 600; }
  }
  button i[style*="0.5625"] { width: 11px; }
}
/* 云台手感、手持弹层（Element Plus 弹层挂在 body 上，不能用 scoped 样式）。 */
.cameraFeelPopover.el-popover.el-popper { padding: 8px 12px; }
.cameraFeelPopover .feelRows { display: grid; gap: 2px; font-size: 12px; }
.cameraFeelPopover .feelRow { display: grid; grid-template-columns: 30px minmax(0, 1fr) 40px; align-items: center; gap: 8px; min-height: 30px;
  > span { color: var(--el-text-color-regular); }
  > output { color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums; text-align: right; }
  .el-slider { --el-slider-height: 4px; --el-slider-button-size: 12px; height: 28px; margin-inline: 6px; }
}
</style>

<style lang="scss">
.cameraFeelPopover .cameraMoves { display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: 8px; align-items: start; margin-bottom: 6px; font-size: 12px;
  > div { display: flex; flex-wrap: wrap; gap: 4px; }
  button { padding: 2px 7px; border: 0; border-radius: 10px; background: var(--el-fill-color-light); color: var(--el-text-color-regular); font-size: 11px; cursor: pointer; &:hover { color: var(--el-color-primary); } }
}
</style>
