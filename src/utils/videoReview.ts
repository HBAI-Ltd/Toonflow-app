import db from "@/utils/db";
import oss from "@/utils/oss";
import error from "@/utils/error";
import { probeDuration, probeVideoInfo } from "@/utils/ffmpegTool";

export type VideoReviewStatus = "passed" | "warning" | "failed";

export interface VideoReview {
  projectId: number;
  scriptId: number | null;
  trackId: number | null;
  videoId: number;
  score: number;
  status: VideoReviewStatus;
  issues: string[];
  report: Record<string, unknown>;
  retryable: boolean;
  suggestedAction: string;
}

async function hasReviewTable() {
  return db.schema.hasTable("o_videoReview");
}

export function shouldRetryVideoGeneration(reason: string): boolean {
  const text = String(reason || "");
  if (/AccountOverdue|overdue|余额|欠费|Forbidden|Unauthorized|Invalid.*key|api.?key|quota|permission|鉴权|认证/i.test(text)) return false;
  if (/timeout|timed?\s*out|ECONN|ENOTFOUND|network|socket|temporar|rate.?limit|429|5\d\d|busy|overload|poll error/i.test(text)) return true;
  return false;
}

export async function recordFailedVideoReview(input: { videoId: number; reason: string }): Promise<VideoReview> {
  const video = await db("o_video").where("id", input.videoId).first();
  const retryable = shouldRetryVideoGeneration(input.reason);
  const review: VideoReview = {
    projectId: Number(video?.projectId || 0),
    scriptId: video?.scriptId ?? null,
    trackId: video?.videoTrackId ?? null,
    videoId: input.videoId,
    score: 0,
    status: "failed",
    issues: ["generation_failed"],
    report: { reason: input.reason },
    retryable,
    suggestedAction: retryable ? "retry_same_parameters" : "fix_provider_or_prompt_before_retry",
  };
  await saveVideoReview(review);
  return review;
}

export async function reviewVideoById(input: { videoId: number; audioRequested?: boolean }): Promise<VideoReview> {
  const video = await db("o_video").where("id", input.videoId).first();
  if (!video) throw new Error(`视频不存在: ${input.videoId}`);
  return reviewGeneratedVideo({
    videoId: Number(video.id),
    videoPath: String(video.filePath || ""),
    projectId: Number(video.projectId),
    scriptId: Number(video.scriptId),
    trackId: Number(video.videoTrackId),
    audioRequested: input.audioRequested,
  });
}

