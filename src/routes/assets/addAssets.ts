import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();

// 新增资产
export default router.post(
  "/",
  validateFields({
    name: z.string(),
    describe: z.string(),
    type: z.string(),
    projectId: z.number(),
    remark: z.string().optional().nullable(),
    prompt: z.string().optional().nullable(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { name, describe, type, projectId, remark, prompt } = req.body;
    await u.db("o_assets").insert({
      name,
      describe,
      type,
      projectId,
      remark,
      prompt,
      startTime: Date.now(),
    });
    res.status(200).send(success({ message: t("assets.common.added", {}, locale) }));
  },
);
