import assert from "assert";
import db, { db as knexDb } from "@/utils/db";
import {
  getGenerationAuditGraph,
  patchGenerationSegment,
  recordGenerationArtifact,
  searchGenerationSegments,
  snapshotTargetContent,
} from "@/utils/contentAudit";

async function waitForTables() {
  for (let i = 0; i < 50; i++) {
    const hasArtifact = await db.schema.hasTable("o_generationArtifact");
    const hasSegment = await db.schema.hasTable("o_generationSegment");
    const hasRevision = await db.schema.hasTable("o_generationRevision");
    if (hasArtifact && hasSegment && hasRevision) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("content audit tables were not created");
}

async function cleanup(projectId: number) {
  await db("o_generationRevision").where("projectId", projectId).delete();
  await db("o_generationSegment").where("projectId", projectId).delete();
  await db("o_generationArtifact").where("projectId", projectId).delete();
  await db("o_script").where("projectId", projectId).delete();
  await db("o_project").where("id", projectId).delete();
}

async function main() {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await waitForTables();

  const projectId = Date.now();
  await cleanup(projectId);
  await db("o_project").insert({
    id: projectId,
    projectType: "novel",
    name: "Content Audit Test",
    createTime: projectId,
  });
  const [scriptId] = await db("o_script").insert({
    projectId,
    name: "第1集",
    content: "林澈走进旧剧院。纸条在桌上发光。",
    createTime: Date.now(),
  });

  const artifact = await recordGenerationArtifact({
    projectId,
    artifactType: "script",
    targetType: "o_script",
    targetId: scriptId,
    targetField: "content",
    title: "第1集",
    content: "林澈走进旧剧院。纸条在桌上发光。",
    promptHash: "prompt-hash-test",
    promptVersionId: 1,
    promptSource: "test",
    modelName: "test-model",
  });
  assert.equal(artifact.segmentCount, 2, "script should be split into two sentence segments");

  const matches = await searchGenerationSegments({ projectId, query: "纸条" });
  assert.equal(matches.length, 1, "search should find the sentence segment");
  assert.equal(matches[0].text, "纸条在桌上发光。");

  const graph = await getGenerationAuditGraph({ projectId });
  assert.equal(graph.artifacts.length, 1, "graph should include one artifact");
  assert.equal(graph.segments.length, 2, "graph should include artifact segments");
  assert.ok(graph.nodes.some((node) => node.id === `artifact:${artifact.id}`), "graph nodes should be canvas-ready");

  const patch = await patchGenerationSegment({
    segmentId: matches[0].id,
    newText: "纸条在桌上泛起蓝光。",
    note: "content audit test",
  });
  assert.ok(patch.revisionId, "patch should create a revision");
  const updated = await db("o_script").where("id", scriptId).first();
  assert.ok(updated, "updated script should exist");
  assert.equal(updated.content, "林澈走进旧剧院。纸条在桌上泛起蓝光。");

  const revisions = await db("o_generationRevision").where("projectId", projectId);
  assert.equal(revisions.length, 1, "patch should be auditable");

  const latestSnapshot = await snapshotTargetContent({
    projectId,
    artifactType: "script",
    targetType: "o_script",
    targetId: scriptId,
    targetField: "content",
    title: "第1集最新快照",
  });
  assert.equal(latestSnapshot.segmentCount, 2, "manual snapshot should segment current content");

  await cleanup(projectId);
  await knexDb.destroy();
}

main().catch(async (err) => {
  console.error(err);
  await knexDb.destroy();
  process.exit(1);
});
