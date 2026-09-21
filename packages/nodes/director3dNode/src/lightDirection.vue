<template>
  <div class="directionControl">
    <div ref="viewport" class="directionViewport">
      <canvas ref="canvas" aria-hidden="true" />
      <span v-for="label in directionLabels" :key="label.text" class="sceneLabel" :style="label.style">{{ label.text }}</span>
      <button
        v-for="handle in handles"
        :key="handle.kind"
        class="directionHandle"
        :class="handle.kind"
        :style="handle.style"
        type="button"
        :aria-label="handle.kind === 'azimuth' ? '拖动调整水平方位' : '拖动调整光线高度'"
        @pointerdown="startDrag($event, handle.kind)"
        @pointermove="moveDrag"
        @pointerup="finishDrag"
        @pointercancel="finishDrag"
        @lostpointercapture="finishDrag"
        @keydown="adjustDirection($event, handle.kind)" />
    </div>
    <div class="elevationControl">
      <span>高度</span>
      <el-slider v-model="elevation" vertical height="160px" :min="-90" :max="90" aria-label="光线高度" @change="commit" />
      <span>{{ Math.round(elevation) }}°</span>
    </div>
    <div class="angleControl">
      <div class="angleLabel">
        <span class="azimuthLabel">水平方位 · {{ directionLabel }}</span>
        <span>{{ Math.round(relativeAngle) }}°</span>
      </div>
      <el-slider
        :modelValue="relativeAngle"
        :min="0"
        :max="360"
        aria-label="水平方位"
        @update:modelValue="setAngle('azimuth', Number($event))"
        @change="commit" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElSlider } from "element-plus";
