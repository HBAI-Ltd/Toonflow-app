import { t, translateMessage, validationOptions } from "@/lib/i18n";

import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, readdir, unlink, writeAtomicSync } from "@toonflow/file";
import { dirname, join } from "node:path";
import { createContext, SourceTextModule } from "node:vm";
import type { AudioConvertOptions, Provider, ProviderTaskData, ProviderTools } from "@toonflow/providers";
import { parse, parseExpression } from "@babel/parser";
import { z } from "zod";
import conf from "@/utils/conf";
import { accountProviderSchema, getAccountProvider, getAccountToken } from "@/utils/ai";
import type { ProviderSources } from "@/utils/channel/types";
import { convertAudio } from "@/utils/media/audioProcessor";
import { createWorkspaceFfmpeg } from "@/utils/ffmpeg";
import { lockWorkspaceFiles, writeWorkspaceFile } from "@/utils/workspace/files";

type Expression = Extract<ReturnType<typeof parseExpression>, { type: "ParenthesizedExpression" }>["expression"];
type ObjectExpression = Extract<Expression, { type: "ObjectExpression" }>;

const providerTranspiler = new Bun.Transpiler({ loader: "ts", target: "bun", define: { require: "undefined" } });
const accountSourcePrefix = "// Toonflow account provider\n";

const providerIdSchema = z.string().max(96).regex(/^[a-z][a-zA-Z0-9]*$/)
  .refine(value => !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(value), "供应商 ID 不能是系统保留文件名");
export const mediaProviderFileSchema = z.string().refine(value => value.endsWith(".ts") && providerIdSchema.safeParse(value.slice(0, -3)).success, "供应商文件名无效");
const providerRulesSchema = z.array(z.record(z.string(), z.json()));
export const mediaModelsSchema = z.array(z.object({
  id: z.string().min(1).max(200).refine(value => !!value.trim()),
  label: z.string().min(1).max(200).refine(value => !!value.trim()),
  type: z.enum(["text", "image", "video", "audio"]),
  rules: providerRulesSchema.optional(),
  imageSizes: z.array(z.string()).optional(),
  imageRatios: z.array(z.string()).optional(),
  durationResolutionMap: z.array(z.object({
    duration: z.array(z.number()),
    resolution: z.array(z.string()),
  }).catchall(z.json())).optional(),
  voices: z.array(z.object({
    title: z.string(),
    voice: z.string(),
  }).catchall(z.json())).optional(),
}).catchall(z.json())).max(2000).refine(models => new Set(models.map(model => model.id)).size === models.length, "模型 ID 不能重复");

function invalid(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}

