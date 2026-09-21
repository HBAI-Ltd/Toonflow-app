<template>
  <div class="ffmpegPanel">
    <el-card class="downloadCard" shadow="never">
      <div class="componentHeader">
        <div class="componentTitle">
          <h3><icon-movie :size="18" aria-hidden="true" />FFmpeg</h3>
          <el-tag :type="statusError ? 'danger' : busy || loading ? 'info' : ready ? 'success' : 'warning'" >
            {{ statusError ? '检测失败' : busy ? phaseLabels[download.phase] : loading ? '检测中' : ready ? '已就绪' : '待配置' }}
          </el-tag>
        </div>
        <el-button  :icon="IconRefresh" :loading="loading" :disabled="saving || submitting" @click="refreshStatus">重新检测</el-button>
      </div>
      <p class="introduction">Agent和部分节点插件、工具插件、供应商在处理音视频时可能需要 FFmpeg，按需安装即可。</p>
      <el-alert v-if="statusError" :title="statusError" type="error" :closable="false" showIcon />
      <div class="downloadHeader">
        <span>下载线路</span>
        <el-text v-if="status" type="info" >{{ availableSourceCount }} 条可用线路</el-text>
      </div>
      <div class="downloadActions">
        <el-select
          :modelValue="config.source"
          :disabled="!status || loading || saving || busy || submitting"
          
          filterable
          placeholder="选择下载线路"
          aria-label="FFmpeg 下载源"
          @change="(source) => updateConfig({ source })">
          <el-option-group v-for="group in sourceGroups" :key="group.label" :label="group.label">
            <el-option v-for="source in group.sources" :key="source.id" class="sourceOption" :label="source.label" :value="source.id">
              <span class="sourceLabel" :title="source.label">{{ source.label }}</span>
              <span class="sourceDescription" :title="source.description">{{ source.description }}</span>
            </el-option>
          </el-option-group>
        </el-select>
        <el-button  type="primary" :icon="IconDownload" :loading="submitting || busy" :disabled="!canDownload" @click="submitDownload('download')">
          {{ busy ? phaseLabels[download.phase] : download.phase === 'error' ? '重试安装' : downloaded || download.phase === 'completed' ? '重新安装' : '下载并安装' }}
        </el-button>
        <el-button v-if="busy && download.phase !== 'installing'"  :disabled="submitting" @click="submitDownload('cancel')">取消</el-button>
      </div>
      <div v-if="selectedSource" class="sourceHint">
        <span>下载较慢时，可取消后切换线路。</span>
        <el-link :href="selectedSource.homepage" target="_blank" rel="noopener noreferrer" :underline="false" type="primary">来源网站<icon-external-link :size="12" aria-hidden="true" /></el-link>
      </div>
      <p class="description">{{ ready ? '已检测到可用版本，无需重复安装。' : '下载后自动完成安装，无需手动解压或配置。' }}</p>
      <el-alert v-if="status && !status.supported" title="当前平台暂不提供下载，请在高级设置中使用系统安装版。" type="warning" :closable="false" showIcon />
      <el-alert v-if="config.mode === 'system'" title="当前仅使用系统安装版。如需使用下载的版本，请在高级设置中切换运行方式。" type="info" :closable="false" showIcon />
      <div v-if="download.phase !== 'idle'" class="downloadProgress" aria-live="polite">
        <div class="progressHeader">
          <span>{{ phaseLabels[download.phase] }}<template v-if="busy && download.file && download.phase !== 'installing'"> · 组件 {{ download.file === 'ffprobe' ? '2' : '1' }}/2</template></span>
          <span v-if="download.received || download.total">{{ formatBytes(download.received) }}{{ download.total ? ` / ${formatBytes(download.total)}` : '' }}</span>
        </div>
        <el-progress
          :percentage="busy && !download.total ? 50 : percentage"
          :showText="!busy || !!download.total"
          :indeterminate="busy && !download.total"
          :status="download.phase === 'error' ? 'exception' : download.phase === 'completed' ? 'success' : undefined" />
      </div>
      <el-alert v-if="operationError || download.error" :title="operationError || download.error" type="error" :closable="false" showIcon />
    </el-card>

    <el-collapse class="advancedSettings">
      <el-collapse-item title="高级设置" name="advanced">
        <el-form labelPosition="top" >
          <el-form-item label="运行方式">
            <el-select :modelValue="config.mode" :disabled="loading || saving || busy || submitting" aria-label="FFmpeg 运行方式" @change="(mode) => updateConfig({ mode })">
              <el-option label="自动选择" value="auto" />
              <el-option label="使用下载版" value="download" />
              <el-option label="使用系统安装版" value="system" />
            </el-select>
            <p class="description">{{ modeDescriptions[config.mode] }}</p>
          </el-form-item>
        </el-form>
        <template v-if="status">
          <p class="description">运行环境：{{ status.platform }} / {{ status.arch }}</p>
          <p class="description">下载版本：{{ status.version }} · {{ status.target }}</p>
          <p class="description">保存在当前 Toonflow 服务的数据目录，下载后自动复用。</p>
          <code class="toolPath">{{ status.directory }}</code>
          <div v-for="name in toolNames" :key="name" class="toolInfo">
            <strong>{{ name }}</strong>
            <el-tag :type="status.tools[name].version ? 'success' : 'info'"  effect="plain">
              {{ status.tools[name].version ? (status.tools[name].origin === 'download' ? '下载版' : '系统安装版') : '不可用' }}
            </el-tag>
            <p v-if="status.tools[name].version" class="description">{{ status.tools[name].version }}</p>
            <code v-if="status.tools[name].path" class="toolPath">{{ status.tools[name].path }}</code>
            <p v-if="status.tools[name].error" class="description">{{ status.tools[name].error }}</p>
          </div>
        </template>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";
