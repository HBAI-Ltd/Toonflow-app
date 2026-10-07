<template>
  <section class="panoramaPreview nodrag nopan nowheel" @pointerdown.stop @mousedown.stop @dblclick.stop @wheel.stop @keydown.stop>
    <div class="previewWorkspace">
      <div class="stageColumn">
        <div class="stageHeader">
          <span class="viewLabel">{{ showOriginal ? '原图对比' : activeCorrectionCount ? `已启用 ${activeCorrectionCount} 项校正` : '当前视角' }}</span>
          <div class="viewActions">
            <el-button size="small" :type="showOriginal ? 'primary' : 'default'" :plain="showOriginal" :disabled="busy || !ready" :aria-pressed="showOriginal" @click="showOriginal = !showOriginal">{{ showOriginal ? '返回校正' : '对比原图' }}</el-button>
            <el-button size="small" :type="showGrid ? 'primary' : 'default'" :plain="showGrid" :disabled="busy || !ready" :aria-pressed="showGrid" @click="showGrid = !showGrid">参考线</el-button>
          </div>
        </div>
        <div class="stageShell">
          <div
            ref="viewport"
            class="viewport"
            :class="{ dragging: !!drag }"
            tabindex="0"
            role="application"
            :aria-label="`${mode === 'sphere' ? '720°全景图' : '360°环绕图'}预览，拖动或方向键旋转，滚轮或加减键缩放，Home 重置`"
            :aria-busy="loading || capturing"
            @pointerdown.prevent="startDrag"
            @pointermove="moveDrag"
            @pointerup="finishDrag"
            @pointercancel="finishDrag"
            @lostpointercapture="finishDrag"
            @keydown="adjustView"
            @wheel.prevent="zoomView">
            <canvas ref="canvas" aria-hidden="true" @webglcontextlost.prevent="loseContext" @webglcontextrestored="restoreContext" />
            <div v-if="showGrid && ready" class="referenceGrid" aria-hidden="true" />
            <div v-if="loading || imageError || unavailable" class="stageStatus" role="status">{{ unavailable ? '当前设备无法显示全景预览，请重新打开后重试' : imageError || '正在加载全景图…' }}</div>
            <div v-else class="stageHint">拖动旋转 · 滚轮缩放 · 16:9 取景</div>
          </div>
        </div>
        <div class="viewControls">
          <span class="viewAngles">水平 {{ Math.round(yaw) }}°<template v-if="mode === 'sphere'"> · 俯仰 {{ Math.round(pitch) }}°</template></span>
          <div class="viewFov"><span>视野</span><el-slider v-model="fov" :min="minFov" :max="maxFov" :step="1" :disabled="busy || !ready" aria-label="全景视野" /><span>{{ Math.round(fov) }}°</span></div>
          <el-button size="small" text :disabled="busy || !ready" @click="resetView">重置视角</el-button>
        </div>
      </div>
      <aside class="correctionPanel" aria-label="全景校正设置">
        <div class="correctionHeader"><strong>画面校正</strong><el-button size="small" text :disabled="busy || !ready" @click="resetCorrections">全部重置</el-button></div>
        <p class="panelHint">按需开启，可叠加使用</p>
        <div class="correctionScroll">
          <section class="correctionGroup" :class="{ enabled: lensEnabled }">
            <div class="groupHeader"><strong>镜头畸变</strong><el-switch v-model="lensEnabled" size="small" :disabled="busy || !ready" aria-label="启用镜头畸变校正" /></div>
            <p class="groupHint">修正画面向外鼓起或向内凹陷</p>
            <div v-if="lensEnabled" class="groupControls">
              <el-select v-model="lensMode" size="small" :disabled="busy" aria-label="镜头畸变类型"><el-option label="桶形校正" value="barrel" /><el-option label="枕形校正" value="pincushion" /></el-select>
              <div class="rangeControl"><div><span>校正强度</span><span>{{ lensStrength }}%</span></div><el-slider v-model="lensStrength" :min="0" :max="100" :step="1" :disabled="busy" aria-label="镜头畸变校正强度" /></div>
            </div>
          </section>
          <section class="correctionGroup" :class="{ enabled: perspectiveEnabled }">
            <div class="groupHeader"><strong>透视与水平</strong><el-switch v-model="perspectiveEnabled" size="small" :disabled="busy || !ready" aria-label="启用透视与水平校正" /></div>
            <p class="groupHint">调整建筑倾斜与画面歪斜</p>
            <div v-if="perspectiveEnabled" class="groupControls">
              <div class="rangeControl"><div><span>水平透视</span><span>{{ horizontalPerspective }}</span></div><el-slider v-model="horizontalPerspective" :min="-40" :max="40" :step="1" :disabled="busy" aria-label="水平透视校正" /></div>
              <div class="rangeControl"><div><span>垂直透视</span><span>{{ verticalPerspective }}</span></div><el-slider v-model="verticalPerspective" :min="-40" :max="40" :step="1" :disabled="busy" aria-label="垂直透视校正" /></div>
              <div class="rangeControl"><div><span>水平旋转</span><span>{{ levelRotation.toFixed(1) }}°</span></div><el-slider v-model="levelRotation" :min="-15" :max="15" :step="0.1" :disabled="busy" aria-label="水平旋转校正" /></div>
            </div>
          </section>
          <section class="correctionGroup" :class="{ enabled: stretchEnabled }">
            <div class="groupHeader"><strong>环绕拉伸</strong><el-switch v-model="stretchEnabled" size="small" :disabled="busy || !ready" aria-label="启用环绕拉伸校正" /></div>
            <p class="groupHint">修正环绕图中物体的宽窄与高矮</p>
            <div v-if="stretchEnabled" class="groupControls">
              <div class="rangeControl"><div><span>水平拉伸</span><span>{{ horizontalStretch }}%</span></div><el-slider v-model="horizontalStretch" :min="-50" :max="50" :step="1" :disabled="busy" aria-label="环绕水平拉伸" /></div>
              <div class="rangeControl"><div><span>垂直拉伸</span><span>{{ verticalStretch }}%</span></div><el-slider v-model="verticalStretch" :min="-50" :max="50" :step="1" :disabled="busy" aria-label="环绕垂直拉伸" /></div>
              <div class="rangeControl"><div><span>中心方向</span><span>{{ stretchCenter }}°</span></div><el-slider v-model="stretchCenter" :min="0" :max="360" :step="1" :disabled="busy" aria-label="环绕拉伸中心方向" /></div>
            </div>
          </section>
          <section class="correctionGroup" :class="{ enabled: horizonEnabled }">
            <div class="groupHeader"><strong>地平线</strong><el-switch v-model="horizonEnabled" size="small" :disabled="busy || !ready" aria-label="启用地平线校正" /></div>
            <p class="groupHint">调整地平线高低与环绕起伏</p>
            <div v-if="horizonEnabled" class="groupControls">
              <div class="rangeControl"><div><span>高度偏移</span><span>{{ horizonOffset }}%</span></div><el-slider v-model="horizonOffset" :min="-12" :max="12" :step="0.5" :disabled="busy" aria-label="地平线高度偏移" /></div>
              <div class="rangeControl"><div><span>起伏修正</span><span>{{ waveAmplitude }}%</span></div><el-slider v-model="waveAmplitude" :min="-12" :max="12" :step="0.5" :disabled="busy" aria-label="地平线起伏修正" /></div>
              <div class="rangeControl"><div><span>起伏方向</span><span>{{ wavePhase }}°</span></div><el-slider v-model="wavePhase" :min="0" :max="360" :step="1" :disabled="busy" aria-label="地平线起伏方向" /></div>
              <div class="selectControl"><span>起伏次数</span><el-select v-model="waveCount" size="small" :disabled="busy" aria-label="地平线起伏次数"><el-option v-for="count in 4" :key="count" :label="`${count} 次`" :value="count" /></el-select></div>
            </div>
          </section>
          <section class="correctionGroup" :class="{ enabled: seamEnabled }">
            <div class="groupHeader"><strong>首尾接缝</strong><el-switch v-model="seamEnabled" size="small" :disabled="busy || !ready" aria-label="启用首尾接缝校正" /></div>
            <p class="groupHint">缓和首尾色差，建议小幅调整</p>
            <div v-if="seamEnabled" class="groupControls">
              <div class="rangeControl"><div><span>融合范围</span><span>{{ seamWidth }}%</span></div><el-slider v-model="seamWidth" :min="0.5" :max="8" :step="0.5" :disabled="busy" aria-label="首尾接缝融合范围" /></div>
            </div>
          </section>
        </div>
      </aside>
    </div>
    <footer class="captureFooter">
      <div class="captureControls">
        <div class="captureOptions">
          <label><span>截图</span><el-select v-model="captureCount" size="small" :disabled="busy" aria-label="截图方式"><el-option label="当前视角单张" :value="1" /><el-option label="四宫格" :value="4" /><el-option label="12 宫格" :value="12" /></el-select></label>
          <label v-if="captureCount > 1"><span>输出</span><el-select v-model="captureLayout" size="small" :disabled="busy" aria-label="宫格输出方式"><el-option label="拼成一张" value="combined" /><el-option label="分散单图并成组" value="separate" /></el-select></label>
        </div>
        <el-button type="primary" :loading="busy" :disabled="!ready" @click="capture">{{ disabled ? '正在保存…' : capturing ? '正在截图…' : '截图并添加节点' }}</el-button>
      </div>
      <p class="captureHint">{{ captureCount === 1 ? '截取当前视角' : captureCount === 4 ? '每隔 90° 截取水平视角，排列为 2 × 2' : mode === 'sphere' ? '上方、水平、下方各 4 个方向，排列为 4 × 3' : '每隔 30° 截取一张，排列为 4 × 3' }} · 每张 1280 × 720 · {{ showOriginal ? '截图仍使用校正结果' : '截图包含已启用的校正' }}</p>
      <p v-if="captureError" class="captureError" role="alert">{{ captureError }}</p>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElButton, ElOption, ElSelect, ElSlider, ElSwitch } from "element-plus";
