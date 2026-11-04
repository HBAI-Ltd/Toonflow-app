<template>
  <article class="configurationPage">
    <header class="pageHeading">
      <h1>{{ translate("系统配置") }}</h1>
      <p>{{ translate("管理当前服务的访问方式与创作入口。") }}</p>
    </header>

    <section class="serviceSection" aria-labelledby="configurationServiceTitle">
      <h2 id="configurationServiceTitle">{{ translate("多租户服务") }}</h2>
      <div class="settingRow" :aria-busy="saving">
        <div class="settingText">
          <label for="configurationMultiTenantEnabled">{{ translate("开启多租户") }}</label>
          <p id="configurationEnabledDescription">{{ translate("开启后，用户登录后即可访问创作 Web。") }}</p>
        </div>
        <el-switch id="configurationMultiTenantEnabled" :modelValue="enabled" :loading="saving" :disabled="saving || registrationSaving" :aria-label="translate('开启多租户')" aria-describedby="configurationEnabledDescription" @change="changeEnabled" />
      </div>
      <p class="preservationNote">{{ translate("关闭服务不会删除账号、项目或设置。") }}</p>
      <div class="settingRow" :aria-busy="registrationSaving">
        <div class="settingText">
          <label for="configurationRegistrationEnabled">{{ translate("允许注册") }}</label>
          <p id="configurationRegistrationDescription">{{ translate("关闭后，新用户需由管理员创建账号，已有账号仍可登录。") }}</p>
        </div>
        <el-switch id="configurationRegistrationEnabled" :modelValue="registrationEnabled" :loading="registrationSaving" :disabled="saving || registrationSaving" :aria-label="translate('允许注册')" aria-describedby="configurationRegistrationDescription" @change="changeRegistration" />
      </div>
    </section>

    <section class="accessSection" aria-labelledby="configurationAccessTitle">
      <h2 id="configurationAccessTitle">{{ translate("创作入口") }}</h2>
      <dl class="accessList">
        <div class="accessRow">
          <dt>{{ translate("访问端口") }}</dt>
          <dd><code>{{ accessPort }}</code></dd>
        </div>
        <div v-if="creationUrl" class="accessRow">
          <dt>{{ translate("连接地址") }}</dt>
          <dd><code dir="ltr">{{ creationUrl }}</code></dd>
        </div>
      </dl>
    </section>
  </article>
</template>

<script setup lang="ts">
import { translate } from "@toonflow/i18n/vue";
import { computed } from "vue";
import { ElSwitch } from "element-plus";
import "element-plus/es/components/switch/style/css";

const props = defineProps<{ enabled: boolean; saving: boolean; registrationEnabled: boolean; registrationSaving: boolean; creationUrl: string }>();
const emit = defineEmits<{ changeEnabled: [enabled: boolean]; changeRegistration: [enabled: boolean]; openCreation: [] }>();
const accessPort = computed(() => {
  try {
    const url = new URL(props.creationUrl);
    return url.port || (url.protocol === "https:" ? "443" : "80");
  } catch { return "10888"; }
});

function changeEnabled(value: boolean | string | number) {
  if (!props.saving && !props.registrationSaving && typeof value === "boolean" && value !== props.enabled) emit("changeEnabled", value);
}

function changeRegistration(value: boolean | string | number) {
  if (!props.saving && !props.registrationSaving && typeof value === "boolean" && value !== props.registrationEnabled) emit("changeRegistration", value);
}
</script>

<style lang="scss" scoped>
.configurationPage {
  width: 100%;
  min-width: 0;
  color: var(--el-text-color-primary);

  h1, h2, p, dl, dd { margin: 0; }

  .pageHeading {
    margin-bottom: 8px;

    h1 { font-size: 26px; font-weight: 600; line-height: 1.4; letter-spacing: -0.02em; }
    p { margin-top: 8px; color: var(--el-text-color-regular); font-size: 14px; line-height: 1.7; }
  }

  .serviceSection,
  .accessSection {
    padding: 28px 0;

    h2 { font-size: 16px; font-weight: 600; line-height: 1.6; }
  }

  .serviceSection {
    border-bottom: 1px solid var(--el-border-color-lighter);

    .settingRow {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 32px;
      padding: 24px 0 12px;

      .settingText {
        min-width: 0;

        label { font-size: 14px; font-weight: 500; line-height: 1.6; overflow-wrap: anywhere; }
        p { max-width: 72ch; margin-top: 6px; color: var(--el-text-color-regular); font-size: 14px; line-height: 1.7; }
      }

      .el-switch { flex-shrink: 0; }
    }

    .preservationNote { max-width: 72ch; color: var(--el-text-color-regular); font-size: 13px; line-height: 1.7; }
  }

  .accessSection {
    .accessList {
      margin-top: 8px;

      .accessRow {
        display: grid;
        grid-template-columns: 140px minmax(0, 1fr);
        gap: 24px;
        padding: 18px 0;
        border-bottom: 1px solid var(--el-border-color-lighter);
        font-size: 14px;
        line-height: 1.7;

        &:last-child { border-bottom: 0; }
        dt { font-weight: 500; }
        dd { min-width: 0; }
        code { font-family: var(--el-font-family-monospace, ui-monospace, monospace); font-size: 13px; overflow-wrap: anywhere; user-select: all; }
      }
    }
  }

  @media (max-width: 600px) {
    .pageHeading h1 { font-size: 24px; }
    .serviceSection .settingRow { gap: 20px; }
    .accessSection .accessList .accessRow { grid-template-columns: minmax(0, 1fr); gap: 6px; }
  }
}
</style>
