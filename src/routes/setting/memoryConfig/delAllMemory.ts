import express from "express";
import { success } from "@/lib/responseFormat";
import db from "@/utils/db";

const router = express.Router();

export default router.post("/", async (req, res) => {
  await db("memories").del();
  res.status(200).send(success(true));
});
