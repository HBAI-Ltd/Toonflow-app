<template>
  <div v-loading="loading" class="deviceLink">
    <section v-if="isRemoteConnection" class="remoteConnection" aria-label="当前连接设备">
      <el-tag :type="mobileConnection.online === true ? mobileConnectionVersionWarning ? 'warning' : 'success' : mobileConnection.online === false ? 'danger' : 'info'">{{ mobileConnectionLabel }}</el-tag>
      <h3>{{ mobileConnection.name || 'Toonflow' }}</h3>
      <code>{{ mobileConnection.url }}</code>
      <p class="description">当前使用这个设备的项目与配置。断开后恢复独立运行，才可以允许其他设备连接。</p>
      <el-alert v-if="mobileConnectionVersionWarning" :title="mobileConnectionVersionWarning" type="warning" :closable="false" showIcon />
      <el-button type="primary" :loading="saving" @click="disconnectRemote">断开并独立运行</el-button>
      <el-alert v-if="error" :title="error" type="error" :closable="false" showIcon />
    </section>
    <template v-else>
    <section class="settingSection" aria-labelledby="deviceLinkTitle">
      <div class="sectionHeader">
        <div class="settingInfo">
          <h3 id="deviceLinkTitle">允许其他设备连接</h3>
          <p class="description">其他电脑、安卓设备可使用这里的项目与配置。连接时请保持 Toonflow 运行。</p>
        </div>
        <el-switch :modelValue="form.enabled" :disabled="busy || !status" aria-label="允许其他设备连接" @change="value => saveConfig(value === true)" />
      </div>
    </section>

    <template v-if="status?.enabled">
      <section class="settingSection pairingSection" :class="{ pairingUnavailable: !pairing }" aria-labelledby="pairingTitle">
        <div class="pairingIntro">
          <div class="sectionHeader">
            <h3 id="pairingTitle">连接新设备</h3>
            <el-button :icon="IconQrcode" :loading="generating" :disabled="busy || !pairingUrl" text @click="generatePairing">{{ pairing ? '刷新二维码' : pairedSuccessfully ? '连接另一个设备' : '生成二维码' }}</el-button>
          </div>
          <p v-if="addressMode === 'lan'" class="description">在同一 Wi-Fi 下，打开另一台设备的“设备互联”，扫码或手动输入。</p>
          <p v-else class="description">打开另一台设备的“设备互联”，扫码或手动输入，即可通过公网连接。</p>
        </div>
        <div class="pairingPanel">
          <div v-if="pairing" class="pairingCode">
            <q-r-code :value="pairing.qrCode" :size="176" type="svg" color="#18181b" bgColor="#ffffff" />
          </div>
          <p v-else-if="generating" class="description" role="status">正在准备二维码…</p>
          <el-alert v-else-if="pairingNotice" :title="pairingNotice" :type="pairedSuccessfully && pairedDevice?.online ? 'success' : 'info'" :closable="false" showIcon />
          <el-alert v-else-if="!pairingUrl" :title="addressMode === 'lan' ? '没有找到可用的 Wi-Fi 地址，请检查电脑网络，或在高级选项中选择其他连接方式。' : '请在高级选项中填写并保存公网连接地址。'" type="warning" :closable="false" showIcon />
        </div>
        <div v-if="pairing?.manualCode" class="manualConnection">
          <div class="manualField">
            <span>连接地址</span>
            <div class="fieldValue">
              <code dir="ltr">{{ pairing.url }}</code>
              <el-button type="primary" link aria-label="复制地址" @click="copyConnectionInfo(pairing.url)">复制</el-button>
            </div>
          </div>
          <div class="manualField">
            <span>12 位配对码</span>
            <div class="fieldValue">
              <code class="manualCode" dir="ltr">{{ formattedManualCode }}</code>
              <el-button type="primary" link aria-label="复制配对码" @click="copyConnectionInfo(formattedManualCode)">复制</el-button>
            </div>
          </div>
        </div>
      </section>

      <section class="settingSection devicePanel" aria-labelledby="linkedDevicesTitle">
        <div class="sectionHeader">
          <h3 id="linkedDevicesTitle">设备连接状态</h3>
          <el-button :icon="IconRefresh" :disabled="busy" text aria-label="刷新设备连接状态" @click="loadStatus(false, true)">刷新</el-button>
        </div>
        <div v-for="device in status.devices" :key="device.id" class="deviceItem">
          <span class="deviceName">{{ device.name }}</span>
          <el-tag :type="device.online ? 'success' : 'info'" size="small">{{ device.online ? '已连接' : '离线' }}</el-tag>
          <el-button type="danger" link :disabled="busy" @click="revokeDevice(device.id)">撤销</el-button>
          <el-alert v-if="device.online && getDeviceVersionWarning(status.appVersion, device.appVersion)" class="deviceVersionWarning" :title="getDeviceVersionWarning(status.appVersion, device.appVersion)" type="warning" :closable="false" showIcon />
        </div>
        <p v-if="!status.devices.length" class="description">等待设备连接</p>
      </section>
    </template>

    <el-alert v-if="error" :title="error" type="error" :closable="false" showIcon />
    <el-button v-if="!status && !loading" :icon="IconRefresh" @click="loadStatus()">重新加载</el-button>

    <el-collapse class="advancedSettings">
      <el-collapse-item title="高级选项" name="advanced">
        <section class="settingSection" aria-label="连接设置">
          <el-form class="connectionForm" labelPosition="top" :disabled="busy || !status">
            <el-form-item label="连接方式">
              <el-radio-group v-model="addressMode" aria-label="连接方式">
                <el-radio-button value="lan">同一 Wi-Fi</el-radio-button>
                <el-radio-button value="public">公网连接</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="addressMode === 'lan'" label="电脑地址">
              <el-select v-if="(status?.addresses.length ?? 0) > 1" v-model="selectedAddress" aria-label="局域网地址">
                <el-option v-for="address in status?.addresses ?? []" :key="address" :label="address" :value="address" />
              </el-select>
              <code v-else class="connectionAddress">{{ selectedAddress || '未找到可用地址' }}</code>
              <p class="description">无法连接时可尝试其他地址，并检查电脑防火墙是否允许 Toonflow 联网。</p>
            </el-form-item>
            <el-form-item v-if="addressMode === 'public'" label="公网 HTTPS 地址">
              <el-input v-model="form.publicUrl" placeholder="https://toonflow.example.com" aria-label="公网 HTTPS 地址" />
              <p class="description">请将这个 HTTPS 地址转发到下方互联端口，保留请求路径。保存后生效。</p>
            </el-form-item>
            <el-form-item label="互联端口">
              <el-input-number v-model="form.port" :min="1" :max="65535" :precision="0" controlsPosition="right" aria-label="互联端口" />
              <p class="description">通常无需修改。</p>
            </el-form-item>
          </el-form>
        </section>
        <section class="settingSection" aria-labelledby="sharedDirectoriesTitle">
          <div class="sectionHeader">
            <h3 id="sharedDirectoriesTitle">共享工作目录</h3>
            <el-button :icon="IconFolderPlus" :disabled="busy || !status" @click="addDirectory">添加目录</el-button>
          </div>
          <p class="description">这些工作目录允许连接设备访问；服务器自带工作区也可使用。首次开启会使用已有项目的工作目录。</p>
          <div class="directoryList">
            <el-tag v-for="directory in form.directories" :key="directory" class="directoryTag" :closable="!busy" :title="directory" @close="removeDirectory(directory)">{{ directory }}</el-tag>
          </div>
        </section>
        <div class="advancedActions">
          <el-button type="primary" :loading="saving" :disabled="busy || !status || !dirty" @click="saveConfig()">保存修改</el-button>
        </div>
      </el-collapse-item>
    </el-collapse>
    <workspacePicker ref="directoryPicker" hideTrigger />
    </template>
  </div>
