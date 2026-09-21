<template>
  <section class="subAgentMessage" aria-label="子 Agent">
    <div class="agentHeader">
      <icon-users-group :size="14" aria-hidden="true" />
      <span class="headerTitle">子 Agent</span>
      <span class="agentCount" role="status">{{ tasks.length ? `${completedCount} / ${tasks.length} 已完成` : "等待任务信息" }}</span>
    </div>
    <ul v-if="tasks.length" class="taskList">
      <li v-for="(task, index) in tasks" :key="index" class="taskItem" :data-status="task.status">
        <button class="taskToggle" type="button" :aria-expanded="expanded.has(index)" :aria-controls="`${id}-${index}`" @click="toggleTask(index)">
          <icon-chevron-down class="expandIcon" :class="{ expanded: expanded.has(index) }" :size="16" aria-hidden="true" />
          <icon-sparkles-2 class="agentIcon" :size="14" aria-hidden="true" />
          <span class="taskName" :title="task.name">{{ task.name }}</span>
          <span class="taskStatus">
            <component :is="statusInfo[task.status].icon" :size="12" :class="{ runningIcon: task.status === 'running' }" aria-hidden="true" />
            {{ statusInfo[task.status].label }}
          </span>
        </button>
        <p v-if="task.team" class="taskTeam" :title="task.team">团队 · {{ task.team }}</p>
        <p v-if="!expanded.has(index) && (task.result || task.task)" class="taskPreview">{{ task.result || task.task }}</p>
        <div v-if="expanded.has(index)" :id="`${id}-${index}`" class="taskDetails">
          <div v-if="task.task" class="taskSection">
            <span class="sectionLabel">任务</span>
            <p class="taskPrompt">{{ task.task }}</p>
          </div>
          <div v-if="task.tools" class="taskTools">
            <span class="sectionLabel">宿主工具</span>
            <span>{{ task.tools.length ? task.tools.join("、") : "不继承" }}</span>
          </div>
          <div v-if="task.result" class="taskSection">
            <div class="resultHeader">
              <span class="sectionLabel">
                {{ ["running", "pending"].includes(task.status) ? "最新进度" : task.status === "unknown" ? "最后进度" : "结果" }}
              </span>
              <el-button class="copyButton" text circle size="small" :aria-label="`复制${task.name}的结果`" @click="emit('copy', task.result)">
                <icon-copy :size="14" />
              </el-button>
            </div>
            <p v-if="['running', 'pending', 'unknown'].includes(task.status)" class="taskPrompt" role="status">{{ task.result }}</p>
            <messageMarkdown v-else class="taskResult" :content="task.result" :codeOptions="codeOptions" />
          </div>
          <p v-if="task.status === 'unknown'" class="statusHint">
            {{ tool.status === "interrupted" ? "主对话已中断，尚未确认此子任务的最终状态。" : "未收到此子任务的最终状态。" }}
          </p>
          <dl v-if="task.taskId || task.contextId" class="remoteInfo">
            <template v-if="task.taskId">
              <dt>任务 ID</dt>
              <dd>{{ task.taskId }}</dd>
            </template>
            <template v-if="task.contextId">
              <dt>会话 ID</dt>
              <dd>{{ task.contextId }}</dd>
            </template>
          </dl>
        </div>
      </li>
    </ul>
    <messageMarkdown v-if="fallbackResult" class="fallbackResult" :content="fallbackResult" :codeOptions="codeOptions" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useId } from "vue";
import {
  IconBan,
  IconCheck,
  IconChevronDown,
  IconClock,
  IconCopy,
  IconHelpCircle,
  IconLoader2,
  IconSparkles2,
  IconAlertCircle,
  IconUsersGroup,
  IconX,
} from "@tabler/icons-vue";
import type { AgentToolCall } from "@toonflow/server/agent/types";
import messageMarkdown from "@/components/messageMarkdown.vue";

const { tool } = defineProps<{ tool: AgentToolCall }>();
const emit = defineEmits<{ copy: [content: string] }>();
const id = useId();
const expanded = ref(new Set<number>());
const codeOptions = { maxHeight: 240, lineNumbers: false };
const statusInfo = {
  pending: { label: "准备中", icon: IconClock },
  running: { label: "执行中", icon: IconLoader2 },
  completed: { label: "已完成", icon: IconCheck },
  error: { label: "失败", icon: IconX },
  limited: { label: "达到限制", icon: IconAlertCircle },
  cancelled: { label: "已取消", icon: IconBan },
  inputRequired: { label: "等待补充", icon: IconHelpCircle },
  unknown: { label: "状态待确认", icon: IconAlertCircle },
} as const;
type TaskStatus = keyof typeof statusInfo;

function taskList(value: unknown): Record<string, unknown>[] | undefined {
  try {
    const data = typeof value === "string" ? JSON.parse(value) : value;
    if (!data || typeof data !== "object" || !Array.isArray(data.tasks)) return;
    // 保留索引：不同子任务允许同名，局部参数或无效条目也不能使后面的结果错位。
    return data.tasks.map((task: unknown) => (task && typeof task === "object" && !Array.isArray(task) ? task : {}));
  } catch {
    return;
  }
}

