<template>
  <el-dialog :modelValue="true" :title="title" width="min(560px, 94vw)" alignCenter appendToBody destroyOnClose
    :closeOnClickModal="false" :closeOnPressEscape="!saving" :showClose="!saving" @close="emit('close')">
    <div class="automationContent">
      <el-alert v-if="error" :title="error" type="error" :closable="false" showIcon />
      <template v-if="view === 'list'">
        <div v-if="!tasks.length && !error" class="muted" role="status">{{ loading ? translate("加载中…") : translate("暂无自动化任务") }}</div>
        <article v-for="task in orderedTasks" :key="task.id" class="taskRow">
          <div class="taskCopy">
            <button class="taskTitle" dir="auto" type="button" :disabled="saving" @click="handleAction(task, task.cancelledAt ? 'runs' : 'edit')">{{ task.name }}</button>
            <div class="taskMeta">
              <span>{{ kindLabels[task.schedule.kind] }}</span>
              <span v-if="task.cancelledAt">{{ translate("已取消") }}</span>
              <span v-else-if="task.queued">{{ translate("等待执行") }}</span>
              <span v-else-if="task.runs[0]?.status === 'running'">{{ runLabels.running }}</span>
              <span v-else-if="!task.enabled && !ended(task)">{{ translate("已暂停") }}</span>
              <span v-if="task.nextRunAt">{{ translate("下次运行") }} {{ formatTime(task.nextRunAt) }}</span>
            </div>
            <div v-if="task.runs[0]" class="runLinks">
              <el-button link size="small" @click="handleAction(task, 'runs')">
                <span v-if="unreadRuns.has(task.id)" class="unreadDot" role="img" aria-label="有新的运行结果" title="有新的运行结果" />
                {{ translate("运行记录") }} · {{ runLabels[task.runs[0].status] }}
              </el-button>
              <el-button v-if="task.runs[0].sessionFile && task.runs[0].status === 'completed'" link size="small" type="primary"
                @click="emit('result', task.runs[0].sessionFile, task.runs[0].id)">查看结果</el-button>
            </div>
          </div>
          <el-button v-if="!task.cancelledAt && (task.queued || task.runs[0]?.status === 'running' || !ended(task))"
            class="cancelTask" size="small" :disabled="saving" :aria-label="translate('取消任务') + ' · ' + task.name" @click="handleAction(task, 'cancel')">取消任务</el-button>
          <el-dropdown trigger="click" :disabled="saving" @command="handleAction(task, $event)">
            <el-button text circle :aria-label="translate('更多操作') + ' · ' + task.name" title="更多操作"><icon-dots :size="18" /></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="runs">运行记录</el-dropdown-item>
                <el-dropdown-item v-if="!task.cancelledAt" command="run" :disabled="task.queued || task.runs[0]?.status === 'running'">立即运行</el-dropdown-item>
                <el-dropdown-item v-if="!task.cancelledAt" command="edit">编辑</el-dropdown-item>
                <el-dropdown-item v-if="!task.cancelledAt && !ended(task)" :command="task.enabled ? 'pause' : 'resume'">{{ task.enabled ? translate("暂停") : translate("继续") }}</el-dropdown-item>
                <el-dropdown-item command="delete" :disabled="task.runs[0]?.status === 'running'" divided>删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </article>
      </template>
      <el-form v-else-if="view === 'edit'" :id="formId" labelPosition="top" :disabled="saving" @submit.prevent="saveTask">
        <el-form-item label="任务名称" required><el-input v-model="name" maxlength="120" required /></el-form-item>
        <el-form-item label="任务内容" required><el-input v-model="prompt" type="textarea" :rows="3" maxlength="8000" required /></el-form-item>
        <div class="formGrid">
          <el-form-item label="执行频率">
            <el-select v-model="kind"><el-option v-for="(label, value) in kindLabels" :key="value" :value="value" :label="label" /></el-select>
          </el-form-item>
          <el-form-item v-if="kind === 'interval'" label="间隔（分钟）">
            <el-input-number v-model="minutes" :min="5" :max="35791394" :step="1" controlsPosition="right" />
          </el-form-item>
          <el-form-item v-else :label="kind === 'once' ? translate('执行时间') + ' · ' + localZone : translate('执行时间')">
            <el-input v-if="kind === 'once'" v-model="at" type="datetime-local" required :aria-label="translate('执行时间') + ' · ' + localZone" />
            <el-input v-else v-model="time" type="time" required />
          </el-form-item>
        </div>
        <el-form-item v-if="kind === 'weekly'" label="星期">
          <el-checkbox-group v-model="weekdays" class="weekdays">
            <el-checkbox v-for="day in 7" :key="day" :value="day">{{ weekdayLabels[day - 1] }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item v-if="kind === 'daily' || kind === 'weekly'" label="时区"><el-input v-model="timeZone" required /></el-form-item>
        <div class="formGrid">
          <el-form-item label="运行位置">
            <el-select v-model="target">
              <el-option label="每次新建对话" value="new" /><el-option label="当前对话" value="current" />
              <el-option v-if="original?.sessionFile && original.sessionFile !== sourceFile" label="原对话" value="original" />
            </el-select>
          </el-form-item>
          <el-form-item label="模型"><modelPopover v-model="model" v-model:reasoningEffort="thinking" :disabled="saving" /></el-form-item>
        </div>
      </el-form>
      <template v-else-if="runTask">
        <strong class="runTitle">{{ runTask.name }}</strong>
        <div v-if="!runTask.runs.length" class="muted">暂无运行记录</div>
        <article v-for="run in runTask.runs" :key="run.id" class="runRow">
          <div class="taskCopy">
            <div>{{ formatTime(run.startedAt) }}</div>
            <div class="taskMeta">{{ runLabels[run.status] }}</div>
            <p v-if="run.error" class="runError">{{ translate(run.error) }}</p>
          </div>
          <el-button v-if="run.sessionFile && run.status === 'completed'" text @click="emit('result', run.sessionFile, run.id)">查看结果</el-button>
        </article>
      </template>
    </div>
    <template #footer>
      <div class="dialogActions">
        <template v-if="view === 'list'">
          <el-button :loading="loading" :disabled="saving" @click="refresh">刷新</el-button>
          <el-button ref="createButton" type="primary" :disabled="saving" @click="editTask()">新建任务</el-button>
        </template>
        <template v-else>
          <el-button :disabled="saving" @click="back">{{ view === "edit" ? translate("取消") : translate("返回") }}</el-button>
          <el-button v-if="view === 'edit'" type="primary" nativeType="submit" :form="formId" :loading="saving">保存</el-button>
          <el-button v-else-if="runTask && retryableRun" type="primary" :disabled="runTask.queued || saving" @click="retryRun(runTask, retryableRun.id)">
            {{ runTask.queued ? translate("等待执行") : translate("重试") }}
          </el-button>
        </template>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useId, watch } from "vue";
