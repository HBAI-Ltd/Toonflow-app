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
