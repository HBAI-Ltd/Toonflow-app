import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import fs from "fs/promises";
import path from "path";
import {
  buildSeedance2AssetReferenceContext,
  formatLegacyVideoPromptAssetList,
  isSeedance2Model,
  type VideoPromptAssetReference,
} from "@/lib/videoPromptReferences";
import { getTrackStoryboardsForVideoPrompt } from "@/lib/videoPromptContext";
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
        fileType: z.enum(["image", "video", "audio"]).optional(),
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
    //查询参数
    const images = await Promise.all(
      info
        .filter((item: { sources: string }) => item.sources === "assets")
        .map(async (item: { id: number; sources: string; fileType?: "image" | "video" | "audio" }) => {
          // 查询素材
          const assetsData = await u
            .db("o_assets")
            .leftJoin("o_image", "o_image.id", "o_assets.imageId")
            .where("o_assets.id", item.id)
            .select("o_assets.id", "o_assets.type", "o_assets.name", "o_image.filePath", "o_image.type as storedFileType")
            .first();
          return {
            ...assetsData,
            mediaType: item.fileType ?? assetsData?.storedFileType,
            _type: "assets", // 标记类型
          };
        }),
    );

    // 参考资产由前端选择，剧情分镜始终以当前轨道的数据库记录为准。
    const assets: VideoPromptAssetReference[] = [];
    const storyboard = await getTrackStoryboardsForVideoPrompt(u.db, trackId, projectId);
    if (!storyboard.length) {
      const reason = "当前视频轨道没有可用的分镜文字";
      await u.db("o_videoTrack").where({ id: trackId }).update({ state: "生成失败", reason });
      return res.status(400).send(error(reason));
    }
    for (const item of images) {
      if (!item) continue; // 忽略空
      if (item._type === "assets")
        assets.push({
          id: item.id,
          type: item.type,
          name: item.name,
          filePath: item.filePath,
          mediaType: item.mediaType,
        });
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
      } else if (isSeedance2Model(modelData)) {
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

    const artStyle = projectData?.artStyle || "无";

    const visualManual = u.getArtPrompt(artStyle, "art_skills", "art_storyboard_video");
    const assetContext = isSeedance2Model(modelData)
      ? buildSeedance2AssetReferenceContext(assets, assetsAudioRecord)
      : `**资产信息**（角色、场景、道具、音频）:${formatLegacyVideoPromptAssetList(assets, assetsAudioRecord)}`;
    const content = `
          **模型名称**：${modelData},

          ${assetContext},
          **分镜信息**：${storyboard.map(
            (i) => `<storyboardItem
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
      await u.db("o_videoTrack").where({ id: trackId }).update({
        state: "已完成",
        prompt: text,
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
