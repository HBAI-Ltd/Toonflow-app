import ffmpeg from "@renmu/fluent-ffmpeg";
import { link, mkdir, mkdtemp, realpath, rm, stat, unlink } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, sep } from "node:path";
import { z } from "zod";
import { inputFormats, preparePlan } from "./policy";
import { ffmpegMethods, type FfmpegPlan, type FfmpegResult } from "./types";

export const ffmpegPlanSchema = z.strictObject({
  steps: z.array(z.strictObject({ method: z.enum(ffmpegMethods), args: z.array(z.unknown()).max(32) })).min(1).max(512),
});

export interface FfmpegRuntime {
  directory: string;
  ffmpegPath: string;
  ffprobePath?: string;
  resolvePath(path: string): Promise<string>;
  lockPaths?(paths: string[]): () => void;
}

function assertWithin(root: string, path: string) {
  const offset = relative(root, path);
  if (!offset || offset === ".." || offset.startsWith(`..${sep}`) || isAbsolute(offset)) throw new Error("FFmpeg 只能操作工作区内的文件");
}

async function readOutput(stream: ReadableStream<Uint8Array>, limit: number, truncate = false) {
  const decoder = new TextDecoder();
  let output = "";
  for await (const chunk of stream) {
    output += decoder.decode(chunk, { stream: true });
    if (output.length > limit) {
      if (!truncate) throw new Error("FFprobe 元数据超过大小限制");
      output = output.slice(-limit);
    }
  }
  return output + decoder.decode();
}

async function runProcess(executable: string, args: string[], directory: string, signal?: AbortSignal, probe = false) {
  signal?.throwIfAborted();
  const process = Bun.spawn([executable, ...args], {
    cwd: directory, stdin: "ignore", stdout: "pipe", stderr: "pipe", windowsHide: true, signal,
    env: Object.fromEntries(Object.entries(globalThis.process.env).filter(([key]) => key.toUpperCase() !== "FFREPORT")),
  });
  try {
    const [code, stdout, stderr] = await Promise.all([
      process.exited, readOutput(process.stdout, probe ? 8 * 1024 * 1024 : 32768, !probe), readOutput(process.stderr, 32768, true),
    ]);
    signal?.throwIfAborted();
    if (code !== 0) throw new Error(`${probe ? "FFprobe" : "FFmpeg"} 执行失败（${code}）：${stderr.trim()}`);
    return stdout;
  } finally {
    if (process.exitCode === null) process.kill();
    await process.exited;
  }
}

/** 同一执行器供 HTTP、工具和旧字节接口使用；不接收代码或原始 fluent 实例。 */
export async function executeFfmpeg(value: FfmpegPlan, context: FfmpegRuntime, signal?: AbortSignal): Promise<FfmpegResult> {
  signal?.throwIfAborted();
  if (JSON.stringify(value).length > 256 * 1024) throw new Error("FFmpeg 调用配置过大");
  const plan = ffmpegPlanSchema.parse(value);
  const directory = await realpath(context.directory);
  const resolvePath = async (path: string) => {
    const resolved = await context.resolvePath(path);
    assertWithin(directory, resolved);
    return resolved;
  };
  const prepared = await preparePlan(plan, resolvePath);
  signal?.throwIfAborted();
  const inputs = prepared.steps.filter(step => step.method === "input").map(step => step.args[0] as string);
  if (!inputs.length) throw new Error("请至少指定一个工作区输入文件");
  const release = context.lockPaths?.([...inputs, ...prepared.outputs.map(output => output.absolutePath)]);
  let temporary: string | undefined;
  const published: string[] = [];
  try {
    if (prepared.probeIndex !== undefined) {
      if (!context.ffprobePath) throw new Error("未找到可用的 FFprobe");
      const path = inputs[prepared.probeIndex];
      if (!path) throw new Error("FFprobe 输入序号不存在");
      let inputIndex = -1;
      const probeOptions: string[] = [];
      for (const step of prepared.steps) {
        if (step.method === "input") inputIndex++;
        if (inputIndex === prepared.probeIndex && step.method === "inputFormat") probeOptions.push("-f", step.args[0] as string);
      }
      const data = await runProcess(context.ffprobePath, [
        "-v", "error", "-protocol_whitelist", "file", "-format_whitelist", inputFormats.join(","),
        ...probeOptions, "-show_format", "-show_streams", "-show_chapters", "-of", "json", path,
      ], directory, signal, true);
      return { outputs: [], probe: JSON.parse(data) };
    }
    if (!prepared.outputs.length) throw new Error("请至少指定一个输出文件");
    temporary = await mkdtemp(join(directory, ".ffmpeg-"));
    const staged = prepared.outputs.map((output, index) => join(temporary!, `${index}${extname(output.path)}`));
    const command = ffmpeg();
    let outputIndex = 0;
    for (const step of prepared.steps) {
      const args = step.method === "output" ? [staged[outputIndex++]]
        : step.method === "inputOptions" || step.method === "outputOptions" ? step.args[0] as unknown[] : step.args;
      // ACT: preparePlan 只返回经过审查的公开方法；原始实例从不交给调用者。
      (command[step.method as keyof typeof command] as (...args: unknown[]) => unknown).apply(command, args);
      if (step.method === "input") command.inputOptions("-protocol_whitelist", "file", "-format_whitelist", inputFormats.join(","));
    }
    // ACT: 固定 fluent 2.3.3 的参数构造器；统一用 Bun 管理进程，避免库内部 probe 绕过取消和环境约束。
    const args = (command as typeof command & { _getArguments(): string[] })._getArguments();
    await runProcess(context.ffmpegPath, ["-hide_banner", "-nostdin", "-loglevel", "error", ...args], directory, signal);
    for (const [index, output] of prepared.outputs.entries()) {
      signal?.throwIfAborted();
      const info = await stat(staged[index]!);
      if (!info.isFile() || !info.size) throw new Error(`FFmpeg 未生成有效输出：${output.path}`);
      const destination = await resolvePath(output.path);
      if (destination !== output.absolutePath) throw new Error("处理期间输出目录发生变化，请重试");
      await mkdir(dirname(destination), { recursive: true });
      if (await resolvePath(output.path) !== destination) throw new Error("输出目录发生变化，请重试");
      // 同卷硬链接独占发布完整文件；已存在的目标绝不覆盖。
      await link(staged[index]!, destination);
      published.push(destination);
    }
    return { outputs: prepared.outputs.map(output => ({ path: output.path, mimeType: Bun.file(output.path).type || "application/octet-stream" })) };
  } catch (error) {
    for (const path of published) await unlink(path);
    signal?.throwIfAborted();
    throw error;
  } finally {
    release?.();
    if (temporary && dirname(temporary) === directory) await rm(temporary, { recursive: true, force: true });
  }
}
