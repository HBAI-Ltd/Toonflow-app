import { basename } from "node:path";
import { file } from "@toonflow/file/bun";
import type { Request } from "express";
import type { DesktopRuntime } from "@/types/desktop";

interface DesktopState {
  selectedProviderFile?: { token: string; path: string };
}

export function getDesktopRuntime(req: Request): DesktopRuntime {
  return req.app.locals.desktop;
}

function getDesktopState(req: Request): DesktopState {
  return req.app.locals.desktopState ??= {};
}

export async function selectProviderFile(req: Request) {
  const path = await getDesktopRuntime(req).selectProviderFile();
  if (!path) return null;
  if (!/\.ts$/i.test(path)) throw Object.assign(new Error("请选择 .ts 供应商文件"), { status: 400 });
  const selected = { token: crypto.randomUUID(), path };
  getDesktopState(req).selectedProviderFile = selected;
  return { token: selected.token, name: basename(path) };
}

export async function readProviderFile(req: Request, token: string) {
  const selected = getDesktopState(req).selectedProviderFile;
  if (!selected || token !== selected.token) throw Object.assign(new Error("请重新选择并授权供应商文件"), { status: 403 });
  const providerFile = file(selected.path);
  if (!(await providerFile.exists())) throw Object.assign(new Error("供应商文件已被移动或删除，请重新选择"), { status: 404 });
  if (providerFile.size > 2 * 1024 * 1024) throw Object.assign(new Error("供应商文件不能超过 2 MB"), { status: 400 });
  return { name: basename(selected.path), source: await providerFile.text(), lastModified: providerFile.lastModified };
}
