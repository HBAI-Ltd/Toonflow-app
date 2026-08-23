import express from "express";
import { success, error } from "@/lib/responseFormat";
import { isLocale, setLocale, t, getLocale } from "@/i18n";

const router = express.Router();

export default router.post("/", async (req, res) => {
  const { language } = req.body ?? {};
  if (!isLocale(language)) {
    const current = await getLocale(req as any);
    return res.status(200).send(error(t("setting.language.invalid", {}, current)));
  }
  await setLocale(language);
  res.status(200).send(success(language, t("common.success", {}, language)));
});
