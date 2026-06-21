import assert from "assert";
import db, { db as knexDb } from "@/utils/db";
import {
  createPromptDraft,
  listPromptCenterItems,
  publishPromptVersion,
  resolveFunctionPrompt,
  resolveSkillPrompt,
  resolveVideoModelPrompt,
  runPromptRegression,
  seedPromptBaselineVersions,
} from "@/utils/promptCenter";

async function waitForTables() {
  for (let i = 0; i < 50; i++) {
    const hasVersion = await db.schema.hasTable("o_promptVersion");
    const hasUsage = await db.schema.hasTable("o_promptUsage");
    if (hasVersion && hasUsage) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("prompt governance tables were not created");
}

async function cleanup(type: string) {
  await db("o_promptVersion").where("note", "prompt-center-test").delete();
  await db("o_prompt").where("type", type).delete();
}

async function main() {
  await waitForTables();

  const testType = "__prompt_center_test__";
  await cleanup(testType);

  await db("o_prompt").insert({
    name: "Prompt Center Test",
    type: testType,
    data: "base prompt",
    useData: null,
  });

  const before = await resolveFunctionPrompt(testType);
  assert.equal(before.content, "base prompt");
  assert.equal(before.sourceType, "dbPrompt");

  const baseline = await seedPromptBaselineVersions({
    note: "prompt-center-test",
    items: [{ scope: "function", key: testType, sourceType: "dbPrompt", promptType: testType }],
  });
  assert.equal(baseline.created, 1, "baseline seed should create one active version");
  const afterBaseline = await resolveFunctionPrompt(testType);
  assert.equal(afterBaseline.versionId != null, true, "baseline active version should be attached");

  const centerItems = await listPromptCenterItems();
  assert.ok(Array.isArray(centerItems.agent), "prompt center should include agent group");
  assert.ok(Array.isArray(centerItems.function), "prompt center should include function group");
  assert.ok(Array.isArray(centerItems.videoModel), "prompt center should include video model group");
  assert.ok(Array.isArray(centerItems.skill), "prompt center should include skill group");

  const draft = await createPromptDraft({
    scope: "function",
    key: testType,
    sourceType: "dbPrompt",
    promptType: testType,
    content: "draft prompt",
    note: "prompt-center-test",
  });
  const afterDraft = await resolveFunctionPrompt(testType);
  assert.equal(afterDraft.hash, before.hash, "draft must not change effective prompt");

  await publishPromptVersion(draft.id!);
  const afterPublish = await resolveFunctionPrompt(testType);
  assert.equal(afterPublish.content, "draft prompt");
  assert.equal(afterPublish.versionId, draft.id);

  const rollback = await createPromptDraft({
    scope: "function",
    key: testType,
    sourceType: "dbPrompt",
    promptType: testType,
    content: "base prompt",
    note: "prompt-center-test",
  });
  await publishPromptVersion(rollback.id!);
  const afterRollback = await resolveFunctionPrompt(testType);
  assert.equal(afterRollback.content, "base prompt");

  const videoPrompt = await resolveVideoModelPrompt({
    vendorId: "prompt-center-test-vendor",
    model: "wan 2.6 test",
    mode: "singleImage",
  });
  assert.equal(videoPrompt.key, "prompt-center-test-vendor:wan 2.6 test:singleImage");
  assert.equal(videoPrompt.sourcePath, "video/wan2.6Single-imageFirstFrameMode.md");
  assert.ok(videoPrompt.fallbackTrace.some((trace) => trace.sourceType === "modelPromptBinding" && !trace.found));
  assert.ok(videoPrompt.fallbackTrace.some((trace) => trace.sourceType === "autoModelPromptFile" && trace.found));

  await assert.rejects(() => resolveSkillPrompt("../package.json"), /路径越界/);

  const eventTest = await runPromptRegression({ scope: "function", key: "eventExtraction" });
  assert.equal(eventTest.passed, true, "event extraction prompt regression should pass");

  const videoTest = await runPromptRegression({ scope: "videoModel", vendorId: "prompt-center-test-vendor", model: "wan 2.6 test", mode: "singleImage" });
  assert.equal(videoTest.passed, true, "video prompt regression should pass");

  const agentTest = await runPromptRegression({ scope: "agent", key: "scriptAgent:scriptAgent" });
  assert.equal(agentTest.passed, true, "agent XML regression should pass");

  await cleanup(testType);
  await knexDb.destroy();
}

main().catch(async (err) => {
  console.error(err);
  await knexDb.destroy();
  process.exit(1);
});
