import { Router } from "express";
import { once } from "node:events";
import { translateError } from "@/lib/i18n";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().get("/", async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  res.vary("Accept");
  if (req.get("Accept") !== "text/event-stream") {
    res.set("Cache-Control", "no-store").json(success(await u.localModels.getStatus()));
    return;
  }
  const controller = new AbortController();
  const close = () => controller.abort();
  res.once("close", close);
  req.socket.once("close", close);
  const changes = u.localModels.modelChanges(controller.signal);
  let lastStatus: string | undefined;
  const send = async (event: string, data: unknown) => {
    if (res.destroyed || controller.signal.aborted) return;
    const payload = JSON.stringify(data);
    if (event === "status" && payload === lastStatus) return;
    lastStatus = event === "status" ? payload : undefined;
    if (!res.write(`event: ${event}\ndata: ${payload}\n\n`)) {
      await once(res, "drain", { signal: controller.signal });
    }
  };
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  try {
    res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" });
    res.flushHeaders();
    heartbeat = setInterval(() => { if (!res.destroyed && !res.writableNeedDrain) res.write(": keepalive\n\n"); }, 10000);
    await send("status", await u.localModels.getStatus());
    for await (const [id, progress] of changes) {
      if (progress) await send("progress", { id, progress });
      else await send("status", await u.localModels.getStatus());
    }
  } catch (error) {
    if (!controller.signal.aborted) {
      if (!res.headersSent) throw error;
      await send("error", { message: translateError(error) });
    }
  } finally {
    clearInterval(heartbeat);
    controller.abort();
    await changes.return?.();
    res.off("close", close);
    req.socket.off("close", close);
    if (res.headersSent && !res.writableEnded) res.end();
  }
});
