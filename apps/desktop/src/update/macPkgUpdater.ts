import { lstatSync, mkdir, mkdtemp, rename, rm } from "@toonflow/file";
import type { updateSnapshot } from "@toonflow/server/desktop";
import { t } from "@toonflow/server/i18n";
import { homedir } from "node:os";
import { join } from "node:path";
import { openMacInstaller, verifyMacInstaller } from "./macInstaller";
import { downloadPackage, matches, packageAssetName, readInstalledVersion, readPackageManifest, validAsset, type packageAsset, type versionInfo } from "./packageDownload";

type pkgTarget = { version: string; hash: string; pkg: packageAsset; path: string; baseUrl: string };

export default function createMacPkgUpdater(resourcesDirectory: string) {
  const cache = join(homedir(), "Library/Caches/local.toonflow.desktop.pkgUpdates");
  let local: versionInfo;
  let target: pkgTarget | undefined;
  let busy = false;
  let state = { version: "", hash: "", updateAvailable: false, updateReady: false, error: "" };
  let updateProgress: updateSnapshot["updateProgress"];

  async function getLocalInfo() {
    local ??= readInstalledVersion(resourcesDirectory, ["stable", "dev", "canary"]);
    return local;
  }

  function checkRunningVersion() {
    const installed = readInstalledVersion(resourcesDirectory, ["stable"]);
    if (installed.hash === local.hash && installed.version === local.version) return;
    target = undefined;
    state.updateAvailable = false;
    state.updateReady = false;
    throw new Error(t`磁盘上的 Toonflow 已更新，请退出并重新打开应用。`);
  }

  function hasPrivateCache() {
    const dir = lstatSync(cache, { throwIfNoEntry: false });
    if (!dir) return false;
    if (!dir.isDirectory() || dir.uid !== process.getuid!() || (dir.mode & 0o077)) throw new Error(t`更新缓存目录权限无效`);
    return true;
  }

  async function matchesCache(next: pkgTarget) {
    if (!hasPrivateCache()) return false;
    const stat = lstatSync(next.path, { throwIfNoEntry: false });
    return stat?.isFile() && stat.uid === process.getuid!() && !(stat.mode & 0o077)
      && await matches(next.path, next.pkg.sha256, next.pkg.size);
  }

  async function checkForUpdate() {
    if (busy) throw new Error(t`已有更新任务正在执行`);
    busy = true;
    target = undefined;
    state = { version: "", hash: "", updateAvailable: false, updateReady: false, error: "" };
    try {
      const info = await getLocalInfo();
      if (info.channel !== "stable") return state;
      checkRunningVersion();
      const baseUrl = info.baseUrl;
      const next = await readPackageManifest(info, "macos");
      state.version = next.version;
      state.hash = next.hash;
      // 同版本也可能发布新构建；只有已安装相同构建才可忽略旧清单缺少 PKG 摘要。
      if (next.hash === info.hash) return state;
      if (next.pkg === undefined) throw new Error(t`请前往 GitHub 最新发布页或官网 toonflow.net，选择适合当前系统的完整安装包，关闭客户端后重新安装。`);
      if (!validAsset(next.pkg, `toonflow-${next.version}-macos-${process.arch}.pkg`)) throw new Error(t`更新清单不匹配当前应用`);
      const release = { version: next.version, hash: next.hash, pkg: next.pkg, path: join(cache, `${next.pkg.sha256}.pkg`), baseUrl };
      if (await matchesCache(release)) {
        await verifyMacInstaller(release.path, resourcesDirectory, release);
        state.updateReady = true;
      }
      target = release;
      state.updateAvailable = true;
    } catch (error) {
      state.error = error instanceof Error ? error.message : String(error);
    } finally { busy = false; }
    return state;
  }

  async function downloadUpdate() {
    if (busy) throw new Error(t`已有更新任务正在执行`);
    if (!target || !state.updateAvailable || target.baseUrl !== local.baseUrl) throw new Error(t`暂无可安装的更新`);
    busy = true;
    state.error = "";
    state.updateReady = false;
    let staging: string | undefined;
    try {
      await mkdir(cache, { recursive: true, mode: 0o700 });
      if (await matchesCache(target)) {
        await verifyMacInstaller(target.path, resourcesDirectory, target);
      } else {
        staging = await mkdtemp(join(cache, "download"));
        const path = join(staging, target.pkg.file);
        const alias = `stable-macos-${process.arch}-${target.hash}.pkg`;
        await downloadPackage(target.baseUrl, target.pkg, packageAssetName(target.baseUrl, alias, target.pkg.file), path, progress => { updateProgress = progress; });
        await verifyMacInstaller(path, resourcesDirectory, target);
        await rename(path, target.path);
      }
      state.updateReady = true;
    } catch (error) {
      state.error = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      busy = false;
      updateProgress = undefined;
      if (staging) await rm(staging, { recursive: true, force: true });
    }
  }

  async function applyUpdate() {
    if (busy) throw new Error(t`已有更新任务正在执行`);
    if (!target || !state.updateReady || target.baseUrl !== local.baseUrl) throw new Error(t`请先下载当前版本的更新包`);
    busy = true;
    state.error = "";
    try {
      checkRunningVersion();
      if (!await matchesCache(target)) {
        state.updateReady = false;
        throw new Error(t`更新包校验失败`);
      }
      await openMacInstaller(target.path, resourcesDirectory, target);
    } catch (error) {
      state.error = error instanceof Error ? error.message : String(error);
      throw error;
    } finally { busy = false; }
  }

  return { getLocalInfo, checkForUpdate, updateInfo: () => ({ ...state, updateProgress }), downloadUpdate, applyUpdate };
}
