import { t } from "@/lib/i18n";
import { listMediaModels, generateMedia } from "@/utils/media/generation";
import { createWorkspaceFfmpeg, executeWorkspaceFfmpeg } from "@/utils/ffmpeg";
import { createBrowserContext } from "@/utils/browser";
import { createSandboxContext } from "@toonflow/tool-sandbox/host";
import { canvasSchemas, isNodeToolAllowed, nodeToolPermissionsSchema } from "@toonflow/tool-canvas/runtime";
import { getRuntimePlatform } from "@/lib/platform";
import { importImage } from "@/utils/workspace/chatImages";
import { basename, dirname, join, relative, resolve } from "node:path";
import { access, constants, copyFile, createReadStream, mkdir, readFile, readdir, stat, withFileAccess } from "@toonflow/file";
import {
  defineTool, createReadToolDefinition, createWriteToolDefinition, createEditToolDefinition, createLsToolDefinition,
  detectSupportedImageMimeTypeFromFile, type ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import type { CanvasContext, QuestionContext, ToolContext, ToolFiles } from "@toonflow/tools-scaffold/runtime";
import { asrRequestSchema } from "@toonflow/tools-scaffold/runtime";
import conf from "@/utils/conf";
import { isWithin, resolveWorkspacePath, writeWorkspaceFile, renameWorkspaceFile, removeWorkspaceFile, lockWorkspaceFiles, protectWorkspaceRoot } from "@/utils/workspace/files";
import { listTools, loadTool, validateToolConfig } from "@/utils/plugins/tools";
import { createSkillContext } from "@/agent/skills";
import { createAssetContext } from "@/agent/assets";
import { readDocument } from "@/utils/documents";
import { createMcpAgentTools } from "@/utils/mcp/servers";

export function createAgentToolContext(cwd: string, config: Record<string, unknown> = {}, canvas?: CanvasContext, question?: QuestionContext, workspaceAvailable = true): ToolContext {
  const sourceCanvas = canvas;
  if (sourceCanvas) {
    canvas = {
      get id() { return sourceCanvas.id; },
      get tools() { return sourceCanvas.tools; },
      getNodeLabel: sourceCanvas.getNodeLabel?.bind(sourceCanvas),
      call(request, signal) {
        if (request.name === "nodeTools") {
          const { name } = canvasSchemas.nodeTools.parse(request.args);
          const permissions = nodeToolPermissionsSchema.parse(conf.get("settings", {}).agentNodeTools ?? {});
          if (!isNodeToolAllowed(name, permissions)) {
            throw new Error(t`Agent 已禁用节点函数 ${name}，请在顶部节点工具控制中开启后再调用`);
          }
        }
        return sourceCanvas.call(request, signal);
      },
    };
  }
  const skillsDirectory = join(dirname(conf.path), "skills");
  const requireWorkspace = () => { if (!workspaceAvailable) throw new Error("此对话未提供工作目录，无法使用文件或媒体操作"); };
  const resolvePath = async (path: string, readOnly = false) => {
    requireWorkspace();
    const absolute = resolve(cwd, path);
    const root = readOnly && isWithin(skillsDirectory, absolute) ? skillsDirectory : cwd;
    return (await resolveWorkspacePath(root, relative(root, absolute), true)).path;
  };
  const withWritePaths = async (paths: string[], operation: (targets: string[]) => Promise<void>) => {
    const targets = await Promise.all(paths.map(path => resolvePath(path)));
    const release = lockWorkspaceFiles(targets);
    try { await operation(targets); }
    finally { release(); }
  };
  const files: ToolFiles = {
    importImage: url => { requireWorkspace(); return importImage(cwd, url); },
    readFile: async (path, readOnly = false, options) => {
      options?.signal?.throwIfAborted();
      const target = await resolvePath(path, readOnly);
      if (options?.maxBytes === undefined) return readFile(target, { signal: options?.signal });
      if (!Number.isSafeInteger(options.maxBytes) || options.maxBytes < 0) throw new Error("文件读取上限无效");
      const chunks: Buffer[] = [];
      let size = 0;
      // ACT: 多读一字节判断超限，避免 stat 后文件增长导致整个大文件进入内存。
      for await (const chunk of createReadStream(target, { end: options.maxBytes, signal: options.signal })) {
        const content = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += content.byteLength;
        if (size > options.maxBytes) throw Object.assign(new Error("文件超过读取大小上限"), { code: "EFBIG" });
        chunks.push(content);
      }
      return Buffer.concat(chunks, size);
    },
    access: async (path, readOnly = false) => access(await resolvePath(path, readOnly)),
    stat: async (path, readOnly = false) => stat(await resolvePath(path, readOnly)),
    readdir: async (path, readOnly = false, signal) => readdir(await resolvePath(path, readOnly), { signal }),
    detectImageMimeType: async (path, readOnly = false) => {
      const target = await resolvePath(path, readOnly);
      return withFileAccess([target], "read", () => detectSupportedImageMimeTypeFromFile(target));
    },
    writeFile: (path, content, exclusive = false) => withWritePaths([path], async ([target]) => {
      await writeWorkspaceFile(target, content, exclusive);
    }),
    mkdir: async (path, recursive = false) => {
      const target = await resolvePath(path);
      // ACT: 递归创建已有目录无需修改，锁父目录会与 Agent 自己持有的会话文件锁冲突。
      if (recursive && (await stat(target).catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return null;
        throw error;
      }))?.isDirectory()) return;
      const release = lockWorkspaceFiles([target]);
      try { await mkdir(target, { recursive }); }
      finally { release(); }
    },
    rename: (path, target) => withWritePaths([path, target], async ([source, destination]) => {
      protectWorkspaceRoot(cwd, source);
      protectWorkspaceRoot(cwd, destination);
      await renameWorkspaceFile(source, resolve(dirname(destination), basename(resolve(cwd, target))));
    }),
    remove: (path, recursive = false) => withWritePaths([path], async ([target]) => {
      protectWorkspaceRoot(cwd, target);
      await removeWorkspaceFile(cwd, target, recursive);
    }),
    copyFile: (path, target, exclusive = false) => withWritePaths([path, target], async ([source, destination]) => {
      await copyFile(source, destination, exclusive ? constants.COPYFILE_EXCL : 0);
    }),
  };
  return {
    cwd, config, files, resolvePath, writeFile: files.writeFile, canvas, question,
    skills: workspaceAvailable ? createSkillContext(cwd) : undefined, assets: workspaceAvailable ? createAssetContext(cwd) : undefined,
    browser: createBrowserContext(cwd),
    // ACT: OHOS 使用禁用 WASM 的嵌入式 Node，无法启动当前沙盒子进程。
    sandbox: workspaceAvailable && getRuntimePlatform().os !== "ohos" ? createSandboxContext({ files, resolvePath }) : undefined,
    asr: {
      async transcribe(path, options = {}) {
        requireWorkspace();
        options.signal?.throwIfAborted();
        if (!canvas) throw new Error("当前对话未连接画布，无法使用浏览器语音识别");
        const source = await resolvePath(path);
        const args = asrRequestSchema.parse({ path: relative(cwd, source).replaceAll("\\", "/"), lang: options.lang });
        options.signal?.throwIfAborted();
        const result = await canvas.call({ name: "transcribeAudio", args }, options.signal);
        if (typeof result !== "string") throw new Error("语音识别返回了无效的文本");
        return result;
      },
    },
    ffmpeg: signal => { requireWorkspace(); return createWorkspaceFfmpeg(cwd, signal); },
    executeFfmpeg: (request, emit, signal) => { requireWorkspace(); return executeWorkspaceFfmpeg(cwd, request, emit, signal); },
    media: workspaceAvailable ? {
      listModels: listMediaModels,
      generateImage: (request, signal) => generateMedia(cwd, "image", request, signal),
      generateVideo: (request, signal) => generateMedia(cwd, "video", request, signal),
      generateAudio: (request, signal) => generateMedia(cwd, "audio", request, signal),
    } : undefined,
    sdk: {
      defineTool, createWriteToolDefinition, createEditToolDefinition, createLsToolDefinition,
      createReadToolDefinition: (directory, options) => {
        const operations = options?.operations ?? {
          readFile: (path: string) => files.readFile(path, true),
          access: (path: string) => files.access(path, true),
          detectImageMimeType: (path: string) => files.detectImageMimeType(path, true),
        };
        const tool = createReadToolDefinition(directory, { ...options, operations: {
          ...operations,
          readFile: async path => readDocument(path, await operations.readFile(path)),
        } });
        return { ...tool, description: `${tool.description}\nHTML、Markdown、JSON、XML、配置和代码文件读取原文；Office、OpenDocument、RTF、EPUB、CSV、PDF 在本地解析为 Markdown。offset/limit 对应读取后的行。扫描 PDF 需要先做 OCR。` };
      },
      detectSupportedImageMimeTypeFromFile: path => files.detectImageMimeType(path, true),
    },
  };
}

export async function createAgentTools(cwd: string, canvas?: CanvasContext, question?: QuestionContext, includeMcp = true): Promise<ToolDefinition[]> {
  const tools: ToolDefinition[] = [];
  const names = new Set<string>();
  const context = createAgentToolContext(cwd, {}, canvas, question);
  for (const item of await listTools()) {
    if (!item.enabled) continue;
    if (item.loadError) throw new Error(`${item.displayName}：${item.loadError}`);
    const { plugin, metadata } = await loadTool(item.name);
    const config = validateToolConfig(plugin, item.config);
    const definitions = await plugin.createTools({ ...context, config });
    for (const tool of definitions) {
      if (!tool.name || typeof tool.execute !== "function") throw new Error(t`${item.displayName} 返回了无效的工具`);
      if (names.has(tool.name)) throw new Error(t`工具名称重复：${tool.name}`);
      names.add(tool.name);
      tools.push({
        ...tool,
        promptGuidelines: [
          ...(metadata.prompt ? [metadata.prompt] : []),
          ...(tool.promptGuidelines ?? []),
        ],
      });
    }
  }
  if (includeMcp) tools.push(...await createMcpAgentTools());
  return tools;
}
