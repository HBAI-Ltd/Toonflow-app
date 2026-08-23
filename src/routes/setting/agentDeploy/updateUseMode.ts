import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    agentUseMode: z.string(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { agentUseMode } = req.body;
    await u.db("o_setting").where("key", "agentUseMode").update({
      value: agentUseMode,
    });
    res.status(200).send(success(null, t("setting.agentDeploy.updateUseMode.saved", {}, locale)));
  },
);
