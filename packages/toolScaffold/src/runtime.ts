import type { ToolDefinition } from "@earendil-works/pi-coding-agent";
import type { Rule } from "@form-create/element-ui";
import type { FfmpegFactory } from "@toonflow/ffmpeg/types";
import type { Stats } from "@toonflow/file";
import { z } from "zod";

export type { ToolDefinition } from "@earendil-works/pi-coding-agent";
export type { FfmpegFactory, FfmpegCommand, FfprobeData } from "@toonflow/ffmpeg/types";

export const toolNameSchema = z.string().max(96).regex(/^[a-z][a-zA-Z0-9]*$/);
export const toolMetadataSchema = z.object({
  name: toolNameSchema,
  version: z.string().trim().min(1).max(100).default(""),
  displayName: z.string().trim().min(1).max(100),
  description: z.string().max(2000),
  prompt: z.string().max(20000).default(""),
  readme: z.string().max(200000).default(""),
  components: z.array(z.string().max(96).regex(/^[a-z][a-zA-Z0-9_]*$/)).max(100)
    .refine(names => new Set(names).size === names.length, "工具组件名称不能重复").default([]),
  author: z.string().max(100),
  github: z.string().refine(value => !value || (URL.canParse(value) && new URL(value).origin === "https://github.com" && !new URL(value).username && !new URL(value).password)),
  configRules: z.array(z.record(z.string(), z.json())).max(100),
});

export interface ToolMetadata {
  name: string;
  version?: string;
  displayName: string;
  description: string;
  prompt?: string;
  readme?: string;
  components?: string[];
  author: string;
  github: string;
  configRules: Rule[];
}

