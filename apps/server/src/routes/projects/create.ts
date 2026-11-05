import { Router } from "express";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { createProject } from "@/utils/hosting/tenant";

export default Router().post("/", async (req, res) => {
  const { name } = z.strictObject({ name: z.string().trim().min(1).max(100) }).parse(req.body);
  res.json(success(await createProject(name)));
});
