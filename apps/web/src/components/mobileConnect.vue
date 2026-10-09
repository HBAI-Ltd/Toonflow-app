<template>
  <el-dialog v-model="visible" title="设备互联" modalClass="deviceConnectOverlay" width="min(560px, calc(100vw - 32px))" :alignCenter="viewportHeight > 600" :top="viewportHeight <= 600 ? '16px' : undefined" appendToBody :closeOnClickModal="!submitting" :closeOnPressEscape="!submitting" :showClose="!submitting">
    <div v-loading="loading" class="mobileConnect" :class="{ compact: viewportHeight < 320 }" :style="{ maxHeight: `${Math.max(80, viewportHeight - (viewportHeight < 320 ? 104 : 128))}px`, height: choosingConnection ? '428px' : undefined }">
      <el-segmented v-if="choosingConnection" class="inputModes" :modelValue="view" :options="connectionModes" :disabled="loading || submitting" block ariaLabel="连接方式" @change="value => value === 'manual' ? showManual() : scanAgain()">
        <template #default="{ item }">
          <span class="modeOption"><component :is="item.icon" :size="18" aria-hidden="true" />{{ item.label }}</span>
        </template>
      </el-segmented>
      <div class="connectionBody">
      <section v-if="deviceHubEnabled" class="connectionInfo" aria-label="本机共享状态">
        <icon-device-desktop :size="40" aria-hidden="true" />
        <el-tag type="success">共享中</el-tag>
        <h3>本机已开启共享</h3>
        <p class="description">其他设备可使用本机的项目与配置。<br />如需连接其他设备，请先在“设置 → 设备互联”中关闭共享。</p>
      </section>
      <section v-else-if="!deviceConnectionSupported" class="connectionInfo" aria-label="设备互联说明">
        <icon-device-desktop :size="40" aria-hidden="true" />
        <p class="description">请使用 Toonflow 桌面端或 Android 客户端连接其他设备。<br />本机共享可在“设置 → 设备互联”中管理。</p>
      </section>
      <section v-else-if="view === 'current'" class="connectionInfo" aria-label="当前连接">
        <icon-device-desktop :size="40" aria-hidden="true" />
        <el-tag :type="mobileConnection.online === true ? mobileConnectionVersionWarning ? 'warning' : 'success' : mobileConnection.online === false ? 'danger' : 'info'">{{ mobileConnectionLabel }}</el-tag>
        <h3>{{ mobileConnection.name || 'Toonflow' }}</h3>
        <code>{{ mobileConnection.url }}</code>
        <p class="description">{{ mobileConnection.online === true ? '正在使用这个设备的项目与配置。' : mobileConnection.online === false ? '暂时无法连接这个设备，请检查对方是否运行以及网络连接。' : '正在确认这个设备是否可以连接…' }}</p>
        <el-alert v-if="mobileConnectionVersionWarning" :title="mobileConnectionVersionWarning" type="warning" :closable="false" showIcon />
        <div class="connectionActions">
          <el-button type="primary" :disabled="submitting" @click="scanAgain">连接其他设备</el-button>
          <el-button :loading="submitting" @click="disconnect">断开并独立运行</el-button>
        </div>
      </section>
      <section v-else-if="view === 'confirm' && candidate" class="connectionInfo" aria-label="连接目标">
        <icon-device-desktop :size="40" aria-hidden="true" />
        <el-tag>已识别设备</el-tag>
        <h3>{{ candidate.name }}</h3>
        <code>{{ candidate.url }}</code>
        <p class="description">连接后将使用对方的项目与配置。请确认这是你要连接的设备。</p>
        <el-alert v-if="candidateVersionWarning" :title="candidateVersionWarning" type="warning" :closable="false" showIcon />
        <div class="connectionActions">
          <el-button type="primary" :loading="submitting" @click="connect">连接这个设备</el-button>
          <el-button :disabled="submitting" @click="scanAgain">重新扫描</el-button>
        </div>
      </section>
      <section v-else-if="view === 'manual'" class="manualPanel" aria-label="手动连接">
        <p class="description">在对方“设备互联”中展开“手动连接信息”，查看地址和配对码。</p>
        <el-form labelPosition="top" size="large" :disabled="submitting" @submit.prevent="connectManually">
          <el-form-item label="服务器地址">
            <el-input v-model="manualUrl" placeholder="192.168.1.10:43123 或 https://example.com" inputmode="url" autocomplete="off" autocapitalize="none" :spellcheck="false" aria-label="服务器地址" />
          </el-form-item>
          <el-form-item label="12 位配对码">
            <el-input v-model="manualCode" placeholder="1234 5678 9012" inputmode="numeric" autocomplete="off" :maxlength="14" aria-label="12 位配对码" />
          </el-form-item>
          <p class="description">连接后使用对方的项目与配置。</p>
          <div class="manualActions">
            <el-button type="primary" nativeType="submit" :loading="submitting" :disabled="loading">连接</el-button>
            <el-button v-if="mobileConnection.mode === 'remote'" link :disabled="submitting" @click="showCurrent">返回当前连接</el-button>
          </div>
        </el-form>
      </section>
      <section v-else class="scanPanel" aria-label="扫描二维码">
        <div class="scanInfo">
          <h3>扫描另一台设备上的二维码</h3>
          <p class="description">在对方“设置 → 设备互联”中开启共享。<br />局域网连接时，请使用同一 Wi-Fi。</p>
        </div>
        <div class="scannerView">
          <video v-show="scanning" ref="video" autoplay muted playsinline aria-label="扫码摄像头预览" />
          <svg class="scannerFrame" viewBox="0 0 200 200" fill="none" aria-hidden="true"><path d="M1 25V1H25M175 1H199V25M199 175V199H175M25 199H1V175" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
          <div v-if="!scanning" class="scannerHint">
            <icon-qrcode :size="40" aria-hidden="true" />
            <span role="status">{{ starting ? '正在开启摄像头…' : cameraError || '将二维码放入框内' }}</span>
            <el-button type="primary" :icon="IconCamera" :loading="starting" :disabled="loading || submitting" @click="startCamera">开启摄像头</el-button>
          </div>
        </div>
        <div class="scanActions">
          <el-button :icon="IconPhoto" :loading="readingImage" :disabled="loading || submitting" @click="imageInput?.click()">{{ isDesktop ? '选择二维码图片' : '从相册选择' }}</el-button>
          <input ref="imageInput" class="imageInput" type="file" accept="image/*" @change="readImage" />
          <el-button v-if="mobileConnection.mode === 'remote'" link :disabled="submitting" @click="showCurrent">返回当前连接</el-button>
        </div>
      </section>
      <el-alert v-if="error" :title="error" type="error" :closable="false" showIcon />
      <p v-if="restarting" class="description" role="status">正在切换连接…</p>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import axios from "axios";
