import { t } from "@/lib/i18n";
import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, readdir, writeAtomic } from "@toonflow/file";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import conf from "@/utils/conf";
import { loadToolModule, parseTool, validateToolConfig } from "./tools";

export const nodeNameSchema = z.string().max(96).regex(/^[a-z][a-zA-Z0-9]*$/);
export const nodesDirectory = resolve(dirname(conf.path), "nodes");
export const configRulesSchema = z.array(z.record(z.string(), z.json())).max(100);
type ConfigRule = z.infer<typeof configRulesSchema>[number];

function parseNodeMetadata(source: string): Record<string, unknown> {
  try {
    const header = source.match(/^\/\*! toonflowNode:([^\r\n]*) \*\/(?:\r?\n|$)/)?.[1];
    const parsed = header ? JSON.parse(header) : null;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch { return {}; }
}

async function readNodePackage(name: string) {
  nodeNameSchema.parse(name);
  const path = resolve(nodesDirectory, `${name}.umd.js`);
  const file = await lstat(path).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") throw Object.assign(error, { status: 404, message: "节点不存在" });
    throw error;
  });
  if (!file.isFile()) throw Object.assign(new Error("节点文件无效"), { status: 400 });
  if (file.size > 20 * 1024 * 1024) throw Object.assign(new Error(t`节点文件不能超过 20 MB`), { status: 400 });
  // ACT: 当前整包读取，内存开销随节点总体积增长；节点变多或包变大时改为只读首行。
  const source = await readFile(path, "utf8");
  if (Buffer.byteLength(source, "utf8") > 20 * 1024 * 1024) throw Object.assign(new Error(t`节点文件不能超过 20 MB`), { status: 400 });
  return { source, metadata: parseNodeMetadata(source), file };
}

function nodeDetails(name: string, metadata: Record<string, unknown>, installedAt: number) {
  let github = "";
  if (typeof metadata.github === "string" && URL.canParse(metadata.github)) {
    const url = new URL(metadata.github);
    if (url.origin === "https://github.com" && !url.username && !url.password) github = url.href;
  }
  const rules = configRulesSchema.safeParse(metadata.configRules ?? []);
  if (!rules.success) throw Object.assign(new Error("节点配置表单规则无效，请重新构建节点"), { status: 400 });
  return {
    name,
    installedAt: conf.get("pluginInstalledAt", {})[`node:${name}`] ?? installedAt,
    displayName: typeof metadata.displayName === "string" && metadata.displayName.trim() ? metadata.displayName : name,
    version: typeof metadata.version === "string" ? metadata.version.trim() : "",
    author: typeof metadata.author === "string" ? metadata.author : "",
    readme: typeof metadata.readme === "string" ? metadata.readme : "",
    github,
    configRules: rules.data,
  };
}

export async function readNode(name: string) {
  const { metadata, file } = await readNodePackage(name);
  return nodeDetails(name, metadata, file.mtimeMs);
}

export function parseNodeServerTool(source: string, name: string) {
  const embedded = parseNodeMetadata(source).serverTool;
  if (embedded === undefined) return;
  if (typeof embedded !== "string" || !embedded.trim() || Buffer.byteLength(embedded, "utf8") > 20 * 1024 * 1024) {
    throw Object.assign(new Error(t`节点配套服务源码无效或超过 20 MB`), { status: 400 });
  }
  const parsed = parseTool(embedded, name);
  try {
    if (!new Bun.Transpiler({ loader: "js" }).scan(embedded).exports.includes("default")) throw new Error("default");
  } catch { throw Object.assign(new Error(t`节点配套服务脚本语法无效或缺少默认导出`), { status: 400 }); }
  return { source: embedded, metadata: parsed.metadata };
}

