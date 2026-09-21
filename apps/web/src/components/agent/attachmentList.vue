<template>
  <div class="attachmentList">
    <attachmentPreview v-for="(attachment, index) in attachments" :key="attachment.path || index" :attachment="attachment" :directory="directory" :removable="removable" @remove="emit('remove', index)" />
  </div>
</template>

<script setup lang="ts">
import attachmentPreview from "./attachmentPreview.vue";
import type { AgentAttachment } from "./types";

defineProps<{ attachments: AgentAttachment[]; directory?: string; removable?: boolean }>();
const emit = defineEmits<{ remove: [index: number] }>();
</script>

<style scoped lang="scss">
.attachmentList {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
