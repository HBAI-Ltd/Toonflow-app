import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

const router = Router();

export default router.put("/", validateFields({
  document: z.enum(["memory", "agents"]),
  content: z.string().max(u.personalization.maxDocumentLength),
  revision: z.string().regex(/^[a-f0-9]{64}$/),
}), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const { document, content, revision } = req.body as { document: "memory" | "agents"; content: string; revision: string };
  res.set("Cache-Control", "no-store");
  res.json(success(await u.personalization.saveDocument(document, content, revision), "已保存"));
});
