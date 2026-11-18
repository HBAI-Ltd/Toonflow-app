<template>
  <el-popover v-model:visible="visible" trigger="hover" placement="top" :width="280" :offset="10" :showArrow="false" popperClass="agentContextPopover">
    <template #reference>
      <el-button class="agentContextButton" text circle :aria-label="tokens ? `查看上下文用量，已使用 ${percent.toFixed(1)}%` : '查看上下文用量，暂无数据'" title="查看上下文用量">
        <el-progress type="circle" :width="14" :strokeWidth="2" :percentage="Math.min(100, percent)" :color="color" :showText="false" />
      </el-button>
    </template>
    <div class="contextUsage">
      <div class="contextHeader"><span>上下文用量</span><span class="contextHint">估算</span></div>
      <template v-if="tokens">
        <div class="contextTokens">
          <span>{{ tokens.toLocaleString() }} / {{ budget.toLocaleString() }} tok</span>
          <span>{{ percent.toFixed(1) }}%</span>
        </div>
        <el-progress :percentage="Math.min(100, percent)" :color="color" :showText="false" />
      </template>
      <span v-else class="contextHint">尚无用量数据</span>
      <el-button v-if="canCompact || compacting" class="contextCompact" size="small" :loading="compacting" :disabled="disabled || compacting" @click="emit('compact')">压缩上下文</el-button>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElButton, ElPopover, ElProgress } from "element-plus";

/**
 * 与宿主输入区的上下文用量环同构：悬停看估算用量。
 * 宿主只有自动压缩；这里的对话记忆由插件自己管，多一个「压缩上下文」按钮可以手动压。
 */
const props = defineProps<{ tokens: number; budget: number; canCompact?: boolean; compacting?: boolean; disabled?: boolean }>();
const emit = defineEmits<{ compact: [] }>();
const visible = defineModel<boolean>("visible", { default: false });
const percent = computed(() => props.tokens / props.budget * 100);
const color = computed(() => percent.value >= 90 ? "var(--el-color-danger)" : percent.value >= 75 ? "var(--el-color-warning)" : "var(--el-color-primary)");
</script>

<style lang="scss">
// 尺寸同宿主输入区的用量环；轨道用边框色，在半透明面板上也看得见。
.agentContextButton.el-button {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  margin: 0;
  padding: 0;
  &.is-text { background-color: transparent; }
  .el-progress-circle__track { stroke: var(--el-border-color); }
}

.agentContextPopover {
  .contextUsage {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .contextHeader,
    .contextTokens {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }

    .contextHeader { color: var(--el-text-color-primary); }

    .contextTokens {
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }

    .contextHint {
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }

    .contextCompact { align-self: flex-end; margin: 0; }
  }
}
</style>
