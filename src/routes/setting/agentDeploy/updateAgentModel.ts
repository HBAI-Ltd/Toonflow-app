import express from "express";
import { success } from "@/lib/responseFormat";
import u from "@/utils";
import { z } from "zod";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
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
    const locale = await getLocale(req as any);
    const { id, name, model, modelName, vendorId, desc, temperature, maxOutputTokens } = req.body;
    await u.db("o_agentDeploy").where({ id }).update({ id, name, model, modelName, vendorId, desc, temperature, maxOutputTokens });
    res.status(200).send(success(null, t("setting.agentDeploy.updateAgentModel.configured", {}, locale)));
  },
);
