import express from "express";
import u from "@/utils";
import pLimit from "p-limit";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { recordGenerationArtifact } from "@/utils/contentAudit";
import { recordPromptUsage, resolveVideoModelPrompt } from "@/utils/promptCenter";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    trackData: z.array(
      z.object({
        trackId: z.number(),
        info: z.array(
          z.object({
            id: z.number(),
            sources: z.string(),
          }),
        ),
      }),
    ),
    mode: z.string(),
    model: z.string(),
    concurrentCount: z.number().optional(), //并发数
  }),
  async (req, res) => {
    const { trackData, projectId, mode, model, concurrentCount = 5 } = req.body;
    try {
      // 预加载公共数据
      const [id, modelData] = model.split(/:(.+)/);
      const projectData = await u.db("o_project").select("*").where({ id: projectId }).first();
      const videoPromptGeneration = await resolveVideoModelPrompt({ vendorId: id, model: modelData, mode });
      const promptModelName = await u.Ai.resolveModelName("universalAi").catch(() => "universalAi");

      const artStyle = projectData?.artStyle || "无";
      const visualManual = u.getArtPrompt(artStyle, "art_skills", "art_storyboard_video");
      await u
        .db("o_videoTrack")
        .whereIn(
          "id",
          trackData.map((t: { trackId: number }) => t.trackId),
        )
        .update({ state: "生成中" });
      // 并发控制：每个 track 独立走 查询→拼装→AI调用→更新 流程
      const limit = pLimit(concurrentCount ?? 5);
      const tasks = trackData.map((track: { trackId: number; info: { id: number; sources: string }[] }) =>
        limit(async () => {
          // 查询参数
          const images = await Promise.all(
            track.info.map(async (item: { id: number; sources: string }) => {
              if (item.sources === "storyboard") {
                // 查询分镜主信息
                const storyboard = await u
                  .db("o_storyboard")
                  .where("o_storyboard.id", item.id)
                  .select("videoDesc", "prompt", "track", "duration", "shouldGenerateImage")
                  .first();
                // 查询分镜关联的资产ID
                const assetRows = await u.db("o_assets2Storyboard").where("storyboardId", item.id).orderBy("rowid").select("assetId");
                const associateAssetsIds = assetRows.map((row: any) => row.assetId);
                return {
                  ...storyboard,
                  associateAssetsIds,
                  _type: "storyboard",
                };
              }
              if (item.sources === "assets") {
                // 查询素材
                const assetsData = await u
                  .db("o_assets")
                  .leftJoin("o_image", "o_image.id", "o_assets.imageId")
                  .where("o_assets.id", item.id)
                  .select("o_assets.id", "o_assets.type", "o_assets.name", "o_image.filePath")
                  .first();
                return {
                  ...assetsData,
                  _type: "assets",
                };
              }
            }),
          );

          // 拆分 assets 和 storyboard
          const assets: any[] = [];
          const storyboard: any[] = [];
          for (const item of images) {
            if (!item) continue;
            if (item._type === "assets")
              assets.push({
                id: item.id,
                type: item.type,
                name: item.name,
                filePath: item.filePath,
              });
            if (item._type === "storyboard")
              storyboard.push({
                videoDesc: item.videoDesc,
                prompt: item.prompt,
                track: item.track,
                duration: item.duration,
                associateAssetsIds: item.associateAssetsIds,
                shouldGenerateImage: item.shouldGenerateImage,
              });
          }

          const content = `
          **模型名称**：${modelData},
          **资产信息**（角色、场景、道具、音频):${assets
            .filter((i: any) => i.filePath)
            .map((i: any) => `[${i.id},${i.type},${i.name}]`)
            .join("，")},
          **分镜信息**：${storyboard.map(
            (i: any) => `<storyboardItem
  videoDesc='${i.videoDesc}'
  duration='${i.duration}'
></storyboardItem>`,
          )},
          `;

          try {
            const promptUsageId = await recordPromptUsage({
              effectivePrompt: videoPromptGeneration,
              modelName: promptModelName,
              relatedType: "videoTrack:batchGeneratePrompt",
              relatedId: track.trackId,
              meta: { projectId, model, mode },
            });
            const { text } = await u.Ai.Text("universalAi").invoke({
              system: videoPromptGeneration.content,
              messages: [
                {
                  role: "assistant",
                  content: `${visualManual}`,
                },
                {
                  role: "user",
                  content: content,
                },
              ],
            });

            await u.db("o_videoTrack").where({ id: track.trackId }).update({
              prompt: text,
              state: "已完成",
            });
            await recordGenerationArtifact({
              projectId,
              artifactType: "videoPrompt",
              targetType: "o_videoTrack",
              targetId: track.trackId,
              targetField: "prompt",
              title: `视频轨道 ${track.trackId} 提示词`,
              content: text,
              effectivePrompt: videoPromptGeneration,
              promptUsageId,
              modelName: promptModelName,
              meta: { model, mode, storyboardCount: storyboard.length, assetCount: assets.length, batch: true },
            });

            return { trackId: track.trackId, text };
          } catch (e: any) {
            await u
              .db("o_videoTrack")
              .where({ id: track.trackId })
              .update({ state: "生成失败", reason: u.error(e).message });
          }
        }),
      );

      // 后台执行，不等待结果
      Promise.all(tasks);
      res.status(200).send(success("开始生成提示词"));
    } catch (e) {
      res.status(400).send(error(u.error(e).message));
    }
  },
);
