import { randomUUID } from "node:crypto";
import type { Usage } from "@earendil-works/pi-ai";
import { createTeamA2aClient, SendMessageRequest, GetTaskRequest, CancelTaskRequest, TaskState, Role, type Message, type Task, type Artifact } from "@toonflow/teams-scaffold/a2a";
import { emptyUsage, type SubAgentResult } from "@/agent/runtime/subAgent";
import { getRemoteTeam } from "@/utils/teams";

export async function runRemoteTeam(options: {
  name: string;
  task: string;
  taskId?: string;
  contextId?: string;
  signal?: AbortSignal;
  onProgress?: (text: string) => void;
}): Promise<{ result: SubAgentResult; usage: Usage }> {
  const { name, task, signal, onProgress } = options;
  const result: SubAgentResult = { name, status: "running", result: "准备连接远端团队", taskId: options.taskId, contextId: options.contextId };
  const controller = new AbortController();
  const taskSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
  const timer = setTimeout(() => controller.abort(new Error("远端团队超过 10 分钟，已请求停止")), 10 * 60 * 1000);
  const artifacts = new Map<string, string>();
  let client: Awaited<ReturnType<typeof createTeamA2aClient>> | undefined;
  let sent = false;
  let state: TaskState | undefined;
  let text = "";
  let directReply = false;
  let truncated = false;

  function limit(value: string) {
    if (value.length > 16000) truncated = true;
    return value.slice(0, 16000);
  }
  function partsText(parts: Message["parts"]) {
    return limit(parts.map(part => {
      const content = part.content;
      if (content?.$case === "text") return content.value;
      if (content?.$case === "data") return JSON.stringify(content.value);
      if (content?.$case === "url") return `远端文件${part.filename ? ` ${part.filename}` : ""}：${content.value}`;
      if (content?.$case === "raw") return `远端附件${part.filename ? ` ${part.filename}` : ""}（${content.value.byteLength} 字节，未保存到工作区）`;
      return "";
    }).filter(Boolean).join("\n"));
  }
  function identify(taskId?: string, contextId?: string) {
    if ((taskId && result.taskId && taskId !== result.taskId) || (contextId && result.contextId && contextId !== result.contextId)) throw new Error("远端返回的任务标识不匹配");
    if (taskId) result.taskId = taskId;
    if (contextId) result.contextId = contextId;
  }
  function artifact(value: Artifact, append = false) {
    // ACT: 工具只返回有界文本与文件说明，不下载 URL，也不把远端附件写进工作区。
    if (!artifacts.has(value.artifactId) && artifacts.size >= 128) { truncated = true; return; }
    artifacts.set(value.artifactId, limit(`${append ? artifacts.get(value.artifactId) ?? "" : ""}${partsText(value.parts)}`));
  }
  function status(value: Task["status"]) {
    if (!value) return;
    state = value.state;
    const update = value.message ? partsText(value.message.parts) : "";
    if (update) text = update;
    if (state === TaskState.TASK_STATE_WORKING || state === TaskState.TASK_STATE_SUBMITTED) onProgress?.(update || "远端团队正在执行");
  }
  function snapshot(value: Task) {
    identify(value.id, value.contextId);
    artifacts.clear();
    for (const item of value.artifacts) artifact(item);
    const reply = value.history.findLast(item => item.role === Role.ROLE_AGENT);
    text = reply ? partsText(reply.parts) : "";
    status(value.status);
  }
  function finish() {
    if (state === TaskState.TASK_STATE_COMPLETED || (state === undefined && directReply)) result.status = "completed";
    else if (state === TaskState.TASK_STATE_CANCELED) result.status = "cancelled";
    else if (state === TaskState.TASK_STATE_INPUT_REQUIRED || state === TaskState.TASK_STATE_AUTH_REQUIRED) result.status = "inputRequired";
    else if (state === TaskState.TASK_STATE_FAILED || state === TaskState.TASK_STATE_REJECTED) result.status = "error";
    else return false;
    result.result = limit([...new Set([text, ...artifacts.values()].filter(Boolean))].join("\n\n")) || (
      result.status === "completed" ? "远端任务已完成，未返回文本产物" :
      result.status === "cancelled" ? "远端任务已确认取消" :
      state === TaskState.TASK_STATE_AUTH_REQUIRED ? "远端任务需要额外认证，请由用户处理后继续" :
      result.status === "inputRequired" ? "远端任务需要补充信息" : "远端任务失败或被拒绝"
    );
    if (truncated) {
      if (result.status === "completed") result.status = "limited";
      result.result += "\n[远端结果过长，已截断；可使用 taskId 查询完整产物]";
    }
    return true;
  }

  try {
    taskSignal.throwIfAborted();
    const remote = getRemoteTeam(name);
    if (!remote) throw new Error(`远端团队 ${name} 不存在`);
    if (!remote.enabled) throw new Error(`远端团队 ${name} 已禁用`);
    client = await createTeamA2aClient({
      url: remote.cardUrl, token: remote.token,
      fetch: ((input, init) => fetch(input, { ...init, signal: init?.signal ?? taskSignal })) as typeof fetch,
    });
    const card = await client.getAgentCard({ signal: taskSignal });
    taskSignal.throwIfAborted();
    if (!getRemoteTeam(name)?.enabled) throw new Error(`远端团队 ${name} 已禁用`);
    const request = SendMessageRequest.fromJSON({ message: {
      messageId: randomUUID(), role: "ROLE_USER", parts: [{ text: task }], taskId: result.taskId, contextId: result.contextId,
    } });
    sent = true;
    if (card.capabilities?.streaming) {
      for await (const event of client.sendMessageStream(request, { signal: taskSignal })) {
        const payload = event.payload;
        if (!payload) continue;
        if (payload.$case === "task") snapshot(payload.value);
        else if (payload.$case === "message") {
          identify(payload.value.taskId, payload.value.contextId);
          text = partsText(payload.value.parts);
          directReply = true;
        } else {
          identify(payload.value.taskId, payload.value.contextId);
          if (payload.$case === "statusUpdate") status(payload.value.status);
          else if (payload.value.artifact) artifact(payload.value.artifact, payload.value.append);
        }
      }
    } else {
      const reply = await client.sendMessage(request, { signal: taskSignal });
      if ("id" in reply) snapshot(reply);
      else { identify(reply.taskId, reply.contextId); text = partsText(reply.parts); directReply = true; }
    }
    taskSignal.throwIfAborted();
    if (!finish()) throw new Error("远端响应结束，但没有返回完成、失败或等待输入状态");
  } catch (error) {
    const reason = taskSignal.aborted ? taskSignal.reason : error;
    const description = reason instanceof Error ? reason.message : String(reason ?? "远端调用失败");
    result.status = "error";
    result.result = description;
    if (client && (sent || options.taskId) && result.taskId) {
      try {
        if (taskSignal.aborted) {
          const cancelled = await client.cancelTask(CancelTaskRequest.fromJSON({ id: result.taskId }), { signal: AbortSignal.timeout(15000) });
          snapshot(cancelled);
          if (state !== TaskState.TASK_STATE_CANCELED) throw new Error("远端没有确认取消");
          result.status = signal?.aborted ? "cancelled" : "limited";
          result.result = `${description}；远端已确认取消`;
        } else {
          // 断流只核对任务，不重发消息，避免重复执行有副作用的工作。
          snapshot(await client.getTask(GetTaskRequest.fromJSON({ id: result.taskId }), { signal: AbortSignal.timeout(15000) }));
          if (!finish()) result.result = `${description}；远端任务仍未结束，未自动重试或取消`;
        }
      } catch (checkError) {
        result.status = "error";
        result.result = `${description}；${taskSignal.aborted ? "无法确认远端已取消" : "无法确认远端任务状态"}：${checkError instanceof Error ? checkError.message : String(checkError)}`;
      }
    } else if (taskSignal.aborted && !sent) {
      if (result.taskId) result.result += "；本次请求尚未提交，原远端任务未执行取消";
      else result.status = signal?.aborted ? "cancelled" : "limited";
    } else if (sent) result.result += "；尚未获得任务标识，远端状态未知，未自动重试";
  } finally { clearTimeout(timer); }
  return { result, usage: emptyUsage() };
}
