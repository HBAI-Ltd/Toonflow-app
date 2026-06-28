import db from "@/utils/db";
import error from "@/utils/error";
import { addTaskProgress } from "@/utils/taskProgress";
import { autoSelectBestVideoForTrack, recordFailedVideoReview, reviewGeneratedVideo } from "@/utils/videoReview";

export async function markGeneratedVideoComplete(input: {
  videoId: number;
  videoPath: string;
  projectId: number;
  scriptId: number;
  trackId?: number | null;
  taskId?: number | null;
  audioRequested?: boolean;
}) {
  const { videoId, videoPath, projectId, scriptId, taskId, audioRequested } = input;
  const video = await db("o_video").where("id", videoId).select("videoTrackId").first();
  const trackId = Number(input.trackId ?? video?.videoTrackId);
  const review = await reviewGeneratedVideo({ videoId, videoPath, projectId, scriptId, trackId, audioRequested });
  const status = review.status === "failed" ? "error" : review.status === "warning" ? "warning" : "complete";
  const message = review.status === "passed"
    ? "视频文件已保存并通过 QA"
    : `视频 QA ${review.status === "failed" ? "未通过" : "需复核"}：${review.issues.join(", ")}`;

  if (taskId) {
    await addTaskProgress({
      taskId,
      projectId,
      scriptId,
      phase: "video_review",
      status,
      message,
      meta: { videoId, videoPath, review },
    }).catch((e) => console.warn(`[taskProgress] ${error(e).message}`));
  }

  await db("o_video").where("id", videoId).update({
    state: review.status === "failed" ? "生成失败" : "生成成功",
    errorReason: review.status === "failed" ? review.issues.join(", ") : null,
  });
  if (review.status !== "failed" && Number.isFinite(trackId) && trackId > 0) {
    await autoSelectBestVideoForTrack(trackId);
  }
  return review;
}

export async function markGeneratedVideoFailed(videoId: number, reason: string) {
  await db("o_video").where("id", videoId).update({
    state: "生成失败",
    errorReason: reason,
  });
  return recordFailedVideoReview({ videoId, reason });
}
