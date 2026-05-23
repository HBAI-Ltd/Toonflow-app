import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    ids: z.array(z.number()),
  }),
  async (req, res) => {
    const { ids } = req.body;
    if (!ids.length) {
      return res.status(400).send(error("请先选择需要删除的内容"));
    }

    const chapterData = await u.db("o_eventChapter").whereIn("novelId", ids);
    const eventIds = chapterData.map((i) => i.id);

    await u.db.transaction(async (trx) => {
      await trx("o_eventChapter").whereIn("novelId", ids).delete();
      if (eventIds.length) await trx("o_event").whereIn("id", eventIds).delete();
      await trx("o_novel").whereIn("id", ids).del();
    });

    res.status(200).send(success({ message: "删除原文成功" }));
  },
);
