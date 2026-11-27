import { inject, ref, toValue, watch, type MaybeRefOrGetter } from "vue";
import type { NodeMediaValue } from "./values";
import { useNodePreviewReady } from "./useNodePreviewReady";

export interface WorkspaceFiles {
  list(path?: string): Promise<{ directory: string; entries: { name: string; path: string; type: "file" | "directory" }[] }>;
  read(path: string): Promise<ArrayBuffer>;
  acquireUrl?(path: string, mimeType: string): { url: Promise<string>; release(): void };
  readText(path: string, maxBytes?: number, signal?: AbortSignal): Promise<string>;
  readTextSnapshot(path: string): Promise<{ text: string; revision: string; encoding: "utf-8" | "utf-8-bom" | "utf-16le" | "utf-16be" }>;
  writeTextSnapshot(path: string, text: string, snapshot: { revision: string; encoding: "utf-8" | "utf-8-bom" | "utf-16le" | "utf-16be" }): Promise<string>;
  readJson<T = unknown>(path: string): Promise<T>;
  write(path: string, content: string | Blob | ArrayBuffer, exclusive?: boolean): Promise<void>;
  writeJson(path: string, data: unknown, exclusive?: boolean): Promise<void>;
  rename(path: string, target: string): Promise<void>;
  remove(path: string, recursive?: boolean): Promise<void>;
  mkdir(path: string): Promise<void>;
}

function getNodeDirectory(nodeId: string) {
  if (!nodeId || /[\\/]/.test(nodeId) || nodeId === "." || nodeId === "..") throw new Error("节点 ID 不能作为文件夹名称");
  return `assets/${nodeId}`;
}

export async function uploadNodeFile(files: WorkspaceFiles, nodeId: string, file: File) {
  const directory = getNodeDirectory(nodeId);
  for (const path of ["assets", directory]) {
    await files.mkdir(path).catch((error: { response?: { data?: { data?: { code?: string } } } }) => {
      if (error.response?.data?.data?.code !== "EEXIST") throw error;
    });
  }
  const extension = file.name.match(/\.[a-zA-Z0-9]{1,10}$/)?.[0].toLowerCase() ?? "";
  const path = `${directory}/${crypto.randomUUID()}${extension}`;
  await files.write(path, file, true);
  return path;
}

export type PickNodeAssets = (nodeId: string, accept: string, multiple?: boolean, signal?: AbortSignal) => Promise<File[]>;

export function useNodeFiles() {
  const createFiles = inject<(() => WorkspaceFiles) | undefined>("workspaceFiles", undefined);
  const retainNodeFiles = inject("retainNodeFiles", false);
  // 宿主未提供素材库（如无权限的账号）时为 undefined，节点据此隐藏入口；取消选择或节点已移除时返回 undefined。
  const pickAsset = inject<((nodeId: string, kind: "image" | "video" | "audio") => Promise<File | undefined>) | undefined>("pickNodeAsset", undefined);
  const pickAssets = inject<PickNodeAssets | undefined>("pickNodeAssets", undefined);

  function getWorkspaceFiles() {
    if (!createFiles) throw new Error("当前画布未提供工作区文件能力");
    return createFiles();
  }

  function uploadFile(nodeId: string, file: File) {
    // ACT: 多步上传共用开始时的工作区，避免切换项目后写入另一目录。
    return uploadNodeFile(getWorkspaceFiles(), nodeId, file);
  }

  async function removeNodeFiles(nodeId: string) {
    const directory = getNodeDirectory(nodeId);
    // ACT: 支持撤销的画布保留节点素材，不随节点删除物理文件。
    if (retainNodeFiles) return;
    await getWorkspaceFiles().remove(directory, true).catch((error: { response?: { data?: { data?: { code?: string } } } }) => {
      if (error.response?.data?.data?.code !== "ENOENT") throw error;
    });
  }

  function useFileUrl(file: MaybeRefOrGetter<NodeMediaValue | undefined>, onError: (error: unknown) => void) {
    const fileUrl = ref("");
    const previewReady = useNodePreviewReady();
    watch([() => toValue(file), previewReady], async ([value, ready], _previous, onCleanup) => {
      let cancelled = false;
      let url = "";
      let shared: ReturnType<NonNullable<WorkspaceFiles["acquireUrl"]>> | undefined;
      onCleanup(() => {
        cancelled = true;
        shared?.release();
        if (url) URL.revokeObjectURL(url);
      });
      fileUrl.value = "";
      if (!value || !ready) return;
      try {
        const files = getWorkspaceFiles();
        shared = files.acquireUrl?.(value.url, value.mimeType);
        if (shared) {
          const sharedUrl = await shared.url;
          if (!cancelled) fileUrl.value = sharedUrl;
          return;
        }
        const content = await files.read(value.url);
        if (cancelled) return;
        fileUrl.value = url = URL.createObjectURL(new Blob([content], { type: value.mimeType }));
      } catch (error) {
        if (!cancelled) onError(error);
      }
    }, { immediate: true });
    return fileUrl;
  }

  return { getWorkspaceFiles, uploadFile, removeNodeFiles, useFileUrl, pickAsset, pickAssets };
}