import { IconDownload, IconRefresh } from "@tabler/icons-vue";
import { saveSettings, settings } from "@/stores/settings";

type FfmpegConfig = { mode: "auto" | "download" | "system"; source: string };
type DownloadState = { phase: "idle" | "downloading" | "verifying" | "installing" | "completed" | "error" | "cancelled"; file?: string; received: number; total?: number; error?: string };
type ToolStatus = { path: string | null; version: string | null; error: string | null; origin: "download" | "system" | null };
type FfmpegStatus = {
  platform: string; arch: string; target: string; supported: boolean; directory: string; version: string;
  sources: { id: FfmpegConfig["source"]; label: string; description: string; available: boolean; homepage: string }[];
  config: FfmpegConfig; tools: { ffmpeg: ToolStatus; ffprobe: ToolStatus }; download: DownloadState;
};

const props = withDefaults(defineProps<{ visible?: boolean; downloadOnOpen?: boolean }>(), { visible: true, downloadOnOpen: false });
const headers = { "x-toonflow-workspace": "1" };
const toolNames = ["ffmpeg", "ffprobe"] as const;
const modeDescriptions = {
  auto: "优先使用已下载的版本；未下载时，从当前 Toonflow 服务的系统 PATH 查找。",
  download: "仅使用此页面下载的版本。",
  system: "仅从当前 Toonflow 服务的系统 PATH 查找 FFmpeg 与 ffprobe。",
};
const phaseLabels = { idle: "等待下载", downloading: "正在下载", verifying: "正在校验", installing: "正在安装", completed: "下载完成", error: "下载失败", cancelled: "已取消" };
const config = computed<FfmpegConfig>(() => {
  const raw = settings.value.ffmpeg;
  const value = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Partial<FfmpegConfig> : {};
  return {
    mode: value.mode === "download" || value.mode === "system" ? value.mode : "auto",
    source: [value.source, status.value?.config.source].find(id => status.value?.sources.some(source => source.id === id && source.available))
      ?? status.value?.sources.find(source => source.available)?.id ?? "",
  };
});
const status = ref<FfmpegStatus>();
const ready = computed(() => toolNames.every(name => !!status.value?.tools[name].version));
const downloaded = computed(() => toolNames.some(name => status.value?.tools[name].origin === "download"));
const selectedSource = computed(() => status.value?.sources.find(source => source.id === config.value.source));
const availableSourceCount = computed(() => status.value?.sources.filter(source => source.available).length ?? 0);
const sourceGroups = computed(() => {
  const sources = status.value?.sources ?? [];
  return [
    { label: "常用线路", sources: sources.filter(source => source.available && ["npmmirror", "github"].includes(source.id)) },
    { label: "更多加速线路", sources: sources.filter(source => source.available && !["npmmirror", "github"].includes(source.id)) },
  ].filter(group => group.sources.length);
});
const download = ref<DownloadState>({ phase: "idle", received: 0 });
const statusError = ref("");
const operationError = ref("");
const loading = ref(false);
const saving = ref(false);
const submitting = ref(false);
const busy = computed(() => ["downloading", "verifying", "installing"].includes(download.value.phase));
const canDownload = computed(() => status.value?.supported && status.value.sources.some(source => source.id === config.value.source && source.available) && !loading.value && !saving.value && !busy.value && !submitting.value);
const percentage = computed(() => download.value.phase === "completed" ? 100 : download.value.total ? Math.min(100, Math.round(download.value.received / download.value.total * 100)) : 0);
let timer: ReturnType<typeof setTimeout> | undefined;
let readController = new AbortController();

function errorMessage(error: unknown) {
  return axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || error.message : error instanceof Error ? error.message : "操作失败";
}

function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
}

function stopReading() {
  clearTimeout(timer);
  readController.abort();
}

