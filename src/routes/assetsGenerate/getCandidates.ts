import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";

const router = express.Router();

// 查询资产最新一组抽卡候选图（含状态/打分/选定标记），供前端轮询与选图
export default router.post(
  "/",
  validateFields({
    assetsId: z.number(),
    batchId: z.string().optional(), // 不传则取该资产最新一组
  }),
  async (req, res) => {
    const { assetsId, batchId } = req.body;

    let targetBatchId = batchId as string | undefined;
    if (!targetBatchId) {
      const latest = await u.db("o_image").where("assetsId", assetsId).whereNotNull("batchId").orderBy("id", "desc").select("batchId").first();
      targetBatchId = latest?.batchId ?? undefined;
    }
    if (!targetBatchId) return res.status(200).send(success({ batchId: null, candidates: [] }));

    const rows = await u
      .db("o_image")
      .where("assetsId", assetsId)
      .where("batchId", targetBatchId)
      .orderBy("id", "asc")
      .select("id", "state", "filePath", "score", "scoreReason", "selected", "errorReason");

    const candidates = await Promise.all(
      rows.map(async (row) => ({
        imageId: row.id,
        state: row.state,
        path: row.filePath ? await u.oss.getSmallImageUrl(row.filePath) : null,
        score: row.score ?? null,
        scoreReason: row.scoreReason ?? null,
        selected: row.selected === 1,
        errorReason: row.errorReason ?? null,
      })),
    );

    const finished = candidates.every((c) => c.state !== "生成中");
    return res.status(200).send(success({ batchId: targetBatchId, finished, candidates }));
  },
);
