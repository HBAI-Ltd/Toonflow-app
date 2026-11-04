import { Router } from "express";
import { z } from "zod";
import type { Context, Message } from "@earendil-works/pi-ai";
import type { ModelFinalization, ModelOutcome, ModelRunFailure } from "@toonflow/multi-tenant-gateway/types";
import { validateFields } from "@/lib/middleware";
import u from "@/utils";
import { translateError, translateMessage, validationOptions } from "@/lib/i18n";

const textPart = z.object({ type: z.literal("text"), text: z.string(), textSignature: z.string().optional() });
const imagePart = z.object({ type: z.literal("image"), data: z.string(), mimeType: z.string().startsWith("image/") });
const messageSchema: z.ZodType<Message> = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("user"), content: z.union([z.string(), z.array(z.union([textPart, imagePart])).max(1000)]),
    timestamp: z.number().nonnegative(),
  }),
  z.looseObject({
    role: z.literal("assistant"),
    content: z.array(z.discriminatedUnion("type", [
      textPart,
      z.object({ type: z.literal("thinking"), thinking: z.string(), thinkingSignature: z.string().optional(), redacted: z.boolean().optional() }),
      z.object({
        type: z.literal("toolCall"), id: z.string().min(1), name: z.string().min(1), arguments: z.record(z.string(), z.json()),
        thoughtSignature: z.string().optional(), namespace: z.string().optional(),
      }),
    ])).max(1000),
    api: z.string().min(1), provider: z.string().min(1), model: z.string().min(1), timestamp: z.number().nonnegative(),
    stopReason: z.enum(["pending", "stop", "length", "toolUse", "error", "aborted", "deferred"]),
    usage: z.looseObject({
      input: z.number().nonnegative(), output: z.number().nonnegative(), cacheRead: z.number().nonnegative(), cacheWrite: z.number().nonnegative(),
      totalTokens: z.number().nonnegative(),
      cost: z.object({ input: z.number(), output: z.number(), cacheRead: z.number(), cacheWrite: z.number(), total: z.number() }),
    }),
  }),
  z.looseObject({
    role: z.literal("toolResult"), toolCallId: z.string().min(1), toolName: z.string().min(1),
    content: z.array(z.union([textPart, imagePart])).max(1000), isError: z.boolean(), timestamp: z.number().nonnegative(),
  }),
]);

const contextSchema: z.ZodType<Context> = z.object({
  systemPrompt: z.string().max(100000).optional(),
  messages: z.array(messageSchema).min(1).max(2000),
  tools: z.array(z.object({
    name: z.string().regex(/^[a-z][a-zA-Z0-9]{0,63}$/),
    description: z.string().min(1).max(10000),
    parameters: z.record(z.string(), z.json()).refine(value => value.type === "object" && JSON.stringify(value).length <= 100000, "工具参数必须是 JSON 对象结构，且不超过 100 KB"),
    constrainedSampling: z.union([
      z.literal(false),
      z.object({ type: z.literal("json_schema"), strict: z.enum(["prefer", "require"]) }),
      z.object({ type: z.literal("grammar"), variants: z.object({ openai_lark: z.string().optional(), openai_regex: z.string().optional() }) }),
    ]).optional(),
  })).max(32).refine(tools => new Set(tools.map(tool => tool.name)).size === tools.length, "工具名称不能重复").optional(),
}).refine(context => Buffer.byteLength(JSON.stringify(context)) <= 8000000, "模型上下文不能超过 8 MB");

const inputSchema = z.object({
  providerId: z.string().min(1), modelId: z.string().min(1),
  requestId: z.uuid().optional(),
  context: contextSchema,
  directory: z.string().min(1).max(4096).optional(),
  references: z.array(u.ai.aiReferenceSchema).max(32).optional(),
});

