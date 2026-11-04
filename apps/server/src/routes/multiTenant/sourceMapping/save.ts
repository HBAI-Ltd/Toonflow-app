import { Router } from "express";
import { sourceMappingRevisionSchema, sourceMappingSchema } from "@toonflow/multi-tenant-source-mapping/config";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

const fields = { mappings: sourceMappingSchema, expectedRevision: sourceMappingRevisionSchema };

export default Router().put("/", validateFields(fields), async (req, res) => {
  res.set("Cache-Control", "no-store").json(success(await u.multiTenant.saveSourceMapping(req, req.body.mappings, req.body.expectedRevision)));
});
