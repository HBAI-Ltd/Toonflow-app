import { execFile } from "node:child_process";
import { posix } from "node:path";
import { fileURLToPath } from "node:url";
import type { ToolContext } from "@toonflow/tools-scaffold/runtime";
import { sandboxRequestSchema } from "./schema";
import type { SandboxProcessRequest, SandboxProcessResult } from "./sandboxProcess";

const maxFileBytes = 16 * 1024 * 1024;

export function createSandboxContext({ files, resolvePath }: Pick<ToolContext, "files" | "resolvePath">): NonNullable<ToolContext["sandbox"]> {
  return {
    async execute(_id, params, signal) {
      const request = sandboxRequestSchema.parse(params);
      signal?.throwIfAborted();
      const initialFiles: Record<string, string> = Object.create(null);
      let inputBytes = 0;
      const addFile = (path: string, content: string | Uint8Array) => {
        const target = `/workspace/${path}`;
        if (Object.hasOwn(initialFiles, target)) throw new Error(`沙盒输入路径重复：${path}`);
        inputBytes += typeof content === "string" ? Buffer.byteLength(content) : content.byteLength;
        if (inputBytes > maxFileBytes) throw new Error("沙盒导入文件总大小不能超过 16 MiB");
        initialFiles[target] = Buffer.from(content).toString("base64");
      };
      for (const file of request.files ?? []) addFile(file.path, file.content);
      for (const file of request.imports ?? []) {
        signal?.throwIfAborted();
        const info = await files.stat(file.path, true);
        if (!info.isFile()) throw new Error(`只能导入普通文件：${file.path}`);
        if (inputBytes + info.size > maxFileBytes) throw new Error("沙盒导入文件总大小不能超过 16 MiB");
        addFile(file.target, await files.readFile(file.path, true, { signal, maxBytes: maxFileBytes - inputBytes }));
      }
      const destinations = new Set<string>();
      for (const file of request.exports ?? []) {
        const target = await resolvePath(file.target);
        const key = process.platform === "win32" ? target.toLowerCase() : target;
        if (destinations.has(key)) throw new Error(`沙盒输出目标重复：${file.target}`);
        destinations.add(key);
      }
      signal?.throwIfAborted();
      const processRequest: SandboxProcessRequest = {
        command: request.command,
        timeoutMs: request.timeoutMs,
        files: initialFiles,
        exports: (request.exports ?? []).map(file => file.path),
      };
      // ACT: Bun 无法可靠终止正在运行 CPython WASM 的线程，用独立进程兜底超时和取消。
      const entry = new URL(import.meta.url.endsWith(".ts") ? "./sandboxProcess.ts" : "./sandboxProcess.js", import.meta.url);
      const output = await new Promise<string>((resolve, reject) => {
        let inputError: Error | undefined;
        const child = execFile(process.execPath, [fileURLToPath(entry)], {
          encoding: "utf8", windowsHide: true, signal, killSignal: "SIGKILL",
          timeout: request.timeoutMs, maxBuffer: 32 * 1024 * 1024,
        }, (error, stdout, stderr) => {
          if (signal?.aborted) reject(signal.reason);
          else if (error?.killed && !inputError && error.code !== "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") reject(new Error(`沙盒执行超过 ${request.timeoutMs} 毫秒，进程已终止`, { cause: error }));
          else if (error || inputError) reject(new Error(`沙盒执行失败：${stderr.trim() || (error ?? inputError)!.message}`, { cause: error ?? inputError }));
          else resolve(stdout);
        });
        child.stdin!.on("error", error => { inputError = error; child.kill("SIGKILL"); });
        child.stdin!.end(JSON.stringify(processRequest));
      });
      const result: SandboxProcessResult = JSON.parse(output);
      signal?.throwIfAborted();
      const exported: string[] = [];
      if (result.exitCode === 0) {
        try {
          for (const file of request.exports ?? []) {
            signal?.throwIfAborted();
            const content = result.files.find(output => output.path === file.path)?.content;
            if (content === undefined) throw new Error(`沙盒未返回输出文件：${file.path}`);
            const directory = posix.dirname(file.target);
            if (directory !== ".") await files.mkdir(directory, true);
            signal?.throwIfAborted();
            await files.writeFile(file.target, Buffer.from(content, "base64"), !file.overwrite);
            exported.push(file.target);
          }
        } catch (error) {
          throw new Error(`沙盒写回失败，已写回文件：${JSON.stringify(exported)}。${error instanceof Error ? error.message : String(error)}`, { cause: error });
        }
      }
      const details = {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        exported,
      };
      return { content: [{ type: "text", text: JSON.stringify(details) }], details };
    },
  };
}
