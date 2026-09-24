import { Router } from "express";
import { z } from "zod";
import type { BrowserFfmpegRequest } from "@toonflow/ffmpeg";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

const callSchema = z.object({
  method: z.string().min(1).max(64), args: z.array(z.json()).max(128),
  undefinedArgs: z.array(z.number().int().min(0).max(127)).max(128).optional(),
}).strict();
const inputSchema = z.object({
  requestId: z.uuid(),
  directory: z.string().min(1).max(4096),
  options: z.object({
    source: z.string().min(1).max(4096).optional(),
    cwd: z.string().min(1).max(4096).optional(),
    niceness: z.number().int().min(-20).max(20).optional(),
    priority: z.number().int().min(-20).max(20).optional(),
    stdoutLines: z.number().int().nonnegative().optional(),
    timeout: z.number().nonnegative().optional(),
  }).strict(),
  calls: z.array(callSchema).max(2048),
  operation: callSchema,
});
// ACT: Bun 的静默 SSE 不保证触发断开事件；显式取消复用本接口和单进程会话状态。
const requests = new Map<string, AbortController>();

export default Router().post("/", validateFields(inputSchema.shape), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const input = inputSchema.parse(req.body) as BrowserFfmpegRequest;
  const cwd = await u.workspace.resolveWorkspace(req, input.directory);
  const requestKey = `${cwd}\0${input.requestId}`;
  if (input.operation.method === "cancel") {
    requests.get(requestKey)?.abort();
    res.json(success());
    return;
  }
  const controller = new AbortController();
  if (input.operation.method !== "prepare") {
    if (requests.has(requestKey)) throw Object.assign(new Error("FFmpeg 请求已在执行"), { status: 409 });
    requests.set(requestKey, controller);
  }
  const close = () => controller.abort();
  res.once("close", close);
  req.once("aborted", close);
  req.socket.once("close", close);
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  try {
    const factory = await u.ffmpeg.createWorkspaceFfmpeg(cwd, controller.signal);
    if (input.operation.method === "prepare") {
      res.json(success());
      return;
    }
    res.set({ "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" });
    res.flushHeaders();
    heartbeat = setInterval(() => { if (!res.destroyed) res.write(": keepalive\n\n"); }, 1000);
    await u.ffmpeg.executeRemoteFfmpeg(factory, input, event => {
      if (!res.destroyed) res.write(`data: ${JSON.stringify(event)}\n\n`);
    }, controller.signal);
    res.end();
  } finally {
    if (requests.get(requestKey) === controller) requests.delete(requestKey);
    clearInterval(heartbeat);
    res.off("close", close);
    req.off("aborted", close);
    req.socket.off("close", close);
  }
});
