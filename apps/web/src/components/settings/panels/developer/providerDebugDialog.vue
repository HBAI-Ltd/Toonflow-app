<template>
  <el-dialog v-model="visible" title="供应商开发工具" :width="provider ? 'min(1120px, calc(100vw - 32px))' : 'min(560px, calc(100vw - 32px))'" alignCenter appendToBody destroyOnClose :closeOnClickModal="false" @closed="reset">
    <div class="providerDebug" :class="{ hasProvider: !!provider }">
      <div class="sourceBar">
        <div class="sourceInfo">
          <el-text tag="strong">{{ fileName || '选择本地供应商文件' }}</el-text>
          <el-text size="small" type="info">每次运行自动读取文件最新内容{{ modifiedAt ? ` · ${modifiedAt}` : '' }}</el-text>
        </div>
        <el-button v-if="fileName" :icon="IconRefresh" :loading="action === 'refresh'" :disabled="busy" @click="refreshFile">执行并加载配置</el-button>
        <el-button :icon="IconFolderOpen" :loading="action === 'select'" :disabled="busy" @click="selectFile">选择文件</el-button>
      </div>
      <providerTestPanel v-if="provider" ref="testPanel" :source="source" :provider="provider" :disabled="!!action" :beforeRun="refreshProvider" @busyChange="testing = $event">
        <template #actions>
          <el-button :icon="IconDownload" :disabled="busy || !source" :loading="action === 'install'" @click="install">安装供应商</el-button>
        </template>
      </providerTestPanel>
      <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" showIcon />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";
import { IconFolderOpen, IconRefresh, IconDownload } from "@tabler/icons-vue";
import { invalidateNodeModels } from "@toonflow/nodes-scaffold/nodeAi";
import { actualPlatform } from "@/lib/platform";
import providerTestPanel from "../mediaModel/providerTestPanel.vue";
import type { MediaProvider } from "../mediaModel/types";

type DebugProvider = Pick<MediaProvider, "id" | "label" | "rules" | "models">;
type FileHandle = { getFile(): Promise<File>; requestPermission?(options: { mode: "read" }): Promise<PermissionState> };
type SourceFile = { name: string; source: string; lastModified: number };
const visible = defineModel<boolean>({ default: false });
const provider = shallowRef<DebugProvider>();
const testPanel = ref<InstanceType<typeof providerTestPanel>>();
const handle = shallowRef<FileHandle>();
const desktopToken = ref("");
const fileName = ref("");
const modifiedAt = ref("");
const source = ref("");
const action = ref<"" | "select" | "refresh" | "install">("");
const testing = ref(false);
const busy = computed(() => !!action.value || testing.value);
const errorMessage = ref("");
const desktopHeaders = { "x-toonflow-desktop": "1" };
let controller: AbortController | undefined;

function showError(error: unknown) {
  errorMessage.value = axios.isAxiosError(error) ? error.response?.data?.message || error.message : error instanceof Error ? error.message : String(error);
}

async function readSource(signal: AbortSignal): Promise<SourceFile> {
  if (actualPlatform.isDesktop) {
    const { data } = await axios.post<{ data: SourceFile }>("/api/desktop/providerFile/read", { token: desktopToken.value }, { headers: desktopHeaders, signal });
    return data.data;
  }
  if (!handle.value) throw new Error("请先选择供应商文件");
  if (handle.value.requestPermission && await handle.value.requestPermission({ mode: "read" }) !== "granted") throw new Error("请允许读取供应商文件");
  const file = await handle.value.getFile();
  if (!/\.ts$/i.test(file.name) || file.size > 2 * 1024 * 1024) throw new Error("请选择不超过 2 MB 的 .ts 文件");
  return { name: file.name, source: await file.text(), lastModified: file.lastModified };
}

