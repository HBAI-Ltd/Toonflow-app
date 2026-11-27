<template>
  <section class="goalBar" aria-label="目标">
    <div class="goalHeader">
      <icon-target-arrow :size="15" aria-hidden="true" />
      <strong>目标</strong>
      <span class="goalStatus">{{ status }}</span>
      <span class="roundCount" :title="translate('已开始轮数 / 轮数上限')">{{ goal.rounds }} / {{ goal.maxRounds }}</span>
      <div class="goalActions">
        <el-button text circle :disabled="disabled || !!editing" title="编辑目标" aria-label="编辑目标" @click="startEdit"><icon-pencil :size="14" /></el-button>
        <el-button v-if="goal.running" text circle :disabled="disabled" title="暂停目标" aria-label="暂停目标" @click="act('pause')"><icon-player-pause :size="14" /></el-button>
        <el-button v-else text circle :disabled="disabled || busy || goal.rounds >= goal.maxRounds" title="恢复目标" aria-label="恢复目标" @click="act('resume')"><icon-player-play :size="14" /></el-button>
        <el-button text circle :disabled="disabled" title="清除目标" aria-label="清除目标" @click="act('clear')"><icon-x :size="14" /></el-button>
      </div>
    </div>
    <form v-if="editing" class="goalEditor" @submit.prevent="save">
      <el-input v-model="objective" type="textarea" :autosize="{ minRows: 1, maxRows: 4 }" :maxlength="8000" aria-label="目标内容" @keydown.esc="editing = undefined" />
      <div><el-button text size="small" @click="editing = undefined">取消</el-button><el-button size="small" nativeType="submit" :disabled="disabled || !objective.trim()">保存</el-button></div>
    </form>
    <p v-else class="objective">{{ goal.objective }}</p>
    <p v-if="goal.reason" class="goalReason">{{ goal.reason === '目标已达自动执行轮数上限' || goal.reason === '模型回复因长度限制被截断，未能完整生成回答。' ? translate(goal.reason) : goal.reason }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { translate } from "@toonflow/i18n/vue";
import { IconPencil, IconPlayerPause, IconPlayerPlay, IconTargetArrow, IconX } from "@tabler/icons-vue";
import type { AgentCommand, AgentGoal } from "@toonflow/server/agent/types";

const props = defineProps<{ goal: AgentGoal; disabled: boolean; busy: boolean }>();
const emit = defineEmits<{ command: [command: AgentCommand] }>();
const editing = ref<Pick<AgentGoal, "id" | "revision" | "objective">>();
const objective = ref("");
const status = computed(() => props.goal.running ? translate("进行中") : props.goal.status === "blocked" ? translate("受阻")
  : props.goal.status === "paused" ? translate("已暂停") : translate("等待恢复"));
watch(() => props.goal, (next, previous) => {
  if (!editing.value) return;
  if (next.id !== previous.id || (next.objective !== previous.objective && next.objective === objective.value.trim())) editing.value = undefined;
  else if (next.objective === editing.value.objective) editing.value.revision = next.revision;
});

function startEdit() {
  editing.value = { id: props.goal.id, revision: props.goal.revision, objective: props.goal.objective };
  objective.value = props.goal.objective;
}
function act(action: "pause" | "resume" | "clear") {
  emit("command", { action, id: props.goal.id, revision: props.goal.revision });
}
function save() {
  if (!editing.value || !objective.value.trim()) return;
  if (props.goal.objective === objective.value.trim()) { editing.value = undefined; return; }
  emit("command", { action: "edit", ...editing.value, objective: objective.value.trim() });
}
</script>

<style scoped lang="scss">
.goalBar {
  flex-shrink: 0;
  margin: 0 20px 6px;
  padding: 7px 10px 9px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
  font-size: 12px;
  .goalHeader, .goalActions { display: flex; align-items: center; gap: 6px; }
  .goalHeader {
    color: var(--el-text-color-regular);
    .goalStatus, .roundCount { color: var(--el-text-color-secondary); font-size: 11px; }
    .roundCount { margin-inline-start: auto; font-variant-numeric: tabular-nums; }
    .goalActions {
      gap: 1px;
      .el-button { width: 24px; height: 24px; margin: 0; }
    }
  }
  .objective, .goalReason { margin: 3px 0 0; max-height: 5lh; overflow: auto; overflow-wrap: anywhere; white-space: pre-wrap; line-height: 1.5; }
  .goalReason { color: var(--el-color-warning); }
  .goalEditor { margin-top: 4px; > div:last-child { margin-top: 4px; text-align: end; } }
}
</style>
