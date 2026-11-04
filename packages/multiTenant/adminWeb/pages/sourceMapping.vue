<template>
  <article class="sourceMappingPage">
    <header class="pageHeading">
      <h1>{{ translate("数据源映射") }}</h1>
      <p>{{ translate("为业务能力选择由多租户后端处理，或经后端转发至 Toonflow 云端。") }}</p>
    </header>
    <el-alert class="draftNotice" :title="translate('本页保存其他业务来源草稿；模型请求使用“模型路由”中的已启用映射。')" type="info" :closable="false" showIcon />
    <el-alert v-if="requestError" class="requestError" :title="requestError" type="error" :closable="false" showIcon />
    <el-skeleton v-if="loading && !mappings" class="loadingPanel" :rows="6" animated aria-busy="true" />
    <el-form v-if="mappings" class="mappingForm" :disabled="busy" @submit.prevent="save">
      <div v-for="item in capabilities" :key="item.key" class="mappingRow">
        <div class="mappingText">
          <label :for="`sourceMapping${item.key}`">{{ item.label }}</label>
          <p :id="`sourceMappingDescription${item.key}`">{{ item.description }}</p>
        </div>
        <el-select :id="`sourceMapping${item.key}`" v-model="mappings[item.key]" :aria-label="item.label" :aria-describedby="`sourceMappingDescription${item.key}`">
          <el-option value="backend" :label="translate('多租户后端处理')" />
          <el-option value="toonflowCloud" :label="translate('Toonflow 云端')" />
        </el-select>
      </div>
    </el-form>
    <footer class="pageActions">
      <el-button :disabled="busy" :loading="loading" @click="reload">{{ translate("重新加载") }}</el-button>
      <el-button v-if="mappings" type="primary" :disabled="busy || !dirty" :loading="mappingSaving" @click="save">{{ translate("保存草稿") }}</el-button>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { translate } from "@toonflow/i18n/vue";
import type { SourceMapping, SourceMappingSnapshot } from "@toonflow/multi-tenant-source-mapping/config";
import { ElAlert, ElButton, ElForm, ElMessage, ElMessageBox, ElOption, ElSelect, ElSkeleton } from "element-plus";
import type { AdminRequest } from "../types";
import "element-plus/es/components/alert/style/css";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/form/style/css";
import "element-plus/es/components/message/style/css";
import "element-plus/es/components/message-box/style/css";
import "element-plus/es/components/option/style/css";
import "element-plus/es/components/select/style/css";
import "element-plus/es/components/skeleton/style/css";

const props = defineProps<{ request: AdminRequest; enabled: boolean; saving: boolean; creationUrl: string }>();
const emit = defineEmits<{ sessionExpired: [] }>();
const capabilities = computed(() => [
  { key: "providers", label: translate("供应商来源"), description: translate("文本与媒体供应商来源。") },
  { key: "plugins", label: translate("插件市场"), description: translate("插件目录与市场数据。") },
  { key: "community", label: translate("社区内容"), description: translate("作品、广告与赞助等社区内容。") },
] satisfies { key: keyof SourceMapping; label: string; description: string }[]);
const mappings = ref<SourceMapping | null>(null);
const savedMappings = ref<SourceMapping | null>(null);
const revision = ref(0);
const loading = ref(true);
const mappingSaving = ref(false);
const confirmingReload = ref(false);
const requestError = ref("");
const controller = new AbortController();
const busy = computed(() => loading.value || mappingSaving.value || confirmingReload.value || props.saving);
const dirty = computed(() => mappings.value !== null && savedMappings.value !== null
  && capabilities.value.some(item => mappings.value![item.key] !== savedMappings.value![item.key]));

function applySnapshot(snapshot: SourceMappingSnapshot) {
  mappings.value = { ...snapshot.mappings };
  savedMappings.value = { ...snapshot.mappings };
  revision.value = snapshot.revision;
}

function showError(cause: unknown, fallback: string) {
  if (controller.signal.aborted) return;
  if ((cause as { status?: number } | null)?.status === 401) emit("sessionExpired");
  requestError.value = cause instanceof Error ? cause.message : fallback;
}

async function load() {
  loading.value = true;
  requestError.value = "";
  try {
    const result = await props.request<SourceMappingSnapshot>({ method: "GET", url: "/api/multiTenant/sourceMapping/get", signal: controller.signal });
    if (!controller.signal.aborted) applySnapshot(result);
  } catch (cause) { showError(cause, translate("读取数据源映射失败")); }
  finally { loading.value = false; }
}

async function reload() {
  if (busy.value) return;
  if (dirty.value) {
    confirmingReload.value = true;
    try {
      await ElMessageBox.confirm(translate("重新加载会放弃未保存的映射修改，是否继续？"), translate("重新加载"), {
        confirmButtonText: translate("重新加载"), cancelButtonText: translate("取消"), type: "warning",
      });
    } catch { return; }
    finally { confirmingReload.value = false; }
  }
  if (!controller.signal.aborted) await load();
}

async function save() {
  if (busy.value || !dirty.value || !mappings.value) return;
  mappingSaving.value = true;
  requestError.value = "";
  try {
    const result = await props.request<SourceMappingSnapshot>({
      method: "PUT", url: "/api/multiTenant/sourceMapping/save",
      data: { mappings: { ...mappings.value }, expectedRevision: revision.value }, signal: controller.signal,
    });
    if (controller.signal.aborted) return;
    applySnapshot(result);
    ElMessage.success(translate("映射草稿已保存"));
  } catch (cause) { showError(cause, translate("保存数据源映射失败")); }
  finally { mappingSaving.value = false; }
}

onMounted(load);
onBeforeUnmount(() => {
  controller.abort();
  if (confirmingReload.value) ElMessageBox.close();
});
</script>

<style lang="scss" scoped>
.sourceMappingPage {
  width: 100%;
  min-width: 0;
  color: var(--el-text-color-primary);

  .pageHeading {
    margin-bottom: 24px;

    h1 { margin: 0; font-size: 26px; font-weight: 600; line-height: 1.4; letter-spacing: -0.02em; }
    p { max-width: 72ch; margin: 8px 0 0; color: var(--el-text-color-regular); font-size: 14px; line-height: 1.7; }
  }

  .draftNotice,
  .requestError {
    align-items: flex-start;
    margin-bottom: 20px;

    :deep(.el-alert__title) { line-height: 1.7; overflow-wrap: anywhere; }
  }

  .loadingPanel { padding: 24px 0; }

  .mappingForm {
    .mappingRow {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(180px, 240px);
      align-items: center;
      gap: 32px;
      padding: 20px 0;
      border-bottom: 1px solid var(--el-border-color-lighter);

      .mappingText {
        min-width: 0;

        label { font-size: 14px; font-weight: 500; line-height: 1.6; overflow-wrap: anywhere; }
        p { margin: 6px 0 0; color: var(--el-text-color-regular); font-size: 14px; line-height: 1.7; }
      }

      .el-select {
        width: 100%;
        min-width: 0;

        :deep(.el-select__wrapper) { min-height: 44px; }
      }
    }
  }

  .pageActions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 24px;

    .el-button { min-height: 40px; margin: 0; }
  }

  @media (max-width: 600px) {
    .pageHeading h1 { font-size: 24px; }
    .mappingForm .mappingRow { grid-template-columns: minmax(0, 1fr); gap: 16px; }
  }
}
</style>