async function refreshProvider(signal: AbortSignal) {
  source.value = "";
  errorMessage.value = "";
  const file = await readSource(signal);
  signal.throwIfAborted();
  const { data } = await axios.post<{ data: DebugProvider }>("/api/providers/debug/inspect", { source: file.source }, { headers: { "x-toonflow-workspace": "1" }, signal });
  signal.throwIfAborted();
  provider.value = data.data;
  fileName.value = file.name;
  modifiedAt.value = new Date(file.lastModified).toLocaleTimeString();
  source.value = file.source;
  await nextTick();
}

async function selectFile() {
  if (busy.value) return;
  action.value = "select";
  errorMessage.value = "";
  const owner = new AbortController();
  controller = owner;
  const signal = owner.signal;
  try {
    if (actualPlatform.isDesktop) {
      const { data } = await axios.post<{ data: { token: string; name: string } | null }>("/api/desktop/providerFile/select", {}, { headers: desktopHeaders, signal });
      signal.throwIfAborted();
      if (!data.data) return;
      desktopToken.value = data.data.token;
      fileName.value = data.data.name;
    } else {
      const picker = (window as Window & { showOpenFilePicker?: (options: unknown) => Promise<FileHandle[]> }).showOpenFilePicker;
      if (!picker) throw new Error("当前环境不支持文件授权，请使用 HTTPS／localhost 下的 Chrome、Edge 或桌面端");
      const [selected] = await picker.call(window, { multiple: false, types: [{ description: "TypeScript 供应商", accept: { "text/plain": [".ts"] } }] });
      if (!selected) return;
      const file = await selected.getFile();
      signal.throwIfAborted();
      handle.value = selected;
      fileName.value = file.name;
    }
    provider.value = undefined;
    source.value = modifiedAt.value = "";
  } catch (error) { if (!signal.aborted && !(error instanceof DOMException && error.name === "AbortError")) showError(error); }
  finally { if (controller === owner) { controller = undefined; action.value = ""; } }
}

async function refreshFile() {
  if (busy.value) return;
  action.value = "refresh";
  const owner = new AbortController();
  controller = owner;
  try { await refreshProvider(owner.signal); }
  catch (error) { if (!owner.signal.aborted) showError(error); }
  finally { if (controller === owner) { controller = undefined; action.value = ""; } }
}

async function install() {
  if (busy.value || !source.value) return;
  action.value = "install";
  errorMessage.value = "";
  const owner = new AbortController();
  controller = owner;
  try {
    await axios.post("/api/providers/media/add", { source: source.value }, { signal: owner.signal });
    owner.signal.throwIfAborted();
    invalidateNodeModels("media");
    ElMessage.success("供应商已安装，可在媒体模型设置中配置使用");
  } catch (error) { if (!owner.signal.aborted) showError(error); }
  finally { if (controller === owner) { controller = undefined; action.value = ""; } }
}

function reset() {
  controller?.abort();
  controller = undefined;
  testPanel.value?.reset();
  provider.value = undefined;
  handle.value = undefined;
  desktopToken.value = fileName.value = modifiedAt.value = source.value = errorMessage.value = action.value = "";
  testing.value = false;
}
watch(visible, value => { if (!value) { controller?.abort(); testPanel.value?.stop(); } });
onBeforeUnmount(reset);
</script>

<style lang="scss" scoped>
.providerDebug {
  display: flex;
  flex-direction: column;
  gap: 16px;
  &.hasProvider { height: min(660px, calc(100dvh - 180px)); }
  > .el-alert { flex-shrink: 0; max-height: 120px; overflow: auto; }
  .sourceBar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
    .sourceInfo {
      display: flex;
      flex: 1;
      min-width: 0;
      flex-direction: column;
      gap: 4px;
      overflow-wrap: anywhere;
      .el-text { align-self: flex-start; }
    }
    .el-button { margin: 0; }
  }
  @media (max-width: 760px) { .sourceBar { flex-wrap: wrap; } }
}
</style>
