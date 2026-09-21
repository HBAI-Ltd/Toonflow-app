import { createHash, timingSafeEqual } from "node:crypto";
import { realpath, stat } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import type { Request } from "express";
import conf from "@/utils/conf";
import { getAppOrigin } from "@/utils/mcp/control";
import { isWithin } from "@/utils/workspace/files";

export type A2aSettings = {
  enabled: boolean;
  directory: string;
  token: string;
  providerId: string;
  modelId: string;
  thinkingLevel: "off" | "low" | "medium" | "high";
};

let controller = new AbortController();

export function getA2aSettings(): A2aSettings {
  const value = (conf.get("a2a") ?? {}) as Partial<Record<keyof A2aSettings, unknown>>;
  return {
    enabled: value?.enabled === true,
    directory: typeof value?.directory === "string" ? value.directory : "",
    token: typeof value?.token === "string" ? value.token : "",
    providerId: typeof value?.providerId === "string" ? value.providerId : "",
    modelId: typeof value?.modelId === "string" ? value.modelId : "",
    thinkingLevel: value?.thinkingLevel === "low" || value?.thinkingLevel === "medium" || value?.thinkingLevel === "high" ? value.thinkingLevel : "off",
  };
}

export function getA2aUrl(req: Request) {
  return `${req.protocol}://${req.get("host")}/a2a`;
}

export async function resolveA2aWorkspace(path = getA2aSettings().directory) {
  if (!isAbsolute(path)) throw Object.assign(new Error("请配置 A2A 工作目录的绝对路径"), { status: 400 });
  const directory = await realpath(path).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") throw Object.assign(new Error("A2A 工作目录不存在，请重新选择"), { status: 404 });
    throw error;
  });
  if (!(await stat(directory)).isDirectory()) throw Object.assign(new Error("A2A 工作目录必须是文件夹"), { status: 400 });
  const localWorkspace = ["win32", "darwin"].includes(process.platform) && (process.env.NODE_ENV === "dev" || process.env.toonflowDesktop === "1");
  if (localWorkspace) return directory;
  const root = await realpath(resolve(dirname(conf.path), "workspaces")).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return;
    throw error;
  });
  if (!root || !isWithin(root, directory)) throw Object.assign(new Error("服务器部署只能使用服务器工作区"), { status: 403 });
  return directory;
}

export function authenticateA2a(req: Request) {
  const { enabled, token } = getA2aSettings();
  if (!enabled || token.length < 32) return;
  const local = process.env.toonflowDesktop === "1" || (process.env.NODE_ENV === "dev" && ["win32", "darwin"].includes(process.platform));
  if (local && !["localhost", "127.0.0.1", "[::1]"].includes(req.hostname)) return;
  if (req.get("origin")) {
    try { getAppOrigin(req); } catch { return; }
  }
  const actual = Buffer.from(req.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${token}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return;
  return createHash("sha256").update(token).digest("hex");
}

export function getA2aSignal() {
  return controller.signal;
}

conf.onDidChange("a2a", (next, previous) => {
  if (JSON.stringify(next) === JSON.stringify(previous)) return;
  const previousController = controller;
  controller = new AbortController();
  previousController.abort(new Error("A2A 设置已修改，当前任务已取消"));
});
