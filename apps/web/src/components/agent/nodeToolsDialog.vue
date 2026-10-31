<template>
  <el-dialog v-model="visible" title="节点工具控制" width="min(520px, 94vw)" alignCenter appendToBody destroyOnClose :closeOnClickModal="false" :closeOnPressEscape="!saving" :showClose="!saving">
    <div class="nodeToolsConfig">
      <p class="description">选择 Agent 可以通过画布节点生成的媒体，保存后应用于所有对话。</p>
      <el-form labelPosition="top" :disabled="saving">
        <div class="permissionList">
          <div v-for="group in groups" :key="group.enabledKey" class="permissionRow">
            <label class="permissionCopy" :for="`${controlId}-${group.enabledKey}`">
              <span class="permissionLabel">{{ group.label }}</span>
              <span class="permissionDescription">{{ group.description }}</span>
            </label>
            <el-switch :id="`${controlId}-${group.enabledKey}`" v-model="draft[group.enabledKey]" :aria-label="group.description" />
          </div>
        </div>
        <p class="scopeHint">你仍可手动生成，已开始的任务不会中断。</p>
        <details class="advancedSettings" :open="expanded" @toggle="expanded = ($event.target as HTMLDetailsElement).open">
          <summary>高级设置</summary>
          <div class="advancedContent">
            <p class="description">使用自定义节点时，把它的工具名称加入对应类别，随上方开关一起控制。</p>
            <p :id="`${controlId}-nameHint`" class="inputHint">填写 nodeTools.register 中的 name，区分大小写。按回车添加，也可直接粘贴带 node: 前缀的名称。</p>
            <el-form-item v-for="group in groups" :key="group.namesKey" :label="group.additionalLabel" :error="fieldErrors[group.namesKey]">
              <div class="toolNamesField">
                <p class="defaultTool">默认包含 <code>{{ group.name }}</code>，无需重复添加。</p>
                <el-input-tag
                  :modelValue="draft[group.namesKey]"
                  :max="100"
                  :aria-label="group.additionalLabel"
                  :aria-describedby="`${controlId}-nameHint`"
                  :aria-invalid="!!fieldErrors[group.namesKey]"
                  @update:modelValue="updateToolNames(group, $event)" />
              </div>
            </el-form-item>
            <p class="inputHint">同一工具加入多个类别时，需要这些类别全部允许才能调用。每类最多追加 100 个名称。</p>
          </div>
        </details>
      </el-form>
    </div>
    <template #footer>
      <el-alert v-if="saveError" class="saveError" :title="saveError" type="error" :closable="false" showIcon />
      <el-button :disabled="saving" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="saveConfig">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import axios from "axios";
import { ref, useId, watch } from "vue";
import { ElMessage } from "element-plus";
import { translate } from "@toonflow/i18n/vue";
import { nodeToolPermissionsSchema } from "@toonflow/tool-canvas/runtime";
import { agentNodeToolPermissions, saveSettings } from "@/stores/settings";

const visible = defineModel<boolean>({ default: false });
const controlId = useId();
const groups = [
  { enabledKey: "allowImage", namesKey: "imageToolNames", name: "generateImage", label: "图片生成", description: "允许 Agent 通过节点生成图片", get additionalLabel() { return translate("追加图片工具"); } },
  { enabledKey: "allowVideo", namesKey: "videoToolNames", name: "generateVideo", label: "视频生成", description: "允许 Agent 通过节点生成视频", get additionalLabel() { return translate("追加视频工具"); } },
  { enabledKey: "allowAudio", namesKey: "audioToolNames", name: "generateAudio", label: "音频生成", description: "允许 Agent 通过节点生成音频", get additionalLabel() { return translate("追加音频工具"); } },
] as const;
const draft = ref(nodeToolPermissionsSchema.parse({}));
const expanded = ref(false);
const saving = ref(false);
const saveError = ref("");
const fieldErrors = ref<Record<string, string>>({});

