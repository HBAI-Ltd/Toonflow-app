<template>
  <div ref="viewport" class="multiAngleStage nodrag nopan nowheel" @pointerdown.stop @mousedown.stop @wheel.stop @dblclick.stop>
    <canvas ref="canvas" aria-hidden="true" @webglcontextlost.prevent="finishDrag(); unavailable = true" @webglcontextrestored="restoreContext" />
    <template v-if="!unavailable">
      <template v-if="viewMode === 'orbit'">
        <span v-for="label in directionLabels" :key="label.text" class="directionLabel" :style="label.style">{{ label.text }}</span>
      </template>
      <button
        type="button"
        class="cameraHandle"
        :class="{ cameraViewHandle: viewMode === 'camera' }"
        :style="viewMode === 'orbit' ? handleStyle : undefined"
        :disabled="disabled"
        :aria-label="`相机，水平环绕 ${azimuth} 度，垂直俯仰 ${elevation} 度，距离 ${distance}；方向键调整角度，Shift 微调，加减键调整距离`"
        title="拖动调整相机角度；方向键调整，Shift 微调，加减键调整距离"
        @pointerdown.stop.prevent="startDrag"
        @pointermove="moveDrag"
        @pointerup="finishDrag"
        @pointercancel="finishDrag"
        @lostpointercapture="finishDrag"
        @keydown="adjustCamera">
        <svg v-if="viewMode === 'camera'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <rect x="3" y="6" width="13" height="12" rx="2" />
          <path d="m16 10 5-3v10l-5-3" stroke-linejoin="round" />
        </svg>
        <span>相机</span>
      </button>
      <span v-if="imageLoading || imageFailed" class="imageStatus" role="status">{{ imageLoading ? '正在载入参考图…' : '参考图加载失败' }}</span>
      <span class="stageHint">{{ viewMode === 'orbit' ? '拖动相机改变角度 · 拖动空白旋转总览' : '仅显示原图平面透视 · 拖动相机图标调整机位' }}</span>
    </template>
    <div v-else class="stageFallback" role="status">3D 预览不可用，请使用角度控件调整相机</div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as three from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { getMultiAngleCameraPosition, multiAngleFocalLengths } from "../imageMultiAngle";

const props = defineProps<{
  src: string;
  azimuth: number;
  elevation: number;
  distance: number;
  lens: "standard" | "wide";
  viewMode: "orbit" | "camera";
  disabled?: boolean;
}>();
const emit = defineEmits<{
  "update:azimuth": [value: number];
  "update:elevation": [value: number];
  "update:distance": [value: number];
  aspectRatio: [value: number];
}>();
const viewport = ref<HTMLDivElement>();
const canvas = ref<HTMLCanvasElement>();
const unavailable = ref(false);
const imageLoading = ref(false);
const imageFailed = ref(false);
const handleStyle = ref<Record<string, string>>({ left: "50%", top: "50%" });
const directionLabels = ref<{ text: string; style: Record<string, string> }[]>([]);
const scene = new three.Scene();
const overviewCamera = new three.PerspectiveCamera(42, 1, 0.1, 100);
const targetCamera = new three.PerspectiveCamera(40, 1, 0.05, 100);
const frustumCamera = new three.PerspectiveCamera(40, 1, 0.18, 4.8);
const imageMaterial = new three.MeshBasicMaterial({ color: 0xcbd5e1, side: three.FrontSide, toneMapped: false });
const imagePlane = new three.Mesh(new three.PlaneGeometry(1, 1), imageMaterial);
const imageBack = new three.Mesh(new three.PlaneGeometry(1, 1), new three.MeshBasicMaterial({ color: 0x64748b, side: three.BackSide, toneMapped: false }));
imagePlane.add(imageBack);
const frame = new three.LineLoop(
  new three.BufferGeometry().setFromPoints([
    new three.Vector3(-0.505, -0.505, 0), new three.Vector3(0.505, -0.505, 0),
    new three.Vector3(0.505, 0.505, 0), new three.Vector3(-0.505, 0.505, 0),
  ]),
  new three.LineBasicMaterial({ color: 0x64748b })
);
scene.add(imagePlane, frame);

