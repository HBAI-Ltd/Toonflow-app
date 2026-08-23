import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();

// 获取生成图片
export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    scriptId: z.number().optional(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { projectId, scriptId } = req.body;
    const list = await u
      .db("o_assets")
      .leftJoin("o_image", "o_assets.id", "=", "o_image.assetsId")
      .where("o_assets.type", "clip")
      .andWhere("o_assets.projectId", projectId)
      .select("*");
    const data = await Promise.all(
      list.map(async (item) => ({
        ...item,
        filePath: item.filePath ? await u.oss.getFileUrl(item.filePath) : "",
      })),
    );
    //拿到本地片尾视频并插入到data中
    const ending = await u.oss.getFileUrl("/ending.mp4", "assets");
    data.push({
      id: 0,
      name: t("assets.getMaterialData.endingName", {}, locale),
      filePath: ending,
      type: "clip",
    });
    // 查询视频轨道
    const trackRows = await u
      .db("o_videoTrack")
      .where("o_videoTrack.scriptId", scriptId)
      .andWhere("o_videoTrack.projectId", projectId)
      .select("o_videoTrack.id as trackId","o_videoTrack.videoId");
    // 按轨道分组处理视频
    const video = await Promise.all(
      trackRows.map(async (track) => {
        const videoItems = await u
          .db("o_video")
          .where("o_video.videoTrackId", track.trackId)
          .andWhere("o_video.state", "生成成功") // i18n-ignore — stored o_video.state enum value, not user-facing text
          .select("*");
        const videoList = await Promise.all(
          videoItems.map(async (v) => ({
            id: v.id,
            filePath: v.filePath ? await u.oss.getFileUrl(v.filePath) : "",
            videoTrackId: v.videoTrackId,
          })),
        );
        return {
          id: track.trackId,
          videoId: track.videoId,
          video: videoList,
        };
      }),
    ).then((tracks) => tracks.filter((track) => track.video.length > 0));

    res.status(200).send(success({ data, video }));
  },
);
