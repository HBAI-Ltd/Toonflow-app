import { inject, onScopeDispose, reactive } from "vue";
import { useNodeId } from "@vue-flow/core";

export type NodeDocumentState = { dirty: boolean; error: string; deleted: boolean };

export type NodePersistenceContext = {
  directory: string;
  canvasPath: string;
  save(signal?: AbortSignal): Promise<void>;
};

export function useNodePersistence() {
  return inject<(() => NodePersistenceContext | undefined) | undefined>("nodePersistence", undefined);
}

/**
 * 节点作为独立项目全屏打开（如白模预演），不在画布里；画布中为 undefined。
 * 支持此模式的节点须在 defineOptions 中声明 `nodeProject: true`，挂载后自行打开编辑界面，结束或失败时调用 close。
 */
export type NodeProjectContext = {
  /** 退出项目；打开失败时带上原因，由宿主提示。 */
  close(error?: unknown): void;
  /** 让用户在全局素材库里选位置、给导出文件夹命名（默认 defaultName），返回素材库内路径；取消返回 undefined。无素材库权限时为 undefined。 */
  chooseAssetFolder?(defaultName: string): Promise<string | undefined>;
  /** 存进全局素材库的新文件夹（folder 可带上级目录，重名自动编号，不覆盖），files 的 path 相对该文件夹；返回实际文件夹路径。无素材库权限时为 undefined。 */
  saveAssets?(folder: string, files: { path: string; file: Blob }[], signal?: AbortSignal): Promise<string>;
};

export function useNodeProject() {
  return inject<NodeProjectContext | undefined>("nodeProject", undefined);
}

export type NodeDocumentContext = {
  targets: Map<string, HTMLElement>;
  mounts: Map<string, (target: HTMLElement) => () => void>;
  states: Map<string, { dirty: boolean; error: string }>;
};

export function useNodeDocumentState() {
  const context = inject<NodeDocumentContext | undefined>("nodeDocument", undefined);
  const id = useNodeId();
  const state = reactive({ dirty: false, error: "" });
  if (id) context?.states?.set(id, state);
  onScopeDispose(() => { if (id && context?.states?.get(id) === state) context.states.delete(id); });
  return state;
}
