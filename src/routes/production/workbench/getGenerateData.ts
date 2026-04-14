import express from "express";
import { z } from "zod";

import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import db from "@/utils/db";
import u from "@/utils";

const router = express.Router();

interface VideoItem {
 id: number;
 src: string;
 state: "未生成" | "生成中" | "已完成" | "生成失败";
}

interface TrackMedia {
 src: string;
 id?: number;
 fileType: "image" | "video" | "audio";
 videoDesc?: string;
}

interface TrackItem {
 id?: number;
 prompt: string;
 state: "未生成" | "生成中" | "已完成" | "生成失败";
 reason?: string;
 duration?: number;
 selectVideoId?: number | null;
 medias: TrackMedia[];
 videoList: VideoItem[];
}

router.post(
 "/",
 validateFields({
  projectId: z.number(),
  scriptId: z.number(),
 }),
 async (req, res) => {
  const { projectId, scriptId } = req.body;

  const projectData = await db("o_project").where("id", projectId).select("id", "videoModel").first();
  if (!projectData?.videoModel) {
   return res.status(400).json(success("项目未配置视频模型"));
  }

  const [videoId, videoModelName] = projectData.videoModel.split(":");
  const models = await u.vendor.getModelList(videoId);
  const findData = models.find((item: any) => item.modelName === videoModelName);
  if (!findData?.mode) {
   return res.status(400).json(success("项目配置的视频模型不存在"));
  }

  const isRef = findData.mode.every((item: any) => Array.isArray(item));

  const storyboardList = await db("o_storyboard").where({ scriptId, projectId }).orderBy("index", "asc");
  await Promise.all(
   storyboardList.map(async (item) => {
    item.filePath = item.filePath ? await u.oss.getFileUrl(item.filePath) : "";
   }),
  );

  const storyboardTrackRecord: Record<number, Array<any>> = {};
  storyboardList.forEach((item) => {
   const trackId = item.trackId;
   if (trackId == null) return;

   const mediaItem = {
    src: item.filePath,
    fileType: "image" as const,
    sources: "storyboard",
    ...(item.prompt != null ? { prompt: item.videoDesc } : {}),
    ...(item.id != null ? { id: item.id } : {}),
    index: item.index,
   };

   if (storyboardTrackRecord[trackId]) {
    storyboardTrackRecord[trackId].push(mediaItem);
    return;
   }

   storyboardTrackRecord[trackId] = [mediaItem];
  });

  const otherDataMap: Record<number, Array<any>> = {};
  if (isRef && storyboardList.length > 0) {
   const storyIds = storyboardList.map((storyboard) => storyboard.id).filter((id): id is number => id != null);
   const assetDatas = await db("o_assets2Storyboard")
    .leftJoin("o_assets", "o_assets2Storyboard.assetId", "o_assets.id")
    .leftJoin("o_image", "o_image.id", "o_assets.imageId")
    .whereIn("o_assets2Storyboard.storyboardId", storyIds)
    .select("o_assets.*", "o_image.filePath", "o_assets2Storyboard.storyboardId");

   await Promise.all(
    assetDatas.map(async (item) => {
     const assetItem = {
      id: item.id,
      name: item.name,
      describe: item.describe,
      type: item.type,
      fileType: "image" as const,
      sources: "assets",
      src: item.filePath ? await u.oss.getFileUrl(item.filePath) : "",
     };

     const storyboardId = item.storyboardId as number;
     if (!otherDataMap[storyboardId]) {
      otherDataMap[storyboardId] = [];
     }
     otherDataMap[storyboardId].push(assetItem);
    }),
   );
  }

  const trackData = await db("o_videoTrack").where({ projectId, scriptId });
  const trackIds = trackData.map((track) => track.id).filter((id): id is number => id != null);
  const videoList = trackIds.length > 0 ? await db("o_video").whereIn("videoTrackId", trackIds) : [];
  const trackList: TrackItem[] = [];
  const trackIdMap = [...new Set(trackIds)];

  for (const trackId of trackIdMap) {
   const item = trackData.find((track) => track.id === trackId);
   trackList.push({
    id: trackId,
    duration: item?.duration ?? 0,
    prompt: item?.prompt || "",
    state: (item?.state as "未生成" | "生成中" | "已完成" | "生成失败") ?? "未生成",
    reason: item?.reason ?? "",
    selectVideoId: item?.selectVideoId ?? null,
    medias: (() => {
     const storyboardMedias = storyboardTrackRecord[trackId] ?? [];
     const assetMedias = storyboardMedias.flatMap((storyboard) => otherDataMap[storyboard.id] ?? []);
     const seenAssetIds = new Set();
     const uniqueAssets = assetMedias.filter((asset) => {
      if (seenAssetIds.has(asset.id)) return false;
      seenAssetIds.add(asset.id);
      return true;
     });

     const hasImageAssetData = uniqueAssets.filter((asset) => asset.src);
     const notHasImageAssetData = uniqueAssets.filter((asset) => !asset.src);
     return [...hasImageAssetData, ...storyboardMedias, ...notHasImageAssetData];
    })(),
    videoList: await Promise.all(
     videoList
      .filter((video) => video.videoTrackId === trackId)
      .map(async (video) => ({
       id: video.id!,
       src: video.filePath ? await u.oss.getFileUrl(video.filePath) : "",
       state:
        video.state === "已完成"
         ? "已完成"
         : video.state === "生成中"
           ? "生成中"
           : video.state === "生成失败"
             ? "生成失败"
             : "未生成",
      })),
    ),
   });
  }

  res.status(200).send(
   success({
    storyboardList: await Promise.all(
     storyboardList.map(async (storyboard) => ({
      ...storyboard,
      src: storyboard.filePath,
     })),
    ),
    trackList,
   }),
  );
 },
);

export default router;
