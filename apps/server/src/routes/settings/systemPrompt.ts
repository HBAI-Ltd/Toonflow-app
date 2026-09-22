import u from "@/utils";
import { Router } from "express";
import { defaultSystemPrompt, maxSystemPromptLength } from "@/agent/runtime/prompt";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.get("/", (req, res) => {
  u.mcpControl.assertAppRequest(req);
  res.set("Cache-Control", "no-store");
  res.json(success({ defaultSystemPrompt, maxLength: maxSystemPromptLength }));
});
