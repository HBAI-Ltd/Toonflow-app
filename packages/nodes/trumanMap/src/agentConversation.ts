import type { AgentQuestion, CreationImage, CreationProgress } from "./singleAgent";

export type AgentToolStatus = "running" | "success" | "error" | "interrupted";

/** 工具调用卡片的数据，对应宿主 Agent 消息里的 tool part；question 是宿主提问器（askUser）等用户回答的那张卡。 */
export type AgentToolCall = {
  id: string;
  name: string;
  label?: string;
  args?: unknown;
  status: AgentToolStatus;
  result?: string;
  error?: string;
  question?: AgentQuestion;
};
/** 用户随消息带的文本文档：正文只在发送那一轮带给模型，对话里只留名字和大小。 */
export type AgentAttachment = { name: string; size: number };

export type AgentThinkingPart = { id: string; type: "thinking"; content: string; collapsed?: boolean; streaming?: boolean; duration?: number };
export type AgentTextPart = { id: string; type: "text"; content: string };
export type AgentToolPart = { id: string; type: "tool"; tool: AgentToolCall; collapsed?: boolean };
export type AgentPart = AgentThinkingPart | AgentTextPart | AgentToolPart;

export type AgentView = { id: string; label: string; src: string };
/** 用户附图。thumbnail 是存盘用的小图；archived 表示原图已不在（从存盘读回），只显示、不再带给模型。 */
export type AgentMessageImage = CreationImage & { thumbnail?: string; archived?: boolean };

/**
 * 一段 Agent 对话消息。助手消息按宿主 conversation part 的顺序保存
 * thinking / tool / text，避免把过程汇总到回复之后，也不丢流式交错顺序。
 */
export type AgentMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts?: AgentPart[];
  streaming?: boolean;
  error?: string;
  images?: AgentMessageImage[];
  attachments?: AgentAttachment[];
  /** 和宿主一样：生成途中发的“引导”，补充当前任务，已完成的操作不撤销。 */
  delivery?: "steer";
  views?: AgentView[];
  warnings?: string[];
  statusText?: string;
  startedAt?: number;
  endedAt?: number;
};

export const agentToolStatusLabels: Record<AgentToolStatus, string> = { running: "调用中…", success: "已完成", error: "调用失败", interrupted: "已中断" };

export function formatAgentDuration(milliseconds: number) {
  const seconds = Math.max(0, milliseconds / 1000);
  return seconds >= 60 ? `${Math.floor(seconds / 60)}分${Math.floor(seconds % 60)}秒` : `${seconds < 10 ? seconds.toFixed(1) : Math.floor(seconds)}秒`;
}

export function agentMessageText(message: AgentMessage) {
  return message.content || message.parts?.flatMap(part => part.type === "text" ? [part.content] : []).join("\n\n") || "";
}

function textPart(parts: AgentPart[], id: string) {
  const existing = parts.find((part): part is AgentTextPart => part.type === "text" && part.id === id);
  if (existing) return existing;
  const part: AgentTextPart = { id, type: "text", content: "" };
  parts.push(part);
  return part;
}

/**
 * 把 singleAgent 的进度事件归并成宿主同构的消息 parts。
 * 文本和思考使用累积内容；工具按 id 原地更新；工具卡默认收起。
 * lookup：同一轮里因为“引导”拆出了新回复时，前一条回复里的工具还会收到结束事件，按 id 找回去更新，不在新回复里重复建卡。
 */
export function createReplyStream(message: AgentMessage, lookup?: (id: string) => AgentToolPart | undefined) {
  const parts = message.parts ?? (message.parts = []);
  let thinking: AgentThinkingPart | undefined;
  let thinkingStartedAt = 0;

  function finishThinking() {
    if (!thinking) return;
    thinking.streaming = false;
    thinking.collapsed = true;
    thinking.duration = (performance.now() - thinkingStartedAt) / 1000;
    thinking = undefined;
  }

  function receive(event: Extract<CreationProgress, { type: "text" | "thinking" | "tool" | "question" }>) {
    if (event.type === "question") {
      const existing = parts.find((item): item is AgentToolPart => item.type === "tool" && item.id === event.id) ?? lookup?.(event.id);
      if (existing) {
        existing.tool.question = event.question;
        existing.collapsed = false;
        return;
      }
      finishThinking();
      parts.push({ id: event.id, type: "tool", collapsed: false, tool: { id: event.id, name: "askUser", label: "向你提问", status: "running", question: event.question } });
      return;
    }
    if (event.type === "text") {
      const part = textPart(parts, event.id);
      part.content = event.text;
      return;
    }
    if (event.type === "thinking") {
      let part = parts.find((item): item is AgentThinkingPart => item.type === "thinking" && item.id === event.id);
      if (!part) {
        finishThinking();
        part = { id: event.id, type: "thinking", content: "", collapsed: false, streaming: true };
        parts.push(part);
        thinking = part;
        thinkingStartedAt = performance.now();
      }
      part.content = event.text;
      if (event.done) {
        part.streaming = false;
        part.collapsed = true;
        part.duration = (performance.now() - thinkingStartedAt) / 1000;
        if (thinking === part) thinking = undefined;
      }
      return;
    }
    const existing = parts.find((item): item is AgentToolPart => item.type === "tool" && item.id === event.id) ?? lookup?.(event.id);
    if (existing) {
      existing.tool.label = event.label || existing.tool.label;
      existing.tool.status = event.status;
      if (event.args !== undefined) existing.tool.args = event.args;
      if (event.result !== undefined) existing.tool.result = event.result;
      if (event.detail !== undefined) existing.tool.error = event.detail;
      return;
    }
    finishThinking();
    parts.push({
      id: event.id, type: "tool", collapsed: true,
      tool: { id: event.id, name: event.name, label: event.label, args: event.args, status: event.status, result: event.result, error: event.status === "error" || event.status === "interrupted" ? event.detail : undefined },
    });
  }

  function finish(status: "success" | "error" | "interrupted" = "success") {
    finishThinking();
    message.streaming = false;
    message.content = parts.filter((part): part is AgentTextPart => part.type === "text").map(part => part.content).join("\n\n");
    for (const part of parts) {
      if (part.type !== "tool" || part.tool.status !== "running") continue;
      part.tool.status = status;
      if (status !== "success") part.tool.error ??= status === "error" ? "调用失败" : "已中断";
    }
  }

  return { receive, finish };
}
