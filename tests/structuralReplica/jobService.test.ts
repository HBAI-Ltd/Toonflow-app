import assert from "node:assert/strict";
import u from "../../src/utils";
import {
  createSrJob,
  failSrJob,
  getActiveSrJob,
  listSrJobs,
  recoverStaleSrJobs,
  requestCancelSrJob,
  runSrJob,
  serializeSrJob,
  updateSrJob,
} from "../../src/services/structuralReplica/jobService";

async function waitForSrJobTable(): Promise<void> {
  for (let i = 0; i < 20; i += 1) {
    if (await u.db.schema.hasTable("o_sr_job")) {
      for (const [column, type] of [
        ["lockedBy", "text"],
        ["lockedAt", "integer"],
        ["nextRunAt", "integer"],
        ["recoverable", "integer"],
        ["cancelRequested", "integer"],
      ] as const) {
        if (!(await u.db.schema.hasColumn("o_sr_job", column))) {
          await u.db.schema.alterTable("o_sr_job", (table) => (table as any)[type](column));
        }
      }
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("o_sr_job table was not initialized");
}

export default async function run(): Promise<void> {
  await waitForSrJobTable();
  const taskId = 900_000_000 + Math.floor(Date.now() % 100_000_000);

  await u.db("o_sr_job").where({ taskId }).delete();
  try {
    const job = await createSrJob({
      taskId,
      jobType: "buildIr",
      input: { source: "jobService.test" },
      stage: "queued",
    });
    assert.equal(job.status, "queued");
    assert.equal(job.progress, 0);
    assert.equal(job.attempt, 1);
    assert.deepEqual(serializeSrJob(job)?.input, { source: "jobService.test" });

    const activeQueued = await getActiveSrJob(taskId, "buildIr");
    assert.equal(activeQueued?.id, job.id);
    const cancelRequested = await requestCancelSrJob(Number(job.id));
    assert.equal(cancelRequested.cancelRequested, 1);

    const result = await runSrJob(
      Number(job.id),
      async (report) => {
        await report({ progress: 42.8, stage: "building_ir", result: { partial: true } });
        const activeRunning = await getActiveSrJob(taskId, "buildIr");
        assert.equal(activeRunning?.status, "running");
        assert.equal(activeRunning?.progress, 43);
        assert.equal(activeRunning?.stage, "building_ir");
        return { ok: true };
      },
      "starting",
    );
    assert.deepEqual(result, { ok: true });

    const finished = (await listSrJobs(taskId, 1))[0];
    assert.equal(finished.status, "succeeded");
    assert.equal(finished.progress, 100);
    assert.equal(finished.stage, "succeeded");
    assert.deepEqual(serializeSrJob(finished)?.result, { ok: true });
    assert.equal(await getActiveSrJob(taskId, "buildIr"), undefined);

    const retry = await createSrJob({ taskId, jobType: "buildIr", stage: "queued" });
    assert.equal(retry.attempt, 2);
    await updateSrJob(Number(retry.id), { progress: 200, stage: "retrying" });
    const clamped = await getActiveSrJob(taskId, "buildIr");
    assert.equal(clamped?.progress, 100);
    assert.equal(clamped?.stage, "retrying");

    const failed = await failSrJob(Number(retry.id), "expected failure");
    assert.equal(failed.status, "failed");
    assert.equal(failed.stage, "failed");
    assert.equal(failed.errorReason, "expected failure");
    assert.equal(await getActiveSrJob(taskId, "buildIr"), undefined);

    const jobs = await listSrJobs(taskId, 5);
    assert.deepEqual(
      jobs.map((item) => item.attempt),
      [2, 1],
    );

    const recoverable = await createSrJob({ taskId, jobType: "assetGap", stage: "queued", recoverable: true });
    const notRecoverable = await createSrJob({ taskId, jobType: "pushToProduction", stage: "queued", recoverable: false });
    const staleAt = Date.now() - 60_000;
    await u
      .db("o_sr_job")
      .whereIn("id", [Number(recoverable.id), Number(notRecoverable.id)])
      .update({ status: "running", lockedAt: staleAt, updatedAt: staleAt });
    const recovered = await recoverStaleSrJobs({ staleAfterMs: 1000, now: Date.now() });
    assert.ok(recovered.scanned >= 2);
    const recoverableAfter = await u.db("o_sr_job").where("id", Number(recoverable.id)).first();
    const notRecoverableAfter = await u.db("o_sr_job").where("id", Number(notRecoverable.id)).first();
    assert.ok(recoverableAfter);
    assert.ok(notRecoverableAfter);
    assert.equal(recoverableAfter.status, "queued");
    assert.equal(notRecoverableAfter.status, "failed");
  } finally {
    await u.db("o_sr_job").where({ taskId }).delete();
  }
}
