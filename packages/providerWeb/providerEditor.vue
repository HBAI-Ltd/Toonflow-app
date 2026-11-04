<template>
  <el-dialog v-model="visible" :title="initial ? translate('编辑供应商') : translate('添加供应商')" width="min(860px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose :closeOnClickModal="false" :closeOnPressEscape="!busy" :showClose="!busy" @closed="closeEditor">
    <div class="providerEditor">
      <el-form labelPosition="top" :disabled="busy" @submit.prevent>
        <details class="sourceDetails" :open="!initial || (method !== 'manual' && !inspected)">
          <summary>{{ translate(method === "manual" ? "配置方式" : "供应商代码") }}</summary>
          <el-form-item :label="translate('配置方式')">
            <el-segmented v-model="method" :options="methods" :disabled="busy" block :ariaLabel="translate('配置方式')" />
          </el-form-item>
          <template v-if="method !== 'manual'">
            <el-form-item v-if="method === 'preset'" :label="translate('内置供应商')" for="providerPreset">
              <el-select id="providerPreset" v-model="presetId" :disabled="busy" @change="selectPreset">
                <el-option v-for="preset in availablePresets" :key="preset.id" :value="preset.id" :label="preset.label" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="method === 'file'" :label="translate('供应商文件')">
              <div class="fileRow">
                <input ref="fileInput" type="file" accept=".ts" hidden :disabled="busy" @change="readSourceFile" />
                <el-input :modelValue="fileName" readonly :aria-label="translate('供应商文件')" />
                <el-button :disabled="busy" @click="fileInput?.click()">{{ translate("选择文件") }}</el-button>
              </div>
            </el-form-item>
            <el-form-item :label="translate('供应商代码')" for="providerSource">
              <el-input id="providerSource" v-model="source" type="textarea" dir="ltr" :rows="8" resize="vertical" spellcheck="false" />
            </el-form-item>
            <div class="inspectRow">
              <span>{{ translate("复用现有 TypeScript 供应商格式，解析后配置连接与上游模型。") }}</span>
              <el-button :loading="inspecting" :disabled="busy || !source.trim()" @click="inspectSource()">{{ translate("解析供应商") }}</el-button>
            </div>
          </template>
        </details>
        <template v-if="method === 'manual' || inspected">
          <div class="sectionHeading"><h3>{{ translate("连接配置") }}</h3><el-tag v-if="description?.version" size="small" type="info">v{{ description.version }}</el-tag></div>
          <div class="formGrid">
            <el-form-item :label="translate('供应商 ID')" for="providerId" required>
              <el-input id="providerId" v-model="draft.id" :readonly="!!initial || method !== 'manual'" :maxlength="96" />
            </el-form-item>
            <el-form-item :label="translate('显示名称')" for="providerLabel" required>
              <el-input id="providerLabel" v-model="draft.label" :readonly="method !== 'manual'" :maxlength="128" />
            </el-form-item>
            <template v-if="kind === 'text'">
              <el-form-item :label="translate('接口地址')" for="providerApiUrl" required>
                <el-input id="providerApiUrl" v-model="textConnection.apiUrl" dir="ltr" type="url" />
              </el-form-item>
              <el-form-item :label="translate('接口协议')" for="providerProtocol" required>
                <el-select id="providerProtocol" v-model="textConnection.protocol">
                  <el-option value="openai-completions" label="OpenAI Chat Completions" />
                  <el-option value="openai-responses" label="OpenAI Responses" />
                  <el-option value="anthropic-messages" label="Anthropic Messages" />
                </el-select>
              </el-form-item>
              <el-form-item v-if="method === 'manual' || !formRules.length" class="wideField" :label="translate('API Key')" for="providerApiKey">
                <el-input id="providerApiKey" v-model="textConnection.apiKey" type="password" showPassword autocomplete="off" />
              </el-form-item>
            </template>
          </div>
          <form-create v-if="formRules.length" v-model="formValues" v-model:api="formApi" :rule="formRules" :option="formOptions" />
          <details v-if="kind === 'text'" class="advancedSettings">
            <summary>{{ translate("自定义请求头") }}</summary>
            <el-input v-model="headers" type="textarea" dir="ltr" :rows="3" resize="vertical" :aria-label="translate('自定义请求头')" />
          </details>
          <div class="sectionHeading modelHeading">
            <h3>{{ translate("上游模型") }} <span class="modelCount">{{ models.length }}</span></h3>
            <el-button :disabled="busy" @click="editModel()">{{ translate("添加模型") }}</el-button>
          </div>
          <el-table :data="models" rowKey="id" :emptyText="translate('暂无模型')">
            <el-table-column prop="id" :label="translate('模型 ID')" minWidth="200" />
            <el-table-column prop="label" :label="translate('显示名称')" minWidth="170" />
            <el-table-column :label="translate('类型')" width="90"><template #default="{ row }">{{ modelTypeLabel(row.type) }}</template></el-table-column>
            <el-table-column :label="translate('操作')" width="90" align="right"><template #default="{ $index }"><el-button link type="primary" :disabled="busy" @click="editModel($index)">{{ translate("编辑") }}</el-button></template></el-table-column>
          </el-table>
        </template>
      </el-form>
      <el-alert v-if="localError || error" class="formError" :title="localError || error" type="error" :closable="false" showIcon />
    </div>
    <template #footer>
      <div class="dialogActions">
        <el-button :disabled="busy" @click="emit('reload')">{{ translate("重新加载") }}</el-button>
        <div><el-button :disabled="busy" @click="visible = false">{{ translate("取消") }}</el-button><el-button type="primary" :loading="saving" :disabled="busy || (method !== 'manual' && !inspected)" @click="saveProvider">{{ translate("保存") }}</el-button></div>
      </div>
    </template>
  </el-dialog>
  <modelEditor v-model="mediaEditorVisible" :model="editingModel" :models="models" @confirmed="saveMediaModel" />
  <el-dialog v-model="textEditorVisible" :title="editingIndex === undefined ? translate('添加模型') : translate('编辑模型')" width="min(560px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose :closeOnClickModal="false">
    <el-form class="textModelForm" labelPosition="top" @submit.prevent="saveTextModel">
      <el-form-item :label="translate('模型 ID')" for="upstreamTextModelId" required><el-input id="upstreamTextModelId" v-model="textModel.id" :maxlength="256" /></el-form-item>
      <el-form-item :label="translate('显示名称')" for="upstreamTextModelLabel" required><el-input id="upstreamTextModelLabel" v-model="textModel.label" :maxlength="128" /></el-form-item>
      <div class="modelLimits">
        <el-form-item :label="translate('上下文窗口')" for="upstreamTextContext"><el-input-number id="upstreamTextContext" v-model="textModel.contextWindow" :min="1" :precision="0" controlsPosition="right" /></el-form-item>
        <el-form-item :label="translate('最大输出 Token')" for="upstreamTextOutput"><el-input-number id="upstreamTextOutput" v-model="textModel.maxOutputTokens" :min="1" :precision="0" controlsPosition="right" /></el-form-item>
      </div>
      <el-alert v-if="modelError" :title="modelError" type="error" :closable="false" />
    </el-form>
    <template #footer><el-button @click="textEditorVisible = false">{{ translate("取消") }}</el-button><el-button type="primary" @click="saveTextModel">{{ translate("保存") }}</el-button></template>
  </el-dialog>
