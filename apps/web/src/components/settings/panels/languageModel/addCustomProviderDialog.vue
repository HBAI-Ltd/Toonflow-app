<template>
  <el-dialog
    v-model="visible"
    :title="provider ? '编辑供应商' : '添加自定义供应商'"
    width="min(760px, 94vw)"
    alignCenter
    appendToBody
    destroyOnClose
    :closeOnClickModal="false"
    :closeOnPressEscape="!saving"
    :showClose="!saving"
    @closed="resetForm">
    <el-scrollbar maxHeight="65vh">
      <el-form ref="providerForm" :model="form" :rules="rules" labelPosition="top" :disabled="saving" class="customProviderForm">
        <div class="formGrid">
          <el-form-item label="Provider ID" prop="id"><el-input v-model="form.id" placeholder="例如 myProvider" /></el-form-item>
          <el-form-item label="显示名称" prop="label"><el-input v-model="form.label" placeholder="供应商的显示名称" /></el-form-item>
          <el-form-item label="API 地址" prop="apiUrl"><el-input v-model="form.apiUrl" dir="ltr" placeholder="https://api.example.com/v1" /></el-form-item>
          <el-form-item label="API 协议" prop="protocol">
            <el-select v-model="form.protocol" aria-label="API 协议">
              <el-option v-for="protocol in protocols" :key="protocol" :label="protocol" :value="protocol" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="API 密钥" prop="apiKey">
          <el-input v-model="form.apiKey" type="password" dir="ltr" showPassword autocomplete="off" placeholder="本地无鉴权服务可留空" />
        </el-form-item>
        <div class="modelHeader">
          <el-text tag="strong">模型列表</el-text>
          <el-button :icon="IconDownload" :loading="fetching" @click="fetchModels()">获取模型列表</el-button>
        </div>
        <div class="modelList">
          <div v-for="item in models" :key="item.key" class="modelItem">
            <div class="modelRow">
              <el-input v-model="item.id" placeholder="模型 ID" aria-label="模型 ID" />
              <el-input v-model="item.label" placeholder="显示名称" aria-label="模型显示名称" />
              <el-button
                text
                :icon="expandedModels.has(item.key) ? IconChevronUp : IconChevronDown"
                :aria-expanded="expandedModels.has(item.key)"
                aria-label="展开模型设置"
                @click="expandedModels.has(item.key) ? expandedModels.delete(item.key) : expandedModels.add(item.key)" />
              <el-button
                text
                type="danger"
                :icon="IconTrash"
                aria-label="删除模型"
                @click="models = models.filter((model) => model.key !== item.key)" />
            </div>
            <div v-if="expandedModels.has(item.key)" class="modelSettings">
              <div class="formGrid tokenSettings">
                <el-form-item label="上下文窗口">
                  <el-input-number
                    v-model="item.contextWindow"
                    :min="1"
                    :max="Number.MAX_SAFE_INTEGER"
                    :precision="0"
                    controlsPosition="right"
                    placeholder="未设置"
                    aria-label="上下文窗口" />
                </el-form-item>
                <el-form-item label="最大输出 token">
                  <el-input-number
                    v-model="item.maxOutputTokens"
                    :min="1"
                    :max="Number.MAX_SAFE_INTEGER"
                    :precision="0"
                    controlsPosition="right"
                    placeholder="未设置"
                    aria-label="最大输出 token" />
                </el-form-item>
              </div>
              <el-form-item class="reasoningMode" label="思考强度档位">
                <el-select :modelValue="getReasoningMode(item)" aria-label="思考强度配置方式" @update:modelValue="setReasoningMode(item, $event)">
                  <el-option label="继承模型目录" value="inherit" />
                  <el-option label="禁用思考强度" value="disabled" />
                  <el-option label="自定义档位" value="custom" />
                </el-select>
              </el-form-item>
              <div v-if="getReasoningMode(item) === 'custom'" class="reasoningSettings">
                <div class="reasoningChoices" aria-label="支持的思考档位">
                  <el-checkbox
                    v-for="level in thinkingLevels"
                    :key="level"
                    class="reasoningChoice"
                    border
                    :modelValue="hasReasoningLevel(item, level)"
                    @update:modelValue="setReasoningLevel(item, level, !!$event)">
                    {{ thinkingLevelLabels[level] }}
                  </el-checkbox>
                </div>
                <el-text type="info" size="small">勾选支持的档位并填写接口值；off 可留空，不指定强度值。</el-text>
                <div class="reasoningMappings">
                  <div v-for="level in thinkingLevels.filter(level => hasReasoningLevel(item, level))" :key="level" class="reasoningRow">
                    <div class="reasoningLevel">
                      <span>{{ thinkingLevelLabels[level] }}</span>
                      <span class="reasoningKey">{{ level }}</span>
                    </div>
                    <el-input
                      :modelValue="getReasoningValue(item, level)"
                      :placeholder="level === 'off' ? '留空使用协议默认值' : '接口值，例如 ' + level"
                      :aria-label="level + ' 接口值'"
                      @update:modelValue="setReasoningValue(item, level, $event)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <el-button class="manualAdd" :icon="IconPlus" @click="addManualModel">手动添加模型</el-button>
        <el-alert v-if="formError" :title="formError" type="error" :closable="false" showIcon />
      </el-form>
    </el-scrollbar>
    <template #footer>
      <el-button :disabled="saving" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" :disabled="fetching" @click="addProvider">
        {{ provider ? "保存修改" : "确定添加供应商" }}
      </el-button>
    </template>
  </el-dialog>
  <el-dialog v-model="resultsVisible" title="选择要添加的模型" width="min(680px, 92vw)" alignCenter appendToBody destroyOnClose>
    <el-input v-model="modelSearch" clearable :prefixIcon="IconSearch" placeholder="搜索模型 ID 或显示名称" aria-label="搜索模型" />
    <div class="modelResults">
      <el-auto-resizer>
        <template #default="{ height, width }">
          <el-table-v2
            :columns="resultColumns"
            :data="filteredModels"
            :width="width"
            :height="height"
            :rowHeight="38"
            :headerHeight="36"
            rowKey="id"
            fixed />
        </template>
      </el-auto-resizer>
    </div>
    <el-text type="info">{{ filteredModels.length }} 个结果，已勾选 {{ selectedIds.size }} 个</el-text>
    <template #footer>
      <el-button @click="resultsVisible = false">取消</el-button>
      <el-button type="primary" :disabled="!selectedIds.size" @click="addSelectedModels">添加勾选的模型（{{ selectedIds.size }}）</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, h, onBeforeUnmount, reactive, ref, shallowRef, watch } from "vue";
