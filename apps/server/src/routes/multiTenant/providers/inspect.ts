import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({
  kind: z.enum(["text", "media"]), source: z.string().min(1).max(2 * 1024 * 1024),
  config: z.record(z.string(), z.json()), models: z.array(z.record(z.string(), z.json())).max(1000).optional(),
}), async (req, res) => {
  res.set("Cache-Control", "no-store").json(success(await u.multiTenant.inspectModelProvider(req, req.body.kind, req.body.source, req.body.config, req.body.models)));
});