const argumentsList = computed(() => taskList(tool.args) ?? []);
const resultsList = computed(() => taskList(tool.result));
const fallbackResult = computed(() => (!resultsList.value && tool.result ? tool.result : ""));
const text = (value: unknown) => (typeof value === "string" ? value : "");
const tasks = computed(() =>
  Array.from({ length: Math.max(argumentsList.value.length, resultsList.value?.length ?? 0) }, (_, index) => {
    const args = argumentsList.value[index] ?? {};
    const result = resultsList.value?.[index] ?? {};
    let status: TaskStatus =
      typeof result.status === "string" && Object.hasOwn(statusInfo, result.status) ? (result.status as TaskStatus) : "pending";
    // 父工具成功只表示批次返回；中断也不能证明远端执行已取消，保留已经收到的各子任务终态。
    if (["running", "pending"].includes(status) && tool.status !== "running") status = tool.status === "error" ? "error" : "unknown";
    return {
      name: text(result.name) || text(args.name) || `子任务 ${index + 1}`,
      team: text(args.team),
      task: text(args.task),
      status,
      result: text(result.result),
      taskId: text(result.taskId) || text(args.taskId),
      contextId: text(result.contextId) || text(args.contextId),
      tools: Array.isArray(args.tools) ? args.tools.filter((name): name is string => typeof name === "string") : undefined,
    };
  })
);
const completedCount = computed(() => tasks.value.filter((task) => task.status === "completed").length);

function toggleTask(index: number) {
  if (expanded.value.has(index)) expanded.value.delete(index);
  else expanded.value.add(index);
}
</script>

<style scoped lang="scss">
.subAgentMessage {
  min-width: 0;
  margin: 2px 0;
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 20px;

  .agentHeader {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 0;
    color: var(--el-text-color-secondary);
    .agentCount {
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }
  }

  .taskList {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0;
    margin: 4px 0 0;
    list-style: none;

    .taskItem {
      --taskStatusColor: var(--el-text-color-secondary);
      min-width: 0;

      &[data-status="running"] {
        --taskStatusColor: var(--el-color-primary);
      }
      &[data-status="error"] {
        --taskStatusColor: var(--el-color-danger);
      }
      &[data-status="limited"],
      &[data-status="inputRequired"],
      &[data-status="unknown"] {
        --taskStatusColor: var(--el-color-warning);
      }

      .taskToggle {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
        padding: 3px 0;
        border: 0;
        border-radius: var(--ui-radius-small);
        background: transparent;
        color: var(--el-text-color-primary);
        font: inherit;
        text-align: left;
        cursor: pointer;
        &:hover {
          background: var(--el-fill-color-light);
        }
        &:focus-visible {
          outline: 2px solid var(--el-color-primary);
          outline-offset: -2px;
        }
        .agentIcon {
          flex-shrink: 0;
          color: var(--el-text-color-secondary);
        }
        .taskName {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .taskStatus {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          color: var(--taskStatusColor);
          font-size: 12px;
          .runningIcon {
            animation: agentSpin 1s linear infinite;
          }
        }
        .expandIcon {
          flex-shrink: 0;
          color: var(--el-text-color-secondary);
          transform: rotate(-90deg);
          transition: transform 0.15s;
          &.expanded {
            transform: rotate(0);
          }
        }
      }

      .taskTeam {
        margin: 0 0 2px 22px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .taskPreview {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        margin: 2px 0 4px 22px;
        line-height: 1.6;
        font-size: 12px;
        overflow-wrap: anywhere;
        color: var(--el-text-color-secondary);
      }
      .taskDetails {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
        padding: 4px 0 4px 22px;
        .sectionLabel {
          color: var(--el-text-color-secondary);
          font-size: 12px;
        }
        .taskPrompt {
          margin: 4px 0 0;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          line-height: 1.6;
          max-height: 240px;
          overflow: auto;
          overscroll-behavior: contain;
        }
        .taskTools {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          font-size: 12px;
          color: var(--el-text-color-secondary);
          overflow-wrap: anywhere;
        }
        .taskSection {
          min-width: 0;
          .resultHeader {
            display: flex;
            justify-content: space-between;
            align-items: center;
            .copyButton {
              width: 24px;
              height: 24px;
              margin: 0;
              padding: 0;
              color: var(--el-text-color-secondary);
            }
          }
          .taskResult {
            max-height: 360px;
            overflow: auto;
            overscroll-behavior: contain;
            overflow-wrap: anywhere;
          }
        }
        .statusHint {
          margin: 0;
          color: var(--el-color-warning);
          font-size: 12px;
          line-height: 1.6;
        }
        .remoteInfo {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 4px 8px;
          margin: 0;
          font-size: 12px;
          color: var(--el-text-color-secondary);
          dd {
            margin: 0;
            overflow-wrap: anywhere;
          }
        }
      }
    }
  }
  .fallbackResult {
    max-height: 240px;
    overflow: auto;
    overflow-wrap: anywhere;
  }
}
@keyframes agentSpin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .subAgentMessage .taskList .taskItem .taskToggle {
    .expandIcon {
      transition: none;
    }
    .taskStatus .runningIcon {
      animation: none;
    }
  }
}
</style>
