import { raw, Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import u from "@/utils";

const kindSchema = z.enum(["video", "image", "audio"]);

export default Router().post("/",
  (req, _res, next) => { u.mcpControl.assertAppRequest(req); next(); },
  validateFields({ kind: kindSchema }, "query"),
  raw({ type: "application/octet-stream", limit: "100mb", inflate: false }),
  async (req, res) => {
    if (!Buffer.isBuffer(req.body) || !req.body.length || req.body.length > 100 * 1024 * 1024) {
      throw Object.assign(new Error("预览媒体须为不超过 100 MB 的非空二进制文件"), { status: 400 });
    }
    const controller = new AbortController();
    const close = () => controller.abort();
    res.once("close", close);
    req.once("aborted", close);
    req.socket.once("close", close);
    try {
      if (req.aborted || res.destroyed) controller.abort();
      const preview = await u.mediaPreview.createPreview(req.body, kindSchema.parse(req.query.kind), controller.signal);
      controller.signal.throwIfAborted();
      res.set({ "Content-Type": preview.mimeType, "Cache-Control": "no-store" }).send(preview.data);
    } finally {
      res.off("close", close);
      req.off("aborted", close);
      req.socket.off("close", close);
    }
  });
