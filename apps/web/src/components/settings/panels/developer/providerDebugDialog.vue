<template>
  <el-dialog v-model="visible" :title="t('providerDebug.title')" :width="provider ? 'min(1120px, calc(100vw - 32px))' : 'min(560px, calc(100vw - 32px))'" alignCenter appendToBody destroyOnClose :closeOnClickModal="false" @closed="reset">
    <div class="providerDebug" :class="{ hasProvider: !!provider }">
      <div class="sourceBar">
        <div class="sourceInfo">
          <el-text tag="strong">{{ fileName || t('providerDebug.chooseLocalFile') }}</el-text>
          <el-text size="small" type="info">{{ t("providerDebug.latestFileHint") }}{{ modifiedAt ? ` · ${modifiedAt}` : '' }}</el-text>
        </div>
        <el-button v-if="fileName" :icon="IconRefresh" :loading="action === 'refresh'" :disabled="busy" @click="refreshFile">{{ t("providerDebug.reloadConfig") }}</el-button>
        <el-button :icon="IconFolderOpen" :loading="action === 'select'" :disabled="busy" @click="selectFile">{{ t("common.chooseFile") }}</el-button>
      </div>
      <div v-if="provider" class="debugBody">
        <section class="parameters" :aria-label="t('providerDebug.parameters')">
          <h3>{{ provider.label }}</h3>
          <form-create v-model="config" v-model:api="formApi" :rule="formRules" :option="formOptions" />
          <el-form labelPosition="top" :disabled="busy">
            <el-form-item :label="t('common.model')">
              <el-select v-model="modelId" :placeholder="t('providerDebug.modelPlaceholder')" :aria-label="t('providerDebug.modelLabel')">
                <el-option v-for="model in provider.models" :key="model.id" :label="model.label" :value="model.id" />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('providerDebug.prompt')">
              <el-input v-model="prompt" type="textarea" :rows="4" resize="vertical" :aria-label="t('providerDebug.promptLabel')" />
            </el-form-item>
            <el-form-item :label="t('providerDebug.references')">
              <div class="references">
                <div v-for="(item, index) in references" :key="item.url" class="referenceItem">
                  <el-image v-if="item.file.type.startsWith('image/')" :src="item.url" fit="cover" :previewSrcList="[item.url]" previewTeleported />
                  <video v-else-if="item.file.type.startsWith('video/')" :src="item.url" muted preload="metadata" />
                  <icon-volume v-else :size="22" aria-hidden="true" />
                  <el-button class="removeReference" circle size="small" :icon="IconX" :disabled="busy" :aria-label="t('providerDebug.removeReference', { name: item.file.name })" @click="removeReference(index)" />
                  <el-select v-if="activeModel?.type === 'video' && item.file.type.startsWith('image/')" v-model="item.role" size="small" :aria-label="t('providerDebug.imageRole')">
                    <el-option :label="t('providerDebug.referenceImage')" value="images" /><el-option :label="t('providerDebug.firstFrame')" value="firstFrame" /><el-option :label="t('providerDebug.lastFrame')" value="lastFrame" />
                  </el-select>
                </div>
                <el-button class="addReference" :icon="IconPlus" :disabled="busy" :aria-label="t('providerDebug.addReference')" @click="referenceInput?.click()" />
                <input ref="referenceInput" type="file" multiple :accept="activeModel?.type === 'image' ? 'image/*' : activeModel?.type === 'audio' ? 'audio/*' : 'image/*,video/*,audio/*'" hidden @change="addReferences" />
              </div>
            </el-form-item>
            <div class="parameterGrid">
              <el-form-item v-if="activeModel?.type !== 'audio'" :label="t('providerDebug.aspectRatio')">
                <el-select v-model="ratio" clearable filterable allowCreate defaultFirstOption :aria-label="t('providerDebug.aspectRatioLabel')">
                  <el-option v-for="item in activeModel?.imageRatios ?? ['1:1', '16:9', '9:16']" :key="item" :label="item" :value="item" />
                </el-select>
              </el-form-item>
              <el-form-item v-if="activeModel?.type === 'image'" :label="t('providerDebug.imageSize')">
                <el-select v-model="size" clearable filterable allowCreate defaultFirstOption :aria-label="t('providerDebug.imageSizeLabel')">
                  <el-option v-for="item in activeModel.imageSizes ?? ['1K', '2K', '4K']" :key="item" :label="item" :value="item" />
                </el-select>
              </el-form-item>
              <el-form-item v-if="activeModel?.type === 'video'"  :label="t('common.resolution')">
                <el-select v-model="resolution" clearable filterable allowCreate defaultFirstOption :aria-label="t('providerDebug.videoResolution')">
                  <el-option v-for="item in resolutions" :key="item" :label="item" :value="item" />
                </el-select>
              </el-form-item>
              <el-form-item v-if="activeModel?.type === 'video'" :label="t('providerDebug.durationSeconds')">
                <el-input-number v-model="duration" :min="1" :precision="0" controlsPosition="right" :aria-label="t('providerDebug.videoDurationLabel')" />
              </el-form-item>
              <el-form-item v-if="activeModel?.type === 'video'" :label="t('providerDebug.generateAudio')">
                <el-switch v-model="generateAudio" :aria-label="t('providerDebug.generateAudio')" />
              </el-form-item>
              <el-form-item v-if="activeModel?.type === 'audio'" :label="t('providerDebug.voice')">
                <el-select v-model="voice" clearable filterable allowCreate defaultFirstOption :aria-label="t('providerDebug.voice')">
                  <el-option v-for="item in activeModel.voices ?? []" :key="item.voice" :label="item.title" :value="item.voice" />
                </el-select>
              </el-form-item>
            </div>
            <el-collapse>
              <el-collapse-item :title="t('providerDebug.extraParameters')" name="request">
                <el-input v-model="extraParameters" type="textarea" :rows="4" :aria-label="t('providerDebug.extraParametersLabel')" :placeholder="t('providerDebug.extraParametersPlaceholder')" />
              </el-collapse-item>
            </el-collapse>
          </el-form>
        </section>
        <section class="output" :aria-label="t('providerDebug.results')">
          <el-tabs v-model="activeTab" class="resultTabs">
            <el-tab-pane :label="t('providerDebug.preview')" name="preview">
              <div class="mediaPreview">
                <template v-for="asset in assets" :key="asset.url">
                  <el-image v-if="asset.type === 'image'" :src="asset.url" fit="contain" :previewSrcList="imagePreviews" previewTeleported />
                  <video v-else-if="asset.type === 'video'" :src="asset.url" controls preload="metadata" />
                  <audio v-else :src="asset.url" controls preload="metadata" />
                </template>
              </div>
            </el-tab-pane>
            <el-tab-pane :label="t('providerDebug.response')" name="response"><pre v-if="responseText">{{ responseText }}</pre></el-tab-pane>
            <el-tab-pane :label="t('providerDebug.requestLogs', { count: logs.length ? ` (${logs.length})` : '' })" name="logs">
              <el-collapse>
                <el-collapse-item v-for="log in logs" :key="log.id" :name="log.id">
                  <template #title>
                    <div class="logTitle"><el-tag size="small" :type="log.state === 'error' ? 'danger' : log.state === 'success' ? 'success' : 'info'">{{ log.status || log.method }}</el-tag><span>{{ log.url }}</span><small v-if="log.duration !== undefined">{{ log.duration }} ms</small></div>
                  </template>
                  <pre>{{ log.method }} {{ log.url }}
{{ log.request }}
{{ log.response || log.error }}</pre>
                </el-collapse-item>
              </el-collapse>
            </el-tab-pane>
          </el-tabs>
        </section>
      </div>
      <el-alert v-if="errorMessage" :title="getErrorDisplay(errorMessage)" type="error" :closable="false" showIcon />
    </div>
    <template v-if="provider" #footer>
      <div class="debugFooter">
        <el-text size="small" :type="status === 'success' ? 'success' : status === 'failed' ? 'danger' : 'info'" role="status">{{ statusLabel }}{{ elapsed ? t("providerDebug.elapsed", { seconds: (elapsed / 1000).toFixed(1) }) : '' }}</el-text>
        <div>
          <el-button :icon="IconDownload" :disabled="busy || !source" :loading="action === 'install'" @click="install">{{ t("providerDebug.installProvider") }}</el-button>
          <el-button v-if="action === 'run'" type="danger" :icon="IconPlayerStop" @click="stop">{{ t("providerDebug.stop") }}</el-button>
          <el-button v-else type="primary" :icon="IconPlayerPlay" :disabled="busy || !fileName" @click="run">{{ t("providerDebug.run") }}</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { t } from "../../i18n";
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import axios from "axios";
import formCreate, { type Api, type Options, type Rule } from "../../formCreate";
import { ElMessage } from "element-plus";
import { IconFolderOpen, IconRefresh, IconPlus, IconX, IconVolume, IconDownload, IconPlayerPlay, IconPlayerStop } from "@tabler/icons-vue";
import type { Provider } from "@toonflow/providers";
import { invalidateNodeModels } from "@toonflow/nodes-scaffold/nodeAi";
import { createDisplayError, getErrorDisplay } from "@toonflow/i18n";

