<template>
  <el-dialog
    v-model="visible"
    class="modelEditorDialog"
    :title="model ? '编辑模型' : '添加模型'"
    width="min(760px, calc(100vw - 24px))"
    alignCenter
    appendToBody
    destroyOnClose
    :closeOnClickModal="false">
    <div class="dialogContent">
      <el-form labelPosition="top" @submit.prevent>
        <div class="modelIdentity">
          <el-form-item label="显示名称" required>
            <el-input v-model="draft.label" clearable aria-label="模型显示名称" />
          </el-form-item>
          <el-form-item label="模型 ID" required>
            <el-input v-model="draft.id" clearable dir="ltr" aria-label="模型 ID" />
          </el-form-item>
          <el-form-item label="模型类型">
            <el-select v-model="draft.type" aria-label="模型类型">
              <el-option v-if="model?.type === 'text'" value="text" label="文本（旧配置）" disabled />
              <el-option v-for="item in modelTypes" :key="item.value" :value="item.value" :label="item.label" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item v-if="draft.type === 'image'" label="图片生成模式" required>
          <el-checkbox-group v-model="draft.imageMode" class="choiceGroup" aria-label="图片生成模式">
            <el-checkbox v-for="item in imageModes" :key="item.value" :value="item.value">{{ item.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <template v-if="draft.type === 'video'">
          <el-form-item label="视频生成模式" required>
            <div class="videoModes">
              <el-checkbox-group v-model="draft.videoMode" class="choiceGroup" aria-label="视频生成模式">
                <el-checkbox v-for="item in videoModes" :key="item.value" :value="item.value">{{ item.label }}</el-checkbox>
              </el-checkbox-group>
              <el-checkbox-group v-if="draft.videoMode.includes('multiReference')" v-model="draft.mixedMode" class="referenceModes" aria-label="混合参考">
                <div v-for="item in referenceModes" :key="item.value" class="referenceItem">
                  <el-checkbox :value="item.value">{{ item.label }}</el-checkbox>
                  <el-input-number
                    v-model="draft.mixedModeCount[item.value]"
                    :disabled="!draft.mixedMode.includes(item.value)"
                    :min="1"
                    :step="1"
                    :precision="0"
                    controlsPosition="right"
                    size="small"
                    :aria-label="`${item.label}数量`" />
                </div>
              </el-checkbox-group>
            </div>
          </el-form-item>
          <el-form-item label="音频输出">
            <el-radio-group v-model="draft.audio" class="choiceGroup" aria-label="音频输出">
              <el-radio value="optional">可选音频</el-radio>
              <el-radio :value="true">始终输出音频</el-radio>
              <el-radio :value="false">无音频</el-radio>
            </el-radio-group>
          </el-form-item>
          <section class="mappingEditor" :aria-labelledby="`${editorId}-mappings`">
            <div class="mappingHeading">
              <h3 :id="`${editorId}-mappings`">时长、分辨率与比例</h3>
              <el-button size="small" :icon="IconPlus" @click="addMapping">添加组合</el-button>
            </div>
            <div v-for="(row, index) in draft.durationResolutionMap" :key="index" class="mappingGroup" role="group" :aria-label="`组合 ${index + 1}`">
              <div v-if="draft.durationResolutionMap.length > 1" class="groupHeading">
                <span>组合 {{ index + 1 }}</span>
                <el-button text :icon="IconTrash" :aria-label="`删除组合 ${index + 1}`" @click="removeMapping(index)" />
              </div>
              <div class="mappingFields">
                <div class="mappingField durationField">
                  <label :for="`${editorId}-duration-${index}`">时长（秒）</label>
                  <el-input-tag :id="`${editorId}-duration-${index}`" v-model="row.duration" placeholder="输入后按回车" :aria-label="`第 ${index + 1} 组时长`" />
                </div>
                <div class="mappingField">
                  <label :for="`${editorId}-resolution-${index}`">分辨率</label>
                  <el-input-tag :id="`${editorId}-resolution-${index}`" v-model="row.resolution" placeholder="输入后按回车" :aria-label="`第 ${index + 1} 组分辨率`" />
                </div>
                <div class="mappingField">
                  <label :for="`${editorId}-ratio-${index}`">比例</label>
                  <el-input-tag :id="`${editorId}-ratio-${index}`" v-model="row.ratio" placeholder="16:9" :aria-label="`第 ${index + 1} 组比例`" :aria-describedby="`${editorId}-ratioHint-${index}`" />
                  <p :id="`${editorId}-ratioHint-${index}`" class="ratioHint">宽和高用英文冒号分隔，留空使用通用比例。</p>
                </div>
              </div>
            </div>
          </section>
        </template>
        <details class="modelOptions">
          <summary>更多配置（JSON）</summary>
          <el-input v-model="options" type="textarea" dir="ltr" :rows="6" resize="vertical" aria-label="模型的更多配置" />
        </details>
      </el-form>
    </div>
    <el-alert v-if="formError" class="formError" :title="formError" type="error" :closable="false" showIcon />
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="confirmModel">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { nextTick, ref, useId, watch } from "vue";
import { ElAlert, ElButton, ElCheckbox, ElCheckboxGroup, ElDialog, ElForm, ElFormItem, ElInput, ElInputNumber, ElInputTag, ElOption, ElRadio, ElRadioGroup, ElSelect } from "element-plus";
import "element-plus/es/components/alert/style/css";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/checkbox/style/css";
import "element-plus/es/components/checkbox-group/style/css";
import "element-plus/es/components/dialog/style/css";
import "element-plus/es/components/form/style/css";
import "element-plus/es/components/form-item/style/css";
import "element-plus/es/components/input/style/css";
import "element-plus/es/components/input-number/style/css";
import "element-plus/es/components/input-tag/style/css";
import "element-plus/es/components/option/style/css";
import "element-plus/es/components/radio/style/css";
import "element-plus/es/components/radio-group/style/css";
import "element-plus/es/components/select/style/css";
import { IconPlus, IconTrash } from "@tabler/icons-vue";
import type { MediaProviderModel } from "./types";

const { model, models } = defineProps<{ model?: MediaProviderModel; models: MediaProviderModel[] }>();
const visible = defineModel<boolean>({ default: false });
const emit = defineEmits<{ confirmed: [model: MediaProviderModel] }>();
const editorId = useId();
const modelTypes = [
  { value: "image", label: "图片" },
  { value: "video", label: "视频" },
  { value: "audio", label: "音频" },
];
const imageModes = [
  { value: "text", label: "文生图" },
  { value: "singleImage", label: "单图参考" },
  { value: "multiReference", label: "多图参考" },
];
const videoModes = [
  { value: "singleImage", label: "单图参考" },
  { value: "startEndRequired", label: "首尾帧必填" },
  { value: "endFrameOptional", label: "尾帧可选" },
  { value: "startFrameOptional", label: "首帧可选" },
  { value: "text", label: "文生视频" },
  { value: "multiReference", label: "混合参考" },
];
const referenceModes = [
  { value: "videoReference", label: "视频参考" },
  { value: "imageReference", label: "图片参考" },
  { value: "audioReference", label: "音频参考" },
];
const draft = ref(createDraft());
const options = ref("{}");
const formError = ref("");
let original: Record<string, unknown> = {};
let initialDraft = createDraft();
let initialExtraMode: unknown;

function createDraft() {
  return {
    id: "", label: "", type: "image" as MediaProviderModel["type"],
    imageMode: [] as string[], videoMode: [] as string[], mixedMode: [] as string[],
    mixedModeCount: { videoReference: 1, imageReference: 1, audioReference: 1 } as Record<string, number | undefined>,
    audio: "optional" as "optional" | boolean,
    durationResolutionMap: [{ duration: [] as string[], resolution: [] as string[], ratio: [] as string[] }],
  };
}

function focusMapping(index: number) {
  nextTick(() => document.getElementById(`${editorId}-duration-${index}`)?.focus());
}

function addMapping() {
  const rows = draft.value.durationResolutionMap;
  rows.push({ duration: [], resolution: [], ratio: [] });
  focusMapping(rows.length - 1);
}

function removeMapping(index: number) {
  const rows = draft.value.durationResolutionMap;
  rows.splice(index, 1);
  focusMapping(Math.min(index, rows.length - 1));
}

watch(visible, (isVisible) => {
  if (!isVisible) return;
  draft.value = createDraft();
  formError.value = "";
  original = JSON.parse(JSON.stringify(model ?? {}));
  // ACT: 旧文本模型的扩展字段按原值保留，不再提供专用配置。
  const { id, label, type, ...extra } = original;
  Object.assign(draft.value, { id: id ?? "", label: label ?? "", type: type ?? "image" });
  if (draft.value.type === "image" || draft.value.type === "video") {
    const knownModes = draft.value.type === "image" ? imageModes : videoModes.filter(item => item.value !== "multiReference");
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
        ...row,
        duration: Array.isArray(row?.duration) ? row.duration.map(String) : [],
        resolution: Array.isArray(row?.resolution) ? row.resolution.map(String) : [],
        ratio: Array.isArray(row?.ratio) ? row.ratio.map(String) : [],
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
  formError.value = "";
  try {
    const id = draft.value.id.trim();
    const label = draft.value.label.trim();
    if (!label || !id) throw new Error("请填写显示名称和模型 ID");
    if (models.some(item => item !== model && item.id.trim() === id)) throw new Error(`模型 ID 已存在：${id}`);
    let extra: Record<string, unknown>;
    try { extra = JSON.parse(options.value); }
    catch { throw new Error("更多配置不是有效的 JSON"); }
    if (!extra || typeof extra !== "object" || Array.isArray(extra)) throw new Error("更多配置必须是 JSON 对象");
    const fields = ["id", "label", "type", ...(draft.value.type === "video" ? ["audio", "durationResolutionMap"] : [])];
    if (fields.some(field => field in extra)) throw new Error("已有表单项请直接在上方编辑");
    const value: MediaProviderModel = { ...extra, id, label, type: draft.value.type };
    const typeChanged = !model || value.type !== model.type;
    const changed = (...fields: (keyof typeof initialDraft)[]) => typeChanged || fields.some(field => JSON.stringify(draft.value[field]) !== JSON.stringify(initialDraft[field]));
    const modelFields = value.type === "image" ? ["mode"] : value.type === "video" ? ["mode", "audio", "durationResolutionMap"] : [];
    if (!typeChanged) for (const field of modelFields) if (field in original) value[field] = original[field];
    const modeChanged = changed(value.type === "image" ? "imageMode" : "videoMode", "mixedMode", "mixedModeCount") || JSON.stringify(extra.mode) !== JSON.stringify(initialExtraMode);
    if ((value.type === "image" || value.type === "video") && modeChanged) {
      if (extra.mode !== undefined && !Array.isArray(extra.mode)) throw new Error("更多配置中的 mode 必须是数组");
      const modes: unknown[] = value.type === "image" ? [...draft.value.imageMode] : draft.value.videoMode.filter(mode => mode !== "multiReference");
      if (value.type === "video" && draft.value.videoMode.includes("multiReference")) {
        if (!draft.value.mixedMode.length) throw new Error("请选择混合参考的媒体类型");
        modes.push(draft.value.mixedMode.map(reference => {
          const count = draft.value.mixedModeCount[reference];
          if (!Number.isSafeInteger(count) || !count || count < 1) throw new Error("参考数量必须是正整数");
          return `${reference}:${count}`;
        }));
      }
      modes.push(...(extra.mode as unknown[] ?? []));
      if (!modes.length) throw new Error("请至少选择一种生成模式");
      value.mode = modes;
    }
    if (value.type === "video" && changed("audio")) value.audio = draft.value.audio;
    if (value.type === "video" && changed("durationResolutionMap")) {
      if (!draft.value.durationResolutionMap.length) throw new Error("请至少添加一组时长与分辨率");
      value.durationResolutionMap = draft.value.durationResolutionMap.map(({ ratio: ratios, ...row }, index) => {
        const duration = row.duration.map(Number);
        const resolution = row.resolution.map(value => value.trim());
        const ratio = [...new Set(ratios.map(value => value.trim()).filter(Boolean))];
        if (!duration.length || duration.some(value => !Number.isFinite(value) || value <= 0)) throw new Error(`第 ${index + 1} 组时长必须是正数`);
        if (!resolution.length || resolution.some(value => !value)) throw new Error(`请填写第 ${index + 1} 组分辨率`);
        return { ...row, duration, resolution, ...(ratio.length ? { ratio } : {}) };
      });
    }
    emit("confirmed", value);
    visible.value = false;
  } catch (error) {
    formError.value = error instanceof Error ? error.message : "模型配置无效";
  }
}
</script>

<style lang="scss">
.el-dialog.modelEditorDialog {
  --editorGutter: 24px;
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 24px);
  padding: 0;

  > .el-dialog__header {
    padding: 16px var(--editorGutter);
    padding-inline-end: 48px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
  > .el-dialog__body { display: flex; flex-direction: column; min-height: 0; }
  > .el-dialog__footer {
    padding: 12px var(--editorGutter);
    border-top: 1px solid var(--el-border-color-lighter);
  }

  .dialogContent {
    padding: 18px var(--editorGutter);
    overflow-y: auto;
    overscroll-behavior: contain;

    .el-form-item { margin-bottom: 18px; min-width: 0; }
    .el-form-item__label { height: auto; margin-bottom: 6px; line-height: 1.5; }
    .modelIdentity {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) minmax(112px, .6fr);
      column-gap: 16px;
      .el-select { width: 100%; }
    }

    .choiceGroup, .referenceModes {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 4px 16px;
      width: 100%;
      .el-checkbox, .el-radio {
        height: auto;
        min-height: 28px;
        margin: 0;
        white-space: normal;
      }
      .el-checkbox__label, .el-radio__label { line-height: 1.4; overflow-wrap: anywhere; }
    }
    .videoModes {
      width: 100%;
      .referenceModes {
        box-sizing: border-box;
        margin-top: 8px;
        padding: 8px 12px;
        border-radius: var(--el-border-radius-base);
        background: var(--el-fill-color-light);
        .referenceItem {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          .el-input-number { flex: 0 0 64px; width: 64px; }
        }
      }
    }

    .mappingEditor {
      border-top: 1px solid var(--el-border-color-lighter);
      padding-top: 16px;
      .mappingHeading, .groupHeading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .mappingHeading {
        margin-bottom: 10px;
        h3 { margin: 0; color: var(--el-text-color-primary); font-size: 14px; font-weight: 600; }
        .el-button { flex-shrink: 0; min-height: 28px; }
      }
      .mappingGroup {
        padding: 12px 14px;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: var(--el-border-radius-base);
        background: var(--el-fill-color-lighter);
        + .mappingGroup { margin-top: 10px; }
        .groupHeading {
          margin-bottom: 6px;
          font-weight: 600;
          .el-button {
            width: 28px;
            height: 28px;
            padding: 0;
            &:hover, &:focus-visible { color: var(--el-color-danger); }
          }
        }
        .mappingFields {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px 16px;
          .durationField { grid-column: 1 / -1; }
          .mappingField {
            min-width: 0;
            label { display: block; margin-bottom: 4px; font-size: 13px; line-height: 1.5; }
            .el-input-tag { width: 100%; }
            .ratioHint { margin: 4px 0 0; color: var(--el-text-color-regular); font-size: 12px; line-height: 1.5; }
          }
        }
      }
    }

    .modelOptions {
      margin-top: 14px;
      summary { width: fit-content; padding-block: 4px; cursor: pointer; }
      summary:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
      &[open] summary { margin-bottom: 6px; }
      textarea { font-family: ui-monospace, monospace; }
    }
  }
  .formError { flex-shrink: 0; width: auto; margin: 0 var(--editorGutter) 12px; }

  @media (max-width: 640px) {
    --editorGutter: 16px;
    .dialogContent {
      .modelIdentity { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .videoModes .referenceModes {
        grid-template-columns: 1fr;
        .referenceItem .el-input-number { flex-basis: 76px; }
      }
    }
  }
  @media (max-width: 480px) {
    .dialogContent {
      .modelIdentity, .mappingEditor .mappingGroup .mappingFields { grid-template-columns: minmax(0, 1fr); }
      .choiceGroup { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  }
}
</style>
