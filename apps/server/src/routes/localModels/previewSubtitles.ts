import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import u from "@/utils";

export default Router().post("/", validateFields({
  directory: z.string().min(1).max(4096), source: z.string().min(1).max(4096),
  time: z.number().min(0).max(86400), x: z.number().min(0).lt(100), y: z.number().min(0).lt(100),
  width: z.number().min(0.01).max(100), height: z.number().min(0.01).max(100),
}), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const { directory, source, time, x, y, width, height } = req.body;
  const controller = new AbortController();
  const abort = () => controller.abort();
  res.once("close", abort);
  try {
    const root = await u.workspace.resolveWorkspace(req, directory);
    const png = await u.previewSubtitleFrame(root, source, time, { x, y, width, height }, controller.signal);
    res.set("Cache-Control", "no-store");
    if (!png) { res.status(204).end(); return; }
    res.type("png").send(Buffer.from(png));
  } finally { res.off("close", abort); }
});
