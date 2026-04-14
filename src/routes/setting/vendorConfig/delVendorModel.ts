import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import db from "@/utils/db";
import { z } from "zod";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    id: z.string(),
    modelName: z.string(),
  }),
  async (req, res) => {
    const { id, modelName } = req.body;

    const models = await db("o_vendorConfig").where("id", id).first("models");
    if (models?.models) {
      const existingModels = JSON.parse(models.models);
      if (!existingModels.some((model: any) => model.modelName === modelName)) {
        return res.status(400).send(error("基本模型不允许删除"));
      }
      const updatedModels = existingModels.filter((model: any) => model.modelName !== modelName);
      await db
        ("o_vendorConfig")
        .where("id", id)
        .update({
          models: JSON.stringify(updatedModels),
        });
    }
    res.status(200).send(success("更新成功"));
  },
);