export interface NodeToolInfo {
  nodeId: string;
  name: `node:${string}`;
  nodeLabel?: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface NodeToolCall {
  nodeId: string;
  name: `node:${string}`;
  args: Record<string, unknown>;
}

export interface NodeToolsContext {
  readonly tools: NodeToolInfo[];
  readonly version: number;
  list(nodeIds: string[], names?: string[]): IterableIterator<NodeToolInfo>;
  call(request: NodeToolCall, signal?: AbortSignal): Promise<unknown>;
}

export interface CanvasToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface CanvasInfo {
  id: string;
  tools: NodeToolInfo[];
}

export interface CanvasContext extends CanvasInfo {
  getNodeLabel?(nodeId: string): string | undefined;
  call(request: CanvasToolCall, signal?: AbortSignal): Promise<unknown>;
}

export interface MediaModel {
  providerId: string;
  providerLabel: string;
  modelId: string;
  label: string;
  type: "image" | "video" | "audio";
  mode?: unknown;
  imageSizes?: string[];
  imageRatios?: string[];
  durationResolutionMap?: { duration: number[]; resolution: string[] }[];
  audio?: boolean | "optional";
  voices?: { title: string; voice: string }[];
}

export interface MediaReference {
  path: string;
  mimeType: string;
}

export interface MediaGenerationRequest {
  providerId: string;
  modelId: string;
  prompt: string;
  outputDirectory?: string;
  images?: MediaReference[];
  videos?: MediaReference[];
  audios?: MediaReference[];
  firstFrame?: MediaReference;
  lastFrame?: MediaReference;
  ratio?: string;
  size?: string;
  resolution?: string;
  duration?: number;
  generateAudio?: boolean;
  voice?: string;
  speed?: number;
  volume?: number;
  pitch?: number;
  language?: string;
  format?: string;
  sampleRate?: number;
  mode?: "singleImage" | "startEndRequired" | "endFrameOptional" | "startFrameOptional" | "text"
    | (`${"image" | "video" | "audio"}Reference:${number}`)[];
}

export interface GeneratedMedia {
  path: string;
  mimeType: string;
  mediaType: "image" | "video" | "audio";
}

export interface MediaContext {
  listModels(): Promise<MediaModel[]>;
  generateImage(request: MediaGenerationRequest, signal?: AbortSignal): Promise<GeneratedMedia[]>;
  generateVideo(request: MediaGenerationRequest, signal?: AbortSignal): Promise<GeneratedMedia[]>;
  generateAudio(request: MediaGenerationRequest, signal?: AbortSignal): Promise<GeneratedMedia[]>;
}

export interface QuestionField {
  field: string;
  title: string;
  type: "input" | "textarea" | "radio" | "checkbox" | "select" | "inputNumber" | "switch";
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface QuestionRequest {
  title: string;
  question: string;
  options?: string[];
  fields?: QuestionField[];
}

export interface QuestionAnswer {
  answer: string;
  values?: Record<string, string | number | boolean | string[]>;
  skipped?: boolean;
}

export type ToolCall = {
  id: string;
  name: string;
  args?: Record<string, unknown>;
  status: "running" | "success" | "error" | "interrupted";
  result?: string;
  question?: QuestionRequest & { callId: string };
};

export interface QuestionContext {
  ask(toolCallId: string, request: QuestionRequest, signal?: AbortSignal): Promise<QuestionAnswer>;
}

export type SkillScope = "workspace" | "global";
export type SkillLocation = { name: string; scope?: SkillScope; path?: string };
export type SkillDocument = { name: string; scope: SkillScope; path: string; content: string };

export interface SkillContext {
  list(scope?: SkillScope): { name: string; description: string; scope: SkillScope; filePath: string; disableModelInvocation: boolean }[];
  read(request: SkillLocation, signal?: AbortSignal): Promise<SkillDocument>;
  create(request: SkillLocation & { content: string }, signal?: AbortSignal): Promise<Omit<SkillDocument, "content">>;
  update(request: SkillLocation & { content: string }, signal?: AbortSignal): Promise<Omit<SkillDocument, "content">>;
}

export interface ToolFiles {
  readFile(path: string, readOnly?: boolean): Promise<Buffer>;
  access(path: string, readOnly?: boolean): Promise<void>;
  stat(path: string, readOnly?: boolean): Promise<Stats>;
  readdir(path: string, readOnly?: boolean): Promise<string[]>;
  detectImageMimeType(path: string, readOnly?: boolean): Promise<string | null>;
  writeFile(path: string, content: string | Uint8Array, exclusive?: boolean): Promise<void>;
  mkdir(path: string, recursive?: boolean): Promise<void>;
  rename(path: string, target: string): Promise<void>;
  remove(path: string, recursive?: boolean): Promise<void>;
  copyFile(path: string, target: string, exclusive?: boolean): Promise<void>;
  importImage(url: string): Promise<{ path: string; mimeType: string }>;
}

export interface ToolContext {
  assets?: { execute: ToolDefinition["execute"] };
  browser?: {
    execute(sessionId: string, args: Record<string, unknown>, config: Record<string, unknown>, signal?: AbortSignal,
      onUpdate?: Parameters<ToolDefinition["execute"]>[3]): ReturnType<ToolDefinition["execute"]>;
  };
  ffmpeg(signal?: AbortSignal): Promise<FfmpegFactory>;
  media?: MediaContext;
  canvas?: CanvasContext;
  question?: QuestionContext;
  skills?: SkillContext;
  cwd: string;
  config: Record<string, unknown>;
  files: ToolFiles;
  resolvePath(path: string, readOnly?: boolean): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  sdk: Pick<typeof import("@earendil-works/pi-coding-agent"),
    "defineTool" | "createReadToolDefinition" | "createWriteToolDefinition" |
    "createEditToolDefinition" | "createLsToolDefinition" | "detectSupportedImageMimeTypeFromFile">;
}

export interface ToolPlugin {
  validateConfig(config: Record<string, unknown>): Record<string, unknown>;
  createTools(context: ToolContext): ToolDefinition[] | Promise<ToolDefinition[]>;
}
