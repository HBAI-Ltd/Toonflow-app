import { Router } from "express";
import { z } from "zod";
import type { CanvasInfo } from "@toonflow/tools-scaffold/runtime";
import type { AgentEvent } from "@/agent/runtime/types";
import { validateFields } from "@/lib/middleware";
import u from "@/utils";
import { translateError, translateMessage } from "@/lib/i18n";
import { thinkingLevels } from "@/lib/modelReasoning";
import { getAgentModelConfiguration } from "@/agent/runtime/model";

const inputSchema = z.object({
  prompt: z.string().trim(), directory: z.string().min(1),
  runId: z.uuid().optional(),
  expectedRunId: z.uuid().optional(),
  attachments: u.agent.agentAttachmentsSchema.optional(),
  mentions: u.agent.agentMentionsSchema.optional(),
  providerId: z.string().min(1), modelId: z.string().min(1),
  thinkingLevel: z.enum(thinkingLevels).optional(),
  sessionFile: z.string().regex(/^[\w-]+\.jsonl$/).optional(),
  resendFrom: z.string().min(1).max(128).optional(),
  streamingBehavior: z.enum(["steer", "followUp"]).optional(),
  canvas: z.strictObject({
    // 允许空 id：尚未打开画布时前端仍会带上画布上下文，Agent 可据此调用 addCanvas/getCanvas。
    id: z.string().max(256),
    tools: z.array(z.strictObject({
      nodeId: z.string().min(1).max(256),
      name: z.string().max(101).regex(/^node:[a-z][a-zA-Z0-9]*$/),
      nodeLabel: z.string().max(200).optional(),
      description: z.string().max(4000),
      parameters: z.record(z.string(), z.json()).refine(value => value.type === "object", "函数参数必须是 object JSON Schema"),
    })).max(1000),
  }).optional(),
});

export default Router().post("/", validateFields(inputSchema.shape), async (req, res) => {
  const { directory, canvas, runId = crypto.randomUUID(), ...options } = req.body as z.infer<typeof inputSchema>;
  if (options.streamingBehavior && !options.expectedRunId) {
    throw Object.assign(new Error("排队或引导需要指定当前任务标识，请刷新对话后重试"), { status: 400 });
  }
  const controller = new AbortController();
  let bridge: ReturnType<typeof u.canvas.createCanvasContext> | undefined;
  let questions: ReturnType<typeof u.question.createQuestionContext> | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let send: ((event: AgentEvent) => void) | undefined;
  let unregister = () => {};
  const finished = Promise.withResolvers<void>();
  const close = () => { clearInterval(heartbeat); bridge?.dispose(); questions?.dispose(); controller.abort(); };
  const stop = () => { controller.abort(new DOMException("已停止生成", "AbortError")); close(); };
  res.once("close", close);
  req.once("aborted", close);
  req.socket.once("close", close);
  try {
    if (req.aborted || res.destroyed || req.socket.destroyed) close();
    controller.signal.throwIfAborted();
    const workspace = u.workspace.resolveWorkspace(req, directory);
    const run = { runId, directory: workspace.then(cwd => cwd, () => undefined), abort: stop, finished: finished.promise };
    unregister = u.agent.registerAgentRun(run);
    const cwd = await workspace;
    controller.signal.throwIfAborted();
    await getAgentModelConfiguration(options.providerId, options.modelId, options.thinkingLevel);
    res.set({ "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" });
    res.flushHeaders();
    send = (event: AgentEvent) => {
      if (event.type === "error") event = { ...event, message: translateMessage(event.message) };
      if (event.type === "session") options.sessionFile = event.file;
      u.agent.trackAgentEvent(cwd, options.sessionFile, event);
      if (!res.destroyed && !res.writableEnded) res.write(`${JSON.stringify(event)}\n`);
    };
    bridge = canvas ? u.canvas.createCanvasContext(cwd, canvas as CanvasInfo, send, reason => controller.abort(reason)) : undefined;
    questions = u.question.createQuestionContext(cwd, send, stop);
    heartbeat = setInterval(() => {
      if (!res.destroyed && !res.writableEnded && !res.writableNeedDrain) res.write("\n");
    }, 20000);
    await u.agent.run({ ...options, runId, cwd, canvas: bridge?.context, question: questions.context, signal: controller.signal, onCancel: stop }, send);
    send({ type: "done" });
  } catch (error) {
    if (!res.headersSent) throw error;
    send?.({ type: "error", message: error instanceof Error ? translateError(error) : translateMessage("Agent 运行失败") });
  } finally {
    clearInterval(heartbeat);
    res.off("close", close);
    req.off("aborted", close);
    req.socket.off("close", close);
    bridge?.dispose();
    questions?.dispose();
    unregister();
    finished.resolve();
    if (res.headersSent && !res.writableEnded) res.end();
  }
});
