import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { getTaskBundle } from "@/services/structuralReplica/repository";
import { runAnalyzer } from "@/services/structuralReplica/analyzerRunner";
import { createSrJob, getActiveSrJob, runSrJobInBackground, serializeSrJob } from "@/services/structuralReplica/jobService";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    taskId: z.number().int().positive(),
  }),
  async (req, res) => {
    const { taskId } = req.body;
    const bundle = await getTaskBundle(taskId);
    const task = bundle.task;
    if (task.status !== "source_uploaded" && task.status !== "failed") {
      return res.status(400).send(error(`任务状态必须是 source_uploaded 或 failed，当前为 ${task.status}`));
    }
    if (!bundle.sourceMedia?.sourcePath) {
      return res.status(400).send(error("任务没有源视频，请先上传 MP4"));
    }

    const activeJob = await getActiveSrJob(taskId, "analyzer");
    if (activeJob) return res.status(200).send(success({ started: true, running: true, job: serializeSrJob(activeJob) }));

    const job = await createSrJob({ taskId, jobType: "analyzer", input: { taskId }, stage: "queued" });
    runSrJobInBackground(job, async (report) => {
      const result = await runAnalyzer(taskId, report);
      return { taskId: result.taskId, analysisDir: result.analysisDir, artifactsPath: result.artifactsPath };
    }, "preprocessing");

    res.status(200).send(success({ started: true, running: true, job: serializeSrJob(job) }));
  },
);
