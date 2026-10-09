import { dirname, join } from "node:path";
import { createAgentSession, DefaultResourceLoader, SessionManager, SettingsManager } from "@earendil-works/pi-coding-agent";
import type { AgentSession, CreateAgentSessionOptions, ToolDefinition } from "@earendil-works/pi-coding-agent";
import type { QuestionContext } from "@toonflow/tools-scaffold/runtime";
import { createAgentToolContext } from "@/agent/tools";
import { createAgentModel } from "@/agent/runtime/model";
import { getToolResultText } from "@/agent/runtime/sessions";
import { createQuestionContext, answerQuestion } from "@/agent/bridge/question";
import { listTools, loadTool, validateToolConfig } from "@/utils/plugins/tools";
import { browserRuntime } from "@/utils/browser";
import conf from "@/utils/conf";
import type { SingleAgentEvent, SingleAgentResult, SingleAgentStatus, SingleAgentToolDescriptor, SingleAgentToolReference, SingleAgentToolResult } from "./types";

type ClientCall = {
  finish(result: SingleAgentToolResult | Error): void;
  onUpdate?: Parameters<ToolDefinition["execute"]>[3];
};
type RunState = {
  id: string;
  controller: AbortController;
  session?: AgentSession;
  status: SingleAgentStatus;
  pauseRequested: boolean;
  activeActions: number;
  gate?: ReturnType<typeof Promise.withResolvers<void>>;
  finished: ReturnType<typeof Promise.withResolvers<void>>;
  send(event: SingleAgentEvent): void;
  questions?: ReturnType<typeof createQuestionContext>;
  questionIds: Set<string>;
  clientCalls: Map<string, ClientCall>;
};
type SingleSession = {
  id: string;
  cwd: string;
  workspaceAvailable: boolean;
  history: SessionManager;
  systemPrompt: string;
  tools: ToolDefinition[];
  active?: RunState;
  closed: boolean;
  closing?: Promise<void>;
};

// ACT: 临时对话只保存在当前进程内，关闭后销毁；多进程部署需共享会话及回调通道。
const sessions = new Map<string, SingleSession>();

function getSession(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session || session.closed) throw Object.assign(new Error("临时对话不存在或已关闭"), { status: 404 });
  return session;
}

function setStatus(active: RunState, status: SingleAgentStatus) {
  if (active.status === status) return;
  active.status = status;
  active.send({ type: "status", status });
}

function finishAction(active: RunState) {
  active.activeActions--;
  if (active.pauseRequested && !active.activeActions && !active.controller.signal.aborted) setStatus(active, "paused");
}

async function waitForResume(active: RunState) {
  const signal = active.controller.signal;
  signal.throwIfAborted();
  if (!active.pauseRequested) return;
  if (!active.activeActions) setStatus(active, "paused");
  active.gate ??= Promise.withResolvers<void>();
  const gate = active.gate;
  const abort = () => gate.reject(signal.reason);
  signal.addEventListener("abort", abort, { once: true });
  try { await gate.promise; signal.throwIfAborted(); }
  finally { signal.removeEventListener("abort", abort); }
}

function createClientTool(session: SingleSession, descriptor: SingleAgentToolDescriptor): ToolDefinition {
  return {
    ...descriptor,
    label: descriptor.label || descriptor.name,
    executionMode: descriptor.executionMode ?? "sequential",
    async execute(toolCallId, args, signal, onUpdate) {
      const active = session.active;
      if (!active || session.closed) throw new Error("临时对话已结束");
      signal?.throwIfAborted();
      const callId = crypto.randomUUID();
      return new Promise<SingleAgentToolResult>((resolve, reject) => {
        const finish = (result: SingleAgentToolResult | Error) => {
          if (!active.clientCalls.delete(callId)) return;
          signal?.removeEventListener("abort", abort);
          if (result instanceof Error) reject(result);
          else resolve(result);
        };
        const abort = () => finish(new Error("工具调用已取消"));
        active.clientCalls.set(callId, { finish, onUpdate });
        signal?.addEventListener("abort", abort, { once: true });
        active.send({ type: "clientTool", callId, toolCallId, name: descriptor.name, args: args as Record<string, unknown> });
      });
    },
  };
}

