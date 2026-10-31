import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { t } from "@/lib/i18n";
import channelRequest from "@/lib/channelRequest";

const fields = {
  name: z.string().trim().min(1).max(200),
  identifier: z.string().trim().min(1).max(200),
  type: z.enum(["node", "tool", "skill", "agent", "ext"]),
  desc: z.string().trim().max(20000).optional(),
  fileBase64: z.string().min(1).max(Math.ceil(20 * 1024 * 1024 / 3) * 4).base64(),
  fileName: z.string().trim().min(1).max(255),
  version: z.string().trim().min(1).max(128),
  demoVideoKey: z.string().min(1).max(512).optional(),
  coverKey: z.string().min(1).max(512).optional(),
};
const schema = z.strictObject(fields).superRefine((value, context) => {
  if (value.type === "skill" && !value.demoVideoKey) {
    context.addIssue({ code: "custom", path: ["demoVideoKey"], message: "请上传 Skill 效果演示视频" });
  }
  if (value.type === "node" && !value.coverKey) {
    context.addIssue({ code: "custom", path: ["coverKey"], message: "请上传节点截图封面" });
  }
  const archive = value.type === "skill" || value.type === "agent";
  const extension = archive ? ".zip" : ".js";
  if (!value.fileName.toLowerCase().endsWith(extension)) {
    context.addIssue({ code: "custom", path: ["fileName"], message: t`此类插件只支持 ${extension} 文件` });
  }
  const maxBytes = (archive ? 20 : 10) * 1024 * 1024;
  if (Buffer.byteLength(value.fileBase64, "base64") > maxBytes) {
    context.addIssue({ code: "custom", path: ["fileBase64"], message: t`插件文件不能超过 ${archive ? 20 : 10} MB` });
  }
});

export default Router().post("/", validateFields(fields), (req, res) => channelRequest(req, res,
  (source, options) => source.uploadPlugin(schema.parse(req.body), options), true));