function pollProgress() {
  clearTimeout(timer);
  if (!props.visible || readController.signal.aborted || !busy.value) return;
  const signal = readController.signal;
  timer = setTimeout(async () => {
    try {
      const { data } = await axios.get<{ code: number; data: DownloadState; message?: string }>("/api/ffmpeg/progress", { headers, signal });
      if (signal.aborted) return;
      if (data.code !== 200) throw new Error(data.message || "读取下载进度失败");
      download.value = data.data;
      if (busy.value) pollProgress();
      else await refreshStatus();
    } catch (error) {
      if (!signal.aborted) operationError.value = `${errorMessage(error)}，请刷新查看下载状态。`;
    }
  }, 1000);
}

async function refreshStatus() {
  stopReading();
  readController = new AbortController();
  const signal = readController.signal;
  loading.value = true;
  statusError.value = "";
  operationError.value = "";
  try {
    const { data } = await axios.get<{ code: number; data: FfmpegStatus; message?: string }>("/api/ffmpeg/status", { headers, signal });
    if (signal.aborted) return;
    if (data.code !== 200) throw new Error(data.message || "读取 FFmpeg 状态失败");
    status.value = data.data;
    download.value = data.data.download;
    pollProgress();
    return true;
  } catch (error) {
    if (!signal.aborted) statusError.value = errorMessage(error);
    return false;
  } finally {
    if (!signal.aborted) loading.value = false;
  }
}

async function updateConfig(patch: Partial<FfmpegConfig>) {
  saving.value = true;
  try {
    await saveSettings(current => {
      const value = current.ffmpeg;
      return { ffmpeg: { ...(value && typeof value === "object" && !Array.isArray(value) ? value : {}), ...patch } };
    });
    return props.visible && !readController.signal.aborted ? await refreshStatus() : false;
  } catch (error) {
    ElMessage.error(errorMessage(error));
    return false;
  } finally {
    saving.value = false;
  }
}

async function submitDownload(action: "download" | "cancel") {
  if (submitting.value || action === "download" && !canDownload.value) return;
  stopReading();
  readController = new AbortController();
  submitting.value = true;
  operationError.value = "";
  try {
    const { data } = await axios.post<{ code: number; data: DownloadState; message?: string }>(`/api/ffmpeg/${action}`, action === "download" ? { source: config.value.source } : {}, { headers });
    if (data.code !== 200) throw new Error(data.message || "操作失败");
    download.value = data.data;
    if (props.visible && !readController.signal.aborted) {
      if (busy.value) pollProgress();
      else await refreshStatus();
    }
  } catch (error) {
    const message = errorMessage(error);
    if (props.visible && !readController.signal.aborted) await refreshStatus();
    operationError.value = message;
  } finally {
    submitting.value = false;
  }
}

watch(() => props.visible, async visible => {
  if (!visible) return stopReading();
  if (!await refreshStatus() || !props.downloadOnOpen || status.value?.tools.ffmpeg.version) return;
  if (config.value.mode === "system" && !await updateConfig({ mode: "auto" })) return;
  if (props.visible && !readController.signal.aborted && !status.value?.tools.ffmpeg.version && !busy.value) await submitDownload("download");
}, { immediate: true });
onBeforeUnmount(stopReading);
</script>

<style lang="scss" scoped>
.sourceOption {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  align-items: center;
  gap: 20px;
  padding: 0 20px;

  .sourceLabel, .sourceDescription {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sourceDescription {
    text-align: right;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    font-weight: 400;
  }
}

.ffmpegPanel {
  .description {
    margin: 6px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.6;
    overflow-wrap: anywhere;
  }

  .downloadCard {
    :deep(.el-card__body) { padding: 12px; }

    .componentHeader, .downloadHeader, .progressHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }

    .componentHeader {
      gap: 12px;

      .componentTitle {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;

        h3 {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }
      }
    }

    .introduction {
      margin: 10px 0 0;
      color: var(--el-text-color-regular);
      font-size: 13px;
      line-height: 1.6;
    }

    .downloadHeader {
      margin-top: 16px;
      color: var(--el-text-color-regular);
      font-size: 13px;
    }

    .downloadActions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;

      .el-select { flex: 1 1 200px; min-width: 0; }
      .el-button { margin-left: 0; }
    }

    .sourceHint {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 4px 12px;
      margin-top: 10px;
      color: var(--el-text-color-secondary);
      font-size: 12px;
      line-height: 1.6;

      .el-link { font-size: inherit; }
    }

    .downloadProgress {
      margin-top: 16px;

      .progressHeader {
        margin-bottom: 8px;
        color: var(--el-text-color-secondary);
        font-size: 12px;
      }
    }
  }

  .advancedSettings {
    --el-collapse-border-color: transparent;
    margin-top: 10px;

    .el-form { margin-top: 8px; }

    .toolInfo {
      margin-top: 16px;
      font-size: 13px;

      strong { margin-right: 12px; }
    }

    .toolPath {
      display: block;
      margin-top: 8px;
      color: var(--el-text-color-regular);
      font-size: 12px;
      overflow-wrap: anywhere;
      user-select: text;
    }
  }

  .el-alert { margin: 12px 0; }
}
</style>
