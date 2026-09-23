import { basename } from "node:path";
import type { Request } from "express";
import conf from "@/utils/conf";
import type { DesktopRuntime, updateSnapshot } from "@/types/desktop";

const updateBaseUrls = {
  official: "https://api.toonflow.net/version/desktopUpdates",
  github: "https://github.com/HBAI-Ltd/Toonflow-app/releases/latest/download",
};

interface DesktopState {
  selectedProviderFile?: { token: string; path: string };
  checkingUpdate: boolean;
  downloadingUpdate: boolean;
  applyingUpdate: boolean;
  updateError: string;
  checkedBaseUrl?: string;
  lastBaseUrl?: string;
}

export function isValidUpdateUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value || value.length > 2048 || value.trim() !== value || !URL.canParse(value)) return false;
  const url = new URL(value);
  return (url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password && !url.search && !url.hash;
}

function getUpdateBaseUrl(): string {
  const settings = conf.get("settings", {});
  if (settings.desktopUpdateSource === "github") return updateBaseUrls.github;
  if (settings.desktopUpdateSource === "custom" && isValidUpdateUrl(settings.desktopUpdateCustomUrl)) return settings.desktopUpdateCustomUrl;
  return updateBaseUrls.official;
}

async function withUpdateSource<T>(updater: DesktopRuntime["updater"], updateBaseUrl: string, run: () => Promise<T>) {
  // ACT: 两版 Mac SDK 和 Windows 更新器均返回缓存对象；只在互斥的更新操作期间覆盖地址。
  const info = await updater.getLocalInfo();
  const baseUrl = info.baseUrl;
  info.baseUrl = updateBaseUrl;
  try {
    return await run();
  } finally {
    info.baseUrl = baseUrl;
  }
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
  const updateBaseUrl = getUpdateBaseUrl();
  const validUpdate = state.checkedBaseUrl === updateBaseUrl;
  if (state.applyingUpdate && update?.error) state.applyingUpdate = false;
  return {
    version, channel, hash,
    latestVersion: validUpdate ? update?.version || "" : "",
    latestHash: validUpdate ? update?.hash || "" : "",
    error: state.lastBaseUrl === updateBaseUrl ? state.updateError || (validUpdate ? update?.error || "" : "") : "",
    updateAvailable: validUpdate && (update?.updateAvailable ?? false),
    updateReady: validUpdate && (update?.updateReady ?? false),
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
  const updateBaseUrl = getUpdateBaseUrl();
  state.checkedBaseUrl = undefined;
  state.lastBaseUrl = updateBaseUrl;
  try {
    state.updateError = (await withUpdateSource(updater, updateBaseUrl, () => updater.checkForUpdate())).error || "";
    if (!state.updateError) state.checkedBaseUrl = updateBaseUrl;
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
  const updateBaseUrl = getUpdateBaseUrl();
  if (state.checkedBaseUrl !== updateBaseUrl)
    throw Object.assign(new Error("更新源已切换，请重新检查更新。"), { status: 400 });
  if (!updater.updateInfo()?.updateAvailable)
    throw Object.assign(new Error("请先检查并确认有可用更新。"), { status: 400 });
  state.downloadingUpdate = true;
  state.updateError = "";
  try {
    await withUpdateSource(updater, updateBaseUrl, () => updater.downloadUpdate!());
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
  const updateBaseUrl = getUpdateBaseUrl();
  if (state.checkedBaseUrl !== updateBaseUrl)
    throw Object.assign(new Error("更新源已切换，请重新检查更新。"), { status: 400 });
  if (!updater.updateInfo()?.updateReady)
    throw Object.assign(new Error("请先下载更新。"), { status: 400 });
  state.applyingUpdate = true;
  state.updateError = "";
  try {
    await withUpdateSource(updater, updateBaseUrl, () => updater.applyUpdate!());
    const error = updater.updateInfo()?.error;
    if (error) throw new Error(error);
    // ACT: 成功后宿主即将退出，保持互斥直到进程结束。
  } catch (error) {
    state.applyingUpdate = false;
    state.updateError = error instanceof Error ? error.message : String(error);
    throw error;
  }
}
