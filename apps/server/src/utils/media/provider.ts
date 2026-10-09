import { t, translateMessage, validationOptions } from "@/lib/i18n";

import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, readdir, unlink } from "@toonflow/file";
import { dirname, join } from "node:path";
import { createContext, SourceTextModule } from "node:vm";
import type { AudioConvertOptions, Provider, ProviderTools } from "@toonflow/providers";
import tfRouter from "@toonflow/providers/media/tfRouter";
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
  for (const [key, secret] of Object.entries(config)) {
    if (!/api.?key|secret|token|password|authorization|cookie/i.test(key) || typeof secret !== "string" || !secret.trim()) continue;
    const token = secret.trim().replace(/^Bearer\s*/i, "");
    if (token) message = message.replaceAll(token, "••••••");
  }
  return message.replace(/(Bearer\s+)[^\s"'<>]+/gi, "$1••••••")
    .replace(/([?&][^=&#\s]+)=[^&#\s"'<>]*/g, "$1=••••••")
    .replace(/((?:api[_-]?key|secret|token|password|authorization|cookie)["']?\s*[:=]\s*["']?)[^\s"',;}&<>]+/gi, "$1••••••")
    .slice(0, 4000);
}

function createMediaTools(fetcher: typeof fetch = fetch) {
  async function bytes(input: MediaInput) {
    if (input.type === "base64") return Buffer.from(input.data.replace(/^data:[^;]+;base64,/, ""), "base64");
    if (input.type === "binary") return Buffer.from(input.data);
    const response = await fetcher(input.url);
    if (!response.ok) throw new Error(`读取图片失败：HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }

  return {
    async inspectImage(input: MediaInput) {
      const metadata = await new Bun.Image(await bytes(input)).metadata();
      return { width: metadata.width, height: metadata.height, format: metadata.format };
    },
    async resizeImage(input: MediaInput, options: { width?: number; height?: number; format?: "jpeg" | "png" | "webp"; quality?: number }) {
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

function parseProvider(source: string) {
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
  if (!providerIdSchema.safeParse(id).success) invalid("供应商 ID 必须为小驼峰文件名");
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
  const rules = z.array(z.record(z.string(), z.json())).safeParse(value("rules") ?? []);
  if (!rules.success) invalid("供应商 rules 必须为表单配置对象数组");
  return { object, modelProperty: entries.get("models"), id: id as string, label, icon, version: version?.trim(), readme, modelsUrl: modelsUrl as string | undefined, rules: rules.data, models: models.data };
}

function metadata(fileName: string, source: string) {
  const { id, label, icon, version, readme, modelsUrl, rules, models } = parseProvider(source);
  if (fileName !== `${id}.ts`) invalid("供应商 ID 与文件名不一致");
  // ACT: 兼容旧 TF-Router 文件，缺少列表地址时使用内置定义。
  return { fileName, id, label, icon, version, readme, modelsUrl: modelsUrl ?? (id === tfRouter.id ? tfRouter.modelsUrl : undefined), rules, models,
    revision: createHash("sha256").update(source).digest("hex"), loadError: "" };
}

export function validateMediaProviderSource(source: string) {
  const { id } = parseProvider(source);
  return metadata(`${id}.ts`, source);
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
        return { ...file, label: current.id, version: "", readme: "", rules: [], models: [], loadError: translateMessage(error instanceof Error ? error.message : "供应商文件无法读取") };
      }
    }));
}

export async function addMediaProvider(source: string) {
  const result = validateMediaProviderSource(source);
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

export async function saveMediaProvider(fileName: string, models: z.infer<typeof mediaModelsSchema>, revision: string, expectedApiKey?: string) {
  if (!mediaProviderFileSchema.safeParse(fileName).success) invalid("供应商文件名无效");
  const checked = mediaModelsSchema.safeParse(models, validationOptions());
  if (!checked.success) invalid(checked.error.issues.map(issue => translateMessage(issue.message)).join("; "));
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
    if (expectedApiKey !== undefined && getMediaProviderApiKey(result.id) !== expectedApiKey) invalid("供应商配置已变更，请重试", 409);
    await writeWorkspaceFile(join(path, fileName), source);
    return result;
  } finally { release(); }
}

export function getMediaProviderApiKey(id: string) {
  const value: unknown = conf.get(`settings.mediaProviderConfigs.${id}.apiKey`);
  return typeof value === "string" ? value.trim().replace(/^Bearer(?:\s+|$)/i, "").trim() : "";
}

export async function refreshMediaProviderModels(fileName: string, revision?: string, modelType?: ModelType, expectedApiKey?: string) {
  if (!mediaProviderFileSchema.safeParse(fileName).success) invalid("供应商文件名无效");
  const provider = await getMediaProvider(fileName.slice(0, -3));
  if (revision !== undefined && revision !== provider.revision) invalid("供应商文件已被修改，请刷新页面后再获取", 409);
  if (!provider.modelsUrl) invalid("供应商未配置 modelsUrl");
  const apiKey = getMediaProviderApiKey(provider.id);
  if (expectedApiKey !== undefined && apiKey !== expectedApiKey) invalid("供应商配置已变更，请重试", 409);
  const modelTypes = provider.id === tfRouter.id && !modelType ? ["video", "image", "audio"] : [modelType];
  // ACT: 各类型只并行获取，汇总后保存一次，避免同一供应商文件发生版本冲突。
  const models = (await Promise.all(modelTypes.map(async requestedModelType => {
    const modelsUrl = new URL(provider.modelsUrl!);
    if (requestedModelType) modelsUrl.searchParams.set("type", requestedModelType);
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
    return result.data.map(({ modelInfo, ...model }) => {
      const id = model.id.trim();
      const previous = provider.models.find(item => item.id === id)
        ?? (provider.id === tfRouter.id ? tfRouter.models.find(item => item.id === id) : undefined);
      const type = model.type ?? (requestedType.success ? requestedType.data : previous?.type);
      if (!type) invalid(t`模型 ${id} 缺少 type，请在返回数据或 modelsUrl 的 type 参数中指定`);
      if (requestedType.success && type !== requestedType.data) invalid(t`模型 ${id} 的 type 与请求类型不一致`);
      // ACT: modelInfo 覆盖已有能力；缺省字段沿用同名配置，新模型不猜测生成能力。
      const merged = { ...previous, ...model, ...modelInfo, id, label: model.label ?? previous?.label
        ?? (typeof model.display_name === "string" ? model.display_name : typeof model.displayName === "string" ? model.displayName : id), type };
      Reflect.deleteProperty(merged, "modelInfo");
      return merged;
    });
  }))).flat();
  const types = new Set(models.map(model => model.type));
  return saveMediaProvider(fileName, [...provider.models.filter(model => !types.has(model.type)), ...models], provider.revision, apiKey);
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
  const providerConfig = { ...Object.fromEntries(rules.map(rule => [rule.field, rule.value])), ...structuredClone(config) };
  const provider = {
    ...definition,
    config: providerConfig,
    signal,
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
  for (const name of ["generateImage", "generateVideo", "generateAudio"] as const) {
    const generate = definition[name];
    if (!generate) continue;
    Object.assign(provider, { [name]: async (request: ImageRequest & VideoRequest & AudioRequest) => {
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
        const prepared = definition.processMedia ? await definition.processMedia.call(context, request) : request;
        return await generate.call(context, prepared);
      }
      catch (error) {
        const info = error as { name?: unknown; message?: unknown } | null;
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
        throw Object.assign(new Error(message), typeof error === "object" ? error : undefined, { message, cause: error });
      }
    } });
  }
  return provider;
}
