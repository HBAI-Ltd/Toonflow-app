import assert from "node:assert/strict";
import u from "../../src/utils";
import { inspectAndSaveCandidate } from "../../src/services/structuralReplica/qualityGuardService";
import { composeTimeline } from "../../src/services/structuralReplica/timelineComposer";
import { decryptSecret, encryptSecret, getDecryptedSetting, isEncryptedSecret, upsertEncryptedSetting } from "../../src/services/structuralReplica/securityService";
import { checkTaskCompliance, updateAssetLicense } from "../../src/services/structuralReplica/complianceService";
import { cleanupStructuralReplicaArtifacts } from "../../src/services/structuralReplica/cleanupService";
import { saveProviderCapability } from "../../src/services/structuralReplica/modelGateway/providerCapabilityService";
import { getProviderCapabilityWithSecret } from "../../src/services/structuralReplica/repository";
import { saveDialogueStructure, saveStoryIr } from "../../src/services/structuralReplica/repository";
import { DialogueStructureSchema, StructuralIrSchema } from "../../src/services/structuralReplica/schemas";
import { assertAssetAccess, assertProjectAccess, assertTaskAccess } from "../../src/services/structuralReplica/accessBoundaryService";

async function ensureTables() {
  const requiredTables = ["o_sr_task", "o_sr_story_ir", "o_sr_generation_candidate", "o_sr_quality_report", "o_sr_timeline_export", "o_assets", "o_sr_asset_binding"];
  for (let i = 0; i < 20; i += 1) {
    const existing = await Promise.all(requiredTables.map((table) => u.db.schema.hasTable(table)));
    if (existing.every(Boolean)) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("structuralReplica quality/security tables were not initialized");
}

export default async function run(): Promise<void> {
  await ensureTables();
  const taskId = 920_000_000 + Math.floor(Date.now() % 10_000_000);
  const assetId = taskId + 1;
  const candidateId = taskId + 2;
  const projectId = taskId + 4;
  const originalVisionKey = await u.db("o_setting").where("key", "sr.visionApiKey").first();
  try {
    await u.db("o_project").insert({
      id: projectId,
      name: "sr boundary project",
      userId: 777,
    });
    await u.db("o_sr_task").insert({
      id: taskId,
      projectId,
      name: "quality timeline security test",
      status: "storyboard_generated",
      platform: "other",
      aspectRatio: "9:16",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    const ir = StructuralIrSchema.parse({
      taskId,
      media: {},
      shots: [{ shotId: "shot_001", enabled: true, startSec: 0, endSec: 2, durationSec: 2, requiredAssetSlots: [], mustReplace: [], frameSamples: [] }],
    });
    await saveStoryIr(taskId, ir);
    await saveDialogueStructure(
      taskId,
      DialogueStructureSchema.parse({
        taskId,
        version: 1,
        status: "reviewed",
        lines: [
          {
            shotId: "shot_001",
            sourceDialogue: "source line",
            dialoguePattern: "source line",
            editableDialogue: "new line",
            editableTemplate: "new line",
            variables: {},
            finalDialogue: "new line",
            subtitle: "subtitle line",
            charCount: 8,
            estimatedSpeechSec: 1.6,
            targetDurationSec: 2,
            fitsDuration: true,
            timingStrategy: "fit",
            timingActions: [],
            warnings: [],
          },
        ],
      }),
    );
    await u.db("o_sr_generation_candidate").insert({
      id: candidateId,
      taskId,
      shotId: "shot_001",
      generationJobId: taskId + 3,
      candidateIndex: 0,
      status: "selected",
      providerId: "mock",
      model: "video",
      videoPath: `/${taskId}/structuralReplica/generated/shot_001.mp4`,
      selected: 1,
      metadataJson: JSON.stringify({ character_presence: true, scene_presence: true, source_entity_leakage: false }),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const blocked = await inspectAndSaveCandidate({
      taskId,
      candidateId,
      expectedDurationSec: 2,
      expectedAspectRatio: "9:16",
      probe: async () => ({ exists: true, sizeBytes: 1, durationSec: 7, width: 1920, height: 1080, blackFrameRatio: 1, keyframeReadable: false }),
    });
    assert.equal(blocked.status, "blocked");
    assert.equal(blocked.retryRecommendation?.recommended, true);
    assert.ok(blocked.checks.some((check) => check.code === "black_frame" && !check.passed));

    const passed = await inspectAndSaveCandidate({
      taskId,
      candidateId,
      expectedDurationSec: 2,
      expectedAspectRatio: "9:16",
      probe: async () => ({ exists: true, sizeBytes: 1024, durationSec: 2.1, width: 720, height: 1280, blackFrameRatio: 0, keyframeReadable: true }),
    });
    assert.equal(passed.status, "pass");

    const exportResult = await composeTimeline({ taskId, dryRun: true, subtitleMode: "track", expiresInDays: 1 });
    assert.equal(exportResult.status, "succeeded");
    assert.deepEqual(exportResult.candidateIds, [candidateId]);
    assert.match(String(exportResult.reportJson.subtitlePath), /\.srt$/);

    assert.equal((await assertProjectAccess(projectId, { id: 777 })).id, projectId);
    assert.equal((await assertTaskAccess(taskId, { id: 777 })).id, taskId);
    await assert.rejects(() => assertTaskAccess(taskId, { id: 778 }), /access denied/);

    const encrypted = await encryptSecret("secret-value");
    assert.equal(isEncryptedSecret(encrypted), true);
    assert.equal(await decryptSecret(encrypted), "secret-value");
    await upsertEncryptedSetting("sr.visionApiKey", "vision-secret");
    const setting = await u.db("o_setting").where("key", "sr.visionApiKey").first();
    assert.ok(isEncryptedSecret(setting?.value));
    assert.equal(await getDecryptedSetting("sr.visionApiKey"), "vision-secret");

    await saveProviderCapability({
      providerId: `secure-${taskId}`,
      providerType: "openai_compatible",
      baseUrl: "https://example.test/v1",
      apiKey: "provider-secret",
      enabled: true,
      models: [
        {
          model: "video",
          type: "video",
          capabilities: {
            textToVideo: true,
            imageToVideo: true,
            videoReference: false,
            multiReference: false,
            characterLock: false,
            lipSync: false,
            maxDurationSec: 5,
            supportedRatios: ["9:16"],
            supportsSeed: false,
            supportsNegativePrompt: true,
          },
        },
      ],
    });
    const providerRow = await u.db("o_sr_provider_capability").where("providerId", `secure-${taskId}`).first();
    assert.ok(!String(providerRow?.capabilityJson).includes("provider-secret"));
    const secretProvider = await getProviderCapabilityWithSecret(`secure-${taskId}`);
    assert.equal(secretProvider?.apiKey, "provider-secret");

    await u.db("o_assets").insert({
      id: assetId,
      projectId,
      name: "host",
      type: "role",
      commercialAllowed: 0,
    });
    assert.equal((await assertAssetAccess(assetId, { id: 777 })).id, assetId);
    await assert.rejects(() => assertAssetAccess(assetId, { id: 778 }), /access denied/);
    await u.db("o_sr_asset_binding").insert({
      taskId,
      shotId: "shot_001",
      slotName: "host",
      slotType: "role",
      assetId,
      bindingStatus: "bound",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    const blockedCompliance = await checkTaskCompliance(taskId);
    assert.equal(blockedCompliance.status, "blocked");
    await updateAssetLicense({ assetId, licenseType: "owned", sourceOwner: "self", commercialAllowed: true });
    const passCompliance = await checkTaskCompliance(taskId);
    assert.equal(passCompliance.status, "pass");

    const expiredExport = await u.db("o_sr_timeline_export").where({ taskId }).first();
    assert.ok(expiredExport);
    await u.db("o_sr_timeline_export").where("id", expiredExport.id).update({ expiresAt: Date.now() - 1000 });
    const cleanup = await cleanupStructuralReplicaArtifacts({ dryRun: true, now: Date.now() });
    assert.equal(cleanup.dryRun, true);
    assert.ok(cleanup.expiredExports >= 1);
    assert.ok(cleanup.removedFiles.some((filePath) => filePath.endsWith(".srt")));
  } finally {
    await u.db("o_sr_provider_capability").where("providerId", `secure-${taskId}`).delete();
    if (originalVisionKey) await u.db("o_setting").where("key", "sr.visionApiKey").update({ value: originalVisionKey.value });
    else await u.db("o_setting").where("key", "sr.visionApiKey").delete();
    await u.db("o_sr_asset_binding").where({ taskId }).delete();
    await u.db("o_assets").where("id", assetId).delete();
    await u.db("o_sr_timeline_export").where({ taskId }).delete();
    await u.db("o_sr_quality_report").where({ taskId }).delete();
    await u.db("o_sr_generation_candidate").where({ taskId }).delete();
    await u.db("o_sr_dialogue_structure").where({ taskId }).delete();
    await u.db("o_sr_story_ir").where({ taskId }).delete();
    await u.db("o_sr_task").where("id", taskId).delete();
    await u.db("o_project").where("id", projectId).delete();
  }
}
