import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, readdir, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createContext, SourceTextModule } from "node:vm";
import type { AudioConvertOptions, Provider, ProviderTools } from "@toonflow/providers";
import { parse, parseExpression } from "@babel/parser";
import { z } from "zod";
import conf from "@/utils/conf";
import { convertAudio } from "@/utils/media/audioProcessor";
import { createWorkspaceFfmpeg } from "@/utils/ffmpeg";
import { lockWorkspaceFiles, writeWorkspaceFile } from "@/utils/workspace/files";

type Expression = Extract<ReturnType<typeof parseExpression>, { type: "ParenthesizedExpression" }>["expression"];
type ObjectExpression = Extract<Expression, { type: "ObjectExpression" }>;

const providerTranspiler = new Bun.Transpiler({ loader: "ts", target: "bun", define: { require: "undefined" } });

const providerIdSchema = z.string().max(96).regex(/^[a-z][a-zA-Z0-9]*$/)
  .refine(value => !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(value), "供应商 ID 不能是系统保留文件名");
export const mediaProviderFileSchema = z.string().refine(value => value.endsWith(".ts") && providerIdSchema.safeParse(value.slice(0, -3)).success, "供应商文件名无效");
export const mediaModelsSchema = z.array(z.object({
  id: z.string().min(1).max(200).refine(value => !!value.trim()),
  label: z.string().min(1).max(200).refine(value => !!value.trim()),
  type: z.enum(["text", "image", "video", "audio"]),
}).catchall(z.json())).max(2000).refine(models => new Set(models.map(model => model.id)).size === models.length, "模型 ID 不能重复");

function invalid(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}

function unwrap(expression: Expression): Expression {
  while (expression.type === "TSAsExpression" || expression.type === "TSSatisfiesExpression" || expression.type === "ParenthesizedExpression" || expression.type === "TSTypeAssertion") {
    expression = expression.expression;
  }
  return expression;
}

function properties(object: ObjectExpression) {
  const result = new Map<string, ObjectExpression["properties"][number]>();
  for (const property of object.properties) {
    if (property.type === "SpreadElement" || property.computed) invalid("供应商对象和模型配置不能使用展开或计算属性");
    const name = property.key.type === "Identifier" ? property.key.name : property.key.type === "StringLiteral" ? property.key.value : undefined;
    if (name === undefined || result.has(name)) invalid("供应商对象和模型配置包含无效或重复属性");
    result.set(name, property);
  }
  return result;
}

function literal(value: Expression): z.infer<ReturnType<typeof z.json>> {
  const expression = unwrap(value);
  if (expression.type === "NumericLiteral" && !Number.isFinite(expression.value)) invalid("models 数值必须有限");
  if (expression.type === "StringLiteral" || expression.type === "NumericLiteral" || expression.type === "BooleanLiteral") return expression.value;
  if (expression.type === "NullLiteral") return null;
  if (expression.type === "TemplateLiteral" && !expression.expressions.length) return expression.quasis[0]?.value.cooked ?? "";
  if (expression.type === "UnaryExpression" && (expression.operator === "-" || expression.operator === "+") && expression.argument.type === "NumericLiteral") {
    if (!Number.isFinite(expression.argument.value)) invalid("models 数值必须有限");
    return expression.operator === "-" ? -expression.argument.value : expression.argument.value;
  }
  if (expression.type === "ArrayExpression") return expression.elements.map(item => {
    if (!item || item.type === "SpreadElement") invalid("models 仅支持 JSON 字面量");
    return literal(item);
  });
  if (expression.type === "ObjectExpression") return Object.fromEntries([...properties(expression)].map(([name, property]) => {
    if (property.type !== "ObjectProperty" || property.shorthand) invalid("models 仅支持 JSON 字面量");
    return [name, literal(property.value as Expression)];
  }));
  return invalid("供应商元数据和 models 必须直接使用字面量");
}