</template>

<script setup lang="ts">
import axios from "axios";
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { QRCode } from "tdesign-vue-next";
import { IconFolderPlus, IconQrcode, IconRefresh } from "@tabler/icons-vue";
import { useWorkspaceStore } from "@/stores/workspace";
import workspacePicker from "@/pages/home/workspacePicker.vue";
import { writeClipboardText } from "@/lib/clipboard";
import { changeDeviceConnection, deviceHubEnabled, getDeviceVersionWarning, isRemoteConnection, mobileConnection, mobileConnectionLabel, mobileConnectionVersionWarning } from "@/lib/mobile";

type LinkStatus = { enabled: boolean; hubEnabled?: boolean; initialized: boolean; pairingAvailable: boolean; port: number; addresses: string[]; publicUrl: string; directories: string[]; appVersion?: string; devices: { id: string; name: string; online: boolean; lastSeen?: number; appVersion?: string }[] };
type Pairing = { qrCode: string; manualCode: string; url: string };
type ApiResponse<T> = { code: number; data: T; message?: string };

const props = withDefaults(defineProps<{ visible?: boolean }>(), { visible: true });
const workspaceStore = useWorkspaceStore();
const headers = { "x-toonflow-mobile-link": "1" };
const status = ref<LinkStatus>();
const form = reactive({ enabled: false, port: 43123, publicUrl: "", directories: [] as string[] });
const directoryPicker = ref<InstanceType<typeof workspacePicker>>();
const addressMode = ref<"lan" | "public">("lan");
const selectedAddress = ref("");
const pairing = ref<Pairing>();
const formattedManualCode = computed(() => (pairing.value?.manualCode ?? "").replace(/(\d{4})(?=\d)/g, "$1 "));
const pairingMessage = ref("");
const pairedSuccessfully = ref(false);
const pairingFinished = ref(false);
const pairedDevice = computed(() => status.value?.devices.find(device => !pairingDeviceIds.has(device.id)));
const pairingNotice = computed(() => {
  if (!pairedSuccessfully.value) return pairingMessage.value;
  if (pairedDevice.value?.online) return "设备已连接";
  return pairedDevice.value?.lastSeen !== undefined ? "设备连接已断开" : "配对成功，等待设备连接";
});
const error = ref("");
const loading = ref(false);
const saving = ref(false);
const generating = ref(false);
const revoking = ref(false);
const selecting = ref(false);
const busy = computed(() => loading.value || saving.value || generating.value || revoking.value || selecting.value);
const pairingUrl = computed(() => addressMode.value === "public" ? status.value?.publicUrl ?? "" : selectedAddress.value);
const dirty = computed(() => !!status.value && (!status.value.initialized || form.enabled !== (status.value.hubEnabled ?? status.value.enabled) || form.port !== status.value.port
  || form.publicUrl.trim() !== status.value.publicUrl || JSON.stringify(form.directories) !== JSON.stringify(status.value.directories)));
