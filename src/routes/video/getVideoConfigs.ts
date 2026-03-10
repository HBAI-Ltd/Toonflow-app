import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
const router = express.Router();

// 获取视频配置列表
export default router.post(
  "/",
  validateFields({
    scriptId: z.number(),
  }),
  async (req, res) => {
    const { scriptId } = req.body;

    // 查询该脚本下的所有视频配置
    const configs = await u
      .db("t_videoConfig")
      .leftJoin("t_config", "t_config.id", "t_videoConfig.aiConfigId")
      .leftJoin("t_assets", "t_assets.id", "t_videoConfig.storyboardId")
      .where({ "t_videoConfig.scriptId": scriptId })
      .orderBy("t_assets.segmentId", "asc")
      .orderBy("t_assets.shotIndex", "asc")
      .orderBy("t_videoConfig.createTime", "desc")
      .select("t_videoConfig.*", "t_config.manufacturer as manufacturer", "t_config.model");
    // 解析 JSON 字段
    const result = configs.map((config: any) => ({
      id: config.id,
      scriptId: config.scriptId,
      projectId: config.projectId,
      aiConfigId: config.aiConfigId,
      manufacturer: config.manufacturer,
      model: config.model,
      mode: config.mode,
      startFrame: config.startFrame ? JSON.parse(config.startFrame) : null,
      endFrame: config.endFrame ? JSON.parse(config.endFrame) : null,
      images: config.images ? JSON.parse(config.images) : [],
      resolution: config.resolution,
      duration: config.duration,
      prompt: config.prompt || "",
      selectedResultId: config.selectedResultId,
      storyboardId: config.storyboardId,
      createdAt: config.createTime ? new Date(config.createTime).toISOString() : new Date().toISOString(),
      audioEnabled:!!config.audioEnabled
    }));

    res.status(200).send(success(result));
  },
);