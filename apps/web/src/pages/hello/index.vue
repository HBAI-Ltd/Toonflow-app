<template>
  <main class="hello" :class="{ configuring: view !== 'welcome' }">
    <section class="welcomePanel" aria-labelledby="welcomeTitle">
      <div v-if="view !== 'welcome'" class="providerContent">
        <header class="providerHeader">
          <el-button text :icon="IconArrowLeft" :disabled="saving" @click="view = 'welcome'">返回</el-button>
          <h1 id="welcomeTitle">{{ view === "login" ? "登录 TF-Router" : "配置语言模型" }}</h1>
        </header>
        <div v-if="view === 'login'" v-loading="saving" class="loginBody" element-loading-text="正在配置文本模型和媒体模型…">
          <iframe ref="loginFrame" class="loginFrame" :src="loginUrl" title="TF-Router 登录与注册" />
        </div>
        <div v-else class="providerBody">
          <languageModel />
        </div>
        <div v-if="view === 'login' && loginError" class="loginFeedback" role="status">
          <el-alert :title="loginError" type="error" :closable="false" showIcon />
          <el-button v-if="loginKey" type="primary" :loading="saving" @click="configureProviders">重试配置</el-button>
        </div>
        <el-button
          v-else-if="view === 'custom'"
          type="primary"
          :loading="saving"
          :disabled="!customProviders.some((provider) => provider.models.length)"
          @click="completeSetup">
          开始使用
        </el-button>
      </div>
      <div v-else class="welcomeContent">
        <h1 id="welcomeTitle">快速开始</h1>
        <p class="description">选择登录TF-Router可直接自动配置，无需任何复杂操作，即可开始创作。</p>

        <el-button class="loginButton" type="primary" @click="openLogin">
          <icon-login class="buttonIcon" />
          登录 TF-Router 自动配置
        </el-button>
        <div class="secondaryActions">
          <el-button class="secondaryButton" round @click="view = 'custom'">
            <icon-key class="buttonIcon" />
            添加私有提供商
          </el-button>
          <span class="separator">或</span>
          <el-button class="secondaryButton" round :loading="saving" @click="completeSetup">稍后配置</el-button>
        </div>
      </div>

      <footer class="pageFooter">
        <p>© {{ new Date().getFullYear() }} Toonflow · 保留所有权利。</p>
      </footer>
    </section>
    <div class="artPanel" aria-hidden="true">
      <bg class="artBg" />
      <div class="artBrand">
        <span class="artLogo" v-html="logoSvg" />
        <span class="artName">Toonflow</span>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import axios from "axios";