let readController: AbortController | undefined;
let pairingController: AbortController | undefined;
let autoPairingUrl = "";
let pairingDeviceIds = new Set<string>();
let polling = false;
let timer: ReturnType<typeof setInterval> | undefined;

function errorMessage(cause: unknown) {
  return axios.isAxiosError<{ message?: string }>(cause) ? cause.response?.data?.message || cause.message : cause instanceof Error ? cause.message : "操作失败，请重试";
}

async function copyConnectionInfo(value: string) {
  try {
    await writeClipboardText(value);
    ElMessage.success("已复制");
  } catch {
    ElMessage.error("复制失败，请手动选择并复制");
  }
}

async function disconnectRemote() {
  if (saving.value) return;
  saving.value = true;
  error.value = "";
  try {
    await changeDeviceConnection("disconnect");
  } catch (cause) {
    error.value = errorMessage(cause);
    saving.value = false;
  }
}

async function loadStatus(resetForm = true, quiet = false) {
  if (isRemoteConnection) return;
  if (quiet && (busy.value || polling || !props.visible || document.hidden)) return;
  readController?.abort();
  const request = new AbortController();
  readController = request;
  polling = quiet;
  if (!quiet) {
    loading.value = true;
    error.value = "";
  }
  try {
    const { data } = await axios.get<ApiResponse<LinkStatus>>("/api/mobileLink/status", { headers, signal: request.signal, timeout: 8000 });
    if (request.signal.aborted) return;
    if (data.code !== 200) throw new Error(data.message || "读取互联状态失败");
    const preserveForm = quiet || !resetForm && dirty.value;
    if (pairing.value && !data.data.pairingAvailable) {
      pairedSuccessfully.value = data.data.devices.some(device => !pairingDeviceIds.has(device.id));
      pairingMessage.value = pairedSuccessfully.value ? "" : "二维码已更新，请重新生成。";
      pairingFinished.value = true;
      pairing.value = undefined;
    }
    if (pairedSuccessfully.value && !data.data.devices.some(device => !pairingDeviceIds.has(device.id))) {
      pairedSuccessfully.value = false;
      pairingMessage.value = "设备授权已撤销，可重新生成二维码。";
    }
    status.value = data.data;
    deviceHubEnabled.value = data.data.hubEnabled ?? data.data.enabled;
    if (!preserveForm) Object.assign(form, {
      enabled: data.data.hubEnabled ?? data.data.enabled, port: data.data.port, publicUrl: data.data.publicUrl,
      directories: data.data.initialized === false ? [...new Set(workspaceStore.projectList.map(project => project.directory))] : [...data.data.directories],
    });
    if (!data.data.addresses.includes(selectedAddress.value)) selectedAddress.value = data.data.addresses[0] ?? "";
    if (!data.data.enabled) pairing.value = undefined;
    if (!quiet && !pairing.value && !pairingFinished.value) autoPairingUrl = "";
    return true;
  } catch (cause) {
    if (!request.signal.aborted) {
      if (!quiet) error.value = errorMessage(cause);
      else if (status.value) status.value = { ...status.value, devices: status.value.devices.map(device => ({ ...device, online: false })) };
    }
  } finally {
    if (readController === request) {
      loading.value = false;
      polling = false;
    }
  }
}

