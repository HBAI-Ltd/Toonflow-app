<template>
  <main class="hello">
    <div class="pageLanguage"><languageSelect popover /></div>
    <section class="welcomePanel" aria-labelledby="welcomeTitle">
      <div class="welcomeContent">
        <h1 id="welcomeTitle">快速开始</h1>
        <p class="description">输入影幻 API Key 即可开始创作，文本与媒体模型会自动完成配置。</p>
        <div class="keyForm">
          <el-input
            v-model="draftKey"
            class="keyInput"
            dir="ltr"
            type="password"
            showPassword
            size="large"
            placeholder="粘贴 API Key"
            aria-label="影幻 API Key"
            :disabled="saving"
            @keyup.enter="start" />
          <el-button class="startButton" type="primary" size="large" :loading="saving" :disabled="!draftKey.trim() || saving" @click="start">开始使用</el-button>
        </div>
        <el-alert v-if="error" class="keyError" :title="error" type="error" :closable="false" showIcon />
        <div class="secondaryActions">
          <el-button class="mobileConnectButton" :type="deviceHubEnabled ? 'success' : undefined" :plain="deviceHubEnabled" :icon="deviceHubEnabled || mobileConnection.mode === 'remote' ? IconDeviceDesktop : IconQrcode" @click="mobileConnectVisible = true">{{ mobileConnectionLabel }}</el-button>
          <el-button tag="a" href="https://api.safillu.com" target="_blank" rel="noopener noreferrer" text type="primary">前往影幻平台获取 API Key</el-button>
        </div>
      </div>

      <footer class="pageFooter">
        <p>© {{ new Date().getFullYear() }} FilmFraylo · 保留所有权利。</p>
      </footer>
    </section>
    <div class="artPanel" aria-hidden="true">
      <bg class="artBg" />
      <div class="artBrand">
        <span class="artLogo" v-html="logoSvg" />
        <span class="artName">FilmFraylo</span>
      </div>
    </div>
    <mobileConnect v-model="mobileConnectVisible" />
  </main>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref } from "vue";
import { useRouter } from "vue-router";
import { IconQrcode, IconDeviceDesktop } from "@tabler/icons-vue";
import { useHelloStore } from "@/stores/hello";
import { fetchProviderModels, saveProviderApiKey } from "@/lib/providerKey";
import logoSvg from "@toonflow/assets/logo.svg?raw";
import bg from "./bg.vue";
import languageSelect from "@/components/languageSelect.vue";
import { deviceHubEnabled, mobileConnection, mobileConnectionLabel } from "@/lib/mobile";

const mobileConnect = defineAsyncComponent(() => import("@/components/mobileConnect.vue"));
const mobileConnectVisible = ref(false);
const draftKey = ref("");
const saving = ref(false);
const error = ref("");
const router = useRouter();
const hello = useHelloStore();

async function start() {
  const key = draftKey.value.trim();
  if (!key || saving.value) return;
  saving.value = true;
  error.value = "";
  try {
    await fetchProviderModels(key);
    await saveProviderApiKey(key);
    await hello.complete();
    await router.replace("/home");
  } catch (err) {
    error.value = err instanceof Error ? err.message : "配置失败，请重试";
  } finally {
    saving.value = false;
  }
}
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

  .pageLanguage {
    position: fixed;
    top: 16px;
    inset-inline-end: calc(50% + 8px);
    z-index: 2;
    max-width: calc(50% - 24px);
  }

  .welcomePanel {
    display: grid;
    grid-template-rows: 1fr auto 1fr;
    gap: 32px;
    min-width: 0;
    min-height: 544px;
    padding: 48px clamp(24px, 4.4vw, 64px);

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

      .keyForm {
        display: grid;
        gap: 12px;

        .keyInput {
          width: 100%;
        }

        .startButton {
          width: 100%;
          min-height: 50px;
          border-radius: calc(var(--ui-radius) * 1.625);
          font-size: 16px;
          font-weight: 600;
        }
      }

      .keyError {
        margin-top: 16px;
        text-align: start;
      }

      .secondaryActions {
        display: grid;
        gap: 10px;
        margin-top: 20px;

        .mobileConnectButton { width: 100%; min-height: 42px; margin: 0; }
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

    .pageLanguage {
      inset-inline-end: 16px;
      max-width: calc(100% - 32px);
    }

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
