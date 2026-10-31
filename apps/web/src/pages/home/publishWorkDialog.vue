<template>
  <el-dialog v-model="visible" class="publishWorkDialog" :title="projectPickerVisible ? '选择项目' : '发布作品'" width="min(960px, calc(100vw - 32px))" alignCenter appendToBody destroyOnClose :closeOnClickModal="false" :closeOnPressEscape="!submitting" :showClose="!submitting" :beforeClose="close" @closed="emit('closed')">
    <template #header="{ titleId, titleClass }">
      <div class="publishHeader">
        <el-button v-if="projectPickerVisible" ref="backButton" class="backButton" text circle :icon="IconArrowLeft" aria-label="返回发布作品" @click="projectPickerVisible = false" />
        <h2 :id="titleId" :class="titleClass">{{ projectPickerVisible ? '选择项目' : '发布作品' }}</h2>
      </div>
    </template>
    <publishProjectPicker v-if="projectPickerVisible" @select="selectProject" />
    <el-form v-show="!projectPickerVisible" class="publishContent" labelPosition="top" :disabled="submitting" @submit.prevent="publishWork">
      <div class="mediaPanel">
        <el-form-item label="上传作品" required>
          <input ref="workInput" type="file" accept=".mp4,.webm,video/mp4,video/webm" :disabled="submitting" hidden @change="selectMediaInput($event, 'work')" />
          <div class="workUpload" @dragover.prevent @drop.prevent="selectMedia($event.dataTransfer?.files[0], 'work')">
            <videoPlayer v-if="work" class="workPreview" :src="work.url" :label="work.file.name" :active="visible && !projectPickerVisible" />
            <button v-else class="uploadPrompt" type="button" aria-label="上传作品" :disabled="submitting" @click="workInput?.click()">
              <icon-cloud-upload :size="30" stroke="1.5" aria-hidden="true" />
              <strong>点击选择或拖入作品</strong>
              <span>支持 MP4、WebM 视频</span>
            </button>
          </div>
          <div v-if="work" class="selectedFile">
            <span :title="work.file.name">{{ work.file.name }}</span>
            <el-button text size="small" @click="workInput?.click()">更换作品</el-button>
          </div>
        </el-form-item>
        <el-form-item label="上传封面" required>
          <input ref="coverInput" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" :disabled="submitting" hidden @change="selectMediaInput($event, 'cover')" />
          <button class="coverUpload" type="button" :disabled="submitting" :aria-label="cover ? '更换封面' : '上传封面'" @click="coverInput?.click()" @dragover.prevent @drop.prevent="selectMedia($event.dataTransfer?.files[0], 'cover')">
            <span class="coverPreview">
              <img v-if="cover" :src="cover.url" alt="封面预览" />
              <icon-photo-plus v-else :size="27" stroke="1.5" aria-hidden="true" />
            </span>
            <span class="coverText">
              <strong>{{ cover ? '更换封面' : '选择作品封面' }}</strong>
              <span v-if="cover" class="coverName" :title="cover.file.name">{{ cover.file.name }}</span>
              <span v-else>点击或拖入图片</span>
            </span>
            <icon-plus class="coverAction" :size="18" aria-hidden="true" />
          </button>
        </el-form-item>
      </div>
      <div class="detailsPanel">
        <el-form-item label="作品名称" required>
          <el-input v-model="name" placeholder="请输入作品名称" :maxlength="80" showWordLimit aria-required="true" />
        </el-form-item>
        <el-form-item label="作品描述">
          <el-input v-model="description" type="textarea" placeholder="请输入作品描述" :rows="5" :maxlength="500" showWordLimit resize="none" />
        </el-form-item>
        <el-form-item label="公开项目">
          <button ref="projectSelectButton" class="projectSelect" type="button" :disabled="submitting" :aria-label="selectedProject ? '更换项目' : '选择项目'" @click="projectPickerVisible = true">
            <icon-folder :size="24" stroke="1.5" aria-hidden="true" />
            <span>{{ selectedProject?.name || '选择项目' }}</span>
            <icon-plus :size="18" aria-hidden="true" />
          </button>
          <el-button v-if="selectedProject" class="removeProject" text size="small" @click="selectedProject = undefined">移除项目</el-button>
        </el-form-item>
      </div>
    </el-form>
    <div v-if="submitting" class="uploadStatus" role="status" aria-live="polite">
      <span>{{ uploadStatus }}</span>
      <el-progress v-if="uploadProgress !== null" :percentage="uploadProgress" />
    </div>
    <el-alert v-if="uploadError" :title="uploadError" type="error" :closable="false" showIcon />
    <template #footer>
      <el-button :disabled="submitting" @click="close()">{{ projectPickerVisible ? '返回' : '取消' }}</el-button>
      <el-button v-if="!projectPickerVisible" type="primary" :loading="submitting" @click="publishWork">发布作品</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { ElMessage, type ButtonInstance } from "element-plus";
