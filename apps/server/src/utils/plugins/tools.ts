import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import * as zod from "zod";
import { toolMetadataSchema, toolNameSchema, type ToolMetadata, type ToolPlugin } from "@toonflow/tools-scaffold/runtime";
import conf from "@/utils/conf";

export { toolNameSchema } from "@toonflow/tools-scaffold/runtime";

const { z } = zod;

// ACT: 工具复用宿主 Zod 4；虚拟模块不依赖安装目录中的 node_modules。
Bun.plugin({
  name: "toolHost",
  setup(build) {
    build.module("toonflow:tool-zod", () => ({ exports: zod, loader: "object" }));
  },
});

export const toolsDirectory = resolve(dirname(conf.path), "tools");

export function parseTool(source: string, name: string) {
  let metadata: zod.infer<typeof toolMetadataSchema>;
  try {
    const header = source.match(/^\/\*! toonflowTool:([^\r\n]*) \*\/(?:\r?\n|$)/)?.[1];
    metadata = toolMetadataSchema.parse(JSON.parse(header ?? ""));
    if (metadata.name !== name) throw new Error("name");
  } catch {
    throw Object.assign(new Error("工具元数据无效，或文件名与工具名称不一致"), { status: 400 });
  }
  const client = parseToolClient(source);
  if (metadata.components.length && !client) throw Object.assign(new Error("工具声明了组件但缺少客户端界面"), { status: 400 });
  return { metadata, client };
}

function parseToolClient(source: string) {
  const line = source.split(/\r?\n/, 2)[1];
  if (!line?.startsWith("/*! toonflowToolClient:")) return;
  try {
    const data = line.match(/^\/\*! toonflowToolClient:([^\r\n]*) \*\/$/)?.[1];
    const client = z.strictObject({ code: z.string().min(1).refine(code => !!code.trim()), css: z.string() }).parse(JSON.parse(data ?? ""));
    new Bun.Transpiler({ loader: "js" }).scan(client.code);
    return client;
  } catch {
    throw Object.assign(new Error("工具客户端界面格式或脚本语法无效"), { status: 400 });
  }
}

export async function readTool(name: string, directory = toolsDirectory) {
  toolNameSchema.parse(name);
  const path = resolve(directory, `${name}.tool.js`);
  const file = await lstat(path);
  if (!file.isFile()) throw Object.assign(new Error("工具文件无效"), { status: 400 });
  if (file.size > 20 * 1024 * 1024) throw Object.assign(new Error("工具文件不能超过 20 MB"), { status: 400 });
  const source = await readFile(path, "utf8");
  return { path, source, revision: createHash("sha256").update(source).digest("hex"), ...parseTool(source, name) };
}

export function getToolConfig(metadata: ToolMetadata): Record<string, unknown> {
  const defaults = Object.fromEntries(metadata.configRules
    .filter(rule => typeof rule.field === "string" && rule.value !== undefined)
    .map(rule => [rule.field, rule.value]));
  const saved = conf.get("toolConfigs", {});
  return { ...defaults, ...(Object.hasOwn(saved, metadata.name) ? saved[metadata.name] : {}) };
}

export async function listTools() {
  const files = await readdir(toolsDirectory, { withFileTypes: true }).catch((err: NodeJS.ErrnoException) => {
    if (err.code === "ENOENT") return [];
    throw err;
  });
  return Promise.all(files.filter(file => file.isFile() && /^[a-z][a-zA-Z0-9]*\.tool\.js$/.test(file.name))
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(async file => {
      const name = file.name.slice(0, -8);
      const enabled = !files.some(entry => entry.name === `${name}.disabled`);
      try {
        const { metadata, revision } = await readTool(name);
        return { ...metadata, enabled, config: getToolConfig(metadata), revision, loadError: "" };
      } catch (err) {
        const loadError = err instanceof Error ? err.message : "工具文件无法读取";
        return { name, version: "", displayName: name, description: loadError, author: "", github: "", components: [], configRules: [], enabled, config: {}, revision: "", loadError };
      }
    }));
}

export async function loadTool(name: string, directory = toolsDirectory) {
  const { path, metadata } = await readTool(name, directory);
  // ACT: 工具是可信的服务端代码，不是沙箱；安装成功后由安装器清除模块缓存。
  const { default: plugin } = await import(pathToFileURL(path).href) as { default: ToolPlugin };
  if (typeof plugin?.createTools !== "function" || typeof plugin.validateConfig !== "function") {
    throw Object.assign(new Error(`${metadata.displayName} 未导出有效的工具插件`), { status: 400 });
  }
  return { plugin, metadata };
}

export function validateToolConfig(plugin: ToolPlugin, config: Record<string, unknown>) {
  try {
    return plugin.validateConfig(config);
  } catch (err) {
    throw Object.assign(new Error(err instanceof Error ? err.message : "工具配置无效"), { status: 400 });
  }
}
