import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdir, readFile, writeAtomic } from "@toonflow/file";
import { validateSourcePolicy } from "./sourcePolicy";

export type KilnRenderResult = { glb: Buffer; tris: number; meta: Record<string, unknown>; warnings: string[]; artifactGlbSha256: string; buildCache?: { key: string; hit: boolean }; [key: string]: unknown };
type KilnControls = { deadlineMs?: number; maxGlbBytes?: number; maxResponseBytes?: number; signal?: AbortSignal };
type KilnContent = { type: "text"; text: string } | { type: "image"; data: string; mimeType: string };
export type KilnHost = {
  defs: { name: string; description: string; inputSchema: unknown }[];
  callTool(name: string, args: Record<string, unknown>, request: { signal: AbortSignal }): Promise<{ content: KilnContent[]; isError?: boolean }>;
};
type KilnRuntime = {
  mcp: { createKilnToolHost(context: Record<string, unknown>): KilnHost };
  cache: { createCachedEvaluatorPort(evaluator: { render: typeof evaluateKiln }, options: { cache: { get(key: string): Promise<KilnRenderResult | undefined>; put(key: string, result: KilnRenderResult): Promise<void> }; identity(): string }): { render: typeof evaluateKiln } };
  views: { MemoryCaptureCache: new (maxBytes: number) => unknown };
  evaluator: {
    sanitizedEvaluatorEnv(): NodeJS.ProcessEnv;
    decodeEvaluatorResultV2(json: string, maxBytes: number, requestId: string): { ok: true; render: KilnRenderResult } | { ok: false; error: { message: string } };
  };
  helperNames: ReadonlySet<string>;
  nodePath: string;
};
const toolDirectory = dirname(fileURLToPath(import.meta.url));
const resourceDirectory = join(toolDirectory, "pluginResources", "trumanMap");
const bridgePath = join(resourceDirectory, "evaluatorBridge.mjs");
const runtimePackage = { private: true, type: "module", dependencies: { "@instruktlabs/kiln": "1.6.0" } };
const bridgeSource = `import {createInterface} from "node:readline";
import {renderGLBViaSubprocess,encodeRenderResultV2} from "@instruktlabs/kiln/evaluator";
const controller = new AbortController();
const lines = createInterface({input:process.stdin,crlfDelay:Infinity});
let started = false;
let inputBytes = 0;
lines.on("line", line => {
  inputBytes += Buffer.byteLength(line);
  if(inputBytes > 1024*1024){controller.abort();process.exitCode=1;lines.close();process.stdin.destroy();return;}
  let input;
  try {input=JSON.parse(line);} catch {controller.abort();process.exitCode=1;lines.close();process.stdin.destroy();return;}
  if(input.cancel===true){controller.abort();return;}
  if(started){controller.abort();return;}
  started=true;
  void (async()=>{
    try {
      const result=await renderGLBViaSubprocess(input.code,input.options,{...input.controls,signal:controller.signal,maxHeapMb:512});
      if(result.tris>50000) throw new Error("模型超过 50000 个三角形，请降低几何细分或拆分资产");
      process.stdout.write(JSON.stringify(encodeRenderResultV2("toonflowKiln",result)));
    } catch(error) {
      process.exitCode=1;
      process.stderr.write(error instanceof Error?error.message:"Kiln 编译失败");
    } finally {lines.close();process.stdin.destroy();}
  })();
});
lines.on("close",()=>{if(!started)process.exitCode=1;});
process.once("SIGTERM",()=>controller.abort());
`;
let runtime: Promise<KilnRuntime> | undefined;
let preparation: Promise<KilnRuntime> | undefined;
let compiling = false;