import { defineAsyncComponent, onMounted, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { IconArrowLeft } from "@tabler/icons-vue";
import tfRouter from "@toonflow/providers/language/tfRouter";
import tfRouterSource from "@toonflow/providers/media/tfRouter?raw";
import { invalidateNodeModels } from "@toonflow/nodes-scaffold/nodeAi";
import { customProviders, saveSettings, type CustomProviderModel } from "@/stores/settings";
import type { MediaProvider } from "@/components/settings/panels/mediaModel/types";
import { useHelloStore } from "@/stores/hello";
import anonymousData from "@/lib/anonymousData";
import logoSvg from "@toonflow/assets/logo.svg?raw";
import bg from "./bg.vue";

const languageModel = defineAsyncComponent(() => import("@/components/settings/panels/languageModel/index.vue"));
const view = ref<"welcome" | "login" | "custom">("welcome");
const loginUrl = ref("https://api.toonflow.net/login?type=toonflow");
const loginOrigin = new URL(loginUrl.value).origin;
const loginFrame = ref<HTMLIFrameElement>();
const loginKey = ref("");
const loginError = ref("");
const saving = ref(false);
const router = useRouter();
const hello = useHelloStore();
let loginRequest: AbortController | undefined;

function openLogin() {
  const url = new URL(loginUrl.value);
  const pageStyle = getComputedStyle(document.documentElement);
  url.searchParams.set("bgcolor", "white");
  url.searchParams.set("txtcolor", pageStyle.getPropertyValue("--el-color-primary").trim());
  loginUrl.value = url.href;
  loginKey.value = loginError.value = "";
  view.value = "login";
}

async function completeSetup() {
  if (saving.value) return;
  saving.value = true;
  try {
    hello.complete();
    anonymousData.track(view.value === "custom" ? "onboarding.complete" : "onboarding.skip");
    await router.replace("/home");
  } catch {
    ElMessage.error("保存引导状态失败，请重试");
  } finally {
    saving.value = false;
  }
}

function receiveLogin(event: MessageEvent) {
  if (view.value !== "login" || saving.value || event.origin !== loginOrigin || event.source !== loginFrame.value?.contentWindow) return;
  const data = event.data;
  if (!data || typeof data !== "object" || !["register", "login"].includes(data.type)) return;
  if (data.msg === "failed") {
    loginKey.value = "";
    loginError.value = typeof data.error === "string" && data.error.trim() ? data.error : data.type === "register" ? "注册失败" : "登录失败";
    return;
  }
  if (data.msg !== "success") return;
  loginError.value = "";
  if (data.type === "register") {
    ElMessage.success("注册成功，请继续登录以自动配置模型");
    return;
  }
  if (typeof data.key !== "string" || !data.key.trim() || data.key.length > 8192) {
    loginKey.value = "";
    loginError.value = "登录未返回有效的 API Key，请重新登录";
    return;
  }
  loginKey.value = data.key.trim();
  void configureProviders();
}

async function configureProviders() {
  if (saving.value || !loginKey.value) return;
  saving.value = true;
  loginError.value = "";
  const apiKey = loginKey.value;
  const request = new AbortController();
  loginRequest = request;
  try {
    const [modelsResponse, mediaResponse] = await Promise.all([
      axios.post<{ code: number; data: CustomProviderModel[] }>(
        "/api/providers/models",
        {
          apiUrl: tfRouter.apiUrl,
          protocol: tfRouter.protocol,
          apiKey,
        },
        { signal: request.signal, timeout: 35000 }
      ),
      axios.get<{ code: number; data: MediaProvider[] }>("/api/providers/media/list", { signal: request.signal }),
    ]);
    const models = modelsResponse.data.data;
    if (modelsResponse.data.code !== 200 || !Array.isArray(models) || !models.length) throw new Error("未获取到文本模型，请重试配置");
    if (mediaResponse.data.code !== 200 || !Array.isArray(mediaResponse.data.data)) throw new Error("读取媒体供应商失败，请重试配置");
    request.signal.throwIfAborted();
    if (!mediaResponse.data.data.some((provider) => provider.id === tfRouter.id)) {
      await axios.post("/api/providers/media/add", { source: tfRouterSource }, { signal: request.signal });
    }
    request.signal.throwIfAborted();
    // ACT: 媒体文件已安装但保存失败时保留文件，重试通过列表复用，不覆盖用户编辑的模型。
    await saveSettings(settings => {
      request.signal.throwIfAborted();
      const providers = settings.customProviders ?? [];
      if (!Array.isArray(providers)) throw new Error("语言模型配置格式无效");
      const configs = settings.mediaProviderConfigs as Record<string, Record<string, unknown>> | undefined;
      if (configs !== undefined && (!configs || typeof configs !== "object" || Array.isArray(configs))) throw new Error("媒体供应商配置格式无效");
      const current = configs?.[tfRouter.id];
      if (current !== undefined && (!current || typeof current !== "object" || Array.isArray(current))) throw new Error("当前供应商配置格式无效");
      const index = providers.findIndex(provider => typeof provider?.id === "string" && provider.id.toLowerCase() === tfRouter.id.toLowerCase());
      const previous = providers[index];
      const provider = {
        ...previous,
        id: previous?.id ?? tfRouter.id,
        label: previous?.label ?? tfRouter.label,
        apiUrl: tfRouter.apiUrl,
        protocol: tfRouter.protocol,
        apiKey,
        models: previous?.models?.length ? previous.models : models,
      };
      return {
        customProviders: index < 0 ? [...providers, provider] : providers.map((item, position) => position === index ? provider : item),
        mediaProviderConfigs: { ...configs, [tfRouter.id]: { ...current, apiKey } },
      };
    });
    invalidateNodeModels("media");
    if (request.signal.aborted) return;
    hello.complete();
    anonymousData.track("onboarding.complete");
    loginKey.value = "";
    ElMessage.success("文本模型和媒体模型已配置完成");
    await router.replace("/home");
  } catch (error) {
    if (!request.signal.aborted)
      loginError.value = axios.isAxiosError(error)
        ? error.response?.data?.message || "自动配置失败，请重试"
        : error instanceof Error
        ? error.message
        : "自动配置失败，请重试";
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  window.addEventListener("message", receiveLogin);
});
onBeforeUnmount(() => {
  window.removeEventListener("message", receiveLogin);
  loginRequest?.abort();
  loginKey.value = "";
});
</script>

<style lang="scss" scoped>
.hello {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100svh;
  padding: 8px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-family: "Inter", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;

  .welcomePanel {
    display: grid;
    grid-template-rows: 1fr auto 1fr;
    gap: 32px;
    min-width: 0;
    min-height: 544px;
    padding: 48px clamp(24px, 4.4vw, 64px);

    .providerContent {
      grid-row: 1;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      gap: 24px;
      min-width: 0;
      min-height: 0;
      overflow: hidden;

      .providerHeader {
        h1 {
          margin: 16px 0 0;
          font-size: 28px;
          font-weight: 650;
        }
      }

      .providerBody {
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: 2px;
      }

      .loginBody {
        min-height: 0;
        overflow-y: hidden;
        overscroll-behavior: contain;
        background-color: #fff;
        border-radius: var(--ui-radius);
        width: 500px;

        .loginFrame {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 640px;
          border: 0;
          background: transparent;
        }
      }

      .loginFeedback {
        display: grid;
        gap: 12px;
      }
    }

    .welcomeContent {
      grid-row: 2;
      width: 100%;
      max-width: 420px;
      text-align: center;

      h1 {
        margin: 0 0 12px;
        font-size: clamp(32px, 3.4vw, 40px);
        font-weight: 650;
        line-height: 1.35;
        letter-spacing: -0.8px;
      }

      .description {
        margin: 0 0 32px;
        color: var(--el-text-color-secondary);
        font-size: 14px;
        line-height: 1.8;
      }

      .buttonIcon {
        width: 18px;
        height: 18px;
        margin-right: 8px;
      }

      .loginButton {
        width: 100%;
        height: 50px;
        border-radius: calc(var(--ui-radius) * 1.625);
        font-size: 16px;
        font-weight: 600;
      }

      .secondaryActions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-top: 20px;

        .separator {
          color: var(--el-text-color-secondary);
          font-size: 13px;
        }

        .secondaryButton {
          height: 36px;
          margin: 0;
          padding: 0 16px;
          font-size: 13px;
        }
      }
    }

    .pageFooter {
      grid-row: 3;
      align-self: end;
      color: var(--el-text-color-secondary);
      font-size: 12px;

      p {
        margin: 10px 0 0;
        line-height: 1.6;
      }
    }
  }

  &.configuring {
    height: 100dvh;
    min-height: 0;
    overflow: hidden;

    .welcomePanel {
      grid-template-rows: minmax(0, 1fr) auto;
      gap: 24px;
      min-height: 0;

      .pageFooter {
        grid-row: 2;
      }
    }
  }

  .artPanel {
    position: relative;
    min-width: 0;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 28px;
    border-radius: calc(var(--ui-radius) * 1.125);
    overflow: hidden;
    background: radial-gradient(ellipse at 76% 82%, #f3dcb1 0%, transparent 46%), radial-gradient(ellipse at 25% 52%, #667ab5 0%, transparent 52%),
      radial-gradient(ellipse at 90% 18%, #369889 0%, transparent 48%), linear-gradient(145deg, #123f38, #467f72 48%, #a8c9ad);

    .artBg {
      z-index: 0;
    }

    .artBrand {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      color: #fff;

      .artLogo {
        width: 44px;
        height: 44px;
        line-height: 0;

        :deep(svg) {
          display: block;
          width: 100%;
          height: 100%;
        }

        :deep(path) {
          fill: #fff;
        }
      }

      .artName {
        font-size: 30px;
        font-weight: 600;
        letter-spacing: 0.4px;
      }
    }
  }

  @media (max-width: 700px) {
    grid-template-columns: 1fr;

    .welcomePanel {
      padding: 32px 20px;

      .welcomeContent {
        justify-self: center;
      }
    }

    .artPanel {
      display: none;
    }
  }
}
</style>
