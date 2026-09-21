import type { Usage } from "@earendil-works/pi-ai";
import { createAgentSession, SessionManager, SettingsManager } from "@earendil-works/pi-coding-agent";
import type { AgentSession, CreateAgentSessionOptions, ToolDefinition } from "@earendil-works/pi-coding-agent";
import { createAgentResources } from "@/agent/runtime/resources";

export type SubAgentModel = Pick<CreateAgentSessionOptions, "modelRuntime" | "model" | "thinkingLevel">;
export type SubAgentResult = {
  name: string;
  status: "running" | "completed" | "error" | "limited" | "cancelled" | "inputRequired";
  result: string;
  taskId?: string;
  contextId?: string;
};

export function emptyUsage(): Usage {
  return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } };
}

export function addUsage(total: Usage, value: Usage) {
  for (const key of ["input", "output", "cacheRead", "cacheWrite", "totalTokens"] as const) total[key] += value[key];
  for (const key of ["input", "output", "cacheRead", "cacheWrite", "total"] as const) total.cost[key] += value.cost[key];
}

export function createToolQueue() {
  // ACT: 仅串行化实际工具调用；委派工具本身不得排入此队列，否则会等待自己的子任务。
  let queue = Promise.resolve();
  return (tools: ToolDefinition[]): ToolDefinition[] => tools.map(tool => ({
    ...tool,
    execute: (...args) => {
      const pending = queue.then(() => {
        args[2]?.throwIfAborted();
        return tool.execute(...args);
      });
      queue = pending.then(() => {}, () => {});
      return pending;
    },
  }));
}

export async function runSubAgent(options: SubAgentModel & {
  cwd: string;
  name: string;
  task: string;
  tools: ToolDefinition[];
  instructions?: string;
  signal?: AbortSignal;
  history?: SessionManager;
  inputRequired?: () => string | undefined;
  onProgress?: (message: string) => void;
}) {
  const { cwd, name, task, tools, instructions, signal, history, inputRequired, onProgress, ...modelOptions } = options;
  const result: SubAgentResult = { name, status: "running", result: "准备执行" };
  const usage = emptyUsage();
  const controller = new AbortController();
  const taskSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
  const timer = setTimeout(() => controller.abort(new Error("子任务超过 10 分钟，已请求停止")), 10 * 60 * 1000);
  let session: AgentSession | undefined;
  const abort = () => { void session?.abort(); };
  taskSignal.addEventListener("abort", abort, { once: true });
  // A2A 继续任务复用内存历史；只汇总本次新增记录，避免重复计费。
  const previousEntries = history?.getEntries().length ?? 0;
  try {
    taskSignal.throwIfAborted();
    const activeTools = tools.map(tool => ({
      ...tool,
      execute: (...args: Parameters<ToolDefinition["execute"]>) => {
        // ACT: SDK 在整批工具结束后才停轮；提出问题后不再执行本批后续操作。
        if (inputRequired?.()) throw new Error("任务正在等待调用方补充输入，不能继续执行工具");
        return tool.execute(...args);
      },
    }));
    const resources = await createAgentResources(cwd, activeTools, SettingsManager.inMemory({
      compaction: { enabled: false },
      retry: { enabled: false, provider: { maxRetries: 0 } },
    }), instructions);
    taskSignal.throwIfAborted();
    ({ session } = await createAgentSession({
      ...modelOptions, ...resources, cwd,
      sessionManager: history ?? SessionManager.inMemory(cwd),
      customTools: activeTools,
      tools: activeTools.map(tool => tool.name),
    }));
    taskSignal.throwIfAborted();
    let turns = 0;
    let limited = false;
    session.agent.shouldStopAfterTurn = ({ message }) => {
      limited = ++turns >= 12 && message.content.some(part => part.type === "toolCall");
      return limited || Boolean(inputRequired?.());
    };
    session.subscribe(event => {
      if (taskSignal.aborted) return;
      if (event.type === "message_start" && event.message.role === "assistant") onProgress?.("正在处理");
      if (event.type === "tool_execution_start") onProgress?.(`正在调用 ${event.toolName}`);
    });
    await session.prompt(`你正在执行委派的独立子任务。仅处理下述任务，遵守系统中的授权与工作区规则。缺少信息或授权时，说明阻碍并交回调用方；若提供 requestInput 则使用它等待补充。最终返回简明结论、实际修改的文件相对路径、验证情况与未完成项；长篇产物写入已授权的工作区文件。\n\n${JSON.stringify({ name, task })}`, { expandPromptTemplates: false });
    taskSignal.throwIfAborted();
    const question = inputRequired?.();
    const reply = session.messages.findLast(message => message.role === "assistant");
    if (!reply || reply.role !== "assistant") throw new Error("子任务没有返回回复");
    if (reply.stopReason === "error" || reply.stopReason === "aborted") throw new Error(reply.errorMessage || "子任务执行失败");
    const text = question ?? reply.content.filter(part => part.type === "text").map(part => part.text).join("\n").trim();
    if (!text && !limited) throw new Error("子任务没有返回文本结果");
    result.status = question ? "inputRequired" : limited || reply.stopReason === "length" || text.length > 16000 ? "limited" : "completed";
    result.result = `${text.slice(0, 16000)}${text.length > 16000 ? "\n[结果过长，已截断；请读取工作区产物]" : ""}${limited ? "\n[已达到 12 轮限制，任务可能未完成]" : reply.stopReason === "length" ? "\n[模型输出达到长度限制，任务可能未完成]" : ""}`.trim();
  } catch (error) {
    result.status = signal?.aborted ? "cancelled" : controller.signal.aborted ? "limited" : "error";
    const reason = taskSignal.aborted ? taskSignal.reason : error;
    result.result = reason instanceof Error ? reason.message : "子任务执行失败";
  } finally {
    clearTimeout(timer);
    taskSignal.removeEventListener("abort", abort);
    if (session) {
      try {
        await session.abort();
        for (const entry of session.sessionManager.getEntries().slice(previousEntries)) {
          if (entry.type === "message" && (entry.message.role === "assistant" || entry.message.role === "toolResult") && entry.message.usage) addUsage(usage, entry.message.usage);
        }
      } finally { session.dispose(); }
    }
  }
  return { result, usage };
}
