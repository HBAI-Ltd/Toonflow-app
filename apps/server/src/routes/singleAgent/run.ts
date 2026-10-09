import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { translateError } from "@/lib/i18n";
import u from "@/utils";

const inputSchema = z.strictObject({
  sessionId: z.uuid(), runId: z.uuid(), prompt: z.string().trim().min(1).max(100000),
  providerId: z.string().min(1).max(200), modelId: z.string().min(1).max(500),
  thinkingLevel: z.enum(["off", "minimal", "low", "medium", "high", "xhigh"]).optional(),
});

export default Router().post("/", validateFields(inputSchema.shape), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const input = inputSchema.parse(req.body);
  const controller = new AbortController();
  const abort = () => controller.abort();
  res.once("close", abort);
  req.once("aborted", abort);
  req.socket.once("close", abort);
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  try {
    await u.singleAgent.run(input, event => {
      if (!res.destroyed) res.write(`${JSON.stringify(event.type === "error" ? { ...event, message: translateError(new Error(event.message)) } : event)}\n`);
    }, controller.signal, () => {
      res.set({ "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" });
      res.flushHeaders();
      heartbeat = setInterval(() => { if (!res.destroyed && !res.writableNeedDrain) res.write("\n"); }, 1000);
    });
    if (!res.destroyed) res.end();
  } finally {
    clearInterval(heartbeat);
    res.off("close", abort);
    req.off("aborted", abort);
    req.socket.off("close", abort);
  }
});
