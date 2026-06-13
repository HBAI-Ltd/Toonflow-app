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

/** 查询剧集的整集拼接记录（按创建时间倒序） */
export default router.post(
  "/",
  validateFields({
    projectId: z.number().int(),
    scriptId: z.number().int(),
  }),
  async (req, res) => {
    const { projectId, scriptId } = req.body as { projectId: number; scriptId: number };
    const rawToken = String(req.headers.authorization || req.query.token || "");
    const rows = await u.db("o_episodeMerge").where({ projectId, scriptId }).orderBy("createTime", "desc");
    res.status(200).send(
      success(
        await Promise.all(
          rows.map(async (row) => ({
            id: row.id,
            state: row.state,
            filePath: row.filePath,
            fileUrl: row.filePath ? appendToken(await u.oss.getFileUrl(row.filePath), rawToken) : null,
            duration: row.duration,
            errorReason: row.errorReason,
            createTime: row.createTime,
          })),
        ),
      ),
    );
  },
);