async function loadRuntime(): Promise<KilnRuntime> {
  const manifest = JSON.parse(await readFile(join(resourceDirectory, "node_modules", "@instruktlabs", "kiln", "package.json"), "utf8"));
  if (manifest.version !== "1.6.0") throw new Error("Kiln 运行版本不一致，请调用 kilnPrepare 准备固定版本");
  if (await readFile(bridgePath, "utf8") !== bridgeSource) throw new Error("Kiln 执行桥未准备好，请调用 kilnPrepare");
  const nodePath = Bun.which("node");
  if (!nodePath) throw new Error("Kiln 需要 Node.js 22.2 或更新版本，请安装后调用 kilnPrepare");
  const load = (specifier: string) => import(pathToFileURL(Bun.resolveSync(specifier, resourceDirectory)).href);
  const [mcp, evaluator, primitives, cache, views] = await Promise.all([load("@instruktlabs/kiln/mcp"), load("@instruktlabs/kiln/evaluator"), load("@instruktlabs/kiln/primitives"), load("@instruktlabs/kiln/cache"), load("@instruktlabs/kiln/views")]);
  const globals = primitives.buildSandboxGlobals() as Record<string, unknown>;
  const helperNames = new Set(Object.keys(globals).filter(name => typeof globals[name] === "function" && name !== "console"));
  return { mcp, evaluator, cache, views, helperNames, nodePath };
}

export async function getKilnRuntime() {
  if (preparation) return preparation;
  runtime ??= loadRuntime().catch(error => { runtime = undefined; throw new Error(`Kiln 尚未就绪，请先调用 kilnPrepare。${error instanceof Error ? error.message : ""}`); });
  return runtime;
}

export async function prepareKiln(signal?: AbortSignal) {
  signal?.throwIfAborted();
  if (preparation) return preparation;
  if (runtime) {
    try { const loaded = await runtime; signal?.throwIfAborted(); return loaded; }
    catch { signal?.throwIfAborted(); }
  }
  const pending = (async () => {
    const nodePath = Bun.which("node");
    if (!nodePath) throw new Error("Kiln 需要 Node.js 22.2 或更新版本，请安装后重试");
    const version = Bun.spawn([nodePath, "--version"], { stdout: "pipe", stderr: "pipe", windowsHide: true });
    const versionText = (await new Response(version.stdout).text()).trim();
    const match = /^v(\d+)\.(\d+)\./.exec(versionText);
    if (await version.exited || !match || Number(match[1]) < 22 || Number(match[1]) === 22 && Number(match[2]) < 2) throw new Error("Kiln 执行需要 Node.js 22.2 或更新版本");
    const directory = join(resourceDirectory, "node_modules", "@instruktlabs", "kiln");
    const installed = await readFile(join(directory, "package.json"), "utf8").then(content => JSON.parse(content).version === "1.6.0").catch((error: NodeJS.ErrnoException) => { if (error.code === "ENOENT" || error instanceof SyntaxError) return false; throw error; });
    await mkdir(resourceDirectory, { recursive: true });
    await writeAtomic(join(resourceDirectory, "package.json"), JSON.stringify(runtimePackage, null, 2));
    await writeAtomic(bridgePath, bridgeSource);
    let prepared: KilnRuntime | undefined;
    if (installed) {
      try { prepared = await loadRuntime(); }
      catch { /* 中断安装可能留下 manifest；只有完整运行时可加载才算准备完成。 */ }
    }
    if (!prepared) {
      const controller = new AbortController();
      const prepareSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
      const child = Bun.spawn([process.execPath, "install", "--production", "--ignore-scripts", "--no-progress"], { cwd: resourceDirectory, stdout: "ignore", stderr: "pipe", windowsHide: true });
      const cancel = () => child.kill();
      prepareSignal.addEventListener("abort", cancel, { once: true });
      if (prepareSignal.aborted) cancel();
      const timer = setTimeout(() => controller.abort(new Error("Kiln 运行准备超过 3 分钟，请检查网络后重试")), 180000);
      try {
        let errors = "";
        for await (const chunk of child.stderr) if (errors.length < 16000) errors += Buffer.from(chunk).toString("utf8").slice(0, 16000 - errors.length);
        const code = await child.exited;
        prepareSignal.throwIfAborted();
        if (code !== 0) throw new Error(`Kiln 依赖准备失败，请检查网络后调用 kilnPrepare 重试。${errors.slice(-1500)}`);
      } finally { clearTimeout(timer); prepareSignal.removeEventListener("abort", cancel); }
    }
    signal?.throwIfAborted();
    runtime = prepared ? Promise.resolve(prepared) : loadRuntime();
    return await runtime;
  })();
  preparation = pending;
  try { return await pending; }
  finally { if (preparation === pending) preparation = undefined; }
}

