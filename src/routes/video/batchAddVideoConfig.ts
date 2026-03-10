import express from "express";
import u from "@/utils";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
const router = express.Router();

const imageItemSchema = z
  .object({
    id: z.number(),
    filePath: z.string(),
    prompt: z.string().optional(),
  })
  .nullable();

export default router.post(
  "/",
  validateFields({
    scriptId: z.number(),
    projectId: z.number(),
    configId: z.number(),
    mode: z.enum(["startEnd", "multi", "single", "text", ""]),
    resolution: z.string(),
    audioEnabled: z.boolean(),
    storyboardIds: z.array(z.number()).min(1),
    endFrame: imageItemSchema.optional(),
    images: z
      .array(
        z.object({
          id: z.number(),
          filePath: z.string(),
          prompt: z.string().optional(),
        }),
      )
      .optional(),
    prompt: z.string().optional(),
  }),
  async (req, res) => {
    const { scriptId, projectId, configId, mode, resolution, audioEnabled, storyboardIds, endFrame, images, prompt } = req.body;

    const configData = await u.db("t_config").where("id", configId).first();
    if (!configData) {
      return res.status(500).send(error("不存在的模型"));
    }

    const storyboards = await u
      .db("t_assets")
      .whereIn("id", storyboardIds)
      .where("scriptId", scriptId)
      .where("type", "分镜")
      .select("id", "name", "filePath", "duration", "videoPrompt", "segmentId", "shotIndex");

    if (storyboards.length === 0) {
      return res.status(400).send(error("未找到有效的分镜数据"));
    }

    const maxIdResult: any = await u.db("t_videoConfig").max("id as maxId").first();
    let nextId = (maxIdResult?.maxId || 0) + 1;
    const now = Date.now();

    const insertedConfigs: any[] = [];

    for (const storyboard of storyboards) {
      let startFrame = null;
      if (mode === "startEnd") {
        const storyboardImage = await u.db("t_image").where("assetsId", storyboard.id).where("type", "分镜").first();
        if (storyboardImage || storyboard.filePath) {
          const imagePath = storyboardImage?.filePath || storyboard.filePath || "";
          startFrame = {
            id: storyboardImage?.id || storyboard.id,
            filePath: await u.oss.getFileUrl(imagePath),
            prompt: storyboard.videoPrompt || storyboard.name || "",
          };
        }
      }

      const duration = storyboard.duration ? parseFloat(storyboard.duration) : 5;

      await u.db("t_videoConfig").insert({
        id: nextId,
        scriptId,
        projectId,
        manufacturer: configData.manufacturer,
        aiConfigId: configId,
        mode,
        startFrame: startFrame ? JSON.stringify(startFrame) : null,
        endFrame: endFrame ? JSON.stringify(endFrame) : null,
        images: images ? JSON.stringify(images) : null,
        resolution,
        duration,
        prompt: prompt || storyboard.videoPrompt || "",
        selectedResultId: null,
        storyboardId: storyboard.id,
        createTime: now,
        updateTime: now,
        audioEnabled: audioEnabled ? 1 : 0,
      });

      insertedConfigs.push({
        id: nextId,
        scriptId,
        projectId,
        manufacturer: configData.manufacturer,
        aiConfigId: configId,
        model: configData.model,
        mode,
        startFrame,
        endFrame,
        images: images || [],
        resolution,
        duration,
        prompt: prompt || storyboard.videoPrompt || "",
        selectedResultId: null,
        createdAt: new Date(now).toISOString(),
        audioEnabled,
        storyboardId: storyboard.id,
        storyboardName: storyboard.name,
      });

      nextId++;
    }

    res.status(200).send(
      success({
        message: `成功批量创建 ${insertedConfigs.length} 个视频配置`,
        data: insertedConfigs,
      }),
    );
  },
);