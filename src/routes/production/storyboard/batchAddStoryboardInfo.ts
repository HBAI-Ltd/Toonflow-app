import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();
export default router.post(
  "/",
  validateFields({
    data: z.array(
      z.object({
        prompt: z.string(),
        duration: z.number(),
        track: z.string(),
        state: z.string(),
        src: z.string().nullable(),
        videoDesc: z.string(),
        shouldGenerateImage: z.number(),
        associateAssetsIds: z.array(z.number()),
      }),
    ),
    scriptId: z.number(),
    projectId: z.number(),
  }),
  async (req, res) => {
    const { data, scriptId, projectId } = req.body;
    const locale = await getLocale(req as any);
    if (!data.length) return res.status(400).send({ success: false, message: t("production.storyboard.batchAddStoryboardInfo.dataEmpty", {}, locale) });
    for (const item of data) {
      const [id] = await u.db("o_storyboard").insert({
        prompt: item.prompt,
        duration: String(item.duration),
        state: item.state,
        scriptId,
        projectId,
        track: item.track,
        videoDesc: item.videoDesc,
        shouldGenerateImage: item.shouldGenerateImage,
        createTime: Date.now(),
      });
      if (item.associateAssetsIds?.length) {
        await u.db("o_assets2Storyboard").insert(
          item.associateAssetsIds.map((assetId: number) => ({
            assetId,
            storyboardId: id,
          })),
        );
      }
      item.id = id;
    }
    const lastStoryboard = await u.db("o_storyboard").where("scriptId", scriptId);
    if (!lastStoryboard || !lastStoryboard.length) return res.status(400).send(error(t("production.storyboard.common.notFound", {}, locale)));
    //根据track分组
    const storyboardGroupByTrack: Record<string, number[]> = {};
    lastStoryboard.forEach((item: any) => {
      if (!storyboardGroupByTrack[item.track]) {
        storyboardGroupByTrack[item.track] = [];
      }
      storyboardGroupByTrack[item.track].push(item.id);
    });

    //循环：先查询数据库中是否已存在相同track名称的trackId，有则复用，没有则新建
    for (const track in storyboardGroupByTrack) {
      const storyboardIds = storyboardGroupByTrack[track] ?? [];

      // 计算该track下所有分镜的duration总和
      const trackDuration = lastStoryboard
        .filter((item: any) => item.track == track)
        .reduce((sum: number, item: any) => sum + Number(item.duration), 0);

      // 查找该scriptId下是否已有相同track名称且已分配trackId的分镜记录
      const existingStoryboard = await u.db("o_storyboard").where({ scriptId, track }).whereNotNull("trackId").first();

      let trackId: number;
      if (existingStoryboard?.trackId) {
        // 已存在相同track名称的trackId，直接复用，并更新duration
        trackId = existingStoryboard.trackId;
        await u.db("o_videoTrack").where("id", trackId).update({ duration: trackDuration });
      } else {
        // 不存在，新建videoTrack
        const newTrackId = Date.now()
        await u.db("o_videoTrack").insert({
          id: newTrackId,
          scriptId,
          projectId,
          duration: trackDuration,
        });
        trackId = newTrackId;
      }

      await u.db("o_storyboard").whereIn("id", storyboardIds).update({ trackId });
    }

    const storyboardData = await Promise.all(
      lastStoryboard.map(async (i) => {
        return {
          associateAssetsIds: await u.db("o_assets2Storyboard").where("storyboardId", i.id).orderBy("rowid").select("assetId").pluck("assetId"),
          src: i.filePath ? await u.oss.getSmallImageUrl(i.filePath) : "",
          id: i.id,
          trackId: i.trackId,
          prompt: i.prompt,
          duration: Number(i.duration),
          state: i.state,
          scriptId: i.scriptId,
          reason: i.reason,
          videoDesc: i.videoDesc
        };
      }),
    );
    return res.status(200).send(success(storyboardData));
  },
);