import { IconArrowLeft, IconCloudUpload, IconFolder, IconPhotoPlus, IconPlus } from "@tabler/icons-vue";
import axios from "axios";
import { zip } from "fflate";
import type { ExploreSubmission, ExploreUploadSignature, ExploreUploadSignatureParams } from "@toonflow/server/channel";
import http from "@/lib/http";
import useWorkspaceFiles from "@/lib/workspaceFiles";
import { toonflowAccountToken } from "@/stores/settings";
import videoPlayer from "@/components/videoPlayer.vue";
import publishProjectPicker from "./publishProjectPicker.vue";

const emit = defineEmits<{ closed: [] }>();
const visible = ref(true);
const name = ref("");
const description = ref("");
const workInput = ref<HTMLInputElement>();
const coverInput = ref<HTMLInputElement>();
const work = shallowRef<{ file: File; url: string }>();
const cover = shallowRef<{ file: File; url: string }>();
const selectedProject = shallowRef<{ name: string; directory?: string; files?: File[] }>();
const projectPickerVisible = ref(false);
const projectSelectButton = ref<HTMLButtonElement>();
const backButton = ref<ButtonInstance>();
const submitting = ref(false);
const uploadStatus = ref("");
const uploadProgress = ref<number | null>(null);
const uploadError = ref("");
const maxProjectBytes = 512 * 1024 * 1024;
let controller: AbortController | undefined;

function selectProject(project: { name: string; directory?: string; files?: File[] }) {
  selectedProject.value = project;
  projectPickerVisible.value = false;
}

function close(done?: () => void) {
  if (submitting.value) return;
  if (projectPickerVisible.value) { projectPickerVisible.value = false; return; }
  if (done) done();
  else visible.value = false;
}

watch(projectPickerVisible, async value => {
  await nextTick();
  if (value) {
    projectSelectButton.value?.closest(".el-dialog__body")?.scrollTo({ top: 0 });
    backButton.value?.$el.focus();
  } else projectSelectButton.value?.focus();
});

function selectMedia(file: File | undefined, kind: "work" | "cover") {
  if (!file || submitting.value) return;
  if (!file.size) { ElMessage.warning("文件内容为空，请重新选择"); return; }
  if (file.name.length > 255) { ElMessage.warning("文件名不能超过 255 个字符"); return; }
  const extension = kind === "work" ? /\.(mp4|webm)$/i : /\.(jpe?g|png|webp)$/i;
  if (!extension.test(file.name) || (file.type && !file.type.startsWith(kind === "work" ? "video/" : "image/"))) {
    ElMessage.warning(kind === "cover" ? "封面仅支持 JPG、PNG、WebP 图片" : "作品仅支持 MP4、WebM 视频");
    return;
  }
  const target = kind === "work" ? work : cover;
  if (target.value) URL.revokeObjectURL(target.value.url);
  target.value = { file, url: URL.createObjectURL(file) };
  uploadError.value = "";
}

function selectMediaInput(event: Event, kind: "work" | "cover") {
  const input = event.target as HTMLInputElement;
  selectMedia(input.files?.[0], kind);
  input.value = "";
}

