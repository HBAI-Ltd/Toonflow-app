<template>
  <div class="messageViews" aria-label="实时模型视图">
    <figure v-for="view in views" :key="view.id">
      <img :src="view.src" :alt="view.label" loading="lazy" />
      <figcaption>{{ view.label }}</figcaption>
    </figure>
  </div>
</template>

<script setup lang="ts">
import type { AgentView } from "../agentConversation";
defineProps<{ views: AgentView[] }>();
</script>

<style scoped lang="scss">
.messageViews {
  display: flex;
  gap: 8px;
  padding: 2px 0 4px;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;

  > figure {
    flex: 0 0 74%;
    min-width: 0;
    margin: 0;
    scroll-snap-align: start;
  }
  img { display: block; width: 100%; height: 150px; border-radius: var(--ui-radius); background: var(--el-fill-color-light); object-fit: contain; }
  figcaption { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 10px; line-height: 1.5; }
}
</style>
