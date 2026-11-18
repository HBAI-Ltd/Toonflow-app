<template>
  <div class="homePanel">
    <section class="creationPanel" aria-label="创建项目">
      <div class="brand">
        <el-image class="brandLogo" :src="logoUrl" fit="contain" alt="Toonflow" />
        <h1>今天要做点什么？</h1>
      </div>
      <div class="promptArea">
        <el-card class="promptCard" :class="{ draggingAttachments }" shadow="never" @dragenter.capture="dragEnterAttachments" @dragover.capture="dragOverAttachments" @dragleave.capture="dragLeaveAttachments" @drop.capture="dropAttachments">
          <div v-if="draggingAttachments" class="attachmentDropOverlay" role="status" aria-live="polite">
            <icon-paperclip :size="20" aria-hidden="true" />
            <strong>松开添加附件</strong>
            <span>图片、视频、文档或代码文件</span>
          </div>
          <input ref="attachmentInput" type="file" :accept="attachmentAccept" multiple hidden :disabled="disabled" @change="selectAttachments" />
          <attachmentList v-if="promptAttachments.length" class="promptAttachments" :attachments="promptAttachments" removable restorable :disabled="disabled" @remove="promptAttachments.splice($event, 1)" @restore="restoreAttachment" />
          <el-input ref="promptInput" v-model="prompt" type="textarea" :autosize="{ minRows: 3, maxRows: 8 }" resize="none" :disabled="disabled" :placeholder="promptPlaceholder" aria-label="创作描述" @paste.capture="pasteAttachments" />
          <template #footer>
            <div class="composerFooter">
              <div class="composerTools">
                <el-button class="attachmentButton" text circle :icon="IconPaperclip" :disabled="disabled" aria-label="添加附件" title="添加附件" @click="attachmentInput?.click()" />
                <workspacePicker ref="promptWorkspacePicker" v-model="workspaceDirectory" :disabled="disabled" />
              </div>
              <div class="sendActions">
                <modelPopover v-model="selectedModel" v-model:reasoningEffort="reasoningEffort" class="modelSelect" :disabled="disabled" />
                <el-button class="sendButton" type="primary" :circle="!!workspaceDirectory" :icon="workspaceDirectory ? IconArrowUp : IconFolder" :loading="loading" :disabled="disabled" :aria-label="workspaceDirectory ? '发送' : '选择工作目录'" @click="workspaceDirectory ? submit() : promptWorkspacePicker?.chooseDirectory()">
                  <template v-if="!workspaceDirectory" #default>选择工作目录</template>
                </el-button>
              </div>
            </div>
          </template>
        </el-card>
        <p v-if="!workspaceDirectory" class="workspaceHint" role="status">请先选择一个空文件夹作为工作目录，画布和素材会保存在这里。</p>
      </div>
    </section>
    <section class="previewSection" aria-labelledby="homeProjectsTitle">
      <div class="sectionHeader">
        <h2 id="homeProjectsTitle">项目</h2>
        <button class="moreButton" type="button" @click="emit('showSection', 'projects')">更多<icon-chevron-right :size="16" aria-hidden="true" /></button>
      </div>
      <div class="previewGrid">
        <projectLaunchCard :disabled="disabled" :loading="loading" @create="emit('create')" />
        <projectCard v-for="project in recentProjects" :key="project.directory" :project="project" :disabled="disabled" @select="emit('open', project)" />
      </div>
    </section>
    <section v-if="exploreProjects.length" class="previewSection" aria-labelledby="homeExploreTitle">
      <div class="sectionHeader">
        <h2 id="homeExploreTitle">探索</h2>
        <button class="moreButton" type="button" @click="emit('showSection', 'explore')">更多<icon-chevron-right :size="16" aria-hidden="true" /></button>
      </div>
      <div class="previewGrid exploreGrid">
        <exploreCard v-for="item in exploreProjects" :key="item.id" :item="item" @click="selectedProjectId = item.id" />
      </div>
    </section>
    <exploreDetail v-if="selectedProjectId" :projectId="selectedProjectId" @close="selectedProjectId = ''" />
  </div>
</template>

