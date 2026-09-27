<template>
  <el-dialog
    v-model="visible"
    :title="t('mediaProviders.editTitle', { name: provider?.label ?? '' })"
    width="min(800px, calc(100vw - 32px))"
    alignCenter
    appendToBody
    destroyOnClose
    :closeOnClickModal="false"
    :closeOnPressEscape="!saving"
    :showClose="!saving">
    <div class="providerEditor">
      <messageMarkdown v-if="provider?.readme" class="providerReadme" :content="provider.readme" />
      <el-form labelPosition="top" :disabled="saving">
        <el-form-item :label="t('providers.apiKey')">
          <el-input v-model="apiKey" :prefixIcon="IconKey" type="password" showPassword autocomplete="off" :aria-label="t('mediaProviders.apiKeyLabel')" />
        </el-form-item>
      </el-form>
      <div class="modelHeader">
        <h4>{{ t("mediaProviders.modelSettings") }} <el-text type="info">{{ models.length }}</el-text></h4>
        <el-button :icon="IconPlus" size="small" :disabled="saving" @click="editModel()">{{ t("models.addManually") }}</el-button>
      </div>
      <div class="modelList">
        <el-card v-for="(item, index) in models" :key="index" class="modelCard" shadow="never">
          <div class="topInfo">
            <div class="modelNameWrap">
              <modelIcon :model="item.id" :size="24" />
              <div class="modelInfo">
                <span class="modelName">{{ item.label }}</span>
                <el-text class="modelId" type="info" size="small">{{ item.id }}</el-text>
              </div>
            </div>
            <div class="actionButtons">
              <el-button text size="small" :icon="IconEdit" :disabled="saving" :aria-label="t('models.editLabel', { name: item.label })" @click="editModel(index)">{{ t("common.edit") }}</el-button>
              <el-button text size="small" type="danger" :icon="IconTrash" :disabled="saving" :aria-label="t('models.deleteLabel', { name: item.label })" @click="models.splice(index, 1)">{{ t("common.delete") }}</el-button>
            </div>
          </div>
          <div class="modelTags">
            <el-tag size="small">{{ modelTypes[item.type] }}</el-tag>
            <el-tag v-for="(tag, tagIndex) in modelTags(item)" :key="tagIndex" size="small" type="info">{{ tag }}</el-tag>
          </div>
        </el-card>
        <el-text v-if="!models.length" type="info">{{ t("models.none") }}</el-text>
      </div>
    </div>
    <el-alert v-if="formError" class="formError" :title="getErrorDisplay(formError)" type="error" :closable="false" showIcon />
    <template #footer>
      <el-button :disabled="saving" @click="visible = false">{{ t("common.cancel") }}</el-button>
      <el-button type="primary" :icon="IconDeviceFloppy" :loading="saving" @click="saveModels">{{ t("common.save") }}</el-button>
    </template>
    <component
      :is="modelEditorDialog"
      v-model="modelEditorVisible"
      :model="editingModelIndex === undefined ? undefined : models[editingModelIndex]"
      :models="models"
      @confirmed="confirmModel" />
  </el-dialog>
</template>

<script setup lang="ts">
import { t } from "../../i18n";
import { createDisplayError, getErrorDisplay } from "@toonflow/i18n";
import axios from "axios";
import { computed, defineAsyncComponent, ref, shallowRef, watch, type Component } from "vue";
import { IconPlus, IconTrash, IconDeviceFloppy, IconEdit, IconKey } from "@tabler/icons-vue";
import { modelIcon } from "@toonflow/model-icons";
import messageMarkdown from "@/components/messageMarkdown.vue";
import type { MediaProvider, MediaProviderModel } from "./types";
import { settings, saveSettings } from "@/stores/settings";
import { invalidateNodeModels } from "@toonflow/nodes-scaffold/nodeAi";

const { provider } = defineProps<{ provider?: MediaProvider }>();
const modelEditorDialog = shallowRef<Component>();
const visible = defineModel<boolean>({ default: false });
const emit = defineEmits<{ saved: [provider: MediaProvider] }>();
const models = ref<MediaProviderModel[]>([]);
const modelEditorVisible = ref(false);
const editingModelIndex = ref<number>();
const saving = ref(false);
const apiKey = ref("");
const formError = shallowRef<Error>();
const modelTypes = computed(() => ({ image: t("common.image"), video: t("common.video"), audio: t("common.audio"), text: t("common.text") }));
const modeLabels = computed<Record<string, string>>(() => ({
  singleImage: t("models.modeSingleImage"), multiReference: t("models.modeMultipleReferences"), startEndRequired: t("models.modeFirstLastRequired"),
  endFrameOptional: t("models.modeLastOptional"), startFrameOptional: t("models.modeFirstOptional"),
  imageReference: t("models.modeImageReference"), videoReference: t("models.modeVideoReference"), audioReference: t("models.modeAudioReference"),
}));

