import { Router } from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";

export default Router().get("/", async (req, res) => {
  res.set("Cache-Control", "no-store").json(success(await u.multiTenant.getModelRouting(req)));
});