<script setup lang="ts">
import { locale, translate } from "@toonflow/i18n/vue";
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import { ElMessage, type InputInstance } from "element-plus";
import { getReadableFileMimeType, readableFileAccept } from "@toonflow/server/documentFormats";
import type { ExplorePage, ExploreProject } from "@toonflow/server/channel";
import { IconArrowUp, IconFolder, IconPaperclip } from "@tabler/icons-vue";
import modelPopover from "@/components/modelPopover.vue";
import attachmentList from "@/components/agent/attachmentList.vue";
import { createPastedTextFile, readTextAttachment } from "@/components/agent/textAttachments";
import type { AgentAttachment } from "@/components/agent/types";
import logoUrl from "@toonflow/assets/logo.svg";
import { useWorkspaceStore, type Project } from "@/stores/workspace";
import http from "@/lib/http";
import workspacePicker from "@/pages/home/workspacePicker.vue";
import projectCard from "../projects/projectCard.vue";
import projectLaunchCard from "../projects/projectLaunchCard.vue";
import exploreCard from "../explore/exploreCard.vue";
import exploreDetail from "../explore/exploreDetail.vue";

const props = defineProps<{ disabled: boolean; loading: boolean }>();
const emit = defineEmits<{
  // 新建项目卡片不传请求，由外壳选择文件夹新建或打开。
  create: [request?: { directory: string; prompt: string; attachments: AgentAttachment[]; model: string; reasoningEffort: string }];
  open: [project: Project];
  showSection: [section: string];
}>();
const workspaceStore = useWorkspaceStore();
const pageLifetime = new AbortController();
const recentProjects = computed(() => [...workspaceStore.projectList].sort((left, right) => right.lastOpenedAt - left.lastOpenedAt).slice(0, 3));
const exploreProjects = shallowRef<ExploreProject[]>([]);
const selectedProjectId = ref("");
const promptWorkspacePicker = ref<InstanceType<typeof workspacePicker>>();
const workspaceDirectory = ref(workspaceStore.project?.directory ?? "");
const selectedModel = ref("");
const reasoningEffort = ref("");
const prompt = ref("");
const promptInput = ref<InputInstance>();
const promptAttachments = ref<AgentAttachment[]>([]);
const attachmentInput = ref<HTMLInputElement>();
const attachmentAccept = `image/*,video/*,${readableFileAccept}`;
const draggingAttachments = ref(false);
let attachmentDragDepth = 0;
const placeholderPhrases = [
  "描述你想创作的内容，让灵感从这里开始…",
  "把一个故事灵感，变成一段精彩的短片…",
  "为你的主角设计独特的外形和性格…",
  "创作一段雨夜街头的电影感镜头…",
  "把这段文字拆解成连贯的分镜画面…",
  "为一场奇幻冒险生成场景和角色…",
  "为你的画面配上一段合适的音乐…",
  "写一段温暖的旁白，讲述这个故事…",
  "设计一支富有想象力的产品宣传片…",
  "从一句话开始，搭建你的创作工作流…",
];
const promptPlaceholder = ref(translate(placeholderPhrases[0]!));

onMounted(() => {
  void loadExploreProjects();
  window.addEventListener("dragend", clearAttachmentDrag, true);
  window.addEventListener("drop", clearAttachmentDrag, true);
  window.addEventListener("blur", clearAttachmentDrag);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let phraseIndex = 0;
  watch([() => !!prompt.value, locale], ([hasInput], _previous, onCleanup) => {
    if (reduceMotion) {
      promptPlaceholder.value = translate(placeholderPhrases[0]!);
      return;
    }
    if (hasInput) return;
    const segmenter = new Intl.Segmenter(locale.value, { granularity: "grapheme" });
    const phrases = placeholderPhrases.map(phrase => [...segmenter.segment(translate(phrase))].map(part => part.segment));
    let characterCount = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    promptPlaceholder.value = "";

    function typePlaceholder() {
      const phrase = phrases[phraseIndex]!;
      characterCount += deleting ? -1 : 1;
      promptPlaceholder.value = phrase.slice(0, characterCount).join("");
      let delay = deleting ? 35 : 85;
      if (characterCount === phrase.length) {
        deleting = true;
        delay = 1800;
      } else if (characterCount === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % placeholderPhrases.length;
        delay = 300;
      }
      timer = setTimeout(typePlaceholder, delay);
    }

    timer = setTimeout(typePlaceholder, 300);
    onCleanup(() => clearTimeout(timer));
  }, { immediate: true });
});

onUnmounted(() => {
  pageLifetime.abort();
  window.removeEventListener("dragend", clearAttachmentDrag, true);
  window.removeEventListener("drop", clearAttachmentDrag, true);
  window.removeEventListener("blur", clearAttachmentDrag);
});
watch(() => props.disabled, disabled => {
  if (disabled) clearAttachmentDrag();
}, { flush: "sync" });

// 首页只预览前 3 个作品：云端未开放或加载失败时不显示该区块，完整列表、错误提示与重试在探索面板。
async function loadExploreProjects() {
  try {
    const result = await http<ExplorePage>({ method: "POST", url: "/api/channel/community/getExploreProjects", signal: pageLifetime.signal, data: { limit: 3 } });
    exploreProjects.value = result.list.slice(0, 3);
  } catch (error) {
    if (!pageLifetime.signal.aborted) console.warn("加载探索作品失败", error);
  }
}