import jsQR from "jsqr";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { IconCamera, IconPhoto, IconQrcode, IconDeviceDesktop, IconKeyboard } from "@tabler/icons-vue";
import { changeDeviceConnection, deviceConnectionSupported, deviceHubEnabled, getDeviceVersionWarning, isDesktop, mobileConnection, mobileConnectionLabel, mobileConnectionVersionWarning, refreshMobileConnection } from "@/lib/mobile";

type Candidate = { name: string; url: string; qrCode: string; appVersion?: string };

const visible = defineModel<boolean>({ default: false });
const view = ref<"scan" | "manual" | "confirm" | "current">("scan");
const connectionModes = [
  { label: "扫码连接", value: "scan", icon: IconQrcode },
  { label: "手动输入", value: "manual", icon: IconKeyboard },
];
const choosingConnection = computed(() => !deviceHubEnabled.value && deviceConnectionSupported.value && (view.value === "scan" || view.value === "manual"));
const manualUrl = ref("");
const manualCode = ref("");
const viewportHeight = ref(window.visualViewport?.height ?? window.innerHeight);
const candidate = ref<Candidate>();
const candidateVersionWarning = computed(() => candidate.value ? getDeviceVersionWarning(mobileConnection.value.appVersion, candidate.value.appVersion) : "");
const video = ref<HTMLVideoElement>();
const imageInput = ref<HTMLInputElement>();
const loading = ref(false);
const starting = ref(false);
const scanning = ref(false);
const readingImage = ref(false);
const submitting = ref(false);
const restarting = ref(false);
const error = ref("");
const cameraError = ref("");
const canvas = document.createElement("canvas");
const context = canvas.getContext("2d", { willReadFrequently: true });
let stream: MediaStream | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let cameraRun = 0;
let dialogRun = 0;

