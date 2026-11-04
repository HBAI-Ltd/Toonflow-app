import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({
  title: z.string().trim().min(1).refine(value => !value.includes("\0"), "不能包含空字符")
    .refine(value => process.platform !== "win32" || value.length <= 63, "Windows 通知标题不能超过 63 个字符"),
  body: z.string().refine(value => !value.includes("\0"), "不能包含空字符")
    .refine(value => process.platform !== "win32" || value.length <= 255, "Windows 通知内容不能超过 255 个字符").optional(),
  silent: z.boolean().optional(),
}), async (req, res) => {
  await u.desktop.getDesktopRuntime(req).showNotification({
    title: req.body.title.trim(),
    body: req.body.body,
    silent: req.body.silent,
  });
  // ACT: 系统不提供送达回执，成功仅表示已调用系统通知。
  res.json(success());
});