type DebugProvider = { id: string; label: string; rules: Rule[]; models: Provider["models"] };
type DebugLog = { id: number; method: string; url: string; state: string; status?: number; duration?: number; request?: string; response?: string; error?: string };
type FileHandle = { getFile(): Promise<File>; requestPermission?(options: { mode: "read" }): Promise<PermissionState> };
type SourceFile = { name: string; source: string; lastModified: number };
const visible = defineModel<boolean>({ default: false });
const provider = shallowRef<DebugProvider>();
const formRules = shallowRef<ReturnType<typeof formCreate.copyRules>>([]);
const formApi = shallowRef<Api>();
const config = ref<Record<string, unknown>>({});
const handle = shallowRef<FileHandle>();
const desktopToken = ref("");
const fileName = ref("");
const modifiedAt = ref("");
const source = ref("");
const action = ref<"" | "select" | "refresh" | "run" | "install">("");
const busy = computed(() => !!action.value);
const formOptions = computed<Options>(() => ({ form: { labelPosition: "top", disabled: busy.value }, submitBtn: false, resetBtn: false }));
const modelId = ref("");
const activeModel = computed(() => provider.value?.models.find(model => model.id === modelId.value));
const resolutions = computed(() => [...new Set(activeModel.value?.durationResolutionMap?.flatMap(item => item.resolution) ?? ['720p', '1080p'])]);
const prompt = ref("");
const ratio = ref("");
const size = ref("");
const resolution = ref("");
const duration = ref<number>();
const generateAudio = ref(false);
const voice = ref("");
const extraParameters = ref("");
const referenceInput = ref<HTMLInputElement>();
const references = shallowRef<{ file: File; url: string; role: string }[]>([]);
const assets = shallowRef<{ type: string; url: string }[]>([]);
const imagePreviews = computed(() => assets.value.filter(item => item.type === "image").map(item => item.url));
const logs = shallowRef<DebugLog[]>([]);
const responseText = ref("");
const errorMessage = shallowRef<Error>();
const activeTab = ref("preview");
const status = ref<"" | "selected" | "loaded" | "running" | "stopped" | "success" | "failed">("");
const statusLabel = computed(() => {
  if (status.value === "selected") return t("providerDebug.fileSelected");
  if (status.value === "loaded") return t("providerDebug.fileLoaded");
  return status.value ? t(`common.${status.value}`) : "";
});
const elapsed = ref(0);
const isDesktop = new URLSearchParams(window.location.search).get("desktop") === "1";
const desktopHeaders = { "x-toonflow-desktop": "1" };
let controller: AbortController | undefined;

