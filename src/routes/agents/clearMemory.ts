import express from "express";
import db from "@/utils/db";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { clearConversation, buildConversationScopeKey, resolveConversationScope } from "@/utils/agent/conversationStore";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    episodesId: z.number().optional(),
    agentType: z.enum(["scriptAgent", "productionAgent"]),
    type: z.enum(["message", "summary", "all"]).optional(),
  }),
  async (req, res) => {
    const { projectId, episodesId, agentType, type = "all" } = req.body;
    const resolvedScope = resolveConversationScope({ projectId, episodesId, agentType });
    const isolationKey = resolvedScope ? buildConversationScopeKey(resolvedScope) : `${projectId}:${agentType}${episodesId ? `:${episodesId}` : ""}`;

    if (type === "all") {
      await db("memories").where({ isolationKey }).del();
    } else if (type === "message") {
      // 删 message 时同步删关联的 summary，避免悬挂引用
      await db("memories").where({ isolationKey, type: "message" }).del();
      await db("memories").where({ isolationKey, type: "summary" }).del();
    } else {
      // 删 summary 时将关联的 message 重置为未总结，使其重新进入 shortTerm
      await db("memories")
        .where({ isolationKey, type: "message", summarized: 1 })
        .update({ summarized: 0 });
      await db("memories").where({ isolationKey, type: "summary" }).del();
    }

    await clearConversation({ projectId, episodesId, agentType });

    res.status(200).send(success(null));
  },
);
