import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { tool, jsonSchema } from "ai";
import { recordPromptUsage, resolveFunctionPrompt } from "@/utils/promptCenter";
const router = express.Router();

// 获取资产
export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    assetsIds: z.array(z.number()),
    concurrentCount: z.number().min(1).optional(),
  }),
  async (req, res) => {
    const { projectId, assetsIds, concurrentCount } = req.body;
    const assetsData = await u.db("o_assets").whereIn("id", assetsIds).andWhere("projectId", projectId).select("id", "name", "describe", "type");

    const audioData = await u
      .db("o_assets")
      .where("type", "audio")
      .whereNull("assetsId")
      .andWhere("projectId", projectId)
      .select("id", "name", "describe");

    if (!audioData.length) return res.status(400).send(error("暂无设置音频，请先前往资产中心上传音频"));

    const batchSize = concurrentCount ?? 1;

    async function processAsset(asset: (typeof assetsData)[number]) {
      try {
        const resultTool = tool({
          description: "匹配完成后必须调用此工具提交结果",
          inputSchema: jsonSchema<{ id: number; audioId: number }>(
            z
              .object({
                audioId: z.number().nullable().optional().describe("与该资产匹配的音频ID列表，若无合适匹配则返回空数组"),
              })
              .toJSONSchema(),
          ),
          execute: async (result) => {
            await u.db("o_assetsRole2Audio").where("assetsRoleId", asset.id).delete();
            if (result?.audioId) await u.db("o_assetsRole2Audio").insert({ assetsRoleId: asset.id, assetsAudioId: result.audioId });
            await u.db("o_assets").where("id", asset.id).update("audioBindState", "已完成");
            return "无需回复用户任何内容";
          },
        });

        const audioList = audioData.map((i) => `- ID:${i.id} | 名称:${i.name} | 描述:${i.describe ?? "无"}`).join("\n");
        const audioBindPrompt = await resolveFunctionPrompt("audioBindPrompt");
        const modelName = await u.Ai.resolveModelName("universalAi").catch(() => "universalAi");
        await recordPromptUsage({
          effectivePrompt: audioBindPrompt,
          modelName,
          relatedType: "cornerScape:audioBind",
          relatedId: asset.id,
          meta: { projectId },
        });
        const { text } = await u.Ai.Text("universalAi").invoke({
          messages: [
            {
              role: "system",
              content: `
              ${audioBindPrompt.content}
              `,
            },
            {
              role: "user",
              content: `
                ## 候选音频列表
                ${audioList}
                ## 待匹配资产
                - ID:${asset.id} | 名称:${asset.name} | 描述:${asset.describe ?? "无"} | 类型：${asset.type}
                请从候选音频列表中为该资产选出来一个最符合该角色设定的音色，并调用 resultTool 提交结果。
           `,
            },
          ],
          tools: { resultTool },
        });
      } catch (e) {
        await u.db("o_assets").where("id", asset.id).update("audioBindState", "生成失败");
        console.error(`[bindAudio] 资产 ${asset.id} 处理失败:`, e);
      }
    }

    async function runWithConcurrency() {
      for (let i = 0; i < assetsData.length; i += batchSize) {
        const batch = assetsData.slice(i, i + batchSize);

        await Promise.all(batch.map((asset) => processAsset(asset)));
      }
    }
    await u
      .db("o_assets")
      .whereIn(
        "id",
        assetsData.map((i) => i.id),
      )
      .update("audioBindState", "生成中");
    runWithConcurrency();
    res.status(200).send(success());
  },
);