const guides = new three.Group();
const grid = new three.GridHelper(2, 16, 0x94a3b8, 0x94a3b8);
grid.material.transparent = true;
grid.material.opacity = 0.15;
grid.position.y = -1.6;
const orbitRing = new three.Mesh(new three.TorusGeometry(1, 0.003, 6, 100), new three.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.55 }));
orbitRing.rotation.x = Math.PI / 2;
const verticalRing = new three.Mesh(new three.TorusGeometry(1, 0.002, 6, 100), new three.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.2 }));
guides.add(grid, orbitRing, verticalRing);
scene.add(guides);

const cameraModel = new three.Group();
const cameraBody = new three.Mesh(new three.BoxGeometry(0.48, 0.34, 0.28), new three.MeshBasicMaterial({ color: 0x0284c7 }));
const cameraLens = new three.Mesh(new three.CylinderGeometry(0.12, 0.16, 0.24, 20), new three.MeshBasicMaterial({ color: 0x38bdf8 }));
cameraLens.rotation.x = Math.PI / 2;
cameraLens.position.z = -0.23;
const viewfinder = new three.Mesh(new three.BoxGeometry(0.18, 0.09, 0.16), new three.MeshBasicMaterial({ color: 0x0369a1 }));
viewfinder.position.set(-0.06, 0.21, 0);
cameraModel.add(cameraBody, cameraLens, viewfinder);
cameraModel.scale.setScalar(1.4);
const cameraFrustum = new three.CameraHelper(frustumCamera);
const frustumColor = new three.Color(0x38bdf8);
cameraFrustum.setColors(frustumColor, frustumColor, frustumColor, frustumColor, frustumColor);
for (const material of Array.isArray(cameraFrustum.material) ? cameraFrustum.material : [cameraFrustum.material]) {
  material.transparent = true;
  material.opacity = 0.28;
}
scene.add(cameraModel, cameraFrustum);

let renderer: three.WebGLRenderer | undefined;
let controls: OrbitControls | undefined;
let resizeObserver: ResizeObserver | undefined;
let texture: three.Texture | undefined;
let imageVersion = 0;
let renderFrame = 0;
let disposed = false;
let overviewRadius = 4.8;
let drag: { handle: HTMLButtonElement; pointerId: number; x: number; y: number; azimuth: number; elevation: number } | undefined;

function project(position: three.Vector3) {
  const point = position.clone().project(overviewCamera);
  return { left: `${(point.x + 1) * 50}%`, top: `${(1 - point.y) * 50}%`, visibility: point.z > 1 || point.z < -1 ? "hidden" : "visible" };
}

function render() {
  renderFrame = 0;
  if (!renderer || !viewport.value || unavailable.value || disposed) return;
  const { clientWidth: width, clientHeight: height } = viewport.value;
  if (!width || !height) return;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  if (renderer.getPixelRatio() !== pixelRatio) renderer.setPixelRatio(pixelRatio);
  const size = renderer.getSize(new three.Vector2());
  if (size.x !== width || size.y !== height) renderer.setSize(width, height, false);
  const distance = three.MathUtils.clamp(Number.isFinite(props.distance) ? props.distance : 4.8, 2, 10);
  targetCamera.position.copy(getMultiAngleCameraPosition(props));
  targetCamera.lookAt(0, 0, 0);
  targetCamera.aspect = overviewCamera.aspect = frustumCamera.aspect = width / height;
  targetCamera.setFocalLength(multiAngleFocalLengths[props.lens]);
  targetCamera.updateMatrixWorld();
  overviewCamera.updateProjectionMatrix();
  overviewCamera.updateMatrixWorld();
  frustumCamera.position.copy(targetCamera.position);
  frustumCamera.quaternion.copy(targetCamera.quaternion);
  frustumCamera.fov = targetCamera.fov;
  frustumCamera.far = distance;
  frustumCamera.updateProjectionMatrix();
  frustumCamera.updateMatrixWorld();
  cameraFrustum.update();
  cameraModel.position.copy(targetCamera.position);
  cameraModel.quaternion.copy(targetCamera.quaternion);
  const overview = props.viewMode === "orbit";
  guides.visible = cameraModel.visible = cameraFrustum.visible = overview;
  orbitRing.scale.setScalar(distance);
  verticalRing.scale.setScalar(distance);
  grid.scale.set(distance + 0.6, 1, distance + 0.6);
  handleStyle.value = project(targetCamera.position);
  directionLabels.value = [
    { text: "原始机位 · 0°", style: project(new three.Vector3(0, -0.3, 4.8)) },
    { text: "后方 · 180°", style: project(new three.Vector3(0, -0.3, -distance - 0.25)) },
    { text: "原图左 · −90°", style: project(new three.Vector3(-distance - 0.25, -0.3, 0)) },
    { text: "原图右 · 90°", style: project(new three.Vector3(distance + 0.25, -0.3, 0)) },
  ];
  // ACT: 单张图片只表示参考平面，背面用纯色避免镜像误导；主体的新视角仍由生成模型补全。
  renderer.render(scene, overview ? overviewCamera : targetCamera);
}