function errorMessage(cause: unknown) {
  return axios.isAxiosError<{ message?: string }>(cause) ? cause.response?.data?.message || cause.message : cause instanceof Error ? cause.message : "操作失败，请重试";
}

function stopCamera() {
  cameraRun++;
  clearTimeout(timer);
  stream?.getTracks().forEach(track => track.stop());
  stream = undefined;
  if (video.value) video.value.srcObject = null;
  starting.value = scanning.value = false;
}

function decodeImage(source: CanvasImageSource, width: number, height: number) {
  if (!context || !width || !height) return null;
  const scale = Math.min(1, 960 / Math.max(width, height));
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(image.data, image.width, image.height)?.data ?? null;
}

function recognize(qrCode: string) {
  try {
    if (qrCode.length > 4096) throw new Error("请扫描 Toonflow 的设备互联二维码");
    const value = JSON.parse(qrCode);
    if (!value || value.type !== "toonflowMobile" || value.version !== 1 || typeof value.name !== "string" || !value.name.trim()
      || typeof value.url !== "string" || typeof value.code !== "string" || !/^[\w-]{32,256}$/.test(value.code)) {
      throw new Error("请扫描 Toonflow 的设备互联二维码");
    }
    const url = normalizeConnectionUrl(value.url);
    stopCamera();
    error.value = "";
    candidate.value = { name: value.name.slice(0, 128), url, qrCode, appVersion: typeof value.appVersion === "string" && /^[\w.+-]{1,64}$/.test(value.appVersion) ? value.appVersion : undefined };
    view.value = "confirm";
    return true;
  } catch (cause) {
    error.value = cause instanceof SyntaxError ? "请扫描 Toonflow 的设备互联二维码" : errorMessage(cause);
    return false;
  }
}

function normalizeConnectionUrl(value: string) {
  try {
    const address = value.trim();
    const hasScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(address);
    let url = new URL(hasScheme ? address : `https://${address}`);
    const privateHost = /^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)
      && /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname) || url.hostname === "localhost";
    if (!hasScheme && privateHost) url = new URL(`http://${address}`);
    if ((url.protocol !== "https:" && !(url.protocol === "http:" && privateHost)) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error();
    return url.origin;
  } catch {
    throw new Error("请输入局域网地址或公网 HTTPS 地址，不能包含路径、账号或参数");
  }
}

