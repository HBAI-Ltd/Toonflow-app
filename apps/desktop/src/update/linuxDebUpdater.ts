import { lstatSync, mkdir, mkdtemp, rename, rm } from "@toonflow/file";
import { file } from "@toonflow/file/bun";
import type { updateSnapshot } from "@toonflow/server/desktop";
import { t } from "@toonflow/server/i18n";
import { execFile, spawn } from "node:child_process";
import { once } from "node:events";
import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import { promisify } from "node:util";
import { downloadPackage, matches, packageAssetName, readInstalledVersion, readPackageManifest, shaPattern, validAsset, type packageAsset, type versionInfo } from "./packageDownload";

const execFileAsync = promisify(execFile);
type debPatch = packageAsset & { fromHash: string; fromSha256: string };
type manifestInfo = { version: string; hash: string; deb: packageAsset & { patch?: debPatch } };
type lifecycle = { requestQuitApproval(): unknown; cancelQuitApproval(approval: unknown): void; quitAfterApproval(approval: unknown): void };

export default function createLinuxDebUpdater(resourcesDirectory: string, dataDirectory: string, lifecycle: lifecycle) {
  const cacheHome = process.env.XDG_CACHE_HOME;
  const cache = join(cacheHome && isAbsolute(cacheHome) ? cacheHome : join(homedir(), ".cache"), "toonflow", "debUpdates");
  const bin = resolve(resourcesDirectory, "../bin");
  let local: versionInfo;
  let target: manifestInfo | undefined;
  let busy = false;
  let state = { version: "", hash: "", updateAvailable: false, updateReady: false, error: "" };
  let updateProgress: updateSnapshot["updateProgress"];

  async function getLocalInfo() {
    local ??= readInstalledVersion(resourcesDirectory, ["stable"]);
    return local;
  }

  async function checkForUpdate() {
    if (busy) throw new Error(t`已有更新任务正在执行`);
    busy = true;
    try {
      const info = await getLocalInfo();
      const next = await readPackageManifest(info, "linux");
      // 旧版清单未记录 DEB 摘要；同构建无须更新，不能用缺少校验值的包执行系统安装。
      if (next.hash !== info.hash && !validAsset(next.deb, `toonflow-${next.version}-linux-${process.arch}.deb`)) {
        throw new Error(t`更新清单不匹配当前应用`);
      }
      target = next;
      const available = next.hash !== info.hash;
      state = { version: next.version, hash: next.hash, error: "", updateAvailable: available,
        updateReady: available && await matches(join(cache, `${next.hash}.deb`), next.deb.sha256, next.deb.size) };
    } catch (error) {
      target = undefined;
      state = { version: "", hash: "", updateAvailable: false, updateReady: false, error: error instanceof Error ? error.message : String(error) };
    } finally { busy = false; }
    return state;
  }

  function download(asset: packageAsset, name: string, path: string) {
    return downloadPackage(local.baseUrl, asset, name, path, progress => { updateProgress = progress; });
  }

  async function findBase(sha256: string) {
    const name = `toonflow-${local.version}-linux-${process.arch}.deb`;
    const candidates = [join(cache, `${local.hash}.deb`), join("/var/cache/apt/archives", `toonflow_${local.version}_${process.arch === "arm64" ? "arm64" : "amd64"}.deb`)];
    const downloads = await execFileAsync("/usr/bin/xdg-user-dir", ["DOWNLOAD"], { timeout: 3000 }).then(result => result.stdout.trim()).catch(() => "");
    for (const directory of new Set([downloads, join(homedir(), "Downloads"), join(homedir(), "下载")])) {
      if (isAbsolute(directory)) candidates.push(join(directory, name));
    }
    for (const path of candidates) if (await matches(path, sha256).catch(() => false)) return path;
  }

  async function downloadUpdate() {
    if (busy) throw new Error(t`已有更新任务正在执行`);
    if (!target || !state.updateAvailable) throw new Error(t`暂无可安装的更新`);
    busy = true;
    state.error = "";
    state.updateReady = false;
    let staging: string | undefined;
    try {
      await mkdir(cache, { recursive: true, mode: 0o700 });
      const dir = lstatSync(cache);
      if (!dir.isDirectory() || dir.uid !== process.getuid!() || (dir.mode & 0o022)) throw new Error(t`更新缓存目录权限无效`);
      const finalPath = join(cache, `${target.hash}.deb`);
      const deb = target.deb;
      if (!await matches(finalPath, deb.sha256, deb.size)) {
        staging = await mkdtemp(join(cache, "download"));
        const nextPath = join(staging, "toonflow.deb");
        const prefix = `${local.channel}-linux-${process.arch}`;
        const patch = deb.patch;
        let patched = false;
        if (patch?.fromHash === local.hash && shaPattern.test(patch.fromSha256) && validAsset(patch, `${prefix}-${local.hash}.deb.patch`)) {
          try {
            const base = await findBase(patch.fromSha256);
            if (base) {
              const patchPath = join(staging, "update.patch");
              await download(patch, patch.file, patchPath);
              await execFileAsync("/usr/bin/prlimit", [`--fsize=${deb.size}`, "--", join(bin, "bspatch"), base, nextPath, patchPath], { timeout: 10 * 60_000 });
              if (!await matches(nextPath, deb.sha256, deb.size)) throw new Error(t`更新包校验失败`);
              patched = true;
            }
          } catch (error) {
            console.warn("DEB 增量更新不可用，改用完整安装包：", error);
            await rm(nextPath, { force: true });
          }
        }
        if (!patched) {
          await download(deb, packageAssetName(local.baseUrl, `${prefix}-${target.hash}.deb`, deb.file), nextPath);
        }
        await rename(nextPath, finalPath);
        console.log(`DEB 更新包已准备：${local.version} → ${target.version}，${patched ? "Patch" : "全量"}`);
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
    if (!target || !state.updateReady) throw new Error(t`请先下载当前版本的更新包`);
    busy = true;
    state.error = "";
    let approval: unknown;
    try {
      const path = join(cache, `${target.hash}.deb`);
      if (!await matches(path, target.deb.sha256, target.deb.size)) {
        state.updateReady = false;
        throw new Error(t`更新包校验失败`);
      }
      approval = lifecycle.requestQuitApproval();
      if (!approval) throw new Error(t`更新重启已取消`);
      const child = Bun.spawn(["/usr/bin/pkexec", "--disable-internal-agent", "/opt/toonflow/bin/applyLinuxDeb",
        target.version, String(target.deb.size), target.deb.sha256], { stdin: file(path), stdout: "ignore", stderr: "pipe" });
      const [code, stderr] = await Promise.all([child.exited, new Response(child.stderr).text()]);
      if (code === 126) throw new Error(t`更新重启已取消`);
      if (code !== 0) throw new Error(stderr.trim() || t`安装更新失败`);
      const installed = await file(join(resourcesDirectory, "version.json")).json();
      if (installed.hash !== target.hash || installed.version !== target.version) throw new Error(t`更新包版本与清单不一致`);
      // 等待旧桌面进程及 SDK 启动器释放单实例锁；由原用户启动，绝不继承安装器的 root 身份。
      const restart = spawn("/bin/sh", ["-c",
        '/usr/bin/timeout 120 /usr/bin/tail --pid="$1" -f /dev/null && /usr/bin/flock -w 90 "$2" /bin/true && exec /usr/bin/toonflow',
        "toonflow", String(process.pid), join(dataDirectory, "desktopInstance.lock")], { detached: true, stdio: "ignore" });
      await once(restart, "spawn");
      restart.unref();
      await rm(join(cache, `${local.hash}.deb`), { force: true }).catch(error => console.warn("无法清理旧 DEB 缓存：", error));
      lifecycle.quitAfterApproval(approval);
    } catch (error) {
      if (approval) lifecycle.cancelQuitApproval(approval);
      busy = false;
      state.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  return { getLocalInfo, checkForUpdate, updateInfo: () => ({ ...state, updateProgress }), downloadUpdate, applyUpdate };
}
