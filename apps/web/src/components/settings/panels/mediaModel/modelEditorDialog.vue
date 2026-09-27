<template>
  <el-dialog
    v-model="visible"
    :title="t(model ? 'models.editTitle' : 'models.addTitle')"
    width="min(640px, calc(100vw - 32px))"
    alignCenter
    appendToBody
    destroyOnClose
    :closeOnClickModal="false">
    <div class="dialogContent">
      <el-form labelPosition="top" @submit.prevent>
        <el-form-item :label="t('providers.displayName')" required>
          <el-input v-model="draft.label" clearable :aria-label="t('models.displayNameLabel')" />
        </el-form-item>
        <el-form-item :label="t('models.id')" required>
          <el-input v-model="draft.id" clearable :aria-label="t('models.id')" />
        </el-form-item>
        <el-form-item :label="t('models.type')">
          <el-select v-model="draft.type" :aria-label="t('models.type')">
            <el-option v-if="model?.type === 'text'" value="text" :label="t('models.textLegacy')" disabled />
            <el-option v-for="item in modelTypes" :key="item.value" :value="item.value" :label="item.label" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="draft.type === 'image'" :label="t('models.imageGenerationMode')" required>
          <el-checkbox-group v-model="draft.imageMode">
            <el-checkbox v-for="item in imageModes" :key="item.value" :value="item.value">{{ item.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <template v-if="draft.type === 'video'">
          <el-form-item :label="t('models.videoGenerationMode')" required>
            <div class="videoModes">
              <el-checkbox-group v-model="draft.videoMode">
                <el-checkbox v-for="item in videoModes" :key="item.value" :value="item.value">{{ item.label }}</el-checkbox>
              </el-checkbox-group>
              <el-checkbox-group v-if="draft.videoMode.includes('multiReference')" v-model="draft.mixedMode" class="referenceModes">
                <div v-for="item in referenceModes" :key="item.value" class="referenceItem">
                  <el-checkbox :value="item.value">{{ item.label }}</el-checkbox>
                  <el-input-number
                    v-if="draft.mixedMode.includes(item.value)"
                    v-model="draft.mixedModeCount[item.value]"
                    :min="1"
                    :step="1"
                    :precision="0"
                    controlsPosition="right"
                    size="small"
                    :aria-label="t('models.referenceCountLabel', { label: item.label })" />
                </div>
              </el-checkbox-group>
            </div>
          </el-form-item>
          <el-form-item :label="t('models.audioOutput')">
            <el-radio-group v-model="draft.audio">
              <el-radio value="optional">{{ t("models.audioOptional") }}</el-radio>
              <el-radio :value="true">{{ t("models.audioAlways") }}</el-radio>
              <el-radio :value="false">{{ t("models.audioNone") }}</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item :label="t('models.durationResolution')" required>
            <div class="mappingEditor">
              <div class="mappingHeader"><span>{{ t("providerDebug.durationSeconds") }}</span><span>{{ t("common.resolution") }}</span></div>
              <div v-for="(row, index) in draft.durationResolutionMap" :key="index" class="mappingRow">
                <span class="rowIndex">{{ index + 1 }}</span>
                <el-input-tag v-model="row.duration" :placeholder="t('models.pressEnterToAdd')" :aria-label="t('models.durationRowLabel', { index: index + 1 })" />
                <icon-arrow-right :size="16" aria-hidden="true" />
                <el-input-tag v-model="row.resolution" :placeholder="t('models.pressEnterToAdd')" :aria-label="t('models.resolutionRowLabel', { index: index + 1 })" />
                <el-button
                  text
                  type="danger"
                  :icon="IconTrash"
                  :disabled="draft.durationResolutionMap.length === 1"
                  :aria-label="t('models.deleteDurationRow', { index: index + 1 })"
                  @click="draft.durationResolutionMap.splice(index, 1)" />
              </div>
              <el-button class="addMapping" :icon="IconPlus" @click="draft.durationResolutionMap.push({ duration: [], resolution: [] })">{{ t("models.addDurationResolution") }}</el-button>
            </div>
          </el-form-item>
        </template>
        <details class="modelOptions">
          <summary>{{ t("models.advancedSettingsJson") }}</summary>
          <el-input v-model="options" type="textarea" :rows="6" resize="vertical" :aria-label="t('models.advancedSettings')" />
        </details>
      </el-form>
    </div>
    <el-alert v-if="formError" class="formError" :title="getErrorDisplay(formError)" type="error" :closable="false" showIcon />
    <template #footer>
      <el-button @click="visible = false">{{ t("common.cancel") }}</el-button>
      <el-button type="primary" @click="confirmModel">{{ t("common.confirm") }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { t } from "../../i18n";
import { createDisplayError, getErrorDisplay } from "@toonflow/i18n";
import { computed, ref, shallowRef, watch } from "vue";
import { IconArrowRight, IconPlus, IconTrash } from "@tabler/icons-vue";
import type { MediaProviderModel } from "./types";

const { model, models } = defineProps<{ model?: MediaProviderModel; models: MediaProviderModel[] }>();
const visible = defineModel<boolean>({ default: false });
const emit = defineEmits<{ confirmed: [model: MediaProviderModel] }>();
const modelTypes = computed(() => [
  { value: "image", label: t("common.image") },
  { value: "video", label: t("common.video") },
  { value: "audio", label: t("common.audio") },
]);
const imageModes = computed(() => [
  { value: "text", label: t("models.textToImage") },
  { value: "singleImage", label: t("models.modeSingleImage") },
  { value: "multiReference", label: t("models.modeMultipleReferences") },
]);
const videoModes = computed(() => [
  { value: "singleImage", label: t("models.modeSingleImage") },
  { value: "startEndRequired", label: t("models.modeFirstLastRequired") },
  { value: "endFrameOptional", label: t("models.modeLastOptional") },
  { value: "startFrameOptional", label: t("models.modeFirstOptional") },
  { value: "text", label: t("models.textToVideo") },
  { value: "multiReference", label: t("models.modeMixedReferences") },
]);
const referenceModes = computed(() => [
  { value: "videoReference", label: t("models.modeVideoReference") },
  { value: "imageReference", label: t("models.modeImageReference") },
  { value: "audioReference", label: t("models.modeAudioReference") },
]);
const draft = ref(createDraft());
const options = ref("{}");
const formError = shallowRef<Error>();
let original: Record<string, unknown> = {};
let initialDraft = createDraft();
let initialExtraMode: unknown;

function createDraft() {
  return {
    id: "", label: "", type: "image" as MediaProviderModel["type"],
    imageMode: [] as string[], videoMode: [] as string[], mixedMode: [] as string[],
    mixedModeCount: { videoReference: 1, imageReference: 1, audioReference: 1 } as Record<string, number | undefined>,
    audio: "optional" as "optional" | boolean,
    durationResolutionMap: [{ duration: [] as string[], resolution: [] as string[] }],
  };
}

watch(visible, (isVisible) => {
  if (!isVisible) return;
  draft.value = createDraft();
  formError.value = undefined;
  original = JSON.parse(JSON.stringify(model ?? {}));
  // ACT: 旧文本模型的扩展字段按原值保留，不再提供专用配置。
  const { id, label, type, ...extra } = original;
  Object.assign(draft.value, { id: id ?? "", label: label ?? "", type: type ?? "image" });
  if (draft.value.type === "image" || draft.value.type === "video") {
    const knownModes = draft.value.type === "image" ? imageModes.value : videoModes.value.filter(item => item.value !== "multiReference");
    const selectedModes = draft.value.type === "image" ? draft.value.imageMode : draft.value.videoMode;
    const remainingModes: unknown[] = [];
    for (const mode of Array.isArray(extra.mode) ? extra.mode : []) {
      if (knownModes.some(item => item.value === mode)) {
        selectedModes.push(mode as string);
        continue;
      }
      const references = Array.isArray(mode) ? mode.map(value => String(value).match(/^(videoReference|imageReference|audioReference):([1-9]\d*)$/)) : [];
      if (draft.value.type === "video" && !draft.value.mixedMode.length && references.length && references.every(item => item && Number.isSafeInteger(Number(item[2]))) && new Set(references.map(item => item?.[1])).size === references.length) {
        for (const match of references) {
          draft.value.mixedMode.push(match![1]!);
          draft.value.mixedModeCount[match![1]!] = Number(match![2]);
        }
        selectedModes.push("multiReference");
      } else remainingModes.push(mode);
    }
    if (remainingModes.length) extra.mode = remainingModes;
    else delete extra.mode;
  }
  if (draft.value.type === "video") {
    draft.value.audio = typeof extra.audio === "boolean" ? extra.audio : "optional";
    if (Array.isArray(extra.durationResolutionMap) && extra.durationResolutionMap.length) {
      draft.value.durationResolutionMap = extra.durationResolutionMap.map(row => ({
        duration: Array.isArray(row?.duration) ? row.duration.map(String) : [],
        resolution: Array.isArray(row?.resolution) ? row.resolution.map(String) : [],
      }));
    }
    delete extra.audio;
    delete extra.durationResolutionMap;
  }
  options.value = JSON.stringify(extra, null, 2);
  initialDraft = JSON.parse(JSON.stringify(draft.value));
  initialExtraMode = extra.mode;
}, { immediate: true });

function confirmModel() {
  formError.value = undefined;
  try {
    const id = draft.value.id.trim();
    const label = draft.value.label.trim();
    if (!label || !id) throw createDisplayError("请填写显示名称和模型 ID", () => t("models.nameAndIdRequired"));
    if (models.some(item => item !== model && item.id.trim() === id)) throw createDisplayError(`模型 ID 已存在：${id}`, () => t("models.idExists", { id }));
    let extra: Record<string, unknown>;
    try { extra = JSON.parse(options.value); }
    catch { throw createDisplayError("更多配置不是有效的 JSON", () => t("models.advancedJsonInvalid")); }
    if (!extra || typeof extra !== "object" || Array.isArray(extra)) throw createDisplayError("更多配置必须是 JSON 对象", () => t("models.advancedObjectRequired"));
    const fields = ["id", "label", "type", ...(draft.value.type === "video" ? ["audio", "durationResolutionMap"] : [])];
    if (fields.some(field => field in extra)) throw createDisplayError("已有表单项请直接在上方编辑", () => t("models.editExistingFields"));
    const value: MediaProviderModel = { ...extra, id, label, type: draft.value.type };
    const typeChanged = !model || value.type !== model.type;
    const changed = (...fields: (keyof typeof initialDraft)[]) => typeChanged || fields.some(field => JSON.stringify(draft.value[field]) !== JSON.stringify(initialDraft[field]));
    const modelFields = value.type === "image" ? ["mode"] : value.type === "video" ? ["mode", "audio", "durationResolutionMap"] : [];
    if (!typeChanged) for (const field of modelFields) if (field in original) value[field] = original[field];
    const modeChanged = changed(value.type === "image" ? "imageMode" : "videoMode", "mixedMode", "mixedModeCount") || JSON.stringify(extra.mode) !== JSON.stringify(initialExtraMode);
    if ((value.type === "image" || value.type === "video") && modeChanged) {
      if (extra.mode !== undefined && !Array.isArray(extra.mode)) throw createDisplayError("更多配置中的 mode 必须是数组", () => t("models.modeMustBeArray"));
      const modes: unknown[] = value.type === "image" ? [...draft.value.imageMode] : draft.value.videoMode.filter(mode => mode !== "multiReference");
      if (value.type === "video" && draft.value.videoMode.includes("multiReference")) {
        if (!draft.value.mixedMode.length) throw createDisplayError("请选择混合参考的媒体类型", () => t("models.selectMixedTypes"));
        modes.push(draft.value.mixedMode.map(reference => {
          const count = draft.value.mixedModeCount[reference];
          if (!Number.isSafeInteger(count) || !count || count < 1) throw createDisplayError("参考数量必须是正整数", () => t("models.referenceCountPositive"));
          return `${reference}:${count}`;
        }));
      }
      modes.push(...(extra.mode as unknown[] ?? []));
      if (!modes.length) throw createDisplayError("请至少选择一种生成模式", () => t("models.selectGenerationMode"));
      value.mode = modes;
    }
    if (value.type === "video" && changed("audio")) value.audio = draft.value.audio;
    if (value.type === "video" && changed("durationResolutionMap")) {
      if (!draft.value.durationResolutionMap.length) throw createDisplayError("请至少添加一组时长与分辨率", () => t("models.addDurationResolution"));
      value.durationResolutionMap = draft.value.durationResolutionMap.map((row, index) => {
        const duration = row.duration.map(Number);
        const resolution = row.resolution.map(value => value.trim());
        if (!duration.length || duration.some(value => !Number.isFinite(value) || value <= 0)) throw createDisplayError(`第 ${index + 1} 组时长必须是正数`, () => t("models.durationPositive", { index: index + 1 }));
        if (!resolution.length || resolution.some(value => !value)) throw createDisplayError(`请填写第 ${index + 1} 组分辨率`, () => t("models.resolutionRequired", { index: index + 1 }));
        return { duration, resolution };
      });
    }
    emit("confirmed", value);
    visible.value = false;
  } catch (error) {
    formError.value = error instanceof Error ? error : createDisplayError("模型配置无效", () => t("models.invalidSettings"));
  }
}
</script>

<style lang="scss" scoped>
.dialogContent {
  max-height: min(65dvh, calc(100dvh - 230px));
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 4px 8px;

  .el-select { width: 100%; }

  .videoModes {
    width: 100%;

    .referenceModes {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 20px;
      margin-top: 8px;

      .referenceItem {
        display: flex;
        align-items: center;
        gap: 8px;

        .el-checkbox { margin-right: 0; }
        .el-input-number { width: 88px; }
      }
    }
  }

  .mappingEditor {
    width: 100%;

    .mappingHeader {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      padding: 0 44px 4px 26px;
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }

    .mappingRow {
      display: grid;
      grid-template-columns: 18px minmax(0, 1fr) 16px minmax(0, 1fr) 32px;
      align-items: start;
      gap: 8px;
      margin-bottom: 8px;

      .rowIndex, > svg { margin-top: 8px; color: var(--el-text-color-secondary); }
      .el-button { width: 32px; padding: 0; }
    }

    .addMapping { width: 100%; margin-top: 4px; }
  }

  .modelOptions {
    summary { width: fit-content; margin-bottom: 12px; cursor: pointer; }
  }
}

.formError { margin-top: 12px; }
</style>
