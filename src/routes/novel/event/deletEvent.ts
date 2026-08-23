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
    id: z.number(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { id } = req.body;

    await u.db("o_event").where("id", id).del();
    await u.db("o_eventChapter").where("eventId", id).del();

    res.status(200).send(success({ message: t("novel.event.delete.deleted", {}, locale) }));
  },
);
