import { Router } from "express";
import { z } from "zod";
import { modelRoutingRevisionSchema } from "@toonflow/multi-tenant-models/config";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({ token: z.string().trim().min(1).max(16384).optional(), expectedRevision: modelRoutingRevisionSchema }), async (req, res) => {
  const controller = new AbortController();
  const close = () => controller.abort();
  res.once("close", close);
  req.once("aborted", close);
  req.socket.once("close", close);
  try {
    const result = await u.multiTenant.configureModelCloud(req, req.body.token, req.body.expectedRevision, controller.signal);
    if (!res.destroyed) res.set("Cache-Control", "no-store").json(success(result));
  } finally {
    res.off("close", close);
    req.off("aborted", close);
    req.socket.off("close", close);
  }
});
