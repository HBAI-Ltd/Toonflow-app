import { z } from "zod";

export interface PluginDevelopmentHost {
  resolveWorkspacePath(directory: string, path: string, allowMissing?: boolean): Promise<{ path: string }>;
  lockWorkspaceFiles(paths: string[]): () => void;
  installNode(fileName: string, source: string): Promise<{ name: string }>;
  installTool(fileName: string, source: string): Promise<{ name: string }>;
  parsePluginVersion(value: unknown): string | undefined;
}

export type PluginDevelopmentHandler = (directory: string, input: unknown, host: PluginDevelopmentHost, signal?: AbortSignal) => Promise<unknown>;

const pathSchema = z.string().min(1).max(1024).refine(path => !/^(?:[\\/]|[a-z][a-z\d+.-]*:)/i.test(path)
  && !path.split(/[\\/]/).some(part => part === ".." || /[<>:"|?*\x00-\x1f]/.test(part)), "项目路径必须位于当前工作区内");

export const pluginDevelopmentSchema = z.strictObject({
  action: z.enum(["guide", "build", "install", "upload"]),
  type: z.enum(["node", "tool"]).optional().describe("guide 必填：SDK 类型"),
  path: pathSchema.optional().describe("build、install、upload 必填：同一个工作区相对项目目录，如 plugins/myNode"),
}).refine(input => input.action === "guide" ? !!input.type && !input.path : !!input.path && !input.type,
  "guide 只需 type，其他操作只需项目目录 path");

export const pluginManifestSchema = z.strictObject({
  type: z.enum(["node", "tool"]),
  name: z.string().max(96).regex(/^[a-z][a-zA-Z0-9]*$/),
  displayName: z.string().trim().min(1).max(100),
  author: z.string().max(100).default(""),
  github: z.string().max(4096).default(""),
  description: z.string().max(2000).default(""),
  prompt: z.string().max(20000).default(""),
  configRules: z.array(z.record(z.string(), z.json())).max(100).default([]),
  components: z.record(z.string().regex(/^[a-z][a-zA-Z0-9]*$/), pathSchema.refine(path => path.startsWith("src/") && path.endsWith(".vue"))).optional(),
});

export type PluginManifest = z.infer<typeof pluginManifestSchema>;
export type PluginUploadDraft = Pick<PluginManifest, "type" | "name" | "displayName" | "description"> & {
  version: string;
  fileName: string;
  source: string;
};