export default Router().post("/", validateFields(inputSchema.shape), async (req, res) => {
  const input = inputSchema.parse(req.body, validationOptions());
  const configured = await u.ai.getConfiguredModel(input.providerId, input.modelId);
  const controller = new AbortController();
  const identity = u.multiTenant.requestIdentity(req);
  let chargeId: string | undefined;
  let billing: ModelFinalization | undefined;
  let stream: ReturnType<typeof u.ai.streamAi> | undefined;
  let hasOutput = false;
  let clientClosed = false;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  const close = () => {
    clientClosed = true;
    clearInterval(heartbeat);
    // ACT: 付费调用提交后，断开只能停止输出；后端继续获取终态用量，防止已交付内容因断连免费。
    if (!chargeId || !stream?.upstreamSubmitted()) controller.abort();
  };
  const write = (chunk: string) => {
    if (clientClosed || res.destroyed || res.writableEnded) return;
    try { res.write(chunk); } catch { close(); }
  };
  const send = (event: object) => write(`data: ${JSON.stringify(event)}\n\n`);
  res.once("close", close);
  req.once("aborted", close);
  req.socket.once("close", close);
  if (req.aborted || res.destroyed || req.socket.destroyed) close();
  async function execute(reservedId?: string) {
    chargeId = reservedId;
    controller.signal.throwIfAborted();
    if (configured.route) deadline = setTimeout(() => controller.abort(new Error("模型请求失败，请稍后重试")), 5 * 60 * 1000);
    const directory = input.references?.some(item => item.dataType !== "STRING")
      ? await u.workspace.resolveWorkspace(req, input.directory ?? "") : undefined;
    const references = await u.ai.readAiReferences(directory, input.references ?? [], controller.signal, configured.provider);
    controller.signal.throwIfAborted();
    res.set({ "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" });
    res.flushHeaders();
    controller.signal.throwIfAborted();
    stream = u.ai.streamAi(configured, input.context, controller.signal, references);
    heartbeat = setInterval(() => {
      if (!res.writableNeedDrain) write(": keepalive\n\n");
    }, 20000);
    for await (const event of stream) {
      if (event.type === "text_delta" || event.type === "thinking_delta") {
        if (event.delta) hasOutput = true;
        send({ type: event.type === "text_delta" ? "text" : "reasoning", delta: event.delta });
      } else if (event.type === "toolcall_start" || event.type === "toolcall_delta" || event.type === "toolcall_end") {
        hasOutput = true;
      }
    }
    const message = await stream.result();
    hasOutput ||= message.content.some(part => part.type === "toolCall" || part.type === "text" && !!part.text || part.type === "thinking" && !!part.thinking);
    const usage = configured.route ? await stream.billingUsage() : undefined;
    return { value: { message, usage }, outcome: usage ? { kind: "usage", usage } as const : { kind: "unknown" } as const };
  }
  const failure = (): ModelOutcome => !stream?.upstreamSubmitted() ? { kind: "notSubmitted" }
    : stream.upstreamRejected() ? { kind: "rejected", delivered: hasOutput } : { kind: "unknown" };
  try {
    controller.signal.throwIfAborted();
    const result = configured.execution ? await u.multiTenant.modelGateway.run({
      execution: configured.execution,
      context: { actor: identity ?? null, requestId: input.requestId ?? crypto.randomUUID(), payload: input },
      execute, failure,
    }) : { ...await execute(), billing: undefined };
    billing = result.billing;
    const { message, usage } = result.value;
    if (billing?.status === "held") throw new Error("模型账务处理失败，请联系管理员");
    if (message.stopReason === "error" || message.stopReason === "aborted" || billing?.status === "released") {
      throw new Error(message.errorMessage || "模型请求失败");
    }
    const publicMessage = usage ? { ...message, usage: { ...message.usage, ...usage,
      totalTokens: usage.input + usage.output + usage.cacheRead + usage.cacheWrite } } : message;
    send({ type: "done", message: { ...u.ai.publicAiMessage(configured, publicMessage, Boolean(usage)), ...(billing ? { billing } : {}) } });
  } catch (cause) {
    if (!res.headersSent) throw cause;
    const receipt = (cause as ModelRunFailure | null)?.billing ?? billing;
    send({ type: "error", message: configured.route ? translateMessage("模型请求失败，请稍后重试") : cause instanceof Error ? translateError(cause) : translateMessage("模型请求失败"),
      ...(receipt ? { billing: receipt } : {}) });
  } finally {
    clearInterval(heartbeat);
    clearTimeout(deadline);
    controller.abort();
    res.off("close", close);
    req.off("aborted", close);
    req.socket.off("close", close);
    if (!clientClosed && res.headersSent && !res.destroyed && !res.writableEnded) res.end();
  }
});
