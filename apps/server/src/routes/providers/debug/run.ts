import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";

export default Router().post("/", validateFields({
  ...u.providerDebug.providerDebugSchema,
  request: z.record(z.string(), z.json()),
}), async (req, res) => {
  res.set({ "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" });
  res.flushHeaders();
  // ACT: macOS WKWebView 约 60 秒收不到字节会断开。空行只保活，NDJSON 解析会跳过。
  const heartbeat = setInterval(() => { if (!res.destroyed && !res.writableEnded) res.write("\n"); }, 20000);
  const controller = new AbortController();
  const close = () => { clearInterval(heartbeat); controller.abort(); };
  res.once("close", close);
  const send = (event: Record<string, unknown>) => { if (!res.destroyed) res.write(`${JSON.stringify(event)}\n`); };
  try {
    await u.providerDebug.runProviderSource(req.body.source, req.body.config ?? {}, req.body.request, AbortSignal.any([controller.signal, AbortSignal.timeout(30 * 60_000)]), send);
    send({ type: "done" });
  } finally {
    clearInterval(heartbeat);
    res.off("close", close);
    res.end();
  }
});
