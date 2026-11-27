import type { BrowserFfmpegFactory, NodeMediaValue, WorkspaceFiles } from "@toonflow/nodes-scaffold/runtime";
import type { LocalModelClient } from "@toonflow/nodes-scaffold/nodeModel";
import { computed, inject, type Component } from "vue";
import type { Node } from "@vue-flow/core";

export interface ToolField {
  key: string;
  label: string;
  type: "number" | "text" | "textarea" | "select" | "color";
  value: string | number;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
}

export interface MediaTool {
  id: string;
  modelId?: string;
  additionalModelIds?: string[];
  label: string;
  icon?: Component;
  actionLabel?: string;
  editor?: Component;
  group: string;
  fields?: ToolField[];
  presets?: { label: string; values: Record<string, string | number> }[];
  accept?: string;
  multiple?: boolean;
  attachmentsRequired?: boolean;
  attachmentLabel?: string;
  extraInput?: Pick<MediaTool, "accept" | "multiple" | "attachmentLabel">;
  sourceMimeTypes?: string[];
  outputs?: MediaToolOutput[];
  menuField?: string;
  menuPresets?: { label: string; values: Record<string, string | number> }[];
}

export interface MediaToolSelection {
  tool: MediaTool;
  anchor: HTMLElement;
  initialValues?: Record<string, string | number>;
}

export type MediaToolAttachment = File | { nodeId: string; path: string; name: string; mimeType: string };

export interface MediaToolContext {
  directory: string;
  source: NodeMediaValue;
  sourcePreviewUrl?: string;
  model: LocalModelClient;
  reportProgress?: (completed: number, total: number) => void;
  reportOutputs?: (outputs: MediaToolOutput[]) => void;
  workspace: WorkspaceFiles;
  ffmpeg: () => Promise<BrowserFfmpegFactory>;
  values: Record<string, string | number>;
  attachments: string[];
  extraAttachments?: string[];
  outputDirectory: string;
  signal: AbortSignal;
}

export interface MediaToolOutput {
  mimeType: string;
  label?: string;
}

export interface MediaToolResult extends MediaToolOutput {
  path: string;
}

export type MediaToolRunner = (toolId: string, context: MediaToolContext) => Promise<MediaToolResult[]>;

export interface MediaToolResultState {
  readonly text: string;
  readonly cancelling: boolean;
  readonly source?: NodeMediaValue;
  cancel(): void;
}

export function useMediaToolResult(id: string, kind: "image" | "video" | "audio" | "text") {
  const getTask = inject<(id: string) => MediaToolResultState | undefined>("pendingMediaToolResult", () => undefined);
  const task = computed(() => getTask(id));
  const preview = computed(() => {
    const source = task.value?.source;
    return source?.mimeType.toLowerCase().startsWith(kind + "/") ? source : undefined;
  });
  return { task, preview };
}

export interface MediaToolResults {
  add(node: Node, state: MediaToolResultState): void;
  discard(ids: string[]): void;
  commit(nodes: Node[]): void;
}
