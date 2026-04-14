import express from "express";
import db from "@/utils/db";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";

const router = express.Router();

// 删除原文
export default router.post(
  "/",
  validateFields({
    id: z.number(),
  }),
  async (req, res) => {
    const { id } = req.body;

    const chapterData = await db("o_eventChapter").where("novelId", id);
    await db("o_eventChapter").where("novelId", id).delete();
    const eventIds = chapterData
      .map((item) => item.eventId)
      .filter((eventId): eventId is number => typeof eventId === "number");

    if (eventIds.length) {
      await db("o_event").whereIn("id", eventIds).delete();
    }

    await db("o_novel").where("id", id).del();

    return res.status(200).send(success({ message: "删除原文成功" }));
  },
);
