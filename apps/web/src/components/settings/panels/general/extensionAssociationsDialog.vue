<template>
  <el-dialog v-model="visible" title="默认打开方式" width="min(660px, calc(100vw - 32px))" alignCenter appendToBody>
    <div class="extensionAssociations" v-loading="loading">
      <p>按文件类型选择默认扩展。清除后，有多个可用扩展时会再次询问打开方式。</p>
      <el-alert v-if="error" :title="error" type="error" :closable="false" />
      <el-table :data="rows" maxHeight="420" emptyText="暂无已安装的文件扩展或默认关联">
        <el-table-column label="文件类型" width="140">
          <template #default="{ row }">{{ row.suffix === 'canvasNode' ? '画布节点' : `.${row.suffix}` }}</template>
        </el-table-column>
        <el-table-column label="默认扩展">
          <template #default="{ row }">
            <el-select :modelValue="extensionAssociations[row.suffix] ?? ''" placeholder="自动选择 / 每次询问" clearable
              :disabled="saving" :aria-label="`${row.suffix} 默认扩展`" @change="id => save(row.suffix, id)">
              <el-option v-if="row.unavailable" :value="row.unavailable" :label="`${row.unavailable}（不可用）`" disabled />
              <el-option v-for="extension in row.candidates" :key="extension.id" :value="extension.id" :label="`${extension.displayName} · ${extension.id}`" />
            </el-select>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <template #footer><el-button @click="visible = false">完成</el-button></template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import { ElAlert, ElButton, ElDialog, ElMessage, ElOption, ElSelect, ElTable, ElTableColumn } from "element-plus";
import { extensionAssociations, listExtensions, setExtensionAssociation, type InstalledExtension } from "@/pages/workspace/panels/document/extensions";

const visible = defineModel<boolean>({ required: true });
const extensions = shallowRef<InstalledExtension[]>([]);
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const rows = computed(() => {
  const available = extensions.value.filter(extension => extension.enabled && !extension.loadError);
  const suffixes = new Set([...Object.keys(extensionAssociations.value), ...available.flatMap(extension => extension.resourceKind === "canvasNode" ? ["canvasNode"] : extension.extensions)]);
  return [...suffixes].sort().map(suffix => {
    const candidates = available.filter(extension => suffix === "canvasNode" ? extension.resourceKind === "canvasNode" : extension.resourceKind === "file" && extension.extensions.includes(suffix));
    const selected = extensionAssociations.value[suffix];
    return { suffix, candidates, unavailable: selected && !candidates.some(extension => extension.id === selected) ? selected : undefined };
  });
});

watch(visible, async value => {
  if (!value) return;
  loading.value = true;
  error.value = "";
  try { extensions.value = await listExtensions(); }
  catch (cause) { error.value = cause instanceof Error ? cause.message : "读取文件扩展失败"; }
  finally { loading.value = false; }
}, { immediate: true });

async function save(suffix: string, id: string) {
  saving.value = true;
  try { await setExtensionAssociation(suffix, id || undefined); }
  catch (cause) { ElMessage.error(cause instanceof Error ? cause.message : "保存默认打开方式失败"); }
  finally { saving.value = false; }
}
</script>

<style scoped lang="scss">
.extensionAssociations {
  p { margin: 0 0 16px; color: var(--el-text-color-secondary); line-height: 1.6; }
  :deep(.el-select) { width: 100%; }
}
</style>
