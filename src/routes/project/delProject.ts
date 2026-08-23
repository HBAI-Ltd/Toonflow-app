import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();

// 删除项目
export default router.post(
  "/",
  validateFields({
    id: z.number(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { id } = req.body;
    //删除项目
    await u.db("o_project").where("id", id).delete();
    await u.db("o_agentWorkData").where("projectId", id).delete();
    //删除项目下的原文
    await u.db("o_novel").where("projectId", id).delete();
    // 删除项目下的剧本信息
    const scriptData = await u.db("o_script").where("projectId", id).select("id");
    const scriptIds = scriptData.map((item: any) => item.id);
    if (scriptIds && scriptIds.length > 0) {
      await u.db("o_scriptAssets").whereIn("scriptId", scriptIds).delete();
    }
    await u.db("o_script").where("projectId", id).delete();
    // 删除项目下的任务
    await u.db("o_tasks").where("projectId", id).delete();
    // 删除项目下的分镜
    const storyboardData = await u.db("o_storyboard").where("projectId", id).select("id");
    const storyboardIds = storyboardData.map((item: any) => item.id);
    if (storyboardIds.length > 0) {
      await u.db("o_assets2Storyboard").whereIn("storyboardId", storyboardIds).delete();
    }
    await u.db("o_storyboard").where("projectId", id).delete();
    //删除需要删除资产的归属图片
    const assetsData = await u.db("o_assets").where("projectId", id).select("id");
    const assetsIds = assetsData.map((item: any) => item.id);
    if (assetsIds && assetsIds.length > 0) {
      // 先将 o_assets.imageId 置空，解除对 o_image 的外键引用
      await u.db("o_assets").whereIn("id", assetsIds).update({ imageId: null });
      await u.db("o_image").whereIn("assetsId", assetsIds).delete();
    }
    // 删除项目下的资产
    await u.db("o_assets").where("projectId", id).delete();
    //删除项目下的视频轨道和视频
    await u.db("o_videoTrack").where("projectId", id).delete();
    await u.db("o_video").where("projectId", id).delete();
    //删除项目下的资源

    await u.db("memories").where("isolationKey", "like", `${id}:%`).delete();

    try {
      await u.oss.deleteDirectory(`${id}/`);
      console.log(t("project.delProject.ossFolderDeletedLog", { id }, locale));
    } catch (error: any) {
      console.log(t("project.delProject.ossFolderMissingLog", { id }, locale));
    }

    res.status(200).send(success({ message: t("project.delProject.deleted", {}, locale) }));
  },
);
