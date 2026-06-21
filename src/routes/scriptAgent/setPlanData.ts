import express from "express";
import { success } from "@/lib/responseFormat";
import u from "@/utils";
import { z } from "zod";
import { validateFields } from "@/middleware/middleware";
import { recordGenerationArtifact } from "@/utils/contentAudit";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    agentType: z.enum(["scriptAgent"]),
    data: z.object({
      storySkeleton: z.string().optional(),
      adaptationStrategy: z.string().optional(),
      script: z
        .array(
          z.object({
            id: z.number().optional(),
            name: z.string().optional(),
            content: z.string(),
          }),
        )
        .optional(),
    }),
  }),
  async (req, res) => {
    const { projectId, agentType, data } = req.body;
    const existing = await u.db("o_agentWorkData").where({ projectId, key: agentType }).first();
    const existingData = existing ? JSON.parse(existing.data ?? "{}") : {};
    const nextData = {
      storySkeleton: existingData.storySkeleton ?? "",
      adaptationStrategy: existingData.adaptationStrategy ?? "",
      ...existingData,
      ...data,
    };
    const now = Date.now();

    if (existing) {
      await u
        .db("o_agentWorkData")
        .where({ id: existing.id })
        .update({
          data: JSON.stringify(nextData),
          updateTime: now,
        });
    } else {
      await u.db("o_agentWorkData").insert({
        projectId,
        key: agentType,
        data: JSON.stringify(nextData),
        createTime: now,
        updateTime: now,
      });
    }

    const script = Array.isArray(nextData.script) ? nextData.script : [];

    await Promise.all(
      script.map(async (s: any) => {
        const row = s.id ? await u.db("o_script").where({ projectId, id: s.id }).first() : await u.db("o_script").where({ projectId, name: s.name }).first();
        const title = s.name || row?.name || "未命名剧本";
        if (row) {
          if (row.id == null) return;
          await u.db("o_script").where({ id: row.id }).update({ content: s.content });
          await recordGenerationArtifact({
            projectId,
            artifactType: "script",
            targetType: "o_script",
            targetId: row.id,
            targetField: "content",
            title,
            content: s.content,
            meta: { source: "agent:setPlanData", mode: "update" },
          });
        } else {
          const [scriptId] = await u.db("o_script").insert({ projectId, name: title, content: s.content });
          await recordGenerationArtifact({
            projectId,
            artifactType: "script",
            targetType: "o_script",
            targetId: scriptId,
            targetField: "content",
            title,
            content: s.content,
            meta: { source: "agent:setPlanData", mode: "insert" },
          });
        }
      }),
    );

    res.status(200).send(success());
  },
);
