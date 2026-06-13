import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
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
  selectVideoId?: number;
  medias: TrackMedia[];
  videoList: VideoItem[];
}

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    scriptId: z.number(),
  }),
  async (req, res) => {
    const { projectId, scriptId } = req.body;
    const projectData = await u.db("o_project").where("id", projectId).select("id", "videoModel", "mode").first();

    if (!projectData?.videoModel) {
      return res.status(400).json(success("项目未配置视频模型"));
    }
    let videoMode = "";
    try {
      videoMode = JSON.parse(projectData?.mode ?? "");
    } catch (e) {
      videoMode = projectData?.mode ?? "";
    }
    const isRef = Array.isArray(videoMode) ? true : false;

    const storyboardList = await u.db("o_storyboard").where({ scriptId, projectId }).orderBy("index", "asc");
    await Promise.all(
      storyboardList.map(async (i) => {
        i.filePath = i.filePath ? await u.oss.getSmallImageUrl(i.filePath) : "";
      }),
    );
    const storyboardTrackRecord: Record<number, any[]> = {};
    storyboardList.forEach((i) => {
      if (storyboardTrackRecord[i.trackId!]) {
        storyboardTrackRecord[i.trackId!].push({
          src: i.filePath,
          fileType: "image",
          sources: "storyboard",
          ...(i.prompt != null ? { prompt: i.videoDesc } : {}),
          ...(i.id != null ? { id: i.id } : {}),
          index: i.index,
        });
      } else {
        storyboardTrackRecord[i.trackId!] = [
          {
            src: i.filePath,
            fileType: "image",
            sources: "storyboard",
            ...(i.prompt != null ? { prompt: i.videoDesc } : {}),
            ...(i.id != null ? { id: i.id } : {}),
            index: i.index,
          },
        ];
      }
    });
    // 按 storyboardId 分组的资产数据，key 为 storyboardId
    const otherDataMap: Record<number, any[]> = {};
    // 解析 videoMode 中 audioReference 的数量，例如 'audioReference:3' => 3
    const audioReferenceCount = (() => {
      if (!Array.isArray(videoMode)) return 0;
      const item = (videoMode as string[]).find((v) => v.toLowerCase().startsWith("audioreference:"));
      if (!item) return 0;
      const num = parseInt(item.split(":")[1], 10);
      return isNaN(num) ? 0 : num;
    })();
    if (isRef) {
      const storyIds = storyboardList.map((s) => s.id);

      const assetDatas = await u
        .db("o_assets2Storyboard")
        .leftJoin("o_assets", "o_assets2Storyboard.assetId", "o_assets.id")
        .leftJoin("o_image", "o_image.id", "o_assets.imageId")
        .whereIn("o_assets2Storyboard.storyboardId", storyIds as number[])
        .select("o_assets.*", "o_image.filePath", "o_assets2Storyboard.storyboardId");

      const queryAudioIds = [...assetDatas.map((i) => i.id!), ...assetDatas.map((i) => i.assetsId!)].filter(Boolean);
      const assets2AudioData = await u
        .db("o_assetsRole2Audio")
        .leftJoin("o_assets", "o_assets.assetsId", "o_assetsRole2Audio.assetsAudioId")
        .leftJoin("o_image", "o_image.id", "o_assets.imageId")
        .whereIn("o_assetsRole2Audio.assetsRoleId", queryAudioIds)
        .select(
          "o_assets.id",
          "o_assets.name",
          "o_assetsRole2Audio.assetsRoleId",
          "o_assets.describe",
          "o_assets.type",
          "o_assets.prompt",
          "o_image.filePath",
        );
      const audioRecord: Record<string, any> = {};
      await Promise.all(
        assets2AudioData.map(async (i) => {
          if (!audioRecord[i.assetsRoleId]) audioRecord[i.assetsRoleId] = [];
          audioRecord[i.assetsRoleId].push({
            id: i.id,
            name: i.name,
            describe: i.describe,
            type: i.type,
            fileType: "audio" as const,
            sources: "assets",
            prompt: i.prompt,
            src: i.filePath ? await u.oss.getFileUrl(i.filePath) : "",
          });
        }),
      );

      await Promise.all(
        assetDatas.map(async (i) => {
          const item = {
            id: i.id,
            name: i.name,
            describe: i.describe,
            type: i.type,
            fileType: "image" as const,
            sources: "assets",
            src: i.filePath ? await u.oss.getSmallImageUrl(i.filePath) : "",
          };
          const sid = i.storyboardId as number;
          if (!otherDataMap[sid]) otherDataMap[sid] = [];
          otherDataMap[sid].push(item);
          if (audioRecord[i.id]) otherDataMap[sid].push(...audioRecord[i.id]);
          if (audioRecord[i.assetsId]) otherDataMap[sid].push(...audioRecord[i.assetsId]);
        }),
      );
    }

    const trackData = await u.db("o_videoTrack").where({ projectId, scriptId });
    const videoList = await u.db("o_video").whereIn(
      "videoTrackId",
      trackData.map((t) => t.id),
    );
    const trackList: TrackItem[] = [];
    // 轨道顺序严格跟随分镜表：按「每条轨道下最小分镜 index」升序排列，
    // 而非依赖 o_videoTrack 的插入顺序(rowid)。这样在分镜流程中拖动重排后，
    // 底部轨道 #N 仍与分镜表顺序一致。无分镜的轨道(理论上不应存在)排到末尾。
    const trackMinIndex = (tid: number): number => {
      const medias = storyboardTrackRecord[tid] ?? [];
      const indexes = medias.map((m: any) => m.index).filter((n: any) => typeof n === "number");
      return indexes.length ? Math.min(...indexes) : Number.MAX_SAFE_INTEGER;
    };
    const trackIdMap = [...new Set<number>(trackData.map((t) => t.id!))].sort((a, b) => trackMinIndex(a) - trackMinIndex(b));
    for (const trackId of trackIdMap) {
      const item = trackData.find((t) => t.id === trackId);
      trackList.push({
        id: trackId,
        duration: item?.duration ?? 0,
        prompt: item?.prompt || "",
        state: (item?.state as "未生成" | "生成中" | "已完成" | "生成失败") ?? "未生成",
        reason: item?.reason ?? "",
        selectVideoId: Number(item?.videoId)!,
        medias: (() => {
          const storyboardMedias = storyboardTrackRecord[trackId] ?? [];
          const assetMedias = storyboardMedias.flatMap((s) => otherDataMap[s.id] ?? []);

          const seenAssetIds = new Set<number>();
          const uniqueAssets = assetMedias.filter((a) => {
            if (seenAssetIds.has(a.id)) return false;
            seenAssetIds.add(a.id);
            return true;
          });

          // 有 audioReference 时，按数量截取 audio 类型资产
          const audioCountMap: Record<string, number> = {};
          const filteredAssets = uniqueAssets.filter((a) => {
            if (a.fileType !== "audio" || audioReferenceCount === 0) return true;
            const key = String(a.id);
            audioCountMap[key] = (audioCountMap[key] ?? 0) + 1;
            // 统计当前 track 内 audio 总数，超过上限则过滤
            const totalAudio = Object.values(audioCountMap).reduce((s, n) => s + n, 0);
            return totalAudio <= audioReferenceCount;
          });

          const hasImageAssetData = filteredAssets.filter((i) => i.src);
          const notHasImageAssetData = filteredAssets.filter((i) => !i.src);

          return [...hasImageAssetData, ...storyboardMedias, ...notHasImageAssetData];
        })(),
        videoList: await Promise.all(
          videoList
            .filter((v) => v.videoTrackId === trackId)
            .map(async (v) => ({
              id: v.id!,
              src: v.filePath ? await u.oss.getFileUrl(v.filePath) : "",
              state: v.state === "已完成" ? "已完成" : v.state === "生成中" ? "生成中" : v.state === "生成失败" ? "生成失败" : "未生成",
              errorReason: v?.errorReason ?? "",
            })),
        ),
      });
    }
    res.status(200).send(
      success({
        storyboardList: await Promise.all(
          storyboardList.map(async (s) => ({
            ...s,
            src: s.filePath,
          })),
        ),
        trackList,
      }),
    );
  },
);
