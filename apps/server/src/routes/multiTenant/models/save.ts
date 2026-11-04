import { Router } from "express";
import { modelRoutesSchema, modelRoutingRevisionSchema } from "@toonflow/multi-tenant-models/config";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().put("/", validateFields({ routes: modelRoutesSchema, expectedRevision: modelRoutingRevisionSchema }), async (req, res) => {
  res.set("Cache-Control", "no-store").json(success(await u.multiTenant.saveModelRouting(req, req.body.routes, req.body.expectedRevision)));
});