async function prepareProject(project: NonNullable<typeof selectedProject.value>, signal: AbortSignal): Promise<File> {
  let archive: Blob;
  if (project.directory) {
    archive = await useWorkspaceFiles(project.directory).exportZip(signal);
  } else if (project.files?.length === 1 && !project.files[0]!.webkitRelativePath) {
    archive = project.files[0]!;
  } else {
    const selected = project.files ?? [];
    if (!selected.length || selected.length > 20000) throw new Error("项目文件夹须包含 1 至 20000 个文件");
    if (selected.reduce((total, file) => total + file.size, 0) > maxProjectBytes) throw new Error("项目文件总大小不能超过 512 MB");
    const files: Record<string, Uint8Array> = Object.create(null);
    const prefix = `${project.name}/`;
    for (const file of selected) {
      signal.throwIfAborted();
      const path = file.webkitRelativePath.startsWith(prefix) ? file.webkitRelativePath.slice(prefix.length) : "";
      if (!path || /[\\:\u0000-\u001f\u007f]/.test(path) || path.split("/").some(part => !part || part === "." || part === "..") || Object.hasOwn(files, path)) {
        throw new Error("项目包含无效或重复的文件路径，请重新选择文件夹");
      }
      files[path] = new Uint8Array(await file.arrayBuffer());
    }
    signal.throwIfAborted();
    // ACT: 与现有项目导出一样在内存打包，限制为 512 MB；更大项目需改为流式导出与上传。
    const bytes = await new Promise<Uint8Array>((resolve, reject) => {
      const cancel = zip(files, { level: 1 }, (error, bytes) => {
        signal.removeEventListener("abort", abort);
        if (error) reject(error);
        else resolve(bytes);
      });
      function abort() { cancel(); reject(signal.reason); }
      signal.addEventListener("abort", abort, { once: true });
    });
    archive = new Blob([bytes.slice().buffer], { type: "application/zip" });
  }
  signal.throwIfAborted();
  if (!archive.size || archive.size > maxProjectBytes) throw new Error("项目 ZIP 不能为空且不能超过 512 MB");
  const header = new Uint8Array(await archive.slice(0, 4).arrayBuffer());
  if (header[0] !== 0x50 || header[1] !== 0x4b || header[2] !== 0x03 || header[3] !== 0x04) throw new Error("项目不是有效的 ZIP 压缩包");
  return new File([archive], "project.zip", { type: "application/zip" });
}

async function uploadFile(file: File, kind: ExploreUploadSignatureParams["kind"], token: string, signal: AbortSignal): Promise<string> {
  signal.throwIfAborted();
  uploadStatus.value = kind === "cover" ? "正在上传封面…" : kind === "video" ? "正在上传作品视频…" : "正在上传项目…";
  uploadProgress.value = 0;
  const signature = await http<ExploreUploadSignature>({
    method: "POST", url: "/api/channel/community/getExploreUploadSignature", data: { kind, fileName: file.name },
    signal, headers: { Authorization: `Bearer ${token}` },
  });
  signal.throwIfAborted();
  await axios.put(signature.uploadUrl, file, {
    headers: { "Content-Type": signature.contentType }, signal, timeout: 10 * 60 * 1000,
    onUploadProgress: event => {
      if (!signal.aborted && event.total) uploadProgress.value = Math.min(100, Math.round(event.loaded / event.total * 100));
    },
  });
  signal.throwIfAborted();
  return signature.fileKey;
}

async function publishWork() {
  if (submitting.value || projectPickerVisible.value || !visible.value) return;
  const token = toonflowAccountToken.value;
  if (!token) { ElMessage.warning("请先在账号设置中登录"); return; }
  const title = name.value.trim();
  if (!title || title.length > 80) { ElMessage.warning("请填写不超过 80 字的作品名称"); return; }
  if (!work.value || !cover.value) { ElMessage.warning("请选择作品视频和封面"); return; }
  const video = work.value.file;
  const image = cover.value.file;
  const project = selectedProject.value;
  const detail = description.value.trim();
  const request = new AbortController();
  controller = request;
  submitting.value = true;
  uploadError.value = "";
  uploadProgress.value = null;
  uploadStatus.value = project ? "正在打包项目…" : "正在准备上传…";
  try {
    const archive = project ? await prepareProject(project, request.signal) : undefined;
    const coverKey = await uploadFile(image, "cover", token, request.signal);
    const videoKey = await uploadFile(video, "video", token, request.signal);
    const downloadKey = archive ? await uploadFile(archive, "download", token, request.signal) : undefined;
    uploadStatus.value = "正在提交审核…";
    uploadProgress.value = null;
    await http<ExploreSubmission>({
      method: "POST", url: "/api/channel/community/uploadExploreProject", data: { title, description: detail, coverKey, videoKey, downloadKey },
      signal: request.signal, headers: { Authorization: `Bearer ${token}` }, timeout: 65000,
    });
    request.signal.throwIfAborted();
    ElMessage.success("作品已提交，等待审核");
    visible.value = false;
  } catch (error) {
    if (!request.signal.aborted) uploadError.value = error instanceof Error ? error.message : "作品提交失败，请重试";
  } finally {
    if (controller === request) {
      submitting.value = false;
      uploadProgress.value = null;
    }
  }
}

