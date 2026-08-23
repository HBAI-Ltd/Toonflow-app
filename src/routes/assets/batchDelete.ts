import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();

// 批量删除资产
export default router.post(
  "/",
  validateFields({
    id: z.array(z.number()),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { id } = req.body;
    await u.db("o_assets").whereIn("id", id).delete();
    res.status(200).send(success({ message: t("assets.common.deleted", {}, locale) }));
  },
);
