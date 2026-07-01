import express from "express";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { getTaskBundle } from "@/services/structuralReplica/repository";
import { parseModelRouteRow, parseShotAdaptationRow } from "@/services/structuralReplica/repository";
import { listSrJobs, serializeSrJob } from "@/services/structuralReplica/jobService";

const router = express.Router();

function withData<T extends { dataJson?: string | null } | undefined>(row: T): (T & { data?: unknown }) | undefined {
  if (!row) return undefined;
  return {
    ...row,
    data: row.dataJson ? JSON.parse(row.dataJson) : undefined,
  };
}

function withReportData<T extends { reportJson?: string | null } | undefined>(row: T): (T & { data?: unknown }) | undefined {
  if (!row) return undefined;
  return {
    ...row,
    data: row.reportJson ? JSON.parse(row.reportJson) : undefined,
  };
}

export default router.post(
  "/",
  validateFields({
    taskId: z.number().int().positive(),
  }),
  async (req, res) => {
    const { taskId } = req.body;
    const bundle = await getTaskBundle(taskId);
    const jobs = (await listSrJobs(taskId, 20)).map((job) => serializeSrJob(job)!);

    res.status(200).send(
      success({
        task: bundle.task,
        sourceMedia: bundle.sourceMedia,
        transcript: withData(bundle.transcript),
        shotDetection: withData(bundle.shotDetection),
        frameSamples: bundle.frameSamples,
        frameUnderstanding: bundle.frameUnderstanding.map((row) => withData(row)),
        storyIr: withData(bundle.storyIr),
        dialogueStructure: withData(bundle.dialogueStructure),
        assetGap: withData(bundle.assetGap),
        bindings: bundle.bindings,
        shotAdaptations: bundle.shotAdaptations.map(parseShotAdaptationRow),
        regeneratedStoryboard: withData(bundle.regeneratedStoryboard),
        report: withReportData(bundle.report),
        mapping: bundle.mapping,
        modelRoutes: bundle.modelRoutes.map(parseModelRouteRow),
        jobs,
      }),
    );
  },
);
