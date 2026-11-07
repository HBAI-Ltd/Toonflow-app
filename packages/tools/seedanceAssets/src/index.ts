import { createHash, randomUUID } from "node:crypto";
import { extname } from "node:path";
import { z } from "zod";
import { providerAssetIdSchema, providerAssetsSchema, type ToolPlugin } from "@toonflow/tools-scaffold/runtime";
import { configSchema, requestAsset, safeErrorMessage, type AssetConfig } from "./api";
import { assetSummary, resolveAssets } from "./assets";

const paging = {
  nextToken: z.string().min(1).max(4096).optional(),
  maxResults: z.number().int().min(1).max(100).optional(),
};
const name = z.string().trim().min(1).max(64).optional();
const publicUrl = z.string().max(8192).refine(value => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}, "素材地址必须是不含账号密码的公网 HTTP(S) 地址");
const requestSchema = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("startAuthentication") }),
  z.strictObject({ action: z.literal("finishAuthentication"), sessionId: z.string().uuid() }),
  z.strictObject({ action: z.literal("listGroups"), name, ...paging }),
  z.strictObject({ action: z.literal("listAssets"), groupId: providerAssetIdSchema.optional(), name, status: z.enum(["Active", "Processing", "Failed"]).optional(), ...paging }),
  z.strictObject({ action: z.literal("getAsset"), assetId: providerAssetIdSchema }),
  z.strictObject({
    action: z.literal("createAsset"), groupId: providerAssetIdSchema, mediaType: z.enum(["image", "video", "audio"]), name,
    url: publicUrl.optional().describe("可供火山方舟访问的公网素材地址，与 path 必须且只能提供一个"),
    path: z.string().min(1).max(4096).refine(value => !/^(?:[\\/]|[a-z][a-z\d+.-]*:)/i.test(value)
      && !value.replaceAll("\\", "/").split("/").includes(".."), "素材路径必须位于工作区内").optional().describe("工作区内的素材相对路径，与 url 必须且只能提供一个"),
  }).refine(request => (request.url === undefined) !== (request.path === undefined), "必须且只能提供 url 或 path"),
  z.strictObject({ action: z.literal("selectAssets"), nodeId: z.string().min(1).max(200), assets: providerAssetsSchema }),
]);
const actionParameters = requestSchema.options.map(schema => ({
  action: schema.shape.action.value,
  parameters: z.toJSONSchema(schema, { io: "input", target: "draft-07" }),
}));
const properties: Record<string, unknown> = {};
for (const { parameters } of actionParameters) {
  for (const [field, definition] of Object.entries(parameters.properties!)) properties[field] = definition;
}
// ACT: 模型工具参数保持顶层对象兼容，具体操作仍在执行前按判别联合严格校验。
const parameters = {
  type: "object",
  properties: {
    ...properties,
    action: {
      type: "string",
      enum: actionParameters.map(item => item.action),
      description: "每次只执行一个操作，除 action 外仅传该操作列出的字段：" + actionParameters.map(({ action, parameters }) =>
        `${action}：${Object.keys(parameters.properties!).filter(field => field !== "action").map(field =>
          `${field}（${parameters.required?.includes(field) ? "必填" : "可选"}）`).join("、")}`
      ).join("；"),
    },
  },
  required: ["action"],
  additionalProperties: false,
};
const pluginConfigSchema = configSchema.omit({ accessKeyId: true, secretAccessKey: true }).extend({
  accessKeyId: z.string().trim().max(256).default(""),
  secretAccessKey: z.string().max(4096).default(""),
});

const sessions = new Map<string, { token: string; link: string; cwd: string; owner: string; expiresAt: number; groupId?: string; pending?: Promise<string> }>();

function ownerFor(config: AssetConfig) {
  return createHash("sha256").update(JSON.stringify([config.accessKeyId, config.secretAccessKey, config.projectName, config.callbackUrl])).digest("hex");
}

function safeH5Link(value: unknown) {
  if (typeof value !== "string" || value.length > 8192) throw new Error("火山方舟未返回有效认证链接");
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("火山方舟返回的认证链接无效"); }
  if (!["https://ark.volcengine.com", "https://h5-v2.kych5.com"].includes(url.origin) || url.username || url.password) throw new Error("火山方舟返回的认证链接无效");
  return url.href;
}

function page(result: Record<string, unknown>) {
  if (!Array.isArray(result.Items) || result.Items.length > 100) throw new Error("火山方舟返回的列表格式无效");
  const nextToken = result.NextToken;
  if (nextToken !== undefined && (typeof nextToken !== "string" || !nextToken || nextToken.length > 4096)) throw new Error("火山方舟返回的分页凭证无效");
  return { items: result.Items, ...(nextToken ? { nextToken } : {}) };
}

