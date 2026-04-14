import express from "express";
import { success } from "@/lib/responseFormat";
import db from "@/utils/db";

const router = express.Router();

export default router.get("/", async (req, res) => {
  const switchAiDevTool = await db("o_setting").where("key", "switchAiDevTool").first();
  res.status(200).send(success(switchAiDevTool?.value || "0"));
});