async function saveConfig(enabled = form.enabled) {
  if (isRemoteConnection || busy.value || !status.value) return;
  form.enabled = enabled;
  saving.value = true;
  error.value = "";
  try {
    if (!Number.isInteger(form.port) || form.port < 1 || form.port > 65535) throw new Error("请输入 1–65535 之间的端口");
    const { data } = await axios.put<ApiResponse<LinkStatus>>("/api/mobileLink/config", { ...form, publicUrl: form.publicUrl.trim() }, { headers });
    if (data.code !== 200) throw new Error(data.message || "保存配置失败");
    deviceHubEnabled.value = data.data.hubEnabled ?? data.data.enabled;
    pairing.value = undefined;
    pairingMessage.value = "";
    pairedSuccessfully.value = pairingFinished.value = false;
    autoPairingUrl = "";
    if (await loadStatus()) ElMessage.success("互联配置已保存");
  } catch (cause) {
    form.enabled = status.value.hubEnabled ?? status.value.enabled;
    error.value = errorMessage(cause);
  } finally {
    saving.value = false;
  }
}

async function addDirectory() {
  if (busy.value) return;
  selecting.value = true;
  try {
    const directory = await directoryPicker.value?.chooseDirectory();
    if (directory && !form.directories.includes(directory)) form.directories.push(directory);
  } finally {
    selecting.value = false;
  }
}

function removeDirectory(directory: string) {
  if (!busy.value) form.directories = form.directories.filter(item => item !== directory);
}

async function generatePairing() {
  if (busy.value || !props.visible || !status.value?.enabled || !pairingUrl.value) return;
  const url = pairingUrl.value;
  if (polling) readController?.abort();
  autoPairingUrl = url;
  const request = new AbortController();
  pairingController = request;
  generating.value = true;
  pairing.value = undefined;
  pairingMessage.value = "";
  pairedSuccessfully.value = pairingFinished.value = false;
  error.value = "";
  try {
    const { data } = await axios.post<ApiResponse<Pairing>>("/api/mobileLink/pairing", { url }, { headers, signal: request.signal });
    if (request.signal.aborted || !props.visible || url !== pairingUrl.value) return;
    if (data.code !== 200) throw new Error(data.message || "生成二维码失败");
    pairing.value = data.data;
    pairingDeviceIds = new Set(status.value.devices.map(device => device.id));
  } catch (cause) {
    if (!request.signal.aborted) error.value = errorMessage(cause);
  } finally {
    if (pairingController === request) generating.value = false;
  }
}

async function revokeDevice(id: string) {
  if (busy.value) return;
  revoking.value = true;
  error.value = "";
  try {
    await ElMessageBox.confirm("撤销后，这个设备将无法继续访问当前 Toonflow。", "撤销设备授权", { confirmButtonText: "撤销授权", cancelButtonText: "取消", type: "warning" });
    const { data } = await axios.post<ApiResponse<unknown>>("/api/mobileLink/revoke", { id }, { headers });
    if (data.code !== 200) throw new Error(data.message || "撤销授权失败");
    await loadStatus(false);
  } catch (cause) {
    if (cause !== "cancel" && cause !== "close") error.value = errorMessage(cause);
  } finally {
    revoking.value = false;
  }
}

watch(pairingUrl, () => {
  pairing.value = undefined;
  pairingMessage.value = "";
  pairedSuccessfully.value = pairingFinished.value = false;
  autoPairingUrl = "";
});
watch(() => props.visible, visible => {
  clearInterval(timer);
  readController?.abort();
  pairingController?.abort();
  pairingController = undefined;
  generating.value = false;
  loading.value = polling = false;
  pairing.value = undefined;
  pairingMessage.value = "";
  pairedSuccessfully.value = pairingFinished.value = false;
  autoPairingUrl = "";
  if (!visible || isRemoteConnection) return;
  addressMode.value = "lan";
  selectedAddress.value = "";
  void loadStatus();
  updatePolling();
}, { immediate: true });
watch([() => props.visible, () => status.value?.enabled, pairingUrl, pairing, busy], () => {
  if (props.visible && status.value?.enabled && pairingUrl.value && !pairing.value && !pairingFinished.value && !busy.value && autoPairingUrl !== pairingUrl.value) {
    void generatePairing();
  }
});

