import { Router } from "express";
import { modelProvidersSchema, modelRoutingRevisionSchema } from "@toonflow/multi-tenant-models/config";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().put("/", validateFields({ providers: modelProvidersSchema, expectedRevision: modelRoutingRevisionSchema }), async (req, res) => {
  res.set("Cache-Control", "no-store").json(success(await u.multiTenant.saveModelProviders(req, req.body.providers, req.body.expectedRevision)));
});
