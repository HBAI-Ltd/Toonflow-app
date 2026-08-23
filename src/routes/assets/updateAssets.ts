import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();

// 更新资产
export default router.post(
  "/",
  validateFields({
    id: z.number(),
    name: z.string(),
    describe: z.string(),
    remark: z.string().optional().nullable(),
    prompt: z.string().optional().nullable(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { id, name, describe, remark, prompt } = req.body;
    await u.db("o_assets").where({ id }).update({
      name,
      describe,
      remark,
      prompt,
    });
    res.status(200).send(success({ message: t("assets.updateAssets.updated", {}, locale) }));
  },
);
