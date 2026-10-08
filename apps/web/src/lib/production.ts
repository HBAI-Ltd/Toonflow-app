import axios from "axios";
import type { MediaGenerationRequest, GeneratedMedia } from "@toonflow/tools-scaffold/runtime";
import { registerApiLanguage } from "@/lib/i18n";
import { useWorkspaceStore } from "@/stores/workspace";

export type ShotStatus = "draft" | "queued" | "generating" | "review" | "approved" | "needsRedo" | "completed";
export type MediaType = "image" | "video" | "audio";
export type ProductionShot = {
  id: string;
  order: number;
  title: string;
  prompt: string;
  status: ShotStatus;
  providerId?: string;
  modelId?: string;
  mediaType?: MediaType;
  taskId?: string;
  outputDirectory?: string;
  outputPath?: string;
  model?: string;
  duration?: number;
};
export type ProductionManifest = { version: 1; updatedAt: string; exportedPath?: string; shots: ProductionShot[] };
export type MediaTaskStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type MediaTask = {
  id: string;
  directory: string;
  mediaType: MediaType;
  request: MediaGenerationRequest;
  status: MediaTaskStatus;
  createdAt: string;
  updatedAt: string;
  result?: GeneratedMedia[];
  error?: string;
};
export type ExportTaskStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type ExportTask = {
  id: string;
  directory: string;
  outputPath: string;
  inputPaths: string[];
  status: ExportTaskStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  error?: string;
};

type ApiResponse<T> = { code: number; data: T; message?: string };
const client = axios.create({ baseURL: "/api", headers: { "x-toonflow-workspace": "1" } });
registerApiLanguage(client);

export default function useProduction(directory?: string) {
  const workspace = useWorkspaceStore();
  const getDirectory = () => {
    const value = directory ?? workspace.project?.directory;
    if (!value) throw new Error("请先选择工作目录");
    return value;
  };
  async function request<T>(method: "get" | "post" | "put" | "patch", url: string, body?: unknown, signal?: AbortSignal) {
    const config = { signal, ...(method === "get" ? { params: { directory: getDirectory(), ...(body as Record<string, unknown> | undefined) } } : {}) };
    try {
      const response = method === "get"
        ? await client.get<ApiResponse<T>>(url, config)
        : await client.request<ApiResponse<T>>({ method, url, data: { directory: getDirectory(), ...(body as Record<string, unknown> | undefined) }, signal });
      if (response.data.code < 200 || response.data.code >= 300) throw new Error(response.data.message || "生产请求失败");
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error) && error.response?.data?.message) throw new Error(error.response.data.message);
      throw error;
    }
  }

  return {
    getManifest: (signal?: AbortSignal) => request<ProductionManifest>("get", "/production/shots/get", undefined, signal),
    saveManifest: (shots: ProductionShot[], signal?: AbortSignal) => request<ProductionManifest>("put", "/production/shots/save", { shots }, signal),
    updateShot: (shot: ProductionShot, signal?: AbortSignal) => request<ProductionManifest>("patch", "/production/shots/update", { shot }, signal),
    createShotTasks: (shotIds: string[], providerId: string, modelId: string, mediaType?: MediaType, signal?: AbortSignal) =>
      request<{ tasks: { shotId: string; taskId: string }[]; manifest: ProductionManifest }>("post", "/production/shots/generate", { shotIds, providerId, modelId, ...(mediaType ? { mediaType } : {}) }, signal),
    syncShots: (signal?: AbortSignal) => request<{ changed: boolean; manifest: ProductionManifest }>("post", "/production/shots/sync", undefined, signal),
    listMediaTasks: (signal?: AbortSignal) => request<MediaTask[]>("get", "/ai/media/taskList", undefined, signal),
    retryMediaTask: (id: string, signal?: AbortSignal) => request<MediaTask>("post", "/ai/media/taskCancel", { id, retry: true }, signal),
    cancelMediaTask: (id: string, signal?: AbortSignal) => request<MediaTask>("post", "/ai/media/taskCancel", { id }, signal),
    createExportTask: (outputPath: string, inputPaths: string[], signal?: AbortSignal) => request<ExportTask>("post", "/production/export", { outputPath, inputPaths }, signal),
    getExportTask: (id: string, signal?: AbortSignal) => request<ExportTask>("get", "/production/exportStatus", { id }, signal),
    cancelExportTask: (id: string, signal?: AbortSignal) => request<ExportTask>("post", "/production/exportCancel", { id }, signal),
  };
}
