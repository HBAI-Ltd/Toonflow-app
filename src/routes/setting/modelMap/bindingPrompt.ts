import express from "express";
import { error, success } from "@/lib/responseFormat";
import u from "@/utils";
import { z } from "zod";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    vendorId: z.string(),
    model: z.string(),
    path: z.string(),
    fileName: z.string(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { vendorId, model, path, fileName } = req.body;
    const data = await u.db("o_modelPrompt").where("model", model).andWhere("vendorId", vendorId).select("*").first();
    if (data) {
      await u.db("o_modelPrompt").where("model", model).andWhere("vendorId", vendorId).update({ fileName, path });
      res.status(200).send(success(null, t("setting.modelMap.bindingPrompt.bound", {}, locale)));
    } else {
      await u.db("o_modelPrompt").insert({ vendorId, model, path, fileName });
      res.status(200).send(success(null, t("setting.modelMap.bindingPrompt.bound", {}, locale)));
    }
  },
);
