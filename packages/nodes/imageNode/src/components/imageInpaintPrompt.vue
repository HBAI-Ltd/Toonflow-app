<template>
  <teleport :to="target ?? 'body'" :disabled="!target">
    <el-card v-show="!!target" class="inpaintPrompt" shadow="never" :bodyStyle="{ padding: '14px 16px 12px' }">
      <promptInput v-model="promptModel" v-model:text="prompt" :references="[]" expandable />
      <div class="promptFooter">
        <el-button type="primary" :icon="IconCheck" :loading="creating" :disabled="disabled || !prompt.trim()" @click="confirmInpaint">确认</el-button>
      </div>
    </el-card>
  </teleport>
</template>

<script setup lang="ts">
import { onScopeDispose, ref } from "vue";
import { ElButton, ElCard } from "element-plus";
import { IconCheck } from "@tabler/icons-vue";
import { showNodeError } from "@toonflow/node-shared/showNodeError";
import promptInput from "@toonflow/node-shared/promptInput";
import type { InpaintDraftInput } from "../imageInpaint";

const props = defineProps<{
  createDraft: (input: InpaintDraftInput, signal: AbortSignal) => Promise<void>;
  disabled?: boolean;
  target?: HTMLElement;
}>();
const prompt = ref("");
const promptModel = ref<NonNullable<InstanceType<typeof promptInput>["$props"]["modelValue"]>>([]);
const creating = ref(false);
let creationController: AbortController | undefined;
let disposed = false;

onScopeDispose(() => {
  disposed = true;
  creationController?.abort();
});
defineExpose({ creating });

async function confirmInpaint() {
  if (disposed || creating.value || props.disabled || !prompt.value.trim()) return;
  const controller = creationController = new AbortController();
  creating.value = true;
  try {
    await props.createDraft({ prompt: prompt.value.trim() }, controller.signal);
  } catch (error) {
    if (!controller.signal.aborted && !disposed) showNodeError(error, "重绘节点创建失败");
  } finally {
    creating.value = false;
    creationController = undefined;
  }
}
</script>

<style scoped lang="scss">
.inpaintPrompt {
  .promptFooter {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
  }
}
</style>
