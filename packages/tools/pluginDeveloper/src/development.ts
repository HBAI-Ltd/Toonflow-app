import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative } from "node:path";
import { lstat, mkdir, mkdtemp, readFile, readdir, rm, symlink, unlink, writeAtomic } from "@toonflow/file";
import { z } from "zod";
import nodeGuide from "@toonflow/nodes-scaffold/readme.md" with { type: "text" };
import toolGuide from "@toonflow/tools-scaffold/readme.md" with { type: "text" };
import instructions from "../readme.md" with { type: "text" };
import { pluginDevelopmentSchema, pluginManifestSchema, type PluginManifest, type PluginUploadDraft, type PluginDevelopmentHost } from "./runtime";
import { ensureSdk } from "./sdk";
import { ensureBundledSdk } from "./bundledSdk";

type BuildReceipt = Omit<PluginUploadDraft, "source"> & { hash: string };

const receipts = new Map<string, BuildReceipt>();
const maxSourceBytes = 16 * 1024 * 1024;
const maxArtifactBytes = 20 * 1024 * 1024;

async function readBounded(path: string, limit: number) {
  const info = await lstat(path);
  if (!info.isFile() || info.size > limit) throw new Error(`文件必须是普通文件且不超过 ${limit} 字节：${path}`);
  const bytes = await readFile(path);
  if (bytes.byteLength > limit) throw new Error(`文件超过大小限制：${path}`);
  return bytes;
}

export async function develop(directory: string, input: unknown, host: PluginDevelopmentHost, signal?: AbortSignal) {
  const { resolveWorkspacePath, lockWorkspaceFiles, installNode, installTool, parsePluginVersion } = host;
  const request = pluginDevelopmentSchema.parse(input);
  signal?.throwIfAborted();
  if (request.action === "guide") {
    return {
      type: request.type,
      instructions,
      manifestExample: { type: request.type, name: request.type === "node" ? "customNode" : "customTool", displayName: "自定义插件", author: "", github: "", configRules: [] },
      documentation: request.type === "node" ? nodeGuide : toolGuide,
    };
  }
  const { path: project } = await resolveWorkspacePath(directory, request.path!);
  const projectFile = async (path: string) => (await resolveWorkspacePath(project, path, true)).path;
  if (project === directory || !(await lstat(project)).isDirectory()) throw Object.assign(new Error("请选择工作区内独立的插件项目目录"), { status: 400 });
  const release = lockWorkspaceFiles([project]);
  const key = process.platform === "win32" ? project.toLowerCase() : project;
  try {
    if (request.action !== "build") {
      const receipt = receipts.get(key);
      if (!receipt) throw new Error("该项目没有成功构建的产物，请先执行 build");
      const { hash, ...metadata } = receipt;
      const artifact = await projectFile(join("build", metadata.fileName));
      const bytes = await readBounded(artifact, request.action === "upload" ? 10 * 1024 * 1024 : maxArtifactBytes);
      if (createHash("sha256").update(bytes).digest("hex") !== hash) throw new Error("构建产物已被修改，请重新构建");
      signal?.throwIfAborted();
      const source = bytes.toString("utf8");
      if (request.action === "upload") return { ...metadata, source } satisfies PluginUploadDraft;
      const install = metadata.type === "node" ? installNode : installTool;
      const result = await install(metadata.fileName, source);
      return { type: metadata.type, name: result.name, installed: true };
    }
    receipts.delete(key);
    const parsed = pluginManifestSchema.safeParse(JSON.parse((await readBounded(await projectFile("plugin.json"), 256 * 1024)).toString("utf8")));
    if (!parsed.success) throw new Error(`plugin.json：${z.prettifyError(parsed.error)}`);
    const manifest = parsed.data;
    const packageInfo = JSON.parse((await readBounded(await projectFile("package.json"), 64 * 1024)).toString("utf8"));
    const version = parsePluginVersion(packageInfo?.version);
    if (!version || version.length > 100) throw new Error("package.json.version 必须是长度不超过 100 的完整 SemVer，例如 1.0.0");
    const sdkDirectory = await ensureBundledSdk(signal);
    const { fileName, bytes } = await compileProject(projectFile, manifest, version, sdkDirectory, signal);
    signal?.throwIfAborted();
    const artifact = await projectFile(join("build", fileName));
    await mkdir(dirname(artifact), { recursive: true });
    await writeAtomic(artifact, bytes);
    // ACT: 仅保留最近 64 个项目的构建记录；重启或被淘汰后须重新构建，安装和上传共用同一份快照。
    if (receipts.size >= 64) receipts.delete(receipts.keys().next().value!);
    const { type, name, displayName, description } = manifest;
    receipts.set(key, { type, name, displayName, description, version, fileName, hash: createHash("sha256").update(bytes).digest("hex") });
    return { type: manifest.type, name: manifest.name, path: relative(directory, artifact).replaceAll("\\", "/"), project: request.path, version };
  } finally { release(); }
}

