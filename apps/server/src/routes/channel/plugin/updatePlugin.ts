import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { t } from "@/lib/i18n";
import channelRequest from "@/lib/channelRequest";

const fields = {
  id: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  name: z.string().trim().min(1).max(200),
  desc: z.string().trim().max(20000).optional(),
  fileBase64: z.string().min(1).max(Math.ceil(20 * 1024 * 1024 / 3) * 4).base64(),
  fileName: z.string().trim().min(1).max(255).regex(/\.(js|zip)$/i, "插件文件只支持 .js 或 .zip 文件"),
  version: z.string().trim().min(1).max(128),
  demoVideoKey: z.string().min(1).max(512).optional(),
  coverKey: z.string().min(1).max(512).optional(),
};
const schema = z.strictObject(fields).superRefine((value, context) => {
  const maxMegabytes = value.fileName.toLowerCase().endsWith(".zip") ? 20 : 10;
  if (Buffer.byteLength(value.fileBase64, "base64") > maxMegabytes * 1024 * 1024) {
    context.addIssue({ code: "custom", path: ["fileBase64"], message: t`插件文件不能超过 ${maxMegabytes} MB` });
  }
});

export default Router().post("/", validateFields(fields), (req, res) => channelRequest(req, res,
  (channel, options) => channel.updatePlugin(schema.parse(req.body), options), true));
