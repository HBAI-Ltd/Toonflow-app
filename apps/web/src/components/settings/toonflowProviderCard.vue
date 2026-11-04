<template>
  <el-card class="officialProvider" shadow="never">
    <div class="providerContent">
      <div class="providerMark" aria-hidden="true">
        <img class="providerLogo" :src="logoUrl" alt="" />
      </div>
      <div class="providerInfo">
        <div class="providerHeading">
          <el-text class="providerName" tag="strong">Toonflow</el-text>
          <div class="providerBadges">
            <el-tag class="officialTag" size="small" effect="plain">官方</el-tag>
            <el-tag size="small" type="info" effect="plain">内置</el-tag>
          </div>
        </div>
        <div v-if="provider" class="providerMeta">
          <span v-if="providerLoaded" class="loadedStatus">
            <icon-circle-check class="statusIcon" :size="14" aria-hidden="true" />
            <span>已加载</span>
          </span>
          <el-text class="modelCount" size="small">{{ provider.models.length }} 个模型</el-text>
        </div>
      </div>
      <el-button class="viewButton" plain :icon="IconEye" @click="catalogVisible = true">查看</el-button>
    </div>
  </el-card>
  <el-dialog
    v-model="catalogVisible"
    class="toonflowCatalogDialog"
    :class="{ catalogReady: !!toonflowAccountToken }"
    title="Toonflow"
    :width="toonflowAccountToken ? 'min(1040px, calc(100vw - 32px))' : 'min(520px, calc(100vw - 32px))'"
    alignCenter
    appendToBody
    destroyOnClose>
    <template #header="{ titleId }">
      <div class="catalogHeading">
        <img class="catalogLogo" :src="logoUrl" alt="" />
        <div class="catalogTitle">
          <h2 :id="titleId">Toonflow</h2>
          <span>{{ scope === "text" ? "文本模型" : "媒体模型" }}</span>
        </div>
      </div>
    </template>
    <el-alert v-if="!toonflowAccountToken" title="请先在账号与余额中登录 Toonflow 账号" type="info" :closable="false" showIcon />
    <modelCatalog
      v-else-if="catalogVisible"
      class="dialogCatalog"
      :class="{ textCatalog: scope === 'text' }"
      :visible="catalogVisible"
      :token="toonflowAccountToken"
      :scope="scope" />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from "vue";
import { IconCircleCheck, IconEye } from "@tabler/icons-vue";
import logoUrl from "@toonflow/assets/logo.svg";
import { toonflowAccountToken } from "@/stores/settings";

const props = defineProps<{ scope: "text" | "media"; provider?: { models: unknown[]; loadError?: string } }>();
const modelCatalog = defineAsyncComponent(() => import("./panels/account/modelCatalog.vue"));
const catalogVisible = ref(false);
const providerLoaded = computed(() => !!toonflowAccountToken.value && !!props.provider && !props.provider.loadError);
</script>

