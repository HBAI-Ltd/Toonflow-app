import { readFile } from "node:fs/promises";
import { parseSessionEntries } from "@earendil-works/pi-coding-agent";
import type { CanvasContext } from "@toonflow/tools-scaffold/runtime";
import type { AgentEvent } from "@/agent/runtime/types";
import { run } from "@/agent/runtime";
import { createAgentConversation, getToolResultText, trackAgentEvent, updateSubAgent } from "@/agent/runtime/sessions";
import { addUsage, emptyUsage, type SubAgentResult } from "@/agent/runtime/subAgent";
import { createCanvasContext } from "@/agent/bridge/canvas";
import { createQuestionContext } from "@/agent/bridge/question";
import { resolveWorkspacePath } from "@/utils/workspace/files";

export async function runDelegatedAgent(options: {
  cwd: string; parentFile: string; name: string; task: string;
  providerId: string; modelId: string; thinkingLevel: "off" | "low" | "medium" | "high";
  canvas?: CanvasContext; signal?: AbortSignal; send: (event: AgentEvent) => void; onProgress?: (text: string) => void;
}) {
  const { cwd, parentFile, name, task, providerId, modelId, thinkingLevel, canvas, signal, onProgress } = options;
  const child = await createAgentConversation(cwd, { parentFile, name, task, providerId, modelId, thinkingLevel });
  const agent = { file: child.file, parentFile, name, task, providerId, modelId, thinkingLevel, status: "running" as const };
  await updateSubAgent(cwd, parentFile, agent);
  const send = (event: AgentEvent) => {
    trackAgentEvent(cwd, child.file, event);
    options.send({ type: "subAgentEvent", file: child.file, event });
    if (event.type === "tool" && event.tool.status === "running") onProgress?.(`正在调用 ${event.tool.name}`);
  };
  const controller = new AbortController();
  const childSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
  const bridge = canvas ? createCanvasContext(cwd, canvas, send) : undefined;
  const questions = createQuestionContext(cwd, send, () => controller.abort());
  const result: SubAgentResult = { name, status: "running", result: "准备执行" };
  try {
    await run({ prompt: task, cwd, sessionFile: child.file, providerId, modelId, thinkingLevel, canvas: bridge?.context, question: questions.context, signal: childSignal }, send);
    result.status = childSignal.aborted ? "cancelled" : "completed";
  } catch (error) {
    result.status = childSignal.aborted ? "cancelled" : (error as { code?: string })?.code === "AGENT_LENGTH" ? "limited" : "error";
    result.result = error instanceof Error ? error.message : "子任务执行失败";
    if (result.status !== "limited") await updateSubAgent(cwd, parentFile, { ...agent, status: result.status, result: result.result });
    send({ type: "error", message: result.result });
  } finally {
    bridge?.dispose();
    questions.dispose();
    send({ type: "done" });
  }
  const { path } = await resolveWorkspacePath(cwd, `.agent/sessions/${child.file}`);
  const entries = parseSessionEntries(await readFile(path, "utf8"));
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
}
