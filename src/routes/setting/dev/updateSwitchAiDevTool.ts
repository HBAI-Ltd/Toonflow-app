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
    switchAiDevTool: z.string(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { switchAiDevTool } = req.body;
    await u.db("o_setting").where("key", "switchAiDevTool").update({
      value: switchAiDevTool,
    });
    res.status(200).send(success(null, t("setting.dev.updateSwitchAiDevTool.saved", {}, locale)));
  },
);
