import { Router } from "express";
import { z } from "zod";
import { translateError } from "@/lib/i18n";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

const fields = {
  directory: z.string().min(1).max(4096),
  requestId: z.uuid(),
  source: z.string().min(1).max(4096),
  output: z.string().min(1).max(4096),
  cancel: z.boolean().optional(),
};
type Processor<T> = (root: string, source: string, output: string, options: T,
  onProgress: (completed: number, total: number) => void, signal: AbortSignal) => Promise<void>;

export function mediaModelRoute<T>(optionsSchema: z.ZodType<T> | undefined, processMedia: Processor<T>) {
  const requests = new Map<string, { controller: AbortController; finished: Promise<void> }>();
  return Router().post("/", validateFields(optionsSchema ? { ...fields, options: optionsSchema } : fields), async (req, res) => {
    u.mcpControl.assertAppRequest(req);
    const { directory, requestId, source, output, cancel } = req.body;
    const root = await u.workspace.resolveWorkspace(req, directory);
    const key = root + "\0" + requestId;
    const active = requests.get(key);
    if (cancel) {
      active?.controller.abort();
      await active?.finished;
      return res.json(success());
    }
    if (active) throw Object.assign(new Error("请求已在执行"), { status: 409 });
    const controller = new AbortController();
    const finished = Promise.withResolvers<void>();
    requests.set(key, { controller, finished: finished.promise });
    const abort = () => controller.abort();
    res.once("close", abort);
    req.once("aborted", abort);
    req.socket.once("close", abort);
    const send = (type: string, data: object) => {
      if (!res.destroyed && !res.writableEnded) res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
    };
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    try {
      if (req.aborted || res.destroyed || req.socket.destroyed) return;
      res.set({ "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" });
      res.flushHeaders();
      heartbeat = setInterval(() => { if (!res.destroyed && !res.writableNeedDrain) res.write(": keepalive\n\n"); }, 10000);
      let previous = -1;
      let lastSent = 0;
      await processMedia(root, source, output, req.body.options, (completed, total) => {
        if (!total) return;
        const percent = Math.min(99, Math.floor(completed * 100 / total));
        const now = performance.now();
        if (percent <= previous || (previous >= 0 && completed < total && now - lastSent < 250) || res.writableNeedDrain) return;
        previous = percent;
        lastSent = now;
        send("progress", { completed, total });
      }, controller.signal);
      send("done", {});
    } catch (error) {
      if (!res.headersSent) throw error;
      send("error", { message: translateError(error) });
    } finally {
      clearInterval(heartbeat);
      res.off("close", abort);
      req.off("aborted", abort);
      req.socket.off("close", abort);
      requests.delete(key);
      finished.resolve();
      if (res.headersSent && !res.writableEnded) res.end();
    }
  });
}