import * as three from "three";
import { getPanoramaViews, type PanoramaCapture, type PanoramaMode } from "../imagePanorama";

const props = defineProps<{ src: string; mode: PanoramaMode; disabled?: boolean }>();
const emit = defineEmits<{ capture: [value: PanoramaCapture] }>();
const viewport = ref<HTMLDivElement>();
const canvas = ref<HTMLCanvasElement>();
const yaw = ref(0);
const pitch = ref(0);
const fov = ref(60);
const imageRatio = ref(4);
const loading = ref(false);
const imageError = ref("");
const captureError = ref("");
const unavailable = ref(false);
const capturing = ref(false);
const captureCount = ref<1 | 4 | 12>(1);
const captureLayout = ref<"combined" | "separate">("combined");
const lensEnabled = ref(false);
const lensMode = ref<"barrel" | "pincushion">("barrel");
const lensStrength = ref(40);
const perspectiveEnabled = ref(false);
const horizontalPerspective = ref(0);
const verticalPerspective = ref(0);
const levelRotation = ref(0);
const stretchEnabled = ref(false);
const horizontalStretch = ref(0);
const verticalStretch = ref(0);
const stretchCenter = ref(0);
const horizonEnabled = ref(false);
const horizonOffset = ref(0);
const waveAmplitude = ref(0);
const wavePhase = ref(0);
const waveCount = ref(1);
const seamEnabled = ref(false);
const seamWidth = ref(3);
const showOriginal = ref(false);
const showGrid = ref(false);
const activeCorrectionCount = computed(() => [lensEnabled, perspectiveEnabled, stretchEnabled, horizonEnabled, seamEnabled].filter(item => item.value).length);
const busy = computed(() => !!props.disabled || capturing.value);
const ready = computed(() => !!props.src && !loading.value && !imageError.value && !unavailable.value);
const maxFov = computed(() => props.mode === "sphere" ? 100 : Math.min(90, 2 * Math.atan(Math.PI / imageRatio.value) * 180 / Math.PI * 0.98));
const minFov = computed(() => Math.min(25, maxFov.value / 2));
const drag = ref<{ pointerId: number; x: number; y: number; yaw: number; pitch: number }>();
const scene = new three.Scene();
const camera = new three.PerspectiveCamera(60, 16 / 9, 0.1, 100);
const material = new three.MeshBasicMaterial({ toneMapped: false });
const panoramaUniforms = {
  sourceCorrections: { value: false },
  stretch: { value: new three.Vector2() },
  stretchCenter: { value: 0.5 },
  horizonOffset: { value: 0 },
  wave: { value: new three.Vector3() },
  seamWidth: { value: 0 },
};
material.onBeforeCompile = shader => {
  Object.assign(shader.uniforms, panoramaUniforms);
  shader.fragmentShader = `
    uniform bool sourceCorrections;
    uniform vec2 stretch;
    uniform float stretchCenter;
    uniform float horizonOffset;
    uniform vec3 wave;
    uniform float seamWidth;
  ` + shader.fragmentShader.replace("#include <map_fragment>", `
    #ifdef USE_MAP
      vec2 sourceUv = vMapUv;
      if (sourceCorrections) {
        // 保留连续 UV，由纹理循环寻址处理首尾，避免接缝处隐式导数突变。
        sourceUv.x -= stretch.x * sin(6.28318530718 * (sourceUv.x - stretchCenter)) / 6.28318530718;
        float height = sourceUv.y;
        height -= stretch.y * (height - 0.5) * 4.0 * height * (1.0 - height);
        float rise = horizonOffset + wave.x * sin(6.28318530718 * wave.y * (sourceUv.x - 0.5) + wave.z);
        sourceUv.y = clamp(height + sin(3.14159265359 * height) * rise, 0.0, 1.0);
      }
      vec4 sampledDiffuseColor = texture2D(map, sourceUv);
      if (seamWidth > 0.0) {
        float longitude = fract(sourceUv.x);
        float distanceToSeam = min(longitude, 1.0 - longitude);
        float blend = 0.5 * (1.0 - smoothstep(0.0, seamWidth, distanceToSeam));
        sampledDiffuseColor = mix(sampledDiffuseColor, texture2D(map, vec2(1.0 - sourceUv.x, sourceUv.y)), blend);
      }
      diffuseColor *= sampledDiffuseColor;
    #endif
  `);
};
const mesh = new three.Mesh(new three.BufferGeometry(), material);
scene.add(mesh);
const correctionTarget = new three.WebGLRenderTarget(1, 1, { depthBuffer: false, samples: 2 });
const correctionMaterial = new three.ShaderMaterial({
  uniforms: { image: { value: correctionTarget.texture }, coefficient: { value: 0 }, crop: { value: 1 }, perspective: { value: new three.Vector2() }, rotation: { value: 0 } },
  vertexShader: `
    varying vec2 imageUv;
    void main() {
      imageUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D image;
    uniform float coefficient;
    uniform float crop;
    uniform vec2 perspective;
    uniform float rotation;
    varying vec2 imageUv;
    void main() {
      vec2 centered = (imageUv * 2.0 - 1.0) / crop;
      float cosine = cos(rotation);
      float sine = sin(rotation);
      centered = vec2(cosine * centered.x - sine * centered.y * 9.0 / 16.0, sine * centered.x * 16.0 / 9.0 + cosine * centered.y);
      centered /= 1.0 + dot(perspective, centered);
      vec2 radial = centered * vec2(16.0 / 9.0, 1.0);
      float radiusSquared = dot(radial, radial) / (1.0 + 256.0 / 81.0);
      vec2 sourceUv = centered * (1.0 + coefficient * radiusSquared) * 0.5 + 0.5;
      gl_FragColor = texture2D(image, sourceUv);
      #include <colorspace_fragment>
    }
  `,
  depthTest: false,
  depthWrite: false,
  toneMapped: false,
});
const correctionScene = new three.Scene();
const correctionQuad = new three.Mesh(new three.PlaneGeometry(2, 2), correctionMaterial);
const correctionCamera = new three.Camera();
const drawingSize = new three.Vector2();
correctionScene.add(correctionQuad);
let renderer: three.WebGLRenderer | undefined;
let texture: three.Texture | undefined;
let resizeObserver: ResizeObserver | undefined;
let imageVersion = 0;
let renderFrame = 0;
let disposed = false;

