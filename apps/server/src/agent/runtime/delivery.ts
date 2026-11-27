import type { z } from "zod";
import type { UserMessage } from "@earendil-works/pi-ai";
import type { AgentSession } from "@earendil-works/pi-coding-agent";
import type { AgentMessageDelivery } from "@/agent/runtime/types";
import { agentUserMessageSchema, getQueuedMessageId, getToolResultText } from "@/agent/runtime/sessions";

type UserMessageDetails = Omit<z.infer<typeof agentUserMessageSchema>, "messageId">;

export function configureAgentDelivery(session: AgentSession, initial?: UserMessageDetails, initialTaskId?: string) {
  session.setSteeringMode("all");
  session.setFollowUpMode("one-at-a-time");
  const history = session.sessionManager;
  const queuedModes = new Map<UserMessage, AgentMessageDelivery["mode"]>();
  const originals = new WeakMap<object, UserMessageDetails>();
  let firstMessage = Boolean(initial);
  let taskMessageId = initial?.delivery?.mode === "steer" ? initial.delivery.taskMessageId
    : initialTaskId;

  session.subscribe(event => {
    if (event.type !== "queue_update") return;
    const queue = session.agent.getQueuedMessages();
    for (const [mode, messages] of [["steer", queue.steering], ["followUp", queue.followUp]] as const) {
      for (const message of messages) {
        if (message.role !== "user") continue;
        // 已 drain 的对象保留到消费或停止；重新插入仍排队对象以跟随提升后的实际顺序。
        queuedModes.delete(message);
        queuedModes.set(message, mode);
      }
    }
  });

  function prepareMessage(message: UserMessage, original: UserMessageDetails, mode?: AgentMessageDelivery["mode"]) {
    const details: UserMessageDetails = { ...original, delivery: undefined,
      queueId: queuedModes.has(message) ? getQueuedMessageId(message) : undefined };
    if (mode === "steer") {
      if (!taskMessageId) throw new Error("无法找到引导所属的当前任务");
      const guidance = "[当前任务中的引导]\n"
        + "这条消息是在当前任务执行过程中补充的引导。结合此前已接收的引导、已完成的工作和工具结果继续，不要把原任务当成已结束的上一轮。"
        + "如果用户提出简短问题，先回答，再继续本轮尚未完成的工作。若用户明确取消、替换或暂停原任务，按最新要求处理。不要重复已经完成的操作。\n用户本次补充：";
      message.content = [{ type: "text", text: guidance }, ...(typeof message.content === "string"
        ? [{ type: "text" as const, text: message.content }] : message.content)];
      details.delivery = { mode, taskMessageId };
    } else if (mode === "followUp") {
      details.delivery = { mode, taskMessageId: "" };
    }
    originals.set(message, details);
  }

  function saveDetails(message: UserMessage, messageId: string) {
    const original = originals.get(message);
    if (!original) return;
    if (original.delivery?.mode !== "steer") taskMessageId = messageId;
    if (original.delivery?.mode === "followUp") original.delivery.taskMessageId = messageId;
    history.appendCustomEntry("toonflowUserMessage", { messageId, ...original });
    originals.delete(message);
    queuedModes.delete(message);
  }

  // ACT: core 按注册顺序等待监听器；SDK 已清理文字镜像，message_end 时也已保存原消息。
  // 在这里补语义与原文记录，既不碰私有队列，也不会把元数据写到上一条消息上。
  session.agent.subscribe(event => {
    if ((event.type !== "message_start" && event.type !== "message_end") || event.message.role !== "user") return;
    if (event.type === "message_start") {
      const original = firstMessage && initial ? initial : {
        content: typeof event.message.content === "string" ? event.message.content : getToolResultText(event.message.content),
        attachments: [],
      };
      prepareMessage(event.message, original, firstMessage ? initial?.delivery?.mode : queuedModes.get(event.message));
      firstMessage = false;
    }
    if (event.type === "message_end") {
      const entry = history.getBranch().findLast(entry => entry.type === "message" && entry.message === event.message);
      if (!entry) throw new Error("用户消息尚未保存，无法记录任务归属");
      saveDetails(event.message, entry.id);
    }
  });

  return {
    setTaskMessageId(id: string) { taskMessageId = id; },
    forgetQueuedMessage(message: UserMessage) { queuedModes.delete(message); },
    savePendingMessages(onSaved: () => void) {
      for (const mode of ["steer", "followUp"] as const) {
        for (const [message, queuedMode] of queuedModes) {
          if (queuedMode !== mode) continue;
          const content = typeof message.content === "string" ? message.content : getToolResultText(message.content);
          prepareMessage(message, { content, attachments: [] }, mode);
          saveDetails(message, history.appendMessage(message));
          onSaved();
        }
      }
    },
  };
}
