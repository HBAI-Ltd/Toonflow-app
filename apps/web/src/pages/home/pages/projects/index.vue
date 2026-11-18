<template>
  <section class="projectList" aria-labelledby="projectListTitle">
    <h2 id="projectListTitle" class="projectListTitle">项目</h2>
    <div class="projectItems">
      <projectLaunchCard :disabled="disabled" :loading="loading" @create="emit('create')" />
      <projectCard v-for="project in sortedProjects" :key="project.directory" :project="project" :disabled="disabled" :actionsLoading="exportingDirectory === project.directory" @select="emit('open', project)">
        <template #actions>
          <el-dropdown-item :icon="IconEdit" :disabled="disabled || exportingDirectory === project.directory" @click="renameProject(project)">重命名</el-dropdown-item>
          <el-dropdown-item :icon="IconFileZip" :disabled="disabled || !!exportingDirectory" @click="exportProject(project)">打包导出 ZIP</el-dropdown-item>
          <el-dropdown-item class="removeAction" :icon="IconTrash" divided :disabled="disabled || exportingDirectory === project.directory" title="从列表移除，不删除文件" @click="workspaceStore.removeProject(project.directory)">移除项目</el-dropdown-item>
        </template>
      </projectCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import { translate } from "@toonflow/i18n/vue";
import axios from "axios";
import { computed, onUnmounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { IconEdit, IconFileZip, IconTrash } from "@tabler/icons-vue";
import { useWorkspaceStore, type Project } from "@/stores/workspace";
import useWorkspaceFiles from "@/lib/workspaceFiles";
import saveFile from "@/lib/saveFile";
import projectCard from "./projectCard.vue";
import projectLaunchCard from "./projectLaunchCard.vue";

const props = defineProps<{ disabled: boolean; loading: boolean }>();
const emit = defineEmits<{ create: []; open: [project: Project] }>();
const workspaceStore = useWorkspaceStore();
const pageLifetime = new AbortController();
const exportingDirectory = ref("");
const sortedProjects = computed(() => [...workspaceStore.projectList].sort((left, right) => right.lastOpenedAt - left.lastOpenedAt));

onUnmounted(() => pageLifetime.abort());

async function exportProject(project: Project) {
  if (props.disabled || exportingDirectory.value) return;
  const directory = project.directory;
  exportingDirectory.value = directory;
  try {
    let name = project.name.replace(/[<>:"/\\|?*\x00-\x1f\x7f-\x9f]/g, "_").slice(0, 120).replace(/[. ]+$/, "");
    if (!name || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) name = "Toonflow";
    const files = useWorkspaceFiles(directory);
    await saveFile(() => files.exportZip(pageLifetime.signal), `${name}.zip`);
  } catch (error) {
    if (pageLifetime.signal.aborted) return;
    let message = error instanceof Error ? error.message : translate("导出项目失败，请重试");
    if (axios.isAxiosError(error)) {
      const data = error.response?.data instanceof Blob
        ? await error.response.data.text().then(JSON.parse).catch(() => null) : error.response?.data;
      if (typeof data?.message === "string") message = data.message;
    }
    ElMessage.error(message);
  } finally { exportingDirectory.value = ""; }
}

async function renameProject(project: Project) {
  const result = await ElMessageBox.prompt("请输入项目名称", "重命名项目", {
    inputValue: project.name, confirmButtonText: "保存", cancelButtonText: "取消",
    inputValidator: value => !!value?.trim() || "项目名称不能为空",
  }).catch(() => null);
  if (result) workspaceStore.renameProject(project.directory, result.value);
}
</script>

<style lang="scss" scoped>
.projectList {
  max-width: 1280px;
  margin: 0 auto;

  .projectListTitle {
    margin: 0 0 20px;
    font-size: 22px;
    font-weight: 600;
    line-height: 1.5;
  }

  .projectItems {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
    grid-auto-rows: 1fr;
    gap: 20px;
  }
}
</style>