<style lang="scss" scoped>
.officialProvider {
  --el-card-padding: 24px;
  margin-bottom: 16px;
  border-color: color-mix(in srgb, var(--el-color-primary) 45%, var(--el-border-color-light));
  background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color-overlay));

  .providerContent {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 20px;
    min-height: 72px;

    .providerMark {
      display: grid;
      place-items: center;
      flex: 0 0 60px;
      height: 60px;
      border-radius: var(--ui-radius-large);
      background: color-mix(in srgb, var(--el-color-primary) 18%, var(--el-bg-color-overlay));

      .providerLogo {
        width: 42px;
        height: 42px;
        object-fit: contain;

        .dark & { filter: invert(1); }
      }
    }

    .providerInfo {
      flex: 1;
      min-width: 120px;

      .providerHeading {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;

        .providerName {
          color: var(--el-text-color-primary);
          font-size: 20px;
          line-height: 1.5;
          font-weight: 600;
        }

        .providerBadges {
          display: inline-flex;
          align-items: center;
          gap: 6px;

          .officialTag {
            --el-tag-bg-color: color-mix(in srgb, var(--el-color-primary) 22%, var(--el-bg-color-overlay));
            --el-tag-border-color: transparent;
            --el-tag-text-color: var(--el-text-color-primary);
          }
        }
      }

      .providerMeta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px 12px;
        margin-top: 8px;

        .loadedStatus {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: var(--el-text-color-regular);
          font-size: 12px;

          .statusIcon { color: var(--el-color-success); }
        }

        .modelCount {
          font-size: 13px;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }
      }
    }

    .viewButton {
      --el-button-text-color: var(--el-text-color-primary);
      --el-button-bg-color: color-mix(in srgb, var(--el-color-primary) 18%, var(--el-bg-color-overlay));
      --el-button-border-color: color-mix(in srgb, var(--el-color-primary) 45%, var(--el-border-color-light));
      --el-button-hover-text-color: var(--el-text-color-primary);
      --el-button-hover-bg-color: color-mix(in srgb, var(--el-color-primary) 26%, var(--el-bg-color-overlay));
      --el-button-hover-border-color: var(--el-color-primary);
      flex-shrink: 0;
      margin-inline-start: auto;
      min-width: 88px;
      height: 36px;
      font-weight: 500;

      &:focus-visible {
        outline: 2px solid var(--el-color-primary);
        outline-offset: 3px;
      }
    }
  }

  @media (max-width: 600px) {
    --el-card-padding: 16px;

    .providerContent {
      gap: 12px;
      min-height: 0;

      .providerMark {
        flex-basis: 48px;
        height: 48px;

        .providerLogo { width: 34px; height: 34px; }
      }

      .providerInfo {
        min-width: 100px;

        .providerHeading {
          gap: 8px;

          .providerName { font-size: 18px; }
        }
      }
    }
  }
}

</style>

<style lang="scss">
.toonflowCatalogDialog {
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 48px);
  padding: 0;
  overflow: hidden;

  &.catalogReady { height: min(760px, 82dvh); }

  .el-dialog__header {
    flex-shrink: 0;
    margin: 0;
    padding: 20px 56px 20px 24px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .catalogHeading {
    display: flex;
    align-items: center;
    gap: 12px;

    .catalogLogo {
      width: 40px;
      height: 40px;
      object-fit: contain;

      .dark & { filter: invert(1); }
    }

    .catalogTitle {
      display: grid;
      gap: 2px;
      min-width: 0;

      h2 {
        margin: 0;
        color: var(--el-text-color-primary);
        font-size: 18px;
        font-weight: 600;
        line-height: 1.5;
      }

      span { color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.5; }
    }
  }

  .el-dialog__body {
    flex: 1;
    min-height: 0;
    padding: 20px 24px 24px;
    overflow: hidden;

    .dialogCatalog {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;

      .catalogToolbar {
        flex-shrink: 0;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--el-border-color-lighter);

        .modelSearch {
          flex: 1 1 220px;
          width: auto;
          max-width: 360px;
          min-width: 0;
        }
      }

      &.textCatalog .catalogToolbar .modelSearch { max-width: none; margin-left: 0; }

      > .el-alert { flex-shrink: 0; }

      .catalogGrid {
        flex: 1;
        min-height: 0;
        grid-auto-rows: max-content;
        align-content: start;
        padding: 2px 6px 2px 2px;
        overflow-y: auto;
        overscroll-behavior: contain;
        scrollbar-gutter: stable;
      }
    }
  }

  @media (max-width: 600px) {
    max-height: calc(100dvh - 32px);

    .el-dialog__header { padding: 16px 48px 16px 16px; }

    .el-dialog__body {
      padding: 16px;

      .dialogCatalog .catalogToolbar {
        align-items: stretch;

        .typeSwitch { width: 100%; }
        .modelSearch { flex-basis: 100%; max-width: none; }
      }
    }
  }
}
</style>
