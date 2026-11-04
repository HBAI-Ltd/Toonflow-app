import { z } from "zod";

export interface PluginDevelopmentHost {
  resolveWorkspacePath(directory: string, path: string, allowMissing?: boolean): Promise<{ path: string }>;
  lockWorkspaceFiles(paths: string[]): () => void;
  installNode(fileName: string, source: string): Promise<{ name: string }>;
  installTool(fileName: string, source: string): Promise<{ name: string }>;
  parsePluginVersion(value: unknown): string | undefined;
}

export type PluginDevelopmentHandler = (directory: string, input: unknown, host: PluginDevelopmentHost, signal?: AbortSignal) => Promise<unknown>;

export type PluginInstallPreview = { type: "node" | "tool"; fileName: string; digest: string };

const pathSchema = z.string().min(1).max(1024).refine(path => !/^(?:[\\/]|[a-z][a-z\d+.-]*:)/i.test(path)
  && !path.split(/[\\/]/).some(part => part === ".." || /[<>:"|?*\x00-\x1f]/.test(part)), "项目路径必须位于当前工作区内");

export const pluginDevelopmentSchema = z.strictObject({
  action: z.enum(["guide", "build", "install", "upload"]),
  type: z.enum(["node", "tool"]).optional().describe("guide 必填：SDK 类型"),
  path: pathSchema.optional().describe("build、install、upload 必填：同一个工作区相对项目目录，如 plugins/myNode"),
}).refine(input => input.action === "guide" ? !!input.type && !input.path : !!input.path && !input.type,
  "guide 只需 type，其他操作只需项目目录 path");

export type PluginUploadDraft = {
  type: "node" | "tool";
  name: string;
  displayName: string;
  description: string;
  version: string;
  fileName: string;
  source: string;
};