</template>

<script setup lang="ts">
/// <reference path="./env.d.ts" />
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { translate } from "@toonflow/i18n/vue";
import { ElAlert, ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElInputNumber, ElOption, ElSegmented, ElSelect, ElTable, ElTableColumn, ElTag } from "element-plus";
import formCreate, { type Api, type Options } from "./formCreate";
import modelEditor from "./modelEditorDialog.vue";
import type { MediaProviderModel } from "./types";
import type { ProviderConfiguration, ProviderDescription, ProviderInspection, ProviderKind } from "./providerTypes";
import deepSeekSource from "@toonflow/providers/language/deepSeek?raw";
import apiMartSource from "@toonflow/providers/media/apiMart?raw";
import metasoSource from "@toonflow/providers/media/metaso?raw";
import compshareSource from "@toonflow/providers/media/compshare?raw";
import "element-plus/es/components/alert/style/css";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/dialog/style/css";
import "element-plus/es/components/input-number/style/css";
import "element-plus/es/components/segmented/style/css";
import "element-plus/es/components/table/style/css";
import "element-plus/es/components/table-column/style/css";
import "element-plus/es/components/tag/style/css";

const props = defineProps<{
  kind: ProviderKind;
  initial?: ProviderDescription;
  saving: boolean;
  error?: string;
  inspect: (input: ProviderInspection, signal: AbortSignal) => Promise<ProviderDescription>;
}>();
const visible = defineModel<boolean>({ default: false });
const emit = defineEmits<{ save: [provider: ProviderConfiguration]; reload: [] }>();
const presets = [
  { kind: "text", id: "deepSeek", label: "DeepSeek", source: deepSeekSource },
  { kind: "media", id: "apiMart", label: "APIMart", source: apiMartSource },
  { kind: "media", id: "metaso", label: "秘塔", source: metasoSource },
  { kind: "media", id: "compshare", label: "优刻得", source: compshareSource },
];
const availablePresets = computed(() => presets.filter(item => item.kind === props.kind));
const method = ref("manual");
const methods = computed(() => [
  ...(props.kind === "text" ? [{ label: translate("手动配置"), value: "manual" }] : []),
  { label: translate("内置预设"), value: "preset" }, { label: translate("粘贴代码"), value: "code" }, { label: translate("文件导入"), value: "file" },
]);
const source = ref("");
const inspectedSource = ref("");
const presetId = ref("");
const fileName = ref("");
const fileInput = ref<HTMLInputElement>();
const draft = ref<ProviderConfiguration>({ kind: props.kind, id: "", label: "", config: {} });
const description = shallowRef<ProviderDescription>();
const models = ref<MediaProviderModel[]>([]);
const formRules = shallowRef<ReturnType<typeof formCreate.copyRules>>([]);
const formValues = ref<Record<string, unknown>>({});
const formApi = shallowRef<Api>();
const headers = ref("{}");
const textConnection = ref({ apiUrl: "", apiKey: "", protocol: "openai-completions" });
const inspecting = ref(false);
const localError = ref("");
const busy = computed(() => props.saving || inspecting.value);
const inspected = computed(() => !!description.value && source.value.trim() === inspectedSource.value.trim());
const formOptions = computed<Options>(() => ({ form: { labelPosition: "top", disabled: busy.value }, submitBtn: false, resetBtn: false }));
const editingIndex = ref<number>();
const editingModel = computed(() => editingIndex.value === undefined ? undefined : models.value[editingIndex.value]);
const mediaEditorVisible = ref(false);
const textEditorVisible = ref(false);
const textModel = ref<{ id: string; label: string; contextWindow?: number; maxOutputTokens?: number }>({ id: "", label: "" });
const modelError = ref("");
let inspectionRequest: AbortController | undefined;
let textModelExtra: Record<string, unknown> = {};
let sourceRead = 0;

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
function modelTypeLabel(type: string) { return translate(type === "text" ? "文本" : type === "image" ? "图片" : type === "video" ? "视频" : "音频"); }