export async function create(options: {
  tools: (SingleAgentToolReference | SingleAgentToolDescriptor)[];
  directory?: string;
  systemPrompt?: string;
}, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const id = crypto.randomUUID();
  const cwd = options.directory ?? join(dirname(conf.path), "singleAgent", id);
  const session: SingleSession = {
    id, cwd, workspaceAvailable: !!options.directory, history: SessionManager.inMemory(cwd),
    systemPrompt: options.systemPrompt ?? "", tools: [], closed: false,
  };
  sessions.set(id, session);
  try {
    const question: QuestionContext = { ask: (...args) => {
      const active = session.active;
      if (!active?.questions) throw new Error("临时对话未在运行");
      return active.questions.context.ask(...args);
    } };
    const context = createAgentToolContext(cwd, {}, undefined, question, session.workspaceAvailable);
    const available = new Map((await listTools()).map(tool => [tool.name, tool]));
    const names = new Set<string>();
    for (const reference of options.tools) {
      signal?.throwIfAborted();
      let definitions: ToolDefinition[];
      if (typeof reference !== "string" && "name" in reference) definitions = [createClientTool(session, reference)];
      else {
        const pluginName = typeof reference === "string" ? reference : reference.plugin;
        const info = available.get(pluginName);
        if (!info?.enabled) throw Object.assign(new Error(`工具插件 ${pluginName} 未安装或未启用`), { status: 400 });
        if (info.loadError) throw new Error(info.loadError);
        const { plugin, metadata } = await loadTool(pluginName);
        definitions = await plugin.createTools({ ...context, config: validateToolConfig(plugin, info.config) });
        const selected = typeof reference === "string" ? undefined : reference.names;
        if (selected?.some(name => !definitions.some(tool => tool.name === name))) throw Object.assign(new Error(`插件 ${pluginName} 未提供所选工具`), { status: 400 });
        definitions = definitions.filter(tool => !selected || selected.includes(tool.name)).map(tool => ({
          ...tool, promptGuidelines: [...(metadata.prompt ? [metadata.prompt] : []), ...(tool.promptGuidelines ?? [])],
        }));
      }
      for (const tool of definitions) {
        if (!tool.name || typeof tool.execute !== "function") throw new Error("插件返回了无效的工具");
        if (names.has(tool.name)) throw Object.assign(new Error(`工具名称重复：${tool.name}`), { status: 400 });
        names.add(tool.name);
        session.tools.push(tool);
      }
    }
    signal?.throwIfAborted();
    return { sessionId: id };
  } catch (error) {
    await close(id);
    throw error;
  }
}

