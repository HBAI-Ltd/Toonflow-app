import { Router } from "express";
import { z } from "zod";
import { ffmpegPlanSchema } from "@toonflow/ffmpeg/runtime";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().post("/", validateFields({ directory: z.string().min(1).max(4096), plan: ffmpegPlanSchema }), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const directory = await u.workspace.resolveWorkspace(req, req.body.directory);
  const controller = new AbortController();
  const close = () => controller.abort();
  res.once("close", close);
  req.once("aborted", close);
  req.socket.once("close", close);
  if (req.aborted || res.destroyed) controller.abort();
  try {
    const result = await u.ffmpeg.executePlan(directory, req.body.plan, controller.signal);
    if (!res.destroyed) res.set("Cache-Control", "no-store").json(success(result));
  } finally {
    res.off("close", close);
    req.off("aborted", close);
    req.socket.off("close", close);
  }
});
