<template>
  <div class="agentCommandsPreview" role="img" :aria-label="translate('命令与技能')">
    <div inert><skillMenu active commandsEnabled commandsOnly :disabled="false" :running="false" query="" /></div>
  </div>
</template>

<script setup lang="ts">
import { translate } from "@toonflow/i18n/vue";
import skillMenu from "@/components/agent/skillMenu.vue";
</script>

<style scoped lang="scss">
.agentCommandsPreview {
  width: 100%;
  max-width: 540px;
  :deep(.skillButton) { display: none; }
  :deep(.skillPopup) { position: static; box-shadow: none; }
}
</style>
