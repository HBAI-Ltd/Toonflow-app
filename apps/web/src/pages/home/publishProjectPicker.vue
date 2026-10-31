<template>
  <div class="projectPicker">
    <div class="sourceActions">
      <el-button :icon="IconFolderOpen" @click="folderInput?.click()">选择文件夹</el-button>
      <el-button :icon="IconFileZip" @click="archiveInput?.click()">选择 ZIP 压缩包</el-button>
      <input ref="folderInput" type="file" webkitdirectory multiple hidden @change="selectFolder" />
      <input ref="archiveInput" type="file" accept=".zip,application/zip,application/x-zip-compressed" hidden @change="selectArchive" />
    </div>
    <div v-if="projects.length" class="projectItems">
      <projectCard v-for="project in projects" :key="project.directory" :project="project" actionLabel="选择项目" @select="emit('select', { name: project.name, directory: project.directory })" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";
import { IconFileZip, IconFolderOpen } from "@tabler/icons-vue";
import { useWorkspaceStore } from "@/stores/workspace";
import projectCard from "./projectCard.vue";

const emit = defineEmits<{
  select: [project: { name: string; directory?: string; files?: File[] }];
}>();
const workspace = useWorkspaceStore();
const projects = computed(() => [...workspace.projectList].sort((left, right) => right.lastOpenedAt - left.lastOpenedAt));
const folderInput = ref<HTMLInputElement>();
const archiveInput = ref<HTMLInputElement>();

function selectFolder(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  if (!files.length) return;
  const name = files[0]!.webkitRelativePath.split("/")[0];
  if (!name || !files.every(file => file.webkitRelativePath.startsWith(`${name}/`))) {
    ElMessage.warning("无法读取文件夹，请重新选择");
    return;
  }
  emit("select", { name, files });
}

function selectArchive(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  if (!/\.zip$/i.test(file.name) || !file.size) {
    ElMessage.warning("请选择非空的 ZIP 压缩包");
    return;
  }
  emit("select", { name: file.name, files: [file] });
}
</script>

<style lang="scss" scoped>
.projectPicker {
  .sourceActions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;

    .el-button { margin: 0; }
  }

  .projectItems {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
    grid-auto-rows: 1fr;
    gap: 20px;
  }
}
</style>
