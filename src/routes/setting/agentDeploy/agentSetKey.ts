import express from "express";
import { success, error } from "@/lib/responseFormat";
import u from "@/utils";
import { z } from "zod";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    key: z.string().optional(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { key } = req.body;
    const vendorConfigData = await u.db("o_vendorConfig").where("id", "toonflow").first();
    if (!vendorConfigData) return res.status(500).send(error(t("setting.agentDeploy.agentSetKey.vendorConfigNotFound", {}, locale)));
    if (!vendorConfigData.inputValues) return res.status(500).send(error(t("setting.agentDeploy.agentSetKey.configDataNotFound", {}, locale)));
    const inputValue = JSON.parse(vendorConfigData.inputValues!);
    inputValue.apiKey = key;
    await u
      .db("o_vendorConfig")
      .where("id", "toonflow")
      .update({
        inputValues: JSON.stringify(inputValue),
      });
    try {
      const resText = await u.Ai.Text(`toonflow:claude-haiku-4-5-20251001`).invoke({
        // i18n-ignore — literal AI test prompt, not a user-facing string
        prompt: "1+1等于几？,请直接回答2，不要解释",
      });
      if (resText.text) {
        await u.db("o_agentDeploy").where("key", "scriptAgent").update({
          model: "claude-sonnet-4-6",
          modelName: "toonflow:claude-sonnet-4-6",
          vendorId: "toonflow",
        });
        await u.db("o_agentDeploy").where("key", "productionAgent").update({
          model: "claude-sonnet-4-6",
          modelName: "toonflow:claude-sonnet-4-6",
          vendorId: "toonflow",
        });
        await u.db("o_agentDeploy").where("key", "universalAi").update({
          model: "claude-haiku-4-5",
          modelName: "toonflow:claude-haiku-4-5-20251001",
          vendorId: "toonflow",
        });
        res.status(200).send(success(null, t("setting.agentDeploy.agentSetKey.autoFillSuccess", {}, locale)));
      }
    } catch (err) {
      console.error(err);
      inputValue.apiKey = "";
      await u
        .db("o_vendorConfig")
        .where("id", "toonflow")
        .update({ inputValues: JSON.stringify(inputValue) });
      res.status(400).send(error(t("setting.agentDeploy.agentSetKey.invalidKey", {}, locale)));
    }
  },
);
