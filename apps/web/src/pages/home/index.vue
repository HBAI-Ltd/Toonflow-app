<template>
  <el-container class="home">
    <bg class="pageBackground" />
    <el-header class="pageHeader">
      <el-button round size="large" :icon="IconSettings" @click="settingsVisible = true">设置</el-button>
      <div class="githubAction">
        <span class="arrowHint starHint">
          点个 Star 支持一下
          <svg viewBox="0 0 84 44" fill="none" aria-hidden="true">
            <path d="M4 29C18 40 44 38 44 18C44 1 21 3 24 19C27 37 57 32 77 16M65 17L77 16L73 28" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <el-button round size="large" :icon="IconBrandGithub" tag="a" href="https://github.com/HBAI-Ltd/Toonflow-app" target="_blank" rel="noopener noreferrer">GitHub</el-button>
      </div>
    </el-header>
    <el-main class="pageContent">
      <section class="creationPanel" aria-label="创建项目">
        <div class="brand">
          <el-image class="brandLogo" :src="logoUrl" fit="contain" alt="Toonflow" />
          <h1>Toonflow</h1>
        </div>
        <div class="promptArea">
          <span class="arrowHint inspirationHint">
            灵感创作模式
            <svg viewBox="0 0 60 60" fill="none" aria-hidden="true">
              <path d="M4 9C21 0 44 5 40 23C36 39 14 34 22 20C30 7 49 21 47 52M38 43L47 52L54 42" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <el-card class="promptCard" shadow="never" :bodyStyle="{ padding: '20px' }" :footerStyle="{ padding: '12px 16px' }">
            <el-input v-model="prompt" type="textarea" :rows="4" resize="none" :disabled="creating || opening" :placeholder="promptPlaceholder" aria-label="创作描述" />
            <template #footer>
              <div class="composerFooter">
                <workspacePicker v-model="workspaceDirectory" :disabled="creating || opening" />
                <el-space class="sendActions" :size="12">
                  <modelPopover v-model="selectedModel" v-model:reasoningEffort="reasoningEffort" class="modelSelect" :disabled="creating || opening" />
                  <el-button class="sendButton" type="primary" circle :icon="IconArrowUp" :loading="creating" :disabled="creating || opening || !workspaceDirectory" aria-label="发送" @click="createProject()" />
                </el-space>
              </div>
            </template>
          </el-card>
        </div>
      </section>
      <section class="projectList" aria-labelledby="projectListTitle">
        <div class="sectionHeader">
          <h2 id="projectListTitle">项目列表</h2>
          <el-space wrap>
            <el-button :icon="iconFolderOpen" :disabled="creating || opening" @click="openProject()">导入项目</el-button>
            <el-button :icon="IconFolderPlus" :disabled="creating || opening" @click="createProject(false)">添加项目</el-button>
            <el-button circle :icon="sortDescending ? IconSortDescending : IconSortAscending" :aria-label="sortDescending ? '按时间降序' : '按时间升序'" @click="sortDescending = !sortDescending" />
            <el-radio-group v-model="viewMode" aria-label="项目视图">
              <el-radio-button value="grid" aria-label="网格视图"><icon-layout-grid :size="16" /></el-radio-button>
              <el-radio-button value="list" aria-label="列表视图"><icon-list :size="16" /></el-radio-button>
            </el-radio-group>
          </el-space>
        </div>
        <div class="projectItems" :class="{ listView: viewMode === 'list' }">
          <el-card v-for="project in sortedProjects" :key="project.directory" class="projectCard" shadow="hover" :bodyStyle="{ padding: '0' }">
            <button class="projectEntry" type="button" :disabled="creating || opening" :aria-label="`打开项目 ${project.name}`" @click="openProject(project)">
              <icon-folder class="projectIcon" :size="28" aria-hidden="true" />
              <span class="projectInfo">
                <span class="projectName" :title="project.name">{{ project.name }}</span>
                <span class="projectPath" :title="project.directory">{{ project.directory }}</span>
                <span class="projectTime">最近打开 {{ new Date(project.lastOpenedAt).toLocaleString('zh-CN', { hour12: false }) }}</span>
              </span>
            </button>
            <div class="projectActions">
              <el-button text :icon="IconEdit" :disabled="creating || opening" :aria-label="`重命名项目 ${project.name}`" title="重命名" @click="renameProject(project)" />
              <el-button text type="danger" :icon="IconTrash" :disabled="creating || opening" :aria-label="`移除项目 ${project.name}`" title="从列表移除，不删除文件" @click="workspaceStore.removeProject(project.directory)" />
            </div>
          </el-card>
        </div>
      </section>
    </el-main>
    <settings v-model="settingsVisible" />
    <workspacePicker ref="relocationPicker" hideTrigger />
  </el-container>
