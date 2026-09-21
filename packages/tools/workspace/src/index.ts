import { access, mkdir, readFile, readdir, stat } from "node:fs/promises";
import { z } from "zod";
import type { ToolDefinition, ToolPlugin } from "@toonflow/tools-scaffold/runtime";

const configSchema = z.object({ readOnly: z.boolean().default(false) }).strict();

const plugin: ToolPlugin = {
  validateConfig: config => configSchema.parse(config),
  createTools({ cwd, config, resolvePath, writeFile, sdk }) {
    const { readOnly } = configSchema.parse(config);
    const read = async (path: string, readOnly = false) => readFile(await resolvePath(path, readOnly));
    const checkAccess = async (path: string, readOnly = false) => access(await resolvePath(path, readOnly));
    const tools: ToolDefinition[] = [
      sdk.defineTool(sdk.createReadToolDefinition(cwd, { operations: {
        readFile: path => read(path, true),
        access: path => checkAccess(path, true),
        detectImageMimeType: async path => sdk.detectSupportedImageMimeTypeFromFile(await resolvePath(path, true)),
      } })),
      sdk.defineTool(sdk.createLsToolDefinition(cwd, { operations: {
        exists: async path => { await resolvePath(path, true); return true; },
        stat: async path => stat(await resolvePath(path, true)),
        readdir: async path => readdir(await resolvePath(path, true)),
      } })),
    ];
    if (!readOnly) {
      tools.splice(1, 0,
        sdk.defineTool(sdk.createWriteToolDefinition(cwd, { operations: {
          writeFile,
          mkdir: async path => { await mkdir(await resolvePath(path), { recursive: true }); },
        } })),
        sdk.defineTool(sdk.createEditToolDefinition(cwd, { operations: { readFile: read, access: checkAccess, writeFile } })),
      );
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
