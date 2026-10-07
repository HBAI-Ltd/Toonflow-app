import { t, translateMessage } from "@toonflow/server/i18n";
import type { updateSnapshot } from "@toonflow/server/desktop";
import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { copyFileSync, createWriteStream, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeAtomicSync } from "@toonflow/file";
import { file } from "@toonflow/file/bun";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const hashPattern = /^[a-zA-Z0-9]{1,64}$/;
const versionPattern = /^\d+\.\d+\.\d+$/;
type versionInfo = { identifier: string; name: string; channel: string; version: string; hash: string; baseUrl: string };
type preparedUpdate = { version: string; hash: string; archiveSha256: string };
type updateLifecycle = { requestQuitApproval(): unknown; cancelQuitApproval(approval: unknown): void; quitAfterApproval(approval: unknown): void };

export function confirmWindowsUpdateStartup(resourcesDirectory: string, failed = false) {
  const transactionId = process.env.TOONFLOW_UPDATE_TRANSACTION;
  if (!transactionId) return;
  if (!/^[a-f0-9]{32}$/.test(transactionId)) throw new Error(t`更新事务标识无效`);
  const extractionDirectory = resolve(resourcesDirectory, "../../self-extraction");
  if (!lstatSync(extractionDirectory).isDirectory() || lstatSync(extractionDirectory).isSymbolicLink()) throw new Error(t`更新缓存目录不能是链接`);
  const { version, hash } = JSON.parse(readFileSync(join(resourcesDirectory, "version.json"), "utf8"));
  if (typeof version !== "string" || !versionPattern.test(version) || typeof hash !== "string" || !hashPattern.test(hash)) throw new Error(t`桌面安装标识无效，请重新安装`);
  // ACT: 只有本次主界面首次就绪才确认更新；后续页面重载不覆盖事务结果。
  writeAtomicSync(join(extractionDirectory, `update-${transactionId}.started.json`), JSON.stringify({ transactionId, version, hash, success: !failed }), { exclusive: true });
  delete process.env.TOONFLOW_UPDATE_TRANSACTION;
}

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
  let applyingTransaction = "";
  let pendingQuitApproval: unknown;
  let observedResult = "";
  let installError = "";
  let updateProgress: updateSnapshot["updateProgress"];
  let state = { version: "", hash: "", error: "", updateAvailable: false, updateReady: false };

  function regularFile(path: string) {
    const stat = lstatSync(path, { throwIfNoEntry: false });
    return !!stat?.isFile() && !stat.isSymbolicLink();
  }

  function ensureDirectory() {
    mkdirSync(extractionDirectory, { recursive: true });
    if (!lstatSync(extractionDirectory).isDirectory() || lstatSync(extractionDirectory).isSymbolicLink()) throw new Error(t`更新缓存目录不能是链接`);
  }

  function removeUpdateFile(path: string) {
    try { rmSync(path, { force: true }); }
    catch (error) { console.warn(`更新文件清理失败：${path}`, error); }
  }

  function assertUpdatePending(transactionId: string, planPath: string, readyPath?: string) {
    let result;
    if (regularFile(resultPath)) {
      try { result = JSON.parse(readFileSync(resultPath, "utf8")); }
      catch { /* 损坏的旧结果不影响本次计划校验。 */ }
    }
    if (result?.transactionId === transactionId && result.success === false) throw new Error(String(result.error || "本次更新失败，已保留旧版本"));
    if (!regularFile(planPath)) throw new Error(t`更新已取消，请重新准备更新`);
    if (!readyPath) return;
    if (!regularFile(readyPath)) throw new Error(t`更新助手就绪状态已丢失，请重新准备更新`);
    const ready = JSON.parse(readFileSync(readyPath, "utf8"));
    if (ready?.transactionId !== transactionId || !Number.isSafeInteger(ready.helperPid) || ready.helperPid <= 0 || ready.helperPid > 0x7fffffff
      || !Number.isSafeInteger(ready.quitDeadline) || ready.quitDeadline - Date.now() < 5000 || ready.quitDeadline - Date.now() > 65000) {
      throw new Error(t`更新助手就绪状态无效或已过期，请重新准备更新`);
    }
    // ACT: 文件删除也可能被锁阻止；退出前同时确认本次助手存活，不能仅依赖遗留 .ready。
    try { process.kill(ready.helperPid, 0); }
    catch { throw new Error(t`更新助手已退出，请重新准备更新`); }
    return ready.quitDeadline - Date.now();
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
      const info = await file(join(resourcesDirectory, "version.json")).json();
      if (!info || info.identifier !== "local.toonflow.desktop" || !["stable", "canary", "dev"].includes(info.channel)
        || typeof info.version !== "string" || !versionPattern.test(info.version) || typeof info.hash !== "string" || !hashPattern.test(info.hash)
        || typeof info.baseUrl !== "string" || typeof info.name !== "string" || !/^[a-zA-Z0-9_-]+$/.test(info.name)) {
        throw new Error(t`桌面安装标识无效，请重新安装`);
      }
      localInfo = info;
    }
    if (existsSync(extractionDirectory)) {
      ensureDirectory();
      // 新版成功启动后才清理旧 app，崩溃或启动失败时保留恢复副本。
      if (regularFile(resultPath)) {
        const result = await file(resultPath).json().catch(() => null);
        if (typeof result?.transactionId !== "string" || !/^[a-f0-9]{32}$/.test(result.transactionId) || result.transactionId === observedResult) return localInfo;
        observedResult = result.transactionId;
        const targetMatches = result.version === localInfo.version && result.hash === localInfo.hash;
        const superseded = (result.success === true || result.success === false) && typeof result.version === "string" && versionPattern.test(result.version)
          && typeof result.hash === "string" && hashPattern.test(result.hash) && Bun.semver.order(localInfo.version, result.version) > 0;
        // 完整安装会保留旧结果；已达到目标或运行更高版时，仅忽略旧故障，不删除该事务备份。
        if (superseded || (result.success === false && targetMatches)) {
          installError = "";
          return localInfo;
        }
        if (result.success === true && targetMatches) {
          installError = "";
          const previous = join(extractionDirectory, `appPrevious-${result.transactionId}`);
          const stat = lstatSync(previous, { throwIfNoEntry: false });
          if (stat?.isDirectory() && !stat.isSymbolicLink()) {
            try { rmSync(previous, { recursive: true }); }
            catch (error) { console.warn("旧版本文件暂时无法清理：", error); }
          }
        } else if (result.success === true) {
          installError = t`更新后版本核验失败，已保留旧版本备份，请使用完整安装包更新`;
        } else if (result?.success === false) {
          installError = translateMessage(String(result.error || "上次更新失败，已保留旧版本"));
          if (result.transactionId === applyingTransaction) {
            if (pendingQuitApproval) lifecycle.cancelQuitApproval(pendingQuitApproval);
            pendingQuitApproval = undefined;
            state.error = installError;
            busy = false;
            applyingTransaction = "";
          }
        }
      }
    }
    return localInfo;
  }

  function artifactUrl(fileName: string) {
    const baseUrl = new URL(localInfo.baseUrl.endsWith("/") ? localInfo.baseUrl : `${localInfo.baseUrl}/`);
    if (!["http:", "https:"].includes(baseUrl.protocol)) throw new Error(t`更新地址无效`);
    const url = new URL(fileName, baseUrl);
    url.searchParams.set("transaction", randomUUID());
    return url;
  }

  async function checkForUpdate() {
    if (busy) throw new Error(t`正在准备更新，请稍候`);
    busy = true;
    updateProgress = undefined;
    const controller = new AbortController();
    try {
      const info = await getLocalInfo();
      state.error = "";
      if (info.channel === "dev") return state;
      const response = await fetch(artifactUrl(`${info.channel}-win-x64-update.json`), { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]) });
      if (!response.ok) throw new Error(t`检查更新失败：HTTP ${response.status}`);
      const chunks: Uint8Array[] = [];
      let size = 0;
      if (response.body) for await (const chunk of response.body) {
        size += chunk.byteLength;
        if (size > 65536) throw new Error(t`更新清单过大`);
        chunks.push(chunk);
      }
      const next = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks, size)));
      if (!next || next.schemaVersion !== 1 || next.identifier !== info.identifier || next.channel !== info.channel || next.platform !== "win" || next.arch !== "x64"
        || typeof next.version !== "string" || !versionPattern.test(next.version) || typeof next.hash !== "string" || !hashPattern.test(next.hash) || typeof next.artifact?.file !== "string"
        || !next.artifact.file.startsWith(`${info.channel}-win-x64-`) || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.tar\.zst$/.test(next.artifact.file)) throw new Error(t`更新清单不匹配当前应用`);
      if (Bun.semver.order(next.version, info.version) < 0) throw new Error(t`更新源版本 ${next.version} 早于当前版本 ${info.version}，已阻止降级`);
      manifest = next;
      const prepared = readPrepared();
      state = { version: next.version, hash: next.hash, error: "", updateAvailable: next.hash !== info.hash,
        updateReady: next.hash !== info.hash && prepared?.hash === next.hash && prepared?.version === next.version };
    } catch (error) {
      manifest = undefined;
      state.error = error instanceof Error ? error.message : String(error);
      state.updateAvailable = false;
      state.updateReady = false;
    } finally {
      controller.abort();
      busy = false;
    }
    return state;
  }

  async function readArchiveInfo(path: string): Promise<versionInfo> {
    const { stdout } = await execFileAsync(tarExecutable, ["-xOf", path, `${localInfo.name}/Resources/version.json`], { windowsHide: true, timeout: 60000, maxBuffer: 65536 });
    const info = JSON.parse(stdout);
    if (!info || info.identifier !== localInfo.identifier || info.channel !== localInfo.channel || typeof info.hash !== "string" || !hashPattern.test(info.hash)
      || typeof info.version !== "string" || !versionPattern.test(info.version)) throw new Error(t`更新包安装标识不匹配`);
    return info;
  }

  async function download(fileName: string, path: string) {
    const signal = AbortSignal.timeout(15 * 60_000);
    const progress: NonNullable<updateSnapshot["updateProgress"]> = { phase: "downloading", received: 0 };
    updateProgress = progress;
    const response = await fetch(artifactUrl(fileName), { signal });
    if (!response.ok) throw new Error(t`下载更新失败：HTTP ${response.status}`);
    if (!response.body) throw new Error(t`下载更新失败：响应为空`);
    const contentLength = response.headers.get("content-length");
    const contentEncoding = response.headers.get("content-encoding");
    const total = Number(contentLength);
    if ((!contentEncoding || contentEncoding === "identity") && contentLength && /^\d+$/.test(contentLength) && Number.isSafeInteger(total) && total > 0) progress.total = total;
    await pipeline(Readable.from(response.body), new Transform({
      transform(chunk: Buffer, encoding, callback) {
        progress.received += chunk.byteLength;
        callback(null, chunk);
      },
    }), createWriteStream(path, { flags: "wx", signal }), { signal });
    progress.phase = "preparing";
  }

  async function downloadUpdate() {
    if (busy) throw new Error(t`已有更新任务正在执行`);
    if (!manifest) {
      await checkForUpdate();
      if (busy) throw new Error(t`已有更新任务正在执行`);
      if (state.error) throw new Error(state.error);
    }
    if (!manifest || !state.updateAvailable) throw new Error(t`暂无可安装的更新`);
    if (state.updateReady) return;
    busy = true;
    state.error = "";
    updateProgress = undefined;
    const temporaryFiles: string[] = [];
    const temporaryFile = (suffix: string) => { const path = join(extractionDirectory, `${randomUUID()}${suffix}`); temporaryFiles.push(path); return path; };
    try {
      ensureDirectory();
      const target = manifest;
      let archivePath = join(extractionDirectory, `${localInfo.hash}.tar`);
      let currentHash = localInfo.hash;
      let usedPatch = false;
      try {
        if (!regularFile(archivePath)) throw new Error(t`缺少旧版本更新缓存`);
        const visited = new Set([currentHash]);
        // ACT: 最多追溯 8 跳；更老的安装直接使用全量包，避免无限补丁链。
        for (let count = 0; currentHash !== target.hash && count < 8; count++) {
          const patchPath = temporaryFile(".patch");
          await download(`${localInfo.channel}-win-x64-${currentHash}.patch`, patchPath);
          const outputPath = temporaryFile(".tar");
          await execFileAsync(join(installDirectory, "app/bin/bspatch.exe"), [archivePath, outputPath, patchPath], { windowsHide: true, timeout: 10 * 60_000 });
          const info = await readArchiveInfo(outputPath);
          if (visited.has(info.hash)) throw new Error(t`更新补丁链重复`);
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
      if (archiveInfo.hash !== target.hash || archiveInfo.version !== target.version) throw new Error(t`更新包版本与清单不一致`);
      const digest = createHash("sha256");
      for await (const chunk of file(archivePath).stream()) digest.update(chunk);
      const prepared: preparedUpdate = { hash: target.hash, version: target.version, archiveSha256: digest.digest("hex") };
      const targetPath = join(extractionDirectory, `${target.hash}.tar`);
      if (existsSync(targetPath) && !regularFile(targetPath)) throw new Error(t`更新包路径不能是链接或目录`);
      renameSync(archivePath, targetPath);
      writeAtomicSync(preparedPath, JSON.stringify(prepared));
      state.updateReady = true;
      console.log(`更新包已准备：${localInfo.version} → ${target.version}，${usedPatch ? "Patch" : "全量"}`);
    } catch (error) {
      state.error = error instanceof Error ? error.message : String(error);
      state.updateReady = false;
      throw error;
    } finally {
      busy = false;
      updateProgress = undefined;
      for (const path of temporaryFiles) removeUpdateFile(path);
    }
  }

  async function applyUpdate() {
    if (busy) throw new Error(t`已有更新任务正在执行`);
    await getLocalInfo();
    if (busy) throw new Error(t`已有更新任务正在执行`);
    ensureDirectory();
    const prepared = readPrepared();
    if (!prepared || prepared.hash === localInfo.hash || Bun.semver.order(prepared.version, localInfo.version) < 0
      || (manifest && (prepared.hash !== manifest.hash || prepared.version !== manifest.version))) throw new Error(t`请先下载当前版本的更新包`);
    busy = true;
    state.error = "";
    const transactionId = randomUUID().replaceAll("-", "");
    const planPath = join(extractionDirectory, `update-${transactionId}.json`);
    const readyPath = join(extractionDirectory, `update-${transactionId}.ready`);
    const helperPath = join(tmpdir(), `toonflowUpdate-${transactionId}.exe`);
    let approval: unknown;
    try {
      approval = lifecycle.requestQuitApproval();
      if (!approval) throw new Error(t`更新重启已取消`);
      installError = "";
      copyFileSync(join(resourcesDirectory, "app/updateHelper.exe"), helperPath);
      // 等待外层 launcher 退出，避免它仍占用 app；普通 Bun 验证或无 launcher 时等待当前宿主。
      const launcherPid = Number(process.env.ELECTROBUN_LAUNCHER_PID);
      const parentPid = Number.isSafeInteger(launcherPid) && launcherPid > 0 && launcherPid <= 0x7fffffff ? launcherPid : process.pid;
      writeAtomicSync(planPath, JSON.stringify({ schemaVersion: 1, transactionId, installDirectory, parentPid,
        identifier: localInfo.identifier, channel: localInfo.channel, ...prepared }), { exclusive: true });
      const handoffUtc = Date.now();
      const handoffStarted = performance.now();
      await execFileAsync(helperPath, ["--spawn-update", planPath, "--quiet"], { windowsHide: true, timeout: 15000 });
      const deadline = Date.now() + 120000;
      let quitDeadline = 0;
      while (true) {
        const ready = regularFile(readyPath);
        const remaining = assertUpdatePending(transactionId, planPath, ready ? readyPath : undefined);
        if (ready) {
          // 首次读取 ready 前也可能回拨时钟；扣除回拨量，不把解压耗时计入助手的退出等待。
          const elapsed = performance.now() - handoffStarted;
          const clockRollback = Math.max(0, elapsed - (Date.now() - handoffUtc));
          quitDeadline = handoffStarted + elapsed + Math.min(remaining! - clockRollback, 60000);
          break;
        }
        if (Date.now() >= deadline) throw new Error(t`更新助手未就绪，已取消本次更新`);
        await Bun.sleep(100);
      }
      // 退出已获批准，留出 HTTP 响应时间后消费同一次批准。
      applyingTransaction = transactionId;
      pendingQuitApproval = approval;
      setTimeout(() => {
        if (applyingTransaction !== transactionId) return;
        try {
          // ACT: .ready 可能早于助手超时；退出前重读本次结果，不依赖状态轮询是否已消费它。
          // 同时保留单调时钟预算，系统时间回拨不能延长助手实际的 60 秒等待。
          if (quitDeadline - performance.now() < 5000) throw new Error(t`更新交接已超时，已保留旧版本，请重试`);
          assertUpdatePending(transactionId, planPath, readyPath);
          lifecycle.quitAfterApproval(approval);
          pendingQuitApproval = undefined;
        } catch (error) {
          lifecycle.cancelQuitApproval(approval);
          pendingQuitApproval = undefined;
          removeUpdateFile(planPath);
          busy = false;
          applyingTransaction = "";
          state.error = error instanceof Error ? error.message : String(error);
        }
      }, 300);
    } catch (error) {
      if (approval) lifecycle.cancelQuitApproval(approval);
      busy = false;
      removeUpdateFile(planPath);
      if (approval) {
        removeUpdateFile(preparedPath);
        state.updateReady = false;
      }
      state.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  return { getLocalInfo, updateInfo: () => ({ ...state, installError, updateProgress }), checkForUpdate, downloadUpdate, applyUpdate };
}
