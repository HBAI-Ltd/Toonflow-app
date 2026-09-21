<template>
  <div class="tfAccount" :aria-busy="loading">
    <div v-if="apiKey" class="accountHeader">
      <div class="accountBalance">
        <el-text size="small" type="info">账户余额</el-text>
        <el-skeleton v-if="loading && !balance" animated>
          <template #template><el-skeleton-item class="balancePlaceholder" variant="text" /></template>
        </el-skeleton>
        <strong v-else class="balanceNumber">{{ balance ? numberFormat.format(balance.balance) : "—" }}</strong>
      </div>
      <div class="accountActions">
        <el-button text circle :icon="IconRefresh" :loading="loading" :disabled="!apiKey" aria-label="刷新余额" title="刷新余额" @click="refresh" />
        <el-button size="small" :icon="IconCreditCard" :disabled="!apiKey" @click="openRecharge">充值</el-button>
      </div>
    </div>
    <div v-if="!apiKey" class="accountSetup">
      <el-text size="small" type="info">填写API Key开始使用官方供应商</el-text>
      <div class="setupForm">
        <el-input
          v-model="draftKey"
          class="setupInput"
          type="password"
          showPassword
          placeholder="粘贴 API Key"
          :disabled="saving"
          @keyup.enter="submitKey" />
        <el-button type="primary" size="small" :loading="saving || fetchingModels" :disabled="!draftKey.trim()" @click="submitKey">保存</el-button>
      </div>
      <el-text v-if="setupError" size="small" type="danger">{{ setupError }}</el-text>
      <el-button tag="a" href="https://api.toonflow.net/" target="_blank" rel="noopener noreferrer" text type="primary" :icon="IconExternalLink">
        前往 TF-Router 官网 获取 API Key
      </el-button>
    </div>
    <div v-else-if="errorMessage" class="accountError" role="alert">
      <el-text size="small" type="danger">{{ errorMessage }}</el-text>
      <el-button text size="small" :disabled="loading" @click="refresh">重试</el-button>
    </div>
    <div v-if="balance" class="accountDetails">
      <div class="accountMetric">
        <el-text size="small" type="info">密钥余额</el-text>
        <span>{{ balance.keyBalance === null ? "无限制" : numberFormat.format(balance.keyBalance) }}</span>
      </div>
      <div class="accountMetric">
        <el-text size="small" type="info">累计消费</el-text>
        <span>{{ numberFormat.format(balance.totalConsumption) }}</span>
      </div>
      <div class="accountMetric">
        <el-text size="small" type="info">累计充值</el-text>
        <span>{{ numberFormat.format(balance.totalRecharge) }}</span>
      </div>
    </div>
    <component :is="rechargeDialog" v-model="rechargeVisible" :apiKey="apiKey" />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, ref, shallowRef, watch, type Component } from "vue";
import axios from "axios";
import { IconCreditCard, IconExternalLink, IconRefresh } from "@tabler/icons-vue";
import tf, { type TfBalance } from "@/lib/tf";
import type { CustomProvider, CustomProviderModel } from "@/stores/settings";

const props = withDefaults(defineProps<{
  apiKey: string;
  visible?: boolean;
  modelProvider?: Pick<CustomProvider, "apiUrl" | "protocol">;
  saveApiKey: (key: string, models?: CustomProviderModel[]) => Promise<void>;
}>(), { visible: true });
const rechargeDialog = shallowRef<Component>();
const rechargeVisible = ref(false);
const apiKey = computed(() =>
  props.apiKey
    .trim()
    .replace(/^Bearer\s+/i, "")
    .trim()
);
const balance = ref<TfBalance>();
const loading = ref(false);
const errorMessage = ref("");
const draftKey = ref("");
const saving = ref(false);
const setupError = ref("");
const fetchingModels = ref(false);
const draftModels = shallowRef<CustomProviderModel[]>();
const numberFormat = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", minimumFractionDigits: 2, maximumFractionDigits: 6 });
let controller: AbortController | undefined;
let rechargeKey = "";

function openRecharge() {
  if (!apiKey.value || !props.visible) return;
  rechargeKey = apiKey.value;
  rechargeDialog.value ??= defineAsyncComponent(() => import("./tfRechargeDialog.vue"));
  rechargeVisible.value = true;
}

