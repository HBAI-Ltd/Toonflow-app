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
    modelName: z.string(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { id, modelName } = req.body;

    const models = await u.db("o_vendorConfig").where("id", id).first("models");
    if (models?.models) {
      const existingModels = JSON.parse(models.models);
      if (!existingModels.some((model: any) => model.modelName === modelName)) {
        return res.status(400).send(error(t("setting.vendorConfig.delVendorModel.baseModelNotDeletable", {}, locale)));
      }
      const updatedModels = existingModels.filter((model: any) => model.modelName !== modelName);
      await u
        .db("o_vendorConfig")
        .where("id", id)
        .update({
          models: JSON.stringify(updatedModels),
        });
    }
    res.status(200).send(success(null, t("setting.vendorConfig.delVendorModel.updated", {}, locale)));
  },
);