defineExpose({ capturing });

function setCamera(viewYaw = yaw.value, viewPitch = pitch.value) {
  const horizontal = three.MathUtils.degToRad(viewYaw);
  const vertical = three.MathUtils.degToRad(viewPitch);
  camera.fov = fov.value;
  camera.updateProjectionMatrix();
  camera.lookAt(Math.sin(horizontal) * Math.cos(vertical), Math.sin(vertical), -Math.cos(horizontal) * Math.cos(vertical));
}

function render() {
  renderFrame = 0;
  if (!renderer || !viewport.value || disposed || capturing.value || unavailable.value) return;
  const width = viewport.value.clientWidth;
  if (!width) return;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, width * 9 / 16, false);
  setCamera();
  renderView(renderer);
}

function renderView(activeRenderer: three.WebGLRenderer, applyCorrections = !showOriginal.value) {
  panoramaUniforms.sourceCorrections.value = applyCorrections && (stretchEnabled.value || horizonEnabled.value);
  panoramaUniforms.stretch.value.set(
    applyCorrections && stretchEnabled.value ? horizontalStretch.value / 100 : 0,
    applyCorrections && stretchEnabled.value ? verticalStretch.value / 125 : 0,
  );
  panoramaUniforms.stretchCenter.value = 0.5 + stretchCenter.value / 360;
  panoramaUniforms.horizonOffset.value = applyCorrections && horizonEnabled.value ? horizonOffset.value / 100 : 0;
  panoramaUniforms.wave.value.set(applyCorrections && horizonEnabled.value ? waveAmplitude.value / 100 : 0, waveCount.value, three.MathUtils.degToRad(wavePhase.value));
  panoramaUniforms.seamWidth.value = applyCorrections && seamEnabled.value ? seamWidth.value / 100 : 0;
  const strength = applyCorrections && lensEnabled.value ? lensStrength.value / 400 : 0;
  const coefficient = lensMode.value === "barrel" ? -strength : strength;
  const perspectiveX = applyCorrections && perspectiveEnabled.value ? horizontalPerspective.value / 160 : 0;
  const perspectiveY = applyCorrections && perspectiveEnabled.value ? verticalPerspective.value / 160 : 0;
  const rotation = applyCorrections && perspectiveEnabled.value ? three.MathUtils.degToRad(levelRotation.value) : 0;
  if (!coefficient && !perspectiveX && !perspectiveY && !rotation) { activeRenderer.render(scene, camera); return; }
  // ACT: 手动几何校正不能修复 AI 生成的重复物体；接缝仅在两端窄带融合，不推测缺失内容。
  // 各源图变换保持单调和首尾周期；透视、旋转、径向叠加使用保守裁边，避免黑边和采样折返。
  const cosine = Math.abs(Math.cos(rotation));
  const sine = Math.abs(Math.sin(rotation));
  const boundX = cosine + sine * 9 / 16;
  const boundY = cosine + sine * 16 / 9;
  correctionMaterial.uniforms.coefficient!.value = coefficient;
  correctionMaterial.uniforms.perspective!.value.set(perspectiveX, perspectiveY);
  correctionMaterial.uniforms.rotation!.value = rotation;
  correctionMaterial.uniforms.crop!.value = Math.max(1, (1 + Math.max(0, coefficient)) * Math.max(boundX, boundY) + Math.abs(perspectiveX) * boundX + Math.abs(perspectiveY) * boundY);
  activeRenderer.getDrawingBufferSize(drawingSize);
  if (correctionTarget.width !== drawingSize.x || correctionTarget.height !== drawingSize.y) correctionTarget.setSize(drawingSize.x, drawingSize.y);
  try {
    activeRenderer.setRenderTarget(correctionTarget);
    activeRenderer.render(scene, camera);
  } finally {
    activeRenderer.setRenderTarget(null);
  }
  activeRenderer.render(correctionScene, correctionCamera);
}

