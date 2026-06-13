import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { enqueueJob } from "@/utils/genQueue";
import type { MergeEpisodePayload } from "@/utils/composeHandlers";
const router = express.Router();

/**
 * 整集拼接导出：按分镜顺序拼接各镜头视频（合成成片优先，否则取轨道选定视频）
 */
export default router.post(
  "/",
  validateFields({
    projectId: z.number().int(),
    scriptId: z.number().int(),
  }),
  async (req, res) => {
    const { projectId, scriptId } = req.body as { projectId: number; scriptId: number };

    const storyboardCount = await u.db("o_storyboard").where({ scriptId, projectId }).count<{ c: number }[]>("id as c");
    if (Number(storyboardCount[0]?.c ?? 0) === 0) return res.status(400).send(error("该剧集没有分镜数据"));

    // 同一剧集仅允许一个进行中的拼接任务
    const running = await u.db("o_episodeMerge").where({ projectId, scriptId, state: "拼接中" }).first();
    if (running) return res.status(400).send(error("该剧集已有拼接任务进行中"));

    const [mergeId] = await u.db("o_episodeMerge").insert({
      projectId,
      scriptId,
      state: "拼接中",
      createTime: Date.now(),
    });

    const payload: MergeEpisodePayload = { mergeId, projectId, scriptId };
    await enqueueJob({
      projectId,
      kind: "mergeEpisode",
      payload: payload as unknown as Record<string, unknown>,
      vendorId: "ffmpeg",
    });

    res.status(200).send(success({ mergeId, message: "整集拼接任务已加入队列" }));
  },
);
