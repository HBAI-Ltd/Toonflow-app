<template>
  <div class="about">
    <div class="brand">
      <div class="brandMark"><img class="brandLogo" :src="logoUrl" alt="FilmFraylo Logo" /></div>
      <div class="brandInfo">
        <h3>FilmFraylo</h3>
        <div class="brandMeta">
          <span v-if="currentVersion">v{{ currentVersion }}</span>
        </div>
      </div>
    </div>

    <el-card class="infoCard" shadow="never">
      <a class="platformLink" href="https://api.safillu.com" target="_blank" rel="noopener noreferrer" aria-label="影幻平台">
        <icon-world class="platformIcon" :size="22" aria-hidden="true" />
        <div class="platformInfo">
          <span class="platformTitle">影幻平台</span>
          <span class="platformHint">管理 API Key、渠道与模型</span>
        </div>
        <icon-external-link class="externalIcon" :size="16" aria-hidden="true" />
      </a>
    </el-card>

    <p class="copyright">© {{ new Date().getFullYear() }} FilmFraylo · 保留所有权利。</p>
  </div>
</template>

<script setup lang="ts">
import { IconWorld, IconExternalLink } from "@tabler/icons-vue";
import logoUrl from "@toonflow/assets/logo.svg";

const currentVersion = import.meta.env.appVersion;
</script>

<style lang="scss" scoped>
.about {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .brand {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 4px 0 12px;

    .brandMark {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      width: 60px;
      height: 60px;
      border-radius: calc(var(--ui-radius) * 1.5);
      background: var(--el-fill-color-light);

      .brandLogo {
        width: 42px;
        height: 42px;
        object-fit: contain;
      }
    }

    .brandInfo {
      min-width: 0;

      h3 {
        margin: 0 0 8px;
        color: var(--el-text-color-primary);
        font-size: 20px;
        font-weight: 600;
      }

      .brandMeta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        color: var(--el-text-color-secondary);
        font-size: 12px;
      }
    }
  }

  .infoCard {
    min-width: 0;
    border-radius: var(--ui-radius);
    transition: border-color 0.2s;

    :deep(.el-card__body) {
      padding: 0;
    }

    &:hover {
      border-color: var(--el-border-color-darker);
    }

    .platformLink {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px;
      color: var(--el-text-color-primary);
      text-decoration: none;

      &:focus-visible {
        outline: 2px solid var(--el-color-primary);
        outline-offset: -2px;
        border-radius: var(--ui-radius);
      }

      .platformIcon,
      .externalIcon {
        flex-shrink: 0;
      }
      .externalIcon {
        color: var(--el-text-color-secondary);
      }

      .platformInfo {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 6px;
        min-width: 0;

        .platformTitle {
          font-size: 14px;
          font-weight: 600;
        }

        .platformHint {
          color: var(--el-text-color-secondary);
          font-size: 12px;
        }
      }
    }
  }

  .copyright {
    margin: 8px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.6;
  }
}
</style>