watch(visible, value => {
  if (!value) return;
  draft.value = nodeToolPermissionsSchema.parse(agentNodeToolPermissions.value);
  expanded.value = false;
  saveError.value = "";
  fieldErrors.value = {};
});

function fieldErrorMessage(message?: string) {
  if (message === "名称需以小写字母开头，只能包含字母和数字，最多 64 个字符") return translate("名称需以小写字母开头，只能包含字母和数字，最多 64 个字符");
  if (message === "每类最多追加 100 个工具名称") return translate("每类最多追加 100 个工具名称");
  return message ?? translate("检查工具名称后重试");
}

function updateToolNames(group: typeof groups[number], values: string[] = []) {
  const names = [...new Set(values.map(value => value.trim().replace(/^node:(?=.)/, "")))].filter(name => name !== group.name);
  draft.value[group.namesKey] = names;
  const result = nodeToolPermissionsSchema.shape[group.namesKey].safeParse(names);
  fieldErrors.value[group.namesKey] = result.success ? "" : fieldErrorMessage(result.error.issues[0]?.message);
  saveError.value = "";
}

async function saveConfig() {
  if (saving.value) return;
  saveError.value = "";
  fieldErrors.value = {};
  const result = nodeToolPermissionsSchema.safeParse(draft.value);
  if (!result.success) {
    for (const issue of result.error.issues) fieldErrors.value[String(issue.path[0])] = fieldErrorMessage(issue.message);
    expanded.value = true;
    return;
  }
  const config = result.data;
  for (const group of groups) config[group.namesKey] = [...new Set(config[group.namesKey])].filter(name => name !== group.name);
  saving.value = true;
  try {
    await saveSettings(() => ({ agentNodeTools: config }));
    visible.value = false;
    ElMessage.success("节点工具权限已保存，对所有对话生效");
  } catch (error) {
    saveError.value = axios.isAxiosError(error)
      ? error.response?.data?.message || "保存失败，请重试；当前填写的内容已保留"
      : "保存失败，修改内容已保留，请重试";
  } finally { saving.value = false; }
}
</script>

<style scoped lang="scss">
.nodeToolsConfig {
  max-height: min(640px, calc(100dvh - 180px));
  padding-right: 4px;
  overflow-y: auto;
  overscroll-behavior: contain;

  .description {
    margin: 0 0 20px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.6;
    overflow-wrap: anywhere;
  }

  .permissionList {
    display: flex;
    flex-direction: column;
    gap: 20px;

    .permissionRow {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;

      .permissionCopy {
        display: flex;
        flex: 1;
        min-width: 0;
        flex-direction: column;
        gap: 6px;
        cursor: pointer;
        overflow-wrap: anywhere;

        .permissionLabel { color: var(--el-text-color-primary); font-size: 14px; font-weight: 600; }
        .permissionDescription { color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.6; }
      }

      :deep(.el-switch) { flex-shrink: 0; }
    }
  }

  .scopeHint {
    margin: 20px 0 12px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.6;
  }

  .advancedSettings {
    summary {
      width: fit-content;
      padding: 4px 0;
      color: var(--el-text-color-secondary);
      font-size: 12px;
      line-height: 20px;
      cursor: pointer;

      &:hover { color: var(--el-text-color-regular); }
      &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
    }

    .advancedContent {
      padding-top: 12px;

      :deep(.el-form-item__error) { position: static; padding-top: 6px; }

      .inputHint {
        margin: 0 0 16px;
        color: var(--el-text-color-secondary);
        font-size: 12px;
        line-height: 1.6;
        overflow-wrap: anywhere;

        &:last-child { margin-bottom: 0; }
      }

      .toolNamesField {
        width: 100%;
        min-width: 0;

        .defaultTool {
          margin: 0 0 8px;
          color: var(--el-text-color-secondary);
          font-size: 12px;
          line-height: 1.6;
          overflow-wrap: anywhere;

          code { color: var(--el-text-color-regular); }
        }

        :deep(.el-input-tag) { width: 100%; }
      }
    }
  }
}

.saveError { margin-bottom: 12px; text-align: left; }
</style>