export async function run(options: {
  sessionId: string;
  runId: string;
  prompt: string;
  providerId: string;
  modelId: string;
  thinkingLevel?: CreateAgentSessionOptions["thinkingLevel"];
}, send: (event: SingleAgentEvent) => void, signal?: AbortSignal, onStart?: () => void) {
  const state = getSession(options.sessionId);
  if (state.active) throw Object.assign(new Error("此对话正在运行，请等待当前回复完成"), { status: 409 });
  const active: RunState = {
    id: options.runId, controller: new AbortController(), status: "idle", pauseRequested: false, activeActions: 0,
    finished: Promise.withResolvers<void>(), send, questionIds: new Set(), clientCalls: new Map(),
  };
  state.active = active;
  const abort = () => { active.controller.abort(signal?.reason); };
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) abort();
  const stopSdk = () => { void active.session?.abort(); };
  active.controller.signal.addEventListener("abort", stopSdk, { once: true });
  const toolResults: SingleAgentResult["toolResults"] = [];
  try {
    onStart?.();
    setStatus(active, "running");
    active.controller.signal.throwIfAborted();
    active.questions = createQuestionContext(state.id, event => {
      active.questionIds.add(event.callId);
      send(event);
    }, () => active.controller.abort(new Error("用户取消了提问")));
    const tools = state.tools.map(tool => ({
      ...tool,
      async execute(...args: Parameters<ToolDefinition["execute"]>) {
        await waitForResume(active);
        active.activeActions++;
        const signal = args[2] ? AbortSignal.any([args[2], active.controller.signal]) : active.controller.signal;
        try { return await tool.execute(args[0], args[1], signal, args[3], args[4]); }
        finally { finishAction(active); }
      },
    }));
    const thinkingLevel = options.thinkingLevel ?? "off";
    const { runtime } = await createAgentModel(options.providerId, options.modelId, thinkingLevel);
    active.controller.signal.throwIfAborted();
    const settingsManager = SettingsManager.inMemory({ compaction: { enabled: false }, retry: { enabled: false } });
    const agentDir = join(state.cwd, ".agent");
    const systemPrompt = [...new Set([state.systemPrompt || "请根据用户要求完成当前任务，按需使用提供的工具。", ...tools.flatMap(tool => tool.promptGuidelines ?? [])])].filter(Boolean).join("\n\n");
    const resourceLoader = new DefaultResourceLoader({
      cwd: state.cwd, agentDir, settingsManager,
      noExtensions: true, noSkills: true, noPromptTemplates: true, noThemes: true, noContextFiles: true,
      systemPrompt: "", systemPromptOverride: () => systemPrompt, appendSystemPrompt: [],
    });
    await resourceLoader.reload();
    active.controller.signal.throwIfAborted();
    const { session } = await createAgentSession({
      cwd: state.cwd, agentDir, modelRuntime: runtime, model: runtime.getModel(options.providerId, options.modelId),
      thinkingLevel, sessionManager: state.history, settingsManager, resourceLoader,
      tools: tools.map(tool => tool.name), customTools: tools,
    });
    active.session = session;
    active.controller.signal.throwIfAborted();
    const streamFunction = session.agent.streamFunction;
    session.agent.streamFunction = async (...args) => {
      await waitForResume(active);
      active.activeActions++;
      try {
        const stream = await streamFunction(...args);
        void stream.result().then(() => finishAction(active), () => finishAction(active));
        return stream;
      } catch (error) { finishAction(active); throw error; }
    };
    let messageIndex = 0;
    const toolBlocks = new Map<string, string>();
    session.subscribe(event => {
      if (event.type === "message_start" && event.message.role === "assistant") messageIndex++;
      if (event.type === "message_update") {
        const update = event.assistantMessageEvent;
        if ("contentIndex" in update) {
          const blockId = `${messageIndex}:${update.contentIndex}`;
          if (update.type === "text_start" || update.type === "thinking_start") send({ type: update.type === "text_start" ? "text" : "thinking", blockId, content: "" });
          if (update.type === "text_delta" || update.type === "thinking_delta") send({ type: update.type === "text_delta" ? "text" : "thinking", blockId, delta: update.delta });
          if (update.type === "text_end" || update.type === "thinking_end") send({ type: update.type === "text_end" ? "text" : "thinking", blockId, content: update.content, done: true });
          if (update.type === "toolcall_start" || update.type === "toolcall_end") {
            const part = update.type === "toolcall_end" ? update.toolCall : update.partial.content[update.contentIndex];
            if (part?.type === "toolCall") {
              toolBlocks.set(part.id, blockId);
              send({ type: "tool", blockId, tool: { id: part.id, name: part.name, args: part.arguments, status: "running" } });
            }
          }
        }
      }
      if (event.type === "message_end" && event.message.role === "assistant") event.message.content.forEach((part, index) => {
        const blockId = `${messageIndex}:${index}`;
        if (part.type === "text" || part.type === "thinking") send({ type: part.type, blockId, content: part.type === "text" ? part.text : part.thinking, done: true });
        if (part.type === "toolCall") {
          toolBlocks.set(part.id, blockId);
          send({ type: "tool", blockId, tool: { id: part.id, name: part.name, args: part.arguments, status: "running" } });
        }
      });
      if (event.type === "tool_execution_start" || event.type === "tool_execution_end" || event.type === "tool_execution_update") {
        const result = event.type === "tool_execution_end" ? event.result : event.type === "tool_execution_update" ? event.partialResult : undefined;
        send({ type: "tool", blockId: toolBlocks.get(event.toolCallId) ?? event.toolCallId, tool: {
          id: event.toolCallId, name: event.toolName, status: event.type === "tool_execution_end" ? active.controller.signal.aborted ? "interrupted" : event.isError ? "error" : "success" : "running",
          ...(event.type === "tool_execution_start" ? { args: event.args } : { result: getToolResultText(result!.content) }),
        } });
        if (event.type === "tool_execution_end") {
          const result = { id: event.toolCallId, name: event.toolName, result: event.result };
          toolResults.push(result);
          send({ type: "toolResult", ...result });
        }
      }
    });
    await session.prompt(options.prompt, { expandPromptTemplates: false });
    active.controller.signal.throwIfAborted();
    const reply = session.messages.findLast(message => message.role === "assistant");
    if (!reply || reply.role !== "assistant") throw new Error("模型未返回回复");
    if (reply.stopReason === "error" || reply.stopReason === "aborted") throw new Error(reply.errorMessage || "模型请求失败");
    if (reply.stopReason === "length") throw new Error("模型回复因长度限制被截断，未能完整生成回答。");
    send({ type: "complete", text: reply.content.filter(part => part.type === "text").map(part => part.text).join("\n"), toolResults });
  } catch (error) {
    send({ type: "error", message: active.controller.signal.aborted ? "本次回复已停止" : error instanceof Error ? error.message : "临时对话执行失败" });
  } finally {
    active.controller.signal.removeEventListener("abort", stopSdk);
    signal?.removeEventListener("abort", abort);
    active.questions?.dispose();
    for (const call of active.clientCalls.values()) call.finish(new Error("临时对话已结束"));
    try {
      if (active.session) {
        try { await active.session.abort(); }
        finally { active.session.dispose(); }
      }
    } finally {
      state.active = undefined;
      try { setStatus(active, "idle"); send({ type: "done" }); }
      finally { active.finished.resolve(); }
    }
  }
}

