<template>
  <el-dialog :modelValue="true" class="exploreDetailDialog" :title="detail?.title || '作品详情'" width="min(1200px, 94vw)" alignCenter appendToBody destroyOnClose :closeOnClickModal="!cloning" :closeOnPressEscape="!cloning" :showClose="false" @update:modelValue="!$event && emit('close')">
    <div class="projectDetail">
      <div class="videoStage" :class="{ videoReady: detail?.videoUrl && !videoFailed }">
        <div class="viewerNavigation">
          <button class="returnButton" type="button" :disabled="cloning" @click="emit('close')"><icon-arrow-left :size="17" aria-hidden="true" /><span>返回探索</span></button>
          <button class="closeButton" type="button" :disabled="cloning" aria-label="关闭作品详情" @click="emit('close')"><icon-x :size="18" aria-hidden="true" /></button>
        </div>
        <div v-if="loading" class="detailLoading" role="status" aria-live="polite">正在加载作品…</div>
        <div v-else-if="loadError" class="detailLoading" role="alert">
          <span>{{ loadError }}</span>
          <el-button @click="loadDetail">重试</el-button>
        </div>
        <div v-else-if="videoFailed" class="detailLoading" role="alert">
          <span>视频加载失败，请重试</span>
          <el-button @click="videoFailed = false">重试</el-button>
        </div>
        <videoPlayer v-else-if="detail?.videoUrl" :key="detail.videoUrl" class="detailPlayer" :src="detail.videoUrl" :label="detail.title" autoplay :active="!processVisible" @error="videoFailed = true" />
        <div v-else-if="detail" class="detailLoading" role="status">该作品暂未提供可播放的视频</div>
      </div>
      <div v-if="detail" class="detailContent">
        <h2 class="projectTitle">{{ detail.title }}</h2>
        <p v-if="detail.description" class="description">{{ detail.description }}</p>
        <div class="detailActions">
          <div class="author">
            <el-avatar :size="32" :src="detail.author.avatarUrl">{{ detail.author.name.slice(0, 1) }}</el-avatar>
            <span>{{ detail.author.name }}</span>
          </div>
          <div class="projectActions">
            <div class="socialActions">
              <el-button text :icon="IconShare" :loading="sharing" @click="shareProject">分享</el-button>
            </div>
            <el-button class="processButton" type="primary" :icon="IconTopologyStar3" :loading="processLoading" @click="showProcess">查看制作过程</el-button>
          </div>
        </div>
        <p v-if="actionError" class="actionError" role="alert">{{ actionError }}</p>
      </div>
    </div>
  </el-dialog>
  <exploreProcess v-if="process" v-model="processVisible" :process="process" :title="detail?.title" :busy="cloning">
    <template #footer>
      <div class="cloneActions">
        <span v-if="cloneStatus" role="status" aria-live="polite">{{ cloneStatus }}</span>
        <el-button type="primary" :icon="IconCopy" :loading="cloning" @click="cloneProject">克隆项目</el-button>
      </div>
      <p v-if="cloneError" class="cloneError" role="alert">{{ cloneError }}</p>
    </template>
  </exploreProcess>
  <workspacePicker ref="directoryPicker" hideTrigger />
</template>