function scheduleRender() {
  if (!renderFrame && !disposed && !capturing.value) renderFrame = requestAnimationFrame(render);
}

function updateGeometry() {
  mesh.geometry.dispose();
  mesh.geometry = props.mode === "sphere"
    ? new three.SphereGeometry(10, 96, 64)
    : new three.CylinderGeometry(10, 10, 20 * Math.PI / imageRatio.value, 128, 1, true);
  mesh.geometry.scale(-1, 1, 1);
  if (props.mode === "sphere") mesh.geometry.rotateY(-Math.PI / 2);
  resetView();
}

function loadImage() {
  const version = ++imageVersion;
  texture?.dispose();
  texture = undefined;
  material.map = null;
  material.needsUpdate = true;
  mesh.visible = false;
  imageError.value = props.src ? "" : "没有可预览的图片";
  captureError.value = "";
  loading.value = !!props.src;
  scheduleRender();
  if (!props.src) return;
  new three.TextureLoader().load(props.src, loaded => {
    if (disposed || version !== imageVersion) { loaded.dispose(); return; }
    const image = loaded.image as HTMLImageElement;
    const ratio = image.naturalWidth / image.naturalHeight;
    if (!Number.isFinite(ratio) || ratio <= 0) {
      loaded.dispose();
      loading.value = false;
      imageError.value = "图片尺寸无效，无法预览全景图";
      return;
    }
    imageRatio.value = ratio;
    texture = loaded;
    loaded.colorSpace = three.SRGBColorSpace;
    loaded.wrapS = three.RepeatWrapping;
    material.map = loaded;
    material.needsUpdate = true;
    mesh.visible = true;
    loading.value = false;
    updateGeometry();
    scheduleRender();
  }, undefined, () => {
    if (disposed || version !== imageVersion) return;
    loading.value = false;
    imageError.value = "全景图加载失败，请检查图片后重新打开";
  });
}

