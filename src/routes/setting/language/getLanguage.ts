import express from "express";
import { success } from "@/lib/responseFormat";
import { getLocale } from "@/i18n";

const router = express.Router();

export default router.get("/", async (req, res) => {
  const locale = await getLocale(req as any);
  res.status(200).send(success(locale));
});
