import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success, error, errorFromCause } from "@/lib/responseFormat";
import u from "@/utils";
import { translateMessage, validationOptions } from "@/lib/i18n";

export default Router().post("/", validateFields({
  directory: z.string().min(1).max(4096), mediaType: z.enum(["image", "video", "audio"]), taskId: z.uuid().optional(),
  nodeId: z.string().min(1).max(256).optional(), canvasPath: z.string().min(1).max(4096).optional(),
}), async (req, res) => {
  const { directory, mediaType, taskId, nodeId, canvasPath, ...request } = req.body;
  const parsed = (mediaType === "image" ? u.mediaSchemas.imageGenerationSchema : mediaType === "video" ? u.mediaSchemas.videoGenerationSchema : u.mediaSchemas.audioGenerationSchema).safeParse(request, validationOptions());
  if (!parsed.success) {
    res.status(400).json(error("参数错误", parsed.error.issues.map(issue => ({ ...issue, message: translateMessage(issue.message) })), 400));
    return;
  }
  const cwd = await u.workspace.resolveWorkspace(req, directory);
  const owner = u.multiTenant.requestIdentity(req);
  if (taskId) {
    if (req.aborted || res.destroyed) return;
    await u.mediaTasks.start(cwd, taskId, mediaType, parsed.data, { nodeId, canvasPath }, owner);
    res.set("Cache-Control", "no-store").json(success({ taskId }));
    return;
  }
  if (req.aborted || res.destroyed) return;
  const controller = new AbortController();
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const executionTaskId = u.multiTenant.modelGateway.enabled() ? randomUUID() : undefined;
  const close = () => { clearInterval(heartbeat); controller.abort(); };
  res.once("close", close);
  req.once("aborted", close);
  req.socket.once("close", close);
  try {
    if (executionTaskId) await u.mediaTasks.start(cwd, executionTaskId, mediaType, parsed.data, { nodeId, canvasPath }, owner);
    if (executionTaskId && controller.signal.aborted) { await u.mediaTasks.cancel(cwd, [executionTaskId], owner); return; }
    res.set({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" });
    res.flushHeaders();
    // ACT: JSON 允许前导空白，保活时保留现有 response.json() 契约。
    heartbeat = setInterval(() => { if (!res.destroyed && !res.writableEnded && !res.writableNeedDrain) res.write("\n"); }, 20000);
    const files = executionTaskId
      ? await u.mediaTasks.wait(cwd, executionTaskId, owner, controller.signal)
      : await u.mediaGeneration.generateMedia(cwd, mediaType, parsed.data, controller.signal);
    if (!res.destroyed) res.write(JSON.stringify(success(files)));
  } catch (err) {
    if (!res.destroyed) {
      const failure = errorFromCause(err);
      if (executionTaskId) failure.data = { ...(failure.data && typeof failure.data === "object" ? failure.data : {}), taskId: executionTaskId };
      if (res.headersSent) res.write(JSON.stringify(failure));
      else res.status(failure.code).json(failure);
    }
  } finally {
    clearInterval(heartbeat);
    res.off("close", close);
    req.off("aborted", close);
    req.socket.off("close", close);
    res.end();
  }
});
