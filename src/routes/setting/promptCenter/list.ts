import express from "express";
import { success, error } from "@/lib/responseFormat";
import { listPromptCenterItems } from "@/utils/promptCenter";

const router = express.Router();

export default router.get("/", async (_req, res) => {
  try {
    res.status(200).send(success(await listPromptCenterItems()));
  } catch (err: any) {
    res.status(400).send(error(err?.message ?? String(err)));
  }
});