function applyDescription(value: ProviderDescription) {
  description.value = clone(value);
  draft.value = { kind: value.kind, id: value.id, label: value.label, source: value.source, config: clone(value.config) };
  models.value = clone(value.models);
  formRules.value = formCreate.copyRules(value.rules ?? []);
  formValues.value = clone(value.config);
  formApi.value = undefined;
  headers.value = JSON.stringify(value.config.headers ?? {}, null, 2);
  textConnection.value = { apiUrl: String(value.config.apiUrl ?? ""), apiKey: String(value.config.apiKey ?? ""), protocol: String(value.config.protocol ?? "openai-completions") };
  source.value = value.source ?? source.value;
  inspectedSource.value = source.value;
}

watch(visible, value => {
  stopInspection();
  sourceRead++;
  if (!value) return;
  localError.value = "";
  fileName.value = "";
  description.value = undefined;
  draft.value = { kind: props.kind, id: "", label: "", config: {} };
  models.value = [];
  source.value = inspectedSource.value = "";
  formValues.value = {};
  formRules.value = [];
  formApi.value = undefined;
  headers.value = "{}";
  textConnection.value = { apiUrl: "", apiKey: "", protocol: "openai-completions" };
  method.value = props.initial?.source ? "code" : props.kind === "text" ? "manual" : "preset";
  if (props.initial) applyDescription(props.initial);
  else if (props.kind === "media") selectPreset(availablePresets.value[0]?.id ?? "");
}, { immediate: true });

