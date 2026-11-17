<template>
  <div class="systemSettingsPanel">
    <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" showIcon />
    <el-form v-if="loaded" labelPosition="top" novalidate @submit.prevent="save">
      <h3>余额与计费</h3>
      <el-form-item label="启用余额扣费"><el-switch v-model="form.enabled" :disabled="saving" /></el-form-item>
      <el-form-item label="默认倍率">
        <el-input-number v-model="form.defaultMultiplier" :min="0" :max="1000" :precision="4" :step="0.1" :disabled="saving" />
        <el-text class="fieldHint" size="small" type="info">用户未设置个人倍率时使用。实际扣费 = 上游账单金额 × 倍率。</el-text>
      </el-form-item>
      <el-form-item label="上游账单服务地址">
        <el-input v-model="form.upstreamOrigin" :disabled="saving" autocomplete="off" />
      </el-form-item>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="余额单位">人民币（CNY）</el-descriptions-item>
        <el-descriptions-item label="账单换算">{{ conversion ? `${conversion.quotaPerUnit} quota / 美元，1 美元 = ${conversion.exchangeRate} 元` : '暂未取得上游换算基准' }}</el-descriptions-item>
        <el-descriptions-item label="结算依据">上游消费账单及匹配的 Request ID</el-descriptions-item>
      </el-descriptions>
      <el-alert v-if="upstreamError" :title="upstreamError" type="warning" :closable="false" />
      <el-text class="fieldHint" type="info">设置仅影响新任务。历史记录不补扣；费用缺失时保留待核对。视频缺少最终结算凭据时，需人工核对预扣与退款。</el-text>
      <el-text class="fieldHint" type="info">余额不足会阻止新调用。费用在上游出账后扣除，单次实际费用可能使余额为负。</el-text>
      <el-form-item label="管理员当前密码"><el-input v-model="currentPassword" type="password" showPassword autocomplete="current-password" :disabled="saving" /></el-form-item>
      <el-space wrap>
        <el-button type="primary" nativeType="submit" :loading="saving" :disabled="!currentPassword">保存设置</el-button>
        <el-button :loading="loading" :disabled="saving || reconciling" @click="load">刷新</el-button>
        <el-button :loading="reconciling" :disabled="saving || loading" @click="reconcile">核对待结算账单</el-button>
      </el-space>
    </el-form>
    <el-alert v-if="notice" :title="notice" type="success" :closable="false" showIcon />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { accountRequest } from "@/lib/account";

const form = ref({ enabled: false, defaultMultiplier: 1, upstreamOrigin: "https://api.openfox.vip" });
const conversion = ref<{ quotaPerUnit: number; exchangeRate: number } | null>(null);
const upstreamError = ref("");
const currentPassword = ref("");
const loaded = ref(false);
const loading = ref(false);
const saving = ref(false);
const reconciling = ref(false);
const errorMessage = ref("");
const notice = ref("");

async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const result = await accountRequest<{ settings: typeof form.value; conversion: typeof conversion.value; upstreamError: string }>("admin/billing/get");
    form.value = result.settings;
    conversion.value = result.conversion;
    upstreamError.value = result.upstreamError;
    loaded.value = true;
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : "读取系统设置失败"; }
  finally { loading.value = false; }
}
async function save() {
  if (saving.value) return;
  saving.value = true;
  errorMessage.value = "";
  notice.value = "";
  try {
    form.value = await accountRequest("admin/billing/save", { settings: form.value, currentPassword: currentPassword.value }, "PUT");
    currentPassword.value = "";
    notice.value = "系统设置已保存，新任务按新设置计费";
    await load();
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : "保存系统设置失败"; }
  finally { saving.value = false; }
}
async function reconcile() {
  if (reconciling.value) return;
  reconciling.value = true;
  errorMessage.value = "";
  notice.value = "";
  try {
    const result = await accountRequest<{ checked: number; settled: number; pending: number }>("admin/billing/reconcile", {});
    notice.value = `已检查 ${result.checked} 笔，结算 ${result.settled} 笔，仍待核对 ${result.pending} 笔`;
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : "核对账单失败"; }
  finally { reconciling.value = false; }
}
onMounted(load);
</script>

<style scoped lang="scss">
.systemSettingsPanel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  h3 { margin: 0 0 20px; }
  .fieldHint { display: block; margin: 12px 0; line-height: 1.7; }
}
</style>
