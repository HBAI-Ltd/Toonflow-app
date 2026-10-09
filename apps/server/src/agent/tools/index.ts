import { t } from "@/lib/i18n";
import { listMediaModels, generateMedia } from "@/utils/media/generation";
import { createWorkspaceFfmpeg } from "@/utils/ffmpeg";
import { createBrowserContext } from "@/utils/browser";
import { importImage } from "@/utils/workspace/chatImages";
import { basename, dirname, join, relative, resolve } from "node:path";
import { access, constants, copyFile, lstat, mkdir, readFile, readdir, rm, rmdir, stat, withFileAccess } from "@toonflow/file";
import {
  defineTool, createReadToolDefinition, createWriteToolDefinition, createEditToolDefinition, createLsToolDefinition,
  detectSupportedImageMimeTypeFromFile, type ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import type { CanvasContext, QuestionContext, ToolContext, ToolFiles } from "@toonflow/tools-scaffold/runtime";
import conf from "@/utils/conf";
import { isWithin, resolveWorkspacePath, writeWorkspaceFile, renameWorkspaceFile, lockWorkspaceFiles, protectWorkspaceRoot } from "@/utils/workspace/files";
import { listTools, loadTool, validateToolConfig } from "@/utils/plugins/tools";
import { createSkillContext } from "@/agent/skills";
import { createAssetContext } from "@/agent/assets";

export function createAgentToolContext(cwd: string, config: Record<string, unknown> = {}, canvas?: CanvasContext, question?: QuestionContext, workspaceAvailable = true): ToolContext {
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
    readFile: async (path, readOnly = false) => readFile(await resolvePath(path, readOnly)),
    access: async (path, readOnly = false) => access(await resolvePath(path, readOnly)),
    stat: async (path, readOnly = false) => stat(await resolvePath(path, readOnly)),
    readdir: async (path, readOnly = false) => readdir(await resolvePath(path, readOnly)),
    detectImageMimeType: async (path, readOnly = false) => {
      const target = await resolvePath(path, readOnly);
      return withFileAccess([target], "read", () => detectSupportedImageMimeTypeFromFile(target));
    },
    writeFile: (path, content, exclusive = false) => withWritePaths([path], async ([target]) => {
      await writeWorkspaceFile(target, content, exclusive);
    }),
    mkdir: (path, recursive = false) => withWritePaths([path], async ([target]) => {
      await mkdir(target, { recursive });
    }),
    rename: (path, target) => withWritePaths([path, target], async ([source, destination]) => {
      protectWorkspaceRoot(cwd, source);
      protectWorkspaceRoot(cwd, destination);
      await renameWorkspaceFile(source, resolve(dirname(destination), basename(resolve(cwd, target))));
    }),
    remove: (path, recursive = false) => withWritePaths([path], async ([target]) => {
      protectWorkspaceRoot(cwd, target);
      if ((await lstat(target)).isDirectory() && !recursive) await rmdir(target);
      else await rm(target, { recursive });
    }),
    copyFile: (path, target, exclusive = false) => withWritePaths([path, target], async ([source, destination]) => {
      await copyFile(source, destination, exclusive ? constants.COPYFILE_EXCL : 0);
    }),
  };
  return {
    cwd, config, files, resolvePath, writeFile: files.writeFile, canvas, question,
    skills: workspaceAvailable ? createSkillContext(cwd) : undefined, assets: workspaceAvailable ? createAssetContext(cwd) : undefined,
    browser: createBrowserContext(cwd),
    ffmpeg: signal => { requireWorkspace(); return createWorkspaceFfmpeg(cwd, signal); },
    media: workspaceAvailable ? {
      listModels: listMediaModels,
      generateImage: (request, signal) => generateMedia(cwd, "image", request, signal),
      generateVideo: (request, signal) => generateMedia(cwd, "video", request, signal),
      generateAudio: (request, signal) => generateMedia(cwd, "audio", request, signal),
    } : undefined,
    sdk: {
      defineTool, createReadToolDefinition, createWriteToolDefinition, createEditToolDefinition, createLsToolDefinition,
      detectSupportedImageMimeTypeFromFile: path => files.detectImageMimeType(path, true),
    },
  };
}

export async function createAgentTools(cwd: string, canvas?: CanvasContext, question?: QuestionContext): Promise<ToolDefinition[]> {
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
  return tools;
}
