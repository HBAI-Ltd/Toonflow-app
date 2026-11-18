<template>
  <el-select ref="selectRef" v-bind="$attrs">
    <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps ?? {}" />
    </template>
    <template v-if="empty && !$attrs.loading && modelLoginGuide && !$slots.empty" #empty>
      <component :is="modelLoginGuide" @login="selectRef?.blur()" />
    </template>
  </el-select>
</template>

<script setup lang="ts">
import { inject, ref, type Component, type ComputedRef } from "vue";
import { ElSelect } from "element-plus";

defineOptions({ inheritAttrs: false });
defineProps<{ empty: boolean }>();
defineSlots<InstanceType<typeof ElSelect>["$slots"]>();
const selectRef = ref<InstanceType<typeof ElSelect>>();
const modelLoginGuide = inject<ComputedRef<Component | undefined> | undefined>("modelLoginGuide", undefined);
</script>
