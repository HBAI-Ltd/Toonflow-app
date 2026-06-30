import express from "express";
import u from "@/utils";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { markGeneratedVideoComplete, markGeneratedVideoFailed } from "@/utils/videoResult";
import { normalizedVideoModeText, parseVideoMode, resolveVideoReferences } from "@/utils/videoReferences";
const router = express.Router();

type Type = "imageReference" | "startImage" | "endImage" | "videoReference" | "audioReference";
interface UploadItem {
  fileType: "image" | "video" | "audio";
  type: Type;
  sources?: "assets" | "storyboard";
  id?: number;
  src?: string;
  label?: string;
  prompt?: string;
}

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    scriptId: z.number(),
    uploadData: z.array(
      z.object({
        id: z.number(),
        sources: z.string(),
      }),
    ),
    prompt: z.string(),
    model: z.string(),
    mode: z.string(),
    resolution: z.string(),
    duration: z.number(),
    audio: z.boolean().optional(),
    trackId: z.number(),
  }),
  async (req, res) => {
    const { scriptId, projectId, prompt, uploadData, model, duration, resolution, audio, mode, trackId } = req.body;

    // 兜底：当前端未传 uploadData(或为空)时，从该轨道关联的分镜与资产中推导参考图，
    // 顺序须与 generateVideoPrompt 一致(资产在前、分镜在后)，以保证提示词中的 @图片N 与参考图序号对应
    let resolvedUploadData: { id: number; sources: string }[] = Array.isArray(uploadData) ? uploadData : [];
    if (resolvedUploadData.length === 0) {
      const storyboardRows = await u.db("o_storyboard").where({ trackId, projectId }).select("id");
      const storyboardIds = storyboardRows.map((s: any) => s.id).filter((id: any) => typeof id === "number");
      let assetIds: number[] = [];
      if (storyboardIds.length) {
        const assetRows = await u
          .db("o_assets2Storyboard")
          .whereIn("storyboardId", storyboardIds)
          .orderBy("rowid")
          .select("assetId");
        assetIds = [...new Set(assetRows.map((r: any) => r.assetId).filter((id: any) => typeof id === "number"))];
      }
      resolvedUploadData = [
        ...assetIds.map((id) => ({ id, sources: "assets" })),
        ...storyboardIds.map((id) => ({ id, sources: "storyboard" })),
      ];
    }

    const parsedMode = parseVideoMode(mode);
    const generationMode = normalizedVideoModeText(parsedMode);
    const generationMeta = {
      generationModel: model,
      generationMode,
      generationResolution: resolution,
      generationDuration: duration,
      audioRequested: audio ? 1 : 0,
    };
    //获取生成视频比例
    const ratio = await u.db("o_project").select("videoRatio").where("id", projectId).first();
    const videoPath = `/${projectId}/video/${uuidv4()}.mp4`; //视频保存路径
    const referenceList = await resolveVideoReferences({ projectId, trackId, mode: parsedMode, uploadData: resolvedUploadData });
    //新增
    const [videoId] = await u.db("o_video").insert({
      filePath: videoPath,
      time: Date.now(),
      state: "生成中",
      scriptId,
      projectId,
      videoTrackId: trackId,
      ...generationMeta,
    } as any);
    res.status(200).send(success(videoId));

    const runAttempt = async (currentVideoId: number, currentVideoPath: string, attempt: number) => {
      const aiVideo = u.Ai.Video(model);
      let taskId: number | null = null;
      try {
        await aiVideo.run(
          {
            prompt,
            referenceList,
            mode: parsedMode as any,
            duration,
            aspectRatio: (ratio?.videoRatio as "16:9" | "9:16") || "16:9",
            resolution,
            audio,
          },
          {
            projectId,
            taskClass: "视频生成",
            describe: "根据提示词生成视频",
            relatedObjects: JSON.stringify({ projectId, videoId: currentVideoId, scriptId, type: "视频" }),
            onTaskStart: (id) => {
              taskId = id;
            },
          },
        );
        await aiVideo.save(currentVideoPath);
        await markGeneratedVideoComplete({ videoId: currentVideoId, videoPath: currentVideoPath, projectId, scriptId, trackId, taskId, audioRequested: audio });
      } catch (e: any) {
        const review = await markGeneratedVideoFailed(currentVideoId, u.error(e).message);
        if (review.retryable && attempt < 1) {
          const retryPath = `/${projectId}/video/${uuidv4()}.mp4`;
          const [retryVideoId] = await u.db("o_video").insert({
            filePath: retryPath,
            time: Date.now(),
            state: "生成中",
            scriptId,
            projectId,
            videoTrackId: trackId,
            ...generationMeta,
          } as any);
          await runAttempt(retryVideoId, retryPath, attempt + 1);
        }
      }
    };
    runAttempt(videoId, videoPath, 0).catch((e) => {
      console.warn(`[generateVideo] ${u.error(e).message}`);
    });
  },
);
