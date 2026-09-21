import { basename } from "node:path";
import type { Request } from "express";
import type { DesktopRuntime, updateSnapshot } from "@/types/desktop";

interface DesktopState {
  selectedProviderFile?: { token: string; path: string };
  checkingUpdate: boolean;
  downloadingUpdate: boolean;
  applyingUpdate: boolean;
  updateError: string;
}

function getDesktopState(req: Request): DesktopState {
  return req.app.locals.desktopState ??= { checkingUpdate: false, downloadingUpdate: false, applyingUpdate: false, updateError: "" };
}

export function getDesktopRuntime(req: Request): DesktopRuntime {
  return req.app.locals.desktop;
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
  const file = Bun.file(selected.path);
  if (!(await file.exists())) throw Object.assign(new Error("供应商文件已被移动或删除，请重新选择"), { status: 404 });
  if (file.size > 2 * 1024 * 1024) throw Object.assign(new Error("供应商文件不能超过 2 MB"), { status: 400 });
  return { name: basename(selected.path), source: await file.text(), lastModified: file.lastModified };
}

export async function getDesktopUpdate(req: Request): Promise<updateSnapshot> {
  const { updater } = getDesktopRuntime(req);
  const state = getDesktopState(req);
  const { version, channel, hash } = await updater.getLocalInfo();
  // ACT: Intel 1.18.1 首次检查前没有状态，旧清单也可能缺少状态字段。
  const update = updater.updateInfo();
  if (state.applyingUpdate && update?.error) state.applyingUpdate = false;
  return {
    version, channel, hash,
    latestVersion: update?.version || "",
    latestHash: update?.hash || "",
    error: state.updateError || update?.error || "",
    updateAvailable: update?.updateAvailable ?? false,
    updateReady: update?.updateReady ?? false,
    updating: state.downloadingUpdate || state.applyingUpdate,
    canUpdate: typeof updater.downloadUpdate === "function" && typeof updater.applyUpdate === "function",
  };
}

export async function checkDesktopUpdate(req: Request): Promise<void> {
  const { updater } = getDesktopRuntime(req);
  const state = getDesktopState(req);
  if (state.checkingUpdate || state.downloadingUpdate || state.applyingUpdate)
    throw Object.assign(new Error("更新操作正在执行，请稍后再试。"), { status: 409 });
  state.checkingUpdate = true;
  state.updateError = "";
  try {
    state.updateError = (await updater.checkForUpdate()).error || "";
  } catch (error) {
    state.updateError = String(error);
  } finally {
    state.checkingUpdate = false;
  }
}

export async function downloadDesktopUpdate(req: Request): Promise<void> {
  const { updater } = getDesktopRuntime(req);
  const state = getDesktopState(req);
  if (!updater.downloadUpdate || !updater.applyUpdate)
    throw Object.assign(new Error("当前客户端不支持应用内更新，请下载安装包。"), { status: 400 });
  if (state.checkingUpdate || state.downloadingUpdate || state.applyingUpdate)
    throw Object.assign(new Error("更新操作正在执行，请稍后再试。"), { status: 409 });
  if (!updater.updateInfo()?.updateAvailable)
    throw Object.assign(new Error("请先检查并确认有可用更新。"), { status: 400 });
  state.downloadingUpdate = true;
  state.updateError = "";
  try {
    await updater.downloadUpdate();
    const update = updater.updateInfo();
    if (update?.error || !update?.updateReady) throw new Error(update?.error || "更新包尚未准备完成，请重试。");
  } catch (error) {
    state.updateError = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    state.downloadingUpdate = false;
  }
}

export async function applyDesktopUpdate(req: Request): Promise<void> {
  const { updater } = getDesktopRuntime(req);
  const state = getDesktopState(req);
  if (!updater.downloadUpdate || !updater.applyUpdate)
    throw Object.assign(new Error("当前客户端不支持应用内更新，请下载安装包。"), { status: 400 });
  if (state.checkingUpdate || state.downloadingUpdate || state.applyingUpdate)
    throw Object.assign(new Error("更新操作正在执行，请稍后再试。"), { status: 409 });
  if (!updater.updateInfo()?.updateReady)
    throw Object.assign(new Error("请先下载更新。"), { status: 400 });
  state.applyingUpdate = true;
  state.updateError = "";
  try {
    await updater.applyUpdate();
    const error = updater.updateInfo()?.error;
    if (error) throw new Error(error);
    // ACT: 成功后宿主即将退出，保持互斥直到进程结束。
  } catch (error) {
    state.applyingUpdate = false;
    state.updateError = error instanceof Error ? error.message : String(error);
    throw error;
  }
}
