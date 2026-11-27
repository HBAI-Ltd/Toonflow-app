<template>
  <div class="assetMenuPreview" role="img" aria-label="插入到画布">
    <div inert class="menuSurface">
      <el-dropdown ref="dropdown" trigger="hover" :showArrow="false" :teleported="false" :showTimeout="0"
        :popperOptions="{ modifiers: [{ name: 'applyStyles', enabled: false }] }" :popperStyle="{ position: 'static', zIndex: 'auto' }">
        <span hidden></span>
        <template #dropdown><assetMenuItems canInsert isFile /></template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { DropdownInstance } from "element-plus";
import assetMenuItems from "@/pages/workspace/panels/canvas/components/assetMenuItems.vue";

defineProps<{ kind: "canvasAsset" }>();
const dropdown = ref<DropdownInstance>();
onMounted(() => dropdown.value?.handleOpen());
</script>

<style scoped lang="scss">
.assetMenuPreview {
  .menuSurface {
    display: grid;
    width: min(100%, 184px);
    :deep(.el-dropdown) { display: grid; }
    :deep(.el-dropdown-menu__item:first-child) { color: var(--el-color-primary); background: var(--el-dropdown-menuItem-hover-fill); }
  }
}
</style>
