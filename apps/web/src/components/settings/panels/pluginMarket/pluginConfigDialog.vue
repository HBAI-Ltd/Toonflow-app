<template>
  <el-dialog v-model="visible" :title="`${plugin.displayName}配置`" width="min(520px, 94vw)" alignCenter appendToBody destroyOnClose :closeOnClickModal="false" :closeOnPressEscape="!saving" :showClose="!saving" @closed="formApi = undefined">
    <form-create v-model="formValues" v-model:api="formApi" :rule="formRules" :option="formOptions" />
    <el-alert v-if="configError" :title="configError" type="error" :closable="false" showIcon />
    <template #footer>
      <el-button :disabled="saving" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" :disabled="!canManage || !formApi" @click="saveConfig">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import axios from "axios";
import { computed, ref, shallowRef, toRaw, watch } from "vue";
import formCreate, { type Api, type Options } from "../../formCreate";
import { ElMessage } from "element-plus";
import type { Plugin } from "./types";

const { plugin, canManage } = defineProps<{ plugin: Plugin; canManage: boolean }>();
const visible = defineModel<boolean>({ default: false });
const formApi = shallowRef<Api>();
const formRules = shallowRef<ReturnType<typeof formCreate.copyRules>>([]);
const formValues = ref<Record<string, unknown>>({});
const saving = ref(false);
const configError = ref("");
const formOptions = computed<Options>(() => ({ form: { labelPosition: "top", size: "small", disabled: saving.value }, submitBtn: false, resetBtn: false }));

watch(() => [visible.value, plugin], () => {
  if (!visible.value) return;
  formApi.value = undefined;
  formRules.value = formCreate.copyRules(plugin.configRules ?? []);
  formValues.value = structuredClone(toRaw(plugin.config ?? {}));
  configError.value = "";
}, { immediate: true });

async function saveConfig() {
  if (!canManage || saving.value || !formApi.value) return;
  saving.value = true;
  configError.value = "";
  try {
    if (!(await formApi.value.validate().catch(() => false))) return;
    const path = plugin.type === "node" ? "nodes" : "tools";
    const { data } = await axios.put(`/api/${path}/save`, { name: plugin.name, config: formApi.value.formData() }, { headers: { "x-toonflow-workspace": "1" } });
    if (data.code !== 200) throw new Error(data.message || "保存插件配置失败");
    plugin.config = data.data;
    if (plugin.type === "node") window.dispatchEvent(new Event("toonflow:node-config-updated"));
    visible.value = false;
    ElMessage.success("插件配置已保存");
  } catch (error) {
    configError.value = axios.isAxiosError(error)
      ? error.response?.data?.message || "保存失败，请重试；当前填写的内容已保留"
      : error instanceof Error ? error.message : "保存失败，请重试";
  } finally { saving.value = false; }
}
</script>
