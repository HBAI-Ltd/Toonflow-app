import { randomUUID } from "node:crypto";
import { Router, json, type Request } from "express";
import { AgentCard, Message, Task, TaskState, Role, type Artifact } from "@a2a-js/sdk";
import { AgentEvent, DefaultRequestHandler, InMemoryTaskStore, type AgentExecutor, type ExecutionEventBus } from "@a2a-js/sdk/server";
import { jsonRpcHandler } from "@a2a-js/sdk/server/express";
import { ClientFactory, DefaultAgentCardResolver, JsonRpcTransportFactory, RestTransportFactory } from "@a2a-js/sdk/client";
import { RequestMalformedError, TaskNotCancelableError } from "@a2a-js/sdk/errors";
import { teamSchema, type TeamManifest } from "./runtime";

export { AgentCard, Artifact, Message, Task, TaskState, Role, SendMessageRequest, GetTaskRequest, CancelTaskRequest } from "@a2a-js/sdk";

export type TeamA2aEvent =
  | { type: "status"; text: string }
  | { type: "artifact"; artifact: Artifact; append?: boolean; lastChunk?: boolean };

export type TeamA2aRequest = {
  taskId: string;
  contextId: string;
  message: Message;
  task?: Task;
  userId: string;
  signal: AbortSignal;
  emit(event: TeamA2aEvent): void;
};

export type TeamA2aResult = { status: "completed" | "inputRequired"; text: string; artifacts?: Artifact[] };

export function createTeamAgentCard(manifest: TeamManifest, endpointUrl: string): AgentCard {
  const team = teamSchema.parse(manifest);
  const endpoint = new URL(endpointUrl);
  if (!["http:", "https:"].includes(endpoint.protocol) || endpoint.username || endpoint.password || endpoint.hash) throw new Error("A2A 地址必须是无内嵌凭据的 HTTP(S) 地址");
  return AgentCard.fromJSON({
    name: team.displayName,
    description: team.description,
    version: team.version,
    supportedInterfaces: [{ url: endpoint.href.replace(/\/$/, ""), protocolBinding: "JSONRPC", protocolVersion: "1.0" }],
    ...(team.github ? { provider: { organization: team.author, url: team.github }, documentationUrl: team.github } : {}),
    capabilities: { streaming: true, pushNotifications: false, extendedAgentCard: false },
    securitySchemes: { bearer: { httpAuthSecurityScheme: { scheme: "bearer" } } },
    securityRequirements: [{ schemes: { bearer: [] } }],
    defaultInputModes: ["text/plain"],
    defaultOutputModes: ["text/plain", "application/json"],
    // 团队能力与团队私有 SKILL.md 是不同资源，Card 不发布成员提示词或私有资料。
    skills: [{ id: team.name, name: team.displayName, description: team.description, tags: ["toonflow", "team"] }],
  });
}

