import express from "express";
import { serializeError } from "serialize-error";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import u from "@/utils";
import { z } from "zod";
import { transform } from "sucrase";
const router = express.Router();

// vendor 代码静态红线护栏：拒绝明显的沙盒逃逸 / 宿主攻击特征。
// 这不是完整 AST 分析（vendor 为半可信代码，由管理员编辑），只拦截误植或被篡改的高危模式。
const FORBIDDEN_CODE_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\brequire\s*\(/, reason: "禁止 require()（沙盒不提供模块加载，且可用于逃逸）" },
  { pattern: /\bimport\s*\(/, reason: "禁止动态 import()" },
  { pattern: /\bprocess\s*\./, reason: "禁止访问 process（沙盒无宿主进程对象）" },
  { pattern: /\bchild_process\b/, reason: "禁止 child_process（命令执行）" },
  { pattern: /\bglobalThis\b/, reason: "禁止访问 globalThis（防止经全局对象逃逸）" },
  { pattern: /\b__proto__\b/, reason: "禁止 __proto__（原型链污染）" },
  { pattern: /\bconstructor\s*\.\s*constructor\b/, reason: "禁止 constructor.constructor（函数构造器逃逸）" },
  { pattern: /\beval\s*\(/, reason: "禁止 eval()" },
  { pattern: /\bFunction\s*\(/, reason: "禁止 Function() 构造器（动态代码）" },
  { pattern: /\bfs\s*\.\s*(read|write|unlink|rm|append)/i, reason: "禁止文件系统操作" },
];

function checkVendorCodeGuard(tsCode: string): string | null {
  for (const { pattern, reason } of FORBIDDEN_CODE_PATTERNS) {
    if (pattern.test(tsCode)) return reason;
  }
  return null;
}

const vendorConfigSchema = z.object({
  id: z.string(),
  author: z.string(),
  description: z.string().optional(),
  name: z.string(),
  icon: z.string().optional(),
  inputs: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      type: z.enum(["text", "password", "url"]),
      required: z.boolean(),
      placeholder: z.string().optional(),
    }),
  ),
  inputValues: z.record(z.string(), z.string()),
  models: z.array(
    z.discriminatedUnion("type", [
      z.object({
        name: z.string(),
        modelName: z.string(),
        type: z.literal("text"),
        think: z.boolean(),
      }),
      z.object({
        name: z.string(),
        modelName: z.string(),
        type: z.literal("image"),
        mode: z.array(z.enum(["text", "singleImage", "multiReference"])),
      }),
      z.object({
        name: z.string(),
        modelName: z.string(),
        type: z.literal("video"),
        mode: z.array(
          z.union([
            z.enum(["singleImage", "startEndRequired", "endFrameOptional", "startFrameOptional", "text", "audioReference", "videoReference"]),
            z.array(z.string().regex(/^(videoReference|imageReference|audioReference):\d+$/)),
          ]),
        ),
        audio: z.union([z.literal("optional"), z.boolean()]),
        durationResolutionMap: z.array(
          z.object({
            duration: z.array(z.number()),
            resolution: z.array(z.string()),
          }),
        ),
      }),
    ]),
  ),
});

export default router.post(
  "/",
  validateFields({
    id: z.string(),
    tsCode: z.string(),
  }),
  async (req, res) => {
    try {
      const { tsCode, id } = req.body;
      // 信任边界前移：写入前先过静态红线护栏，拦截误植/被篡改的逃逸特征
      const guardReason = checkVendorCodeGuard(tsCode);
      if (guardReason) {
        return res.status(400).send(error(`vendor 代码安全校验未通过：${guardReason}`));
      }
      const jsCode = transform(tsCode, { transforms: ["typescript"] }).code;
      const exports = u.vm(jsCode);
      if (!exports) return res.status(400).send(success("脚本文件必须导出对象"));
      if (!exports.textRequest) return res.status(400).send(success("脚本文件必须导出文本请求对象"));
      if (!exports.imageRequest) return res.status(400).send(success("脚本文件必须导出图像请求对象"));
      if (!exports.videoRequest) return res.status(400).send(success("脚本文件必须导出视频请求对象"));
      if (!exports.vendor) return res.status(400).send(success("脚本文件必须导出vendor对象"));
      const vendor = exports.vendor;
      const result = vendorConfigSchema.safeParse(vendor);
      if (!result.success) {
        const errorMsg = result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
        return res.status(400).send(error(`vendor配置校验失败: ${errorMsg}`));
      }
      await u
        .db("o_vendorConfig")
        .where("id", id)
        .update({
          models: JSON.stringify(vendor.models ?? []),
        });
      // 写入审计：记录变更前后摘要（console 已被 logger 劫持，落 logs/app.log），便于回溯谁在何时改了 vendor 代码
      const previousCode = u.vendor.getCode(id) ?? "";
      u.vendor.writeCode(id, tsCode);
      console.warn(
        `[vendor-code-audit] id=${id} name=${vendor.name ?? "-"} author=${vendor.author ?? "-"} ` +
          `before=${previousCode.length}B after=${tsCode.length}B changed=${previousCode !== tsCode}`,
      );

      res.status(200).send(success(result.data));
    } catch (err) {
      console.log(err);
      res.status(400).send(error(serializeError(err).message || "未知错误"));
    }
  },
);
