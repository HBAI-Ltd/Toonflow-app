import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { recordGenerationArtifact } from "@/utils/contentAudit";
import { recordPromptUsage, resolveVideoModelPrompt } from "@/utils/promptCenter";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    trackId: z.number(),
    projectId: z.number(),
    info: z.array(
      z.object({
        id: z.number(),
        sources: z.string(),
      }),
    ),
    model: z.string(),
    mode: z.string(),
  }),
  async (req, res) => {
    const { trackId, projectId, info, model, mode } = req.body;
    await u.db("o_videoTrack").where({ id: trackId }).update({
      state: "生成中",
    });

    // 兜底：当前端未传 info(或为空)时，从该轨道关联的分镜与资产中推导，避免“未检测到资产信息”
    let resolvedInfo: { id: number; sources: string }[] = Array.isArray(info) ? info : [];
    if (resolvedInfo.length === 0) {
      const storyboardRows = await u.db("o_storyboard").where({ trackId, projectId }).select("id");
      const storyboardIds = storyboardRows.map((s: any) => s.id).filter((id: any) => typeof id === "number");
      let assetIds: number[] = [];
      if (storyboardIds.length) {
        const assetRows = await u
          .db("o_assets2Storyboard")
          .whereIn("storyboardId", storyboardIds)
          .orderBy("rowid")
          .select("assetId");
        assetIds = [...new Set(assetRows.map((r: any) => r.assetId).filter((id: any) => typeof id === "number"))];
      }
      resolvedInfo = [
        ...assetIds.map((id) => ({ id, sources: "assets" })),
        ...storyboardIds.map((id) => ({ id, sources: "storyboard" })),
      ];
    }

    //查询参数
    const images = await Promise.all(
      resolvedInfo.map(async (item: { id: number; sources: string }) => {
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
            _type: "storyboard", // 标记类型，便于后续区分
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
            _type: "assets", // 标记类型
          };
        }
      }),
    );

    // 拆分 assets 和 storyboard
    const assets: any[] = [];
    const storyboard: any[] = [];
    for (const item of images) {
      if (!item) continue; // 忽略空
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

    // 按镜头裁剪资产：以「本轨道分镜实际关联的资产」为白名单，过滤掉前端误传的全集资产，
    // 并按分镜关联顺序排序、对图片类资产截断到模型上限(seedance 2.0 等多参模型为 9 张)。
    // 这样提示词里的 @图片N 编号自然 ≤ 上限，且与发往模型的 referenceList 顺序一致。
    {
      const MAX_IMAGE_REFS = 9;
      const trackStoryboards = await u.db("o_storyboard").where({ trackId, projectId }).select("id");
      const trackStoryboardIds = trackStoryboards.map((s: any) => s.id).filter((id: any) => typeof id === "number");
      if (trackStoryboardIds.length) {
        const trackAssetRows = await u
          .db("o_assets2Storyboard")
          .whereIn("storyboardId", trackStoryboardIds)
          .orderBy("rowid")
          .select("assetId");
        // 去重保序：以分镜关联顺序为准
        const orderedTrackAssetIds = [
          ...new Set(trackAssetRows.map((r: any) => r.assetId).filter((id: any) => typeof id === "number")),
        ];
        const assetById = new Map<number, any>(assets.map((a) => [a.id, a]));
        // 仅保留白名单内、且本次确实查到资产数据的项，按分镜关联顺序排列
        const scopedAssets = orderedTrackAssetIds
          .map((id) => assetById.get(id))
          .filter((a): a is any => Boolean(a));

        // 音频资产不占用图片参考槽位，单独保留；图片类(role/scene/tool 等)截断到上限
        const audioAssets = scopedAssets.filter((a) => a.type === "audio");
        const imageAssets = scopedAssets.filter((a) => a.type !== "audio");
        const cappedImageAssets = imageAssets.slice(0, MAX_IMAGE_REFS);
        if (imageAssets.length > MAX_IMAGE_REFS) {
          console.warn(
            `[generateVideoPrompt] 轨道 ${trackId} 图片参考资产 ${imageAssets.length} 个，超过上限 ${MAX_IMAGE_REFS}，已截断`,
          );
        }
        const droppedByWhitelist = assets.length - scopedAssets.length;
        if (droppedByWhitelist > 0) {
          console.warn(
            `[generateVideoPrompt] 轨道 ${trackId} 前端传入资产 ${assets.length} 个，按分镜白名单裁剪后保留 ${scopedAssets.length} 个`,
          );
        }
        // 用裁剪后的结果替换 assets（保持后续逻辑不变）
        assets.length = 0;
        assets.push(...cappedImageAssets, ...audioAssets);
      }
    }

    // 分镜内容(videoDesc/duration)始终以本轨道在 DB 中的记录为权威来源，
    // 不信任前端传入的分镜 id —— 避免前端传错/传旧 id 导致 videoDesc='undefined'。
    {
      const trackStoryboardRows = await u
        .db("o_storyboard")
        .where({ trackId, projectId })
        .orderBy("index", "asc")
        .select("videoDesc", "duration", "prompt", "track", "shouldGenerateImage");
      if (trackStoryboardRows.length) {
        const rebuilt = trackStoryboardRows.map((sb: any) => ({
          videoDesc: sb.videoDesc,
          prompt: sb.prompt,
          track: sb.track,
          duration: sb.duration,
          shouldGenerateImage: sb.shouldGenerateImage,
        }));
        // 若 DB 与前端传入的分镜内容不一致(数量或首条 videoDesc)，记录后以 DB 为准
        const frontInvalid =
          storyboard.length !== rebuilt.length ||
          storyboard.some((s) => s.videoDesc == null || s.videoDesc === "undefined");
        if (frontInvalid) {
          console.warn(
            `[generateVideoPrompt] 轨道 ${trackId} 前端分镜信息无效或不一致(${storyboard.length}条)，已按 DB 重建为 ${rebuilt.length} 条`,
          );
        }
        storyboard.length = 0;
        storyboard.push(...rebuilt);
      }
    }

    const assetsNotAudioIds = assets.filter((i) => i.type == "audio").map((i) => i.id);

    const assets2Audio = await u
      .db("o_assets")
      .whereIn("o_assets.id", assetsNotAudioIds)
      .join("o_assetsRole2Audio", "o_assetsRole2Audio.assetsAudioId", "o_assets.assetsId")
      .select("o_assets.assetsId", "o_assets.id", "o_assetsRole2Audio.assetsAudioId", "o_assetsRole2Audio.assetsRoleId");

    const assetsAudioRecord: Record<number, number> = {};
    assets2Audio.forEach((i) => {
      assetsAudioRecord[i.assetsRoleId!] = i.id!;
    });

    const [id, modelData] = model.split(/:(.+)/);
    const projectData = await u.db("o_project").select("*").where({ id: projectId }).first();
    const videoPromptGeneration = await resolveVideoModelPrompt({ vendorId: id, model: modelData, mode });
    const promptUsageId = await recordPromptUsage({
      effectivePrompt: videoPromptGeneration,
      modelName: await u.Ai.resolveModelName("universalAi").catch(() => "universalAi"),
      relatedType: "videoTrack:generatePrompt",
      relatedId: trackId,
      meta: { projectId, model, mode },
    });

    const artStyle = projectData?.artStyle || "无";

    const visualManual = u.getArtPrompt(artStyle, "art_skills", "art_storyboard_video");
    const content = `
          **模型名称**：${modelData},

          **资产信息**（角色、场景、道具、音频):${assets
            .filter((i) => i.filePath)
            .map((i) => `[${i.id},${i.type},${i.name} ${assetsAudioRecord[i.id] ? `audio:${assetsAudioRecord[i.id]}` : ""} ] `)
            .join("，")},
          **分镜信息**：${storyboard.map(
            (i) => `<storyboardItem
  videoDesc='${i.videoDesc}'
  duration='${i.duration}'
></storyboardItem>`,
          )},
          `;

    try {
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
      await u.db("o_videoTrack").where({ id: trackId }).update({
        state: "已完成",
        prompt: text,
      });
      await recordGenerationArtifact({
        projectId,
        artifactType: "videoPrompt",
        targetType: "o_videoTrack",
        targetId: trackId,
        targetField: "prompt",
        title: `视频轨道 ${trackId} 提示词`,
        content: text,
        effectivePrompt: videoPromptGeneration,
        promptUsageId,
        modelName: await u.Ai.resolveModelName("universalAi").catch(() => "universalAi"),
        meta: { model, mode, storyboardCount: storyboard.length, assetCount: assets.length },
      });
      res.status(200).send(success(text));
    } catch (e) {
      await u
        .db("o_videoTrack")
        .where({ id: trackId })
        .update({
          state: "生成失败",
          reason: u.error(e).message,
        });
      res.status(400).send(error(u.error(e).message));
    }
  },
);
