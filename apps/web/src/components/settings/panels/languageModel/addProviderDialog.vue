<template>
  <el-dialog v-model="visible" title="添加供应商" width="min(860px, 94vw)" alignCenter appendToBody destroyOnClose :closeOnClickModal="false" :closeOnPressEscape="!saving" :showClose="!saving" @closed="resetForm">
    <div class="providerPicker">
      <aside class="providerSidebar" aria-label="选择厂商">
        <button
          v-for="item in languageProviders"
          :key="item.id"
          class="providerItem"
          type="button"
          :disabled="saving"
          :aria-pressed="selectedProvider === item.id"
          @click="selectedProvider = item.id">
          <img v-if="item.id === 'tfRouter'" class="providerLogo" :src="logoUrl" alt="" />
          <modelIcon v-else :model="item.id" :size="18" />
          <span>{{ item.label }}</span>
        </button>
      </aside>
      <el-scrollbar class="providerDetails">
        <section v-if="activeProvider" :key="selectedProvider" class="providerContent" :aria-label="activeProvider.label">
          <div class="providerHeader">
            <h3>{{ activeProvider.label }}</h3>
            <el-tag v-if="activeProvider.version" size="small" type="info" effect="plain">v{{ activeProvider.version }}</el-tag>
          </div>
          <messageMarkdown v-if="providerReadme" class="providerReadme" :content="providerReadme" />
          <el-divider v-if="providerReadme" contentPosition="left">连接配置</el-divider>
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
      </el-scrollbar>
    </div>
    <template #footer>
      <el-button :disabled="saving" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" :disabled="!activeProvider || fetching || !!modelError" @click="addProvider">确定添加供应商</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import axios from "axios";
import { IconRefresh } from "@tabler/icons-vue";
import formCreate, { type Api, type Options } from "../../formCreate";
import { languageProviders } from "@toonflow/providers";
import { modelIcon } from "@toonflow/model-icons";
import logoUrl from "@toonflow/assets/logo.svg";
import messageMarkdown from "@/components/messageMarkdown.vue";
import type { Column } from "element-plus";
import { saveSettings, type CustomProviderModel } from "@/stores/settings";

const visible = defineModel<boolean>({ default: false });
const selectedProvider = ref<string>(languageProviders[0]?.id ?? "");
const formApi = shallowRef<Api>();
const formValues = ref<Record<string, unknown>>({});
const models = shallowRef<CustomProviderModel[]>([]);
const fetching = ref(false);
const modelError = ref("");
const modelRefresh = ref(0);
const modelColumns: Column[] = [
  { key: "id", dataKey: "id", title: "模型 ID", width: 220, flexGrow: 1 },
  { key: "label", dataKey: "label", title: "显示名称", width: 180, flexGrow: 1 },
];
const saving = ref(false);
const formError = ref("");
watch(selectedProvider, () => {
  formError.value = "";
  formValues.value = {};
}, { flush: "sync" });
const activeProvider = computed(() => languageProviders.find(provider => provider.id === selectedProvider.value));
const providerReadme = computed(() => {
  const provider = activeProvider.value;
  return provider && "readme" in provider && typeof provider.readme === "string" ? provider.readme : "";
});
const formOptions = computed<Options>(() => ({ form: { labelPosition: "top", disabled: saving.value }, submitBtn: false, resetBtn: false }));
const providerRules = computed(() =>
  formCreate.copyRules(activeProvider.value?.rules ?? []),
);

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
          apiUrl: provider.apiUrl, protocol: provider.protocol, apiKey,
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

function resetForm() {
  selectedProvider.value = languageProviders[0]?.id ?? "";
  formError.value = "";
  formApi.value = undefined;
  formValues.value = {};
}

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
    const addedProvider = {
      id: provider.id,
      label: provider.label,
      apiKey,
      apiUrl: "apiUrl" in provider ? provider.apiUrl : "",
      protocol: "protocol" in provider ? provider.protocol : "",
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
</script>

<style lang="scss" scoped>
.providerPicker {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  height: min(560px, 70dvh);
  gap: 24px;

  .providerSidebar {
    overflow-y: auto;
    border-right: 1px solid var(--el-border-color-lighter);

    padding: 2px;

    .providerItem {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 12px;
      margin-bottom: 4px;
      border: 0;
      border-radius: var(--el-border-radius-base);
      background: transparent;
      color: var(--el-text-color-regular);
      font: inherit;
      text-align: left;
      cursor: pointer;

      &:hover {
        background: var(--el-fill-color-light);
      }

      &[aria-pressed="true"] {
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }

      &:focus-visible {
        outline: 2px solid var(--el-color-primary);
      }

      .providerLogo {
        width: 18px;
        height: 18px;
        object-fit: contain;

        .dark & {
          filter: invert(1);
        }
      }
    }
  }

  .providerDetails {
    min-width: 0;

    .providerContent {
      padding-right: 12px;

      .providerHeader {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        margin: 4px 0 24px;

        h3 {
          margin: 0;
          color: var(--el-text-color-primary);
          font-size: 18px;
          overflow-wrap: anywhere;
        }
      }

      .providerReadme {
        margin-bottom: 24px;
        overflow-wrap: anywhere;
      }

      .modelHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin: 8px 0 12px;
      }

      .modelList {
        margin-bottom: 16px;
      }
    }
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 16px;

    .providerSidebar {
      max-height: 128px;
      border-right: 0;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }
  }
}
</style>