function setView(nextYaw: number, nextPitch: number) {
  yaw.value = ((nextYaw % 360) + 360) % 360;
  pitch.value = props.mode === "sphere" ? three.MathUtils.clamp(nextPitch, -85, 85) : 0;
}

function resetView() {
  setView(0, 0);
  fov.value = Math.min(60, maxFov.value);
  scheduleRender();
}

function resetCorrections() {
  lensEnabled.value = perspectiveEnabled.value = stretchEnabled.value = horizonEnabled.value = seamEnabled.value = false;
  lensMode.value = "barrel";
  lensStrength.value = 40;
  horizontalPerspective.value = verticalPerspective.value = levelRotation.value = 0;
  horizontalStretch.value = verticalStretch.value = stretchCenter.value = 0;
  horizonOffset.value = waveAmplitude.value = wavePhase.value = 0;
  waveCount.value = 1;
  seamWidth.value = 3;
  showOriginal.value = false;
}

function startDrag(event: PointerEvent) {
  if (busy.value || !ready.value || event.button !== 0 || drag.value) return;
  viewport.value?.focus();
  viewport.value?.setPointerCapture(event.pointerId);
  drag.value = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, yaw: yaw.value, pitch: pitch.value };
}

function moveDrag(event: PointerEvent) {
  if (!drag.value || drag.value.pointerId !== event.pointerId || busy.value) return;
  const scale = fov.value / Math.max(1, viewport.value?.clientHeight ?? 1);
  setView(drag.value.yaw - (event.clientX - drag.value.x) * scale, drag.value.pitch + (event.clientY - drag.value.y) * scale);
}

