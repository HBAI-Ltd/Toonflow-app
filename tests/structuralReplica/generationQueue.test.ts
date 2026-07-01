import assert from "node:assert/strict";
import u from "../../src/utils";
import { enqueueShotGeneration, enqueueTaskGeneration, listShotCandidates, selectShotCandidate } from "../../src/services/structuralReplica/generationQueueService";
import { saveModelRoutes, saveRegeneratedStoryboard, saveStoryIr } from "../../src/services/structuralReplica/repository";
import { StructuralIrSchema } from "../../src/services/structuralReplica/schemas";

async function ensureTables() {
  const requiredTables = [
    "o_sr_task",
    "o_sr_story_ir",
    "o_sr_regenerated_storyboard",
    "o_sr_model_route",
    "o_sr_generation_job",
    "o_sr_generation_candidate",
    "o_sr_generation_cost",
  ];
  for (let i = 0; i < 20; i += 1) {
    const existing = await Promise.all(requiredTables.map((table) => u.db.schema.hasTable(table)));
    if (existing.every(Boolean)) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("structuralReplica generation tables were not initialized");
}

export default async function run(): Promise<void> {
  await ensureTables();
  const taskId = 910_000_000 + Math.floor(Date.now() % 10_000_000);
  try {
    await u.db("o_sr_task").insert({
      id: taskId,
      projectId: 1,
      name: "generation queue test",
      status: "storyboard_generated",
      platform: "other",
      aspectRatio: "9:16",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    const ir = StructuralIrSchema.parse({
      taskId,
      media: { durationSec: 4 },
      shots: [
        { shotId: "shot_001", enabled: true, startSec: 0, endSec: 2, durationSec: 2, requiredAssetSlots: [], mustReplace: [], frameSamples: [] },
        { shotId: "shot_002", enabled: true, startSec: 2, endSec: 4, durationSec: 2, requiredAssetSlots: [], mustReplace: [], frameSamples: [] },
      ],
    });
    await saveStoryIr(taskId, ir);
    await saveRegeneratedStoryboard(taskId, {
      taskId,
      version: 1,
      rows: [],
      promptPackage: {
        taskId,
        version: 1,
        shots: ir.shots.map((shot) => ({
          shotId: shot.shotId,
          sourceTimeRange: { startSec: shot.startSec, endSec: shot.endSec },
          durationSec: shot.durationSec,
          rawPrompt: `${shot.shotId} raw`,
          resolvedPrompt: `${shot.shotId} resolved`,
          negativePrompt: "negative",
          referenceFrames: [],
          assetSlots: [],
          warnings: [],
          validationStatus: "pass" as const,
        })),
        finalVideoPrompt: "final",
        finalNegativePrompt: "negative",
        storyboardPromptMap: {},
        validationReport: { status: "pass" as const, issues: [] },
      },
    });
    await saveModelRoutes(taskId, [
      { taskId, shotId: "shot_001", selectedProviderId: "mock", selectedModel: "video", routeStatus: "selected", requiredCapabilities: [], fallbackPlan: [], downgradeReasons: [] },
      { taskId, shotId: "shot_002", selectedProviderId: "mock", selectedModel: "video", routeStatus: "selected", requiredCapabilities: [], fallbackPlan: [], downgradeReasons: [] },
    ]);

    const multi = await enqueueShotGeneration({
      taskId,
      shotId: "shot_001",
      candidateCount: 2,
      runner: async ({ package: pkg, candidateIndex, outputPath }) => ({
        videoPath: outputPath,
        durationSec: pkg.durationSec,
        qualityScore: candidateIndex === 0 ? 80 : 92,
        metadata: { candidateIndex },
        estimatedCost: 0.03,
      }),
    });
    assert.equal(multi.job.status, "succeeded");
    assert.equal(multi.candidates.length, 2);
    assert.equal(multi.costs.length, 2);
    assert.equal(multi.costs[0].errorReason, null);

    const selected = await selectShotCandidate({ taskId, shotId: "shot_001", candidateId: Number(multi.candidates[1].id) });
    assert.equal(selected.selected, true);
    assert.equal(selected.status, "selected");
    const shotCandidates = await listShotCandidates(taskId, "shot_001");
    assert.equal(shotCandidates.filter((item) => item.selected).length, 1);

    const isolated = await enqueueTaskGeneration({
      taskId,
      candidateCount: 1,
      runner: async ({ package: pkg, outputPath }) => {
        if (pkg.shotId === "shot_001") throw new Error("shot one failed");
        return { videoPath: outputPath, durationSec: pkg.durationSec };
      },
    });
    assert.equal(isolated.length, 2);
    assert.equal(isolated.find((item) => item.shotId === "shot_001")?.ok, false);
    assert.equal(isolated.find((item) => item.shotId === "shot_002")?.ok, true);
    const failedCandidate = (await listShotCandidates(taskId, "shot_001")).find((item) => item.errorReason === "shot one failed");
    assert.ok(failedCandidate);
  } finally {
    await u.db("o_sr_generation_cost").where({ taskId }).delete();
    await u.db("o_sr_generation_candidate").where({ taskId }).delete();
    await u.db("o_sr_generation_job").where({ taskId }).delete();
    await u.db("o_sr_model_route").where({ taskId }).delete();
    await u.db("o_sr_regenerated_storyboard").where({ taskId }).delete();
    await u.db("o_sr_story_ir").where({ taskId }).delete();
    await u.db("o_sr_task").where("id", taskId).delete();
  }
}
