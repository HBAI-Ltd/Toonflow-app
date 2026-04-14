import express from "express";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import db from "@/utils/db";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    id: z.number(),
    name: z.string(),
    model: z.string(),
    modelName: z.string(),
    vendorId: z.string().nullable(),
    desc: z.string(),
    temperature: z.number().optional(),
    maxOutputTokens: z.number().optional(),
  }),
  async (req, res) => {
    const { id, name, model, modelName, vendorId, desc, temperature, maxOutputTokens } = req.body;

    await db("o_agentDeploy").where({ id }).update({
      id,
      name,
      model,
      modelName,
      vendorId,
      desc,
      temperature,
      maxOutputTokens,
    });
    res.status(200).send(success("配置成功"));
  },
);
