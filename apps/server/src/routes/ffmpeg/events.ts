import { Router } from "express";
import u from "@/utils";

export default Router().get("/", (req, res) => {
  // ACT: 原生 EventSource 无自定义请求头；仅此只读通知流使用同源校验。
  u.mcpControl.getAppOrigin(req);
  res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" });
  res.flushHeaders();
  res.write(": connected\n\n");
  const unsubscribe = u.ffmpeg.onRequired(() => {
    if (!res.destroyed) res.write('data: {"type":"required"}\n\n');
  });
  const sendProgress = () => {
    if (res.destroyed || res.writableNeedDrain) return;
    const { phase, file, received, total } = u.ffmpeg.getProgress();
    res.write(`event: progress\ndata: ${JSON.stringify({ phase, file, received, total })}\n\n`);
  };
  const stopProgress = u.ffmpeg.onProgress(sendProgress);
  res.on("drain", sendProgress);
  sendProgress();
  const heartbeat = setInterval(() => { if (!res.destroyed && !res.writableNeedDrain) res.write(": keepalive\n\n"); }, 20000);
  const socket = req.socket;
  const close = () => {
    clearInterval(heartbeat);
    unsubscribe();
    stopProgress();
    res.off("drain", sendProgress);
    res.off("close", close);
    socket.off("close", close);
  };
  res.once("close", close);
  socket.once("close", close);
});
