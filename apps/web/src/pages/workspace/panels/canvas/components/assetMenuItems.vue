<template>
  <el-dropdown-menu>
    <el-dropdown-item v-if="canInsert" command="insert">插入到画布</el-dropdown-item>
    <el-dropdown-item command="move" :disabled="busy" :divided="canInsert">
      <slot name="move"><span class="moveLabel">移动到<icon-chevron-right :size="14" aria-hidden="true" /></span></slot>
    </el-dropdown-item>
    <el-dropdown-item v-if="isFile" command="download" divided>下载</el-dropdown-item>
    <el-dropdown-item command="rename" :disabled="busy">重命名</el-dropdown-item>
    <el-dropdown-item class="deleteAction" command="delete" :disabled="busy">删除</el-dropdown-item>
  </el-dropdown-menu>
</template>

<script setup lang="ts">
defineProps<{ canInsert: boolean; isFile: boolean; busy?: boolean }>();
</script>

<style scoped lang="scss">
.moveLabel { display: flex; justify-content: space-between; align-items: center; gap: 24px; width: 100%; }
.deleteAction:not(.is-disabled) { color: var(--el-color-danger); }
</style>