import axios from "axios";
import { t } from "@toonflow/i18n/vue";
import { ElCheckbox, type FormInstance, type FormRules, type Column } from "element-plus";
import {
  IconPlus,
  IconDownload,
  IconTrash,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
} from "@tabler/icons-vue";
import { saveSettings, type CustomProvider, type CustomProviderModel } from "@/stores/settings";
import { languageProviders } from "@toonflow/providers";
import { thinkingLevels, type ThinkingLevel, type ReasoningEfforts } from "@toonflow/server/modelReasoning";

const props = defineProps<{ provider?: CustomProvider }>();
const visible = defineModel<boolean>({ default: false });
const providerForm = ref<FormInstance>();
const form = reactive({ id: "", label: "", apiUrl: "", protocol: "openai-completions", apiKey: "" });
const models = ref<(CustomProviderModel & { key: string })[]>([]);
const expandedModels = ref(new Set<string>());
const fetchedModels = shallowRef<CustomProviderModel[]>([]);
const selectedIds = ref(new Set<string>());
const modelSearch = ref("");
const saving = ref(false);
const thinkingLevelLabels: Record<ThinkingLevel, string> = { off: "关闭", minimal: "最小", low: "低", medium: "中", high: "高", xhigh: "极高", max: "最高" };
const protocols = ["openai-completions", "openai-responses", "anthropic-messages"];
const addedIds = computed(() => new Set(models.value.map((item) => item.id.trim())));
const filteredModels = computed(() => {
  const query = modelSearch.value.trim().toLowerCase();
  return query ? fetchedModels.value.filter((item) => `${item.id} ${item.label}`.toLowerCase().includes(query)) : fetchedModels.value;
});
const resultColumns = computed<Column[]>(() => [
  {
    key: "selection",
    width: 42,
    cellRenderer: ({ rowData }) =>
      h(ElCheckbox, {
        modelValue: selectedIds.value.has(rowData.id),
        disabled: addedIds.value.has(rowData.id),
        ariaLabel: t`选择 ${rowData.id}`,
        onChange: (value: boolean | string | number) => {
          if (value) selectedIds.value.add(rowData.id);
          else selectedIds.value.delete(rowData.id);
        },
      }),
  },
  { key: "id", dataKey: "id", title: "模型 ID", width: 240, flexGrow: 1 },
  { key: "label", dataKey: "label", title: "显示名称", width: 200, flexGrow: 1 },
]);
const resultsVisible = ref(false);
const fetching = ref(false);
const formError = ref("");
let request: AbortController | undefined;
const rules: FormRules = {
  id: [
    { required: true, message: "请输入 Provider ID", trigger: "blur" },
    { pattern: /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/, message: "仅支持字母、数字、点、下划线和短横线", trigger: "blur" },
  ],
  label: [{ required: true, whitespace: true, message: "请输入显示名称", trigger: "blur" }],
  apiUrl: [
    {
      validator: (_rule, value, callback) => {
        try {
          const url = new URL(value);
          if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error();
          callback();
        } catch {
          callback(new Error("请输入有效的 HTTP API 基础地址，不包含查询参数"));
        }
      },
      trigger: "blur",
    },
  ],
};

