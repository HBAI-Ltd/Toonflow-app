import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";
import { accountEnabled, accountRequest } from "@/lib/account";
import type { AgentAttachment } from "@/components/agent/types";

export type Project = {
  id?: string;
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

  async function loadProjects(initial = false) {
    if (!accountEnabled.value) return;
    if (initial) project.value = null;
    projectList.value = (await accountRequest<Project[]>("projects/list")).map(item => ({ ...item, lastOpenedAt: item.lastOpenedAt ?? 0 }));
  }

  async function createProject(name: string) {
    const added = { ...await accountRequest<Project>("projects/create", { name }), lastOpenedAt: Date.now() };
    projectList.value = [added, ...projectList.value];
    return added;
  }

  async function addProject(path: string, name?: string, signal?: AbortSignal, previousDirectory = path) {
    if (accountEnabled.value) {
      if (!projectList.value.some(item => item.directory === path)) await loadProjects();
      const existing = projectList.value.find(item => item.directory === path);
      if (!existing) throw new Error("项目不存在，请重新加载项目列表");
      existing.lastOpenedAt = Date.now();
      return existing;
    }
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

  async function renameProject(path: string, name: string) {
    const target = projectList.value.find(item => item.directory === path);
    if (!target || !name.trim()) return;
    if (accountEnabled.value) await accountRequest("projects/update", { id: target.id, name: name.trim() }, "PATCH");
    target.name = name.trim();
    if (project.value?.directory === path) project.value = target;
  }

  async function removeProject(path: string) {
    const target = projectList.value.find(item => item.directory === path);
    if (accountEnabled.value && target) await accountRequest("projects/remove", { id: target.id }, "DELETE");
    projectList.value = projectList.value.filter(item => item.directory !== path);
    if (project.value?.directory === path) project.value = null;
  }

  return { project, projectList, projectLoading, projectLoadingDrawn, projectLoadingVisible, pendingAgentMessage, loadProjects, createProject, addProject, openProject, renameProject, removeProject };
}, {
  persist: {
    key: "toonflow.projectList",
    pick: ["project", "projectList"],
  },
});
