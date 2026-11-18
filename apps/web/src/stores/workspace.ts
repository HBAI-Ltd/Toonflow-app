import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";
import type { AgentAttachment } from "@/components/agent/types";

export type Project = {
  directory: string;
  name: string;
  lastOpenedAt: number;
};

export const useWorkspaceStore = defineStore("workspace", () => {
  const project = ref<Project | null>(null);
  const projectList = ref<Project[]>([]);
  const projectLoading = ref(false);
  const projectLoadingDrawn = ref(false);
  const projectLoadingVisible = ref(false);
  const pendingAgentMessage = ref<{ directory: string; prompt: string; attachments?: AgentAttachment[]; model: string; reasoningEffort: string } | null>(null);
  // 白模预演打开过的场景文件夹，与普通项目列表分开；最近打开的排在最前。
  const sceneList = ref<Project[]>([]);

  // directory 须为服务端规范化后的目录，避免同一文件夹不同写法重复入列。
  function addScene(directory: string) {
    const existing = sceneList.value.find(item => item.directory === directory);
    const name = existing?.name || directory.split(/[\\/]/).filter(Boolean).at(-1) || directory;
    sceneList.value = [{ directory, name, lastOpenedAt: Date.now() }, ...sceneList.value.filter(item => item.directory !== directory)];
  }

  function renameScene(path: string, name: string) {
    const target = sceneList.value.find(item => item.directory === path);
    if (target && name.trim()) target.name = name.trim();
  }

  // 只从列表移除，不删除场景文件夹。
  function removeScene(path: string) {
    sceneList.value = sceneList.value.filter(item => item.directory !== path);
  }

  async function addProject(path: string, name?: string, signal?: AbortSignal, previousDirectory = path) {
    const { data } = await axios.get<{ code: number; data?: { directory: string }; message?: string }>("/api/workspaces/check", {
      params: { directory: path }, headers: { "x-toonflow-workspace": "1" }, signal,
    });
    signal?.throwIfAborted();
    if (data.code !== 200 || !data.data?.directory) throw new Error(data.message || "工作目录校验失败");
    const checkedDirectory = data.data.directory;
    const existing = projectList.value.find(project => project.directory === previousDirectory)
      ?? projectList.value.find(project => project.directory === checkedDirectory);
    const added = { directory: checkedDirectory, name: name?.trim() || existing?.name || checkedDirectory.split(/[\\/]/).filter(Boolean).at(-1) || checkedDirectory, lastOpenedAt: Date.now() };
    projectList.value = [
      added,
      ...projectList.value.filter(item => item.directory !== previousDirectory && item.directory !== checkedDirectory),
    ];
    return added;
  }

  async function openProject(path: string, previousDirectory = path, signal?: AbortSignal) {
    project.value = await addProject(path, undefined, signal, previousDirectory);
    pendingAgentMessage.value = null;
  }

  function renameProject(path: string, name: string) {
    const target = projectList.value.find(item => item.directory === path);
    if (!target || !name.trim()) return;
    target.name = name.trim();
    if (project.value?.directory === path) project.value = target;
  }

  function removeProject(path: string) {
    projectList.value = projectList.value.filter(item => item.directory !== path);
    if (project.value?.directory === path) project.value = null;
  }

  return { project, projectList, sceneList, projectLoading, projectLoadingDrawn, projectLoadingVisible, pendingAgentMessage, addProject, addScene, renameScene, removeScene, openProject, renameProject, removeProject };
}, {
  persist: {
    key: "toonflow.projectList",
    pick: ["project", "projectList", "sceneList"],
  },
});
