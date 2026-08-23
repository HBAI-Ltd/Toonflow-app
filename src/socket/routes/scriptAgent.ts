import jwt from "jsonwebtoken";
import u from "@/utils";
import { Namespace, Socket } from "socket.io";
import * as agent from "@/agents/scriptAgent/index";
import ResTool from "@/socket/resTool";
import { t, getLocale } from "@/i18n";

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
      console.log("[scriptAgent] Connection rejected, invalid token");
      socket.disconnect();
      return;
    }
    const isolationKey = socket.handshake.auth.isolationKey;
    if (!isolationKey) {
      console.log("[scriptAgent] Connection rejected, missing isolationKey");
      socket.disconnect();
      return;
    }

    console.log("[scriptAgent] Connected:", socket.id);

    const locale = await getLocale(socket.handshake as any);
    const resTool = new ResTool(
      socket,
      {
        projectId: socket.handshake.auth.projectId,
      },
      locale,
    );
    let abortController: AbortController | null = null;

    const thinkConfig: agent.AgentContext["thinkConfig"] = {
      think: false,
      thinlLevel: 0,
    };

    socket.on("chat", async (data: { content: string }) => {
      const { content } = data;
      abortController?.abort();
      abortController = new AbortController();
      const currentController = abortController;

      const msg = resTool.newMessage("assistant", t("socket.scriptAgent.coordinatorName", {}, locale));
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
          console.error("[scriptAgent] Chat error:", u.error(err).message);
          msg.error(u.error(err).message)
        }
      } finally {
        if (abortController === currentController) {
          abortController = null;
        }
      }
    });

    socket.on("updateThinkConfig", (data: { think: boolean; thinlLevel: 0 | 1 | 2 | 3 }) => {
      thinkConfig.think = data.think;
      thinkConfig.thinlLevel = data.thinlLevel;
      console.log("[scriptAgent] Updated think config:", thinkConfig);
    });

    socket.on("stop", () => {
      abortController?.abort();
      abortController = null;
    });
  });
  nsp.on("disconnect", (socket: Socket) => {
    console.log("[scriptAgent] Disconnected:", socket.id);
  });
};
