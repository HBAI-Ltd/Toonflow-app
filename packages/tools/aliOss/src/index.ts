import { extname } from "node:path";
import { z } from "zod";
import type { ToolPlugin } from "@toonflow/tools-scaffold/runtime";
import { configSchema, mimeTypes, uploadMedia } from "./storage";

const pathSchema = z.string().min(1).max(4096).refine(value => !/[\x00-\x1f]/.test(value)
  && !/^(?:[\\/]|[a-z][a-z\d+.-]*:)/i.test(value) && !value.split(/[\\/]+/).includes(".."), "素材路径必须位于工作区内");
const requestSchema = z.strictObject({ path: pathSchema.describe("工作区内的媒体文件相对路径") });

const plugin: ToolPlugin = {
  validateConfig: config => configSchema.parse(config),
  uploadMedia,
  createTools(context) {
    return [{
      name: "aliOss",
      label: "阿里云 OSS 上传",
      description: "用于验证 OSS 配置，或在用户明确要求时上传工作区媒体；仅返回对象标识与链接过期时间，不返回签名链接。",
      parameters: z.toJSONSchema(requestSchema, { io: "input", target: "draft-07" }),
      async execute(_id, args, signal) {
        const { path } = requestSchema.parse(args);
        const mimeType = mimeTypes[extname(path).toLowerCase()];
        if (!mimeType) throw new Error("不支持此媒体文件格式");
        const limit = 100 * 1024 * 1024;
        const info = await context.files.stat(path);
        if (!info.isFile() || !info.size || info.size > limit) throw new Error("媒体文件为空或超过 100 MB");
        const data = await context.files.readFile(path, false, { signal, maxBytes: limit });
        const { storageId, bucket, objectKey, expiresAt } = await uploadMedia({ config: context.config, data, mimeType, signal });
        const details = { storageId, bucket, objectKey, expiresAt };
        return { content: [{ type: "text", text: JSON.stringify(details) }], details };
      },
    }];
  },
};

export default plugin;