import { ElMessageBox, type ButtonInstance } from "element-plus";
import { IconDots } from "@tabler/icons-vue";
import { locale, translate } from "@toonflow/i18n/vue";
import { useNodeModelSelection } from "@toonflow/nodes-scaffold/nodeAi";
import type { AgentAutomation, AgentAutomationCommand, AgentSchedule } from "@toonflow/server/agent/types";
import { modelChoices } from "@/stores/settings";
import modelPopover from "@/components/modelPopover.vue";
import type { AgentAutomationEntry } from "./types";

const props = defineProps<{ entry: AgentAutomationEntry; directory: string; tasks: AgentAutomation[]; sourceFile?: string; unreadRuns: ReadonlyMap<string, string>; load: () => Promise<void>;
  update: (directory: string, command: AgentAutomationCommand) => Promise<void>; ensureSession: () => Promise<string> }>();
const emit = defineEmits<{ close: []; saved: []; read: [runId: string]; result: [file: string, runId: string] }>();
const formId = useId();
const createButton = ref<ButtonInstance>();
const directory = props.directory;
const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const view = ref<"list" | "edit" | "runs">("list");
const original = ref<AgentAutomation>();
const runTaskId = ref("");
const runTask = computed(() => props.tasks.find(task => task.id === runTaskId.value));
watch([view, runTaskId, () => props.unreadRuns], () => {
  const runId = props.unreadRuns.get(runTaskId.value);
  if (view.value === "runs" && runId) emit("read", runId);
}, { flush: "post" });
const retryableRun = computed(() => {
  const task = runTask.value;
  const latest = task?.runs[0];
  return !task?.cancelledAt && (latest?.status === "failed" || latest?.status === "interrupted") ? latest : undefined;
});
const saving = ref(false);
const loading = ref(false);
const error = ref("");
const name = ref("");
const prompt = ref("");
const kind = ref<AgentSchedule["kind"]>("daily");
const model = ref("");
const thinking = ref("");
const modelChoice = useNodeModelSelection(modelChoices, model);
const target = ref<"current" | "new" | "original">("new");
const at = ref("");
const minutes = ref<number | undefined>(5);
const time = ref("09:00");
const timeZone = ref(localZone);
const weekdays = ref<number[]>([]);
const kindLabels = computed(() => ({ once: translate("仅一次"), interval: translate("固定间隔"), daily: translate("每天"), weekly: translate("每周") }));
const runLabels = computed(() => ({ running: translate("运行中"), completed: translate("已完成"), failed: translate("失败"), interrupted: translate("已中断"), cancelled: translate("已取消") }));
const orderedTasks = computed(() => [...props.tasks].sort((a, b) =>
  orderTime(a) - orderTime(b) || (b.cancelledAt ?? b.runs[0]?.startedAt ?? b.createdAt) - (a.cancelledAt ?? a.runs[0]?.startedAt ?? a.createdAt)));
