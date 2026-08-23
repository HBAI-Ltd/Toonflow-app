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
    ids: z.array(z.number()),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { ids } = req.body;

    await u.db("o_event").whereIn("id", ids).del();
    await u.db("o_eventChapter").whereIn("eventId", ids).del();

    res.status(200).send(success({ message: t("novel.event.delete.deleted", {}, locale) }));
  },
);
