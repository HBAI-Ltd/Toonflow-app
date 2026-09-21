import { listMediaModels, generateMedia } from "@/utils/media/generation";
import { convertMedia } from "@/utils/media/ffmpegProcessor";
import { dirname, join, relative, resolve } from "node:path";
import {
  defineTool, createReadToolDefinition, createWriteToolDefinition, createEditToolDefinition, createLsToolDefinition,
  detectSupportedImageMimeTypeFromFile, type ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import type { CanvasContext, QuestionContext, ToolContext } from "@toonflow/tools-scaffold/runtime";
import conf from "@/utils/conf";
import { isWithin, resolveWorkspacePath, writeWorkspaceFile, lockWorkspaceFiles } from "@/utils/workspace/files";
import { listTools, loadTool, validateToolConfig } from "@/utils/plugins/tools";
import { createSkillContext } from "@/agent/skills";
import { createFfmpegTool } from "@/agent/tools/ffmpeg";

export function createAgentToolContext(cwd: string, config: Record<string, unknown> = {}, canvas?: CanvasContext, question?: QuestionContext): ToolContext {
  const skillsDirectory = join(dirname(conf.path), "skills");
  const resolvePath = async (path: string, readOnly = false) => {
    const absolute = resolve(cwd, path);
    const root = readOnly && isWithin(skillsDirectory, absolute) ? skillsDirectory : cwd;
    return (await resolveWorkspacePath(root, relative(root, absolute), true)).path;
  };
  const writeFile = async (path: string, content: string) => {
    const target = await resolvePath(path);
    const release = lockWorkspaceFiles([target]);
    try { await writeWorkspaceFile(target, content); }
    finally { release(); }
  };
  return {
    cwd, config, resolvePath, writeFile, canvas, question, skills: createSkillContext(cwd),
    ffmpeg: { convert: convertMedia },
    media: {
      listModels: listMediaModels,
      generateImage: (request, signal) => generateMedia(cwd, "image", request, signal),
      generateVideo: (request, signal) => generateMedia(cwd, "video", request, signal),
      generateAudio: (request, signal) => generateMedia(cwd, "audio", request, signal),
    },
    sdk: { defineTool, createReadToolDefinition, createWriteToolDefinition, createEditToolDefinition, createLsToolDefinition, detectSupportedImageMimeTypeFromFile },
  };
}

export async function createAgentTools(cwd: string, canvas?: CanvasContext, question?: QuestionContext): Promise<ToolDefinition[]> {
  const ffmpegTool = await createFfmpegTool(cwd);
  const tools: ToolDefinition[] = ffmpegTool ? [ffmpegTool] : [];
  const names = new Set(tools.map(tool => tool.name));
  const context = createAgentToolContext(cwd, {}, canvas, question);
  for (const item of await listTools()) {
    if (!item.enabled) continue;
    if (item.loadError) throw new Error(`${item.displayName}：${item.loadError}`);
    const { plugin, metadata } = await loadTool(item.name);
    const config = validateToolConfig(plugin, item.config);
    const definitions = await plugin.createTools({ ...context, config });
    for (const tool of definitions) {
      if (!tool.name || typeof tool.execute !== "function") throw new Error(`${item.displayName} 返回了无效的工具`);
      if (names.has(tool.name)) throw new Error(`工具名称重复：${tool.name}`);
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
