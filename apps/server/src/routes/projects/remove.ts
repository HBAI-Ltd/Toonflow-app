import { Router } from "express";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { updateProject } from "@/utils/hosting/tenant";

export default Router().delete("/", (req, res) => {
  const { id } = z.strictObject({ id: z.uuid() }).parse(req.body);
  updateProject(id);
  res.json(success());
});
