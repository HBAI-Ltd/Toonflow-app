import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { ffmpegOptionsSchema } from "@toonflow/ffmpeg/convert";
import u from "@/utils";

const optionsSchema = z.string().max(4096).transform((value, context) => {
  try { return JSON.parse(value); }
  catch {
    context.addIssue({ code: "custom", message: "FFmpeg 选项必须是有效 JSON" });
    return z.NEVER;
  }
}).pipe(ffmpegOptionsSchema);

export default Router().post("/", validateFields({ options: optionsSchema }, "query"), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  if (!req.is("application/octet-stream") || !Buffer.isBuffer(req.body) || !req.body.byteLength) {
    throw Object.assign(new Error("请发送非空媒体原始内容"), { status: 400 });
  }
  const options = optionsSchema.parse(req.query.options);
  const controller = new AbortController();
  const close = () => controller.abort();
  res.once("close", close);
  req.once("aborted", close);
  req.socket.once("close", close);
  try {
    const result = await u.ffmpeg.convertMedia(req.body, options, controller.signal);
    if (!res.destroyed) res.set({ "Content-Type": result.mimeType, "Cache-Control": "no-store" }).send(Buffer.from(result.data));
  } finally {
    res.off("close", close);
    req.off("aborted", close);
    req.socket.off("close", close);
  }
});
