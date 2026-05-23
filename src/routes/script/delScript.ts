import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

// 删除剧本
export default router.post(
  "/",
  validateFields({
    ids: z.array(z.number()),
  }),
  async (req, res) => {
    const { ids } = req.body;

    const storyboardData = await u.db("o_storyboard").whereIn("scriptId", ids);

    await u.db.transaction(async (trx) => {
      const scriptData = await trx("o_script").whereIn("id", ids);
      if (scriptData && scriptData.length) {
        const scriptProjectId = new Set(scriptData.map((item) => item.projectId));
        await trx("o_agentWorkData").whereIn("projectId", Array.from(scriptProjectId)).whereIn("episodesId", ids).delete();
      }
      if (storyboardData.length) {
        const storyboardIds = storyboardData.map((item) => item.id);
        await trx("o_assets2Storyboard").whereIn("storyboardId", storyboardIds).delete();
      }
      await trx("o_scriptAssets").whereIn("scriptId", ids).delete();
      await trx("o_script").whereIn("id", ids).delete();
      await trx("o_storyboard").whereIn("scriptId", ids).delete();
      await trx("o_video").whereIn("scriptId", ids).delete();
    });

    // OSS 文件删除在事务外执行（不可回滚的外部资源）
    if (storyboardData.length) {
      await Promise.all(
        storyboardData.map(async (item) => {
          try {
            if (item.filePath) await u.oss.deleteFile(item.filePath);
          } catch (e) {
            console.error(`删除分镜文件失败: ${item.filePath}`, e);
          }
        }),
      );
    }

    res.status(200).send(success({ message: "删除剧本成功" }));
  },
);