function finishDrag(event?: PointerEvent) {
  if (!drag.value || (event && event.pointerId !== drag.value.pointerId)) return;
  const pointerId = drag.value.pointerId;
  drag.value = undefined;
  if (viewport.value?.hasPointerCapture(pointerId)) viewport.value.releasePointerCapture(pointerId);
}

function zoomView(event: WheelEvent) {
  if (busy.value || !ready.value) return;
  fov.value = three.MathUtils.clamp(fov.value + Math.sign(event.deltaY) * 3, minFov.value, maxFov.value);
}

function adjustView(event: KeyboardEvent) {
  if (busy.value || !ready.value || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "Home"].includes(event.key)) return;
  event.preventDefault();
  if (event.key === "Home") { resetView(); return; }
  if (["+", "=", "-"].includes(event.key)) {
    fov.value = three.MathUtils.clamp(fov.value + (event.key === "-" ? 3 : -3), minFov.value, maxFov.value);
    return;
  }
  const step = event.shiftKey ? 1 : 5;
  setView(yaw.value + (event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0), pitch.value + (event.key === "ArrowUp" ? step : event.key === "ArrowDown" ? -step : 0));
}

async function capture() {
  if (busy.value || !ready.value || !renderer || !texture) return;
  capturing.value = true;
  captureError.value = "";
  finishDrag();
  const version = imageVersion;
  const mode = props.mode;
  const count = captureCount.value;
  const combined = count > 1 && captureLayout.value === "combined";
  const columns = count === 1 ? 1 : count === 4 ? 2 : 4;
  const width = 1280;
  const height = 720;
  const outputs: { canvas: HTMLCanvasElement; label: string }[] = [];
  try {
    await nextTick();
    if (disposed || version !== imageVersion || !renderer) return;
    const captureRenderer = renderer;
    const size = captureRenderer.getSize(new three.Vector2());
    const pixelRatio = captureRenderer.getPixelRatio();
    try {
      captureRenderer.setPixelRatio(1);
      captureRenderer.setSize(width, height, false);
      for (const [index, view] of getPanoramaViews(mode, count, yaw.value, pitch.value).entries()) {
        if (!combined || index === 0) {
          const output = document.createElement("canvas");
          output.width = width * (combined ? columns : 1);
          output.height = height * (combined ? count / columns : 1);
          outputs.push({ canvas: output, label: combined ? `${count}宫格全景截图` : view.label });
        }
        const output = outputs[outputs.length - 1]!.canvas;
        const context = output.getContext("2d");
        if (!context) throw new Error("无法创建截图画布");
        setCamera(view.yaw, view.pitch);
        renderView(captureRenderer, true);
        if (captureRenderer.getContext().isContextLost()) throw new Error("图形上下文已中断，请重新打开预览后再截图");
        context.drawImage(captureRenderer.domElement, combined ? index % columns * width : 0, combined ? Math.floor(index / columns) * height : 0, width, height);
      }
    } finally {
      captureRenderer.setPixelRatio(pixelRatio);
      captureRenderer.setSize(size.x, size.y, false);
      setCamera();
      renderView(captureRenderer);
    }
    const images: PanoramaCapture["images"] = [];
    for (const output of outputs) {
      const blob = await new Promise<Blob>((resolve, reject) => output.canvas.toBlob(value => value ? resolve(value) : reject(new Error("截图编码失败，请重试")), "image/png"));
      images.push({ blob, width: output.canvas.width, height: output.canvas.height, label: output.label });
      output.canvas.width = output.canvas.height = 1;
    }
    if (disposed) return;
    if (version !== imageVersion || mode !== props.mode) throw new Error("图片已更新，请重新截图");
    emit("capture", { images, columns, count });
  } catch (error) {
    if (!disposed) captureError.value = error instanceof Error ? error.message : "截图失败，请重试";
  } finally {
    for (const output of outputs) output.canvas.width = output.canvas.height = 1;
    capturing.value = false;
    scheduleRender();
  }
}

