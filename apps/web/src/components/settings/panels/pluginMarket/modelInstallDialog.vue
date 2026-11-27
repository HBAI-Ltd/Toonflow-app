<template>
  <el-dialog :modelValue="visible" title="安装模型" width="min(440px, calc(100vw - 24px))" alignCenter appendToBody
    destroyOnClose :closeOnClickModal="false" :beforeClose="() => finish(false)">
    <div class="installBody" :aria-busy="checking || busy">
      <el-alert v-if="statusError" :title="statusError" type="error" :closable="false" showIcon />
      <template v-if="target">
        <section v-for="item in shownItems" :key="item.id" class="assetRow" :aria-label="modelTitle(item)">
          <header class="assetHeader">
            <h3>{{ modelTitle(item) }}</h3>
            <el-tag size="small" effect="plain" :type="!item.installing && (item.installed || item.remoteAvailable || target.canRun) ? 'success' : 'info'" role="status">
              {{ item.installing ? installPhaseLabel(item.progress) : item.remoteAvailable ? "服务端已提供" : item.id === target.id && target.canRun ? "已就绪" : item.installed ? "已安装" : "未安装" }}
            </el-tag>
          </header>
          <div class="assetDetails">
            <bdi v-if="item.displayName && item.displayName !== item.name">{{ item.name }}</bdi>
            <bdi v-if="item.version">{{ item.version }}</bdi>
            <bdi v-if="item.size && !target.canRun && !item.remoteAvailable">{{ formatModelSize(item.size) }}</bdi>
          </div>
          <modelInstallProgress v-if="item.progress" :progress="item.progress" />
          <div v-if="!target.canRun && !item.installed && !item.remoteAvailable && !unavailable" class="assetActions">
            <el-select v-if="item.sources.length > 1" size="small" :modelValue="getModelSource(item, sourceIds[item.id])?.id"
              aria-label="下载线路" :disabled="busy || checking" @update:modelValue="sourceIds[item.id] = $event">
              <el-option v-for="source in item.sources" :key="source.id" :label="source.label" :value="source.id" />
            </el-select>
            <el-button size="small" :icon="IconUpload" :title="item.fileName" :disabled="busy || checking" @click="chooseFile(item)">导入文件</el-button>
          </div>
          <el-alert v-if="installError?.id === item.id && !target.canRun" :title="installError.message" type="error" :closable="false" showIcon />
        </section>
        <el-alert v-if="unavailable" :title="unavailable" type="warning" :closable="false" showIcon />
      </template>
      <p v-else-if="checking" role="status">加载中…</p>
      <el-alert v-else-if="!statusError" title="未找到这个模型。" type="warning" :closable="false" showIcon />
      <input ref="fileInput" type="file" hidden @change="importFile" />
    </div>
    <template #footer>
      <el-button @click="finish(false)">关闭</el-button>
      <el-button v-if="statusError || (!checking && !target) || unavailable" :icon="IconRefresh" @click="refresh">重新检测</el-button>
      <el-button v-else-if="target?.canRun" type="primary" :disabled="checking || busy" @click="finish(true)">继续</el-button>
      <el-button v-else-if="downloadItems.length || busy" type="primary" :icon="IconDownload" :loading="busy"
        :disabled="checking || busy" @click="download">下载并安装</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef } from "vue";
import { IconDownload, IconRefresh, IconUpload } from "@tabler/icons-vue";
import { translate } from "@toonflow/i18n/vue";
import type { LocalModelItem } from "@toonflow/server/localModels";
import { formatModelSize, getModelSource, installModelAsset, installPhaseLabel, modelTitle, useModelCatalog } from "./modelInstallation";
import modelInstallProgress from "./modelInstallProgress.vue";

