<template>
  <section v-if="activeProvider" :key="activeProvider.id" class="providerContent" :aria-label="activeProvider.label">
    <header class="providerHeader">
      <h3>{{ activeProvider.label }}</h3>
      <el-tag v-if="activeProvider.version" size="small" type="info" effect="plain">v{{ activeProvider.version }}</el-tag>
    </header>
    <messageMarkdown v-if="providerReadme" class="providerReadme" :content="providerReadme" />
    <h4 class="sectionTitle">连接配置</h4>
    <form-create v-model="formValues" v-model:api="formApi" :rule="providerRules" :option="formOptions" />
    <div class="modelHeader">
      <el-text tag="strong">模型列表 <el-text type="info">{{ models.length }}</el-text></el-text>
      <el-text v-if="fetching" type="info" size="small">正在获取…</el-text>
      <el-button v-else-if="modelError" size="small" text :icon="IconRefresh" @click="modelRefresh++">重试</el-button>
    </div>
    <el-alert v-if="modelError" :title="modelError" type="error" :closable="false" showIcon />
    <div v-else-if="models.length" class="modelList" :style="{ height: `${Math.min(280, models.length * 38 + 36)}px` }" aria-label="模型列表">
      <el-auto-resizer>
        <template #default="{ height, width }">
          <el-table-v2 :columns="modelColumns" :data="models" :width="width" :height="height" :rowHeight="38" :headerHeight="36" rowKey="id" fixed />
        </template>
      </el-auto-resizer>
    </div>
    <el-text v-else-if="!fetching" type="info" size="small">{{ formValues.apiKey ? '未获取到模型' : '填写 API Key 后自动获取模型列表' }}</el-text>
    <el-alert v-if="formError" :title="formError" type="error" :closable="false" showIcon />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import axios from "axios";
import { IconRefresh } from "@tabler/icons-vue";
import formCreate, { copyProviderRules, type Api, type Options } from "@toonflow/provider-web/formCreate";
import type { BuiltinLanguageProvider } from "@/lib/builtinProviders";
import messageMarkdown from "@/components/messageMarkdown.vue";
import type { Column } from "element-plus";
import { saveSettings, type CustomProviderModel } from "@/stores/settings";

const visible = defineModel<boolean>({ default: false });
const props = defineProps<{ provider?: BuiltinLanguageProvider }>();
const saving = defineModel<boolean>("saving", { default: false });
const fetching = defineModel<boolean>("fetching", { default: false });
const formApi = shallowRef<Api>();
const formValues = ref<Record<string, unknown>>({});
const models = shallowRef<CustomProviderModel[]>([]);
const modelError = ref("");
const modelRefresh = ref(0);
const modelColumns: Column[] = [
  { key: "id", dataKey: "id", title: "模型 ID", width: 220, flexGrow: 1 },
  { key: "label", dataKey: "label", title: "显示名称", width: 180, flexGrow: 1 },
];
const formError = ref("");
watch(() => props.provider, () => {
  formError.value = "";
  formValues.value = {};
  formApi.value = undefined;
}, { flush: "sync" });
const activeProvider = computed(() => props.provider);
const canSubmit = computed(() => !!activeProvider.value && !fetching.value && !modelError.value);
const providerReadme = computed(() => {
  const provider = activeProvider.value;
  return provider && "readme" in provider && typeof provider.readme === "string" ? provider.readme : "";
});
const formOptions = computed<Options>(() => ({ form: { labelPosition: "top", disabled: saving.value }, submitBtn: false, resetBtn: false }));
const providerRules = computed(() => copyProviderRules(activeProvider.value?.rules?.length ? activeProvider.value : {
  id: activeProvider.value?.id ?? "",
  rules: [{ type: "input", field: "apiKey", title: "API Key", value: "", props: { type: "password", showPassword: true, autocomplete: "off" } }],
}));

watch(
  [visible, activeProvider, () => formValues.value.apiKey, modelRefresh],
  ([isVisible, provider, key], _previous, onCleanup) => {
    models.value = [];
    modelError.value = "";
    fetching.value = false;
    if (!isVisible || !provider) return;
    if (provider.models.length) {
      models.value = structuredClone(provider.models);
      return;
    }
    const apiKey = typeof key === "string" ? key.trim() : "";
    if (!apiKey) return;
    const controller = new AbortController();
    fetching.value = true;
    // ACT: 输入停顿后自动获取；输入变化时立即取消旧请求，避免逐字请求和结果串到新密钥。
    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.post("/api/providers/models", {
          apiUrl: provider.apiUrl, protocol: provider.protocol, apiKey, headers: provider.headers,
        }, { signal: controller.signal, timeout: 35000 });
        if (controller.signal.aborted) return;
        if (data.code !== 200 || !Array.isArray(data.data)) throw new Error(data.message || "获取模型列表失败");
        models.value = data.data;
      } catch (error) {
        if (!controller.signal.aborted) modelError.value = axios.isAxiosError(error)
          ? error.response?.data?.message || "获取模型列表失败，请检查 API Key 后重试"
          : error instanceof Error ? error.message : "获取模型列表失败";
      } finally {
        if (!controller.signal.aborted) fetching.value = false;
      }
    }, 500);
    onCleanup(() => {
      clearTimeout(timer);
      controller.abort();
    });
  },
  { immediate: true, flush: "sync" },
);

onBeforeUnmount(() => { fetching.value = false; });

async function addProvider() {
  if (saving.value || fetching.value || modelError.value || !activeProvider.value || !formApi.value) return;
  formError.value = "";
  const provider = activeProvider.value;
  const values = formApi.value.formData();
  const apiKey = typeof values.apiKey === "string" ? values.apiKey.trim() : "";
  if (!apiKey) {
    formError.value = "请填写 API Key";
    return;
  }
  saving.value = true;
  try {
    if (!(await formApi.value.validate().then(() => true, () => false))) return;
    const addedProvider = {
      id: provider.id,
      label: provider.label,
      icon: provider.icon,
      version: provider.version,
      apiKey,
      apiUrl: provider.apiUrl,
      protocol: provider.protocol,
      headers: provider.headers,
      maxRequestImageBytes: provider.maxRequestImageBytes,
      maxRequestBytes: provider.maxRequestBytes,
      models: models.value.map(model => ({ ...model })),
    };
    await saveSettings(settings => {
      const existing = settings.customProviders;
      if (existing !== undefined && !Array.isArray(existing)) throw new Error("已保存的供应商配置格式不正确");
      if (existing?.some(item => typeof item?.id === "string" && item.id.toLowerCase() === provider.id.toLowerCase())) {
        throw new Error("此供应商已添加，请在供应商列表中编辑");
      }
      return { customProviders: [...(existing ?? []), addedProvider] };
    });
    visible.value = false;
  } catch (error) {
    formError.value = error instanceof Error ? error.message : "保存失败，请重试；当前填写的内容已保留";
  } finally { saving.value = false; }
}

defineExpose({ addProvider, canSubmit });
</script>