function scheduleRender() {
  if (!renderFrame && !disposed) renderFrame = requestAnimationFrame(render);
}

function setDirection(azimuth: number, elevation: number) {
  emit("update:azimuth", Math.round(((azimuth + 180) % 360 + 360) % 360 - 180));
  emit("update:elevation", Math.round(three.MathUtils.clamp(elevation, -80, 80)));
}

function startDrag(event: PointerEvent) {
  if (props.disabled || event.button !== 0 || drag) return;
  const handle = event.currentTarget as HTMLButtonElement;
  handle.focus();
  handle.setPointerCapture(event.pointerId);
  drag = { handle, pointerId: event.pointerId, x: event.clientX, y: event.clientY, azimuth: props.azimuth, elevation: props.elevation };
  if (controls) controls.enabled = false;
}

function moveDrag(event: PointerEvent) {
  if (!drag || drag.pointerId !== event.pointerId || props.disabled) return;
  event.preventDefault();
  // ACT: 拖动直接映射角度，避免在轨道背面拾取时跳到正面；总览旋转不改变角度约定。
  setDirection(drag.azimuth + (event.clientX - drag.x) * 0.8, drag.elevation - (event.clientY - drag.y) * 0.6);
}

function finishDrag(event?: PointerEvent) {
  if (!drag || (event && drag.pointerId !== event.pointerId)) return;
  const { pointerId, handle } = drag;
  drag = undefined;
  if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
  if (controls) controls.enabled = !props.disabled && props.viewMode === "orbit";
}

function adjustCamera(event: KeyboardEvent) {
  if (props.disabled || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "PageUp", "PageDown"].includes(event.key)) return;
  event.preventDefault();
  event.stopPropagation();
  if (["+", "=", "-", "PageUp", "PageDown"].includes(event.key)) {
    const direction = ["+", "=", "PageUp"].includes(event.key) ? -1 : 1;
    emit("update:distance", Math.round(three.MathUtils.clamp(props.distance + direction * (event.shiftKey ? 0.1 : 0.5), 2, 10) * 10) / 10);
    return;
  }
  const step = event.shiftKey ? 1 : 5;
  setDirection(
    props.azimuth + (event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0),
    props.elevation + (event.key === "ArrowUp" ? step : event.key === "ArrowDown" ? -step : 0)
  );
}

function loadImage() {
  const version = ++imageVersion;
  texture?.dispose();
  texture = undefined;
  imageMaterial.map = null;
  imageMaterial.color.set(0xcbd5e1);
  imageMaterial.needsUpdate = true;
  imagePlane.scale.set(2.7, 1.8, 1);
  frame.scale.copy(imagePlane.scale);
  imageFailed.value = false;
  imageLoading.value = !!props.src;
  scheduleRender();
  if (!props.src) return;
  new three.TextureLoader().load(props.src, loaded => {
    if (disposed || version !== imageVersion) { loaded.dispose(); return; }
    texture = loaded;
    loaded.colorSpace = three.SRGBColorSpace;
    const image = loaded.image as HTMLImageElement;
    const ratio = image.naturalWidth / image.naturalHeight;
    emit("aspectRatio", ratio);
    imagePlane.scale.set(ratio >= 1 ? 2.7 : 2.7 * ratio, ratio >= 1 ? 2.7 / ratio : 2.7, 1);
    frame.scale.copy(imagePlane.scale);
    imageMaterial.map = loaded;
    imageMaterial.color.set(0xffffff);
    imageMaterial.needsUpdate = true;
    imageLoading.value = false;
    scheduleRender();
  }, undefined, () => {
    if (disposed || version !== imageVersion) return;
    imageLoading.value = false;
    imageFailed.value = true;
  });
}

