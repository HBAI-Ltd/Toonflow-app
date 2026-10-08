import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().post("/", validateFields({ directory: z.string().min(1).max(4096), outputPath: z.string().min(1).max(4096), inputPaths: z.array(z.string().min(1).max(4096)).min(1).max(1000) }), async (req, res) => {
  const directory = await u.workspace.resolveWorkspace(req, req.body.directory);
  res.status(202).json(success(await u.production.exportProduction(directory, req.body.outputPath, req.body.inputPaths)));
});