function showError(error: unknown) {
  errorMessage.value = axios.isAxiosError<{ message?: string }>(error) && error.response?.data?.message
    ? new Error(error.response.data.message)
    : error instanceof Error ? error : new Error(String(error));
  status.value = "failed";
}

async function readSource(): Promise<SourceFile> {
  if (isDesktop) {
    const { data } = await axios.post<{ data: SourceFile }>("/api/desktop/providerFile/read", { token: desktopToken.value }, { headers: desktopHeaders, signal: controller?.signal });
    return data.data;
  }
  if (!handle.value) throw createDisplayError("请先选择供应商文件", () => t("providerDebug.chooseFileFirst"));
  if (handle.value.requestPermission && await handle.value.requestPermission({ mode: "read" }) !== "granted") throw createDisplayError("请允许读取供应商文件", () => t("providerDebug.allowFileRead"));
  const file = await handle.value.getFile();
  if (!/\.ts$/i.test(file.name) || file.size > 2 * 1024 * 1024) throw createDisplayError("请选择不超过 2 MB 的 .ts 文件", () => t("providerDebug.invalidFile"));
  return { name: file.name, source: await file.text(), lastModified: file.lastModified };
}

async function refreshProvider() {
  source.value = "";
  const file = await readSource();
  controller?.signal.throwIfAborted();
  const { data } = await axios.post<{ data: DebugProvider }>("/api/providers/debug/inspect", { source: file.source }, { signal: controller?.signal });
  controller?.signal.throwIfAborted();
  const next = data.data;
  const values = formApi.value?.formData() ?? config.value;
  config.value = Object.fromEntries(next.rules.filter(rule => rule.field).map(rule => [rule.field!, next.id === provider.value?.id && rule.field! in values ? values[rule.field!] : rule.value]));
  if (JSON.stringify(next.rules) !== JSON.stringify(provider.value?.rules)) formRules.value = formCreate.copyRules(next.rules);
  provider.value = next;
  if (!next.models.some(model => model.id === modelId.value)) modelId.value = next.models[0]?.id ?? "";
  fileName.value = file.name;
  modifiedAt.value = new Date(file.lastModified).toLocaleTimeString();
  source.value = file.source;
  await nextTick();
}