<script setup lang="ts">
import axios from "axios";
import { t, translate } from "@toonflow/i18n/vue";
import { onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { ElMessage } from "element-plus";
import { IconArrowLeft, IconShare, IconTopologyStar3, IconCopy, IconX } from "@tabler/icons-vue";
import type { ExploreDetail, ExploreProcess } from "@toonflow/server/channel";
import http from "@/lib/http";
import { writeClipboardText } from "@/lib/clipboard";
import useWorkspaceFiles from "@/lib/workspaceFiles";
import { useWorkspaceStore } from "@/stores/workspace";
import videoPlayer from "@/components/videoPlayer.vue";
import exploreProcess from "./exploreProcess.vue";
import workspacePicker from "./workspacePicker.vue";

const props = defineProps<{ projectId: string }>();
const emit = defineEmits<{ close: [] }>();
const workspace = useWorkspaceStore();
const directoryPicker = ref<InstanceType<typeof workspacePicker>>();
const videoFailed = ref(false);
const detail = shallowRef<ExploreDetail>();
const process = shallowRef<ExploreProcess>();
const loading = ref(false);
const loadError = ref("");
const actionError = ref("");
const sharing = ref(false);
const processLoading = ref(false);
const processVisible = ref(false);
const cloning = ref(false);
const cloneStatus = ref("");
const cloneError = ref("");
let controller = new AbortController();

function errorMessage(error: unknown, fallback: string) {
  return axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || fallback : error instanceof Error ? error.message : fallback;
}

async function loadDetail() {
  controller.abort();
  controller = new AbortController();
  const { signal } = controller;
  detail.value = undefined;
  process.value = undefined;
  processVisible.value = false;
  processLoading.value = false;
  actionError.value = "";
  loadError.value = "";
  videoFailed.value = false;
  loading.value = true;
  try {
    const project = await http<ExploreDetail>({ method: "POST", url: "/api/channel/community/getExploreProject", data: { projectId: props.projectId }, signal });
    if (signal.aborted) return;
    detail.value = project;
  } catch (error) {
    if (!signal.aborted) loadError.value = errorMessage(error, "加载作品详情失败");
  } finally {
    if (!signal.aborted) loading.value = false;
  }
}

async function shareProject() {
  if (!detail.value || sharing.value) return;
  sharing.value = true;
  actionError.value = "";
  try {
    await writeClipboardText(detail.value.shareUrl);
    ElMessage.success("分享链接已复制");
  } catch (error) {
    actionError.value = errorMessage(error, "复制分享链接失败");
  } finally {
    sharing.value = false;
  }
}

async function showProcess() {
  if (!detail.value || processLoading.value) return;
  if (process.value) { processVisible.value = true; return; }
  const { signal } = controller;
  processLoading.value = true;
  actionError.value = "";
  try {
    const result = await http<ExploreProcess>({ method: "POST", url: "/api/channel/community/getExploreProcess", data: { projectId: detail.value.id }, signal });
    if (signal.aborted) return;
    process.value = result;
    processVisible.value = true;
  } catch (error) {
    if (!signal.aborted) actionError.value = errorMessage(error, "加载制作过程失败");
  } finally {
    if (!signal.aborted) processLoading.value = false;
  }
}

async function cloneProject() {
  const project = detail.value;
  if (!project || cloning.value) return;
  const { signal } = controller;
  cloning.value = true;
  cloneStatus.value = "";
  cloneError.value = "";
  try {
    const parentDirectory = await directoryPicker.value?.chooseDirectory();
    if (!parentDirectory || signal.aborted) return;
    cloneStatus.value = translate("正在下载项目…");
    const { downloadUrl } = await http<{ downloadUrl: string }>({ method: "POST", url: "/api/channel/community/getExploreDownload", data: { projectId: project.id }, signal });
    signal.throwIfAborted();
    const { directory } = await useWorkspaceFiles(parentDirectory).cloneProject({ url: downloadUrl, name: project.title }, signal);
    cloneStatus.value = t`已下载到 ${directory}`;
    await workspace.addProject(directory, project.title);
    cloneStatus.value = t`已添加到项目列表 · ${directory}`;
    ElMessage.success("项目已克隆并添加到项目列表");
  } catch (error) {
    if (!signal.aborted) cloneError.value = errorMessage(error, "克隆项目失败");
  } finally {
    if (!signal.aborted) cloning.value = false;
  }
}

watch(() => props.projectId, loadDetail, { immediate: true });
onBeforeUnmount(() => controller.abort());
</script>

<style scoped lang="scss">
.projectDetail {
  .videoStage {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: min(64dvh, 675px);
    min-height: 240px;
    overflow: hidden;
    background: var(--el-bg-color);

    &.videoReady {
      background: #090b10;

      .viewerNavigation button {
        border-color: rgb(255 255 255 / 16%);
        background: rgb(15 23 42 / 48%);
        color: white;
        backdrop-filter: blur(12px);

        &:hover:not(:disabled) { background: rgb(15 23 42 / 76%); }
      }
    }

    .detailPlayer { width: 100%; height: 100%; }

    .viewerNavigation {
      position: absolute;
      z-index: 3;
      inset: 20px 20px auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      pointer-events: none;

      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 38px;
        border: 1px solid var(--el-border-color);
        background: var(--el-bg-color-overlay);
        color: var(--el-text-color-primary);
        font: inherit;
        font-size: 13px;
        pointer-events: auto;
        cursor: pointer;

        &:hover:not(:disabled) { background: var(--el-fill-color); }
        &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; }
        &:disabled { opacity: 0.5; cursor: wait; }
      }

      .returnButton { gap: 7px; padding: 0 13px; border-radius: var(--ui-radius-large); }
      .closeButton { width: 38px; padding: 0; border-radius: 50%; }
    }

    .detailLoading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 64px 28px;
      color: var(--el-text-color-secondary);
      font-size: 14px;
      line-height: 1.6;
      text-align: center;
    }
  }

  .detailContent {
    padding: 24px 28px;
    background: var(--el-bg-color);

    .projectTitle { margin: 0; color: var(--el-text-color-primary); font-size: 22px; font-weight: 600; line-height: 1.5; overflow-wrap: anywhere; }
    .description { margin: 8px 0 0; color: var(--el-text-color-secondary); font-size: 13px; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.7; }

    .detailActions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px 24px;
      margin-top: 20px;

      .author {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
        color: var(--el-text-color-primary);
        font-size: 13px;

        .el-avatar { flex-shrink: 0; }
        span { overflow-wrap: anywhere; }
      }

      .projectActions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 16px;
        margin-left: auto;

        .socialActions {
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
          padding-right: 16px;
          border-right: 1px solid var(--el-border-color-lighter);

          .el-button { height: 36px; margin: 0; padding: 0 10px; border-radius: var(--ui-radius-large); }
        }

        .processButton { height: 40px; margin: 0; padding: 0 18px; border-radius: var(--ui-radius-large); }
      }
    }

    .actionError { margin: 12px 0 0; color: var(--el-color-danger); overflow-wrap: anywhere; }
  }

  @media (max-width: 680px) {
    .videoStage {
      height: 48dvh;
      min-height: 220px;

      .viewerNavigation { inset: 12px 12px auto; }
    }

    .detailContent {
      padding: 20px;

      .projectTitle { font-size: 19px; }
      .detailActions .projectActions {
        width: 100%;
        justify-content: space-between;
        gap: 12px;

        .socialActions { padding-right: 0; border-right: 0; }
      }
    }
  }
}

.cloneActions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  min-width: 0;
  span { min-width: 0; max-width: clamp(100px, 24vw, 320px); overflow-wrap: anywhere; color: var(--el-text-color-secondary); font-size: 12px; text-align: left; }
  .el-button { flex-shrink: 0; height: 36px; margin: 0; border-radius: var(--ui-radius-large); }
}
.cloneError { max-width: clamp(100px, 28vw, 360px); color: var(--el-color-danger); font-size: 12px; overflow-wrap: anywhere; margin: 6px 0 0; }
</style>

<style lang="scss">
.exploreDetailDialog.el-dialog {
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 32px);
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: calc(var(--ui-radius-large) * 1.5);
  box-shadow: 0 24px 100px rgb(0 0 0 / 28%);

  .el-dialog__header { display: none; }
  .el-dialog__body { min-height: 0; padding: 0; overflow-y: auto; }
}
</style>
