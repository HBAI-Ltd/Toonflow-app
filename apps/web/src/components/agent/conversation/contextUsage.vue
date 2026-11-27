<template>
  <el-popover
    v-model:visible="visible"
    :trigger="touchScreen ? 'click' : 'hover'"
    placement="top"
    :width="280"
    :offset="10"
    :showArrow="false"
    popperClass="agentContextPopover">
    <template #reference>
      <el-button class="contextButton" text circle :disabled="disabled" :aria-label="usage?.tokens == null ? '查看上下文用量，暂无数据' : `查看上下文用量，已使用 ${contextPercent.toFixed(1)}%`" title="查看上下文用量">
        <el-progress type="circle" :width="14" :strokeWidth="2" :percentage="Math.min(100, contextPercent)" :color="contextColor" :showText="false" />
      </el-button>
    </template>
    <div class="contextUsage">
      <div class="contextHeader"><span>上下文用量</span><span class="contextHint">估算</span></div>
      <template v-if="usage?.tokens != null">
        <div class="contextTokens">
          <span>{{ usage.tokens.toLocaleString() }} / {{ contextWindow.toLocaleString() }} tok</span>
          <span>{{ contextPercent.toFixed(1) }}%</span>
        </div>
        <el-progress :percentage="Math.min(100, contextPercent)" :color="contextColor" :showText="false" />
      </template>
      <span v-else class="contextHint">{{ usage ? "等待下一次回复更新用量" : "尚无用量数据" }}</span>
      <div v-if="stats" class="contextStats">
        <div class="contextHeader">对话累计用量</div>
        <div class="contextTokens"><span>输入</span><span>{{ inputTokens.toLocaleString() }} tok</span></div>
        <div class="contextTokens"><span>输出</span><span>{{ stats.tokens.output.toLocaleString() }} tok</span></div>
        <div v-if="inputTokens > 0" class="contextTokens"><span>缓存命中</span><span>{{ (stats.tokens.cacheRead / inputTokens * 100).toFixed(1) }}%</span></div>
        <div v-if="stats.tokensPerSecond !== undefined" class="contextTokens"><span>生成速度</span><span>{{ stats.tokensPerSecond.toFixed(1) }} tok/s</span></div>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { AgentContext, AgentStats } from "@toonflow/server/agent/types";
import { touchScreen } from "@/lib/platform";

const props = defineProps<{ usage?: AgentContext; stats?: AgentStats; contextWindow: number; disabled: boolean }>();
const visible = defineModel<boolean>("visible", { default: false });
const contextPercent = computed(() => (props.usage?.tokens ?? 0) / props.contextWindow * 100);
const contextColor = computed(() => contextPercent.value >= 90 ? "var(--el-color-danger)" : contextPercent.value >= 75 ? "var(--el-color-warning)" : "var(--el-color-primary)");
const inputTokens = computed(() => props.stats ? props.stats.tokens.input + props.stats.tokens.cacheRead + props.stats.tokens.cacheWrite : 0);
</script>

<style lang="scss">
.agentContextPopover {
  .contextUsage {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .contextStats {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .contextHeader,
    .contextTokens {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }

    .contextHeader {
      color: var(--el-text-color-primary);
    }

    .contextTokens {
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }

    .contextHint {
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }
  }
}
</style>
