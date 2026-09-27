<template>
  <el-dialog
    v-model="visible"
    :title="t(mode === 'builtin' ? 'mediaProviders.addTitle' : 'mediaProviders.addCustomTitle')"
    :width="mode === 'builtin' ? 'min(860px, 94vw)' : 'min(760px, 94vw)'"
    alignCenter
    appendToBody
    destroyOnClose
    :closeOnClickModal="false"
    :closeOnPressEscape="!saving"
    :showClose="!saving">
    <div v-if="mode === 'builtin'" class="providerPicker">
      <aside class="providerSidebar" :aria-label="t('providers.select')">
        <button
          v-for="item in mediaProviders"
          :key="item.id"
          class="providerItem"
          type="button"
          :disabled="saving"
          :aria-pressed="selectedProvider === item.id"
          @click="selectedProvider = item.id">
          <img v-if="item.id === 'tfRouter'" class="providerLogo" :src="logoUrl" alt="" />
          <modelIcon v-else :model="item.id" :size="18" />
          <span>{{ item.label }}</span>
        </button>
      </aside>
      <el-scrollbar class="providerDetails">
        <section v-if="activeProvider" :key="selectedProvider" class="providerContent" :aria-label="activeProvider.label">
          <div class="providerHeader">
            <h3>{{ activeProvider.label }}</h3>
            <el-tag v-if="activeProvider.version" size="small" type="info" effect="plain">v{{ activeProvider.version }}</el-tag>
          </div>
          <messageMarkdown v-if="providerReadme" class="providerReadme" :content="providerReadme" />
          <el-divider v-if="providerReadme" contentPosition="left">{{ t("providers.connection") }}</el-divider>
          <form-create v-model:api="formApi" :rule="providerRules" :option="formOptions" />
          <div class="modelHeader">
            <el-text tag="strong">{{ t("common.models") }} <el-text type="info">{{ models.length }}</el-text></el-text>
          </div>
          <el-table v-if="models.length" class="modelList" :data="models" rowKey="id" :aria-label="t('common.models')">
            <el-table-column prop="id" :label="t('models.id')" minWidth="220" showOverflowTooltip />
            <el-table-column prop="label" :label="t('providers.displayName')" minWidth="180" showOverflowTooltip />
          </el-table>
          <el-alert v-if="formError" :title="getErrorDisplay(formError)" type="error" :closable="false" showIcon />
        </section>
      </el-scrollbar>
    </div>
    <el-scrollbar v-else maxHeight="65vh">
      <div class="dialogContent">
        <el-form labelPosition="top" :disabled="saving" @submit.prevent>
          <el-form-item :label="t('mediaProviders.addVia')">
            <el-segmented v-model="activeTab" :options="addMethods" block :ariaLabel="t('mediaProviders.addVia')">
              <template #default="{ item }">
                <span class="methodOption">
                  <component :is="item.icon" :size="16" aria-hidden="true" />
                  {{ item.label }}
                </span>
              </template>
            </el-segmented>
          </el-form-item>
          <el-form-item v-if="activeTab === 'file'" :label="t('mediaProviders.providerFile')">
            <div class="fileSource">
              <input ref="fileInput" type="file" accept=".ts" hidden :disabled="saving" @change="readSourceFile" />
              <el-input :modelValue="fileName" :prefixIcon="IconFileCode" :placeholder="t('common.noFileSelected')" readonly :aria-label="t('mediaProviders.selectedFile')" />
              <el-button :icon="IconFolderOpen" @click="fileInput?.click()">{{ t("common.chooseFile") }}</el-button>
            </div>
            <el-text class="fieldHint" type="info" size="small">{{ t("mediaProviders.fileSizeHint") }}</el-text>
          </el-form-item>
          <el-form-item v-else :label="t('mediaProviders.providerCode')">
            <el-input v-model="code" class="sourceInput" type="textarea" :rows="10" resize="none" :aria-label="t('mediaProviders.providerCode')" />
          </el-form-item>
        </el-form>
        <el-alert class="providerTips" :title="t('mediaProviders.askAiTitle')" type="info" :closable="false" showIcon>
          <p>{{ t("mediaProviders.aiPromptDescription") }}</p>
          <el-button size="small" :icon="IconCopy" @click="copyPrompt">{{ t("mediaProviders.copyPrompt") }}</el-button>
          <details class="promptDetails" :open="promptExpanded" @toggle="promptExpanded = ($event.target as HTMLDetailsElement).open">
            <summary>{{ t("mediaProviders.viewPrompt") }}</summary>
            <el-input v-if="promptExpanded" :modelValue="providerPrompt" type="textarea" :rows="10" resize="none" readonly :aria-label="t('mediaProviders.developmentPrompt')" />
          </details>
        </el-alert>
        <el-alert v-if="formError" class="formError" :title="getErrorDisplay(formError)" type="error" :closable="false" showIcon />
      </div>
    </el-scrollbar>
    <template #footer>
      <el-button :disabled="saving" @click="visible = false">{{ t("common.cancel") }}</el-button>
      <el-button type="primary" :loading="saving" :disabled="!source.trim()" @click="addProvider">{{ t("languageProviders.addTitle") }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { t } from "../../i18n";
import { createDisplayError, getErrorDisplay } from "@toonflow/i18n";
import axios from "axios";
import { computed, ref, shallowRef, watch } from "vue";
import formCreate, { type Api, type Options } from "../../formCreate";
import { IconFileCode, IconCode, IconFolderOpen, IconCopy } from "@tabler/icons-vue";
import { ElMessage } from "element-plus";
import { mediaProviders } from "@toonflow/providers";
import { modelIcon } from "@toonflow/model-icons";
import logoUrl from "@toonflow/assets/logo.svg";
import messageMarkdown from "@/components/messageMarkdown.vue";
import { invalidateNodeModels } from "@toonflow/nodes-scaffold/nodeAi";
import tfRouterSource from "@toonflow/providers/media/tfRouter?raw";
import type { MediaProvider } from "./types";
import { providerPrompt } from "./providerPrompt";
import { saveSettings } from "@/stores/settings";
import { writeClipboardText } from "@/lib/clipboard";

const { mode = "custom" } = defineProps<{ mode?: "builtin" | "custom" }>();
const visible = defineModel<boolean>({ default: false });
const emit = defineEmits<{ added: [provider: MediaProvider] }>();
const providerSources: Record<string, string> = { tfRouter: tfRouterSource };
const selectedProvider = ref<string>(mediaProviders[0]?.id ?? "");
const activeProvider = computed(() => mediaProviders.find(provider => provider.id === selectedProvider.value));
const models = computed(() => activeProvider.value?.models ?? []);
const providerReadme = computed(() => {
  const provider = activeProvider.value;
  return provider && "readme" in provider && typeof provider.readme === "string" ? provider.readme : "";
});
const activeTab = ref<"file" | "code">("file");
const addMethods = computed(() => [
  { label: t("mediaProviders.importFile"), value: "file", icon: IconFileCode },
  { label: t("mediaProviders.pasteCode"), value: "code", icon: IconCode },
]);
const promptExpanded = ref(false);
const code = ref("");
const fileSource = ref("");
const fileName = ref("");
const fileInput = ref<HTMLInputElement>();
const saving = ref(false);
const formError = shallowRef<Error>();
const formApi = shallowRef<Api>();
const addedProvider = shallowRef<MediaProvider>();
const formOptions = computed<Options>(() => ({ form: { labelPosition: "top", disabled: saving.value }, submitBtn: false, resetBtn: false }));
const providerRules = computed(() => formCreate.copyRules(activeProvider.value?.rules ?? []));
const source = computed(() => mode === "builtin" ? providerSources[selectedProvider.value] ?? "" : activeTab.value === "file" ? fileSource.value : code.value);

watch([activeTab, selectedProvider], () => {
  formError.value = undefined;
  addedProvider.value = undefined;
});

watch(visible, value => {
  if (!value) return;
  selectedProvider.value = mediaProviders[0]?.id ?? "";
  activeTab.value = "file";
  promptExpanded.value = false;
  formApi.value = undefined;
  addedProvider.value = undefined;
  code.value = fileSource.value = fileName.value = "";
  formError.value = undefined;
});

async function readSourceFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  formError.value = undefined;
  try {
    if (!/\.ts$/i.test(file.name) || file.size > 1024 * 1024) throw createDisplayError("请选择不超过 1 MB 的 .ts 文件", () => t("mediaProviders.invalidFile"));
    fileSource.value = await file.text();
    fileName.value = file.name;
  } catch (error) {
    fileSource.value = fileName.value = "";
    formError.value = error instanceof Error ? error : createDisplayError("读取文件失败", () => t("common.fileReadFailed"));
  }
}

