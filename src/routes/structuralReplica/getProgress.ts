import express from "express";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { getTaskBundle } from "@/services/structuralReplica/repository";
import { listSrJobs, serializeSrJob } from "@/services/structuralReplica/jobService";
import { FrameUnderstandingSchema, ShotDetectionSchema } from "@/services/structuralReplica/schemas";
import { parseModelRouteRow, parseShotAdaptationRow } from "@/services/structuralReplica/repository";

const router = express.Router();

const progressByStatus: Record<string, number> = {
  draft: 0,
  source_uploading: 10,
  source_uploaded: 20,
  preprocessing: 35,
  transcribing: 50,
  detecting_shots: 65,
  sampling_frames: 80,
  understanding_frames: 85,
  ir_built: 90,
  dialogue_reviewed: 92,
  asset_gap_ready: 94,
  assets_bound: 96,
  storyboard_generated: 98,
  checked: 99,
  pushed: 100,
  failed: 100,
};

export default router.post(
  "/",
  validateFields({
    taskId: z.number().int().positive(),
  }),
  async (req, res) => {
    const { taskId } = req.body;
    const bundle = await getTaskBundle(taskId);
    const status = bundle.task.status || "draft";
    const shotDetection = bundle.shotDetection?.dataJson ? ShotDetectionSchema.safeParse(JSON.parse(bundle.shotDetection.dataJson)) : null;
    const shotCount = shotDetection?.success ? shotDetection.data.shots.length : 0;
    const frameUnderstandings = bundle.frameUnderstanding
      .map((row) => (row.dataJson ? FrameUnderstandingSchema.safeParse(JSON.parse(row.dataJson)) : null))
      .filter((item): item is ReturnType<typeof FrameUnderstandingSchema.safeParse> & { success: true } => Boolean(item?.success))
      .map((item) => item.data);
    const visualSummaryCount = frameUnderstandings.filter((item) => item.visualSummary?.trim()).length;
    const reviewRequiredCount = frameUnderstandings.filter((item) => item.reviewRequired).length;
    const frameUnderstandingComplete = shotCount > 0 && frameUnderstandings.length >= shotCount;
    const jobs = (await listSrJobs(taskId, 12)).map((job) => serializeSrJob(job)!);
    const activeJob = jobs.find((job) => job.status === "queued" || job.status === "running") || null;
    const latestJob = jobs[0] || null;
    const jobProgress = activeJob && typeof activeJob.progress === "number" ? activeJob.progress : null;
    const shotAdaptations = bundle.shotAdaptations.map(parseShotAdaptationRow);
    const modelRoutes = bundle.modelRoutes.map(parseModelRouteRow);
    const adaptationBlockers = shotAdaptations
      .filter((item) => item.adaptationLevel === "D")
      .flatMap((item) => item.blockedReasons.map((reason) => ({ shotId: item.shotId, reason })));
    const modelRouteBlockers = modelRoutes
      .filter((item) => item.routeStatus === "blocked")
      .flatMap((item) => item.downgradeReasons.map((reason) => ({ shotId: item.shotId, reason })));
    const nextAction =
      status === "assets_bound" && !shotAdaptations.length
        ? "buildShotAdaptations"
        : shotAdaptations.length && !modelRoutes.length
          ? "routeModels"
          : adaptationBlockers.length || modelRouteBlockers.length
            ? "resolveBlockers"
            : activeJob
              ? "waitForJob"
              : null;
    res.status(200).send(
      success({
        taskId,
        status,
        currentStage: status,
        progress: jobProgress ?? progressByStatus[status] ?? 0,
        artifacts: {
          hasSourceMedia: Boolean(bundle.sourceMedia),
          hasTranscript: Boolean(bundle.transcript),
          hasShotDetection: Boolean(bundle.shotDetection),
          shotCount,
          frameSampleCount: bundle.frameSamples.length,
          frameUnderstandingCount: bundle.frameUnderstanding.length,
          visualSummaryCount,
          reviewRequiredCount,
          frameUnderstandingComplete,
          shotAdaptationCount: shotAdaptations.length,
          shotAdaptationBlockedCount: adaptationBlockers.length,
          modelRouteCount: modelRoutes.length,
          modelRouteBlockedCount: modelRouteBlockers.length,
        },
        blockers: [...adaptationBlockers, ...modelRouteBlockers],
        nextAction,
        jobs,
        activeJob,
        latestJob,
        errorReason: activeJob?.errorReason || latestJob?.errorReason || (status === "failed" ? bundle.task.errorReason : null),
      }),
    );
  },
);
