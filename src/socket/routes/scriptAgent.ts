import jwt from "jsonwebtoken";
import u from "@/utils";
import { Namespace, Socket } from "socket.io";
import * as agent from "@/agents/scriptAgent/index";
import ResTool from "@/socket/resTool";
import { applyAgentChatOutgoingEvents, type AgentChatOutgoingEvent } from "@/utils/agentChatHistory";

async function verifyToken(rawToken: string): Promise<Boolean> {
  const setting = await u.db("o_setting").where("key", "tokenKey").select("value").first();
  if (!setting) return false;
  const { value: tokenKey } = setting;
  if (!rawToken) return false;
  const token = rawToken.replace("Bearer ", "");
  try {
    jwt.verify(token, tokenKey as string);
    return true;
  } catch (err) {
    return false;
  }
}

export default (nsp: Namespace) => {
  nsp.on("connection", async (socket: Socket) => {
    const token = socket.handshake.auth.token;
    if (!token || !(await verifyToken(token))) {
      console.log("[scriptAgent] 连接失败，token无效");
      socket.disconnect();
      return;
    }
    const isolationKey = socket.handshake.auth.isolationKey;
    if (!isolationKey) {
      console.log("[scriptAgent] 连接失败，缺少 isolationKey");
      socket.disconnect();
      return;
    }

    const projectId = Number(socket.handshake.auth.projectId);
    const scriptId = socket.handshake.auth.scriptId ? Number(socket.handshake.auth.scriptId) : null;
    const threadKey = socket.handshake.auth.threadKey || `${projectId}:scriptAgent:${scriptId || "project"}`;
    const outgoingEvents: AgentChatOutgoingEvent[] = [];
    let outgoingFlushTimer: NodeJS.Timeout | null = null;
    let outgoingFlushChain = Promise.resolve();

    function flushOutgoingEvents() {
      if (outgoingFlushTimer) {
        clearTimeout(outgoingFlushTimer);
        outgoingFlushTimer = null;
      }
      const events = outgoingEvents.splice(0);
      if (!events.length) return outgoingFlushChain;
      outgoingFlushChain = outgoingFlushChain
        .then(async () => {
          await applyAgentChatOutgoingEvents({
            projectId,
            scriptId,
            threadKey,
            agentMode: "script",
            events,
          });
        })
        .catch((err) => console.warn("[scriptAgent] 保存输出事件失败:", u.error(err).message));
      return outgoingFlushChain;
    }

    function scheduleOutgoingFlush(event: string, payload: any) {
      outgoingEvents.push({ event, payload });
      const terminal =
        event === "message:update" && ["complete", "error", "stop"].includes(payload?.status)
        || event === "content:update" && ["complete", "error"].includes(payload?.status);
      if (terminal) {
        void flushOutgoingEvents();
        return;
      }
      if (!outgoingFlushTimer) outgoingFlushTimer = setTimeout(() => void flushOutgoingEvents(), 700);
    }

    console.log("[scriptAgent] 已连接:", socket.id);

    socket.onAnyOutgoing((event, payload) => {
      scheduleOutgoingFlush(event, payload);
    });

    const resTool = new ResTool(socket, {
      projectId,
    });
    let abortController: AbortController | null = null;

    const thinkConfig: agent.AgentContext["thinkConfig"] = {
      think: false,
      thinlLevel: 0,
    };

    socket.on("chat", async (data: { content: string; think?: boolean; thinkLevel?: 0 | 1 | 2 | 3 }) => {
      const { content } = data;
      if (typeof data.think === "boolean") thinkConfig.think = data.think;
      if (typeof data.thinkLevel === "number") thinkConfig.thinlLevel = data.thinkLevel;
      abortController?.abort();
      abortController = new AbortController();
      const currentController = abortController;

      const msg = resTool.newMessage("assistant", "统筹");
      const ctx: agent.AgentContext = {
        socket,
        isolationKey,
        text: content,
        userMessageTime: new Date(msg.datetime).getTime() - 1,
        abortSignal: currentController.signal,
        resTool,
        msg,
        thinkConfig,
      };

      try {
        await agent.runDecisionAI(ctx);
      } catch (err: any) {
        if (err.name !== "AbortError" && !currentController.signal.aborted) {
          console.error("[scriptAgent] chat error:", u.error(err).message);
          msg.error(u.error(err).message)
        }
      } finally {
        await flushOutgoingEvents();
        if (abortController === currentController) {
          abortController = null;
        }
      }
    });

    socket.on("updateThinkConfig", (data: { think: boolean; thinlLevel: 0 | 1 | 2 | 3 }) => {
      thinkConfig.think = data.think;
      thinkConfig.thinlLevel = data.thinlLevel;
      console.log("[scriptAgent] 更新思考配置:", thinkConfig);
    });

    socket.on("stop", () => {
      abortController?.abort();
      abortController = null;
    });
    socket.on("disconnect", () => {
      void flushOutgoingEvents();
      console.log("[scriptAgent] 已断开连接:", socket.id);
    });
  });
};
