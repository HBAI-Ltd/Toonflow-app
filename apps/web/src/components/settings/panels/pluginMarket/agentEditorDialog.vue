<template>
  <el-dialog v-model="visible" :title="`Agent · ${agent.displayName}`" width="min(1080px, calc(100vw - 32px))" alignCenter appendToBody :beforeClose="close" @closed="emit('closed')">
    <el-alert v-if="error" :title="error" type="error" :closable="false" showIcon />
    <div v-loading="loading" class="agentEditor">
      <nav class="fileList" aria-label="Agent 文件">
        <el-button v-if="readme" text :type="selectedPath === '' ? 'primary' : undefined" @click="selectFile('')"><icon-book :size="15" />说明</el-button>
        <el-button v-for="file in files" :key="file.path" text :type="selectedPath === file.path ? 'primary' : undefined" :disabled="saving" @click="selectFile(file.path)">
          <icon-file :size="15" /><span class="fileName">{{ file.path }}</span><span v-if="file.content !== file.original" class="dirtyMark">●</span>
        </el-button>
      </nav>
      <div class="fileContent">
        <messageMarkdown v-if="!selectedPath" :content="readme" />
        <el-input v-else-if="selectedFile" v-model="selectedFile.content" class="sourceInput" type="textarea" :rows="20" resize="none" :readonly="!canManage" :disabled="saving" :spellcheck="false" :aria-label="selectedPath" />
      </div>
    </div>
    <template #footer>
      <el-button :disabled="saving || confirming" @click="close()">关闭</el-button>
      <el-button v-if="canManage" type="primary" :loading="saving" :disabled="loading || !selectedFile || selectedFile.content === selectedFile.original" @click="save">保存当前文件</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import axios from "axios";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { IconBook, IconFile } from "@tabler/icons-vue";
import messageMarkdown from "@/components/messageMarkdown.vue";
import type { Plugin } from "./types";

const { agent, canManage } = defineProps<{ agent: Plugin; canManage: boolean }>();
const emit = defineEmits<{ saved: []; closed: [] }>();
const visible = ref(true);
const loading = ref(true);
const saving = ref(false);
const confirming = ref(false);
const error = ref("");
const readme = ref("");
const files = ref<{ path: string; content: string; original: string }[]>([]);
const selectedPath = ref("");
const selectedFile = computed(() => files.value.find(file => file.path === selectedPath.value));
const headers = { "x-toonflow-workspace": "1" };
const controller = new AbortController();
onBeforeUnmount(() => controller.abort());
onMounted(async () => {
  try {
    const { data } = await axios.get("/api/agents/read", { params: { name: agent.name }, headers, signal: controller.signal });
    if (data.code !== 200 || !Array.isArray(data.data?.files) || !data.data.files.every((file: { path?: unknown; content?: unknown }) => typeof file.path === "string" && typeof file.content === "string")) {
      throw new Error(data.message || "Agent 文件列表无效");
    }
    files.value = data.data.files.map((file: { path: string; content: string }) => ({ ...file, original: file.content }));
    readme.value = typeof data.data.readme === "string" ? data.data.readme : agent.readme ?? "";
    if (!readme.value) selectedPath.value = files.value[0]?.path ?? "";
  } catch (cause) {
    if (!controller.signal.aborted) error.value = errorMessage(cause);
  } finally { loading.value = false; }
});

function errorMessage(cause: unknown) {
  return axios.isAxiosError(cause) ? cause.response?.data?.message || cause.message : cause instanceof Error ? cause.message : "操作失败";
}

function selectFile(path: string) {
  if (!saving.value) selectedPath.value = path;
}

async function close(done?: () => void) {
  if (saving.value || confirming.value) return;
  if (files.value.some(file => file.content !== file.original)) {
    confirming.value = true;
    try { await ElMessageBox.confirm("修改尚未保存，确定放弃修改并关闭吗？", "未保存的修改", { confirmButtonText: "放弃修改", cancelButtonText: "继续编辑", type: "warning" }); }
    catch { return; }
    finally { confirming.value = false; }
  }
  if (done) done();
  else visible.value = false;
}

async function save() {
  const file = selectedFile.value;
  if (!file || !canManage || saving.value || file.content === file.original) return;
  saving.value = true;
  error.value = "";
  const content = file.content;
  try {
    const { data } = await axios.put("/api/agents/save", { name: agent.name, path: file.path, content }, { headers });
    if (data.code !== 200) throw new Error(data.message || "保存失败");
    file.original = content;
    emit("saved");
    ElMessage.success("已保存");
  } catch (cause) { error.value = errorMessage(cause); }
  finally { saving.value = false; }
}
</script>

<style scoped lang="scss">
.agentEditor {
  display: flex;
  gap: 16px;
  height: min(60vh, 560px);
  min-height: 220px;

  .fileList {
    display: flex;
    flex-direction: column;
    flex: 0 0 min(220px, 30%);
    overflow-y: auto;

    .el-button {
      justify-content: flex-start;
      margin: 0;
      min-height: 32px;
      flex-shrink: 0;
      :deep(> span) { min-width: 0; gap: 6px; }
      .fileName { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .dirtyMark { color: var(--el-color-warning); }
      svg { flex-shrink: 0; }
    }
  }

  .fileContent {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    .sourceInput {
      height: 100%;
      :deep(textarea) { height: 100%; font-family: ui-monospace, Consolas, monospace; line-height: 1.6; tab-size: 2; }
    }
  }
}
</style>
