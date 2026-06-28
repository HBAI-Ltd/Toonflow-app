import db from "@/utils/db";
import oss from "@/utils/oss";
import error from "@/utils/error";
import { addTaskProgress } from "@/utils/taskProgress";
import { probeDuration, probeVideoInfo } from "@/utils/ffmpegTool";

export async function markGeneratedVideoComplete(input: {
  videoId: number;
  videoPath: string;
  projectId: number;
  scriptId: number;
  taskId?: number | null;
  audioRequested?: boolean;
}) {
  const { videoId, videoPath, projectId, scriptId, taskId, audioRequested } = input;
  let status: "complete" | "warning" = "complete";
  let message = "视频文件已保存并通过基础质检";
  let meta: Record<string, unknown> = { videoId, videoPath };

  try {
    const absPath = await oss.getAbsolutePath(videoPath);
    const [info, duration] = await Promise.all([probeVideoInfo(absPath), probeDuration(absPath)]);
    const expectsAudio = audioRequested !== false;
    status = expectsAudio && !info.hasAudio ? "warning" : "complete";
    message = status === "warning" ? "视频已保存，但未检测到音轨" : message;
    meta = { ...meta, ...info, duration };
  } catch (e) {
    status = "warning";
    message = `视频已保存，但基础质检失败：${error(e).message}`;
    meta = { ...meta, probeError: error(e).message };
  }

  if (taskId) {
    await addTaskProgress({
      taskId,
      projectId,
      scriptId,
      phase: "video_probe",
      status,
      message,
      meta,
    }).catch((e) => console.warn(`[taskProgress] ${error(e).message}`));
  }

  await db("o_video").where("id", videoId).update({ state: "生成成功" });
  await selectFirstSuccessfulVideo(videoId);
}

export async function markGeneratedVideoFailed(videoId: number, reason: string) {
  await db("o_video").where("id", videoId).update({
    state: "生成失败",
    errorReason: reason,
  });
}

async function selectFirstSuccessfulVideo(videoId: number) {
  const video = await db("o_video").where("id", videoId).select("videoTrackId").first();
  if (!video?.videoTrackId) return;
  const track = await db("o_videoTrack").where("id", video.videoTrackId).select("videoId", "selectVideoId").first();
  const selected = track?.videoId ?? track?.selectVideoId;
  if (selected) {
    await db("o_videoTrack").where("id", video.videoTrackId).update({
      videoId: track?.videoId ?? selected,
      selectVideoId: track?.selectVideoId ?? selected,
    });
    return;
  }
  await db("o_videoTrack").where("id", video.videoTrackId).update({
    videoId,
    selectVideoId: videoId,
  });
}