</template>

<script setup lang="ts">
import axios from "axios";
import { storeToRefs } from "pinia";
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  IconSettings, IconBrandGithub,
  IconArrowUp, IconLayoutGrid,
  IconList, IconSortDescending,
  IconSortAscending, IconFolder, IconEdit,
  IconTrash, IconFolderPlus, IconFolderOpen as iconFolderOpen,
} from "@tabler/icons-vue";
import modelPopover from "@/components/modelPopover.vue";
import logoUrl from "@toonflow/assets/logo.svg";
import { useWorkspaceStore, type Project } from "@/stores/workspace";
import useWorkspaceFiles from "@/lib/workspaceFiles";
import settings from "@/components/settings/index.vue";
import bg from "./bg.vue";
import workspacePicker from "./workspacePicker.vue";

const settingsVisible = ref(false);
const router = useRouter();
const creating = ref(false);
const opening = ref(false);
const relocationPicker = ref<InstanceType<typeof workspacePicker>>();
const prompt = ref("");
const workspaceStore = useWorkspaceStore();
const { project, projectList } = storeToRefs(workspaceStore);
const workspaceDirectory = ref(project.value?.directory ?? "");
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
const promptPlaceholder = ref(placeholderPhrases[0]!);

onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let phraseIndex = 0;
  watch(() => !!prompt.value, (hasInput, _previous, onCleanup) => {
    if (hasInput) return;
    let characterCount = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    promptPlaceholder.value = "";

    function typePlaceholder() {
      const phrase = placeholderPhrases[phraseIndex]!;
      characterCount += deleting ? -1 : 1;
      promptPlaceholder.value = phrase.slice(0, characterCount);
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

const selectedModel = ref("");
const reasoningEffort = ref("");
const sortDescending = ref(true);
const viewMode = ref("grid");
const sortedProjects = computed(() => [...projectList.value].sort((left, right) =>
  sortDescending.value ? right.lastOpenedAt - left.lastOpenedAt : left.lastOpenedAt - right.lastOpenedAt
));

async function openProject(project?: Project) {
  if (creating.value || opening.value) return;
  opening.value = true;
  try {
    const directory = project?.directory ?? await relocationPicker.value?.chooseDirectory();
    if (!directory) return;
    try { await workspaceStore.openProject(directory); }
    catch (err) {
      if (!project || !axios.isAxiosError(err) || err.response?.status !== 404) throw err;
      const reselect = await ElMessageBox.confirm(`项目“${project.name}”的文件夹不存在，是否重新选择文件夹？`, "工作目录不存在", {
        confirmButtonText: "重新选择", cancelButtonText: "取消", type: "warning",
      }).then(() => true, () => false);
      if (!reselect) return;
      const directory = await relocationPicker.value?.chooseDirectory();
      if (!directory) return;
      await workspaceStore.openProject(directory, project.directory);
    }
    await router.push("/workspace");
  } catch (err) {
    ElMessage.error(axios.isAxiosError<{ message?: string }>(err)
      ? err.response?.data.message || "无法打开项目，请重试"
      : err instanceof Error ? err.message : "无法打开项目，请重试");
  } finally { opening.value = false; }
}

async function renameProject(project: Project) {
  const result = await ElMessageBox.prompt("请输入项目名称", "重命名项目", {
    inputValue: project.name, confirmButtonText: "保存", cancelButtonText: "取消",
    inputValidator: value => !!value?.trim() || "项目名称不能为空",
  }).catch(() => null);
  if (result) workspaceStore.renameProject(project.directory, result.value);
}

async function createProject(fromPrompt = true) {
  if (creating.value || opening.value || (fromPrompt && !workspaceDirectory.value)) return;
  creating.value = true;
  try {
    let path = workspaceDirectory.value;
    if (!fromPrompt) {
      const confirmed = await ElMessageBox.confirm("请选择一个空文件夹作为项目目录，画布和素材将保存在其中。", "添加项目", {
        confirmButtonText: "选择空文件夹", cancelButtonText: "取消", type: "info",
      }).then(() => true, () => false);
      if (!confirmed) return;
      path = await relocationPicker.value?.chooseDirectory() ?? "";
      if (!path) return;
    }
    const { directory, empty } = await useWorkspaceFiles(path).list();
    if (!empty) return ElMessage.warning("该文件夹不为空，请重新选择空文件夹；已有项目请使用“导入项目”或点击项目列表打开。");
    await useWorkspaceFiles(directory).writeJson("画布1.json", { toonflowCanvas: true, nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }, true);
    await workspaceStore.openProject(directory);
    if (fromPrompt && prompt.value.trim()) {
      workspaceStore.pendingAgentMessage = { directory: workspaceStore.project!.directory, prompt: prompt.value, model: selectedModel.value, reasoningEffort: reasoningEffort.value };
    }
    await router.push("/workspace");
  } catch (err) {
    ElMessage.error(axios.isAxiosError<{ message?: string }>(err)
      ? err.response?.data.message || "创建项目失败，请重试"
      : err instanceof Error ? err.message : "创建项目失败，请重试");
  } finally {
    creating.value = false;
  }
}
</script>

<style lang="scss" scoped>
.home {
  position: relative;
  isolation: isolate;
  min-height: 100dvh;
  color: var(--el-text-color-primary);

  .pageBackground {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
  }

  .arrowHint {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--el-color-primary);
    font-size: 13px;
    white-space: nowrap;
    pointer-events: none;
    animation: hintNudge 2.4s ease-in-out infinite;

    svg {
      width: 56px;
      height: 30px;
      flex-shrink: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }

  .pageHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 72px;
    padding: 0 clamp(20px, 4vw, 56px);

    a {
      text-decoration: none;
    }

    .githubAction {
      position: relative;

      .starHint {
        top: 0;
        right: calc(100% + 12px);
        height: 100%;

        @media (max-width: 560px) {
          top: calc(100% + 6px);
          right: 0;
          height: auto;

          svg { transform: rotate(-45deg); }
        }
      }
    }
  }

  .pageContent {
    padding: 24px clamp(20px, 4vw, 56px) 56px;

    .creationPanel {
      max-width: 800px;
      margin: clamp(32px, 6vh, 64px) auto 56px;

      .brand {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        margin-bottom: 36px;

        .brandLogo {
          width: 48px;
          height: 48px;

          .dark & {
            filter: invert(1);
          }
        }

        h1 {
          margin: 0;
          font-size: clamp(30px, 4vw, 38px);
          font-weight: 600;
          letter-spacing: -1px;
        }
      }

      .promptArea {
        position: relative;

        .inspirationHint {
          bottom: calc(100% + 4px);
          left: 16px;
          height: 30px;
          padding-right: 44px;

          svg {
            position: absolute;
            top: -2px;
            right: 0;
            width: 36px;
            height: 36px;
          }
        }

        .promptCard {
          border-radius: calc(var(--ui-radius) * 2.5);
          border-color: var(--el-border-color-lighter);
          box-shadow: var(--el-box-shadow-lighter);

          &:focus-within {
            border-color: var(--el-color-primary-light-5);
          }

          :deep(.el-textarea__inner) {
            padding: 4px 0;
            box-shadow: none;
            background: transparent;
            font-size: 15px;
            line-height: 1.8;
          }

          :deep(.el-card__footer) {
            background: var(--el-fill-color-extra-light);
          }

          .composerFooter {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;

            .sendActions {
              margin-left: auto;

              .modelSelect {
                width: 190px;
              }

              .sendButton {
                width: 36px;
                height: 36px;
              }
            }
          }
        }
      }
    }

    .projectList {
      max-width: 1040px;
      margin: 0 auto;

      .projectItems {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
        gap: 16px;
        margin-top: 16px;

        &.listView { grid-template-columns: 1fr; }

        .projectCard {
          position: relative;

          .projectActions {
            position: absolute;
            top: 12px;
            right: 8px;
            display: flex;
            gap: 4px;

            .el-button { width: 32px; height: 32px; margin: 0; padding: 0; }
          }
        }

        .projectEntry {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          width: 100%;
          padding: 20px 84px 20px 20px;
          border: 0;
          background: transparent;
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;

          &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
          &:disabled { cursor: wait; opacity: 0.6; }

          .projectIcon { flex-shrink: 0; color: var(--el-color-primary); }

          .projectInfo {
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 0;

            .projectName, .projectPath {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .projectName { font-weight: 600; }
            .projectPath { font-size: 13px; color: var(--el-text-color-regular); }
            .projectTime { font-size: 12px; color: var(--el-text-color-secondary); }
          }
        }
      }

      .sectionHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--el-border-color-lighter);

        h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
      }
    }
  }
}

@keyframes hintNudge {
  0%, 100% { transform: translateX(0) rotate(-3deg); }
  50% { transform: translateX(-6px) rotate(-5deg); }
}
</style>
