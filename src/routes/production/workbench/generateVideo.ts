import express from "express";
import u from "@/utils";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { ReferenceList } from "@/utils/ai";
import { t, getLocale } from "@/i18n";
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
    const locale = await getLocale(req as any);
    let modeData = [];
    if (Array.isArray(mode)) {
    } else if (typeof mode === "string" && mode.startsWith('["') && mode.endsWith('"]')) {
      try {
        modeData = JSON.parse(mode);
      } catch (e) {}
    }
    //获取生成视频比例
    const ratio = await u.db("o_project").select("videoRatio").where("id", projectId).first();
    const videoPath = `/${projectId}/video/${uuidv4()}.mp4`; //视频保存路径
    //查询出图片数据
    const images = await Promise.all(
      uploadData.map(async (item: UploadItem) => {
        if (item.sources === "storyboard") {
          const filePath = await u.db("o_storyboard").where("id", item.id).select("filePath").first();
          return { path: filePath?.filePath, sources: "storyBoard" };
        }
        if (item.sources === "assets") {
          const filePath = await u
            .db("o_assets")
            .where("o_assets.id", item.id)
            .leftJoin("o_image", "o_assets.imageId", "o_image.id")
            .select("o_image.filePath", "o_image.type")
            .first();
          return { path: filePath?.filePath, sources: filePath.type };
        }
      }),
    );
    //把images里面的图片转成base64格式
    const base64 = await Promise.all(
      images.map(async (item) => {
        if (!item) return null;
        return { base64: await u.oss.getImageBase64(item.path), type: item.sources == "audio" ? "audio" : "image" };
      }),
    );
    //新增
    const [videoId] = await u.db("o_video").insert({
      filePath: videoPath,
      time: Date.now(),
      state: "生成中", // i18n-ignore — stored o_video.state enum value, not user-facing text
      scriptId,
      projectId,
      videoTrackId: trackId,
    });
    res.status(200).send(success(videoId));
    const relatedObjects = {
      projectId,
      videoId,
      scriptId,
      // relatedObjects is returned verbatim to the client by task-list/task-detail
      // endpoints with no custom cell handler, so it renders raw in the task
      // table — it must follow the request locale like the sibling describe field.
      type: t("production.workbench.common.relatedObjectType.video", {}, locale),
    };
    const aiVideo = u.Ai.Video(model);
    aiVideo
      .run(
        {
          prompt,
          referenceList: base64.filter(Boolean) as ReferenceList[],
          mode: modeData.length > 0 ? modeData : mode,
          duration,
          aspectRatio: (ratio?.videoRatio as "16:9" | "9:16") || "16:9",
          resolution,
          audio,
        },
        {
          projectId,
          taskClass: t("taskClass.videoGeneration", {}, locale),
          describe: t("production.workbench.common.videoTaskDescribe", {}, locale),
          relatedObjects: JSON.stringify(relatedObjects),
        },
      )
      .then(async () => await aiVideo.save(videoPath))
      .then(async () => await u.db("o_video").where("id", videoId).update({ state: "生成成功" })) // i18n-ignore — stored o_video.state enum value, not user-facing text
      .catch(async (error: any) => {
        await u
          .db("o_video")
          .where("id", videoId)
          .update({
            state: "生成失败", // i18n-ignore — stored o_video.state enum value, not user-facing text
            errorReason: u.error(error).message,
          });
      });
  },
);