export function createTeamA2aRouter(options: {
  card: AgentCard;
  execute(request: TeamA2aRequest): Promise<TeamA2aResult>;
  authenticate(request: Request): string | undefined | Promise<string | undefined>;
  onCancel?(taskId: string): void | Promise<void>;
}) {
  const router = Router();
  const identities = new WeakMap<Request, string>();
  const active = new Map<string, { userId: string; controller: AbortController; done: Promise<void> }>();
  const paused = new Map<string, string>();
  const message = (taskId: string, contextId: string, text: string) => Message.fromJSON({
    messageId: randomUUID(), taskId, contextId, role: Role.ROLE_AGENT, parts: [{ text, mediaType: "text/plain" }],
  });
  const status = (bus: ExecutionEventBus, taskId: string, contextId: string, state: TaskState, text: string) => {
    bus.publish(AgentEvent.statusUpdate({ taskId, contextId, status: { state, message: message(taskId, contextId, text), timestamp: new Date().toISOString() }, metadata: undefined }));
  };
  const executor: AgentExecutor = {
    async execute(context, bus) {
      const { taskId, contextId } = context;
      const userId = context.context.user?.userName;
      if (!userId) throw new Error("A2A 请求缺少认证身份");
      if (active.has(taskId)) throw new RequestMalformedError("同一任务正在执行，请等待当前执行结束");
      const controller = new AbortController();
      let finish!: () => void;
      const done = new Promise<void>(resolve => { finish = resolve; });
      active.set(taskId, { userId, controller, done });
      paused.delete(taskId);
      const task = context.task ? structuredClone(context.task) : Task.fromJSON({ id: taskId, contextId, history: [Message.toJSON(context.userMessage)] });
      task.status = { state: TaskState.TASK_STATE_WORKING, message: undefined, timestamp: new Date().toISOString() };
      bus.publish(AgentEvent.task(task));
      const emit = (event: TeamA2aEvent) => {
        controller.signal.throwIfAborted();
        if (event.type === "status") status(bus, taskId, contextId, TaskState.TASK_STATE_WORKING, event.text);
        else bus.publish(AgentEvent.artifactUpdate({ taskId, contextId, artifact: event.artifact, append: event.append ?? false, lastChunk: event.lastChunk ?? true, metadata: undefined }));
      };
      try {
        const result = await options.execute({ taskId, contextId, message: context.userMessage, task: context.task, userId, signal: controller.signal, emit });
        controller.signal.throwIfAborted();
        for (const artifact of result.artifacts ?? []) emit({ type: "artifact", artifact });
        if (result.status === "inputRequired") paused.set(taskId, contextId);
        status(bus, taskId, contextId, result.status === "inputRequired" ? TaskState.TASK_STATE_INPUT_REQUIRED : TaskState.TASK_STATE_COMPLETED, result.text);
      } catch (error) {
        status(bus, taskId, contextId, controller.signal.aborted ? TaskState.TASK_STATE_CANCELED : TaskState.TASK_STATE_FAILED, error instanceof Error ? error.message : "团队执行失败");
      } finally {
        active.delete(taskId);
        finish();
      }
    },
    async cancelTask(taskId, bus) {
      const running = active.get(taskId);
      if (!running) {
        const contextId = paused.get(taskId);
        if (!contextId) throw new TaskNotCancelableError("任务当前没有正在执行的工作");
        status(bus, taskId, contextId, TaskState.TASK_STATE_CANCELED, "任务已取消");
        paused.delete(taskId);
        return;
      }
      running.controller.abort(new Error("任务已取消"));
      // 等待宿主清理并发成员后，execute 才发布 CANCELED，不能把取消请求冒充执行已停止。
      await running.done;
    },
  };
  // ACT: SDK 的任务存储和 owner 隔离复用内存实现；服务重启后不恢复任务。
  // INPUT_REQUIRED 结束当前流，下一条携带 taskId 的消息从 SDK 存储重新进入 execute。
  const handler = new DefaultRequestHandler(options.card, new InMemoryTaskStore(), executor, undefined, undefined, undefined, undefined, undefined, { keepBusAliveStates: [] });
  const cancelTask = handler.cancelTask.bind(handler);
  handler.cancelTask = async (request, context) => {
    const task = await cancelTask(request, context);
    paused.delete(task.id);
    await options.onCancel?.(task.id);
    return task;
  };
  // 拒绝同一 owner 对运行中任务重复提交，避免 SDK 将重复执行异常记成原任务失败。
  const pending = new Set<string>();
  function begin(taskId: string | undefined, userId: string | undefined) {
    if (!taskId) return;
    const key = JSON.stringify([userId, taskId]);
    if (pending.has(key) || active.get(taskId)?.userId === userId) throw new RequestMalformedError("同一任务正在执行，请等待当前执行结束");
    pending.add(key);
    return key;
  }
  const sendMessage = handler.sendMessage.bind(handler);
  handler.sendMessage = async (request, context) => {
    const key = begin(request.message?.taskId, context.user?.userName);
    try { return await sendMessage(request, context); }
    finally { if (key) pending.delete(key); }
  };
  const sendMessageStream = handler.sendMessageStream.bind(handler);
  handler.sendMessageStream = async function* (request, context) {
    const key = begin(request.message?.taskId, context.user?.userName);
    try { yield* sendMessageStream(request, context); }
    finally { if (key) pending.delete(key); }
  };
  // SDK 1.2 的 Card middleware 直接 stringify 内部 oneof；这里使用官方 ProtoJSON 序列化。
  router.get("/.well-known/agent-card.json", async (_request, response, next) => {
    try { response.json(AgentCard.toJSON(await handler.getAgentCard())); }
    catch (error) { next(error); }
  });
  router.use(async (request, response, next) => {
    try {
      const userId = await options.authenticate(request);
      if (!userId) {
        response.set("WWW-Authenticate", "Bearer").status(401).json({ error: "unauthorized" });
        return;
      }
      identities.set(request, userId);
      next();
    } catch (error) { next(error); }
  });
  router.use(json({ limit: "2mb" }));
  router.use(jsonRpcHandler({
    requestHandler: handler,
    userBuilder: async request => ({ isAuthenticated: true, userName: identities.get(request)! }),
  }));
  return router;
}

export async function createTeamA2aClient(options: { url: string; token?: string; fetch?: typeof fetch }) {
  const cardUrl = new URL(options.url);
  if (!["http:", "https:"].includes(cardUrl.protocol) || cardUrl.username || cardUrl.password || cardUrl.hash) throw new Error("Agent Card 地址必须是无内嵌凭据的 HTTP(S) 地址");
  const originalFetch = options.fetch ?? globalThis.fetch;
  const fetchImpl = ((input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = new URL(input instanceof globalThis.Request ? input.url : String(input));
    if (options.token && url.origin !== cardUrl.origin) throw new Error("不能将 A2A 密钥转发给 Agent Card 中的其他来源");
    const headers = new Headers(input instanceof globalThis.Request ? input.headers : undefined);
    new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
    if (options.token) headers.set("Authorization", `Bearer ${options.token}`);
    return originalFetch(input, { ...init, headers, redirect: "error" });
  }) as typeof fetch;
  const factory = new ClientFactory({
    transports: [new JsonRpcTransportFactory({ fetchImpl }), new RestTransportFactory({ fetchImpl })],
    cardResolver: new DefaultAgentCardResolver({ fetchImpl }),
  });
  return factory.createFromUrl(cardUrl.href, "");
}
