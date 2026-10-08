import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().post("/", validateFields({ directory: z.string().min(1).max(4096), outputPath: z.string().min(1).max(4096), inputPaths: z.array(z.string().min(1).max(4096)).min(1).max(1000) }), async (req, res) => {
  const directory = await u.workspace.resolveWorkspace(req, req.body.directory);
  const controller = new AbortController();
  const close = () => controller.abort();
  res.once("close", close);
  req.once("aborted", close);
  req.socket.once("close", close);
  try {
    res.json(success(await u.production.exportProduction(directory, req.body.outputPath, req.body.inputPaths, controller.signal)));
  } finally {
    res.off("close", close);
    req.off("aborted", close);
    req.socket.off("close", close);
  }
});
