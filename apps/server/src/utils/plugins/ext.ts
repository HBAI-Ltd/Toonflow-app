import { lstat, readFile } from "@toonflow/file";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import { localModelDefinitionsSchema } from "@toonflow/plugin-server/localModels";
import { parse } from "@babel/parser";
import { t } from "@/lib/i18n";
import conf from "@/utils/conf";
import { configFields, configRulesSchema, declaredConfig, validateNodeConfig } from "@/utils/plugins/nodes";

export const extNameSchema = z.string().max(96).regex(/^ext-[a-z][a-zA-Z0-9]*$/);
export const extDirectory = resolve(dirname(conf.path), "ext");

export function extFileName(name: string) {
  extNameSchema.parse(name);
  return `${name.slice(4)}.ext.js`;
}

export function extNameFromFile(fileName: string) {
  if (/^[a-z][a-zA-Z0-9]*\.ext\.js$/.test(fileName)) return `ext-${fileName.slice(0, -7)}`;
  if (/^ext-[a-z][a-zA-Z0-9]*\.umd\.js$/.test(fileName)) return fileName.slice(0, -7);
}

export function extPaths(name: string, directory = extDirectory) {
  return [resolve(directory, extFileName(name)), resolve(directory, `${name}.umd.js`)];
}

export async function resolveExtPath(name: string, directory = extDirectory) {
  const paths = extPaths(name, directory);
  // ACT: 旧安装文件只读兼容；新格式优先，不在读取或启动时删除旧文件。
  for (const path of paths) {
    const file = await lstat(path).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    if (file) return path;
  }
  return paths[0]!;
}
const metadataSchema = z.object({
  localModels: localModelDefinitionsSchema.optional(),
  id: extNameSchema,
  displayName: z.string().trim().min(1),
  extensions: z.array(z.string().regex(/^[a-z0-9]+$/)),
  resourceKind: z.enum(["file", "canvasNode"]),
  text: z.boolean().optional(),
  version: z.string().trim().min(1),
  readme: z.string().default(""),
  author: z.string().default(""),
  github: z.string().default(""),
  icon: z.string().refine(icon => !icon || /^data:image\/(?:svg\+xml|png|jpeg|webp|gif|avif)(?:;[^,]*)?,/i.test(icon)
    || (URL.canParse(icon) && ["http:", "https:"].includes(new URL(icon).protocol))).optional(),
  configRules: configRulesSchema.default([]),
});

export function parseExt(source: string, name: string) {
  extNameSchema.parse(name);
  try {
    const header = source.match(/^\/\*! toonflowExt:([^\r\n]*) \*\/(?:\r?\n|$)/)?.[1];
    const metadata = metadataSchema.parse(JSON.parse(header ?? ""));
    if (metadata.id !== name || (metadata.resourceKind === "file" && !metadata.extensions.length)
      || new Set(metadata.extensions).size !== metadata.extensions.length) throw new Error("metadata");
    if (metadata.github) {
      const url = new URL(metadata.github);
      if (url.origin !== "https://github.com" || url.username || url.password) throw new Error("github");
    }
    return { name, ...metadata };
  } catch {
    throw Object.assign(new Error("文件扩展元数据无效，请使用扩展脚手架重新构建，且文件名必须与扩展 ID 一致"), { status: 400 });
  }
}

export function validateExtSource(source: string, name: string) {
  const metadata = parseExt(source, name);
  let syntax: ReturnType<typeof parse>;
  try { syntax = parse(source, { sourceType: "script" }); }
  catch { throw Object.assign(new Error("文件扩展脚本语法无效，请重新构建完整的 .ext.js 文件"), { status: 400 }); }
  function propertyName(value: unknown): string | undefined {
    if (!value || typeof value !== "object" || !("type" in value) || value.type !== "MemberExpression") return;
    const member = value as Record<string, unknown>;
    const property = member.property as Record<string, unknown> | undefined;
    if (!property) return;
    if (!member.computed && property.type === "Identifier") return property.name as string;
    if (member.computed && property.type === "StringLiteral") return property.value as string;
    if (member.computed && property.type === "TemplateLiteral" && Array.isArray(property.expressions) && !property.expressions.length) {
      const quasis = property.quasis as { value: { cooked: string | null } }[];
      return quasis[0]?.value.cooked ?? undefined;
    }
  }
  const pending: unknown[] = [syntax.program];
  while (pending.length) {
    const value = pending.pop();
    if (!value || typeof value !== "object") continue;
    if (Array.isArray(value)) { pending.push(...value); continue; }
    const node = value as Record<string, unknown>;
    if (node.type === "AssignmentExpression" && node.operator === "=" && propertyName(node.left) === name) {
      const target = node.left as Record<string, unknown>;
      if (propertyName(target.object) === "toonflowExts") return metadata;
    }
    // 只识别真实语法节点，注释、字符串或源码中的示例不能冒充导出。
    for (const [key, child] of Object.entries(node)) {
      if (!["comments", "leadingComments", "trailingComments", "innerComments", "loc", "extra"].includes(key)) pending.push(child);
    }
  }
  throw Object.assign(new Error("文件不是兼容的 Toonflow 文件扩展，请使用扩展脚手架构建并保留原文件名"), { status: 400 });
}

export async function readExt(name: string) {
  extNameSchema.parse(name);
  const removed = await lstat(resolve(extDirectory, `${name}.removed`)).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
  if (removed) throw Object.assign(new Error("文件扩展不存在"), { code: "ENOENT", status: 404 });
  const path = await resolveExtPath(name);
  const file = await lstat(path);
  if (!file.isFile()) throw Object.assign(new Error("文件扩展必须是普通文件"), { status: 400 });
  if (file.size > 20 * 1024 * 1024) throw Object.assign(new Error("文件扩展不能超过 20 MB"), { status: 413 });
  const source = await readFile(path, "utf8");
  return { ...parseExt(source, name), revision: Bun.hash(source).toString(16), installedAt: conf.get("pluginInstalledAt", {})[`ext:${name}`] ?? file.mtimeMs };
}

export function getExtConfig(extension: { name: string; configRules: z.infer<typeof configRulesSchema> }) {
  const configs = conf.get("extConfigs", {});
  return declaredConfig(extension.configRules, Object.hasOwn(configs, extension.name) ? configs[extension.name]! : {});
}

export function validateExtConfig(rules: z.infer<typeof configRulesSchema>, config: Record<string, unknown>) {
  const parsed = validateNodeConfig(rules, config);
  for (const { rule } of configFields(rules)) {
    if (typeof rule.field !== "string" || !Object.hasOwn(parsed, rule.field)) continue;
    const value = parsed[rule.field];
    const props = rule.props && typeof rule.props === "object" && !Array.isArray(rule.props) ? rule.props : {};
    const label = typeof rule.title === "string" && rule.title.trim() ? rule.title : rule.field;
    let message = "";
    if (rule.type === "inputNumber") {
      if (typeof value !== "number" || !Number.isFinite(value)) message = t`${label}必须为数字`;
      else if (typeof props.min === "number" && value < props.min) message = t`${label}不能小于${props.min}`;
      else if (typeof props.max === "number" && value > props.max) message = t`${label}不能大于${props.max}`;
    } else if (rule.type === "switch" && value !== (props.activeValue ?? true) && value !== (props.inactiveValue ?? false)) {
      message = t`${label}的开关值无效`;
    }
    // ACT: 仅校验已支持的标准控件；自定义控件保留其值，新增控件时再补对应规则。
    if (message) throw Object.assign(new Error(message), { status: 400 });
  }
  return parsed;
}
