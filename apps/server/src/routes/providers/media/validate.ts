import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

const inputSchema = z.strictObject({ source: z.string().min(1).max(2 * 1024 * 1024) });

export default Router().post("/", validateFields(inputSchema.shape), (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const { source } = inputSchema.parse(req.body);
  res.set("Cache-Control", "no-store").json(success(u.mediaProvider.validateMediaProviderSource(source)));
});
