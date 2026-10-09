import { z } from "zod";
import type { ToolDefinition, ToolPlugin } from "@toonflow/tools-scaffold/runtime";

const configSchema = z.object({ readOnly: z.boolean().default(false) }).strict();
const downloadImageSchema = z.object({ url: z.string().trim().min(1).max(8192).describe("公开 HTTP(S) 图片直链") }).strict();

const plugin: ToolPlugin = {
  validateConfig: config => configSchema.parse(config),
  createTools({ cwd, config, files, sdk }) {
    const { readOnly } = configSchema.parse(config);
    const tools: ToolDefinition[] = [
      sdk.defineTool(sdk.createReadToolDefinition(cwd, { operations: {
        readFile: path => files.readFile(path, true),
        access: path => files.access(path, true),
        detectImageMimeType: path => files.detectImageMimeType(path, true),
      } })),
      sdk.defineTool(sdk.createLsToolDefinition(cwd, { operations: {
        exists: async path => {
          try { await files.access(path, true); return true; }
          catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error; }
        },
        stat: path => files.stat(path, true),
        readdir: path => files.readdir(path, true),
      } })),
    ];
    if (!readOnly) {
      tools.splice(1, 0,
        sdk.defineTool(sdk.createWriteToolDefinition(cwd, { operations: {
          writeFile: files.writeFile,
          mkdir: path => files.mkdir(path, true),
        } })),
        sdk.defineTool(sdk.createEditToolDefinition(cwd, { operations: { readFile: files.readFile, access: files.access, writeFile: files.writeFile } })),
      );
      tools.push({
        name: "downloadImage",
        label: "下载图片",
        description: "下载公开 HTTP(S) 图片并保存到当前工作区，返回工作区相对路径和 MIME 类型。支持 PNG、JPEG、WebP、GIF、AVIF、BMP，单张不超过 20 MB；不支持需要登录的图片、SVG、本机和内网地址。输出路径由宿主决定，无需指定目录。",
        promptSnippet: "将远程图片下载到工作区，返回可用于本地预览和参考素材的相对路径。",
        promptGuidelines: ["保存远程图片时使用 downloadImage，不用 web_fetch、write 或 FFmpeg 下载；成功后使用返回的工作区相对路径展示 Markdown 图片，例如 ![图片](<assets/chatImages/文件名.jpg>)。"],
        parameters: z.toJSONSchema(downloadImageSchema, { io: "input", target: "draft-07" }),
        executionMode: "sequential",
        async execute(toolCallId, params, signal) {
          signal?.throwIfAborted();
          const { url } = downloadImageSchema.parse(params);
          const result = await files.importImage(url);
          signal?.throwIfAborted();
          return {
            content: [{ type: "text", text: `图片已保存到工作区：${result.path}\nMIME 类型：${result.mimeType}\n![下载图片](<${result.path}>)` }],
            details: result,
          };
        },
      });
    }
    return tools.map(tool => ({
      ...tool,
      promptGuidelines: [
        ...(tool.promptGuidelines ?? []),
        ...(readOnly ? ["当前文件工具只支持读取，不能用它们写入或编辑文件；其他工具的能力以各自说明为准。"] : []),
      ],
    }));
  },
};

export default plugin;
