<template>
  <article class="overviewPage">
    <header class="pageHeading">
      <h1>{{ translate("总览") }}</h1>
      <p>{{ translate("管理当前服务的访问方式与创作入口。") }}</p>
    </header>

    <section class="serviceSection" aria-labelledby="overviewServiceTitle">
      <div class="sectionHeading">
        <h2 id="overviewServiceTitle">{{ translate("多租户服务") }}</h2>
        <el-tag :type="enabled ? 'primary' : 'info'" effect="light" role="status">{{ enabled ? translate("已开启") : translate("未开启") }}</el-tag>
      </div>
      <p class="sectionDescription">{{ translate("开启后，用户登录后即可访问创作 Web。") }}</p>
      <router-link class="configurationLink" :to="{ name: 'multiTenantConfiguration' }">{{ translate("前往配置") }}</router-link>
    </section>

    <section class="accessSection" aria-labelledby="overviewAccessTitle">
      <h2 id="overviewAccessTitle">{{ translate("创作入口") }}</h2>
      <p class="sectionDescription">{{ translate("通过此地址登录或注册 Toonflow。") }}</p>
      <code v-if="creationUrl" class="creationUrl" dir="ltr">{{ creationUrl }}</code>
    </section>

    <section class="accountSection" aria-labelledby="overviewAccountTitle">
      <h2 id="overviewAccountTitle">{{ translate("账号与数据") }}</h2>
      <dl class="scopeList">
        <div class="scopeRow">
          <dt>{{ translate("登录与注册") }}</dt>
          <dd>{{ translate("用户可注册独立账号，登录后进入创作 Web。") }}</dd>
        </div>
        <div class="scopeRow">
          <dt>{{ translate("项目与设置") }}</dt>
          <dd>{{ translate("普通账号的项目与设置彼此独立，超级管理员可访问原有项目。") }}</dd>
        </div>
      </dl>
    </section>
  </article>
</template>

<script setup lang="ts">
import { translate } from "@toonflow/i18n/vue";
import { ElTag } from "element-plus";
import { RouterLink } from "vue-router";
import "element-plus/es/components/tag/style/css";

defineProps<{ enabled: boolean; saving: boolean; creationUrl: string }>();
defineEmits<{ changeEnabled: [enabled: boolean]; openCreation: [] }>();
</script>

<style lang="scss" scoped>
.overviewPage {
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
  .accessSection,
  .accountSection {
    padding: 28px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);

    h2 { font-size: 16px; font-weight: 600; line-height: 1.6; }
    .sectionDescription { max-width: 72ch; margin-top: 8px; color: var(--el-text-color-regular); font-size: 14px; line-height: 1.7; }
  }

  .serviceSection {
    .sectionHeading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }

    .configurationLink {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      margin-top: 8px;
      border-radius: var(--el-border-radius-base);
      color: var(--el-color-primary);
      font-size: 14px;
      font-weight: 500;
      text-decoration: underline;
      text-underline-offset: 4px;

      &:hover { color: var(--el-color-primary-light-3); }
      &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 4px; }
    }
  }

  .accessSection {
    .creationUrl {
      display: block;
      padding: 14px 16px;
      margin-top: 16px;
      border-radius: var(--el-border-radius-base);
      background: var(--el-fill-color-light);
      color: var(--el-text-color-primary);
      font-family: var(--el-font-family-monospace, ui-monospace, monospace);
      font-size: 13px;
      line-height: 1.7;
      overflow-wrap: anywhere;
      user-select: all;
    }
  }

  .accountSection {
    border-bottom: 0;

    .scopeList {
      display: grid;
      gap: 20px;
      margin-top: 20px;

      .scopeRow {
        display: grid;
        grid-template-columns: 140px minmax(0, 1fr);
        gap: 24px;
        font-size: 14px;
        line-height: 1.7;

        dt { font-weight: 500; }
        dd { max-width: 72ch; color: var(--el-text-color-regular); overflow-wrap: anywhere; }
      }
    }
  }

  @media (max-width: 600px) {
    .pageHeading h1 { font-size: 24px; }
    .accountSection .scopeList .scopeRow { grid-template-columns: minmax(0, 1fr); gap: 6px; }
  }
}
</style>
