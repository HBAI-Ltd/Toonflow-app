import type { ToolDefinition } from "@earendil-works/pi-coding-agent";
import type { Rule } from "@form-create/element-ui";
import type { BrowserFfmpegRequest, FfmpegFactory, FfmpegRemoteEvent } from "@toonflow/ffmpeg/types";
import type { Stats } from "@toonflow/file";
import { z } from "zod";
import type { MediaUploadRequest, MediaUploadResult } from "@toonflow/providers";

export type { ToolDefinition } from "@earendil-works/pi-coding-agent";
export type { FfmpegFactory, FfmpegCommand, FfprobeData } from "@toonflow/ffmpeg/types";

export const asrRequestSchema = z.strictObject({
  path: z.string().min(1).max(4096).refine(path => !/^(?:[\\/]|[a-z][a-z\d+.-]*:)/i.test(path)
    && !path.replaceAll("\\", "/").split("/").includes(".."), "音频路径必须位于工作区内"),
  lang: z.string().min(1).max(100).optional(),
});

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
  rules?: Rule[];
  supportsPrice?: boolean;
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

export interface MediaProviderAsset {
  id: string;
  mediaType: "image" | "video" | "audio";
  name?: string;
}

export const providerAssetIdSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,199}$/);
export const providerAssetSchema = z.strictObject({
  id: providerAssetIdSchema,
  mediaType: z.enum(["image", "video", "audio"]),
  name: z.string().max(64).optional(),
});
export const providerAssetsSchema = z.array(providerAssetSchema).max(50)
  .refine(assets => new Set(assets.map(asset => asset.id)).size === assets.length, "官方素材 ID 不能重复");

/** referenceOrder[0] 对应 {{ref 1}}；媒体 index 为分类数组的零基下标。 */
export type VideoReference = { type: "image" | "video" | "audio"; index: number }
  | { type: "firstFrame" | "lastFrame" | "text" };

export interface MediaGenerationRequest {
  providerId: string;
  modelId: string;
  prompt: string;
  other?: Record<string, unknown>;
  outputDirectory?: string;
  images?: MediaReference[];
  videos?: MediaReference[];
  audios?: MediaReference[];
  firstFrame?: MediaReference;
  lastFrame?: MediaReference;
  /** 原引用顺序，媒体 index 为分类数组的零基下标。 */
  referenceOrder?: VideoReference[];
  /** 官方素材 ID，与本地引用分开保存；提交前由支持的供应商素材库校验。 */
  providerAssets?: MediaProviderAsset[];
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
  readFile(path: string, readOnly?: boolean, options?: { signal?: AbortSignal; maxBytes?: number }): Promise<Buffer>;
  access(path: string, readOnly?: boolean): Promise<void>;
  stat(path: string, readOnly?: boolean): Promise<Stats>;
  readdir(path: string, readOnly?: boolean, signal?: AbortSignal): Promise<string[]>;
  detectImageMimeType(path: string, readOnly?: boolean): Promise<string | null>;
  writeFile(path: string, content: string | Uint8Array, exclusive?: boolean): Promise<void>;
  mkdir(path: string, recursive?: boolean): Promise<void>;
  rename(path: string, target: string): Promise<void>;
  remove(path: string, recursive?: boolean): Promise<void>;
  copyFile(path: string, target: string, exclusive?: boolean): Promise<void>;
  importImage(url: string): Promise<{ path: string; mimeType: string }>;
}

export interface ToolContext {
  uploadMedia?: (request: MediaUploadRequest) => Promise<MediaUploadResult>;
  asr: {
    transcribe(path: string, options?: { lang?: string; signal?: AbortSignal }): Promise<string>;
  };
  assets?: { execute: ToolDefinition["execute"] };
  sandbox?: { execute: ToolDefinition["execute"] };
  browser?: {
    execute(sessionId: string, args: Record<string, unknown>, config: Record<string, unknown>, signal?: AbortSignal,
      onUpdate?: Parameters<ToolDefinition["execute"]>[3]): ReturnType<ToolDefinition["execute"]>;
  };
  ffmpeg(signal?: AbortSignal): Promise<FfmpegFactory>;
  executeFfmpeg(request: BrowserFfmpegRequest, emit: (event: FfmpegRemoteEvent) => void, signal?: AbortSignal): Promise<void>;
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
  /** 宿主自动生成链路调用的存储能力，独立于 Agent 工具执行。 */
  uploadMedia?(request: MediaUploadRequest & { config: Record<string, unknown> }): Promise<MediaUploadResult>;
  /** 宿主生成链路调用的官方素材校验；返回结果必须与输入的 id 和 mediaType 一一对应。 */
  resolveProviderAssets?(request: { config: Record<string, unknown>; assets: MediaProviderAsset[]; signal?: AbortSignal }): Promise<MediaProviderAsset[]>;
  /** 显式开放给工作区界面的操作；未声明的 Agent 工具不能通过 HTTP 调用。 */
  clientTools?: Record<string, (context: ToolContext, args: Record<string, unknown>, signal?: AbortSignal) => Promise<unknown>>;
  /** 已授权工作区界面读取短期链接；含凭据的 URL 不应放入 Agent 工具结果。 */
  getClientLink?(request: { id: string; cwd: string; config: Record<string, unknown> }): string | Promise<string>;
}
