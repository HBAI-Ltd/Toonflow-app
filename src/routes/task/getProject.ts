import express from "express";
import db from "@/utils/db";
import { success } from "@/lib/responseFormat";

const router = express.Router();

export default router.post("/", async (_req, res) => {
  const list = await db("o_project").select("id", "name").groupBy("name");
  const data = list.filter((item) => item.name);
  res.status(200).send(success(data));
});