watch(visible, (value) => {
  if (value) {
    resetForm();
    if (props.provider) {
      const { models: providerModels, id, label, apiUrl, protocol, apiKey } = props.provider;
      Object.assign(form, { id, label, apiUrl, protocol, apiKey });
      models.value = providerModels.map((item) => ({ ...item, key: crypto.randomUUID() }));
    }
  } else {
    request?.abort();
    resultsVisible.value = false;
  }
}, { immediate: true });
onBeforeUnmount(() => request?.abort());
watch([() => form.id, () => form.apiUrl, () => form.protocol, () => form.apiKey], () => request?.abort());

function resetForm() {
  Object.assign(form, { id: "", label: "", apiUrl: "", protocol: "openai-completions", apiKey: "" });
  models.value = [];
  expandedModels.value = new Set();
  fetchedModels.value = [];
  selectedIds.value = new Set();
  modelSearch.value = "";
  formError.value = "";
}

async function fetchModels() {
  if (fetching.value || !(await providerForm.value?.validateField("apiUrl").catch(() => false))) return;
  fetching.value = true;
  formError.value = "";
  const controller = new AbortController();
  request = controller;
  try {
    const { data } = await axios.post(
      "/api/providers/models",
      { apiUrl: form.apiUrl.trim(), protocol: form.protocol, apiKey: form.apiKey.trim() },
      { signal: controller.signal, timeout: 35000 }
    );
    if (controller.signal.aborted) return;
    if (data.code !== 200 || !Array.isArray(data.data)) throw new Error(data.message || "获取模型列表失败");
    fetchedModels.value = data.data;
    selectedIds.value = new Set();
    modelSearch.value = "";
    resultsVisible.value = true;
  } catch (error) {
    if (!controller.signal.aborted) {
      formError.value = axios.isAxiosError(error)
        ? error.response?.data?.message || "获取模型列表失败，请检查连接配置"
        : error instanceof Error
        ? error.message
        : "获取模型列表失败";
    }
  } finally {
    fetching.value = false;
  }
}

function addSelectedModels() {
  const added = new Set(addedIds.value);
  for (const item of fetchedModels.value) {
    if (selectedIds.value.has(item.id) && !added.has(item.id)) {
      models.value.push({ ...item, key: crypto.randomUUID() });
      added.add(item.id);
    }
  }
  resultsVisible.value = false;
}

function addManualModel() {
  const key = crypto.randomUUID();
  models.value.push({ key, id: "", label: "" });
}

function getReasoningMode(model: CustomProviderModel) {
  return model.reasoningEfforts === undefined ? "inherit" : model.reasoningEfforts === false ? "disabled" : "custom";
}

function setReasoningMode(model: CustomProviderModel, mode: string) {
  model.reasoningEfforts = mode === "inherit" ? undefined : mode === "disabled" ? false : {};
}

function hasReasoningLevel(model: CustomProviderModel, level: ThinkingLevel) {
  return !!model.reasoningEfforts && Object.hasOwn(model.reasoningEfforts, level);
}

function getReasoningValue(model: CustomProviderModel, level: ThinkingLevel) {
  return model.reasoningEfforts && model.reasoningEfforts[level] || "";
}

function setReasoningLevel(model: CustomProviderModel, level: ThinkingLevel, enabled: boolean) {
  const efforts = { ...(model.reasoningEfforts || {}) };
  if (enabled) efforts[level] = level === "off" ? null : level;
  else delete efforts[level];
  model.reasoningEfforts = efforts;
}

function setReasoningValue(model: CustomProviderModel, level: ThinkingLevel, value: string) {
  model.reasoningEfforts = { ...(model.reasoningEfforts || {}), [level]: level === "off" && !value ? null : value };
}