const mimeTypes: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".tif": "image/tiff", ".tiff": "image/tiff", ".gif": "image/gif", ".heic": "image/heic", ".heif": "image/heif",
  ".mp4": "video/mp4", ".mov": "video/quicktime", ".mp3": "audio/mpeg", ".wav": "audio/wav",
};

const plugin: ToolPlugin = {
  validateConfig: config => pluginConfigSchema.parse(config),
  async resolveProviderAssets({ config, assets, signal }) {
    const parsed = configSchema.safeParse(config);
    if (!parsed.success) throw new Error("请先在官方肖像素材库设置中填写火山引擎 Access Key ID 和 Secret Access Key");
    return resolveAssets(parsed.data, assets, signal);
  },
  getClientLink({ id, cwd, config }) {
    const session = sessions.get(z.string().uuid().parse(id));
    if (!session || session.expiresAt <= Date.now() || session.groupId || session.cwd !== cwd || session.owner !== ownerFor(configSchema.parse(config))) throw new Error("认证会话已完成、过期或不属于当前工作区，请核对后重新发起");
    return safeH5Link(session.link);
  },
  createTools(context) {
    return [{
      name: "seedanceAssets",
      label: "官方肖像素材库",
      description: "火山方舟真人素材：startAuthentication 创建本人认证链接；finishAuthentication 确认认证结果；listGroups/listAssets/getAsset 查询素材组、素材和处理状态；createAsset 用公网 URL 或工作区文件入库；selectAssets 将已就绪素材绑定到视频节点，不触发生成。",
      promptSnippet: "管理火山方舟官方真人素材，并将可用素材绑定到视频生成节点。",
      parameters,
      executionMode: "sequential",
      async execute(_id, params, signal) {
        const request = requestSchema.parse(params);
        const config = pluginConfigSchema.parse(context.config);
        if (!config.accessKeyId || !config.secretAccessKey.trim()) throw new Error("请先在官方肖像素材库设置中填写火山引擎 Access Key ID 和 Secret Access Key");
        signal?.throwIfAborted();
        let result: Record<string, unknown>;
        if (request.action === "startAuthentication") {
          if (sessions.size >= 100) throw new Error("待完成的认证会话过多，请等待现有会话完成或过期");
          const expiresAt = Date.now() + 30 * 60_000;
          const response = await requestAsset(config, "CreateVisualValidateSession", { CallbackURL: config.callbackUrl }, signal);
          const token = z.string().min(1).max(4096).parse(response.BytedToken);
          const link = safeH5Link(response.H5Link);
          const sessionId = randomUUID();
          if (sessions.size >= 100) throw new Error("待完成的认证会话过多，本次链接未保存，请稍后重新发起");
          const timer = setTimeout(() => sessions.delete(sessionId), Math.max(0, expiresAt - Date.now()));
          timer.unref?.();
          sessions.set(sessionId, { token, link, cwd: context.cwd, owner: ownerFor(config), expiresAt });
          result = { action: request.action, sessionId, expiresAt: new Date(expiresAt).toISOString() };
        } else if (request.action === "finishAuthentication") {
          const session = sessions.get(request.sessionId);
          if (!session || session.expiresAt <= Date.now() || session.cwd !== context.cwd || session.owner !== ownerFor(config)) throw new Error("认证会话已过期、不属于当前配置和工作区或随服务重启丢失，请重新发起认证");
          if (!session.groupId) {
            // 同一认证会话可被多个对话查询，只向官方提交一次进行中的结果请求；共享请求不绑定首个调用者的取消信号，各调用者等待后自行检查取消。
            session.pending ??= requestAsset(config, "GetVisualValidateResult", { BytedToken: session.token }).then(response => {
              session.groupId = providerAssetIdSchema.parse(response.GroupId);
              session.token = "";
              session.link = "";
              return session.groupId;
            }).finally(() => { session.pending = undefined; });
            await session.pending;
          }
          signal?.throwIfAborted();
          result = { action: request.action, groupId: session.groupId, projectName: config.projectName };
        } else if (request.action === "listGroups" || request.action === "listAssets") {
          const filter = { GroupType: "LivenessFace", ...(request.name ? { Name: request.name } : {}),
            ...(request.action === "listAssets" && request.groupId ? { GroupIds: [request.groupId] } : {}),
            ...(request.action === "listAssets" && request.status ? { Statuses: [request.status] } : {}) };
          const response = page(await requestAsset(config, request.action === "listGroups" ? "ListAssetGroups" : "ListAssets", {
            Filter: filter, ...(request.maxResults ? { MaxResults: request.maxResults } : {}), ...(request.nextToken ? { NextToken: request.nextToken } : {}),
          }, signal));
          const items = request.action === "listAssets" ? response.items.map(assetSummary) : response.items.map(value => {
            const group = z.object({ Id: providerAssetIdSchema, Name: z.string().optional(), GroupType: z.literal("LivenessFace"), ProjectName: z.string() }).parse(value);
            if (group.ProjectName !== config.projectName) throw new Error("火山方舟返回的素材组项目不匹配");
            return { id: group.Id, ...(group.Name ? { name: group.Name.slice(0, 64) } : {}), projectName: group.ProjectName };
          });
          if (request.action === "listAssets" && items.some(item => item.projectName !== config.projectName)) throw new Error("火山方舟返回的素材项目不匹配");
          result = { action: request.action, items, ...(response.nextToken ? { nextToken: response.nextToken } : {}) };
        } else if (request.action === "getAsset") {
          const asset = assetSummary(await requestAsset(config, "GetAsset", { Id: request.assetId }, signal));
          if (asset.id !== request.assetId || asset.projectName !== config.projectName) throw new Error("火山方舟返回的素材 ID 或项目不匹配");
          result = { action: request.action, asset };
        } else if (request.action === "selectAssets") {
          if (!context.canvas) throw new Error("请先打开目标视频节点所在画布");
          const assets = await resolveAssets(config, request.assets, signal);
          await context.canvas.call({ name: "nodeTools", args: { nodeId: request.nodeId, name: "node:setProviderAssets", args: { assets } } }, signal);
          result = { action: request.action, nodeId: request.nodeId, assets };
        } else {
          let url = request.url;
          let uploadRecord: { storageId: string; bucket: string; objectKey: string; expiresAt?: string } | undefined;
          if (request.path) {
            if (!context.uploadMedia) throw new Error("请更新 Toonflow，并安装、启用和配置阿里云 OSS 插件");
            const mimeType = mimeTypes[extname(request.path).toLowerCase()];
            if (!mimeType?.startsWith(`${request.mediaType}/`)) throw new Error("素材文件扩展名与所选类型不匹配，或格式不受支持");
            const limit = { image: 30, video: 100, audio: 15 }[request.mediaType] * 1024 * 1024;
            const info = await context.files.stat(request.path);
            if (!info.isFile() || info.size <= 0 || info.size > limit || request.mediaType === "image" && info.size === limit) throw new Error("文件为空或超过限制：图片须小于 30 MB、视频不超过 100 MB、音频不超过 15 MB");
            const bytes = await context.files.readFile(request.path, false, { signal, maxBytes: request.mediaType === "image" ? limit - 1 : limit });
            if (!bytes.byteLength) throw new Error("素材文件为空");
            try {
              const uploadSignal = AbortSignal.any([AbortSignal.timeout(30 * 60_000), ...(signal ? [signal] : [])]);
              const uploaded = await context.uploadMedia({ data: bytes, mimeType, signal: uploadSignal, onPrepared: async record => { uploadRecord = { ...record }; } });
              uploadRecord = { storageId: uploaded.storageId, bucket: uploaded.bucket, objectKey: uploaded.objectKey, expiresAt: uploaded.expiresAt };
              url = uploaded.url;
            } catch (error) {
              const message = safeErrorMessage(error, config);
              if (!uploadRecord) throw new Error(message || "OSS 上传失败");
              // 内层消息已含对象键时不再重复拼接 Bucket 与对象。
              const location = message.includes(uploadRecord.objectKey) ? "" : `；Bucket ${uploadRecord.bucket}，对象 ${uploadRecord.objectKey}`;
              throw new Error(`OSS 上传失败或结果未知${message ? `：${message}` : ""}${location}；请先在 OSS 控制台核对，不要直接重复提交`);
            }
          }
          try {
            const response = await requestAsset(config, "CreateAsset", {
              GroupId: request.groupId, URL: url!, AssetType: { image: "Image", video: "Video", audio: "Audio" }[request.mediaType],
              ...(request.name ? { Name: request.name } : {}),
            }, signal);
            const assetId = providerAssetIdSchema.safeParse(response.Id);
            if (!assetId.success) throw new Error("素材请求已提交，但未收到有效素材 ID；请先在方舟控制台确认，避免重复入库");
            result = { action: request.action, assetId: assetId.data, groupId: request.groupId, mediaType: request.mediaType, ...(uploadRecord ? { storage: uploadRecord } : {}) };
          } catch (error) {
            if (!uploadRecord) throw error;
            throw new Error(`${safeErrorMessage(error, config) || "方舟素材入库失败或结果未知"}；已上传至 OSS Bucket ${uploadRecord.bucket}，对象 ${uploadRecord.objectKey}，请先核对，不要重复上传`);
          }
        }
        return { content: [{ type: "text", text: JSON.stringify(result) }], details: result };
      },
    }];
  },
};

export default plugin;