function selectPreset(id: string) {
  let config: Record<string, unknown> = {};
  if (props.initial) {
    try { config = currentConfig(); }
    catch (cause) { localError.value = cause instanceof Error ? cause.message : translate("保存供应商失败"); return; }
  }
  presetId.value = id;
  source.value = availablePresets.value.find(item => item.id === id)?.source ?? "";
  description.value = undefined;
  models.value = [];
  formRules.value = [];
  formValues.value = clone(config);
  draft.value = { kind: props.kind, id: props.initial?.id ?? "", label: props.initial?.label ?? "", config };
  localError.value = "";
}

async function readSourceFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  const reading = ++sourceRead;
  try {
    if (!file.name.toLowerCase().endsWith(".ts") || file.size > 2 * 1024 * 1024) throw new Error(translate("请选择不超过 2 MB 的 TypeScript 供应商文件"));
    const content = await file.text();
    if (!visible.value || reading !== sourceRead) return;
    source.value = content;
    fileName.value = file.name;
    localError.value = "";
  } catch (cause) { localError.value = cause instanceof Error ? cause.message : translate("读取供应商代码失败"); }
}

function currentConfig() {
  const config = { ...clone(draft.value.config), ...clone(formApi.value?.formData() ?? formValues.value) };
  if (props.kind === "text") {
    config.apiUrl = textConnection.value.apiUrl.trim();
    config.protocol = textConnection.value.protocol;
    if (method.value === "manual" || !formRules.value.length) config.apiKey = textConnection.value.apiKey;
    let value: unknown;
    try { value = JSON.parse(headers.value); } catch { throw new Error(translate("请求头必须是 JSON 对象")); }
    if (!value || typeof value !== "object" || Array.isArray(value) || Object.values(value).some(item => typeof item !== "string")) throw new Error(translate("请求头必须是 JSON 对象"));
    config.headers = value;
    config.models = models.value.map(({ type, ...model }) => model);
  }
  return config;
}

async function inspectSource(nextModels?: MediaProviderModel[]) {
  if (busy.value || !source.value.trim()) return;
  inspectionRequest?.abort();
  const request = new AbortController();
  inspectionRequest = request;
  inspecting.value = true;
  localError.value = "";
  try {
    let config = description.value ? currentConfig() : clone(draft.value.config);
    if (props.kind === "text" && source.value !== inspectedSource.value) {
      const { apiUrl, protocol, models: previousModels, headers, maxRequestImageBytes, maxRequestBytes, ...connectionConfig } = config;
      config = connectionConfig;
    }
    const parsed = await props.inspect({ kind: props.kind, source: source.value, config, ...(nextModels ? { models: nextModels } : {}) }, request.signal);
    if (request.signal.aborted || !visible.value) return;
    if (props.initial && (parsed.id !== props.initial.id || parsed.kind !== props.initial.kind)) throw new Error(translate("不能修改已有供应商的 ID"));
    applyDescription(parsed);
  } catch (cause) {
    if (!request.signal.aborted) localError.value = cause instanceof Error ? cause.message : translate("解析供应商失败");
  } finally { if (inspectionRequest === request) { inspectionRequest = undefined; inspecting.value = false; } }
}

function editModel(index?: number) {
  if (busy.value) return;
  editingIndex.value = index;
  if (props.kind === "media") { mediaEditorVisible.value = true; return; }
  const model = index === undefined ? undefined : models.value[index];
  const original: Partial<MediaProviderModel> = model ?? {};
  const { id, label, type, contextWindow, maxOutputTokens, ...extra } = original;
  textModelExtra = extra;
  textModel.value = { id: String(id ?? ""), label: String(label ?? ""), ...(typeof contextWindow === "number" ? { contextWindow } : {}), ...(typeof maxOutputTokens === "number" ? { maxOutputTokens } : {}) };
  modelError.value = "";
  textEditorVisible.value = true;
}

