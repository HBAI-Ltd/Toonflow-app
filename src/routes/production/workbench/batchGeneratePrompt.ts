import express from "express";
import u from "@/utils";
import pLimit from "p-limit";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import fs from "fs/promises";
import path from "path";
import { t, getLocale } from "@/i18n";
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
    const locale = await getLocale(req as any);
    try {
      // 预加载公共数据
      const [id, modelData] = model.split(/:(.+)/);
      const projectData = await u.db("o_project").select("*").where({ id: projectId }).first();
      const videoPrompt = await u.db("o_prompt").where("type", "videoPromptGeneration").first();
      let videoPromptGeneration = "" as string | undefined;

      const modelPromptData = await u.db("o_modelPrompt").where("vendorId", id).where("model", modelData).first();
      //查询到 有绑定对应视频提示词
      if (modelPromptData) {
        const modelPromptRoot = u.getPath(["modelPrompt"]);
        try {
          const fullPath = path.join(modelPromptRoot, modelPromptData?.path!);
          const content = await fs.readFile(fullPath, "utf-8");
          videoPromptGeneration = content ?? "";
        } catch {}
      }

      // 未查询到绑定，根据模型名称 + mode 自动匹配 modelPrompt/video/ 下的文件
      if (!videoPromptGeneration) {
        const modelPromptRoot = u.getPath(["modelPrompt"]);
        const videoPromptDir = path.join(modelPromptRoot, "video");
        const modelLower = (modelData ?? "").toLowerCase();

        let fileName: string | null = null;

        if (modelLower.includes("wan") && modelLower.includes("2.6")) {
          // wan2.6 系列 => 单图首尾帧模式
          fileName = "wan2.6Single-imageFirstFrameMode.md";
        } else if (/seedance.*2[.\-]0/i.test(modelLower)) {
          // seedance 2.0 / 2-0 系列
          fileName = "seedance2Multi-parameterMode.md";
        } else if (mode === "startEndRequired" || mode === "endFrameOptional" || mode === "startFrameOptional") {
          // body.mode 为首尾帧相关 => 通用首尾帧模式
          fileName = "universalFirstAndLastFrameMode.md";
        } else if (typeof mode === "string" && mode.startsWith('["') && mode.endsWith('"]')) {
          // 其他 => 通用多参模式
          fileName = "universalMulti-parameterMode.md";
        }
        if (fileName) {
          try {
            const fullPath = path.join(videoPromptDir, fileName);
            videoPromptGeneration = await fs.readFile(fullPath, "utf-8");
          } catch {
            // 文件不存在则忽略，继续用备选
          }
        }
      }

      //备选
      if (!videoPromptGeneration) {
        if (videoPrompt && videoPrompt.useData) {
          videoPromptGeneration = videoPrompt.useData;
        } else {
          videoPromptGeneration = videoPrompt?.data ?? undefined;
        }
      }

      const artStyle = projectData?.artStyle || "无"; // i18n-ignore — internal fallback key for art-style prompt lookup, not user-facing text
      const visualManual = u.getArtPrompt(artStyle, "art_skills", "art_storyboard_video");
      await u
        .db("o_videoTrack")
        .whereIn(
          "id",
          trackData.map((tr: { trackId: number }) => tr.trackId),
        )
        .update({ state: "生成中" }); // i18n-ignore — stored o_videoTrack.state enum value, not user-facing text
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

          const modelLabel = t("agent.production.workbench.videoPrompt.modelLabel", {}, locale);
          const assetsLabel = t("agent.production.workbench.videoPrompt.assetsLabel", {}, locale);
          const storyboardLabel = t("agent.production.workbench.videoPrompt.storyboardLabel", {}, locale);
          const content = `
          ${modelLabel}${modelData},
          ${assetsLabel}${assets
            .filter((i: any) => i.filePath)
            .map((i: any) => `[${i.id},${i.type},${i.name}]`)
            .join("，")},
          ${storyboardLabel}${storyboard.map(
            (i: any) => `<storyboardItem
  videoDesc='${i.videoDesc}'
  duration='${i.duration}'
></storyboardItem>`,
          )},
          `;

          try {
            const { text } = await u.Ai.Text("universalAi").invoke({
              system: videoPromptGeneration,
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
              state: "已完成", // i18n-ignore — stored o_videoTrack.state enum value, not user-facing text
            });

            return { trackId: track.trackId, text };
          } catch (e: any) {
            await u
              .db("o_videoTrack")
              .where({ id: track.trackId })
              .update({ state: "生成失败", reason: u.error(e).message }); // i18n-ignore — stored o_videoTrack.state enum value, not user-facing text
          }
        }),
      );

      // 后台执行，不等待结果
      Promise.all(tasks);
      res.status(200).send(success(t("production.workbench.batchGeneratePrompt.started", {}, locale)));
    } catch (e) {
      res.status(400).send(error(u.error(e).message));
    }
  },
);