function restoreContext() {
  unavailable.value = false;
  scheduleRender();
}

onMounted(() => {
  try {
    renderer = new three.WebGLRenderer({ canvas: canvas.value, alpha: true, antialias: true });
    renderer.outputColorSpace = three.SRGBColorSpace;
    overviewRadius = three.MathUtils.clamp(Number.isFinite(props.distance) ? props.distance : 4.8, 4.8, 10);
    overviewCamera.position.set(7.4, 5.4, 10.2).multiplyScalar(overviewRadius / 4.8);
    controls = new OrbitControls(overviewCamera, canvas.value!);
    controls.enablePan = false;
    controls.enableDamping = false;
    controls.minDistance = 5;
    controls.maxDistance = 40;
    controls.minPolarAngle = 0.15;
    controls.maxPolarAngle = Math.PI - 0.15;
    controls.enabled = !props.disabled && props.viewMode === "orbit";
    controls.update();
    controls.addEventListener("change", scheduleRender);
    resizeObserver = new ResizeObserver(scheduleRender);
    resizeObserver.observe(viewport.value!);
    window.addEventListener("resize", scheduleRender);
  } catch {
    unavailable.value = true;
  }
  loadImage();
});

watch(() => props.src, loadImage);
watch(() => [props.azimuth, props.elevation, props.distance, props.lens, props.viewMode], scheduleRender);
watch(() => props.distance, distance => {
  const radius = three.MathUtils.clamp(Number.isFinite(distance) ? distance : 4.8, 4.8, 10);
  overviewCamera.position.multiplyScalar(radius / overviewRadius);
  overviewRadius = radius;
  controls?.update();
});
watch(() => [props.disabled, props.viewMode], () => {
  finishDrag();
  if (controls) controls.enabled = !props.disabled && props.viewMode === "orbit";
});

onBeforeUnmount(() => {
  disposed = true;
  imageVersion++;
  finishDrag();
  cancelAnimationFrame(renderFrame);
  resizeObserver?.disconnect();
  window.removeEventListener("resize", scheduleRender);
  controls?.dispose();
  texture?.dispose();
  scene.traverse(object => {
    if (!(object instanceof three.Mesh || object instanceof three.Line)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach(material => material.dispose());
  });
  renderer?.dispose();
  renderer?.forceContextLoss();
});
</script>

<style scoped lang="scss">
.multiAngleStage {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: radial-gradient(ellipse at 45% 35%, var(--el-bg-color-overlay), var(--el-fill-color-light));

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
  }
  .stageHint,
  .directionLabel {
    position: absolute;
    pointer-events: none;
    color: var(--el-text-color-secondary);
    font-size: 10px;
  }
  .stageHint {
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    max-width: calc(100% - 24px);
    padding: 3px 8px;
    border-radius: 6px;
    background: color-mix(in srgb, var(--el-bg-color-overlay), transparent 15%);
    text-align: center;
    white-space: nowrap;
  }
  .directionLabel { transform: translate(-50%, -50%); }
  .cameraHandle {
    position: absolute;
    width: 36px;
    height: 36px;
    padding: 7px;
    transform: translate(-50%, -50%);
    border: 1px solid #38bdf8;
    border-radius: 10px;
    background: transparent;
    color: #0284c7;
    box-shadow: 0 0 0 4px #38bdf81a;
    cursor: grab;
    touch-action: none;

    svg { display: block; width: 100%; height: 100%; pointer-events: none; }
    span {
      position: absolute;
      top: 100%;
      left: 50%;
      margin-top: 5px;
      transform: translateX(-50%);
      padding: 2px 5px;
      border-radius: 4px;
      background: var(--el-bg-color-overlay);
      color: var(--el-text-color-secondary);
      font-size: 10px;
      white-space: nowrap;
    }
    &.cameraViewHandle {
      left: 30px;
      top: 30px;
      background: color-mix(in srgb, var(--el-bg-color-overlay), transparent 10%);
    }
    &:active { cursor: grabbing; }
    &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; }
    &:disabled { cursor: default; opacity: 0.5; }
  }
  .imageStatus,
  .stageFallback {
    position: absolute;
    left: 20px;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    text-align: center;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    pointer-events: none;
  }
}
</style>