watch(visible, isVisible => {
  if (!isVisible) return;
  formError.value = undefined;
  modelEditorVisible.value = false;
  editingModelIndex.value = undefined;
  const configs = settings.value.mediaProviderConfigs as Record<string, { apiKey?: unknown }> | undefined;
  const configuredKey = provider && configs?.[provider.id]?.apiKey;
  apiKey.value = typeof configuredKey === "string" ? configuredKey : "";
  models.value = JSON.parse(JSON.stringify(provider?.models ?? []));
}, { immediate: true });

function modelTags(model: MediaProviderModel) {
  const modes = Array.isArray(model.mode) ? model.mode.flat().filter((mode): mode is string => typeof mode === "string") : [];
  return modes.map(mode => {
    if (mode === "text") return t(model.type === "image" ? "models.textToImage" : "models.textToVideo");
    const reference = /^(imageReference|videoReference|audioReference):(\d+)$/.exec(mode);
    return reference ? `${modeLabels.value[reference[1]!]} ×${reference[2]}` : modeLabels.value[mode] ?? mode;
  });
}

function editModel(index?: number) {
  modelEditorDialog.value ??= defineAsyncComponent(() => import("./modelEditorDialog.vue"));
  editingModelIndex.value = index;
  modelEditorVisible.value = true;
}

function confirmModel(model: MediaProviderModel) {
  const index = editingModelIndex.value;
  if (index === undefined) models.value.push(model);
  else models.value.splice(index, 1, model);
}

async function saveModels() {
  if (saving.value || !provider) return;
  const { id: providerId, fileName, revision } = provider;
  formError.value = undefined;
  let configSaved = false;
  try {
    const ids = new Set<string>();
    const values = models.value.map((item, index) => {
      const id = item.id.trim();
      const label = item.label.trim();
      if (!id || !label) throw createDisplayError(`请填写第 ${index + 1} 个模型的 ID 和显示名称`, () => t("models.rowRequired", { index: index + 1 }));
      if (ids.has(id)) throw createDisplayError(`模型 ID 重复：${id}`, () => t("models.duplicateId", { id }));
      ids.add(id);
      return { ...item, id, label };
    });
    if (apiKey.value.length > 8192) throw createDisplayError("API Key 过长", () => t("providers.apiKeyTooLong"));
    saving.value = true;
    const nextKey = apiKey.value.trim();
    configSaved = await saveSettings(settings => {
      const configs = settings.mediaProviderConfigs as Record<string, Record<string, unknown>> | undefined;
      if (configs !== undefined && (!configs || typeof configs !== "object" || Array.isArray(configs))) throw createDisplayError("媒体供应商配置格式无效", () => t("mediaProviders.invalidSettings"));
      const current = configs?.[providerId];
      if (current !== undefined && (!current || typeof current !== "object" || Array.isArray(current))) throw createDisplayError("当前供应商配置格式无效", () => t("mediaProviders.invalidCurrentSettings"));
      if (nextKey === (current?.apiKey ?? "")) return;
      return { mediaProviderConfigs: { ...configs, [providerId]: { ...current, apiKey: nextKey } } };
    });
    const { data } = await axios.put<{ data: MediaProvider }>("/api/providers/media/save", {
      fileName, revision, models: values,
    });
    invalidateNodeModels("media");
    emit("saved", data.data);
    visible.value = false;
  } catch (error) {
    const cause = axios.isAxiosError(error) ? new Error(error.response?.data?.message || error.message) : error instanceof Error ? error : createDisplayError("保存失败，请重试", () => t("common.saveFailedRetry"));
    const message = cause.message;
    formError.value = configSaved
      ? createDisplayError(`连接配置已保存，模型未保存：${message}。模型修改已保留，请重试。`, () => t("mediaProviders.modelsSaveFailed", { message: getErrorDisplay(cause) }))
      : cause;
  } finally {
    saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.providerEditor {
  max-height: 65dvh;
  padding: 8px 4px;
  overflow-y: auto;
  overscroll-behavior: contain;

  .providerReadme { margin-bottom: 20px; }

  .modelHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;

    h4 { margin: 0; }
  }

  .modelList {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .modelCard {
      .topInfo {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;

        .modelNameWrap {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;

          .modelInfo {
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 0;
            overflow-wrap: anywhere;

            .modelName { font-size: 15px; font-weight: 600; }
            .modelId { align-self: flex-start; }
          }
        }

        .actionButtons {
          display: flex;
          flex-shrink: 0;
          margin-left: auto;
        }
      }

      .modelTags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 16px;
      }
    }
  }
}

.formError { margin-top: 16px; }
</style>