function updatePolling() {
  clearInterval(timer);
  if (props.visible && !isRemoteConnection && !document.hidden) timer = setInterval(() => { void loadStatus(false, true); }, 3000);
}

function visibilityChanged() {
  updatePolling();
  if (!document.hidden) void loadStatus(false, true);
}

onMounted(() => document.addEventListener("visibilitychange", visibilityChanged));
onBeforeUnmount(() => {
  readController?.abort();
  pairingController?.abort();
  clearInterval(timer);
  document.removeEventListener("visibilitychange", visibilityChanged);
});
</script>

<style lang="scss" scoped>
:global(.settings .panelContent:has(.deviceLink)) {
  padding-bottom: 8px;
  scrollbar-width: none;
}
:global(.settings .panelContent:has(.deviceLink)::-webkit-scrollbar) { display: none; }

.deviceLink {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 4px 8px;
  container-type: inline-size;

  h3 { margin: 0; color: var(--el-text-color-primary); font-size: 14px; font-weight: 600; }
  .description { margin: 6px 0 0; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.6; }

  .settingSection {
    min-width: 0;

    .sectionHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;

      .settingInfo { min-width: 0; }
      > .el-switch, > .el-button { flex-shrink: 0; }
    }
    .connectionForm { .el-form-item { margin-bottom: 16px; } .description { flex-basis: 100%; } }
    .directoryList { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
    .directoryTag { max-width: 100%; height: auto; padding: 6px 10px; :deep(.el-tag__content) { overflow-wrap: anywhere; white-space: normal; } }
    .connectionAddress { overflow-wrap: anywhere; user-select: text; }
  }

  .pairingSection {
    display: grid;
    grid-template-columns: 208px minmax(0, 1fr);
    grid-template-rows: auto 1fr;
    grid-template-areas: "qr intro" "qr manual";
    gap: 16px 24px;
    padding: 16px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--el-border-radius-base);
    background: var(--el-fill-color-extra-light);

    .pairingIntro {
      grid-area: intro;
      min-width: 0;
      .sectionHeader { flex-wrap: wrap; gap: 8px 12px; }
    }
    .pairingPanel {
      grid-area: qr;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      min-width: 0;

      .pairingCode {
        display: flex;
        box-sizing: border-box;
        max-width: 100%;
        padding: 16px;
        border-radius: var(--el-border-radius-base);
        background: #fff;

        :deep(.t-qrcode) { min-width: 0; max-width: 100%; height: auto !important; }
        :deep(svg) { display: block; width: 100%; height: auto; }
      }
    }
    .manualConnection {
      grid-area: manual;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 0;

      .manualField {
        display: grid;
        gap: 6px;
        min-width: 0;
        > span { color: var(--el-text-color-regular); font-size: 12px; }
        .fieldValue {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 10px;
          border: 1px solid var(--el-border-color-lighter);
          border-radius: var(--el-border-radius-base);
          background: var(--el-bg-color);

          code { min-width: 0; overflow-wrap: anywhere; user-select: text; font-size: 13px; line-height: 1.5; }
          .manualCode { font-size: 18px; letter-spacing: 1px; font-variant-numeric: tabular-nums; }
          .el-button { flex-shrink: 0; }
        }
      }
    }
    &.pairingUnavailable {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas: "intro" "qr";
      .pairingPanel { align-items: stretch; }
    }
  }
  .devicePanel {
    .deviceItem {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      align-items: center;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid var(--el-border-color-extra-light);

      .deviceName { min-width: 0; overflow-wrap: anywhere; }
      .deviceVersionWarning { grid-column: 1 / -1; }
      &:last-child { border-bottom: 0; padding-bottom: 0; }
    }
  }
  .advancedSettings {
    --el-collapse-border-color: transparent;
    border-top: 1px solid var(--el-border-color-lighter);
    .settingSection + .settingSection { margin-top: 20px; }
    .advancedActions { display: flex; justify-content: flex-end; margin-top: 20px; }
  }
  .remoteConnection {
    display: grid;
    justify-items: start;
    gap: 16px;
    padding: 20px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--el-border-radius-base);
    h3, p { margin: 0; }
    code { max-width: 100%; overflow-wrap: anywhere; user-select: text; }
  }

  @container (max-width: 560px) {
    .pairingSection {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto;
      grid-template-areas: "intro" "qr" "manual";
      gap: 16px;
    }
  }
}
</style>