export async function reviewGeneratedVideo(input: {
  videoId: number;
  videoPath: string;
  projectId: number;
  scriptId: number;
  trackId: number;
  audioRequested?: boolean;
}): Promise<VideoReview> {
  const issues: string[] = [];
  let score = 100;
  const report: Record<string, unknown> = {
    videoId: input.videoId,
    videoPath: input.videoPath,
  };

  try {
    const absPath = await oss.getAbsolutePath(input.videoPath);
    const [info, duration] = await Promise.all([probeVideoInfo(absPath), probeDuration(absPath)]);
    report.media = { ...info, duration };
    if (input.audioRequested !== false && !info.hasAudio) {
      issues.push("missing_audio");
      score -= 20;
    }
  } catch (e) {
    issues.push("video_unplayable");
    score -= 70;
    report.mediaError = error(e).message;
  }

  const consistency = await inspectTrackConsistency(input.trackId, input.projectId);
  report.consistency = consistency;
  if (!consistency.storyboardCount) {
    issues.push("missing_storyboard_binding");
    score -= 30;
  }
  if (!consistency.boundAssetCount) {
    issues.push("missing_asset_binding");
    score -= 20;
  }
  if (consistency.missingAssetImageIds.length) {
    issues.push("missing_asset_selected_image");
    score -= Math.min(30, consistency.missingAssetImageIds.length * 8);
  }
  if (consistency.promptMissingAssetNames.length) {
    issues.push("prompt_missing_asset_reference");
    score -= Math.min(25, consistency.promptMissingAssetNames.length * 6);
  }
  if (consistency.promptForeignAssetNames.length) {
    issues.push("prompt_foreign_asset_reference");
    score -= Math.min(25, consistency.promptForeignAssetNames.length * 6);
  }
  if (consistency.promptReferenceCount > 9) {
    issues.push("prompt_reference_over_limit");
    score -= 10;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const status: VideoReviewStatus = issues.includes("video_unplayable") || score < 50 ? "failed" : issues.length ? "warning" : "passed";
  const retryable = status === "failed" && !issues.includes("missing_asset_binding") && !issues.includes("missing_asset_selected_image");
  const suggestedAction = suggestedActionFor(issues, retryable);
  const review: VideoReview = {
    projectId: input.projectId,
    scriptId: input.scriptId,
    trackId: input.trackId,
    videoId: input.videoId,
    score,
    status,
    issues,
    report,
    retryable,
    suggestedAction,
  };
  await saveVideoReview(review);
  return review;
}

export async function autoSelectBestVideoForTrack(trackId: number): Promise<number | null> {
  const track = await db("o_videoTrack").where("id", trackId).select("videoId", "selectVideoId").first();
  const existing = Number(track?.videoId ?? track?.selectVideoId);
  if (Number.isFinite(existing) && existing > 0) {
    const video = await db("o_video").where("id", existing).select("state").first();
    const review = await db("o_videoReview").where("videoId", existing).select("status").first().catch(() => null);
    if (/生成成功|已完成/.test(String(video?.state || "")) && review?.status !== "failed") return existing;
  }

  const videos = await db("o_video").where({ videoTrackId: trackId, state: "生成成功" }).select("id").orderBy("id", "desc");
  if (!videos.length) return null;
  for (const video of videos) {
    const exists = await db("o_videoReview").where("videoId", video.id).first().catch(() => null);
    if (!exists) await reviewVideoById({ videoId: Number(video.id) }).catch(() => null);
  }
  const reviews = await db("o_videoReview")
    .where("trackId", trackId)
    .whereIn("videoId", videos.map((item: any) => item.id))
    .whereNot("status", "failed")
    .orderBy("score", "desc")
    .orderBy("videoId", "desc")
    .limit(1);
  const selected = Number(reviews[0]?.videoId);
  if (!Number.isFinite(selected) || selected <= 0) return null;
  await db("o_videoTrack").where("id", trackId).update({ videoId: selected, selectVideoId: selected });
  return selected;
}

async function saveVideoReview(review: VideoReview) {
  if (!(await hasReviewTable())) return;
  const now = Date.now();
  await db("o_videoReview").where("videoId", review.videoId).delete();
  await db("o_videoReview").insert({
    projectId: review.projectId,
    scriptId: review.scriptId,
    trackId: review.trackId,
    videoId: review.videoId,
    score: review.score,
    status: review.status,
    issues: JSON.stringify(review.issues),
    report: JSON.stringify({ ...review.report, suggestedAction: review.suggestedAction }),
    retryable: review.retryable ? 1 : 0,
    createTime: now,
    updateTime: now,
  } as any);
}

async function inspectTrackConsistency(trackId: number, projectId: number) {
  const track = await db("o_videoTrack").where("id", trackId).select("prompt").first();
  const storyboards = await db("o_storyboard").where({ trackId, projectId }).select("id").orderBy("index", "asc");
  const storyboardIds = storyboards.map((item: any) => item.id).filter((id: any) => typeof id === "number");
  const assetRows = storyboardIds.length
    ? await db("o_assets2Storyboard")
        .whereIn("o_assets2Storyboard.storyboardId", storyboardIds)
        .leftJoin("o_assets", "o_assets.id", "o_assets2Storyboard.assetId")
        .leftJoin("o_image", "o_image.id", "o_assets.imageId")
        .orderBy("o_assets2Storyboard.rowid")
        .select(
          "o_assets.id as id",
          "o_assets.name as name",
          "o_assets.type as type",
          "o_assets.imageId as imageId",
          "o_image.filePath as filePath",
        )
    : [];
  const deduped = uniqueBy(assetRows, (item: any) => Number(item.id)).filter((item: any) => item.id != null);
  const imageAssets = deduped.filter((item: any) => item.type !== "audio");
  const missingAssetImageIds = imageAssets.filter((item: any) => !item.imageId || !item.filePath).map((item: any) => Number(item.id));
  const promptRefs = parsePromptImageRefs(String(track?.prompt || ""));
  const promptNames = new Set(promptRefs.map((item) => item.name).filter(Boolean));
  const assetNames = new Set(imageAssets.map((item: any) => String(item.name || "").trim()).filter(Boolean));
  const promptMissingAssetNames = imageAssets
    .map((item: any) => String(item.name || "").trim())
    .filter((name: string) => name && promptRefs.length > 0 && !promptNames.has(name));
  const promptForeignAssetNames = [...promptNames].filter((name) => name && !assetNames.has(name));
  return {
    storyboardCount: storyboards.length,
    boundAssetCount: deduped.length,
    imageAssetCount: imageAssets.length,
    missingAssetImageIds,
    promptReferenceCount: promptRefs.length,
    promptMissingAssetNames,
    promptForeignAssetNames,
  };
}

function parsePromptImageRefs(prompt: string) {
  return [...prompt.matchAll(/@图片(\d+)\s*中的\[[^\]]*\]\s*定义为\s*<[^>]*>（([^）]*)）/g)].map((match) => ({
    index: Number(match[1]),
    name: String(match[2] || "").trim(),
  }));
}

function uniqueBy<T>(items: T[], key: (item: T) => unknown): T[] {
  const seen = new Set();
  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function suggestedActionFor(issues: string[], retryable: boolean) {
  if (issues.includes("missing_asset_selected_image")) return "generate_or_select_asset_images";
  if (issues.includes("prompt_missing_asset_reference") || issues.includes("prompt_foreign_asset_reference")) return "regenerate_video_prompt";
  if (issues.includes("missing_audio")) return "regenerate_with_audio_or_add_tts";
  if (retryable) return "retry_same_parameters";
  return issues.length ? "manual_review" : "select_for_compose";
}