watch(toonflowAccountToken, () => {
  if (!submitting.value) return;
  controller?.abort();
  uploadError.value = "账号已变更，请确认登录账号后重新提交";
}, { flush: "sync" });

onBeforeUnmount(() => {
  controller?.abort();
  if (work.value) URL.revokeObjectURL(work.value.url);
  if (cover.value) URL.revokeObjectURL(cover.value.url);
});
</script>

<style lang="scss">
.publishWorkDialog.el-dialog {
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 32px);
  padding: 24px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);

  .el-dialog__header, .el-dialog__footer { flex-shrink: 0; }

  .el-dialog__header {
    padding-bottom: 24px;

    .publishHeader {
      display: flex;
      align-items: center;
      gap: 10px;

      .backButton { width: 28px; height: 28px; margin: 0; }
      h2 { margin: 0; font-weight: 400; }
    }
  }

  .el-dialog__headerbtn { top: 18px; right: 16px; }
  .el-dialog__footer { padding-top: 24px; }

  .uploadStatus { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
  .el-alert { margin-top: 16px; }

  .el-dialog__body {
    min-height: 0;
    overflow-y: auto;

    .publishContent {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
      gap: 24px;

      .el-form-item:last-child { margin-bottom: 0; }

      button {
        font: inherit;
        cursor: pointer;

        &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; }
      }

      .mediaPanel {
        min-width: 0;

        .workUpload {
          width: 100%;
          height: 218px;
          overflow: hidden;
          border: 1px solid var(--el-border-color-lighter);
          border-radius: var(--el-border-radius-base);
          background: color-mix(in srgb, var(--el-bg-color-overlay) 70%, transparent);
          box-shadow: var(--el-box-shadow-lighter);

          &:hover { border-color: var(--el-color-primary); }
          &:focus-within { outline: 2px solid var(--el-color-primary); outline-offset: 3px; }

          .workPreview { width: 100%; height: 100%; object-fit: contain; }

          .uploadPrompt {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 100%;
            height: 100%;
            padding: 20px;
            border: 0;
            background: transparent;
            color: var(--el-text-color-secondary);
            font-size: 12px;
            line-height: 1.5;

            strong { color: var(--el-text-color-regular); font-size: 14px; font-weight: 400; }
          }
        }

        .selectedFile {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          width: 100%;
          margin-top: 8px;

          > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
        }

        .coverUpload {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          padding: 12px;
          border: 1px solid var(--el-border-color-lighter);
          border-radius: var(--el-border-radius-base);
          background: color-mix(in srgb, var(--el-bg-color-overlay) 70%, transparent);
          box-shadow: var(--el-box-shadow-lighter);
          color: var(--el-text-color-secondary);
          text-align: start;

          &:hover { border-color: var(--el-color-primary); }

          .coverPreview {
            display: grid;
            flex-shrink: 0;
            place-items: center;
            width: 96px;
            height: 64px;
            overflow: hidden;
            border-radius: var(--el-border-radius-base);
            background: var(--el-fill-color);

            img { width: 100%; height: 100%; object-fit: cover; }
          }

          .coverText {
            display: flex;
            flex: 1;
            flex-direction: column;
            gap: 6px;
            min-width: 0;
            font-size: 12px;
            line-height: 1.5;

            strong { color: var(--el-text-color-regular); font-size: 13px; font-weight: 400; }
            .coverName { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          }

          .coverAction { flex-shrink: 0; }
        }
      }

      .detailsPanel {
        min-width: 0;

        .el-form-item {
          .el-textarea__inner { padding-bottom: 24px; }

          .projectSelect {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            min-height: 78px;
            padding: 16px;
            border: 1px solid var(--el-border-color-lighter);
            border-radius: var(--el-border-radius-base);
            background: color-mix(in srgb, var(--el-bg-color-overlay) 70%, transparent);
            box-shadow: var(--el-box-shadow-lighter);
            color: var(--el-text-color-secondary);
            text-align: start;

            &:hover { border-color: var(--el-color-primary); color: var(--el-color-primary); }
            > svg { flex-shrink: 0; }
            > span { flex: 1; min-width: 0; overflow-wrap: anywhere; font-size: 13px; }
          }

          .removeProject { margin-top: 4px; }
        }
      }
    }
  }

  @media (max-width: 680px) {
    padding: 16px;

    .el-dialog__headerbtn { top: 10px; right: 8px; }
    .el-dialog__body {
      .publishContent { grid-template-columns: minmax(0, 1fr); gap: 24px; }
    }
  }
}
</style>