export async function listNodeServerTools() {
  const files = await readdir(nodesDirectory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const result: { name: string; displayName: string }[] = [];
  for (const entry of files.filter(file => file.isFile() && /^[a-z][a-zA-Z0-9]*\.umd\.js$/.test(file.name)).sort((left, right) => left.name.localeCompare(right.name))) {
    const name = entry.name.slice(0, -7);
    if (files.some(file => file.name === `${name}.disabled`)) continue;
    const bundle = await readNodePackage(name);
    const tool = parseNodeServerTool(bundle.source, name);
    if (tool) result.push({ name, displayName: tool.metadata.displayName });
  }
  return result;
}

export async function loadNodeServerTool(name: string) {
  nodeNameSchema.parse(name);
  const disabled = await lstat(resolve(nodesDirectory, `${name}.disabled`)).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
  if (disabled) throw Object.assign(new Error(t`节点 ${name} 未启用`), { status: 400 });
  const bundle = await readNodePackage(name);
  const tool = parseNodeServerTool(bundle.source, name);
  if (!tool) throw Object.assign(new Error(t`节点 ${name} 没有配套服务工具，请重新安装完整节点`), { status: 400 });
  const revision = createHash("sha256").update(tool.source).digest("hex");
  // ACT: 仅缓存已安装可信节点内的同名服务，源码修订使用独立文件；不写全局工具、不清理旧修订或用户作品。
  let directory = nodesDirectory;
  for (const segment of ["pluginResources", name]) {
    const parent = await lstat(directory);
    if (!parent.isDirectory() || parent.isSymbolicLink()) throw Object.assign(new Error(t`节点服务缓存目录无效`), { status: 403 });
    directory = resolve(directory, segment);
    await mkdir(directory, { recursive: true });
  }
  const info = await lstat(directory);
  if (!info.isDirectory() || info.isSymbolicLink()) throw Object.assign(new Error(t`节点服务缓存目录无效`), { status: 403 });
  const path = resolve(directory, `server${revision}.tool.js`);
  const cached = await lstat(path).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
  if (cached && !cached.isFile()) throw Object.assign(new Error(t`节点服务缓存文件无效`), { status: 403 });
  if (!cached) {
    await writeAtomic(path, tool.source, { exclusive: true }).catch((error: NodeJS.ErrnoException) => { if (error.code !== "EEXIST") throw error; });
  }
  if (!(await lstat(path)).isFile()) throw Object.assign(new Error(t`节点服务缓存文件无效`), { status: 403 });
  if (await readFile(path, "utf8") !== tool.source) throw Object.assign(new Error(t`节点服务缓存与已安装修订不一致`), { status: 409 });
  const loaded = await loadToolModule(path, tool.metadata);
  return { ...loaded, config: validateToolConfig(loaded.plugin, getNodeConfig(nodeDetails(name, bundle.metadata, bundle.file.mtimeMs))) };
}

export function configFields(rules: ConfigRule[], conditional = false): { rule: ConfigRule; conditional: boolean }[] {
  return rules.flatMap(rule => {
    const children = Array.isArray(rule.children) ? rule.children.filter(item => item && typeof item === "object" && !Array.isArray(item)) as ConfigRule[] : [];
    const controls = Array.isArray(rule.control) ? rule.control.flatMap(control => control && typeof control === "object" && !Array.isArray(control)
      && Array.isArray(control.rule) ? control.rule.filter(item => item && typeof item === "object" && !Array.isArray(item)) as ConfigRule[] : []) : [];
    return [{ rule, conditional }, ...configFields(children, conditional), ...configFields(controls, true)];
  });
}

export function declaredConfig(rules: ConfigRule[], config: Record<string, unknown>) {
  return Object.fromEntries(configFields(rules).map(({ rule }) => rule)
    .filter(rule => typeof rule.field === "string" && rule.field.length > 0)
    .flatMap(rule => {
      const field = rule.field as string;
      const value = Object.hasOwn(config, field) ? config[field] : rule.value;
      return value === undefined ? [] : [[field, value]];
    }));
}

export function getNodeConfig(node: { name: string; configRules: ConfigRule[] }) {
  const configs = conf.get("nodeConfigs", {});
  return declaredConfig(node.configRules, Object.hasOwn(configs, node.name) ? configs[node.name]! : {});
}

export function validateNodeConfig(rules: ConfigRule[], config: Record<string, unknown>) {
  const parsed = declaredConfig(rules, config);
  for (const { rule, conditional } of configFields(rules)) {
    const required = rule.required === true || (Array.isArray(rule.validate) && rule.validate.some(validation =>
      validation && typeof validation === "object" && !Array.isArray(validation) && validation.required === true));
    if (!required || typeof rule.field !== "string" || !rule.field) continue;
    // ACT: 条件控件由表单决定是否提交；隐藏且未提交的字段不触发必填校验。
    if (conditional && !Object.hasOwn(config, rule.field)) continue;
    const value = Object.hasOwn(parsed, rule.field) ? parsed[rule.field] : undefined;
    if (value == null || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && !value.length)) {
      const label = typeof rule.title === "string" && rule.title.trim() ? rule.title : rule.field;
      throw Object.assign(new Error(t`请填写${label}`), { status: 400 });
    }
  }
  return parsed;
}
