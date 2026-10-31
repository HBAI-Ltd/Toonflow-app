<template>
  <el-popover
    :visible="popupVisible"
    trigger="click"
    placement="top"
    :width="300"
    :popperStyle="{ padding: 0 }"
    @update:visible="value => value ? openCaptcha() : closeCaptcha()">
    <div ref="codeBoxRef" class="smsCaptcha" @keydown.esc="closeCaptcha" />
    <template #reference>
      <el-button
        class="smsCodeButton"
        :disabled="disabled || visible === false || !phone.trim() || countdown > 0 || sending"
        :loading="loading || sending"
        @keydown.esc="closeCaptcha">
        {{ countdown > 0 ? `${countdown}s 后重试` : "获取验证码" }}
      </el-button>
    </template>
  </el-popover>
</template>

<script lang="ts">
type CaptchaResult = { ret: number; ticket?: string; randstr?: string };
type CaptchaInstance = { show(): void; destroy(): void };
type CaptchaConstructor = new (
  element: HTMLElement,
  appId: string,
  callback: (result: CaptchaResult) => void,
  options: { needFeedBack: boolean; type: string; sdkOpts: { width: number; height: number } },
) => CaptchaInstance;

let captchaLoading: Promise<CaptchaConstructor> | undefined;

function loadCaptcha() {
  const captchaWindow = window as Window & { TencentCaptcha?: CaptchaConstructor };
  if (captchaWindow.TencentCaptcha) return Promise.resolve(captchaWindow.TencentCaptcha);
  if (captchaLoading) return captchaLoading;
  captchaLoading = new Promise<CaptchaConstructor>((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => finish(), 20000);
    function finish() {
      window.clearTimeout(timeout);
      script.onload = null;
      script.onerror = null;
      if (captchaWindow.TencentCaptcha) resolve(captchaWindow.TencentCaptcha);
      else {
        script.remove();
        captchaLoading = undefined;
        reject(new Error("人机验证码加载失败，请重试"));
      }
    }
    script.src = "https://turing.captcha.qcloud.com/TCaptcha.js";
    script.async = true;
    script.onload = finish;
    script.onerror = finish;
    document.head.append(script);
  });
  return captchaLoading;
}
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import http from "@/lib/http";

const props = defineProps<{ phone: string; disabled?: boolean; visible?: boolean; isForget?: boolean }>();
const codeBoxRef = ref<HTMLElement>();
const popupVisible = ref(false);
const loading = ref(false);
const sending = ref(false);
const retryAt = ref(0);
const now = ref(Date.now());
const countdown = computed(() => Math.max(0, Math.ceil((retryAt.value - now.value) / 1000)));
const storageKey = "toonflowSmsRetry";
let captcha: CaptchaInstance | undefined;
let controller: AbortController | undefined;
let timer: ReturnType<typeof setInterval> | undefined;

function updateCountdown() {
  now.value = Date.now();
  if (countdown.value === 0 && timer) {
    clearInterval(timer);
    timer = undefined;
  }
  if (countdown.value > 0 && !timer) timer = setInterval(updateCountdown, 1000);
}

function closeCaptcha() {
  controller?.abort();
  controller = undefined;
  const currentCaptcha = captcha;
  captcha = undefined;
  currentCaptcha?.destroy();
  popupVisible.value = false;
  loading.value = false;
  sending.value = false;
}

async function openCaptcha() {
  if (props.disabled || props.visible === false || loading.value || sending.value || countdown.value > 0 || !props.phone.trim()) return;
  if (popupVisible.value) return;
  const phone = props.phone.trim();
  const isForget = props.isForget;
  const request = new AbortController();
  controller = request;
  loading.value = true;
  popupVisible.value = true;
  try {
    const captchaConstructor = await loadCaptcha();
    await nextTick();
    if (request.signal.aborted || !codeBoxRef.value) return;
    let submitted = false;
    captcha = new captchaConstructor(codeBoxRef.value, "195169519", async result => {
      if (submitted || request.signal.aborted || props.phone.trim() !== phone || props.isForget !== isForget) return;
      if (result.ret !== 0) return closeCaptcha();
      if (!result.ticket || !result.randstr) {
        closeCaptcha();
        ElMessage.error("人机验证失败，请重试");
        return;
      }
      submitted = true;
      sending.value = true;
      try {
        const timestamp = await http<number>({
          method: "POST", url: "/api/channel/user/sendSmsCode", signal: request.signal,
          data: { phone, verify: { ticket: result.ticket, randstr: result.randstr }, ...(isForget ? { isForget: 1 } : {}) },
        });
        if (request.signal.aborted) return;
        retryAt.value = timestamp;
        try { localStorage.setItem(storageKey, JSON.stringify({ phone, retryAt: timestamp })); } catch { /* ACT: 浏览器禁用存储时仅保留当前页面倒计时。 */ }
        updateCountdown();
        ElMessage.success("验证码已发送，请查收短信");
      } catch (error) {
        if (!request.signal.aborted) ElMessage.error(error instanceof Error ? error.message : "发送短信验证码失败");
      } finally {
        if (controller === request) closeCaptcha();
      }
    }, { needFeedBack: false, type: "embed", sdkOpts: { width: 100, height: 100 } });
    captcha.show();
  } catch (error) {
    if (!request.signal.aborted) {
      closeCaptcha();
      ElMessage.error(error instanceof Error ? error.message : "人机验证码加载失败，请重试");
    }
  } finally {
    if (controller === request) loading.value = false;
  }
}

watch(() => props.phone.trim(), phone => {
  closeCaptcha();
  retryAt.value = 0;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (saved?.phone === phone && typeof saved.retryAt === "number" && Number.isFinite(saved.retryAt)) retryAt.value = saved.retryAt;
  } catch { /* 无可恢复的短信倒计时。 */ }
  updateCountdown();
}, { immediate: true });

watch([() => props.visible, () => props.disabled], ([visible, disabled]) => {
  if (visible === false || disabled) closeCaptcha();
});

watch(() => props.isForget, closeCaptcha);

onBeforeUnmount(() => {
  closeCaptcha();
  if (timer) clearInterval(timer);
});
</script>

<style lang="scss" scoped>
.smsCodeButton {
  width: 100%;
  height: 36px;
  margin: 0;
  padding: 0 10px;
  font-size: 12px;
}

.smsCaptcha {
  min-height: 100px;
}
</style>
