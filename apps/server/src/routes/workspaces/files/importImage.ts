import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

const inputSchema = z.strictObject({ directory: z.string().min(1).max(4096), url: z.string().min(1).max(16384) });

export default Router().post("/", validateFields(inputSchema.shape), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const input = inputSchema.parse(req.body);
  const directory = await u.workspace.resolveWorkspace(req, input.directory);
  res.json(success(await u.chatImages.importImage(directory, input.url)));
});
