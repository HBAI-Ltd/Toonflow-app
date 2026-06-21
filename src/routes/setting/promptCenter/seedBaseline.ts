import express from "express";
import { success, error } from "@/lib/responseFormat";
import { seedPromptBaselineVersions } from "@/utils/promptCenter";

const router = express.Router();

export default router.post("/", async (_req, res) => {
  try {
    res.status(200).send(success(await seedPromptBaselineVersions(), "基线版本已登记"));
  } catch (err: any) {
    res.status(400).send(error(err?.message ?? String(err)));
  }
});