function loseContext() {
  finishDrag();
  unavailable.value = true;
}

function restoreContext() {
  unavailable.value = false;
  scheduleRender();
}

watch(() => props.src, loadImage);
watch(() => props.mode, updateGeometry);
watch([yaw, pitch, fov, lensEnabled, lensMode, lensStrength, perspectiveEnabled, horizontalPerspective, verticalPerspective, levelRotation,
  stretchEnabled, horizontalStretch, verticalStretch, stretchCenter, horizonEnabled, horizonOffset, waveAmplitude, wavePhase, waveCount, seamEnabled, seamWidth, showOriginal], scheduleRender);
watch(busy, value => { if (value) finishDrag(); });

onMounted(() => {
  if (!canvas.value || !viewport.value) return;
  try {
    renderer = new three.WebGLRenderer({ canvas: canvas.value, antialias: true });
    renderer.setClearColor(0x101827);
    resizeObserver = new ResizeObserver(scheduleRender);
    resizeObserver.observe(viewport.value);
    loadImage();
  } catch {
    unavailable.value = true;
  }
});

onBeforeUnmount(() => {
  disposed = true;
  imageVersion++;
  finishDrag();
  cancelAnimationFrame(renderFrame);
  resizeObserver?.disconnect();
  texture?.dispose();
  mesh.geometry.dispose();
  material.dispose();
  correctionQuad.geometry.dispose();
  correctionMaterial.dispose();
  correctionTarget.dispose();
  renderer?.dispose();
  renderer?.forceContextLoss();
});
</script>