async function selectFile() {
  if (busy.value) return;
  action.value = "select";
  errorMessage.value = undefined;
  controller = new AbortController();
  try {
    if (isDesktop) {
      const { data } = await axios.post<{ data: { token: string; name: string } | null }>("/api/desktop/providerFile/select", {}, { headers: desktopHeaders, signal: controller.signal });
      if (!data.data) return;
      desktopToken.value = data.data.token;
      fileName.value = data.data.name;
    } else {
      const picker = (window as Window & { showOpenFilePicker?: (options: unknown) => Promise<FileHandle[]> }).showOpenFilePicker;
      if (!picker) throw createDisplayError("当前环境不支持文件授权，请使用 HTTPS／localhost 下的 Chrome、Edge 或桌面端", () => t("providerDebug.filePickerUnsupported"));
      const [selected] = await picker.call(window, { multiple: false, types: [{ description: t("providerDebug.filePickerDescription"), accept: { "text/plain": [".ts"] } }] });
      if (!selected) return;
      handle.value = selected;
      fileName.value = (await selected.getFile()).name;
    }
    provider.value = undefined;
    formRules.value = [];
    config.value = {};
    source.value = "";
    modifiedAt.value = "";
    clearResults();
    status.value = "selected";
  } catch (error) { if (!controller.signal.aborted && !(error instanceof DOMException && error.name === "AbortError")) showError(error); }
  finally { action.value = ""; }
}

async function refreshFile() {
  if (busy.value) return;
  action.value = "refresh";
  errorMessage.value = undefined;
  controller = new AbortController();
  try { await refreshProvider(); status.value = "loaded"; }
  catch (error) { if (!controller.signal.aborted) showError(error); }
  finally { action.value = ""; }
}

