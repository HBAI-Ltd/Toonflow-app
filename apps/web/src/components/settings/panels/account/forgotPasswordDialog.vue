<template>
  <el-dialog v-model="visible" title="忘记密码" width="min(440px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose :closeOnClickModal="false">
    <el-form :id="formId" class="forgotPasswordForm" labelPosition="top" :disabled="submitting" @submit.prevent="submit">
      <el-form-item label="手机号">
        <el-input v-model="form.phone" autocomplete="tel" placeholder="请输入手机号" />
      </el-form-item>
      <el-form-item label="短信验证码">
        <div class="verificationRow">
          <el-input v-model="form.verificationCode" autocomplete="one-time-code" placeholder="请输入短信验证码" />
          <smsCodeButton :phone="form.phone" :disabled="submitting" :visible="visible" isForget />
        </div>
      </el-form-item>
      <el-form-item label="新密码" :error="form.newPassword && form.newPassword.length < 6 ? '新密码至少 6 位' : ''">
        <el-input v-model="form.newPassword" type="password" autocomplete="new-password" showPassword placeholder="请输入至少 6 位的新密码" />
      </el-form-item>
      <el-form-item label="确认密码" :error="form.confirmPassword && form.confirmPassword !== form.newPassword ? '两次输入的密码不一致' : ''">
        <el-input v-model="form.confirmPassword" type="password" autocomplete="new-password" showPassword placeholder="请再次输入新密码" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" nativeType="submit" :form="formId" :loading="submitting" :disabled="!ready">重置密码</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, useId, watch } from "vue";
import { ElMessage } from "element-plus";
import http from "@/lib/http";
import smsCodeButton from "./smsCodeButton.vue";

const props = defineProps<{ phone?: string }>();
const visible = defineModel<boolean>({ default: false });
const emit = defineEmits<{ reset: [phone: string] }>();
const formId = useId();
const form = reactive({ phone: "", verificationCode: "", newPassword: "", confirmPassword: "" });
const submitting = ref(false);
const ready = computed(() => !!form.phone.trim() && !!form.verificationCode.trim() && form.newPassword.length >= 6
  && form.confirmPassword === form.newPassword && !submitting.value);
let controller: AbortController | undefined;

async function submit() {
  if (!visible.value || !ready.value) return;
  const request = new AbortController();
  controller = request;
  submitting.value = true;
  const phone = form.phone.trim();
  try {
    const message = await http<string>({
      method: "POST", url: "/api/channel/user/forgotPassword", signal: request.signal,
      data: {
        phone, verificationCode: form.verificationCode.trim(),
        newPassword: form.newPassword, confirmPassword: form.confirmPassword,
      },
    });
    if (request.signal.aborted) return;
    ElMessage.success(message || "密码重置成功，请重新登录");
    emit("reset", phone);
    visible.value = false;
  } catch (error) {
    if (!request.signal.aborted) ElMessage.error(error instanceof Error ? error.message : "重置密码失败");
  } finally {
    if (controller === request) submitting.value = false;
  }
}

watch(visible, isVisible => {
  controller?.abort();
  controller = undefined;
  submitting.value = false;
  const phone = props.phone?.trim() ?? "";
  Object.assign(form, {
    phone: isVisible && /^\d+$/.test(phone) ? phone : "",
    verificationCode: "", newPassword: "", confirmPassword: "",
  });
}, { immediate: true, flush: "sync" });

onBeforeUnmount(() => controller?.abort());
</script>

<style lang="scss" scoped>
.forgotPasswordForm {
  .verificationRow {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 116px;
    align-items: center;
    gap: 8px;
    width: 100%;

    .el-input { min-width: 0; }
  }
}
</style>
