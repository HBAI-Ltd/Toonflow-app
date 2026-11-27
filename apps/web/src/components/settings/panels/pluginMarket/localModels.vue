<template>
  <el-card class="modelPanel" shadow="never">
    <section aria-label="本地模型">
      <header class="panelHeader">
        <h3>本地模型</h3>
        <p>按需下载或导入，在本机处理图片、视频和音频。</p>
        <el-button :icon="IconRefresh" :loading="checking" :disabled="busy" @click="refresh">重新检测</el-button>
      </header>
      <el-alert v-if="statusError" :title="statusError" type="error" :closable="false" showIcon />
      <ul class="modelList">
        <li v-for="item in status?.items" :key="item.id" class="runtimeRow">
          <div class="runtimeInfo">
            <div class="runtimeTitle">
              <h4>{{ modelTitle(item) }}</h4>
              <el-tag size="small" effect="plain" :type="!item.installing && (item.installed || item.remoteAvailable) ? 'success' : 'info'" role="status">
                {{ item.installing ? installPhaseLabel(item.progress) : item.remoteAvailable ? "服务端已提供" : !item.fileName ? "不可用" : item.installed ? "已安装" : "未安装" }}
              </el-tag>
            </div>
            <div class="runtimeDetails">
              <span v-if="item.displayName && item.displayName !== item.name"><bdi>{{ item.name }}</bdi><template v-if="item.version"> · <bdi>{{ item.version }}</bdi></template></span>
              <span v-else-if="item.version" dir="ltr">{{ item.version }}</span>
              <span v-if="item.owner"><span>插件</span> · <bdi>{{ item.owner.name }}</bdi></span>
              <span v-if="item.id === 'onnxRuntime' && item.fileName" dir="ltr">{{ platformLabel }}</span>
              <span v-if="item.size" dir="ltr">{{ formatModelSize(item.size) }}</span>
              <a v-if="!item.remoteAvailable && currentSource(item) && item.fileName" :href="currentSource(item)?.url" target="_blank" rel="noopener noreferrer" :aria-label="translate('下载') + ' ' + item.fileName">
                <bdi>{{ item.fileName }}</bdi><icon-external-link :size="12" aria-hidden="true" />
              </a>
            </div>
            <p v-if="item.description" class="platformHint">{{ item.description }}</p>
            <p v-if="(item.installed || item.remoteAvailable) && missingDependencies(item).length" class="platformHint">
              {{ translate("需安装依赖") }} · {{ missingDependencies(item).join("、") }}
            </p>
            <p v-if="item.id === 'onnxRuntime' && !item.fileName" class="platformHint">当前平台暂不支持安装 ONNX Runtime。</p>
            <modelInstallProgress v-if="item.progress" :progress="item.progress" />
          </div>
          <div v-if="item.fileName && !item.remoteAvailable" class="runtimeActions">
            <el-dropdown v-if="item.sources.length > 1" splitButton trigger="click" placement="bottom-end"
              :title="translate('下载线路') + ' · ' + currentSource(item)?.label" :disabled="busy || checking"
              @click="install(item)" @command="sourceIds[item.id] = $event">
              <icon-download :size="14" aria-hidden="true" /><span>{{ buttonLabel(item) }}</span>
              <template #dropdown>
                <el-dropdown-menu aria-label="选择下载线路">
                  <el-dropdown-item v-for="source in item.sources" :key="source.id" :command="source.id" :aria-current="currentSource(item)?.id === source.id ? 'true' : undefined">
                    <span class="sourceOption">{{ source.label }}<icon-check v-if="currentSource(item)?.id === source.id" :size="14" aria-hidden="true" /></span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button v-else-if="item.sources.length" :icon="IconDownload" :disabled="busy || checking" @click="install(item)">{{ buttonLabel(item) }}</el-button>
            <el-button :icon="IconUpload" :disabled="busy || checking" :loading="item.progress?.phase === 'importing'" @click="chooseFile(item)">导入文件</el-button>
          </div>
          <el-alert v-if="installError?.id === item.id" :title="installError.message" type="error" :closable="false" showIcon />
        </li>
      </ul>
      <input ref="fileInput" type="file" hidden @change="importFile" />
    </section>
  </el-card>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { IconDownload, IconRefresh, IconUpload } from "@tabler/icons-vue";