async function compileProject(projectFile: (path: string) => Promise<string>, manifest: PluginManifest, version: string, sdkDirectory: string, signal?: AbortSignal) {
  const temporary = await mkdtemp(join(tmpdir(), "toonflowPlugin"));
  try {
    const sourceRoot = join(temporary, "project");
    const output = join(temporary, "output");
    let sourceBytes = 0;
    let entries = 0;
    async function copySource(path: string) {
      signal?.throwIfAborted();
      if (++entries > 256) throw new Error("插件源码不能超过 256 个文件和目录");
      if (["package.json", "tsconfig.json", "jsconfig.json", "node_modules"].includes(basename(path).toLowerCase())) throw new Error(`源码不支持嵌套依赖与编译配置：${path}`);
      const source = await projectFile(path);
      const info = await lstat(source);
      if (info.isDirectory()) {
        await mkdir(join(sourceRoot, path), { recursive: true });
        for (const name of await readdir(source)) await copySource(join(path, name));
        return;
      }
      const bytes = await readBounded(source, maxSourceBytes - sourceBytes);
      sourceBytes += bytes.byteLength;
      await writeAtomic(join(sourceRoot, path), bytes, { exclusive: true });
    }
    await copySource("src");
    // 固定依赖从 SDK 解析，Vue 的类型查找与 JS 打包使用同一份 node_modules。
    await symlink(join(sdkDirectory, "node_modules"), join(sourceRoot, "node_modules"), "junction");
    await writeAtomic(join(sourceRoot, "package.json"), JSON.stringify({ type: "module", version }), { exclusive: true });
    await writeAtomic(join(sourceRoot, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ESNext", module: "ESNext", moduleResolution: "Bundler" } }), { exclusive: true });
    const readme = await projectFile("readme.md");
    const readmeInfo = await lstat(readme).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    if (readmeInfo) await writeAtomic(join(sourceRoot, "readme.md"), await readBounded(readme, 200000), { exclusive: true });
    const request = { root: sourceRoot, outDir: output, manifest };
    try {
      await runBuild(sdkDirectory, request, signal);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "SDK_DEPENDENCY_MISSING") throw error;
      signal?.throwIfAborted();
      const fullDirectory = await ensureSdk(signal).catch(cause => {
        signal?.throwIfAborted();
        throw new Error(`${(error as Error).message}\n完整 SDK 不可用：${cause instanceof Error ? cause.message : cause}`, { cause });
      });
      const modules = join(sourceRoot, "node_modules");
      await unlink(modules);
      await symlink(join(fullDirectory, "node_modules"), modules, "junction");
      await runBuild(fullDirectory, request, signal);
    }
    signal?.throwIfAborted();
    const fileName = `${manifest.name}.${manifest.type === "node" ? "umd" : "tool"}.js`;
    const bytes = await readBounded(join(output, fileName), maxArtifactBytes);
    return { fileName, bytes };
  } finally { await rm(temporary, { recursive: true, force: true }); }
}

function runBuild(sdkDirectory: string, request: { root: string; outDir: string; manifest: PluginManifest }, signal?: AbortSignal) {
  return new Promise<void>((resolveBuild, reject) => {
    let inputError: Error | undefined;
    // ACT: 独立进程用于超时和取消，不作为操作系统安全沙箱；构建只加载开发套件的固定配置。
    const child = execFile(process.execPath, ["--no-install", "--no-macros", "--no-env-file", join(sdkDirectory, "pluginBuild.js")], {
      cwd: sdkDirectory, windowsHide: true, encoding: "utf8", signal, killSignal: "SIGKILL", timeout: 90000, maxBuffer: 1024 * 1024,
      env: { NODE_ENV: "production", PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP, TMP: process.env.TMP, TMPDIR: process.env.TMPDIR },
    }, (error, stdout, stderr) => {
      if (signal?.aborted) reject(signal.reason);
      else if (error || inputError) {
        const failure = new Error(`插件构建失败：${stderr.trim() || stdout.trim() || (error ?? inputError)!.message}`);
        reject(error?.code === 75 ? Object.assign(failure, { code: "SDK_DEPENDENCY_MISSING" }) : failure);
      }
      else resolveBuild();
    });
    child.stdin!.on("error", error => { inputError = error; child.kill("SIGKILL"); });
    child.stdin!.end(JSON.stringify(request));
  });
}
