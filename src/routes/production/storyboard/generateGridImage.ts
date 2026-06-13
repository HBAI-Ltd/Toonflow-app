import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { enqueueJob } from "@/utils/genQueue";
import type { GridImagePayload } from "@/utils/composeHandlers";
const router = express.Router();
const MAX_GRID_CELLS = 16;
const MAX_GRID_PROMPT_LENGTH = 8000;
const modelSchema = z.string().regex(/^[A-Za-z0-9_-]+:.+$/, "模型格式必须为 vendor:model");

/**
 * 宫格分镜图生成：一次生成 rows×cols 宫格图再切分到各分镜。
 * 1 次模型调用产出多镜头帧，且宫格内风格/角色天然一致。
 */
export default router.post(
  "/",
  validateFields({
    projectId: z.number().int(),
    scriptId: z.number().int(),
    storyboardIds: z.array(z.number().int()).min(1).max(MAX_GRID_CELLS),
    model: modelSchema,
    prompt: z.string().min(1).max(MAX_GRID_PROMPT_LENGTH),
    rows: z.number().int().min(1).max(4),
    cols: z.number().int().min(1).max(4),
    resolution: z.enum(["1K", "2K", "4K"]).optional(),
    aspectRatio: z.string().regex(/^\d+:\d+$/).optional(),
  }),
  async (req, res) => {
    const { projectId, scriptId, storyboardIds, model, prompt, rows, cols, resolution, aspectRatio } = req.body as {
      projectId: number;
      scriptId: number;
      storyboardIds: number[];
      model: string;
      prompt: string;
      rows: number;
      cols: number;
      resolution?: "1K" | "2K" | "4K";
      aspectRatio?: `${number}:${number}`;
    };

    const uniqueStoryboardIds = [...new Set(storyboardIds)];
    if (uniqueStoryboardIds.length > rows * cols) {
      return res.status(400).send(error(`分镜数（${uniqueStoryboardIds.length}）超过宫格数（${rows * cols}）`));
    }
    const storyboards = await u.db("o_storyboard").whereIn("id", uniqueStoryboardIds).where({ scriptId, projectId });
    if (storyboards.length !== uniqueStoryboardIds.length) return res.status(400).send(error("部分分镜不存在"));

    const vendorId = model.split(/:(.+)/)[0];
    const payload: GridImagePayload = {
      projectId,
      scriptId,
      storyboardIds: uniqueStoryboardIds,
      model,
      prompt,
      rows,
      cols,
      resolution: resolution ?? "2K",
      aspectRatio: (aspectRatio as `${number}:${number}`) ?? "16:9",
    };
    await u.db("o_storyboard").whereIn("id", uniqueStoryboardIds).update({ state: "生成中", reason: null });
    await enqueueJob({
      projectId,
      kind: "gridImage",
      payload: payload as unknown as Record<string, unknown>,
      vendorId,
    });

    res.status(200).send(success({ storyboardIds: uniqueStoryboardIds, message: "宫格分镜图任务已加入队列" }));
  },
);
