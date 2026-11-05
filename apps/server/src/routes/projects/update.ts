import { Router } from "express";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { updateProject } from "@/utils/hosting/tenant";

export default Router().patch("/", (req, res) => {
  const { id, name } = z.strictObject({ id: z.uuid(), name: z.string().trim().min(1).max(100) }).parse(req.body);
  updateProject(id, name);
  res.json(success());
});