import {
  ArrowHelper,
  BufferGeometry,
  GridHelper,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Scene,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

const { referenceAzimuth } = defineProps<{ referenceAzimuth: number }>();
const azimuth = defineModel<number>("azimuth", { required: true });
const elevation = defineModel<number>("elevation", { required: true });
const emit = defineEmits<{ change: [value: { azimuth: number; elevation: number }] }>();
type AngleKind = "azimuth" | "elevation";
const canvas = ref<HTMLCanvasElement>();
const viewport = ref<HTMLDivElement>();
const handles = ref<{ kind: AngleKind; style: { left: string; top: string } }[]>([]);
const directionLabels = ref<{ text: string; style: { left: string; top: string } }[]>([]);
const relativeAngle = computed(() => (((azimuth.value - referenceAzimuth) % 360) + 360) % 360);
const directionLabel = computed(() => ["前方", "右侧", "后方", "左侧"][Math.round(relativeAngle.value / 90) % 4]);
const radius = 1.65;
const arcX = -2;
const scene = new Scene();
const camera = new PerspectiveCamera(40, 1, 0.1, 30);
const raycaster = new Raycaster();
const azimuthPlane = new Plane(new Vector3(0, 1, 0), 0);
const elevationPlane = new Plane(new Vector3(1, 0, 0), -arcX);
let renderer: WebGLRenderer | undefined;
let resizeObserver: ResizeObserver | undefined;
let sun: Mesh;
let lightRay: ArrowHelper;
let heightGuide: Line;
let drag: { pointerId: number; kind: AngleKind; offset: number } | undefined;

function setAngle(kind: AngleKind, angle: number) {
  if (kind === "azimuth") azimuth.value = (((referenceAzimuth + angle) % 360) + 360) % 360;
  else elevation.value = Math.max(-90, Math.min(90, angle));
}

function commit() {
  emit("change", { azimuth: azimuth.value, elevation: elevation.value });
}

function project(position: Vector3) {
  const point = position.clone().project(camera);
  return { left: `${(point.x + 1) * 50}%`, top: `${(1 - point.y) * 50}%` };
}

function render() {
  if (!renderer) return;
  const horizontal = (relativeAngle.value * Math.PI) / 180;
  const vertical = (elevation.value * Math.PI) / 180;
  sun.position.set(
    radius * Math.cos(vertical) * Math.sin(horizontal),
    radius * Math.sin(vertical),
    radius * Math.cos(vertical) * Math.cos(horizontal)
  );
  lightRay.position.copy(sun.position);
  lightRay.setDirection(sun.position.clone().normalize().negate());
  heightGuide.geometry.setFromPoints([sun.position, new Vector3(sun.position.x, 0, sun.position.z), new Vector3()]);
  handles.value = [
    { kind: "azimuth", style: project(new Vector3(radius * Math.sin(horizontal), 0, radius * Math.cos(horizontal))) },
    { kind: "elevation", style: project(new Vector3(arcX, radius * Math.sin(vertical), radius * Math.cos(vertical))) },
  ];
  directionLabels.value = [
    { text: "前", style: project(new Vector3(0, 0, 2)) },
    { text: "后", style: project(new Vector3(0, 0, -2)) },
    { text: "上", style: project(new Vector3(arcX, 1.95, 0)) },
    { text: "下", style: project(new Vector3(arcX, -1.95, 0)) },
  ];
  renderer.render(scene, camera);
}

function pointerAngle(event: PointerEvent, kind: AngleKind) {
  const bounds = canvas.value!.getBoundingClientRect();
  raycaster.setFromCamera(
    new Vector2(((event.clientX - bounds.left) / bounds.width) * 2 - 1, 1 - ((event.clientY - bounds.top) / bounds.height) * 2),
    camera
  );
  const point = raycaster.ray.intersectPlane(kind === "azimuth" ? azimuthPlane : elevationPlane, new Vector3());
  if (!point) return;
  const first = kind === "azimuth" ? point.x : point.y;
  if (Math.hypot(first, point.z) < 0.05) return;
  return (Math.atan2(first, point.z) * 180) / Math.PI;
}

function startDrag(event: PointerEvent, kind: AngleKind) {
  if (event.button !== 0) return;
  const angle = pointerAngle(event, kind);
  if (angle == null) return;
  const button = event.currentTarget as HTMLButtonElement;
  button.focus();
  button.setPointerCapture(event.pointerId);
  drag = { pointerId: event.pointerId, kind, offset: (kind === "azimuth" ? relativeAngle.value : elevation.value) - angle };
  event.preventDefault();
  event.stopPropagation();
}

function moveDrag(event: PointerEvent) {
  if (!drag || drag.pointerId !== event.pointerId) return;
  const angle = pointerAngle(event, drag.kind);
  if (angle == null) return;
  const value = angle + drag.offset;
  // 高度弧只取朝前的半圆，拖出弧线后停在顶光或底光。
  setAngle(drag.kind, drag.kind === "elevation" ? ((value + 540) % 360) - 180 : value);
}

function finishDrag(event: PointerEvent) {
  if (!drag || drag.pointerId !== event.pointerId) return;
  drag = undefined;
  commit();
  const button = event.currentTarget as HTMLButtonElement;
  if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
}

function adjustDirection(event: KeyboardEvent, kind: AngleKind) {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
  event.preventDefault();
  event.stopPropagation();
  const step = (event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : -1) * (event.shiftKey ? 1 : 5);
  setAngle(kind, (kind === "azimuth" ? relativeAngle.value : elevation.value) + step);
  commit();
}

onMounted(() => {
  renderer = new WebGLRenderer({ canvas: canvas.value, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  camera.position.set(5, 3.6, 6);
  camera.lookAt(-0.35, 0, 0);
  camera.updateMatrixWorld();
  const grid = new GridHelper(4.5, 10, 0x697586, 0x697586);
  grid.position.y = -0.85;
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  scene.add(grid);
  scene.add(new Mesh(new SphereGeometry(0.055, 12, 8), new MeshBasicMaterial({ color: 0x8d9db7 })));
  const ring = new Mesh(new TorusGeometry(radius, 0.018, 6, 96), new MeshBasicMaterial({ color: 0x38bd83 }));
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);
  const arc = Array.from({ length: 65 }, (_, index) => {
    const angle = -Math.PI / 2 + (index / 64) * Math.PI;
    return new Vector3(arcX, radius * Math.sin(angle), radius * Math.cos(angle));
  });
  scene.add(new Line(new BufferGeometry().setFromPoints(arc), new LineBasicMaterial({ color: 0xed79b0 })));
  sun = new Mesh(new SphereGeometry(0.12, 16, 12), new MeshBasicMaterial({ color: 0xffcc55 }));
  lightRay = new ArrowHelper(new Vector3(0, -1, 0), new Vector3(), radius - 0.35, 0xffcc55, 0.18, 0.1);
  heightGuide = new Line(
    new BufferGeometry().setFromPoints([new Vector3(), new Vector3(), new Vector3()]),
    new LineBasicMaterial({ color: 0xffcc55, transparent: true, opacity: 0.35 })
  );
  scene.add(sun, lightRay, heightGuide);
  resizeObserver = new ResizeObserver(() => {
    const { width, height } = viewport.value!.getBoundingClientRect();
    if (!width || !height) return;
    renderer!.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  });
  resizeObserver.observe(viewport.value!);
});

watch([relativeAngle, elevation], render);

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  scene.traverse((object) => {
    if (object instanceof Mesh || object instanceof Line) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    }
  });
  renderer?.dispose();
});
</script>

<style lang="scss" scoped>
.directionControl {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 44px;
  gap: 4px 8px;

  .directionViewport {
    position: relative;
    height: 220px;
    border-radius: var(--el-border-radius-base);
    background: var(--el-fill-color-light);
    overflow: hidden;

    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
    .sceneLabel {
      position: absolute;
      transform: translate(-50%, 4px);
      color: var(--el-text-color-secondary);
      font-size: 11px;
      pointer-events: none;
    }
    .directionHandle {
      position: absolute;
      transform: translate(-50%, -50%);
      width: 26px;
      height: 26px;
      padding: 5px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      cursor: grab;
      touch-action: none;

      &::after {
        content: "";
        display: block;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        box-shadow: 0 0 0 2px var(--el-bg-color-overlay);
      }
      &.azimuth::after {
        background: #38bd83;
      }
      &.elevation::after {
        background: #ed79b0;
      }
      &:active {
        cursor: grabbing;
      }
      &:focus-visible {
        outline: 2px solid var(--el-color-primary);
      }
    }
  }

  .elevationControl {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 4px 0;
    color: #cc528d;
    font-size: 12px;
  }
  .angleControl {
    grid-column: 1 / -1;
    padding: 0 8px;
    .angleLabel {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      .azimuthLabel {
        color: #26996a;
      }
    }
  }
}
</style>