export async function evaluateKiln(code: string, options: Record<string, unknown> = {}, controls: KilnControls = {}): Promise<KilnRenderResult> {
  controls.signal?.throwIfAborted();
  const loaded = await getKilnRuntime();
  validateSourcePolicy(code, loaded.helperNames);
  const deadlineMs = Math.min(45000, controls.deadlineMs ?? 45000);
  const maxGlbBytes = Math.min(16 * 1024 * 1024, controls.maxGlbBytes ?? Infinity);
  const maxResponseBytes = Math.min(28 * 1024 * 1024, controls.maxResponseBytes ?? Infinity);
  if (compiling) throw new Error("Kiln 正在编译另一个模型，请等待后重试");
  compiling = true;
  try { return await new Promise<KilnRenderResult>((resolve, reject) => {
    const child = spawn(loaded.nodePath, ["--max-old-space-size=512", "--disable-proto=delete", bridgePath], { env: loaded.evaluator.sanitizedEvaluatorEnv(), stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
    const chunks: Buffer[] = [];
    let bytes = 0;
    let stderr = "";
    let failure: Error | undefined;
    let killTimer: ReturnType<typeof setTimeout> | undefined;
    const cancel = (reason: Error) => {
      failure ??= reason;
      // ACT: 先经 stdin 取消官方 evaluator 子进程，再限时结束桥；普通进程不是系统沙箱。
      child.stdin?.write('{"cancel":true}\n');
      killTimer ??= setTimeout(() => child.kill("SIGKILL"), 2000);
    };
    const abort = () => cancel(controls.signal?.reason instanceof Error ? controls.signal.reason : new Error("Kiln 编译已取消"));
    controls.signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(() => cancel(new Error("Kiln 编译超过 45 秒，请简化模型后重试")), deadlineMs);
    child.stdout.on("data", (chunk: Buffer) => {
      bytes += chunk.byteLength;
      if (bytes > maxResponseBytes) { cancel(new Error("Kiln 返回内容超过上限")); return; }
      chunks.push(Buffer.from(chunk));
    });
    child.stderr.on("data", (chunk: Buffer) => { if (stderr.length < 16000) stderr += chunk.toString("utf8").slice(0, 16000 - stderr.length); });
    child.stdin.on("error", () => {});
    child.on("error", error => { failure ??= error; });
    child.on("close", exitCode => {
      clearTimeout(timer); clearTimeout(killTimer);
      controls.signal?.removeEventListener("abort", abort);
      if (failure) return reject(failure);
      if (exitCode !== 0) return reject(new Error(stderr.slice(-2000) || "Kiln 执行进程未正常完成"));
      try {
        const result = loaded.evaluator.decodeEvaluatorResultV2(Buffer.concat(chunks).toString("utf8"), maxGlbBytes, "toonflowKiln");
        if (!result.ok) throw new Error(result.error.message);
        if (result.render.tris > 50000) throw new Error("模型超过 50000 个三角形，请降低几何细分或拆分资产");
        resolve(result.render);
      } catch (error) { reject(error); }
    });
    child.stdin.write(`${JSON.stringify({ code, options: { ...options, instance: "off", geometryPolicy: "strict" }, controls: { deadlineMs, maxGlbBytes, maxResponseBytes } })}\n`);
    if (controls.signal?.aborted) abort();
  }); } finally { compiling = false; }
}
