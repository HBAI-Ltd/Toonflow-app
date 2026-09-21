import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const hashPattern = /^[a-zA-Z0-9]{1,64}$/;
const versionPattern = /^\d+\.\d+\.\d+$/;
type versionInfo = { identifier: string; name: string; channel: string; version: string; hash: string; baseUrl: string };
type preparedUpdate = { version: string; hash: string; archiveSha256: string };
type updateLifecycle = { requestQuitApproval(): unknown; cancelQuitApproval(approval: unknown): void; quitAfterApproval(approval: unknown): void };

// ACT: 单人桌面单进程使用一个下载任务；保留现有发布协议和 bspatch，不修改 SDK 缓存。
export default function createWindowsUpdater(resourcesDirectory: string, lifecycle: updateLifecycle) {
  const installDirectory = realpathSync(resolve(resourcesDirectory, "../.."));
  const extractionDirectory = join(installDirectory, "self-extraction");
  const preparedPath = join(extractionDirectory, "preparedUpdate.json");
  const resultPath = join(extractionDirectory, "updateResult.json");
  // ACT: Electrobun 在 Worker 中加载应用，环境变量区分大小写，不能只读取 WINDIR。
  const tarExecutable = join(process.env.SystemRoot ?? process.env.windir ?? process.env.WINDIR!, "System32", "tar.exe");
  let localInfo: versionInfo;
  let manifest: { version: string; hash: string; artifact: { file: string } } | undefined;
  let busy = false;
  let observedResult = "";
  let state = { version: "", hash: "", error: "", updateAvailable: false, updateReady: false };

  function regularFile(path: string) {
    const stat = lstatSync(path, { throwIfNoEntry: false });
    return !!stat?.isFile() && !stat.isSymbolicLink();
  }

  function ensureDirectory() {
    mkdirSync(extractionDirectory, { recursive: true });
    if (!lstatSync(extractionDirectory).isDirectory() || lstatSync(extractionDirectory).isSymbolicLink()) throw new Error("更新缓存目录不能是链接");
  }

  function readPrepared(): preparedUpdate | undefined {
    if (!regularFile(preparedPath)) return;
    try {
      const record = JSON.parse(readFileSync(preparedPath, "utf8"));
      if (typeof record.version === "string" && typeof record.hash === "string" && typeof record.archiveSha256 === "string"
        && versionPattern.test(record.version) && hashPattern.test(record.hash) && /^[a-f0-9]{64}$/.test(record.archiveSha256)
        && regularFile(join(extractionDirectory, `${record.hash}.tar`))) return record;
    } catch { /* ACT: 缓存损坏可重新下载，不影响用户数据。 */ }
  }

  async function getLocalInfo() {
    if (!localInfo) {
      const info = await Bun.file(join(resourcesDirectory, "version.json")).json();
      if (!info || info.identifier !== "local.toonflow.desktop" || !["stable", "canary", "dev"].includes(info.channel)
        || typeof info.version !== "string" || !versionPattern.test(info.version) || typeof info.hash !== "string" || !hashPattern.test(info.hash)
        || typeof info.baseUrl !== "string" || typeof info.name !== "string" || !/^[a-zA-Z0-9_-]+$/.test(info.name)) {
        throw new Error("桌面安装标识无效，请重新安装");
      }
      localInfo = info;
    }
    if (existsSync(extractionDirectory)) {
      ensureDirectory();
      // 新版成功启动后才清理旧 app，崩溃或启动失败时保留恢复副本。
      if (regularFile(resultPath)) {
        const result = await Bun.file(resultPath).json().catch(() => null);
        if (typeof result?.transactionId !== "string" || !/^[a-f0-9]{32}$/.test(result.transactionId) || result.transactionId === observedResult) return localInfo;
        observedResult = result.transactionId;
        if (result.success && result.hash === localInfo.hash) {
          const previous = join(extractionDirectory, `appPrevious-${result.transactionId}`);
          const stat = lstatSync(previous, { throwIfNoEntry: false });
          if (stat?.isDirectory() && !stat.isSymbolicLink()) {
            try { rmSync(previous, { recursive: true }); }
            catch (error) { console.warn("旧版本文件暂时无法清理：", error); }
          }
        } else if (result?.success === false) state.error = String(result.error || "上次更新失败，已保留旧版本");
      }
    }
    return localInfo;
  }

  function artifactUrl(fileName: string) {
    const baseUrl = new URL(localInfo.baseUrl.endsWith("/") ? localInfo.baseUrl : `${localInfo.baseUrl}/`);
    if (!["http:", "https:"].includes(baseUrl.protocol)) throw new Error("更新地址无效");
    const url = new URL(fileName, baseUrl);
    url.searchParams.set("transaction", randomUUID());
    return url;
  }

  async function checkForUpdate() {
    if (busy) throw new Error("正在准备更新，请稍候");
    busy = true;
    try {
      const info = await getLocalInfo();
      state.error = "";
      if (info.channel === "dev") return state;
      const response = await fetch(artifactUrl(`${info.channel}-win-x64-update.json`), { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`检查更新失败：HTTP ${response.status}`);
      const content = await response.text();
      if (content.length > 65536) throw new Error("更新清单过大");
      const next = JSON.parse(content);
      if (!next || next.schemaVersion !== 1 || next.identifier !== info.identifier || next.channel !== info.channel || next.platform !== "win" || next.arch !== "x64"
        || typeof next.version !== "string" || !versionPattern.test(next.version) || typeof next.hash !== "string" || !hashPattern.test(next.hash) || typeof next.artifact?.file !== "string"
        || !next.artifact.file.startsWith(`${info.channel}-win-x64-`) || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.tar\.zst$/.test(next.artifact.file)) throw new Error("更新清单不匹配当前应用");
      manifest = next;
      const prepared = readPrepared();
      state = { version: next.version, hash: next.hash, error: "", updateAvailable: next.hash !== info.hash,
        updateReady: next.hash !== info.hash && prepared?.hash === next.hash && prepared?.version === next.version };
    } catch (error) {
      manifest = undefined;
      state.error = error instanceof Error ? error.message : String(error);
      state.updateAvailable = false;
      state.updateReady = false;
    } finally { busy = false; }
    return state;
  }

  async function readArchiveInfo(path: string): Promise<versionInfo> {
    const { stdout } = await execFileAsync(tarExecutable, ["-xOf", path, `${localInfo.name}/Resources/version.json`], { windowsHide: true, timeout: 60000, maxBuffer: 65536 });
    const info = JSON.parse(stdout);
    if (!info || info.identifier !== localInfo.identifier || info.channel !== localInfo.channel || typeof info.hash !== "string" || !hashPattern.test(info.hash)
      || typeof info.version !== "string" || !versionPattern.test(info.version)) throw new Error("更新包安装标识不匹配");
    return info;
  }

  async function download(fileName: string, path: string) {
    const response = await fetch(artifactUrl(fileName), { signal: AbortSignal.timeout(15 * 60_000) });
    if (!response.ok) throw new Error(`下载更新失败：HTTP ${response.status}`);
    await Bun.write(path, response);
  }

  async function downloadUpdate() {
    if (busy) throw new Error("已有更新任务正在执行");
    if (!manifest) {
      await checkForUpdate();
      if (state.error) throw new Error(state.error);
    }
    if (!manifest || !state.updateAvailable) throw new Error("暂无可安装的更新");
    if (state.updateReady) return;
    busy = true;
    state.error = "";
    const temporaryFiles: string[] = [];
    const temporaryFile = (suffix: string) => { const path = join(extractionDirectory, `${randomUUID()}${suffix}`); temporaryFiles.push(path); return path; };
    try {
      ensureDirectory();
      const target = manifest;
      let archivePath = join(extractionDirectory, `${localInfo.hash}.tar`);
      let currentHash = localInfo.hash;
      let usedPatch = false;
      try {
        if (!regularFile(archivePath)) throw new Error("缺少旧版本更新缓存");
        const visited = new Set([currentHash]);
        // ACT: 最多追溯 8 跳；更老的安装直接使用全量包，避免无限补丁链。
        for (let count = 0; currentHash !== target.hash && count < 8; count++) {
          const patchPath = temporaryFile(".patch");
          await download(`${localInfo.channel}-win-x64-${currentHash}.patch`, patchPath);
          const outputPath = temporaryFile(".tar");
          await execFileAsync(join(installDirectory, "app/bin/bspatch.exe"), [archivePath, outputPath, patchPath], { windowsHide: true, timeout: 10 * 60_000 });
          const info = await readArchiveInfo(outputPath);
          if (visited.has(info.hash)) throw new Error("更新补丁链重复");
          visited.add(info.hash);
          currentHash = info.hash;
          archivePath = outputPath;
        }
        usedPatch = currentHash === target.hash;
      } catch (error) { console.warn("增量更新不可用，改用完整更新包：", error instanceof Error ? error.message : error); }
      if (!usedPatch) {
        const compressedPath = temporaryFile(".tar.zst");
        await download(target.artifact.file, compressedPath);
        archivePath = temporaryFile(".tar");
        await execFileAsync(join(installDirectory, "app/bin/zig-zstd.exe"), ["decompress", "-i", compressedPath, "-o", archivePath, "--no-timing"], { windowsHide: true, timeout: 10 * 60_000 });
      }
      const archiveInfo = await readArchiveInfo(archivePath);
      if (archiveInfo.hash !== target.hash || archiveInfo.version !== target.version) throw new Error("更新包版本与清单不一致");
      const digest = createHash("sha256");
      for await (const chunk of Bun.file(archivePath).stream()) digest.update(chunk);
      const prepared: preparedUpdate = { hash: target.hash, version: target.version, archiveSha256: digest.digest("hex") };
      const targetPath = join(extractionDirectory, `${target.hash}.tar`);
      if (existsSync(targetPath) && !regularFile(targetPath)) throw new Error("更新包路径不能是链接或目录");
      renameSync(archivePath, targetPath);
      const recordPath = temporaryFile(".json");
      writeFileSync(recordPath, JSON.stringify(prepared));
      renameSync(recordPath, preparedPath);
      state.updateReady = true;
      console.log(`更新包已准备：${localInfo.version} → ${target.version}，${usedPatch ? "Patch" : "全量"}`);
    } catch (error) {
      state.error = error instanceof Error ? error.message : String(error);
      state.updateReady = false;
      throw error;
    } finally {
      busy = false;
      for (const path of temporaryFiles) rmSync(path, { force: true });
    }
  }

  async function applyUpdate() {
    if (busy) throw new Error("已有更新任务正在执行");
    await getLocalInfo();
    ensureDirectory();
    const prepared = readPrepared();
    if (!prepared || prepared.hash === localInfo.hash || (manifest && prepared.hash !== manifest.hash)) throw new Error("请先下载当前版本的更新包");
    busy = true;
    state.error = "";
    const transactionId = randomUUID().replaceAll("-", "");
    const planPath = join(extractionDirectory, `update-${transactionId}.json`);
    const readyPath = join(extractionDirectory, `update-${transactionId}.ready`);
    const helperPath = join(tmpdir(), `toonflowUpdate-${transactionId}.exe`);
    let approval: unknown;
    try {
      approval = lifecycle.requestQuitApproval();
      if (!approval) throw new Error("更新重启已取消");
      copyFileSync(join(resourcesDirectory, "app/updateHelper.exe"), helperPath);
      // 等待外层 launcher 退出，避免它仍占用 app；普通 Bun 验证或无 launcher 时等待当前宿主。
      const launcherPid = Number(process.env.ELECTROBUN_LAUNCHER_PID);
      const parentPid = Number.isSafeInteger(launcherPid) && launcherPid > 0 && launcherPid <= 0x7fffffff ? launcherPid : process.pid;
      writeFileSync(planPath, JSON.stringify({ schemaVersion: 1, transactionId, installDirectory, parentPid,
        identifier: localInfo.identifier, channel: localInfo.channel, ...prepared }), { flag: "wx" });
      await execFileAsync(helperPath, ["--spawn-update", planPath, "--quiet"], { windowsHide: true, timeout: 15000 });
      const deadline = Date.now() + 120000;
      while (!regularFile(readyPath)) {
        if (regularFile(resultPath)) {
          const result = await Bun.file(resultPath).json().catch(() => null);
          if (result?.transactionId === transactionId && result.success === false) throw new Error(String(result.error));
        }
        if (Date.now() >= deadline) throw new Error("更新助手未就绪，已取消本次更新");
        await Bun.sleep(100);
      }
      // 退出已获批准，留出 HTTP 响应时间后消费同一次批准。
      setTimeout(() => {
        try {
          lifecycle.quitAfterApproval(approval);
        } catch (error) {
          rmSync(planPath, { force: true });
          busy = false;
          state.error = error instanceof Error ? error.message : String(error);
        }
      }, 300);
    } catch (error) {
      if (approval) lifecycle.cancelQuitApproval(approval);
      busy = false;
      rmSync(planPath, { force: true });
      rmSync(preparedPath, { force: true });
      state.updateReady = false;
      state.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  return { getLocalInfo, updateInfo: () => ({ ...state }), checkForUpdate, downloadUpdate, applyUpdate };
}
