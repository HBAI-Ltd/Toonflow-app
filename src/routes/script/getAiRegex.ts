import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getPromptLanguage } from "@/i18n";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    content: z.string(),
  }),
  async (req, res) => {
    const { content } = req.body;
    // systemPrompt is sent straight into u.Ai.Text().invoke() — model-facing, so it follows
    // prompt_language, not content_language. There's no person-facing text in this route.
    const promptLocale = await getPromptLanguage();
    const systemPrompt = t("agent.script.getAiRegex.systemPrompt", {}, promptLocale);

    const resText = await u.Ai.Text("universalAi").invoke({
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: content.slice(0, 2000),
        },
      ],
    });
    const result = (resText.text || "").trim();
    res.status(200).send(success(result));
  },
);
