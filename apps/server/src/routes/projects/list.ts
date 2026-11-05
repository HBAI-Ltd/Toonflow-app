import { Router } from "express";
import { success } from "@/lib/responseFormat";
import { listProjects } from "@/utils/hosting/tenant";
import { requireUser } from "@/utils/accounts/context";

export default Router().get("/", async (_req, res) => {
  requireUser();
  res.json(success(await listProjects()));
});
