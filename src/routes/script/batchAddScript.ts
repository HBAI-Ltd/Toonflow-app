import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { recordGenerationArtifact } from "@/utils/contentAudit";
const router = express.Router();

// 新增剧本
export default router.post(
  "/",
  validateFields({
    data: z.array(
      z.object({
        scriptName: z.string(),
        scriptData: z.string(),
      }),
    ),
    projectId: z.number(),
  }),
  async (req, res) => {
    const { data, projectId } = req.body;
    for (const item of data) {
      const [scriptId] = await u.db("o_script").insert({
        name: item.scriptName,
        content: item.scriptData,
        projectId,
        createTime: Date.now(),
      });
      await recordGenerationArtifact({
        projectId,
        artifactType: "script",
        targetType: "o_script",
        targetId: scriptId,
        targetField: "content",
        title: item.scriptName,
        content: item.scriptData,
        meta: { source: "manual:batchAddScript" },
      });
    }

    res.status(200).send(success({ message: "添加剧本成功" }));
  },
);