function addReferences(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = [...(input.files ?? [])];
  input.value = "";
  if (files.some(file => !/^(image|video|audio)\//.test(file.type)) || [...references.value.map(item => item.file), ...files].reduce((sum, file) => sum + file.size, 0) > 32 * 1024 * 1024) {
    errorMessage.value = createDisplayError("请选择图片、视频或音频，参考素材总量不能超过 32 MB", () => t("providerDebug.invalidReferences"));
    return;
  }
  references.value = [...references.value, ...files.map(file => ({ file, url: URL.createObjectURL(file), role: file.type.startsWith("image/") ? "images" : file.type.startsWith("video/") ? "videos" : "audios" }))];
}

function removeReference(index: number) {
  URL.revokeObjectURL(references.value[index]!.url);
  references.value = references.value.filter((_, itemIndex) => itemIndex !== index);
}

async function buildRequest() {
  let extra: Record<string, unknown> = {};
  if (extraParameters.value.trim()) {
    extra = JSON.parse(extraParameters.value);
    if (!extra || typeof extra !== "object" || Array.isArray(extra)) throw createDisplayError("更多请求参数必须是 JSON 对象", () => t("providerDebug.extraMustBeObject"));
  }
  const type = activeModel.value?.type;
  const request: Record<string, unknown> = { model: modelId.value, [type === "audio" ? "text" : "prompt"]: prompt.value };
  const parameters = type === "image" ? { ratio: ratio.value, size: size.value }
    : type === "video" ? { ratio: ratio.value, resolution: resolution.value, duration: duration.value, generateAudio: generateAudio.value }
    : { voice: voice.value };
  for (const [key, value] of Object.entries(parameters)) if (value !== "" && value !== undefined) request[key] = value;
  for (const item of references.value) {
    if (type !== "video" && !item.file.type.startsWith(`${type}/`)) throw createDisplayError("参考素材类型与当前模型不匹配，请移除后重试", () => t("providerDebug.referenceTypeMismatch"));
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]!);
      const name = item.file.name;
      reader.onerror = () => reject(createDisplayError(`读取 ${name} 失败`, () => t("providerDebug.referenceReadFailed", { name })));
      reader.readAsDataURL(item.file);
    });
    const media = { type: "base64", data, mimeType: item.file.type };
    if (type === "video" && (item.role === "firstFrame" || item.role === "lastFrame")) {
      if (request[item.role]) throw createDisplayError("首帧和尾帧各只能选择一张图片", () => t("providerDebug.singleFrameImage"));
      request[item.role] = media;
    } else {
      const role = item.file.type.startsWith("image/") ? "images" : item.file.type.startsWith("video/") ? "videos" : "audios";
      const items = (request[role] ??= []) as unknown[];
      items.push(media);
    }
  }
  return { ...request, ...extra, model: modelId.value };
}

function clearResults() {
  for (const asset of assets.value) if (asset.url.startsWith("blob:")) URL.revokeObjectURL(asset.url);
  assets.value = [];
  logs.value = [];
  responseText.value = "";
  errorMessage.value = undefined;
  elapsed.value = 0;
  status.value = "";
}

function receive(event: Record<string, any>) {
  if (event.type === "log") {
    const index = logs.value.findIndex(log => log.id === event.log.id);
    logs.value = index < 0 ? [...logs.value, event.log] : logs.value.map((log, itemIndex) => itemIndex === index ? event.log : log);
  } else if (event.type === "error") {
    showError(new Error(event.message));
    elapsed.value = event.duration;
  } else if (event.type === "result") {
    assets.value = event.assets.map((asset: { type: string; mediaType: string; url: string; data: string; mimeType: string }) => {
      const url = asset.type === "url" ? asset.url : URL.createObjectURL(new Blob([Uint8Array.from(atob(asset.data), character => character.charCodeAt(0))], { type: asset.mimeType }));
      return { type: asset.mediaType, url };
    });
    responseText.value = event.response;
    elapsed.value = event.duration;
    status.value = "success";
    activeTab.value = "preview";
  }
}

