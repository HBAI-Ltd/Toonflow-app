import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

function appendToken(url: string, rawToken: string): string {
  if (!rawToken) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}token=${encodeURIComponent(rawToken)}`;
}

/** 查询剧集的单镜头合成记录（按创建时间倒序） */
export default router.post(
  "/",
  validateFields({
    projectId: z.number().int(),
    scriptId: z.number().int(),
    trackId: z.number().int().optional(),
  }),
  async (req, res) => {
    const { projectId, scriptId, trackId } = req.body as { projectId: number; scriptId: number; trackId?: number };
    const rawToken = String(req.headers.authorization || req.query.token || "");
    const query = u.db("o_videoCompose").where({ projectId, scriptId });
    if (trackId != null) query.where("trackId", trackId);
    const rows = await query.orderBy("createTime", "desc");
    res.status(200).send(
      success(
        await Promise.all(
          rows.map(async (row) => ({
            id: row.id,
            trackId: row.trackId,
            videoId: row.videoId,
            state: row.state,
            filePath: row.filePath,
            fileUrl: row.filePath ? appendToken(await u.oss.getFileUrl(row.filePath), rawToken) : null,
            audioPath: row.audioPath,
            audioUrl: row.audioPath ? appendToken(await u.oss.getFileUrl(row.audioPath), rawToken) : null,
            subtitlePath: row.subtitlePath,
            subtitleUrl: row.subtitlePath ? appendToken(await u.oss.getFileUrl(row.subtitlePath), rawToken) : null,
            dialogue: row.dialogue,
            errorReason: row.errorReason,
            createTime: row.createTime,
          })),
        ),
      ),
    );
  },
);