function saveTextModel() {
  const id = textModel.value.id.trim();
  const label = textModel.value.label.trim();
  if (!id || !label) { modelError.value = translate("请填写显示名称和模型 ID"); return; }
  if (models.value.some((model, index) => index !== editingIndex.value && model.id === id)) { modelError.value = translate("模型 ID 不能重复"); return; }
  const { contextWindow, maxOutputTokens } = textModel.value;
  if ([contextWindow, maxOutputTokens].some(value => value != null && (!Number.isSafeInteger(value) || value < 1))) { modelError.value = translate("模型配置无效"); return; }
  const model: MediaProviderModel = { ...textModelExtra, id, label, type: "text",
    ...(contextWindow != null ? { contextWindow } : {}), ...(maxOutputTokens != null ? { maxOutputTokens } : {}) };
  if (editingIndex.value === undefined) models.value.push(model);
  else models.value.splice(editingIndex.value, 1, model);
  textEditorVisible.value = false;
}

async function saveMediaModel(model: MediaProviderModel) {
  const next = clone(models.value);
  if (editingIndex.value === undefined) next.push(model);
  else next.splice(editingIndex.value, 1, model);
  await inspectSource(next);
}

function saveProvider() {
  if (busy.value) return;
  localError.value = "";
  try {
    if (method.value !== "manual" && !inspected.value) throw new Error(translate("请先解析修改后的供应商代码"));
    const id = draft.value.id.trim();
    const label = draft.value.label.trim();
    if (!id || !label) throw new Error(translate("请填写供应商 ID 和显示名称"));
    const config = currentConfig();
    if (props.kind === "text" && !textConnection.value.apiUrl.trim()) throw new Error(translate("请填写接口地址"));
    emit("save", { kind: props.kind, id, label, ...(method.value === "manual" ? {} : { source: source.value }), config });
  } catch (cause) { localError.value = cause instanceof Error ? cause.message : translate("保存供应商失败"); }
}

function stopInspection() { const pending = inspectionRequest; inspectionRequest = undefined; inspecting.value = false; pending?.abort(); }
function closeEditor() { stopInspection(); sourceRead++; formApi.value = undefined; mediaEditorVisible.value = textEditorVisible.value = false; draft.value.config = {}; formValues.value = {}; textConnection.value.apiKey = ""; }
onBeforeUnmount(closeEditor);
</script>

<style lang="scss" scoped>
.providerEditor {
  max-height: min(70dvh, calc(100dvh - 190px));
  padding: 4px 8px;
  overflow-y: auto;
  overscroll-behavior: contain;
  .el-select { width: 100%; }
  .sourceDetails { margin-bottom: 20px; summary { width: fit-content; padding-block: 10px; color: var(--el-text-color-regular); cursor: pointer; font-weight: 500; &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; border-radius: var(--el-border-radius-base); } } &[open] > summary { margin-bottom: 14px; } + .sectionHeading { margin-top: 0; padding-top: 16px; } }
  .fileRow { display: flex; gap: 12px; width: 100%; .el-input { min-width: 0; flex: 1; } }
  .inspectRow { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: -4px 0 24px; color: var(--el-text-color-secondary); font-size: 13px; span { min-width: 0; overflow-wrap: anywhere; } .el-button { flex-shrink: 0; } }
  .sectionHeading { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin: 28px 0 20px; padding-top: 24px; border-top: 1px solid var(--el-border-color-lighter); h3 { margin: 0; font-size: 15px; font-weight: 600; } .modelCount { margin-inline-start: 8px; color: var(--el-text-color-secondary); font-weight: 400; font-variant-numeric: tabular-nums; } }
  .formGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 20px; .wideField { grid-column: 1 / -1; } }
  .advancedSettings { margin: 0 0 12px; summary { width: fit-content; padding-block: 8px; cursor: pointer; color: var(--el-text-color-regular); } }
  .formError { margin-top: 20px; }
  :deep(.el-input__wrapper), :deep(.el-select__wrapper) { min-height: 42px; }
  :deep(.el-form-item__label) { height: auto; line-height: 1.5; padding-bottom: 8px; }
  :deep(textarea) { font-family: ui-monospace, monospace; font-size: 13px; line-height: 1.6; }
}
.dialogActions { display: flex; justify-content: space-between; align-items: center; gap: 12px; > div { display: flex; gap: 12px; } .el-button { margin: 0; min-height: 40px; } }
.textModelForm { .modelLimits { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; .el-input-number { width: 100%; } } }
@media (max-width: 600px) { .providerEditor { .formGrid { grid-template-columns: minmax(0, 1fr); } .inspectRow { align-items: flex-start; flex-direction: column; .el-button { align-self: flex-end; } } } .textModelForm .modelLimits { grid-template-columns: minmax(0, 1fr); } }
</style>
