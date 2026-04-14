import express from "express";
import db from "@/utils/db";
import { success } from "@/lib/responseFormat";
const router = express.Router();

// 获取项目
export default router.post("/", async (req, res) => {
  const data = await db("o_project").select("*");
  res.status(200).send(success(data));
});
