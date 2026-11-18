<template>
  <div class="assetsPanel">
    <assetLibrary :modelValue="active" expanded />
  </div>
</template>

<script setup lang="ts">
import assetLibrary from "@/pages/workspace/panels/canvas/components/assetLibrary.vue";

// 显示面板时加载素材，切走后清理预览与新建状态，与原弹窗打开、关闭一致。
defineProps<{ active: boolean }>();
</script>

<style lang="scss" scoped>
.assetsPanel {
  display: flex;
  min-width: 0;
  min-height: 0;
}
</style>
