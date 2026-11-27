<template>
  <el-dialog
    v-model="visible"
    class="updateBox"
    width="min(680px, calc(100vw - 24px))"
    alignCenter
    appendToBody
    destroyOnClose
    :closeOnClickModal="false"
    :beforeClose="dismiss">
    <template #header="{ titleId }">
      <header class="releaseHeader">
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
        <div class="versionInfo">
          <div class="releaseIdentity">
            <h2 :id="titleId">更新说明</h2><span dir="ltr">Toonflow v{{ version }}</span>
          </div>
          <div class="buildInfo"><span>构建代码</span><code dir="ltr">{{ buildCode }}</code></div>
        </div>
      </header>
    </template>

    <article ref="pageBody" class="releasePage" tabindex="0" aria-label="更新内容">
      <section v-for="category in updateSteps" :key="category.title" class="releaseCategory">
        <h3>{{ translate(category.title) }}</h3>
        <section v-for="section in category.sections" :key="section.title ?? category.title" class="releaseSection">
          <h4 v-if="section.title">{{ translate(section.title) }}</h4>
          <template v-if="section.showMediaCatalog">
            <releaseToolList />
            <frameRatePreview class="releaseVisual" />
          </template>
          <ul class="noteList">
            <li v-for="note in section.notes" :key="note.label">
              <strong>{{ translate(note.label) }}</strong> <span class="noteText">
                <template v-for="(part, index) in translate(note.text).split(commandPattern)" :key="index"><code v-if="index % 2" dir="ltr">{{ part }}</code><template v-else>{{ part }}</template></template>
              </span>
              <div v-if="note.preview === 'layouts'" class="releaseVisual" role="img" :aria-label="Object.values(canvasLayouts).map(layout => translate(layout.label)).join(' / ')">
                <div inert><canvasLayoutOptions :modelValue="generalSettings.canvasLayoutMode" compact /></div>
              </div>
              <el-form v-else-if="note.preview === 'costReminder'" class="releaseVisual costPreview" labelPosition="left" labelWidth="auto" size="small">
                <providerCostFields :enabled="defaultCostReminder.remindersEnabled" :amount="String(defaultCostReminder.reminderAmount)" readOnly />
              </el-form>
              <component v-else-if="note.preview" :is="previewComponents[note.preview]" :kind="note.preview" class="releaseVisual" />
            </li>
          </ul>
        </section>
      </section>
    </article>

    <template #footer>
      <el-button @click="dismiss">完成</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from "vue";
import { translate } from "@toonflow/i18n/vue";
import { canvasLayouts } from "@/lib/canvasLayouts";
import { generalSettings, getMediaCostReminder } from "@/stores/settings";
import canvasLayoutOptions from "@/components/canvasLayoutOptions.vue";
import providerCostFields from "@/components/settings/panels/mediaModel/providerCostFields.vue";
import releaseToolList from "./releaseToolList.vue";
import { updateSteps } from "./updateNotes";

const visible = defineModel<boolean>({ default: false });
const { version, buildCode } = defineProps<{ version: string; buildCode: string }>();
const emit = defineEmits<{ dismiss: [] }>();
const pageBody = ref<HTMLElement>();
const frameRatePreview = defineAsyncComponent(() => import("./frameRatePreview.vue"));
const previsPreview = defineAsyncComponent(() => import("./previsPreview.vue"));
const previewComponents = {
  imageSequence: defineAsyncComponent(() => import("./menuPreview.vue")),
  commands: defineAsyncComponent(() => import("./agentCommandsPreview.vue")),
  canvasAsset: defineAsyncComponent(() => import("./assetMenuPreview.vue")),
  canvasSelection: defineAsyncComponent(() => import("./canvasSelectionPreview.vue")),
  sceneComposer: previsPreview,
  viewfinder: previsPreview,
  assetSearch: previsPreview,
};
const defaultCostReminder = getMediaCostReminder();
const commandPattern = /(\/(?:plan|goal|compact|timer|automations)\b)/g;

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