async function addProvider() {
  if (saving.value || !source.value.trim()) return;
  if (mode === "builtin" && !formApi.value) return;
  saving.value = true;
  formError.value = undefined;
  try {
    let values: Record<string, unknown> | undefined;
    if (mode === "builtin") {
      if (!(await formApi.value!.validate().then(() => true, () => false))) return;
      values = formApi.value!.formData();
      if ("apiKey" in values) {
        values.apiKey = typeof values.apiKey === "string" ? values.apiKey.trim() : "";
        if (!values.apiKey) throw createDisplayError("请填写 API Key", () => t("providers.apiKeyRequired"));
        if ((values.apiKey as string).length > 8192) throw createDisplayError("API Key 过长", () => t("providers.apiKeyTooLong"));
      }
    }
    if (!addedProvider.value) {
      const { data } = await axios.post<{ data: MediaProvider }>("/api/providers/media/add", { source: source.value });
      addedProvider.value = data.data;
      emit("added", data.data);
      invalidateNodeModels("media");
    }
    if (values) {
      const providerId = addedProvider.value.id;
      // ACT: 安装成功但配置保存失败时保留安装结果，重试时只保存配置。
      await saveSettings(settings => {
        const configs = settings.mediaProviderConfigs as Record<string, Record<string, unknown>> | undefined;
        if (configs !== undefined && (!configs || typeof configs !== "object" || Array.isArray(configs))) throw createDisplayError("媒体供应商配置格式无效", () => t("mediaProviders.invalidSettings"));
        const current = configs?.[providerId];
        if (current !== undefined && (!current || typeof current !== "object" || Array.isArray(current))) throw createDisplayError("当前供应商配置格式无效", () => t("mediaProviders.invalidCurrentSettings"));
        return { mediaProviderConfigs: { ...configs, [providerId]: { ...current, ...values } } };
      });
    }
    invalidateNodeModels("media");
    visible.value = false;
  } catch (error) {
    const cause = axios.isAxiosError(error) ? new Error(error.response?.data?.message || error.message) : error instanceof Error ? error : createDisplayError("添加失败，请重试", () => t("mediaProviders.addFailed"));
    const message = cause.message;
    formError.value = addedProvider.value
      ? createDisplayError(`供应商已添加，连接配置未保存：${message}。填写内容已保留，请重试。`, () => t("mediaProviders.connectionSaveFailed", { message: getErrorDisplay(cause) }))
      : cause;
  } finally {
    saving.value = false;
  }
}