export async function control(sessionId: string, action: "pause" | "resume" | "stop" | "close", runId?: string) {
  if (action === "close") { await close(sessionId); return { status: "idle" as const }; }
  const active = getSession(sessionId).active;
  if (!active) return { status: "idle" as const };
  if (active.id !== runId) throw Object.assign(new Error("当前回复已变化，控制请求已失效"), { status: 409 });
  if (action === "pause") {
    active.pauseRequested = true;
    setStatus(active, active.activeActions ? "pausing" : "paused");
  } else if (action === "resume") {
    active.pauseRequested = false;
    active.gate?.resolve();
    active.gate = undefined;
    setStatus(active, "running");
  } else {
    active.controller.abort(new Error("本次回复已停止"));
    await active.finished.promise;
    return { status: "idle" as const };
  }
  return { status: active.status };
}

export function toolResult(sessionId: string, callId: string, response: { result?: SingleAgentToolResult; error?: string; partial?: boolean }) {
  const call = getSession(sessionId).active?.clientCalls.get(callId);
  if (!call) throw Object.assign(new Error("工具调用不存在或已结束"), { status: 404 });
  if (response.partial) { if (response.result) call.onUpdate?.(response.result); return; }
  call.finish(response.error !== undefined ? new Error(response.error) : response.result!);
}

export function answer(sessionId: string, callId: string, response: Parameters<typeof answerQuestion>[2]) {
  const session = getSession(sessionId);
  if (!session.active?.questionIds.has(callId)) throw Object.assign(new Error("提问不属于此对话或已结束"), { status: 404 });
  const result = answerQuestion(session.id, callId, response);
  session.active.questionIds.delete(callId);
  return result;
}

export function getBrowserScope(sessionId: string, browserSessionId: string): string {
  const session = getSession(sessionId);
  if (!browserRuntime.hasOwner(session.cwd, session.history.getSessionId(), browserSessionId)) throw Object.assign(new Error("浏览器会话不属于此临时对话"), { status: 404 });
  return session.cwd;
}

export function assertWorkspaceBrowserAccess(browserSessionId: string) {
  // ACT: 临时对话数量由打开的弹窗决定；若未来支持大量常驻任务，改用浏览器会话到任务的索引。
  for (const session of sessions.values()) {
    if (browserRuntime.hasOwner(session.cwd, session.history.getSessionId(), browserSessionId)) throw Object.assign(new Error("请通过临时对话身份访问此浏览器"), { status: 403 });
  }
}

export async function close(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) return;
  if (session.closing) return session.closing;
  session.closed = true;
  const active = session.active;
  active?.controller.abort(new Error("临时对话已关闭"));
  active?.questions?.dispose();
  if (active) for (const call of active.clientCalls.values()) call.finish(new Error("临时对话已关闭"));
  session.closing = (async () => {
    try {
      try { await browserRuntime.closeOwner(session.cwd, session.history.getSessionId()); }
      finally { await active?.finished.promise; }
    } finally { sessions.delete(sessionId); }
  })();
  return session.closing;
}
