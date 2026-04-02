import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

// 删除项目
export default router.post(
  "/",
  validateFields({
    id: z.number(),
  }),
  async (req, res) => {
    const { id } = req.body;

    const scriptData = await u.db("t_script").where("projectId", id).select("id");
    const scriptIds = scriptData.map((item: any) => item.id);

    const assetsData = await u.db("t_assets").where("projectId", id).select("id");
    const assetsIds = assetsData.map((item: any) => item.id);

    const videoData = await u.db("t_video").whereIn("scriptId", scriptIds).select("id");
    const videoIds = videoData.map((item: any) => item.id);

    await u.db("t_project").where("id", id).delete();
    await u.db("t_novel").where("projectId", id).delete();
    await u.db("t_storyline").where("projectId", id).delete();
    await u.db("t_outline").where("projectId", id).delete();
    await u.db("t_myTasks").where("projectId", id).delete();

    await u.db("t_script").where("projectId", id).delete();
    await u.db("t_assets").where("projectId", id).delete();

    const tempAssetsQuery = u.db("t_image").where("projectId", id);
    if (assetsIds.length > 0) {
      tempAssetsQuery.orWhereIn("assetsId", assetsIds);
    }
    if (scriptIds.length > 0) {
      tempAssetsQuery.orWhereIn("scriptId", scriptIds);
    }
    if (videoIds.length > 0) {
      tempAssetsQuery.orWhereIn("videoId", videoIds);
    }
    await tempAssetsQuery.delete();

    await u.db("t_video").whereIn("scriptId", scriptIds).delete();

    await u.db("t_chatHistory").where("projectId", id).delete();

    try {
      await u.oss.deleteDirectory(`${id}/`);
      console.log(`项目 ${id} 的OSS文件夹删除成功`);
    } catch (error: any) {
      console.log(`项目 ${id} 没有对应的OSS文件夹，跳过删除`);
    }

    res.status(200).send(success({ message: "删除项目成功" }));
  },
);
