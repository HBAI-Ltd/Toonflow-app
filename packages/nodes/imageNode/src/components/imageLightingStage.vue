<template>
  <div ref="viewport" class="lightingStage nodrag nopan nowheel" @pointerdown.stop @mousedown.stop @wheel.stop @dblclick.stop>
    <canvas ref="canvas" aria-hidden="true" @webglcontextlost.prevent="finishDrag(); unavailable = true" @webglcontextrestored="restoreContext" />
    <template v-if="!unavailable">
      <span v-for="label in directionLabels" :key="label.text" class="directionLabel" :style="label.style">{{ label.text }}</span>
      <button
        v-for="handle in lightHandles"
        :key="handle.kind"
        type="button"
        class="lightHandle"
        :class="{ activeLight: activeLight === handle.kind }"
        :style="handle.style"
        :disabled="disabled"
        :aria-label="`${handle.label}，水平方位 ${handle.azimuth} 度，俯仰 ${handle.elevation} 度；方向键调整，Shift 微调`"
        :aria-pressed="activeLight === handle.kind"
        title="拖动调整光位；方向键调整，Shift 微调"
        @click="emit('selectLight', handle.kind)"
        @pointerdown.stop.prevent="startDrag($event, handle.kind)"
        @pointermove="moveDrag"
        @pointerup="finishDrag"
        @pointercancel="finishDrag"
        @lostpointercapture="finishDrag"
        @keydown="adjustDirection($event, handle.kind)">
        <span>{{ handle.label }}</span>
      </button>
      <span v-if="imageFailed" class="imageError" role="status">参考图加载失败</span>
      <span class="stageHint">拖动光球调整光位 · 拖动空白旋转视角</span>
    </template>
    <div v-else class="stageFallback" role="status">3D 预览不可用，请使用角度控件调整光位</div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as three from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { getLightingPosition } from "../imageLighting";

