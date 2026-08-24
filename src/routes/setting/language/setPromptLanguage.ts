import express from "express";
import { success, error } from "@/lib/responseFormat";
import { isLocale, setPromptLanguage, t, getLocale } from "@/i18n";

const router = express.Router();

export default router.post("/", async (req, res) => {
  const { language } = req.body ?? {};
  if (!isLocale(language)) {
    // Error message is read by a person, so it resolves through content_language like every other
    // API message — only the setting being changed here (prompt_language) is model-facing.
    const current = await getLocale(req as any);
    return res.status(200).send(error(t("setting.language.invalid", {}, current)));
  }
  await setPromptLanguage(language);
  const current = await getLocale(req as any);
  res.status(200).send(success(language, t("common.success", {}, current)));
});