function parseProvider(source: string) {
  if (Buffer.byteLength(source, "utf8") > 2 * 1024 * 1024) invalid("供应商文件不能超过 2 MB");
  let module: ReturnType<typeof parse>;
  try { module = parse(source, { sourceType: "module", plugins: ["typescript"] }); }
  catch (err) { return invalid(`供应商 TypeScript 语法错误：${err instanceof Error ? err.message : String(err)}`); }
  const exported = module.program.body.find(item => item.type === "ExportDefaultDeclaration");
  if (!exported || exported.type !== "ExportDefaultDeclaration") invalid("供应商须通过 export default 导出对象");
  const object = unwrap(exported.declaration as Expression);
  if (object.type !== "ObjectExpression") invalid("供应商须直接导出对象字面量");
  const entries = properties(object);
  function value(name: string) {
    const property = entries.get(name);
    if (!property) return undefined;
    if (property.type !== "ObjectProperty" || (property.shorthand && name !== "version")) invalid(`${name} 必须直接使用字面量`);
    let expression = unwrap(property.value as Expression);
    if (name === "version" && expression.type === "Identifier") {
      const identifier = expression.name;
      const declaration = module.program.body.flatMap(item => item.type === "VariableDeclaration" && item.kind === "const" ? item.declarations : [])
        .find(item => item.id.type === "Identifier" && item.id.name === identifier);
      if (!declaration?.init) invalid("version 必须使用字符串字面量或顶层 const 字符串常量");
      expression = declaration.init;
    }
    return literal(expression);
  }
  const id = value("id");
  const label = value("label");
  const version = value("version");
  const readme = value("readme");
  if (!providerIdSchema.safeParse(id).success) invalid("供应商 ID 必须为小驼峰文件名");
  if (typeof label !== "string" || !label.trim() || label.length > 200) invalid("供应商名称无效");
  if (version !== undefined && (typeof version !== "string" || !version.trim())) invalid("供应商版本必须为非空字符串");
  if (readme !== undefined && typeof readme !== "string") invalid("供应商说明必须为字符串");
  const models = mediaModelsSchema.safeParse(value("models") ?? []);
  if (!models.success) invalid(models.error.issues.map(issue => issue.message).join("；"));
  return { object, modelProperty: entries.get("models"), id: id as string, label, version: version?.trim(), readme, models: models.data };
}

function metadata(fileName: string, source: string) {
  const { id, label, version, readme, models } = parseProvider(source);
  if (fileName !== `${id}.ts`) invalid("供应商 ID 与文件名不一致");
  return { fileName, id, label, version, readme, models, revision: createHash("sha256").update(source).digest("hex"), loadError: "" };
}

async function directory(create = false) {
  const path = join(dirname(conf.path), "providers");
  if (create) {
    await mkdir(dirname(conf.path), { recursive: true });
    await mkdir(path).catch((err: NodeJS.ErrnoException) => { if (err.code !== "EEXIST") throw err; });
  }
  const info = await lstat(path).catch((err: NodeJS.ErrnoException) => { if (err.code === "ENOENT") return null; throw err; });
  if (info && (info.isSymbolicLink() || !info.isDirectory())) invalid("供应商目录不能是符号链接或文件", 403);
  return info ? path : null;
}

async function readProvider(path: string, fileName: string) {
  if (!mediaProviderFileSchema.safeParse(fileName).success) invalid("供应商文件名无效");
  const file = join(path, fileName);
  const info = await lstat(file);
  if (info.isSymbolicLink() || !info.isFile()) invalid("供应商文件不能是符号链接或目录", 403);
  if (info.size > 2 * 1024 * 1024) invalid("供应商文件不能超过 2 MB");
  const source = await readFile(file, "utf8");
  return { fileName, id: fileName.slice(0, -3), source, revision: createHash("sha256").update(source).digest("hex") };
}

export async function getMediaProvider(id: string) {
  if (!providerIdSchema.safeParse(id).success) invalid("供应商 ID 无效");
  const path = await directory();
  if (!path) invalid("请先在媒体模型设置中添加供应商", 404);
  const current = await readProvider(path, `${id}.ts`).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") invalid("请先在媒体模型设置中添加供应商", 404);
    throw error;
  });
  return { ...metadata(current.fileName, current.source), source: current.source };
}

export async function listMediaProviders() {
  const path = await directory();
  if (!path) return [];
  const files = await readdir(path, { withFileTypes: true });
  return Promise.all(files.filter(file => file.isFile() && mediaProviderFileSchema.safeParse(file.name).success)
    .sort((left, right) => left.name.localeCompare(right.name)).map(async file => {
      let current = { fileName: file.name, id: file.name.slice(0, -3), source: "", revision: "" };
      try {
        current = await readProvider(path, file.name);
        return metadata(current.fileName, current.source);
      } catch (error) {
        // ACT: 元数据损坏不影响其他供应商；仍保留原文版本，允许用户明确删除。
        const { source, ...file } = current;
        return { ...file, label: current.id, version: "", readme: "", models: [], loadError: error instanceof Error ? error.message : "供应商文件无法读取" };
      }
    }));
}

