import express from "express";
import u from "@/utils";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { ReferenceList } from "@/utils/ai";
import { markGeneratedVideoComplete, markGeneratedVideoFailed } from "@/utils/videoResult";
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

    let modeData = [];
    if (Array.isArray(mode)) {
    } else if (typeof mode === "string" && mode.startsWith('["') && mode.endsWith('"]')) {
      try {
        modeData = JSON.parse(mode);
      } catch (e) {}
    }
    const generationMode = modeData.length > 0 ? JSON.stringify(modeData) : String(mode || "");
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
    //查询出图片数据
    const images = await Promise.all(
      resolvedUploadData.map(async (item: { id: number; sources: string }) => {
        if (item.sources === "storyboard") {
          const storyboard = await u.db("o_storyboard").where("id", item.id).select("filePath", "state").first();
          return { path: storyboard?.state === "已完成" ? storyboard.filePath : "", sources: "storyBoard", name: "", kind: "storyboard" as const };
        }
        if (item.sources === "assets") {
          const filePath = await u
            .db("o_assets")
            .where("o_assets.id", item.id)
            .leftJoin("o_image", "o_assets.imageId", "o_image.id")
            .select("o_image.filePath", "o_image.type", "o_assets.name")
            .first();
          return { path: filePath?.filePath, sources: filePath.type, name: filePath?.name ?? "", kind: "assets" as const };
        }
      }),
    );
    //把images里面的图片转成base64格式
    const base64 = await Promise.all(
      images.map(async (item) => {
        if (!item?.path) return null;
        return {
          base64: await u.oss.getImageBase64(item.path),
          type: item.sources == "audio" ? "audio" : "image",
          name: item.name ?? "",
          kind: item.kind,
        };
      }),
    );

    // 方案A：按提示词中 @图片N 的编号重排「资产图」，使第 N 张图 == 提示词中 @图片N 引用的资产。
    // LLM 编号不保证与输入顺序一致(实测会把场景提前)，若不重排则参考图与 @图片N 错位，导致主体/场景张冠李戴。
    // 仅资产图(kind=assets)参与 @图片N 编号；分镜帧(storyboard)与音频不参与，保持在后。
    // 匹配键为资产名(本项目无重名)；匹配不到则保持原序并告警，绝不丢图。
    let orderedReferenceList = base64.filter(Boolean) as Array<{ base64: string; type: string; name: string; kind: "assets" | "storyboard" }>;
    {
      const assetImages = orderedReferenceList.filter((b) => b.type === "image" && b.kind === "assets");
      const others = orderedReferenceList.filter((b) => !(b.type === "image" && b.kind === "assets"));
      // 解析: 将 @图片N 中的[...] 定义为 <标签>（名字）
      const promptStr = typeof prompt === "string" ? prompt : "";
      const matches = [...promptStr.matchAll(/@图片(\d+)\s*中的\[[^\]]*\]\s*定义为\s*<[^>]*>（([^）]*)）/g)];
      const nameToNumber = new Map<string, number>();
      for (const m of matches) {
        const n = parseInt(m[1], 10);
        const name = (m[2] ?? "").trim();
        if (name && !Number.isNaN(n) && !nameToNumber.has(name)) nameToNumber.set(name, n);
      }
      const allMatched = assetImages.length > 0 && assetImages.every((it) => nameToNumber.has((it.name ?? "").trim()));
      if (allMatched) {
        const reordered = [...assetImages].sort(
          (a, b) => nameToNumber.get((a.name ?? "").trim())! - nameToNumber.get((b.name ?? "").trim())!,
        );
        const changed = reordered.some((it, idx) => it !== assetImages[idx]);
        if (changed) {
          console.warn(
            `[generateVideo] 轨道 ${trackId} 按提示词 @图片N 编号重排参考图: ` +
              `${assetImages.map((i) => i.name).join(",")} → ${reordered.map((i) => i.name).join(",")}`,
          );
        }
        // 资产图在前(与提示词 @图片N 编号对齐)，分镜帧/音频保持在后
        orderedReferenceList = [...reordered, ...others];
      } else if (assetImages.length > 0) {
        console.warn(
          `[generateVideo] 轨道 ${trackId} 提示词 @图片N 与资产名未完全匹配，保持原参考图顺序(可能存在错位)。` +
            `图片资产: ${assetImages.map((i) => i.name).join(",")}; 提示词命名: ${[...nameToNumber.keys()].join(",")}`,
        );
      }
    }
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
            referenceList: orderedReferenceList as ReferenceList[],
            mode: modeData.length > 0 ? modeData : mode,
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