function mediaErrorMessage(value: unknown, config: Record<string, unknown>, depth = 0): string {
  if (depth > 6 || value == null) return "";
  let message = "";
  if (typeof value === "string") {
    message = value.trim();
    if (/^[\[{]/.test(message)) {
      try { message = mediaErrorMessage(JSON.parse(message), config, depth + 1); }
      catch { /* ACT: 非 JSON 错误正文按纯文本显示。 */ }
    }
  } else if (Array.isArray(value)) {
    message = value.slice(0, 10).map(item => mediaErrorMessage(item, config, depth + 1)).filter(Boolean).join("；");
  } else if (typeof value === "object") {
    const data = value as Record<string, unknown>;
    const messages: string[] = [];
    for (const key of ["failReason", "fail_reason", "error", "errors", "detail", "details", "error_description", "data", "task", "message", "msg", "status_msg"]) {
      if ((key === "data" || key === "task") && typeof data[key] !== "object") continue;
      const detail = mediaErrorMessage(data[key], config, depth + 1);
      if (detail) messages.push(...detail.split("\n"));
    }
    message = [...new Set(messages)].join("\n");
    if (!message && typeof data.data === "string") message = mediaErrorMessage(data.data, config, depth + 1);
  }
  if (!message || /^\s*<(?:!doctype|html|head|body)\b/i.test(message)) return "";
  const secrets = new Set<string>();
  const pending: [unknown, boolean][] = [[config, false]];
  const seen = new WeakMap<object, boolean>();
  while (pending.length) {
    const [value, sensitive] = pending.pop()!;
    if (typeof value === "string") {
      if (sensitive && value.trim()) secrets.add(value);
      continue;
    }
    if (!value || typeof value !== "object" || seen.get(value) === true || seen.get(value) === sensitive) continue;
    seen.set(value, sensitive);
    for (const [key, item] of Object.entries(value)) pending.push([item, sensitive || /api.?key|secret|token|password|authorization|cookie|credential|private.?key|access.?key|signature/i.test(key)]);
  }
  const values = [...new Set([...secrets].flatMap(secret => {
    const token = secret.trim().replace(/^(?:Bearer|Basic)\s+/i, "");
    return [secret, token, JSON.stringify(secret).slice(1, -1), JSON.stringify(token).slice(1, -1), encodeURIComponent(secret.toWellFormed()), encodeURIComponent(token.toWellFormed())];
  }).filter(Boolean))].sort((left, right) => right.length - left.length);
  for (const secret of values) message = message.replaceAll(secret, "••••••");
  return message.replace(/(Bearer\s+)[^\s"'<>]+/gi, "$1••••••")
    .replace(/([?&][^=&#\s]+)=[^&#\s"'<>]*/g, "$1=••••••")
    .replace(/((?:api[_-]?key|secret|token|password|authorization|cookie)["']?\s*[:=]\s*["']?)[^\s"',;}&<>]+/gi, "$1••••••")
    .slice(0, 4000);
}

function parseTaskData(value: unknown, config: Record<string, unknown>): ProviderTaskData {
  const maxSize = 1024 * 1024;
  const secretFields = /^(?:apiKey|secret|token|password|authorization|cookie|credential|privateKey|accessKey|accessToken|refreshToken|clientSecret|secretAccessKey|sessionToken|bearerToken|signature)$/i;
  const secrets = Object.entries(config).filter(([key, item]) => secretFields.test(key.replace(/[-_]/g, "")) && typeof item === "string" && item.trim())
    .map(([, item]) => (item as string).trim().replace(/^Bearer\s+/i, "")).filter(Boolean);
  const ancestors = new Set<object>();
  let size = 0;
  function copy(item: unknown, depth = 0): ProviderTaskData[string] {
    if (depth > 32) invalid("任务恢复数据不能超过 32 层");
    if (++size > maxSize) invalid("任务恢复数据不能超过 1 MB");
    if (item === null || typeof item === "boolean") return item;
    if (typeof item === "number" && Number.isFinite(item)) return item;
    if (typeof item === "string") {
      if (/^data:(?:image|audio|video)\/[a-z0-9.+-]+;base64,/i.test(item)) {
        // ACT: 多阶段任务的参考媒体由宿主外置到私有文件，元数据仍限制 1 MB；沿用单文件 100 MB 上限。
        if (item.length > Math.ceil(100 * 1024 * 1024 / 3) * 4 + 256) invalid("任务恢复素材不能超过 100 MB");
        size += 64;
        return item;
      }
      size += Buffer.byteLength(item, "utf8");
      if (size > maxSize) invalid("任务恢复数据不能超过 1 MB");
      if (secrets.some(secret => item.includes(secret) || item.includes(encodeURIComponent(secret)))
        || /\bBearer\s+\S|^https?:\/\/[^/]*@/i.test(item)) {
        invalid("任务恢复数据不能包含密钥或请求凭据");
      }
      return item;
    }
    if (!item || typeof item !== "object" || ancestors.has(item)) invalid("任务恢复数据必须是无循环引用的 JSON 对象");
    const prototype = Object.getPrototypeOf(item);
    if (!Array.isArray(item) && prototype !== null && Object.getPrototypeOf(prototype) !== null) invalid("任务恢复数据不能包含运行时对象");
    if (Object.getOwnPropertySymbols(item).length) invalid("任务恢复数据必须是 JSON 对象");
    ancestors.add(item);
    const result = Array.isArray(item) ? Array.from(item, child => copy(child, depth + 1))
      : Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(item)).filter(([, descriptor]) => descriptor.enumerable).map(([key, descriptor]) => {
        if (secretFields.test(key.replace(/[-_]/g, ""))) invalid("任务恢复数据不能包含密钥或请求凭据");
        if (!("value" in descriptor)) invalid("任务恢复数据不能包含属性访问器");
        size += Buffer.byteLength(key, "utf8");
        return [key, copy(descriptor.value, depth + 1)];
      }));
    ancestors.delete(item);
    return result;
  }
  const data = copy(value);
  if (!data || typeof data !== "object" || Array.isArray(data)) invalid("任务恢复数据必须是 JSON 对象");
  if (Buffer.byteLength(JSON.stringify(data, (_key, item) => typeof item === "string" && /^data:(?:image|audio|video)\/[a-z0-9.+-]+;base64,/i.test(item) ? "[media]" : item), "utf8") > maxSize) invalid("任务恢复数据不能超过 1 MB");
  return data;
}

function createMediaTools(fetcher: typeof fetch = fetch): ProviderTools["media"] {
  async function bytes(input: MediaInput) {
    if (input.type === "base64") return Buffer.from(input.data.replace(/^data:[^;]+;base64,/, ""), "base64");
    if (input.type === "binary") return Buffer.from(input.data);
    const response = await fetcher(input.url);
    if (!response.ok) throw new Error(t`读取图片失败：HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }

  return {
    async inspectImage(input: MediaInput) {
      const metadata = await new Bun.Image(await bytes(input)).metadata();
      return { width: metadata.width, height: metadata.height, format: metadata.format };
    },
    async resizeImage(input, options) {
      if (!options.width && !options.height) throw new Error("图片缩放至少需要指定宽度或高度");
      const source = await bytes(input);
      const metadata = await new Bun.Image(source).metadata();
      const width = Math.max(1, Math.round(options.width ?? metadata.width * (options.height! / metadata.height)));
      const height = Math.max(1, Math.round(options.height ?? metadata.height * (options.width! / metadata.width)));
      const image = new Bun.Image(source).resize(width, height, { fit: "fill" });
      const format = options.format ?? (metadata.format === "jpeg" || metadata.format === "webp" ? metadata.format : "png");
      const quality = Math.min(100, Math.max(1, Math.round(options.quality ?? 92)));
      if (format === "jpeg") image.jpeg({ quality });
      else if (format === "webp") image.webp({ quality });
      else image.png();
      return { type: "binary", data: new Uint8Array(await image.buffer()), mimeType: `image/${format === "jpeg" ? "jpeg" : format}`, name: input.name };
    },
  };
}
async function responseErrorMessage(response: Response, config: Record<string, unknown>) {
  if (!response.body || !/json|text|^$/i.test(response.headers.get("content-type") ?? "")) return "";
  const reader = response.clone().body!.getReader();
  const timer = setTimeout(() => { void reader.cancel().catch(() => {}); }, 3000);
  const decoder = new TextDecoder();
  let text = "";
  let size = 0;
  try {
    // ACT: 错误正文最多读取 16 KB / 3 秒；大响应须由供应商在标准错误字段中提供摘要。
    while (size < 16000) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value.subarray(0, 16000 - size), { stream: true });
      size += value.byteLength;
    }
    return mediaErrorMessage(text + decoder.decode(), config);
  } catch { return ""; }
  finally { clearTimeout(timer); void reader.cancel().catch(() => {}); }
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

function parseProvider(source: string, accountLanguage = false) {
  if (Buffer.byteLength(source, "utf8") > 2 * 1024 * 1024) invalid("供应商文件不能超过 2 MB");
  let module: ReturnType<typeof parse>;
  try { module = parse(source, { sourceType: "module", plugins: ["typescript"] }); }
  catch (err) { return invalid(t`供应商 TypeScript 语法错误：${err instanceof Error ? err.message : String(err)}`); }
  const exported = module.program.body.find(item => item.type === "ExportDefaultDeclaration");
  if (!exported || exported.type !== "ExportDefaultDeclaration") {
    const legacy = module.program.body.some(item => {
      if (item.type !== "ExpressionStatement" || item.expression.type !== "AssignmentExpression") return false;
      const target = item.expression.left;
      if (target.type !== "MemberExpression" || target.object.type !== "Identifier" || target.object.name !== "exports") return false;
      const name = !target.computed && target.property.type === "Identifier" ? target.property.name
        : target.computed && target.property.type === "StringLiteral" ? target.property.value : "";
      return ["vendor", "textRequest", "imageRequest", "videoRequest", "ttsRequest"].includes(name);
    });
    if (legacy) invalid("检测到旧版 Toonflow 供应商 TS，无法在 Toonflow 2.0 中使用。请在「添加自定义媒体供应商」中点击「一键复制提示词」，结合旧代码和接口资料重新生成新版代码后再导入。");
    invalid("供应商须通过 export default 导出对象");
  }
  const object = unwrap(exported.declaration as Expression);
  if (object.type !== "ObjectExpression") invalid("供应商须直接导出对象字面量");
  const entries = properties(object);
  function value(name: string) {
    const property = entries.get(name);
    if (!property) return undefined;
    const allowConstant = name === "version" || name === "rules";
    if (property.type !== "ObjectProperty" || (property.shorthand && !allowConstant)) invalid(t`${name} 必须直接使用字面量`);
    let expression = unwrap(property.value as Expression);
    if (allowConstant && expression.type === "Identifier") {
      const identifier = expression.name;
      const declaration = module.program.body.flatMap(item => item.type === "VariableDeclaration" && item.kind === "const" ? item.declarations : [])
        .find(item => item.id.type === "Identifier" && item.id.name === identifier);
      if (!declaration?.init) invalid(t`${name} 必须使用字面量或顶层 const 常量`);
      expression = declaration.init;
    }
    return literal(expression);
  }
  const id = value("id");
  const label = value("label");
  const icon = value("icon");
  const version = value("version");
  const readme = value("readme");
  const modelsUrl = value("modelsUrl");
  if (accountLanguage) {
    if (id !== "Toonflow") invalid("账号文本供应商 ID 必须为 Toonflow");
  } else if (!providerIdSchema.safeParse(id).success) invalid("供应商 ID 必须为小驼峰文件名");
  if (typeof label !== "string" || !label.trim() || label.length > 200) invalid("供应商名称无效");
  if (icon !== undefined && typeof icon !== "string") invalid("供应商图标必须为字符串");
  if (version !== undefined && (typeof version !== "string" || !version.trim())) invalid("供应商版本必须为非空字符串");
  if (readme !== undefined && typeof readme !== "string") invalid("供应商说明必须为字符串");
  if (modelsUrl !== undefined && !z.url({ protocol: /^https?$/ }).refine(value => {
    const url = new URL(value);
    return !url.username && !url.password && !url.hash;
  }).safeParse(modelsUrl).success) invalid("模型列表地址须为不含凭据或片段的 HTTP URL");
  const models = mediaModelsSchema.safeParse(value("models") ?? [], validationOptions());
  if (!models.success) invalid(models.error.issues.map(issue => translateMessage(issue.message)).join("; "));
  const rules = providerRulesSchema.safeParse(value("rules") ?? []);
  if (!rules.success) invalid("供应商 rules 必须为表单配置对象数组");
  return { object, value, modelProperty: entries.get("models"), id: id as string, label, icon, version: version?.trim(), readme, modelsUrl: modelsUrl as string | undefined, rules: rules.data, models: models.data,
    supportsPrice: entries.has("getPrice"), supportsBalance: entries.has("getBalance") };
}

function metadata(fileName: string, source: string) {
  const { id, label, icon, version, readme, modelsUrl, rules, models, supportsPrice, supportsBalance } = parseProvider(source);
  if (fileName !== `${id}.ts`) invalid("供应商 ID 与文件名不一致");
  return { fileName, id, label, icon, version, readme, modelsUrl, rules, models,
    supportsPrice, supportsBalance, revision: createHash("sha256").update(source).digest("hex"), loadError: "" };
}

export function validateMediaProviderSource(source: string) {
  const { id } = parseProvider(source);
  return metadata(`${id}.ts`, source);
}

export function replaceMediaProviderModels(source: string, models: z.infer<typeof mediaModelsSchema>) {
  const checked = mediaModelsSchema.safeParse(models, validationOptions());
  if (!checked.success) invalid(checked.error.issues.map(issue => translateMessage(issue.message)).join("; "));
  const { object, modelProperty } = parseProvider(source);
  const newline = source.includes("\r\n") ? "\r\n" : "\n";
  const formatted = JSON.stringify(checked.data, null, 2).replace(/\n/g, `${newline}  `);
  const start = modelProperty?.type === "ObjectProperty" ? modelProperty.value.start! : object.start! + 1;
  const end = modelProperty?.type === "ObjectProperty" ? modelProperty.value.end! : start;
  const replacement = modelProperty ? formatted : `${newline}  models: ${formatted},`;
  // ACT: 只替换 models 源码区间，保留供应商函数及其余用户编辑。
  return source.slice(0, start) + replacement + source.slice(end);
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

export async function getMediaProviderSource(fileName: string) {
  if (!mediaProviderFileSchema.safeParse(fileName).success) invalid("供应商文件名无效");
  if (fileName.toLowerCase() === "toonflow.ts") invalid("Toonflow 供应商由账号与余额管理，请在账号页刷新");
  const path = await directory();
  if (!path) invalid("供应商文件不存在", 404);
  return readProvider(path, fileName).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") invalid("供应商文件不存在", 404);
    throw error;
  });
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
        return { ...file, label: current.id, version: "", readme: "", rules: [], models: [], loadError: translateMessage(error instanceof Error ? error.message : "供应商文件无法读取") };
      }
    }));
}

export async function addMediaProvider(source: string) {
  const result = validateMediaProviderSource(source);
  if (result.id.toLowerCase() === "toonflow") invalid("Toonflow 供应商由账号与余额管理，请登录后刷新");
  const { fileName } = result;
  const path = join((await directory(true))!, fileName);
  const release = lockWorkspaceFiles([path]);
  try { await writeWorkspaceFile(path, source, true); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") invalid(t`媒体供应商“${result.label}”已安装，请在「设置 → 媒体模型」中编辑，或先删除后重新安装。`, 409);
    throw error;
  }
  finally { release(); }
  return result;
}

export async function installAccountProvider(sources: ProviderSources, token: string, signal?: AbortSignal) {
  function requireAccount() {
    signal?.throwIfAborted();
    if (!token.trim() || getAccountToken() !== token.trim()) invalid("账号已变更，请重新登录后刷新", 401);
  }
  requireAccount();
  const customProviders = conf.get("settings", {}).customProviders;
  if (Array.isArray(customProviders) && customProviders.some(provider => typeof provider?.id === "string" && provider.id.toLowerCase() === "toonflow")) {
    invalid("已有自定义文本供应商使用 toonflow ID，请先修改该 ID", 409);
  }
  const source = sources.media;
  if (Buffer.byteLength(accountSourcePrefix + source, "utf8") > 2 * 1024 * 1024) invalid("供应商文件不能超过 2 MB");
  if (parseProvider(source).id !== "toonflow") invalid("账号媒体供应商 ID 必须为 toonflow");
  const parsed = parseProvider(sources.language, true);
  if (parsed.models.some(model => model.type !== "text")) invalid("账号文本配置只能包含文本模型");
  const checked = accountProviderSchema.safeParse({
    id: parsed.id, label: parsed.label, version: parsed.version,
    apiUrl: parsed.value("apiUrl"), protocol: parsed.value("protocol"), apiKey: "",
    token: parsed.value("token"),
    models: parsed.models,
  });
  if (!checked.success || !checked.data.token) invalid("账号文本供应商配置或 token 无效，请刷新重试");
  const folder = (await directory(true))!;
  const fileName = "toonflow.ts";
  const path = join(folder, fileName);
  const release = lockWorkspaceFiles([path]);
  try {
    const current = await readProvider(folder, fileName).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return undefined;
      throw error;
    });
    if (current && !current.source.startsWith(accountSourcePrefix)) invalid("已存在同名自定义供应商，请先处理文件冲突", 409);
    requireAccount();
    // ACT: 最多 2 MB；同步原子替换使账号校验与提交之间不插入其他设置写入。
    writeAtomicSync(path, accountSourcePrefix + source, { exclusive: !current });
    return { provider: checked.data };
  } finally { release(); }
}

export async function saveMediaProvider(fileName: string, content: string | z.infer<typeof mediaModelsSchema>, revision: string, expectedApiKey?: string) {
  if (!mediaProviderFileSchema.safeParse(fileName).success) invalid("供应商文件名无效");
  if (fileName.toLowerCase() === "toonflow.ts") invalid("Toonflow 供应商由账号与余额管理，请在账号页刷新");
  const path = await directory();
  if (!path) invalid("供应商文件不存在", 404);
  const release = lockWorkspaceFiles([join(path, fileName)]);
  try {
    const current = await readProvider(path, fileName);
    if (current.revision !== revision) invalid("供应商文件已被修改，请刷新页面后再编辑", 409);
    const source = typeof content === "string" ? content : replaceMediaProviderModels(current.source, content);
    const result = metadata(fileName, source);
    if (expectedApiKey !== undefined && getMediaProviderApiKey(result.id) !== expectedApiKey) invalid("供应商配置已变更，请重试", 409);
    await writeWorkspaceFile(join(path, fileName), source);
    return result;
  } finally { release(); }
}

function getMediaProviderApiKey(id: string) {
  const value: unknown = conf.get(`settings.mediaProviderConfigs.${id}.apiKey`);
  return typeof value === "string" ? value.trim().replace(/^Bearer(?:\s+|$)/i, "").trim() : "";
}

export async function refreshMediaProviderModels(fileName: string, revision: string) {
  if (!mediaProviderFileSchema.safeParse(fileName).success) invalid("供应商文件名无效");
  if (fileName.toLowerCase() === "toonflow.ts") invalid("Toonflow 供应商由账号与余额管理，请在账号页刷新");
  const provider = await getMediaProvider(fileName.slice(0, -3));
  if (revision !== provider.revision) invalid("供应商文件已被修改，请刷新页面后再获取", 409);
  if (!provider.modelsUrl) invalid("供应商未配置 modelsUrl");
  const apiKey = getMediaProviderApiKey(provider.id);
  const modelsUrl = new URL(provider.modelsUrl);
  const response = await fetch(modelsUrl, {
    headers: { Accept: "application/json", ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) },
    signal: AbortSignal.timeout(30000), redirect: "error",
  });
  if (!response.ok) throw new Error(t`获取媒体模型列表失败（HTTP ${response.status}）`);
  const result = z.object({ data: z.array(mediaModelsSchema.element.partial({ label: true, type: true }).extend({
    modelInfo: z.object({
      mode: z.array(z.union([z.string().min(1), z.array(z.string().min(1))])).optional(),
      audio: z.union([z.literal("optional"), z.boolean()]).optional(),
      durationResolutionMap: z.array(z.object({ duration: z.array(z.number().positive()), resolution: z.array(z.string().min(1)) })).optional(),
      imageSizes: z.array(z.string().min(1)).optional(),
      imageRatios: z.array(z.string().min(1)).optional(),
    }).catchall(z.json()).optional(),
  })).max(2000) }).parse(await response.json());
  if (!result.data.length) throw new Error("未获取到媒体模型，保留原有列表");
  const requestedType = z.enum(["text", "image", "video", "audio"]).safeParse(modelsUrl.searchParams.get("type"));
  const models = result.data.map(({ modelInfo, ...model }) => {
    const id = model.id.trim();
    const previous = provider.models.find(item => item.id === id);
    const type = model.type ?? (requestedType.success ? requestedType.data : previous?.type);
    if (!type) invalid(t`模型 ${id} 缺少 type，请在返回数据或 modelsUrl 的 type 参数中指定`);
    if (requestedType.success && type !== requestedType.data) invalid(t`模型 ${id} 的 type 与请求类型不一致`);
    // ACT: modelInfo 覆盖已有能力；缺省字段沿用同名配置，新模型不猜测生成能力。
    const merged = { ...previous, ...model, ...modelInfo, id, label: model.label ?? previous?.label
      ?? (typeof model.display_name === "string" ? model.display_name : typeof model.displayName === "string" ? model.displayName : id), type };
    Reflect.deleteProperty(merged, "modelInfo");
    return merged;
  });
  const types = new Set(models.map(model => model.type));
  return saveMediaProvider(fileName, [...provider.models.filter(model => !types.has(model.type)), ...models], provider.revision, apiKey);
}

export async function deleteMediaProvider(fileName: string, revision: string) {
  if (!mediaProviderFileSchema.safeParse(fileName).success) invalid("供应商文件名无效");
  if (fileName.toLowerCase() === "toonflow.ts") invalid("Toonflow 供应商由账号与余额管理");
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

export async function loadMediaProviderSource(source: string, config: Record<string, unknown> = {}, signal?: AbortSignal, fetchRequest = fetch, cwd?: string,
  saveTaskData?: (data: ProviderTaskData) => Promise<void>) {
  signal?.throwIfAborted();
  const { id, value } = parseProvider(source);
  if (id === "toonflow") {
    const installed = await getMediaProvider(id);
    if (source !== installed.source || !source.startsWith(accountSourcePrefix)) invalid("只能运行已安装的 Toonflow 账号供应商", 403);
    const account = getAccountProvider();
    if (!account) invalid("请先登录 Toonflow 账号并刷新供应商", 401);
    const accountToken = getAccountToken();
    const token = value("token");
    if (token !== undefined && (typeof token !== "string" || !token.trim())) invalid("账号媒体供应商 token 无效");
    // 导出的媒体 token 用于配置和脱敏；请求实现也可直接使用源码中内嵌的凭据。
    if (typeof token === "string") config = { ...config, token };
    const originalFetch = fetchRequest;
    fetchRequest = Object.assign((input: Parameters<typeof fetch>[0], init?: RequestInit) => {
      if (getAccountToken() !== accountToken) invalid("Toonflow 账号已变更，请重新发起请求", 401);
      return originalFetch(input, init);
    }, { preconnect: originalFetch.preconnect }) as typeof fetch;
  }
  // ACT: VM 只隔离可信供应商的全局上下文；不可信代码需要独立进程等更强隔离。
  const context = createContext({
    Buffer, atob, btoa, URL, URLSearchParams, TextEncoder, TextDecoder, Blob,
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
  const providerConfig = { ...Object.fromEntries(rules.map(rule => [rule.field, rule.value])), ...structuredClone(config) };
  const provider = {
    ...definition,
    // 查询上下文使用原始注入 fetch，避免继承某次生成请求的取消信号。
    queryFetch: fetchRequest,
    sourceRevision: createHash("sha256").update(source).digest("hex"),
    config: providerConfig,
    signal,
    saveTaskData: typeof definition.resumeTask === "function" && saveTaskData
      ? async (data: ProviderTaskData) => { await saveTaskData(parseTaskData(data, providerConfig)); } : undefined,
    tool: {
      fetch: signal ? Object.assign((input: Parameters<typeof fetch>[0], init?: RequestInit) => {
        signal.throwIfAborted();
        const requestSignal = init?.signal === null ? undefined : init?.signal ?? (input instanceof Request ? input.signal : undefined);
        return fetchRequest(input, { ...init, signal: requestSignal ? AbortSignal.any([signal, requestSignal]) : signal });
      }, { preconnect: fetchRequest.preconnect }) as typeof fetch : fetchRequest,
      hash: Bun.hash,
      errorMessage: (value: unknown) => mediaErrorMessage(value, providerConfig),
      image: Bun.Image,
      media: createMediaTools(fetchRequest),
      audio: { convert: (input: Uint8Array, options: AudioConvertOptions) => convertAudio(input, options, signal) },
      ffmpeg: async () => {
        if (!cwd) throw new Error("当前操作没有工作目录，无法使用 FFmpeg");
        return createWorkspaceFfmpeg(cwd, signal);
      },
    } satisfies ProviderTools,
  };
  for (const [name, generate] of [
    ["generateImage", definition.generateImage],
    ["generateVideo", definition.generateVideo],
    ["generateAudio", definition.generateAudio],
    ["resumeTask", definition.resumeTask],
  ] as const) {
    if (!generate) continue;
    Object.assign(provider, { [name]: async (request: ImageRequest | VideoRequest | AudioRequest | ProviderTaskData) => {
      let failure: { status?: number; message: string } | undefined;
      let pendingRequests = 0;
      let overlappingRequests = false;
      let requestCount = 0;
      const tool = { ...provider.tool, fetch: Object.assign(async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
        if (++pendingRequests > 1) overlappingRequests = true;
        const requestId = ++requestCount;
        failure = undefined;
        try {
          const response = await provider.tool.fetch(input, init);
          if (!response.ok) failure = { status: response.status, message: await responseErrorMessage(response, provider.config) };
          else {
            const readJson = response.json;
            Object.assign(response, { json: async function(this: Response) {
              const result = await readJson.call(this);
              if (this === response && requestId === requestCount && !overlappingRequests && result && typeof result === "object") {
                const data = result as Record<string, unknown>;
                const failed = [data, data.data, data.task].some(item => {
                  if (!item || typeof item !== "object") return false;
                  const state = item as Record<string, unknown>;
                  return ["failed", "failure", "error", "rejected"].includes(String(state.status ?? state.state ?? "").toLowerCase())
                    || state.success === false || (typeof state.code === "number" && state.code >= 400 && state.code < 600);
                });
                if (failed) failure = { message: mediaErrorMessage(result, provider.config) };
              }
              return result;
            } });
          }
          return response;
        } finally { pendingRequests--; }
      }, { preconnect: provider.tool.fetch.preconnect }) as typeof fetch };
      const context = { ...provider, tool };
      try {
        if (name === "resumeTask") return await generate.call(context, parseTaskData(request, providerConfig));
        const input = request as ImageRequest | VideoRequest | AudioRequest;
        const prepared = definition.processMedia ? await definition.processMedia.call(context, input) : input;
        // ACT: 预处理沿用原生成类型，在动态分发边界按对应方法收窄请求。
        if (name === "generateImage") return await generate.call(context, prepared as ImageRequest);
        if (name === "generateVideo") return await generate.call(context, prepared as VideoRequest);
        return await generate.call(context, prepared as AudioRequest);
      }
      catch (error) {
        const info = error as { name?: unknown; message?: unknown; code?: unknown; status?: unknown } | null;
        if (signal?.aborted || info?.name === "AbortError") throw error;
        let message = mediaErrorMessage(error, provider.config);
        if (!message) throw error;
        // ACT: 只补充串行请求中匹配的错误；并发时无法精确关联响应，由适配器使用 errorMessage 提取。
        const matchesFailure = failure?.status !== undefined
          ? new RegExp(`\\b(?:HTTP|status(?: code)?)\\s*[:：]?\\s*${failure.status}[)）.。\\s]*$`, "i").test(message)
          : failure?.message.includes(message) || /(?:未返回任务\s*ID|^(?:图片|视频)?生成失败|^素材审核失败)$/.test(message);
        if (!overlappingRequests && failure?.message && matchesFailure) {
          message = [...new Set([...message.split("\n"), ...failure.message.split("\n")])].join("\n").slice(0, 4000);
        }
        if (message === (typeof error === "string" ? error : info?.message)) throw error;
        throw Object.assign(new Error(message), typeof error === "object" ? error : undefined, {
          message, cause: error,
          ...(typeof info?.code === "string" ? { code: info.code } : {}),
          ...(typeof info?.status === "number" ? { status: info.status } : {}),
        });
      }
    } });
  }
  return provider;
}
