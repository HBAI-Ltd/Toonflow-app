import express from "express";
import db, { db as knexDb } from "@/utils/db";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    page: z.number(),
    limit: z.number(),
    search: z.string().optional(),
  }),
  async (req, res) => {
    const { projectId, page, limit, search } = req.body;
    const offset = (page - 1) * limit;

    const baseQuery = db("o_event as e")
      .join("o_eventChapter as ec", "ec.eventId", "e.id")
      .join("o_novel as n", "n.id", "ec.novelId")
      .where("n.projectId", projectId);

    if (search) {
      baseQuery.where("e.name", "like", `%${search}%`);
    }

    const [{ total }] = (await baseQuery.clone().countDistinct("e.id as total")) as Array<{ total: number | string }>;

    if (!Number(total)) {
      return res.status(200).send(success({ list: [], total: 0 }));
    }

    const rows = await baseQuery
      .clone()
      .select("e.id", "e.name as eventName", "e.detail", "e.createTime", knexDb.raw("GROUP_CONCAT(n.chapterIndex) as chapterIndexes"))
      .groupBy("e.id")
      .limit(limit)
      .offset(offset);

    const list = rows.map((item: { id: number; eventName: string; detail: string; createTime: number; chapterIndexes: string | null }) => ({
      id: item.id,
      eventName: item.eventName,
      detail: item.detail,
      createTime: item.createTime,
      chapters: item.chapterIndexes ? item.chapterIndexes.split(",").map(Number) : [],
    }));

    return res.status(200).send(success({ list, total: Number(total) }));
  },
);
