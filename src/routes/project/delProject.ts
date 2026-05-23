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

    await u.db.transaction(async (trx) => {
      // 删除项目
      await trx("o_project").where("id", id).delete();
      await trx("o_agentWorkData").where("projectId", id).delete();
      // 删除项目下的原文
      await trx("o_novel").where("projectId", id).delete();
      // 删除项目下的剧本信息
      const scriptData = await trx("o_script").where("projectId", id).select("id");
      const scriptIds = scriptData.map((item: any) => item.id);
      if (scriptIds.length > 0) {
        await trx("o_scriptAssets").whereIn("scriptId", scriptIds).delete();
      }
      await trx("o_script").where("projectId", id).delete();
      // 删除项目下的任务
      await trx("o_tasks").where("projectId", id).delete();
      // 删除项目下的分镜
      const storyboardData = await trx("o_storyboard").where("projectId", id).select("id");
      const storyboardIds = storyboardData.map((item: any) => item.id);
      if (storyboardIds.length > 0) {
        await trx("o_assets2Storyboard").whereIn("storyboardId", storyboardIds).delete();
      }
      await trx("o_storyboard").where("projectId", id).delete();
      // 删除需要删除资产的归属图片
      const assetsData = await trx("o_assets").where("projectId", id).select("id");
      const assetsIds = assetsData.map((item: any) => item.id);
      if (assetsIds.length > 0) {
        // 先将 o_assets.imageId 置空，解除对 o_image 的外键引用
        await trx("o_assets").whereIn("id", assetsIds).update({ imageId: null });
        await trx("o_image").whereIn("assetsId", assetsIds).delete();
      }
      // 删除项目下的资产
      await trx("o_assets").where("projectId", id).delete();
      // 删除项目下的视频轨道和视频
      await trx("o_videoTrack").where("projectId", id).delete();
      await trx("o_video").where("projectId", id).delete();
      // 删除项目下的资源
      await trx("memories").where("isolationKey", "like", `${id}:%`).delete();
    });

    try {
      await u.oss.deleteDirectory(`${id}/`);
      console.log(`项目 ${id} 的OSS文件夹删除成功`);
    } catch (error: any) {
      console.log(`项目 ${id} 没有对应的OSS文件夹，跳过删除`);
    }

    res.status(200).send(success({ message: "删除项目成功" }));
  },
);