import { translate } from "@toonflow/i18n/vue";
import type { LocalModelItem } from "@toonflow/server/localModels";
import { formatModelSize, getModelSource, installModelAsset, installPhaseLabel, modelTitle, useModelCatalog } from "./modelInstallation";
import modelInstallProgress from "./modelInstallProgress.vue";

const { visible } = defineProps<{ visible: boolean }>();
const { status, checking, statusError, refresh } = useModelCatalog(() => visible);
const sourceIds = reactive<Record<string, string>>({});
const installError = ref<{ id: string; message: string }>();
const fileInput = ref<HTMLInputElement>();
let importTarget: LocalModelItem | undefined;
const busy = computed(() => status.value?.items.some(item => item.installing));
function missingDependencies(item: LocalModelItem) {
  return (item.requiredAssetIds ?? []).flatMap(id => {
    const asset = status.value?.items.find(option => option.id === id);
    if (asset?.installed || asset?.remoteAvailable) return [];
    return [asset ? modelTitle(asset) : id];
  });
}
const platformLabel = computed(() => {
  const [platform, arch] = (status.value?.target ?? "").split("-");
  return [platform === "win32" ? "Windows" : platform === "darwin" ? "macOS" : platform === "linux" ? "Linux" : platform, arch].join(" ");
});

function currentSource(item: LocalModelItem) {
  return getModelSource(item, sourceIds[item.id]);
}

function buttonLabel(item: LocalModelItem) {
  return item.progress?.phase === "downloading" ? translate("正在下载") : item.installed ? translate("重新安装") : translate("下载");
}

async function install(item: LocalModelItem, file?: File) {
  const input = file ?? currentSource(item)?.id;
  if (busy.value || checking.value || !item.fileName || !input) return;
  installError.value = undefined;
  try {
    await installModelAsset(item, input);
  } catch (error) {
    installError.value = { id: item.id, message: error instanceof Error ? error.message : translate("操作失败") };
  }
}

function chooseFile(item: LocalModelItem) {
  if (!fileInput.value) return;
  importTarget = item;
  fileInput.value.accept = item.fileName.match(/\.[a-z][a-z\d]{0,8}$/i)?.[0] ?? "";
  fileInput.value.click();
}

function importFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (file && importTarget) void install(importTarget, file);
  importTarget = undefined;
}
</script>

<style lang="scss" scoped>
.modelPanel {
  --el-card-bg-color: var(--el-bg-color-overlay);
  --el-card-padding: clamp(14px, 2.5%, 20px);
  container-type: inline-size;

  .panelHeader {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: "title refresh" "intro refresh";
    align-items: center;
    gap: 5px 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color-light);

    h3 { grid-area: title; margin: 0; color: var(--el-text-color-primary); font-size: 15px; font-weight: 600; }
    p { grid-area: intro; margin: 0; color: var(--el-text-color-regular); font-size: 13px; line-height: 1.6; }
    .el-button { grid-area: refresh; }

    @container (max-width: 420px) {
      grid-template-areas: "title refresh" "intro intro";
    }
  }

  .modelList {
    list-style: none;
    margin: 0;
    padding: 0;
    .runtimeRow {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px 16px;
      padding-block: 13px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &:last-child { border-bottom: 0; padding-bottom: 0; }

      .runtimeInfo {
        flex: 1 1 240px;
        min-width: 0;

        .runtimeTitle {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 5px 8px;

          h4 { margin: 0; color: var(--el-text-color-primary); font-size: 14px; font-weight: 600; }
        }

        .runtimeDetails, .platformHint {
          margin: 5px 0 0;
          color: var(--el-text-color-regular);
          font-size: 12px;
          line-height: 1.6;
        }

        .runtimeDetails {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 2px 12px;

          a {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            color: inherit;
            text-decoration: none;
            overflow-wrap: anywhere;

            &:hover, &:focus-visible { color: var(--el-color-primary); text-decoration: underline; }
          }

          > span { color: var(--el-text-color-secondary); }
        }
      }

      .runtimeActions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;

        .el-dropdown :deep(.el-button svg + span) { margin-inline-start: 5px; }
        .el-button { margin: 0; }

        @container (max-width: 420px) {
          :deep(.el-button:not(.el-dropdown__caret-button)) { padding-inline: 9px; }
        }
      }
    }
  }

  .el-alert { margin-block-start: 12px; }
}

.sourceOption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;

  svg { color: var(--el-color-primary); }
}
</style>