const props = defineProps<{
  src: string;
  azimuth: number;
  elevation: number;
  brightness: number;
  lightColor: string;
  rimLight: boolean;
  rimAzimuth: number;
  rimElevation: number;
  rimBrightness: number;
  rimColor: string;
  activeLight: "key" | "rim";
  disabled?: boolean;
}>();
const emit = defineEmits<{
  "update:azimuth": [value: number];
  "update:elevation": [value: number];
  "update:rimAzimuth": [value: number];
  "update:rimElevation": [value: number];
  selectLight: [value: "key" | "rim"];
  aspectRatio: [value: number];
}>();
const viewport = ref<HTMLDivElement>();
const canvas = ref<HTMLCanvasElement>();
const unavailable = ref(false);
const imageFailed = ref(false);
const lightHandles = ref<{ kind: "key" | "rim"; label: string; azimuth: number; elevation: number; style: Record<string, string> }[]>([]);
const directionLabels = ref<{ text: string; style: { left: string; top: string } }[]>([]);
const radius = 1.75;
const scene = new three.Scene();
const camera = new three.PerspectiveCamera(43, 1, 0.1, 30);
const imageMaterial = new three.MeshStandardMaterial({ color: 0xcbd5e1, side: three.FrontSide, roughness: 1, emissive: 0xffffff, emissiveIntensity: 0.12 });
const imagePlane = new three.Mesh(new three.PlaneGeometry(1, 1), imageMaterial);
imagePlane.castShadow = true;
imagePlane.receiveShadow = true;
// ACT: 原图仅表示正面参考，背面使用中性材质，避免镜像贴图误导光位判断。
const imageBack = new three.Mesh(new three.PlaneGeometry(1, 1), new three.MeshStandardMaterial({ color: 0x64748b, side: three.BackSide, roughness: 1 }));
imageBack.castShadow = true;
imageBack.receiveShadow = true;
imagePlane.add(imageBack);
const frame = new three.Group();
const frameMaterial = new three.MeshStandardMaterial({ color: 0xb6c2d1, roughness: 0.45, metalness: 0.25 });
for (let index = 0; index < 4; index++) {
  const horizontal = index < 2;
  const edge = new three.Mesh(new three.BoxGeometry(horizontal ? 1.035 : 0.035, horizontal ? 0.035 : 1, 0.055), frameMaterial);
  edge.position.set(horizontal ? 0 : index === 2 ? -0.5 : 0.5, horizontal ? (index === 0 ? -0.5 : 0.5) : 0, 0);
  edge.castShadow = true;
  edge.receiveShadow = true;
  frame.add(edge);
}
const ground = new three.Mesh(new three.CircleGeometry(2.5, 80), new three.MeshStandardMaterial({ color: 0x637184, roughness: 0.95, side: three.DoubleSide, transparent: true, opacity: 0.7 }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.9;
ground.receiveShadow = true;
scene.add(imagePlane, frame, ground, new three.AmbientLight(0xffffff, 0.55));
const lightSources = (["key", "rim"] as const).map(kind => {
  const bulb = new three.Mesh(new three.SphereGeometry(0.09, 20, 12), new three.MeshBasicMaterial({ toneMapped: false, depthTest: false }));
  const glow = new three.Sprite(new three.SpriteMaterial({ transparent: true, depthWrite: false, depthTest: false, toneMapped: false }));
  glow.scale.setScalar(0.65);
  bulb.add(glow);
  bulb.renderOrder = 2;
  const lamp = new three.SpotLight(0xffffff, 0, 0, 1.05, 0.65, 0);
  lamp.target = imagePlane;
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(1024, 1024);
  lamp.shadow.camera.near = 0.1;
  lamp.shadow.camera.far = 10;
  lamp.shadow.bias = -0.0002;
  lamp.shadow.normalBias = 0.015;
  const line = new three.Line(
    new three.BufferGeometry().setFromPoints([new three.Vector3(), new three.Vector3()]),
    new three.LineBasicMaterial({ transparent: true, opacity: 0.3 })
  );
  scene.add(bulb, lamp, line);
  return { kind, bulb, glow, lamp, line };
});
let renderer: three.WebGLRenderer | undefined;
let controls: OrbitControls | undefined;
let resizeObserver: ResizeObserver | undefined;
let texture: three.Texture | undefined;
let glowTexture: three.CanvasTexture | undefined;
let imageVersion = 0;
let renderFrame = 0;
let disposed = false;
let drag: { kind: "key" | "rim"; handle: HTMLButtonElement; pointerId: number; x: number; y: number; azimuth: number; elevation: number } | undefined;

function project(position: three.Vector3) {
  const point = position.clone().project(camera);
  return { left: `${(point.x + 1) * 50}%`, top: `${(1 - point.y) * 50}%` };
}

function render() {
  renderFrame = 0;
  if (!renderer || !viewport.value || unavailable.value || disposed) return;
  // 使用布局尺寸，避免画布缩放变换让渲染缓冲区过小、放大后模糊。
  const { clientWidth: width, clientHeight: height } = viewport.value;
  if (!width || !height) return;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  if (renderer.getPixelRatio() !== pixelRatio) renderer.setPixelRatio(pixelRatio);
  const size = renderer.getSize(new three.Vector2());
  if (size.x !== width || size.y !== height) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  camera.updateMatrixWorld();
  imageMaterial.emissive.set(0xffffff);
  imageMaterial.emissiveIntensity = 0.12;
  frameMaterial.emissive.set(0x000000);
  lightHandles.value = lightSources.flatMap(({ kind, bulb, glow, lamp, line }) => {
    const isRim = kind === "rim";
    const enabled = !isRim || props.rimLight;
    bulb.visible = lamp.visible = line.visible = enabled;
    if (!enabled) return [];
    const azimuth = isRim ? props.rimAzimuth : props.azimuth;
    const elevation = isRim ? props.rimElevation : props.elevation;
    const brightness = isRim ? props.rimBrightness : props.brightness;
    const lightColor = isRim ? props.rimColor : props.lightColor;
    const strength = three.MathUtils.clamp(Number.isFinite(brightness) ? brightness : 50, 0, 100) / 100;
    const color = /^#[0-9a-f]{6}$/i.test(lightColor) ? lightColor : "#ffffff";
    bulb.position.copy(getLightingPosition(azimuth, elevation)).multiplyScalar(radius);
    bulb.material.color.set(color);
    glow.material.color.set(color);
    glow.material.opacity = 0.15 + strength * 0.65;
    lamp.position.copy(bulb.position);
    lamp.color.set(color);
    lamp.intensity = strength * 4.5;
    line.material.color.set(color);
    line.material.opacity = props.activeLight === kind ? 0.42 : 0.14;
    const positions = line.geometry.getAttribute("position");
    positions.setXYZ(1, bulb.position.x, bulb.position.y, bulb.position.z);
    positions.needsUpdate = true;
    line.geometry.computeBoundingSphere();
    if (isRim) {
      // ACT: 参考图是平面，背光仅作少量透光和图框补偿；人物轮廓重打光需模型处理。
      const transmission = Math.max(0, -bulb.position.z / radius) * strength;
      imageMaterial.emissive.lerp(lamp.color, transmission * 0.5);
      imageMaterial.emissiveIntensity += transmission * 0.14;
      frameMaterial.emissive.copy(lamp.color).multiplyScalar(transmission * 0.3);
    }
    return [{ kind, label: isRim ? "轮廓" : "主光", azimuth: Math.round(azimuth), elevation: Math.round(elevation), style: { ...project(bulb.position), "--lightColor": color } }];
  });
  directionLabels.value = [
    { text: "相机侧 · 0°", style: project(new three.Vector3(0, -0.15, radius + 0.25)) },
    { text: "背侧 · 180°", style: project(new three.Vector3(0, -0.15, -radius - 0.25)) },
    { text: "原图左 · −90°", style: project(new three.Vector3(-radius - 0.25, -0.15, 0)) },
    { text: "原图右 · 90°", style: project(new three.Vector3(radius + 0.25, -0.15, 0)) },
  ];
  renderer.render(scene, camera);
}

function scheduleRender() {
  if (!renderFrame && !disposed) renderFrame = requestAnimationFrame(render);
}

function setDirection(kind: "key" | "rim", azimuth: number, elevation: number) {
  const horizontal = Math.round(((azimuth + 180) % 360 + 360) % 360 - 180);
  const vertical = Math.round(three.MathUtils.clamp(elevation, -90, 90));
  if (kind === "rim") {
    emit("update:rimAzimuth", horizontal);
    emit("update:rimElevation", vertical);
  } else {
    emit("update:azimuth", horizontal);
    emit("update:elevation", vertical);
  }
}

function startDrag(event: PointerEvent, kind: "key" | "rim") {
  if (props.disabled || event.button !== 0 || drag) return;
  const handle = event.currentTarget as HTMLButtonElement;
  handle.focus();
  handle.setPointerCapture(event.pointerId);
  emit("selectLight", kind);
  drag = { kind, handle, pointerId: event.pointerId, x: event.clientX, y: event.clientY, azimuth: kind === "rim" ? props.rimAzimuth : props.azimuth, elevation: kind === "rim" ? props.rimElevation : props.elevation };
  if (controls) controls.enabled = false;
}

function moveDrag(event: PointerEvent) {
  if (!drag || drag.pointerId !== event.pointerId || props.disabled) return;
  event.preventDefault();
  // ACT: 水平、垂直拖动直接调整两个角度，避免球体背面拾取跳到正面；视角旋转不改变角度约定。
  setDirection(drag.kind, drag.azimuth + (event.clientX - drag.x) * 0.8, drag.elevation - (event.clientY - drag.y) * 0.6);
}

function finishDrag(event?: PointerEvent) {
  if (!drag || (event && drag.pointerId !== event.pointerId)) return;
  const { pointerId, handle } = drag;
  drag = undefined;
  if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
  if (controls) controls.enabled = !props.disabled;
}

function adjustDirection(event: KeyboardEvent, kind: "key" | "rim") {
  if (props.disabled || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
  event.preventDefault();
  event.stopPropagation();
  emit("selectLight", kind);
  const step = event.shiftKey ? 1 : 5;
  setDirection(
    kind,
    (kind === "rim" ? props.rimAzimuth : props.azimuth) + (event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0),
    (kind === "rim" ? props.rimElevation : props.elevation) + (event.key === "ArrowUp" ? step : event.key === "ArrowDown" ? -step : 0)
  );
}

function loadImage() {
  const version = ++imageVersion;
  texture?.dispose();
  texture = undefined;
  imageMaterial.map = null;
  imageMaterial.emissiveMap = null;
  imageMaterial.color.set(0xcbd5e1);
  imageMaterial.needsUpdate = true;
  imagePlane.scale.set(1.8, 1.4, 1);
  frame.scale.copy(imagePlane.scale);
  imageFailed.value = false;
  scheduleRender();
  if (!props.src) return;
  new three.TextureLoader().load(props.src, loaded => {
    if (disposed || version !== imageVersion) { loaded.dispose(); return; }
    texture = loaded;
    loaded.colorSpace = three.SRGBColorSpace;
    const image = loaded.image as HTMLImageElement;
    const ratio = image.naturalWidth / image.naturalHeight;
    emit("aspectRatio", ratio);
    imagePlane.scale.set(ratio >= 1 ? 2.1 : 2.1 * ratio, ratio >= 1 ? 2.1 / ratio : 2.1, 1);
    frame.scale.copy(imagePlane.scale);
    imageMaterial.map = loaded;
    imageMaterial.emissiveMap = loaded;
    imageMaterial.color.set(0xffffff);
    imageMaterial.needsUpdate = true;
    scheduleRender();
  }, undefined, () => {
    if (!disposed && version === imageVersion) imageFailed.value = true;
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
    renderer.toneMapping = three.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = three.PCFSoftShadowMap;
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = glowCanvas.height = 64;
    const context = glowCanvas.getContext("2d");
    if (context) {
      const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.18, "#ffffffcc");
      gradient.addColorStop(0.5, "#ffffff35");
      gradient.addColorStop(1, "#ffffff00");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 64, 64);
      glowTexture = new three.CanvasTexture(glowCanvas);
      lightSources.forEach(source => { source.glow.material.map = glowTexture!; });
    }
    camera.position.set(3.4, 2.5, 5.4);
    controls = new OrbitControls(camera, canvas.value!);
    controls.enablePan = false;
    controls.enableDamping = false;
    controls.minDistance = 5;
    controls.maxDistance = 9;
    controls.minPolarAngle = 0.2;
    controls.maxPolarAngle = Math.PI - 0.2;
    controls.enabled = !props.disabled;
    controls.update();
    controls.addEventListener("change", scheduleRender);
    const grid = new three.GridHelper(5, 12, 0x94a3b8, 0xcbd5e1);
    grid.position.y = ground.position.y + 0.004;
    grid.material.transparent = true;
    grid.material.opacity = 0.28;
    const ring = new three.Mesh(new three.TorusGeometry(radius, 0.012, 6, 80), new three.MeshBasicMaterial({ color: 0x93a4bf, transparent: true, opacity: 0.65 }));
    ring.rotation.x = Math.PI / 2;
    scene.add(grid, ring);
    resizeObserver = new ResizeObserver(scheduleRender);
    resizeObserver.observe(viewport.value!);
    window.addEventListener("resize", scheduleRender);
  } catch {
    unavailable.value = true;
  }
  loadImage();
});

watch(() => props.src, loadImage);
watch(() => [props.azimuth, props.elevation, props.brightness, props.lightColor, props.rimLight, props.rimAzimuth, props.rimElevation, props.rimBrightness, props.rimColor, props.activeLight], scheduleRender);
watch(() => props.rimLight, enabled => { if (!enabled && drag?.kind === "rim") finishDrag(); });
watch(() => props.disabled, disabled => {
  if (disabled) finishDrag();
  if (controls) controls.enabled = !disabled;
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
  glowTexture?.dispose();
  lightSources.forEach(source => source.lamp.shadow.dispose());
  scene.traverse(object => {
    if (!(object instanceof three.Mesh || object instanceof three.Line || object instanceof three.Sprite)) return;
    if (!(object instanceof three.Sprite)) object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach(material => material.dispose());
  });
  renderer?.dispose();
  renderer?.forceContextLoss();
});
</script>

<style scoped lang="scss">
.lightingStage {
  position: relative;
  width: 100%;
  height: 260px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: radial-gradient(ellipse at 50% 35%, var(--el-bg-color-overlay), var(--el-fill-color-light));

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
    left: 0;
    width: 100%;
    text-align: center;
  }
  .directionLabel {
    transform: translate(-50%, -50%);
  }
  .lightHandle {
    position: absolute;
    width: 34px;
    height: 34px;
    padding: 0;
    transform: translate(-50%, -50%);
    border: 1px solid color-mix(in srgb, var(--lightColor), #64748b 35%);
    border-radius: 50%;
    background: transparent;
    box-shadow: 0 0 16px color-mix(in srgb, var(--lightColor), transparent 70%);
    cursor: grab;
    touch-action: none;

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
      pointer-events: auto;
    }
    &.activeLight {
      z-index: 1;
      border-width: 2px;
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--lightColor), transparent 80%), 0 0 20px color-mix(in srgb, var(--lightColor), transparent 55%);

      span { color: var(--el-text-color-primary); }
    }
    &:active { cursor: grabbing; }
    &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; }
    &:disabled { cursor: default; opacity: 0.5; }
  }
  .imageError,
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
