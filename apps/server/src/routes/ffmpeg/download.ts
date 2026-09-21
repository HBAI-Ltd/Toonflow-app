import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().post("/", validateFields({ source: z.string().min(1).max(40) }), (req, res) => {
  u.mcpControl.assertAppRequest(req);
  res.json(success(u.ffmpeg.startDownload(req.body.source)));
});