watch([visible, () => version, () => buildCode], ([open]) => {
  if (open && pageBody.value) pageBody.value.scrollTop = 0;
}, { flush: "post" });

function dismiss() {
  if (!visible.value) return;
  emit("dismiss");
  visible.value = false;
}
</script>

<style lang="scss">
.el-dialog.updateBox {
  --el-dialog-padding-primary: 0;
  --pageGutter: clamp(16px, 4vw, 26px);
  display: flex;
  flex-direction: column;
  max-height: min(730px, calc(100dvh - 28px));
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--ui-radius-large);
  background: var(--el-bg-color-overlay);
  text-align: start;

  .el-dialog__header {
    position: relative;
    flex: none;
    margin: 0;
    padding: 10px var(--pageGutter);
    padding-inline-end: 48px;
    border-block-end: 1px solid var(--el-border-color-lighter);
    .el-dialog__headerbtn {
      inset: auto;
      inset-inline-end: 4px;
      top: 50%;
      transform: translateY(-50%);
      width: 40px;
      height: 40px;
    }
    .releaseHeader {
      display: flex;
      width: fit-content;
      max-width: 100%;
      margin-right: auto;
      align-items: center;
      gap: clamp(8px, 1.5vw, 12px);
      &:dir(rtl) { flex-direction: row-reverse; }
      .versionInfo {
        min-width: 0;
        .releaseIdentity, .buildInfo { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 8px; }
        .releaseIdentity {
          h2 { margin: 0; color: var(--el-text-color-primary); font-size: 15px; line-height: 1.4; font-weight: 600; }
          span { color: var(--el-text-color-regular); font-size: 12px; overflow-wrap: anywhere; }
        }
        .buildInfo {
          margin-top: 1px;
          color: var(--el-text-color-secondary);
          font-size: 11px;
          line-height: 1.4;
          code { min-width: 0; overflow-wrap: anywhere; }
        }
      }
      .buildArtwork { display: block; flex: none; width: clamp(60px, 12vw, 90px); height: auto; border-radius: var(--ui-radius-small); }
    }
  }

  .el-dialog__body {
    flex: 0 1 auto;
    display: flex;
    min-height: 0;
    padding: 0;
    overflow: hidden;
    flex-direction: column;
    .releasePage {
      width: 100%;
      min-height: 0;
      padding: 16px var(--pageGutter) 20px;
      overflow: auto;
      overscroll-behavior: contain;
      overflow-wrap: anywhere;
      color: var(--el-text-color-regular);
      font-size: 13px;
      line-height: 1.8;
      &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
      .releaseCategory {
        & + .releaseCategory { margin-top: 22px; }
        > h3 {
          margin: 0 0 8px;
          color: var(--el-text-color-primary);
          font-size: 15px;
          font-weight: 600;
          line-height: 1.7;
        }
        .releaseSection {
          & + .releaseSection { margin-top: 14px; }
          > h4 {
            margin: 0 0 4px;
            color: var(--el-text-color-primary);
            font-size: 13px;
            font-weight: 600;
          }
          .noteList {
            margin: 6px 0;
            padding-inline-start: 1.25em;
            list-style: disc;
            > li {
              padding-block: 3px;
              > strong { color: var(--el-text-color-primary); font-weight: 600; }
              code { font-size: .95em; }
            }
          }
          .releaseVisual { margin: 8px 0 6px; }
          .costPreview {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            align-items: center;
            gap: 8px 18px;
            max-width: 370px;
            padding-block: 4px;
            .el-form-item { min-width: 0; margin: 0; }
            > .el-text { grid-column: 1 / -1; justify-self: start; }
            @media (max-width: 380px) { grid-template-columns: 1fr; }
          }
        }
      }
    }
  }

  .el-dialog__footer {
    flex: none;
    padding: 12px var(--pageGutter);
    border-top: 1px solid var(--el-border-color-lighter);
  }
  @media (max-width: 480px) {
    .el-dialog__header, .el-dialog__footer { padding-block: 9px; }
  }
}
</style>