function submit() {
  emit("create", { directory: workspaceDirectory.value, prompt: prompt.value, attachments: [...promptAttachments.value], model: selectedModel.value, reasoningEffort: reasoningEffort.value });
}

function pasteAttachments(event: ClipboardEvent) {
  if (props.disabled) return;
  try {
    const files = Array.from(event.clipboardData?.files ?? []);
    if (!files.length) {
      const file = createPastedTextFile(event.clipboardData?.getData("text/plain") ?? "");
      if (file) files.push(file);
    }
    if (!files.length) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    addAttachments(files);
  } catch (error) {
    event.preventDefault();
    event.stopImmediatePropagation();
    ElMessage.error(error instanceof Error ? error.message : "添加附件失败，请重试");
  }
}

function selectAttachments(event: Event) {
  const input = event.target as HTMLInputElement;
  addAttachments(Array.from(input.files ?? []));
  input.value = "";
}

function clearAttachmentDrag() {
  attachmentDragDepth = 0;
  draggingAttachments.value = false;
}

function dragEnterAttachments(event: DragEvent) {
  if (!event.dataTransfer?.types.includes("Files")) return;
  event.preventDefault();
  event.stopPropagation();
  if (props.disabled) return clearAttachmentDrag();
  attachmentDragDepth++;
  draggingAttachments.value = true;
}

function dragOverAttachments(event: DragEvent) {
  if (!event.dataTransfer?.types.includes("Files")) return;
  event.preventDefault();
  event.stopPropagation();
  event.dataTransfer.dropEffect = props.disabled ? "none" : "copy";
  if (props.disabled) return clearAttachmentDrag();
  attachmentDragDepth = Math.max(1, attachmentDragDepth);
  draggingAttachments.value = true;
}

function dragLeaveAttachments(event: DragEvent) {
  if (!draggingAttachments.value) return;
  attachmentDragDepth = Math.max(0, attachmentDragDepth - 1);
  const target = event.currentTarget;
  if (!attachmentDragDepth || (target instanceof Node && event.relatedTarget instanceof Node && !target.contains(event.relatedTarget))) clearAttachmentDrag();
}

function dropAttachments(event: DragEvent) {
  if (!event.dataTransfer?.types.includes("Files")) return;
  event.preventDefault();
  event.stopPropagation();
  clearAttachmentDrag();
  addAttachments(Array.from(event.dataTransfer.files));
}

function addAttachments(files: File[]) {
  if (props.disabled) return;
  for (const file of files) {
    const readableMimeType = getReadableFileMimeType(file.name, file.type);
    const mimeType = readableMimeType ?? file.type.split(";")[0]!.trim().toLowerCase();
    if (!readableMimeType && !/^(image|video)\//.test(mimeType)) {
      ElMessage.warning("只支持图片、视频和受支持的文本或文档文件");
      continue;
    }
    if (!file.size || file.size > 100 * 1024 * 1024) {
      ElMessage.warning("附件不能为空且不能超过 100 MB");
      continue;
    }
    if (mimeType === "text/plain" && file.size > 400000) {
      ElMessage.warning("文本附件不能超过 400 KB（400000 字节），请缩减内容后重试。");
      continue;
    }
    if (promptAttachments.value.length >= 20) {
      ElMessage.warning("每条消息最多添加 20 个附件");
      break;
    }
    promptAttachments.value.push({ name: file.name, path: "", mimeType, file });
  }
}

async function restoreAttachment(index: number) {
  const attachment = promptAttachments.value[index];
  if (attachment?.mimeType !== "text/plain" || props.disabled) return;
  try {
    const text = await readTextAttachment(attachment);
    const currentIndex = promptAttachments.value.indexOf(attachment);
    if (currentIndex < 0 || props.disabled) return;
    prompt.value += `${prompt.value ? "\n" : ""}${text}`;
    promptAttachments.value.splice(currentIndex, 1);
    await nextTick();
    promptInput.value?.focus();
    promptInput.value?.textarea?.setSelectionRange(prompt.value.length, prompt.value.length);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "取回文本失败，请重试");
  }
}
</script>

