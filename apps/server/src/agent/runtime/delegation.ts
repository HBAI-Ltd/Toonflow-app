import type { SessionEntry } from "@earendil-works/pi-coding-agent";
import type { CanvasContext } from "@toonflow/tools-scaffold/runtime";
import type { AgentEvent, AgentPeerMessage } from "@/agent/runtime/types";
import { run } from "@/agent/runtime";
import { createAgentConversation, getToolResultText, registerAgentRun, trackAgentEvent, updateSubAgent } from "@/agent/runtime/sessions";
import { addUsage, emptyUsage, type SubAgentResult } from "@/agent/runtime/subAgent";
import { createCanvasContext } from "@/agent/bridge/canvas";
import { createQuestionContext } from "@/agent/bridge/question";
import { translateError, translateMessage } from "@/lib/i18n";
import type { ThinkingLevel } from "@/lib/modelReasoning";

export async function runDelegatedAgent(options: {
  cwd: string; parentFile?: string; name: string; task: string; message?: AgentPeerMessage;
  providerId: string; modelId: string; thinkingLevel?: ThinkingLevel;
  canvas?: CanvasContext; signal?: AbortSignal; background?: boolean; send: (event: AgentEvent) => void; onProgress?: (text: string) => void;
  onCanvasCancel?: (reason: Error) => void; onReady?: () => void;
}) {
  const { cwd, parentFile, name, task, message, providerId, modelId, thinkingLevel, canvas, signal, onProgress } = options;
  if (!message && !parentFile) throw new Error("创建子 Agent 需要父会话");
  const runId = crypto.randomUUID();
  const controller = new AbortController();
  const childSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
  const finished = Promise.withResolvers<void>();
  const unregister = registerAgentRun({ runId, directory: Promise.resolve(cwd), abort: () => controller.abort(), finished: finished.promise });
  try {
    childSignal.throwIfAborted();
    const child = message ? { file: message.toFile } : await createAgentConversation(cwd, { parentFile: parentFile!, name, task, providerId, modelId, thinkingLevel });
    const agent = { file: child.file, runId, parentFile, name, task, providerId, modelId, thinkingLevel, status: "running" as const };
    if (parentFile && !message) await updateSubAgent(cwd, parentFile, { ...agent, parentFile });
    let started = false;
    let entries: SessionEntry[] = [];
    const send = (event: AgentEvent) => {
      if (event.type === "session") started = true;
      trackAgentEvent(cwd, child.file, event);
      options.send({ type: "subAgentEvent", file: child.file, runId, event });
      if (event.type === "agentMessage" && event.id === message?.id) options.onReady?.();
      if (event.type === "tool" && event.tool.status === "running") onProgress?.(`正在调用 ${event.tool.name}`);
    };
    const bridge = canvas ? createCanvasContext(cwd, canvas, send, reason => {
      controller.abort(reason);
      options.onCanvasCancel?.(reason);
    }) : undefined;
    const questions = options.background ? undefined : createQuestionContext(cwd, send, () => controller.abort());
    const result: SubAgentResult = { name, file: child.file, status: "running", result: "准备执行" };
    try {
      await run({ prompt: task, cwd, runId, sessionFile: child.file, providerId, modelId, thinkingLevel, scheduled: options.background ? "delegated" : undefined,
        canvas: bridge?.context, question: questions?.context, signal: childSignal, onCancel: () => controller.abort(), onCanvasCancel: options.onCanvasCancel }, send, message ? { ...message, startsTurn: true } : undefined, snapshot => { entries = snapshot; });
      result.status = childSignal.aborted ? "cancelled" : "completed";
    } catch (error) {
      result.status = childSignal.aborted ? "cancelled" : (error as { code?: string })?.code === "AGENT_LENGTH" ? "limited" : "error";
      result.result = error instanceof Error ? translateError(error) : translateMessage("子任务执行失败");
      if (parentFile && !message && result.status !== "limited") await updateSubAgent(cwd, parentFile, { ...agent, parentFile, status: result.status, result: result.result });
      if (started || !message) send({ type: "error", message: result.result });
    } finally {
      bridge?.dispose();
      questions?.dispose();
      if (started || !message) send({ type: "done" });
    }
    const usage = emptyUsage();
    for (const entry of entries) {
      if (entry.type === "message" && (entry.message.role === "assistant" || entry.message.role === "toolResult") && entry.message.usage) addUsage(usage, entry.message.usage);
    }
    if (result.status === "completed" || result.status === "limited") {
      const reply = entries.findLast(entry => entry.type === "message" && entry.message.role === "assistant");
      result.result = reply?.type === "message" && reply.message.role === "assistant" ? getToolResultText(reply.message.content.filter(part => part.type === "text")) : "";
      if (reply?.type === "message" && reply.message.role === "assistant" && reply.message.stopReason === "length") result.status = "limited";
    }
    return { result, usage };
  } finally {
    unregister();
    finished.resolve();
  }
}