const title = computed(() => view.value === "list" ? translate("自动化任务") : view.value === "runs" ? translate("运行记录") : original.value ? translate("编辑任务") : translate("新建任务"));
const weekdayLabels = computed(() => Array.from({ length: 7 }, (_, index) =>
  new Date(Date.UTC(2024, 0, index + 1)).toLocaleDateString(locale.value, { weekday: "short", timeZone: "UTC" })));

function formatTime(value: number) {
  return new Date(value).toLocaleString(locale.value, { dateStyle: "short", timeStyle: "short" });
}
function localDateTime(value: number) {
  const date = new Date(value);
  return new Date(value - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function ended(task: AgentAutomation) {
  return !task.enabled && task.schedule.kind === "once" && task.schedule.at <= Date.now() && !!task.runs.length;
}
function orderTime(task: AgentAutomation) {
  if (task.runs[0]?.status === "running") return 0;
  if (task.queued) return 1;
  if (props.unreadRuns.has(task.id)) return 2;
  return task.nextRunAt ?? Number.MAX_SAFE_INTEGER;
}
function editTask(task?: AgentAutomation) {
  original.value = task;
  name.value = task?.name ?? "";
  prompt.value = task?.prompt ?? props.entry.prompt ?? "";
  model.value = task ? JSON.stringify([task.providerId, task.modelId]) : props.entry.model;
  thinking.value = task?.thinkingLevel ?? (task ? "" : props.entry.thinking);
  target.value = task ? (task.sessionFile ? task.sessionFile === props.sourceFile ? "current" : "original" : "new") : props.entry.timer ? "current" : "new";
  const schedule = task?.schedule;
  kind.value = schedule?.kind ?? (props.entry.timer ? "once" : "daily");
  minutes.value = schedule?.kind === "interval" ? schedule.everySeconds / 60 : 5;
  at.value = localDateTime(schedule?.kind === "once" ? schedule.at : Date.now() + 30 * 60000);
  time.value = schedule && "time" in schedule ? schedule.time : "09:00";
  timeZone.value = schedule && "timeZone" in schedule ? schedule.timeZone : localZone;
  weekdays.value = schedule?.kind === "weekly" ? [...schedule.weekdays] : [new Date().getDay() || 7];
  error.value = "";
  view.value = "edit";
}
async function back() {
  if (view.value === "edit" && (props.entry.timer || props.entry.prompt)) return emit("close");
  view.value = "list";
  error.value = "";
  await nextTick();
  createButton.value?.ref?.focus();
}
async function refresh() {
  loading.value = true;
  error.value = "";
  try { await props.load(); }
  catch (cause) { error.value = cause instanceof Error ? cause.message : translate("请求失败"); }
  finally { loading.value = false; }
}
async function mutate(action: () => Promise<void>) {
  if (saving.value) return;
  saving.value = true;
  error.value = "";
  try { await action(); return true; }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : translate("请求失败");
    if ((cause as { status?: number })?.status === 409) await props.load().catch(() => {});
  } finally { saving.value = false; }
}
async function handleAction(task: AgentAutomation, action: "edit" | "runs" | "run" | "delete" | "pause" | "resume" | "cancel") {
  if (action === "edit") return editTask(task);
  if (action === "runs") { runTaskId.value = task.id; view.value = "runs"; error.value = ""; return; }
  if (action === "delete") {
    try { await ElMessageBox.confirm(translate("确定删除此任务？"), task.name, { confirmButtonText: translate("删除"), cancelButtonText: translate("取消"), type: "warning" }); }
    catch { return; }
  }
  await mutate(() => props.update(directory, { action, id: task.id, revision: task.revision }));
}
function retryRun(task: AgentAutomation, runId: string) {
  return mutate(() => props.update(directory, { action: "run", id: task.id, revision: task.revision, retryRunId: runId }));
}
async function saveTask() {
  const saved = await mutate(async () => {
    if (!name.value.trim()) throw new Error(translate("请输入名称"));
    if (!prompt.value.trim()) throw new Error(translate("请输入提示词"));
    const selected = modelChoice.value;
    if (!selected) throw new Error(translate("请先选择模型"));
    let schedule: AgentSchedule;
    if (kind.value === "once") {
      const previous = original.value?.schedule;
      const instant = previous?.kind === "once" && at.value === localDateTime(previous.at) ? previous.at : new Date(at.value).getTime();
      if (!Number.isFinite(instant) || instant <= Date.now() || localDateTime(instant) !== at.value) throw new Error(translate("请选择未来的执行时间"));
      schedule = { kind: "once", at: instant };
    } else if (kind.value === "interval") {
      const seconds = Math.round((minutes.value ?? 0) * 60);
      if (!Number.isInteger(seconds) || seconds < 300) throw new Error(translate("间隔不能少于 5 分钟"));
      schedule = { kind: "interval", everySeconds: seconds };
    } else if (kind.value === "weekly") {
      if (!weekdays.value.length) throw new Error(translate("请选择星期"));
      schedule = { kind: "weekly", time: time.value, timeZone: timeZone.value.trim(), weekdays: [...weekdays.value].sort((a, b) => a - b) };
    } else schedule = { kind: "daily", time: time.value, timeZone: timeZone.value.trim() };
    if ("timeZone" in schedule) {
      try { Intl.DateTimeFormat("en", { timeZone: schedule.timeZone }); }
      catch { throw new Error(translate("无效的时区")); }
    }
    const sessionFile = target.value === "current" ? await props.ensureSession() : target.value === "original" ? original.value?.sessionFile : undefined;
    await props.update(directory, { action: "save", id: original.value?.id, revision: original.value?.revision, task: { name: name.value.trim(),
      prompt: prompt.value.trim(), schedule, sessionFile, providerId: selected.providerId, modelId: selected.modelId,
      thinkingLevel: selected.reasoningLevels?.find(level => level === thinking.value) } });
  });
  if (saved) { emit("saved"); await back(); }
}
onMounted(() => {
  if (props.entry.runTaskId) { runTaskId.value = props.entry.runTaskId; view.value = "runs"; }
  else if (props.entry.timer || props.entry.prompt) editTask();
  void refresh();
});
</script>

<style scoped lang="scss">
.automationContent {
  container-type: inline-size;
  max-height: min(62dvh, 620px);
  overflow-y: auto;
  overflow-wrap: anywhere;
  .el-alert { margin-block-end: 12px; }
  .taskRow, .runRow {
    display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-block: 10px;
    & + .taskRow, & + .runRow { border-block-start: 1px solid var(--el-border-color-lighter); }
    .taskCopy {
      flex: 1; min-width: 0;
      .taskTitle { border: 0; padding: 0; background: none; color: var(--el-text-color-primary); font: inherit; font-weight: 600; text-align: start; cursor: pointer; }
      .taskTitle:hover { color: var(--el-color-primary); }
      .taskMeta { display: flex; flex-wrap: wrap; gap: 2px 8px; margin-block-start: 4px; color: var(--el-text-color-secondary); font-size: 12px; }
      .runLinks {
        display: flex; flex-wrap: wrap; gap: 2px 8px; margin-block-start: 4px;
        .el-button { margin: 0; }
        .unreadDot { width: 7px; height: 7px; margin-inline-end: 5px; border-radius: 50%; background: var(--el-color-primary); }
      }
      .runError { margin-block: 4px 0; color: var(--el-color-danger); white-space: pre-wrap; }
    }
    .cancelTask { flex-shrink: 0; }
  }
  .runTitle { display: block; margin-block-end: 8px; }
  .muted { color: var(--el-text-color-secondary); }
  .formGrid {
    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px;
    :deep(.el-input-number) { width: 100%; }
  }
  .weekdays { display: flex; flex-wrap: wrap; gap: 0 12px; :deep(.el-checkbox) { margin: 0; } }
  @container (max-width: 380px) { .formGrid { grid-template-columns: minmax(0, 1fr); } }
}
.dialogActions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 8px; .el-button { margin: 0; } }
</style>
