import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();

// 删除原文
export default router.post(
  "/",
  validateFields({
    id: z.number(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { id } = req.body;

    const chapterData = await u.db("o_eventChapter").where("novelId", id);
    await u.db("o_eventChapter").where("novelId", id).delete();
    const eventIds = chapterData.map((i) => i.id);
    if (eventIds.length) await u.db("o_event").whereIn("id", eventIds).delete();
    await u.db("o_novel").where("id", id).del();

    res.status(200).send(success({ message: t("novel.delete.deleted", {}, locale) }));
  },
);
