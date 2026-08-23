import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
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
    if (!ids.length) {
      return res.status(400).send(error(t("novel.batchDeleteNovel.selectRequired", {}, locale)));
    }
    const chapterData = await u.db("o_eventChapter").whereIn("novelId", ids);
    await u.db("o_eventChapter").whereIn("novelId", ids).delete();
    const eventIds = chapterData.map((i) => i.id);
    if (eventIds.length) await u.db("o_event").whereIn("id", eventIds).delete();

    await u.db("o_novel").whereIn("id", ids).del();

    res.status(200).send(success({ message: t("novel.delete.deleted", {}, locale) }));
  },
);