async function submitKey() {
  const key = draftKey.value.trim();
  if (!key || saving.value || fetchingModels.value) return;
  saving.value = true;
  setupError.value = "";
  try {
    await props.saveApiKey(key, draftModels.value);
    draftKey.value = "";
  } catch (error) {
    setupError.value = error instanceof Error ? error.message : "保存失败，请重试";
  } finally {
    saving.value = false;
  }
}

watch(
  [draftKey, () => props.visible, () => props.modelProvider?.apiUrl, () => props.modelProvider?.protocol],
  ([key, visible, apiUrl, protocol], _previous, onCleanup) => {
    draftModels.value = undefined;
    fetchingModels.value = false;
    setupError.value = "";
    if (!visible || !apiUrl || !protocol || !key.trim()) return;
    const request = new AbortController();
    fetchingModels.value = true;
    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.post("/api/providers/models", { apiUrl, protocol, apiKey: key.trim() }, { signal: request.signal, timeout: 35000 });
        if (request.signal.aborted) return;
        if (data.code !== 200 || !Array.isArray(data.data)) throw new Error(data.message || "获取模型列表失败");
        if (!data.data.length) throw new Error("未获取到可用模型，请检查 API Key 后重试");
        draftModels.value = data.data;
      } catch (error) {
        if (!request.signal.aborted) setupError.value = axios.isAxiosError(error)
          ? error.response?.data?.message || "获取模型列表失败，请检查 API Key 后重试"
          : error instanceof Error ? error.message : "获取模型列表失败";
      } finally {
        if (!request.signal.aborted) fetchingModels.value = false;
      }
    }, 500);
    onCleanup(() => { clearTimeout(timer); request.abort(); });
  },
  { flush: "sync" },
);

async function refresh() {
  controller?.abort();
  loading.value = false;
  errorMessage.value = "";
  if (!apiKey.value || !props.visible) return;
  const request = new AbortController();
  controller = request;
  loading.value = true;
  try {
    const result = await tf.getBalance({ apiKey: apiKey.value, signal: request.signal });
    if (!request.signal.aborted) balance.value = result;
  } catch (error) {
    if (!request.signal.aborted) {
      errorMessage.value = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
        ? error.message
        : "余额查询失败，请重试";
    }
  } finally {
    if (!request.signal.aborted) loading.value = false;
  }
}

watch(
  [apiKey, () => props.visible],
  () => {
    rechargeVisible.value = false;
    balance.value = undefined;
    draftKey.value = "";
    setupError.value = "";
    void refresh();
  },
  { immediate: true }
);
watch(rechargeVisible, (isOpen, wasOpen) => {
  if (wasOpen && !isOpen && rechargeKey === apiKey.value && props.visible) void refresh();
});
onBeforeUnmount(() => controller?.abort());
</script>

<style lang="scss" scoped>
.tfAccount {
  margin-top: 16px;
  padding: 14px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-border-radius-base);

  .accountHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;

    .accountBalance {
      display: grid;
      justify-items: start;
      min-width: 0;
      gap: 4px;

      .balanceNumber {
        color: var(--el-text-color-primary);
        font-size: 24px;
        line-height: 1.3;
        font-variant-numeric: tabular-nums;
        overflow-wrap: anywhere;
      }

      .balancePlaceholder {
        width: 112px;
        height: 28px;
      }
    }

    .accountActions {
      display: flex;
      align-items: center;
      gap: 6px;

      .el-button + .el-button {
        margin-left: 0;
      }
    }
  }

  .accountError {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    overflow-wrap: anywhere;
  }

  .accountSetup {
    display: grid;
    gap: 8px;
    margin-top: 12px;

    .setupForm {
      display: flex;
      gap: 8px;

      .setupInput {
        flex: 1;
        min-width: 0;
      }
    }
  }

  .accountDetails {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
    gap: 12px 20px;
    margin-top: 16px;

    .accountMetric {
      display: grid;
      justify-items: start;
      min-width: 0;
      gap: 4px;
      color: var(--el-text-color-regular);
      font-size: 12px;
      font-variant-numeric: tabular-nums;
      overflow-wrap: anywhere;
    }
  }
}
</style>
