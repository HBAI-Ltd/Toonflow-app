import express from "express";
import db from "@/utils/db";
import oss from "@/utils/oss";
import { success } from "@/lib/responseFormat";

const router = express.Router();

export default router.post("/", async (_req, res) => {
  const list = await db("o_artStyle").select("*");
  const data = await Promise.all(
    list.map(async (item: any) => {
      const fileUrl = await oss.getFileUrl(item.fileUrl);
      return { ...item, fileUrl };
    }),
  );

  res.status(200).send(success(data));
});
