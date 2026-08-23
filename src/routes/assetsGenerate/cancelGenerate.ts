import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();

// 取消生成
export default router.post(
  "/",
  validateFields({
    id: z.number(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { id } = req.body;
    await u.db("o_image").where("id", id).update({
      state: "生成失败", // i18n-ignore — stored o_image.state enum value, not user-facing text
    });
    res.status(200).send(success({ message: t("assetsGenerate.cancelGenerate.canceled", {}, locale) }));
  },
);
