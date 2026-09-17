import express from "express";
import u from "@/utils";
import pLimit from "p-limit";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import fs from "fs/promises";
import path from "path";
const router = express.Router();

function resolveSelectedFilePath(src: string | undefined, fallback: string | undefined) {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return fallback;
  try {
    const pathname = decodeURIComponent(new URL(src, "http://localhost").pathname);
    if (!pathname.startsWith("/oss/")) return fallback;
    const selected = pathname.slice(4);
    return selected.includes("..") ? fallback : selected;
  } catch {
    return fallback;
  }
}

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    trackData: z.array(
      z.object({
        trackId: z.number(),
        duration: z.number().positive().optional(),
        info: z.array(
          z.object({
            id: z.number(),
            sources: z.string(),
            src: z.string().optional(),
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

        if (modelLower.includes("minimax") && modelLower.includes("h3")) {
          // MiniMax H3 单图生视频：首帧必须以本地视觉模型分析为准
          fileName = "minimaxH3ImageAware.md";
        } else if (modelLower.includes("wan") && modelLower.includes("2.6")) {
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
      const tasks = trackData.map((track: { trackId: number; duration?: number; info: { id: number; sources: string; src?: string }[] }) =>
        limit(async () => {
          if (track.duration != null) {
            await u.db("o_videoTrack").where({ id: track.trackId }).update({ duration: track.duration });
          }
          // 查询参数
          const images = await Promise.all(
            track.info.map(async (item: { id: number; sources: string; src?: string }) => {
              if (item.sources === "storyboard") {
                // 查询分镜主信息
                const storyboard = await u
                  .db("o_storyboard")
                  .where("o_storyboard.id", item.id)
                  .select("id", "filePath", "videoDesc", "prompt", "track", "duration", "shouldGenerateImage")
                  .first();
                // 查询分镜关联的资产ID
                const assetRows = await u.db("o_assets2Storyboard").where("storyboardId", item.id).orderBy("rowid").select("assetId");
                const associateAssetsIds = assetRows.map((row: any) => row.assetId);
                return {
                  ...storyboard,
                  filePath: resolveSelectedFilePath(item.src, storyboard?.filePath),
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
                  filePath: resolveSelectedFilePath(item.src, assetsData?.filePath),
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
                id: item.id,
                filePath: item.filePath,
                videoDesc: item.videoDesc,
                prompt: item.prompt,
                track: item.track,
                duration: item.duration,
                associateAssetsIds: item.associateAssetsIds,
                shouldGenerateImage: item.shouldGenerateImage,
              });
          }

          const videoTrackData = await u.db("o_videoTrack").select("duration").where({ id: track.trackId }).first();
          const requestedDuration = Number(track.duration);
          const selectedDuration = Number(videoTrackData?.duration);
          const effectiveDuration = Number.isFinite(requestedDuration) && requestedDuration > 0
            ? requestedDuration
            : Number.isFinite(selectedDuration) && selectedDuration > 0
              ? selectedDuration
              : Number(storyboard[0]?.duration) || 5;

          const selectedImages = images.filter(
            (item: any) => item?.filePath && /\.(?:jpe?g|png|webp|bmp|gif|tiff?)$/i.test(item.filePath),
          );
          console.log(
            `[videoPromptSource] batch trackId=${track.trackId} mode=${mode} duration=${effectiveDuration} info=${JSON.stringify(track.info)} images=${JSON.stringify(
              selectedImages.map((item: any) => ({ id: item.id, source: item._type, filePath: item.filePath })),
            )}`,
          );
          const selectedImageInputs = await Promise.all(
            selectedImages.map(async (item: any, index: number) => ({
              index: index + 1,
              source: item._type,
              id: item.id,
              image: await u.oss.getImageBase64(item.filePath),
            })),
          );

          const content = `
          **模型名称**：${modelData},

          **当前所选图片（首帧事实，最高优先级）**：本消息附带 ${selectedImageInputs.length} 张图片，顺序如下：
          ${selectedImageInputs.map((i) => `<selectedImage index="${i.index}" source="${i.source}" id="${i.id}" />`).join("\n")}

          **硬性要求**：必须直接观察本消息附带的当前图片，并以图片为首帧依据。分镜文字只用于推导图片之后的合理动作和台词；不得把图片中看不到的人物、姿势或道具写成首帧已有内容；不得复用其他图片的提示词。

          **用户当前选择的视频总时长（最高优先级）**：${effectiveDuration} 秒。输出中的动作时间轴必须从 0s 完整覆盖到 ${effectiveDuration}s，结尾必须明确写到 ${effectiveDuration}s。分镜原始描述里若出现 3s、4s 等其他时长，全部忽略，不得据此缩短提示词。

          **资产信息**（角色、场景、道具、音频):${assets
            .filter((i: any) => i.filePath)
            .map((i: any) => `[${i.id},${i.type},${i.name}]`)
            .join("，")},
          **分镜信息**：${storyboard.map(
            (i: any) => `<storyboardItem
  videoDesc='${i.videoDesc}'
  duration='${effectiveDuration}'
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
                  content: [
                    { type: "text" as const, text: content },
                    ...selectedImageInputs.map((item) => {
                      const match = item.image.match(/^data:([^;]+);base64,(.+)$/s);
                      if (!match) throw new Error("所选图片不是有效的 base64 Data URL");
                      return { type: "image" as const, image: Buffer.from(match[2], "base64"), mediaType: match[1] };
                    }),
                  ],
                },
              ],
            });
            const cleanText = text
              .trim()
              .replace(/^```(?:text)?\s*/i, "")
              .replace(/\s*```$/, "")
              .trim();

            await u.db("o_videoTrack").where({ id: track.trackId }).update({
              prompt: cleanText,
              state: "已完成",
            });

            return { trackId: track.trackId, text: cleanText };
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
