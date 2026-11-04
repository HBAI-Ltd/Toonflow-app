import { mkdir, readFile, realpath } from "@toonflow/file";
import { file } from "@toonflow/file/bun";
import { t } from "@toonflow/server/i18n";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { request } from "node:http";
import type { IncomingMessage } from "node:http";
import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import { setTimeout } from "node:timers/promises";
import { parseInstallUrl } from "./protocol";

async function start() {
  if (process.platform !== "linux") throw new Error(t`当前系统不支持此启动器`);
  const args = process.argv.slice(2);
  if (args.length > 1) throw new Error(t`启动器只接受一个安装链接`);
  const url = args[0];
  if (url !== undefined) parseInstallUrl(url);
  const configured = process.env.XDG_DATA_HOME;
  const appData = configured && isAbsolute(configured) && resolve(configured) !== "/"
    ? resolve(configured) : join(homedir(), ".local/share");
  const directory = resolve(process.env.TOONFLOW_DATA_DIR ?? join(appData, "toonflow/data"));
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const bin = await realpath(resolve(import.meta.dirname, "../../bin"));

  async function readRuntime(): Promise<{ pid: number; port: number } | undefined> {
    let value;
    try { value = await file(join(directory, "desktopRuntime.json")).json(); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw new Error(t`无法读取 Toonflow 运行状态`, { cause: error });
    }
    if (!Number.isSafeInteger(value?.pid) || value.pid <= 0 || !Number.isSafeInteger(value?.port)
      || value.port < 1 || value.port > 65535) throw new Error(t`Toonflow 运行状态无效，请检查数据目录`);
    try {
      // ACT: 核对 SDK 的完整启动路径，排除重启后的 PID 复用；包升级替换旧 Bun 时原进程的 argv 仍有效。
      const [executable, entrypoint] = (await readFile(`/proc/${value.pid}/cmdline`, "utf8")).split("\0");
      if (!executable || !entrypoint || !isAbsolute(executable) || !isAbsolute(entrypoint)
        || resolve(executable) !== join(bin, "bun") || resolve(entrypoint) !== resolve(bin, "../Resources/main.js")) return;
      process.kill(value.pid, 0);
    }
    catch (error) {
      if (["ENOENT", "ESRCH"].includes((error as NodeJS.ErrnoException).code ?? "")) return;
      throw new Error(t`无法确认 Toonflow 进程状态`, { cause: error });
    }
    return value;
  }

  const running = await readRuntime();
  if (running) {
    if (url !== undefined) await sendUrl(running.port, url);
    return;
  }

  // ACT: flock 随 SDK launcher 的整个生命周期持锁；启动超时也不能打开第二个写入相同数据的实例。
  const child = spawn("flock", ["--exclusive", "--nonblock", "--conflict-exit-code", "75",
    join(directory, "desktopInstance.lock"), join(bin, "launcher")], {
    cwd: bin, detached: true, stdio: "ignore",
    env: { ...process.env, TOONFLOW_DATA_DIR: directory },
  });
  await once(child, "spawn");
  child.unref();
  const deadline = performance.now() + 45000;
  while (performance.now() < deadline) {
    if (child.signalCode !== null) throw new Error(t`Toonflow 启动进程已被终止：${child.signalCode}`);
    if (child.exitCode !== null && child.exitCode !== 75) {
      throw new Error(t`Toonflow 启动失败，退出码：${child.exitCode}`);
    }
    const runtime = await readRuntime();
    if (runtime) {
      if (url !== undefined) await sendUrl(runtime.port, url);
      return;
    }
    await setTimeout(250);
  }
  throw new Error(t`Toonflow 启动超时，请打开应用后重新点击安装链接`);
}

async function sendUrl(port: number, url: string) {
  const origin = `http://127.0.0.1:${port}`;
  const body = JSON.stringify({ url });
  // 使用本机 HTTP 连接，避免系统代理转发安装链接；拒绝和超时都不会重新启动应用。
  const response = await new Promise<IncomingMessage>((resolve, reject) => {
    const req = request(`${origin}/api/desktop/openUrl`, {
      method: "POST", signal: AbortSignal.timeout(3000),
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body),
        Origin: origin, "x-toonflow-desktop": "1" },
    }, resolve);
    req.once("error", reject);
    req.end(body);
  }).catch(error => {
    if (error.code === "ABORT_ERR") throw new Error(t`提交安装请求超时，请等待 Toonflow 响应后重试`, { cause: error });
    if (error.code === "ECONNREFUSED") throw new Error(t`Toonflow 正在运行，但本机服务尚未就绪，请稍后重试`, { cause: error });
    throw new Error(t`无法提交安装请求，请确认 Toonflow 正常运行后重试`, { cause: error });
  });
  response.setEncoding("utf8");
  let text = "";
  for await (const chunk of response) {
    text += chunk.toString();
    if (text.length > 65536) {
      response.destroy();
      throw new Error(t`Toonflow 返回的安装响应过大`);
    }
  }
  let result;
  try { result = JSON.parse(text); }
  catch {
    if (response.statusCode !== 200) throw new Error(t`Toonflow 拒绝安装请求，HTTP 状态：${response.statusCode}`);
    throw new Error(t`Toonflow 返回的安装响应不是有效 JSON`);
  }
  if (response.statusCode !== 200 || result?.code !== 200) {
    const detail = typeof result?.message === "string" ? result.message : t`请检查应用状态后重试`;
    throw new Error(t`Toonflow 未接受安装请求：${detail}`);
  }
}

try { await start(); }
catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  try {
    const dialog = Bun.spawn(["zenity", "--error", "--title=Toonflow", "--no-markup", "--text", message], {
      stdin: "ignore", stdout: "ignore", stderr: "ignore",
    });
    await dialog.exited;
  } catch { /* 图形会话不可用时，终端仍保留错误。 */ }
  process.exitCode = 1;
}