export async function addMediaProvider(source: string) {
  const { id } = parseProvider(source);
  const fileName = `${id}.ts`;
  const result = metadata(fileName, source);
  const path = join((await directory(true))!, fileName);
  const release = lockWorkspaceFiles([path]);
  try { await writeWorkspaceFile(path, source, true); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") invalid(`媒体供应商“${result.label}”已安装，请在「设置 → 媒体模型」中编辑，或先删除后重新安装。`, 409);
    throw error;
  }
  finally { release(); }
  return result;
}

export async function saveMediaProvider(fileName: string, models: z.infer<typeof mediaModelsSchema>, revision: string) {
  if (!mediaProviderFileSchema.safeParse(fileName).success) invalid("供应商文件名无效");
  const checked = mediaModelsSchema.safeParse(models);
  if (!checked.success) invalid(checked.error.issues.map(issue => issue.message).join("；"));
  const path = await directory();
  if (!path) invalid("供应商文件不存在", 404);
  const release = lockWorkspaceFiles([join(path, fileName)]);
  try {
    const current = await readProvider(path, fileName);
    if (current.revision !== revision) invalid("供应商文件已被修改，请刷新页面后再编辑", 409);
    const { object, modelProperty } = parseProvider(current.source);
    const newline = current.source.includes("\r\n") ? "\r\n" : "\n";
    const formatted = JSON.stringify(checked.data, null, 2).replace(/\n/g, `${newline}  `);
    const start = modelProperty?.type === "ObjectProperty" ? modelProperty.value.start! : object.start! + 1;
    const end = modelProperty?.type === "ObjectProperty" ? modelProperty.value.end! : start;
    const replacement = modelProperty ? formatted : `${newline}  models: ${formatted},`;
    // ACT: 只替换 models 源码区间，保留供应商函数及其余用户编辑。
    const source = current.source.slice(0, start) + replacement + current.source.slice(end);
    const result = metadata(fileName, source);
    await writeWorkspaceFile(join(path, fileName), source);
    return result;
  } finally { release(); }
}

export async function deleteMediaProvider(fileName: string, revision: string) {
  if (!mediaProviderFileSchema.safeParse(fileName).success) invalid("供应商文件名无效");
  const path = await directory();
  if (!path) invalid("供应商文件不存在", 404);
  const file = join(path, fileName);
  const release = lockWorkspaceFiles([file]);
  try {
    const current = await readProvider(path, fileName);
    if (current.revision !== revision) invalid("供应商文件已被修改，请刷新页面后再删除", 409);
    await unlink(file);
    conf.delete(`settings.mediaProviderConfigs.${current.id}`);
  } finally { release(); }
}

export async function loadMediaProviderSource(source: string, config: Record<string, unknown> = {}, signal?: AbortSignal, fetchRequest = fetch, cwd?: string) {
  signal?.throwIfAborted();
  const { id } = parseProvider(source);
  // ACT: VM 只隔离可信供应商的全局上下文；不可信代码需要独立进程等更强隔离。
  const context = createContext({
    Buffer, URL, URLSearchParams, TextEncoder, TextDecoder, Blob,
    AbortController, AbortSignal, setTimeout, clearTimeout,
  }, { codeGeneration: { strings: false, wasm: false } });
  const rejectImport = () => { throw new Error("供应商不能导入模块，请使用 this.tool 中的宿主工具"); };
  const module = new SourceTextModule(providerTranspiler.transformSync(source), {
    context,
    identifier: `${id}.ts`,
    importModuleDynamically: rejectImport,
  });
  await module.link(rejectImport);
  await module.evaluate({ timeout: 1000 });
  signal?.throwIfAborted();
  const definition = (module.namespace as { default: Provider }).default;
  const rules = Array.isArray(definition.rules) ? definition.rules : [];
  return {
    ...definition,
    config: { ...Object.fromEntries(rules.map(rule => [rule.field, rule.value])), ...structuredClone(config) },
    signal,
    tool: {
      fetch: signal ? Object.assign((input: Parameters<typeof fetch>[0], init?: RequestInit) => {
        signal.throwIfAborted();
        const requestSignal = init?.signal === null ? undefined : init?.signal ?? (input instanceof Request ? input.signal : undefined);
        return fetchRequest(input, { ...init, signal: requestSignal ? AbortSignal.any([signal, requestSignal]) : signal });
      }, { preconnect: fetchRequest.preconnect }) as typeof fetch : fetchRequest,
      hash: Bun.hash,
      image: Bun.Image,
      audio: { convert: (input: Uint8Array, options: AudioConvertOptions) => convertAudio(input, options, signal) },
      ffmpeg: async () => {
        if (!cwd) throw new Error("当前操作没有工作目录，无法使用 FFmpeg");
        return createWorkspaceFfmpeg(cwd, signal);
      },
    } satisfies ProviderTools,
  };
}