<style lang="scss" scoped>
.homePanel {
  max-width: 1040px;
  margin: clamp(32px, 6vh, 64px) auto 0;

  .creationPanel {
    margin-bottom: 56px;

    .brand {
      display: flex;
      align-items: center;
      gap: clamp(8px, 1vw, 12px);
      margin-bottom: 28px;

      .brandLogo {
        flex-shrink: 0;
        width: clamp(28px, 3.4vw, 44px);
        height: clamp(28px, 3.4vw, 44px);

        .dark & {
          filter: invert(1);
        }
      }

      h1 {
        margin: 0;
        font-size: clamp(22px, 3vw, 34px);
        font-weight: 500;
        line-height: 1.3;
        letter-spacing: -0.5px;
      }
    }

    .promptArea {
      position: relative;

      .promptCard {
        position: relative;
        border-radius: calc(var(--ui-radius) * 3);
        border-color: var(--el-border-color-light);
        background: color-mix(in srgb, var(--el-bg-color-overlay) 70%, transparent);
        box-shadow: 0 12px 36px rgb(0 0 0 / 6%), inset 0 1px 0 color-mix(in srgb, var(--el-text-color-primary) 4%, transparent);
        transition: border-color 0.2s, box-shadow 0.2s;

        &:focus-within, &.draggingAttachments {
          border-color: var(--el-color-primary-light-5);
          box-shadow: 0 12px 36px rgb(0 0 0 / 6%), 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 8%, transparent);
        }

        :deep(.el-card__body) {
          padding: 20px 22px 8px;
        }

        .attachmentDropOverlay {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          border-radius: inherit;
          background: var(--el-bg-color);
          color: var(--el-text-color-primary);
          pointer-events: none;

          > svg { color: var(--el-text-color-secondary); }
          strong { font-size: 14px; font-weight: 500; }
          span { color: var(--el-text-color-secondary); font-size: 12px; }
        }

        .promptAttachments {
          margin-bottom: 12px;
        }

        :deep(.el-textarea__inner) {
          padding: 4px 0;
          box-shadow: none;
          background: transparent;
          font-size: 15px;
          line-height: 1.9;
        }

        :deep(.el-card__footer) {
          padding: 8px 14px 14px;
          border-top: 0;
          background: transparent;
        }

        .composerFooter {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;

          .composerTools {
            display: flex;
            align-items: center;
            flex: 1 1 160px;
            min-width: 0;
            gap: 6px;

            .attachmentButton {
              flex-shrink: 0;
              width: 36px;
              height: 36px;
              margin: 0;
              background: var(--el-fill-color-light);
              color: var(--el-text-color-regular);

              &:hover:not(:disabled) {
                background: var(--el-color-primary-light-9);
                color: var(--el-color-primary);
              }
            }

            :deep(.workspaceButton) {
              max-width: calc(100% - 42px);
              height: 36px;
              margin: 0;
              padding: 0 10px;
              border-radius: calc(var(--ui-radius) * 2);
              color: var(--el-text-color-secondary);
            }
          }

          .sendActions {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            min-width: 0;
            max-width: 100%;
            margin-inline-start: auto;
            gap: 8px;

            .modelSelect {
              min-width: 0;
              max-width: 280px;

              :deep(.modelButton) {
                height: 36px;
                border-radius: calc(var(--ui-radius) * 2);
              }
            }

            .sendButton {
              flex-shrink: 0;
              height: 38px;
              margin: 0;
              border-radius: calc(var(--ui-radius) * 2);

              &.is-circle { width: 38px; border-radius: 50%; }
            }
          }

          @media (max-width: 560px) {
            .composerTools { flex-basis: 100%; }

            .sendActions {
              width: 100%;
              justify-content: space-between;

              .modelSelect { flex: 1; }
            }
          }
        }

        @media (prefers-reduced-motion: reduce) {
          transition: none;
        }
      }

      .workspaceHint {
        margin: 12px 16px 0;
        color: var(--el-text-color-secondary);
        font-size: 12px;
        line-height: 1.7;
      }
    }
  }

  .previewSection {
    margin-bottom: 40px;

    .sectionHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;

      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        line-height: 1.5;
      }

      .moreButton {
        display: inline-flex;
        align-items: center;
        flex-shrink: 0;
        gap: 4px;
        min-height: 32px;
        padding: 0 10px 0 12px;
        border: 0;
        border-radius: calc(var(--ui-radius) * 2);
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
        font: inherit;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover { background: var(--el-color-primary-light-8); }
        &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
        &:dir(rtl) svg { transform: scaleX(-1); }

        @media (prefers-reduced-motion: reduce) { transition: none; }
      }
    }

    // 最宽 1040px 时项目区排 4 列（新建卡片加最近 3 个项目），卡片接近正方形；探索区 3 个作品排满一行。
    .previewGrid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
      gap: 16px;

      &.exploreGrid { grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); }
    }
  }
}
</style>
