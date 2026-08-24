import express from "express";
import { success } from "@/lib/responseFormat";
import { getPromptLanguage } from "@/i18n";

const router = express.Router();

export default router.get("/", async (req, res) => {
  const promptLanguage = await getPromptLanguage();
  res.status(200).send(success(promptLanguage));
});
