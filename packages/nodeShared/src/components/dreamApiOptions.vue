<template>
  <div v-if="model?.generation && (model.generation.inputs?.length || model.generation.parameters?.length)" class="dreamApiOptions">
    <div v-for="role in model.generation.inputs ?? []" :key="role.id" class="inputRole">
      <label class="fieldLabel">{{ role.label }}<span v-if="role.required">（必填）</span></label>
      <span v-if="role.fallback" class="fieldHint">未单独上传时使用{{ role.fallbackIndex === undefined ? "节点连线素材" : `节点连线第 ${role.fallbackIndex + 1} 个素材` }}</span>
      <input
        class="fileInput"
        type="file"
        :accept="role.accept?.join(',') || `${role.mediaType}/*`"
        :multiple="role.maxItems !== 1"
        :disabled="disabled"
        :aria-label="role.label"
        @change="selectFiles($event, role.id)" />
      <div v-if="inputs[role.id]?.length" class="fileList">
        <div v-for="(file, index) in inputs[role.id]" :key="`${file.path}-${index}`" class="fileItem">
          <span>{{ file.path.split(/[\\/]/).at(-1) }}</span>
          <el-button text size="small" :disabled="disabled" :aria-label="`移除${role.label}素材`" @click="removeFile(role.id, index)">移除</el-button>
        </div>
      </div>
    </div>
    <div v-for="item in model.generation.parameters ?? []" :key="item.id" class="parameterField">
      <label class="fieldLabel" :for="`dreamApi-${item.id}`">{{ item.label }}<span v-if="item.required">（必填）</span></label>
      <el-select
        v-if="item.options?.length"
        :id="`dreamApi-${item.id}`"
        :modelValue="parameterValue(item) as string | number | undefined"
        :disabled="disabled"
        :allowCreate="item.allowCustom"
        clearable
        :filterable="item.allowCustom"
        @update:modelValue="value => updateParameter(item.id, value)">
        <el-option v-for="option in item.options" :key="String(option)" :label="String(option)" :value="option" />
      </el-select>
      <el-input-number
        v-else-if="item.type === 'number'"
        :id="`dreamApi-${item.id}`"
        :modelValue="numberValue(item)"
        :min="item.min"
        :max="item.max"
        :step="item.step"
        :disabled="disabled"
        @update:modelValue="value => updateParameter(item.id, value ?? undefined)" />
      <el-switch
        v-else-if="item.type === 'boolean'"
        :id="`dreamApi-${item.id}`"
        :modelValue="Boolean(parameterValue(item))"
        :disabled="disabled"
        @update:modelValue="value => updateParameter(item.id, value)" />
      <el-input
        v-else
        :id="`dreamApi-${item.id}`"
        :modelValue="stringValue(item)"
        :disabled="disabled"
        clearable
        @update:modelValue="value => updateParameter(item.id, value || undefined)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElButton, ElInput, ElInputNumber, ElOption, ElSelect, ElSwitch } from "element-plus";
import type { NodeMediaModel } from "@toonflow/nodes-scaffold/runtime";

type MediaPath = { path: string; mimeType: string };
type MediaParameter = NonNullable<NonNullable<NodeMediaModel["generation"]>["parameters"]>[number];

const props = defineProps<{ model?: NodeMediaModel; disabled?: boolean }>();
const inputs = defineModel<Record<string, MediaPath[]>>("inputs", { required: true });
const values = defineModel<Record<string, unknown>>("values", { required: true });
const emit = defineEmits<{ upload: [roleId: string, files: File[]] }>();

function selectFiles(event: Event, roleId: string) {
  const input = event.currentTarget as HTMLInputElement;
  const files = [...(input.files ?? [])];
  input.value = "";
  if (files.length) emit("upload", roleId, files);
}

function removeFile(roleId: string, index: number) {
  const files = [...(inputs.value[roleId] ?? [])];
  files.splice(index, 1);
  inputs.value = { ...inputs.value, [roleId]: files };
}

function parameterValue(item: MediaParameter) {
  return values.value[item.id] ?? item.defaultValue;
}

function numberValue(item: MediaParameter) {
  const value = parameterValue(item);
  return typeof value === "number" ? value : undefined;
}

function stringValue(item: MediaParameter) {
  const value = parameterValue(item);
  return typeof value === "string" ? value : "";
}

function updateParameter(id: string, value: unknown) {
  const updated = { ...values.value };
  if (value === undefined || value === "") delete updated[id];
  else updated[id] = value;
  values.value = updated;
}
</script>

<style scoped lang="scss">
.dreamApiOptions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 14px;
  padding: 10px 0;

  .inputRole,
  .parameterField {
    display: grid;
    min-width: 0;
    gap: 5px;
  }

  .fieldLabel {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .fieldHint {
    color: var(--el-text-color-placeholder);
    font-size: 11px;
  }

  .fileInput {
    width: 100%;
    min-width: 0;
    color: var(--el-text-color-regular);
    font-size: 12px;
  }

  .fileList {
    display: grid;
    gap: 2px;
  }

  .fileItem {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    color: var(--el-text-color-regular);
    font-size: 12px;

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
