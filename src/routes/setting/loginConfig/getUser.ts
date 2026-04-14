import express from "express";
import db from "@/utils/db";
import { success } from "@/lib/responseFormat";
const router = express.Router();

export default router.get("/", async (req, res) => {
  const data = await db("o_user").select("*").first();
  res.status(200).send(success(data));
});