async function startCamera() {
  if (!visible.value || deviceHubEnabled.value || !deviceConnectionSupported.value || view.value !== "scan" || submitting.value || starting.value || document.hidden) return;
  stopCamera();
  const run = cameraRun;
  starting.value = true;
  error.value = "";
  cameraError.value = "";
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("当前环境无法使用摄像头，请选择二维码图片或手动输入");
    const media = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" } } });
    if (run !== cameraRun || !visible.value || document.hidden) {
      media.getTracks().forEach(track => track.stop());
      return;
    }
    stream = media;
    scanning.value = true;
    await nextTick();
    if (run !== cameraRun) return;
    if (!video.value) throw new Error("无法开启扫码预览，请重试");
    video.value.srcObject = media;
    await video.value.play();
    if (run !== cameraRun) return;
    const scanFrame = () => {
      if (run !== cameraRun || !visible.value || document.hidden) return;
      try {
        const source = video.value;
        const result = source && source.readyState >= 2 ? decodeImage(source, source.videoWidth, source.videoHeight) : null;
        if (result && recognize(result)) return;
        timer = setTimeout(scanFrame, 200);
      } catch (cause) {
        stopCamera();
        error.value = errorMessage(cause);
      }
    };
    scanFrame();
  } catch (cause) {
    if (run !== cameraRun) return;
    stopCamera();
    cameraError.value = cause instanceof DOMException && ["NotAllowedError", "PermissionDeniedError"].includes(cause.name)
      ? "请允许摄像头访问，或选择二维码图片"
      : "暂时无法开启摄像头，可选择二维码图片";
  } finally {
    if (run === cameraRun) starting.value = false;
  }
}

function scanAgain() {
  dialogRun++;
  loading.value = false;
  candidate.value = undefined;
  view.value = "scan";
  error.value = "";
  void startCamera();
}

function showManual() {
  stopCamera();
  dialogRun++;
  loading.value = false;
  candidate.value = undefined;
  view.value = "manual";
  error.value = "";
}

function showCurrent() {
  stopCamera();
  dialogRun++;
  loading.value = false;
  candidate.value = undefined;
  view.value = "current";
  error.value = "";
}

async function readImage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file || submitting.value) return;
  stopCamera();
  const run = cameraRun;
  readingImage.value = true;
  error.value = "";
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("无法读取图片，请选择包含二维码的图片"));
      image.src = url;
    });
    if (!visible.value || run !== cameraRun) return;
    const result = decodeImage(image, image.naturalWidth, image.naturalHeight);
    if (result) recognize(result);
    else error.value = "图片中未识别到二维码，请选择更清晰的图片";
  } catch (cause) {
    if (visible.value && run === cameraRun) error.value = errorMessage(cause);
  } finally {
    URL.revokeObjectURL(url);
    readingImage.value = false;
  }
}

async function connect() {
  if (!candidate.value || submitting.value) return;
  await changeConnection("connect", { qrCode: candidate.value.qrCode });
}

async function disconnect() {
  await changeConnection("disconnect");
}

async function connectManually() {
  if (submitting.value) return;
  error.value = "";
  try {
    const url = normalizeConnectionUrl(manualUrl.value);
    const code = manualCode.value.replace(/[\s-]/g, "");
    if (!/^\d{12}$/.test(code)) throw new Error("请输入对方显示的 12 位数字配对码");
    await changeConnection("connect", { url, code });
  } catch (cause) {
    error.value = errorMessage(cause);
  }
}

async function changeConnection(action: "connect" | "disconnect", body?: { qrCode: string } | { url: string; code: string }) {
  if (submitting.value) return;
  stopCamera();
  submitting.value = true;
  error.value = "";
  try {
    await changeDeviceConnection(action, body);
    restarting.value = true;
  } catch (cause) {
    error.value = errorMessage(cause);
    submitting.value = false;
  }
}

watch(deviceHubEnabled, enabled => {
  if (!enabled) return;
  stopCamera();
  candidate.value = undefined;
  view.value = "scan";
  error.value = "";
});

watch(visible, async open => {
  stopCamera();
  const run = ++dialogRun;
  if (!open) return;
  candidate.value = undefined;
  view.value = mobileConnection.value.mode === "remote" ? "current" : "scan";
  error.value = "";
  restarting.value = submitting.value = false;
  loading.value = true;
  try {
    const connection = await refreshMobileConnection();
    if (!visible.value || run !== dialogRun) return;
    view.value = connection.mode === "remote" ? "current" : "scan";
    if (connection.mode === "local") void startCamera();
  } catch (cause) {
    if (visible.value && run === dialogRun) error.value = errorMessage(cause);
  } finally {
    if (run === dialogRun) loading.value = false;
  }
}, { immediate: true });

