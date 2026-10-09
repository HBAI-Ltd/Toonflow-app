<template>
  <el-dialog
    v-model="visible"
    class="updateBox"
    width="min(620px, calc(100vw - 32px))"
    alignCenter
    appendToBody
    destroyOnClose
    :showClose="false"
    :closeOnClickModal="false"
    @opened="emit('opened')"
    @close="emit('close')">
    <template #header="{ titleId, close }">
      <div class="updateHeader">
        <div class="versionInfo">
          <h2 :id="titleId" class="updateTitle">Toonflow <span class="versionNumber">v{{ version }}</span></h2>
          <div class="buildInfo"><span class="buildLabel">构建代码</span><code>{{ buildCode }}</code></div>
        </div>
        <button class="closeButton" type="button" aria-label="关闭更新说明" @click="close">
          <icon-x :size="20" aria-hidden="true" />
        </button>
      </div>
    </template>

    <div class="updateBody">
      <div class="artworkSection">
        <svg class="buildArtwork" viewBox="0 0 600 200" role="img" :aria-label="`构建 ${buildCode} 的色块图`">
          <g v-for="(tile, index) in buildTiles" :key="index" :transform="`translate(${index % 6 * 100} ${Math.floor(index / 6) * 100})`">
            <rect width="100" height="100" :fill="tile.background" />
            <g :transform="`rotate(${tile.rotation} 50 50)`" :fill="tile.foreground">
              <path v-if="tile.shape === 0" d="M0 0H100A100 100 0 0 1 0 100Z" />
              <circle v-else-if="tile.shape === 1" cx="50" cy="50" r="38" />
              <path v-else-if="tile.shape === 2" d="M0 0H50V50H100V100H50V50H0Z" />
              <path v-else d="M0 0H100V50H0Z" />
            </g>
          </g>
        </svg>
      </div>

      <section class="releaseSection" aria-label="更新内容">
        <h3 class="releaseTitle">更新内容</h3>
        <div class="releaseContent" tabindex="0" role="region" aria-label="Markdown 更新说明">
          <messageMarkdown v-if="markdown.trim()" :content="markdown" />
        </div>
      </section>
    </div>

    <template #footer>
      <el-button class="confirmButton" type="primary" @click="visible = false">开始使用<icon-arrow-right :size="16" aria-hidden="true" /></el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";
import updateNotes from "./updateBox.md?raw";

const visible = defineModel<boolean>({ default: false });
const emit = defineEmits<{ opened: []; close: [] }>();
const { version, buildCode, markdown = updateNotes } = defineProps<{ version: string; buildCode: string; markdown?: string }>();
const messageMarkdown = defineAsyncComponent(() => import("./messageMarkdown.vue"));

const buildTiles = computed(() => {
  // ACT: 构建码仅用于生成稳定的装饰图案，不作为完整性校验。
  let seed = 2166136261;
  for (const character of buildCode) seed = Math.imul(seed ^ character.codePointAt(0)!, 16777619) >>> 0;
  const palettes = [
    ["#f1eadb", "#d1d8bc", "#7d9486", "#c77e69", "#e1b97a", "#475957"],
    ["#ece9e1", "#b9cddd", "#698798", "#d7977a", "#dbc5a1", "#43566e"],
    ["#eee7df", "#cfbfce", "#9a869f", "#c98478", "#d7b579", "#5e6472"],
    ["#eeeade", "#c7d3b6", "#8fa58e", "#dcad73", "#b87f62", "#536b68"],
  ];
  const palette = palettes[seed % palettes.length]!;
  return Array.from({ length: 12 }, () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const colorIndex = (seed >>> 16) % palette.length;
    return {
      background: palette[colorIndex],
      foreground: palette[(colorIndex + 1 + (seed >>> 24) % (palette.length - 1)) % palette.length],
      shape: (seed >>> 8) % 4,
      rotation: (seed >>> 12) % 4 * 90,
    };
  });
});
</script>

<style lang="scss">
.el-dialog.updateBox {
  --el-dialog-padding-primary: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--ui-radius-large);
  background: var(--el-bg-color-overlay);
  box-shadow: 0 24px 80px #0003;

  .el-dialog__header {
    margin: 0;
    padding: 24px 26px 22px;

    .updateHeader {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;

      .versionInfo {
        min-width: 0;

        .updateTitle {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 10px;
          margin: 0;
          color: var(--el-text-color-primary);
          font-size: 20px;
          line-height: 1.4;
          font-weight: 600;
          letter-spacing: -0.4px;

          .versionNumber { color: var(--el-text-color-regular); font-weight: 400; overflow-wrap: anywhere; }
        }

        .buildInfo {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 6px 10px;
          margin-top: 7px;
          font-size: 11px;
          line-height: 1.6;

          .buildLabel { color: var(--el-text-color-secondary); }
          code { color: var(--el-text-color-secondary); font-family: ui-monospace, "Cascadia Code", Consolas, monospace; overflow-wrap: anywhere; }
        }
      }

      .closeButton {
        display: grid;
        place-items: center;
        flex-shrink: 0;
        width: 30px;
        height: 30px;
        padding: 0;
        border: 0;
        border-radius: var(--ui-radius-small);
        color: var(--el-text-color-secondary);
        background: transparent;
        cursor: pointer;

        &:hover { color: var(--el-text-color-primary); background: var(--el-fill-color); }
        &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
      }
    }
  }

  .el-dialog__body {
    padding: 0;

    .updateBody {
      max-height: 60vh;
      overflow: auto;
      overscroll-behavior: contain;

      .artworkSection {
        padding: 0 26px;

        .buildArtwork {
          display: block;
          width: 100%;
          height: auto;
          overflow: hidden;
          border-radius: var(--ui-radius);
        }
      }

      .releaseSection {
        .releaseTitle {
          margin: 0;
          padding: 26px 26px 12px;
          color: var(--el-text-color-primary);
          font-size: 14px;
          font-weight: 600;
        }

        .releaseContent {
          min-height: 130px;
          padding: 0 26px 16px;
          color: var(--el-text-color-regular);
          font-size: 13px;
          line-height: 1.8;

          &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }

          .messageMarkdown {
            h1, h2, h3, h4 { font-size: 14px; line-height: 1.7; }
            p, ul, ol { margin-top: 8px; margin-bottom: 8px; }
            ul, ol {
              li {
                padding: 3px 0 3px 2px;

                p { margin: 0; }
              }
            }
            a { overflow-wrap: anywhere; }
            img { max-width: 100%; }
          }
        }
      }
    }
  }

  .el-dialog__footer {
    padding: 18px 26px 24px;

    .confirmButton {
      height: 36px;
      padding: 0 18px;
      font-weight: 500;

      svg { margin-left: 12px; }
    }
  }

  @media (max-width: 480px) {
    .el-dialog__header { padding: 20px 20px 18px; }
    .el-dialog__body .updateBody {
      .artworkSection { padding: 0 20px; }
      .releaseSection {
        .releaseTitle { padding: 20px 20px 10px; }
        .releaseContent { padding: 0 20px 12px; }
      }
    }
    .el-dialog__footer { padding: 16px 20px 20px; }
  }
}
</style>
