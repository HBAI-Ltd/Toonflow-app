import { Router } from "express";
import { z } from "zod";
import { audioGenerationSchema, imageGenerationSchema, videoGenerationSchema } from "@toonflow/tool-media-generation/runtime";
import { validateFields } from "@/lib/middleware";
import { success, error } from "@/lib/responseFormat";
import u from "@/utils";
import { translateError, translateMessage, validationOptions } from "@/lib/i18n";

export default Router().post("/", validateFields({
  directory: z.string().min(1).max(4096), mediaType: z.enum(["image", "video", "audio"]),
}), async (req, res) => {
  const { directory, mediaType, ...request } = req.body;
  const parsed = (mediaType === "image" ? imageGenerationSchema : mediaType === "video" ? videoGenerationSchema : audioGenerationSchema).safeParse(request, validationOptions());
  if (!parsed.success) {
    res.status(400).json(error("参数错误", parsed.error.issues.map(issue => ({ ...issue, message: translateMessage(issue.message) })), 400));
    return;
  }
  const cwd = await u.workspace.resolveWorkspace(req, directory);
  const controller = new AbortController();
  res.set({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-cache" });
  res.flushHeaders();
  // ACT: macOS WKWebView 约 60 秒收不到首字节会断开。前导空白仍是合法 JSON。
  const heartbeat = setInterval(() => { if (!res.destroyed && !res.writableEnded) res.write("\n"); }, 20000);
  const close = () => { clearInterval(heartbeat); controller.abort(); };
  res.once("close", close);
  req.once("aborted", close);
  req.socket.once("close", close);
  try {
    const files = await u.mediaGeneration.generateMedia(cwd, mediaType, parsed.data, controller.signal);
    if (!res.destroyed && !res.writableEnded) res.end(JSON.stringify(success(files)));
  } catch (failure) {
    if (!res.destroyed && !res.writableEnded) res.end(JSON.stringify(error(failure instanceof Error ? translateError(failure) : translateMessage("媒体生成失败"), null, 500)));
  } finally {
    clearInterval(heartbeat);
    res.off("close", close);
    req.off("aborted", close);
    req.socket.off("close", close);
  }
});