async function copyPrompt() {
  try {
    await writeClipboardText(providerPrompt);
    ElMessage.success(t("mediaProviders.promptCopied"));
  } catch {
    ElMessage.error(t("mediaProviders.copyFailed"));
  }
}
</script>

<style lang="scss" scoped>
.providerPicker {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  height: min(560px, 70dvh);
  gap: 24px;

  .providerSidebar {
    overflow-y: auto;
    border-right: 1px solid var(--el-border-color-lighter);
    padding: 2px;

    .providerItem {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 12px;
      margin-bottom: 4px;
      border: 0;
      border-radius: var(--el-border-radius-base);
      background: transparent;
      color: var(--el-text-color-regular);
      font: inherit;
      text-align: left;
      cursor: pointer;

      &:hover { background: var(--el-fill-color-light); }
      &[aria-pressed="true"] {
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }
      &:focus-visible { outline: 2px solid var(--el-color-primary); }

      .providerLogo {
        width: 18px;
        height: 18px;
        object-fit: contain;

        .dark & { filter: invert(1); }
      }
    }
  }

  .providerDetails {
    min-width: 0;

    .providerContent {
      padding-right: 12px;

      .providerHeader {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        margin: 4px 0 24px;

        h3 {
          margin: 0;
          color: var(--el-text-color-primary);
          font-size: 18px;
          overflow-wrap: anywhere;
        }
      }
      .providerReadme {
        margin-bottom: 24px;
        overflow-wrap: anywhere;
      }
      .modelHeader {
        margin: 8px 0 12px;
      }
      .modelList {
        margin-bottom: 16px;
      }
    }
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 16px;

    .providerSidebar {
      max-height: 128px;
      border-right: 0;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }
  }
}

.dialogContent {
  padding: 4px;

  .methodOption {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 4px 0;
  }

  .fileSource {
    display: flex;
    width: 100%;
    gap: 8px;

    .el-input { min-width: 0; }
    .el-button { flex-shrink: 0; }
  }

  .fieldHint {
    margin-top: 6px;
  }

  .sourceInput :deep(.el-textarea__inner) {
    height: min(28vh, 240px);
    min-height: 140px;
  }

  .providerTips {
    align-items: flex-start;

    :deep(.el-alert__content) {
      flex: 1;
      min-width: 0;
    }

    p {
      margin: 6px 0 12px;
      line-height: 1.6;
    }

    .promptDetails {
      margin-top: 12px;

      summary {
        width: fit-content;
        color: var(--el-text-color-secondary);
        cursor: pointer;
        &:hover { color: var(--el-color-primary); }
      }

      .el-textarea { margin-top: 12px; }
    }
  }

  .formError {
    margin-top: 16px;
  }
}
</style>
