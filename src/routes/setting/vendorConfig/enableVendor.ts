import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import u from "@/utils";
import { z } from "zod";
import { t, getLocale } from "@/i18n";
const router = express.Router();
export default router.post(
  "/",
  validateFields({
    id: z.string(),
    enable: z.number(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { id, enable } = req.body;
    await u.db("o_vendorConfig").where("id", id).update({ enable });
    res.status(200).send(success(null, t("setting.vendorConfig.enableVendor.updated", {}, locale)));
  },
);