function visibilityChanged() {
  if (document.hidden) stopCamera();
}

function viewportResized() {
  viewportHeight.value = window.visualViewport?.height ?? window.innerHeight;
}

onMounted(() => {
  document.addEventListener("visibilitychange", visibilityChanged);
  window.visualViewport?.addEventListener("resize", viewportResized);
});
onBeforeUnmount(() => {
  stopCamera();
  dialogRun++;
  document.removeEventListener("visibilitychange", visibilityChanged);
  window.visualViewport?.removeEventListener("resize", viewportResized);
});
</script>

<style lang="scss" scoped>
:global(.deviceConnectOverlay),
:global(.deviceConnectOverlay .el-overlay-dialog) { scrollbar-width: none; }
:global(.deviceConnectOverlay::-webkit-scrollbar),
:global(.deviceConnectOverlay .el-overlay-dialog::-webkit-scrollbar) { display: none; }

.mobileConnect {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
  padding: 4px;

  &, .connectionBody {
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }

  &.compact {
    overflow-y: auto;
    overscroll-behavior: contain;
    .connectionBody {
      flex: none;
      overflow: visible;
      .scanPanel .scannerView { width: 216px; }
    }
  }

  .inputModes {
    flex-shrink: 0;
    --el-segmented-bg-color: var(--el-fill-color-light);
    --el-segmented-item-selected-bg-color: var(--el-bg-color-overlay);
    --el-segmented-item-selected-color: var(--el-color-primary);
    --el-border-radius-base: var(--ui-radius);

    .modeOption { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 6px 0; font-weight: 500; }
  }

  .connectionBody {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 16px;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;

    > section { flex-shrink: 0; }
    .description { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.7; }

    .manualPanel {
      display: grid;
      gap: 16px;

      .el-form-item { margin-bottom: 16px; }
      .manualActions {
        display: flex;
        flex-direction: row-reverse;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        .el-button { margin-left: 0; }
      }
    }

    .connectionInfo {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      text-align: center;

      h3 { margin: 0; font-size: 20px; }
      code { max-width: 100%; overflow-wrap: anywhere; color: var(--el-text-color-regular); user-select: text; }
      .connectionActions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; .el-button { margin-left: 0; } }
    }

    .scanPanel {
      display: grid;
      grid-template-areas: "info" "scanner" "actions";
      justify-items: center;
      gap: 16px;

      .scanInfo {
        grid-area: info;
        text-align: center;
        h3 { margin: 0 0 6px; color: var(--el-text-color-primary); font-size: 14px; font-weight: 500; }
      }

      .scannerView {
        grid-area: scanner;
        position: relative;
        width: 216px;
        max-width: 100%;
        aspect-ratio: 1;
        overflow: hidden;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: var(--ui-radius-large);
        background: var(--el-fill-color-lighter);

        video { display: block; width: 100%; height: 100%; object-fit: cover; }
        .scannerFrame { position: absolute; inset: 14px; width: calc(100% - 28px); height: calc(100% - 28px); color: var(--el-color-primary-light-3); pointer-events: none; }
        .scannerHint {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px;
          color: var(--el-text-color-secondary);
          text-align: center;
          span { font-size: 12px; line-height: 1.6; }
        }
      }

      .scanActions {
        grid-area: actions;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 8px;
        .el-button { margin-left: 0; }
        .imageInput { display: none; }
      }

      @media (min-width: 560px) and (max-height: 600px) {
        grid-template-columns: minmax(0, 216px) minmax(0, 1fr);
        grid-template-areas: "scanner info" "scanner actions";
        align-items: center;
        justify-items: start;
        column-gap: 20px;
        row-gap: 12px;

        .scanInfo { align-self: end; text-align: left; }
        .scanActions { align-self: start; justify-content: flex-start; }
        .scannerView { width: min(216px, 44dvh); }
      }
    }
  }
}
</style>