async function addProvider() {
  if (fetching.value) return;
  formError.value = "";
  if (saving.value || !(await providerForm.value?.validate().catch(() => false))) return;
  if (form.id.toLowerCase() === "toonflow") {
    formError.value = "toonflow 为账号供应商保留 ID，请使用其他 ID";
    return;
  }
  const providerId = props.provider?.id;
  const ids = models.value.map((item) => item.id.trim());
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) {
    formError.value = "模型 ID 不能为空或重复";
    return;
  }
  if (
    models.value.some((item) =>
      [item.contextWindow, item.maxOutputTokens].some((value) => value != null && (!Number.isSafeInteger(value) || value < 1))
    )
  ) {
    formError.value = "token 限制必须为正整数或留空";
    return;
  }
  for (const item of models.value) {
    const efforts = item.reasoningEfforts;
    if (!efforts) continue;
    if (!Object.keys(efforts).some(level => level !== "off")) {
      formError.value = `${item.id} 请至少启用一个思考档位，或选择继承目录 / 禁用`;
      return;
    }
    if (Object.entries(efforts).some(([level, value]) => !(level === "off" && value === null) && (typeof value !== "string" || !value.trim()))) {
      formError.value = `${item.id} 的思考档位接口值不能为空，只有 off 可以留空`;
      return;
    }
  }
  saving.value = true;
  try {
    const updatedProvider = {
      ...form,
      label: form.label.trim(),
      apiUrl: form.apiUrl.trim(),
      apiKey: form.apiKey.trim(),
      models: models.value.map(({ key, ...item }) => ({
        ...item,
        id: item.id.trim(),
        label: item.label.trim() || item.id.trim(),
        contextWindow: item.contextWindow ?? undefined,
        maxOutputTokens: item.maxOutputTokens ?? undefined,
        reasoningEfforts: item.reasoningEfforts
          ? Object.fromEntries(Object.entries(item.reasoningEfforts).map(([level, value]) => [level, value === null ? null : value.trim()])) as ReasoningEfforts
          : item.reasoningEfforts,
      })),
    };
    await saveSettings(settings => {
      const existing = settings.customProviders;
      if (existing !== undefined && !Array.isArray(existing)) throw new Error("已保存的供应商配置格式不正确");
      if (languageProviders.some(item => item.id !== providerId && item.id.toLowerCase() === updatedProvider.id.toLowerCase())
        || existing?.some(item => typeof item?.id === "string" && item.id !== providerId && item.id.toLowerCase() === updatedProvider.id.toLowerCase())) {
        throw new Error("Provider ID 已存在");
      }
      if (providerId && !existing?.some(item => item.id === providerId)) throw new Error("供应商已不存在");
      return { customProviders: providerId
        ? existing!.map(item => item.id === providerId ? { ...item, ...updatedProvider } : item)
        : [...(existing ?? []), updatedProvider] };
    });
    visible.value = false;
  } catch (error) {
    formError.value = error instanceof Error ? error.message : "保存失败，请重试；当前填写的内容已保留";
  } finally {
    saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.customProviderForm {
  padding-right: 12px;

  .formGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 20px;

    .el-input-number {
      width: 100%;
    }
  }

  .modelHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 8px 0 16px;
  }

  .modelList {
    .modelItem {
      padding: 8px 0;
      border-bottom: 1px solid var(--el-border-color-lighter);

      .modelRow {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 28px 28px;
        align-items: center;
        gap: 8px;

        .el-button {
          margin: 0;
          padding: 4px;
        }
      }

      .modelSettings {
        display: grid;
        gap: 16px;
        margin-top: 12px;
        padding: 16px;
        border-radius: var(--el-border-radius-base);
        background: var(--el-fill-color-light);

        .tokenSettings {
          .el-form-item {
            margin-bottom: 0;
          }
        }

        .reasoningMode {
          margin-bottom: 0;
        }

        .reasoningSettings {
          display: grid;
          gap: 12px;

          .reasoningChoices {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
            gap: 8px;

            .reasoningChoice {
              display: flex;
              justify-content: center;
              height: 32px;
              margin: 0;
              padding: 0 8px;
              background: var(--el-bg-color);
              border-color: var(--el-border-color);

              &.is-checked {
                border-color: var(--el-color-primary);
                background: var(--el-color-primary-light-9);
              }
            }
          }

          .reasoningMappings {
            display: grid;
            gap: 8px;

            .reasoningRow {
              display: grid;
              grid-template-columns: 112px minmax(0, 1fr);
              align-items: center;
              gap: 12px;

              .reasoningLevel {
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--el-text-color-primary);
                font-size: 13px;

                .reasoningKey {
                  color: var(--el-text-color-secondary);
                  font-size: 12px;
                }
              }

              @media (max-width: 420px) {
                grid-template-columns: minmax(0, 1fr);
                gap: 6px;
              }
            }
          }
        }
      }
    }
  }

  .manualAdd {
    width: 100%;
    margin: 16px 0;
  }

  @media (max-width: 560px) {
    .formGrid {
      grid-template-columns: 1fr;
    }
  }
}
.modelResults {
  height: min(420px, 55dvh);
  margin: 12px 0;
}
</style>