async function run() {
  if (busy.value) return;
  action.value = "run";
  clearResults();
  status.value = "running";
  controller = new AbortController();
  const signal = controller.signal;
  const startedAt = performance.now();
  try {
    await refreshProvider();
    if (!activeModel.value) throw createDisplayError("供应商没有可调试的媒体模型", () => t("providerDebug.noMediaModels"));
    if (!prompt.value.trim()) throw createDisplayError("请输入提示词", () => t("providerDebug.promptRequired"));
    if (formApi.value && !(await formApi.value.validate().catch(() => false))) throw createDisplayError("请检查供应商配置", () => t("providerDebug.checkConfig"));
    const request = await buildRequest();
    signal.throwIfAborted();
    const response = await fetch("/api/providers/debug/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: source.value, config: formApi.value?.formData() ?? config.value, request }), signal });
    if (!response.ok) {
      const message = (await response.json()).message;
      throw message ? new Error(message) : createDisplayError("调试请求失败", () => t("providerDebug.requestFailed"));
    }
    if (!response.body) throw createDisplayError("未收到运行结果", () => t("providerDebug.noResult"));
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let pending = "";
    let completed = false;
    try {
      while (true) {
        const { done, value } = await reader.read();
        signal.throwIfAborted();
        pending += value ?? "";
        const lines = pending.split("\n");
        pending = lines.pop() ?? "";
        if (done && pending.trim()) lines.push(pending);
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === "done") completed = true;
          else receive(event);
        }
        if (done || completed) break;
      }
      if (!completed || status.value === "running") throw createDisplayError("运行连接已中断，请重试", () => t("providerDebug.connectionInterrupted"));
    } finally { await reader.cancel().catch(() => {}); }
  } catch (error) { if (!signal.aborted) showError(error); }
  finally { elapsed.value = Math.round(performance.now() - startedAt); action.value = ""; }
}

function stop() { controller?.abort(); status.value = "stopped"; }

async function install() {
  if (busy.value || !source.value) return;
  action.value = "install";
  errorMessage.value = undefined;
  try {
    await axios.post("/api/providers/media/add", { source: source.value });
    invalidateNodeModels("media");
    ElMessage.success(t("providerDebug.providerInstalled"));
  } catch (error) { showError(error); }
  finally { action.value = ""; }
}

function reset() {
  controller?.abort();
  clearResults();
  for (const reference of references.value) URL.revokeObjectURL(reference.url);
  references.value = [];
  provider.value = undefined;
  formRules.value = [];
  formApi.value = undefined;
  config.value = {};
  handle.value = undefined;
  desktopToken.value = fileName.value = modifiedAt.value = source.value = modelId.value = prompt.value = "";
  ratio.value = size.value = resolution.value = voice.value = extraParameters.value = "";
  duration.value = undefined;
  generateAudio.value = false;
  activeTab.value = "preview";
}
watch(visible, value => { if (!value) controller?.abort(); });
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

  .debugBody {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    min-height: 0;
    flex: 1;
    gap: 28px;

    .parameters {
      overflow: auto;
      padding-right: 8px;
      overscroll-behavior: contain;
      h3 { margin: 0 0 16px; font-size: 14px; color: var(--el-text-color-primary); }
      .parameterGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 12px; }
      .el-select, .el-input-number { width: 100%; }

      .references {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;

        .referenceItem {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 80px;
          gap: 6px;
          .el-image, video { width: 80px; height: 64px; border-radius: var(--el-border-radius-base); object-fit: cover; }
          .removeReference { position: absolute; right: -6px; top: -6px; width: 20px; height: 20px; min-height: 20px; }
        }
        .addReference { width: 64px; height: 64px; margin: 0; }
      }
    }

    .output {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 0;
      min-height: 0;
      .resultTabs {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        :deep(.el-tabs__content) { overflow-y: auto; overscroll-behavior: contain; }
      }
      pre { margin: 0; font-size: 12px; line-height: 1.7; white-space: pre-wrap; overflow-wrap: anywhere; }
      .mediaPreview {
        display: flex;
        flex-direction: column;
        gap: 12px;
        .el-image, video { width: 100%; max-height: 440px; object-fit: contain; border-radius: var(--el-border-radius-base); }
        audio { width: 100%; }
      }
      .logTitle {
        display: flex;
        align-items: center;
        width: 100%;
        min-width: 0;
        gap: 8px;
        span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        small { flex-shrink: 0; margin-left: auto; color: var(--el-text-color-secondary); }
      }
    }
  }

  @media (max-width: 760px) {
    .sourceBar { flex-wrap: wrap; }
    .debugBody { grid-template-columns: minmax(0, 1fr); grid-template-rows: 1fr 1fr; gap: 16px; }
  }
}
.debugFooter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  min-height: 32px;
}
</style>