type InstallRequest = Pick<PromiseWithResolvers<boolean>, "promise" | "resolve"> & { id: string };
const pending = shallowRef<InstallRequest>();
const visible = computed(() => !!pending.value);
const { status, checking, statusError, refresh } = useModelCatalog(() => pending.value);
const target = computed(() => status.value?.items.find(item => item.id === pending.value?.id));
const requiredIds = computed(() => {
  const item = target.value;
  if (!item || item.canRun) return [];
  return item.requiredAssetIds ?? (item.fileName.toLowerCase().endsWith(".onnx") ? ["onnxRuntime"] : []);
});
const dependencies = computed(() => requiredIds.value.flatMap(id => status.value?.items.filter(item => item.id === id) ?? []));
const shownItems = computed(() => target.value ? [target.value, ...dependencies.value.filter(item => !item.installed)] : []);
const unavailable = computed(() => {
  if (!target.value || target.value.canRun) return "";
  if (requiredIds.value.includes("whisperRuntime") && !dependencies.value.some(item => item.id === "whisperRuntime")) return translate("请安装 whisper.cpp 的 whisper-cli 并加入 PATH");
  if (dependencies.value.some(item => item.id === "onnxRuntime" && !item.fileName)) return translate("当前平台暂不支持安装 ONNX Runtime。");
  if ((!target.value.fileName && !target.value.remoteAvailable) || dependencies.value.length !== requiredIds.value.length || dependencies.value.some(item => !item.fileName)
    || ((target.value.installed || target.value.remoteAvailable) && dependencies.value.every(item => item.installed))) return translate("此模型缺少可用的运行方式。");
  return "";
});
const downloadItems = computed(() => target.value && !target.value.canRun && !unavailable.value
  ? [...dependencies.value, target.value].filter(item => !item.installed && !item.remoteAvailable && item.sources.length) : []);
const sourceIds = ref<Record<string, string>>({});
const busy = computed(() => shownItems.value.some(item => item.installing));
const installError = ref<{ id: string; message: string }>();
const fileInput = ref<HTMLInputElement>();
let selectedFile: { request: InstallRequest; item: LocalModelItem } | undefined;

function open(id: string) {
  if (pending.value?.id === id) return pending.value.promise;
  finish(false);
  sourceIds.value = {};
  installError.value = undefined;
  const request = { id, ...Promise.withResolvers<boolean>() };
  pending.value = request;
  return request.promise;
}

function finish(ready: boolean) {
  const request = pending.value;
  if (ready && (!target.value?.canRun || checking.value || busy.value || statusError.value)) return;
  pending.value = undefined;
  selectedFile = undefined;
  request?.resolve(ready);
}

async function install(assets: { item: LocalModelItem; input: string | File }[]) {
  const request = pending.value;
  if (!request || busy.value || checking.value || statusError.value || target.value?.canRun || unavailable.value) return;
  installError.value = undefined;
  for (const { item, input } of assets) {
    try {
      // 关闭弹窗会放弃原节点的后续操作，已经提交的依赖和模型仍按顺序安装。
      if (pending.value?.id === request.id && target.value?.canRun) break;
      await installModelAsset(item, input);
    } catch (error) {
      if (pending.value?.id === request.id) installError.value = { id: item.id, message: error instanceof Error ? error.message : translate("安装失败") };
      break;
    }
  }
}

function download() {
  void install(downloadItems.value.flatMap(item => {
    const source = getModelSource(item, sourceIds.value[item.id]);
    return source ? [{ item, input: source.id }] : [];
  }));
}

function chooseFile(item: LocalModelItem) {
  if (!pending.value || !fileInput.value) return;
  selectedFile = { request: pending.value, item };
  fileInput.value.accept = item.fileName.match(/\.[a-z][a-z\d]{0,8}$/i)?.[0] ?? "";
  fileInput.value.click();
}

function importFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (file && selectedFile && selectedFile.request === pending.value) void install([{ item: selectedFile.item, input: file }]);
  selectedFile = undefined;
}

onBeforeUnmount(() => finish(false));
defineExpose({ open, visible });
</script>

<style scoped lang="scss">
.installBody {
  display: grid;
  gap: 12px;
  max-height: 60vh;
  overflow-y: auto;

  p { margin: 0; }
  .assetRow {
    min-width: 0;
    & + .assetRow { border-block-start: 1px solid var(--el-border-color-lighter); padding-block-start: 12px; }
    .assetHeader, .assetDetails, .assetActions { display: flex; align-items: center; flex-wrap: wrap; gap: 5px 8px; }
    .assetHeader {
      justify-content: space-between;
      h3 { margin: 0; color: var(--el-text-color-primary); font-size: 15px; line-height: 1.5; overflow-wrap: anywhere; }
    }
    .assetDetails { margin-block-start: 3px; color: var(--el-text-color-secondary); font-size: 12px; overflow-wrap: anywhere; }
    .el-alert { margin-block-start: 8px; }
    .assetActions {
      margin-block-start: 9px;
      .el-select { width: min(168px, 100%); }
    }
  }
}
</style>