<style scoped lang="scss">
.panoramaPreview {
  display: grid; grid-template-rows: minmax(0, 1fr) auto; gap: 16px; height: 100%; min-height: 0; color: var(--el-text-color-primary); font-size: 12px;
  .previewWorkspace {
    display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 18px; min-height: 0;
    .stageColumn {
      display: grid; grid-template-rows: auto minmax(0, 1fr) auto; gap: 10px; min-width: 0; min-height: 0;
      .stageHeader {
        display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 28px;
        .viewLabel { color: var(--el-text-color-secondary); }
        .viewActions { display: flex; gap: 6px; flex-shrink: 0; .el-button { margin-left: 0; } }
      }
      .stageShell {
        container-type: size; display: flex; align-items: center; justify-content: center; min-height: 0; overflow: hidden; border: 1px solid var(--el-border-color-lighter); border-radius: 10px; background: var(--el-fill-color-darker);
        .viewport {
          position: relative; width: min(100cqw, calc(100cqh * 16 / 9)); aspect-ratio: 16 / 9; flex-shrink: 0; overflow: hidden; cursor: grab; touch-action: none;
          &.dragging { cursor: grabbing; }
          &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
          canvas { display: block; width: 100%; height: 100%; }
          .referenceGrid { position: absolute; inset: 0; pointer-events: none; background-image: linear-gradient(to right, #fff6 1px, transparent 1px), linear-gradient(to bottom, #fff6 1px, transparent 1px); background-size: 33.333333% 33.333333%; }
          .stageStatus { position: absolute; inset: 0; display: grid; place-items: center; padding: 24px; color: var(--el-text-color-secondary); text-align: center; background: var(--el-fill-color-darker); }
          .stageHint { position: absolute; right: 10px; bottom: 10px; padding: 5px 8px; border-radius: 5px; color: #fff; background: #0008; pointer-events: none; font-size: 11px; }
        }
      }
      .viewControls {
        display: flex; align-items: center; gap: 12px; flex-wrap: wrap; color: var(--el-text-color-secondary); min-height: 30px;
        .viewAngles { margin-right: auto; white-space: nowrap; font-variant-numeric: tabular-nums; }
        .viewFov { display: flex; align-items: center; gap: 10px; font-variant-numeric: tabular-nums; .el-slider { width: 100px; } > span:last-child { min-width: 28px; text-align: right; } }
        .el-button { margin-left: 0; padding-right: 0; }
      }
    }
    .correctionPanel {
      display: flex; flex-direction: column; min-height: 0; padding-left: 18px; border-left: 1px solid var(--el-border-color-lighter);
      .correctionHeader { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 28px; strong { font-size: 13px; font-weight: 600; } .el-button { padding-right: 0; } }
      .panelHint { margin: 3px 0 12px; color: var(--el-text-color-secondary); font-size: 11px; line-height: 1.5; }
      .correctionScroll {
        overflow-y: auto; min-height: 0; padding-right: 8px; scrollbar-width: thin; scrollbar-color: var(--el-border-color) transparent;
        .correctionGroup {
          padding: 11px 12px; margin-bottom: 8px; border: 1px solid var(--el-border-color-lighter); border-radius: 9px; background: var(--el-fill-color-light);
          &:last-child { margin-bottom: 0; }
          &.enabled { border-color: var(--el-border-color); background: var(--el-bg-color-overlay); }
          .groupHeader { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 24px; strong { font-size: 12px; font-weight: 500; } }
          .groupHint { margin: 3px 0 0; color: var(--el-text-color-secondary); font-size: 11px; line-height: 1.6; }
          .groupControls {
            display: grid; gap: 10px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--el-border-color-lighter);
            .el-select { width: 100%; }
            .rangeControl {
              min-width: 0;
              > div:first-child { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--el-text-color-regular); > span:last-child { color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums; } }
              .el-slider { height: 24px; width: calc(100% - 10px); margin: 2px 5px 0; --el-slider-button-size: 12px; --el-slider-height: 3px; }
            }
            .selectControl { display: flex; align-items: center; justify-content: space-between; gap: 12px; .el-select { width: 96px; } }
          }
        }
      }
    }
  }
  .captureFooter {
    border-top: 1px solid var(--el-border-color-lighter); padding-top: 14px;
    .captureControls {
      display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
      .captureOptions {
        display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
        label { display: flex; align-items: center; gap: 8px; white-space: nowrap; color: var(--el-text-color-regular); .el-select { width: 160px; } }
      }
    }
    .captureHint { margin: 8px 0 0; color: var(--el-text-color-secondary); font-size: 11px; line-height: 1.6; }
    .captureError { margin: 6px 0 0; color: var(--el-color-danger); line-height: 1.5; }
  }
  @media (max-width: 1100px) {
    .previewWorkspace { grid-template-columns: minmax(0, 1fr) 240px; gap: 12px; .correctionPanel { padding-left: 12px; } }
  }
  @media (max-width: 760px) {
    .previewWorkspace {
      grid-template-columns: minmax(0, 1fr) 210px; gap: 10px;
      .stageColumn { .stageHeader { flex-wrap: wrap; gap: 6px; } .viewControls { gap: 4px 10px; .viewAngles { width: 100%; } } }
      .correctionPanel { padding-left: 10px; .correctionScroll { padding-right: 3px; .correctionGroup { padding: 8px; } } }
    }
  }
}
</style>
