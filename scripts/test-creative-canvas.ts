import assert from "assert";
import fs from "fs";
import db, { db as knexDb } from "@/utils/db";
import { getCreativeCanvasGraph, patchCreativeCanvasText, saveCreativeCanvasLayout } from "@/utils/creativeCanvas";
import { recordGenerationArtifact } from "@/utils/contentAudit";
import { loadAgentChatHistory, saveAgentChatHistory } from "@/utils/agentChatHistory";

async function waitForTables() {
  for (let i = 0; i < 50; i++) {
    const hasCanvas = await db.schema.hasTable("o_creativeCanvasState");
    const hasArtifact = await db.schema.hasTable("o_generationArtifact");
    const hasSegment = await db.schema.hasTable("o_generationSegment");
    const hasRevision = await db.schema.hasTable("o_generationRevision");
    const hasTaskProgress = await db.schema.hasTable("o_taskProgress");
    const hasChatHistory = await db.schema.hasTable("o_agentChatHistory");
    if (hasCanvas && hasArtifact && hasSegment && hasRevision && hasTaskProgress && hasChatHistory) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("creative canvas tables were not created");
}

async function cleanup(projectId: number) {
  const scripts = await db("o_script").where("projectId", projectId).select("id");
  const scriptIds = scripts.map((item) => item.id).filter(Boolean) as number[];
  const storyboards = await db("o_storyboard").where("projectId", projectId).select("id");
  const storyboardIds = storyboards.map((item) => item.id).filter(Boolean) as number[];
  if (storyboardIds.length) await db("o_assets2Storyboard").whereIn("storyboardId", storyboardIds).delete();
  if (scriptIds.length) await db("o_scriptAssets").whereIn("scriptId", scriptIds).delete();
  await db("o_generationRevision").where("projectId", projectId).delete();
  await db("o_generationSegment").where("projectId", projectId).delete();
  await db("o_generationArtifact").where("projectId", projectId).delete();
  await db("o_creativeCanvasState").where("projectId", projectId).delete();
  await knexDb("o_agentChatHistory").where("projectId", projectId).delete();
  if (await db.schema.hasTable("o_taskProgress")) await db("o_taskProgress").where("projectId", projectId).delete();
  await db("o_video").where("projectId", projectId).delete();
  await db("o_videoTrack").where("projectId", projectId).delete();
  await db("o_storyboard").where("projectId", projectId).delete();
  await db("o_assets").where("projectId", projectId).delete();
  await db("o_tasks").where("projectId", projectId).delete();
  if (await db.schema.hasTable("o_genQueue")) await db("o_genQueue").where("projectId", projectId).delete();
  await db("o_script").where("projectId", projectId).delete();
  await db("o_project").where("id", projectId).delete();
}

function findNode(graph: Awaited<ReturnType<typeof getCreativeCanvasGraph>>, id: string) {
  const node = graph.nodes.find((item) => item.id === id);
  assert.ok(node, `missing node ${id}`);
  return node;
}

async function main() {
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("match[0].slice(1)"), "prompt @ mention trigger should read the matched token");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes('kind: "storyboard"'), "storyboard prompt editor should use the shared floating mention picker");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes('kind: "videoPrompt"'), "video prompt editor should use the shared floating mention picker");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("routeStageAgentMessage"), "non-script tabs should route agent composer commands to existing actions");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("startAgentResize"), "agent panel should expose a drag resize handler");
  assert.ok(fs.readFileSync("data/web/creative-canvas.css", "utf8").includes("--tfcc-agent-width"), "agent panel width should be controlled by a CSS variable");
  assert.ok(fs.readFileSync("data/web/creative-canvas.css", "utf8").includes("position: fixed;"), "prompt mention menu should float instead of expanding the node");

  await new Promise((resolve) => setTimeout(resolve, 2000));
  await waitForTables();

  const projectId = Date.now();
  await cleanup(projectId);
  await db("o_project").insert({
    id: projectId,
    projectType: "novel",
    name: "Creative Canvas Test",
    intro: "测试无限画布",
    createTime: projectId,
  });
  const [scriptId] = await db("o_script").insert({
    projectId,
    name: "第1集",
    content: "林澈走进旧剧院。纸条在桌上发光。",
    createTime: Date.now(),
  });
  const [assetId] = await db("o_assets").insert({
    projectId,
    scriptId,
    name: "旧剧院",
    type: "scene",
    describe: "破败但宏大的旧剧院",
    prompt: "old theater interior, dusty stage, cinematic lighting",
    flowId: 909001,
  });
  await db("o_scriptAssets").insert({ scriptId, assetId });
  const [trackId] = await db("o_videoTrack").insert({
    projectId,
    scriptId,
    prompt: "A cinematic shot of an old theater.",
    state: "未生成",
  });
  const [storyboardId] = await db("o_storyboard").insert({
    projectId,
    scriptId,
    trackId,
    index: 0,
    prompt: "@图1 旧剧院远景，桌上纸条发光",
    videoDesc: "林澈推门进入旧剧院，看到桌上的纸条发光。",
    duration: "4",
    shotType: "远景",
    cameraMovement: "推镜",
    dialogue: "",
    soundEffect: "门轴吱呀声",
    state: "未生成",
    flowId: 909002,
  });
  await db("o_assets2Storyboard").insert({ storyboardId, assetId });
  const [videoId] = await db("o_video").insert({
    projectId,
    scriptId,
    videoTrackId: trackId,
    state: "已完成",
    filePath: "test-video.mp4",
  });
  await db("o_videoTrack").where("id", trackId).update({ selectVideoId: videoId });
  const [videoTaskId] = await db("o_tasks").insert({
    projectId,
    taskClass: "视频生成",
    relatedObjects: JSON.stringify({ projectId, videoId, scriptId, type: "视频" }),
    state: "已完成",
    describe: "根据提示词生成视频",
    startTime: Date.now(),
  });
  const [taskId] = await db("o_tasks").insert({
    projectId,
    taskClass: "creativeCanvasTest",
    state: "已完成",
    describe: "测试任务",
    startTime: Date.now(),
  });
  const [assetTaskId] = await db("o_tasks").insert({
    projectId,
    taskClass: "资产提取",
    relatedObjects: JSON.stringify({ source: "script.extractAssets", projectId, scriptIds: [scriptId], scriptId }),
    state: "进行中",
    describe: "从 1 集剧本提取角色/场景/道具资产",
    startTime: Date.now() + 1,
  });
  await db("o_taskProgress").insert([
    {
      taskId: assetTaskId,
      projectId,
      scriptId,
      phase: "submitted",
      status: "pending",
      message: "已提交 1 集资产提取任务",
      current: 0,
      total: 1,
      meta: JSON.stringify({ scriptIds: [scriptId] }),
      createTime: Date.now(),
      updateTime: Date.now(),
    },
    {
      taskId: assetTaskId,
      projectId,
      scriptId,
      phase: "ai_extract",
      status: "running",
      message: "正在调用资产提取 Prompt，分析角色/场景/道具",
      current: 0,
      total: 1,
      meta: null,
      createTime: Date.now() + 1,
      updateTime: Date.now() + 1,
    },
  ]);

  const artifact = await recordGenerationArtifact({
    projectId,
    artifactType: "script",
    targetType: "o_script",
    targetId: scriptId,
    targetField: "content",
    title: "第1集",
    content: "林澈走进旧剧院。纸条在桌上发光。",
    promptHash: "creative-canvas-test-hash",
    promptVersionId: 1,
    promptSource: "creative-canvas-test",
    modelName: "test-model",
    taskId,
  });

  const graph = await getCreativeCanvasGraph({ projectId, scriptId });
  findNode(graph, `project:${projectId}`);
  findNode(graph, `script:${scriptId}`);
  // 资产现在聚合为按 type 的组卡（scene 资产 -> assetGroup:scene）
  const sceneGroup = findNode(graph, "assetGroup:scene");
  assert.equal(sceneGroup.type, "assetGroup", "scene assets should aggregate into an assetGroup node");
  assert.equal((sceneGroup.data as any).assetType, "scene", "asset group should carry its asset type");
  assert.equal((sceneGroup.data as any).count, 1, "scene group should count its members");
  assert.ok(Array.isArray((sceneGroup.data as any).items), "asset group should expose items for inspector");
  assert.ok(Array.isArray((sceneGroup.data as any).thumbnails), "asset group should expose a thumbnails array");
  assert.equal((sceneGroup.data as any).items[0].id, assetId, "asset group item should reference the underlying asset id");
  assert.equal((sceneGroup.data as any).items[0].flowId, 909001, "asset group item should expose its flowId for the image-flow drawer");
  findNode(graph, `storyboardAnalysis:${scriptId}`);
  const analysisNode = findNode(graph, `storyboardAnalysis:${scriptId}`);
  assert.ok(Array.isArray((analysisNode.data as any).shots), "analysis node should expose shots");
  assert.ok("thumbnail" in (analysisNode.data as any).shots[0], "each shot should expose a thumbnail field");
  const storyboardNode = findNode(graph, `storyboard:${storyboardId}`);
  assert.ok("thumbnail" in (storyboardNode.data as any), "storyboard node should expose a thumbnail field");
  assert.equal((storyboardNode.data as any).prompt, "@图1 旧剧院远景，桌上纸条发光", "storyboard node should expose full prompt");
  assert.ok(Array.isArray((storyboardNode.data as any).mentions), "storyboard node should expose prompt references");
  assert.ok((storyboardNode.data as any).mentions.length > 0, "storyboard prompt references should include linked assets");
  assert.equal((storyboardNode.data as any).storyboard.flowId, 909002, "storyboard node should expose its flowId for the image-flow drawer");
  const videoPromptNode = findNode(graph, `videoPrompt:${trackId}`);
  assert.equal((videoPromptNode.data as any).prompt, "A cinematic shot of an old theater.", "video prompt node should expose editable full prompt");
  assert.ok(Array.isArray((videoPromptNode.data as any).mentions), "video prompt node should expose insertable references");
  const videoNode = findNode(graph, `video:${videoId}`);
  assert.ok("poster" in (videoNode.data as any), "video node should expose a poster field");
  // 概览聚合卡
  const videoGroup = findNode(graph, "videoGroup");
  assert.equal((videoGroup.data as any).count, 1, "video group should count videos");
  assert.ok(Array.isArray((videoGroup.data as any).posters), "video group should expose posters array");
  const videoPromptGroup = findNode(graph, "videoPromptGroup");
  assert.equal((videoPromptGroup.data as any).count, 1, "video prompt group should count tracks");
  // 脚本节点应带审计推导的版本信息
  const scriptNode = findNode(graph, `script:${scriptId}`);
  assert.ok((scriptNode.version ?? 0) >= 1, "script node should derive a version from audit snapshots");
  assert.ok(typeof scriptNode.sourceLabel === "string" && scriptNode.sourceLabel.length > 0, "script node should expose a sourceLabel");
  const assetTaskNode = findNode(graph, `assetExtractionTask:${assetTaskId}`);
  assert.equal(assetTaskNode.type, "assetExtractionTask", "asset extraction task should be rendered as a dedicated canvas node");
  assert.ok(Array.isArray(assetTaskNode.data.progress), "asset extraction node should include progress records");
  assert.equal((assetTaskNode.data.progress as any[]).length, 2, "asset extraction node should expose task progress records");
  assert.ok(graph.nodes.some((node) => node.id.startsWith("auditSegment:")), "graph should include editable audit segments");
  assert.ok(graph.edges.some((edge) => edge.source === "assetGroup:scene" && edge.target === `storyboard:${storyboardId}`), "asset group should link to storyboard");
  assert.ok(graph.edges.some((edge) => edge.source === `script:${scriptId}` && edge.target === "assetGroup:scene"), "script should link to asset group");
  assert.ok(graph.edges.some((edge) => edge.source === `script:${scriptId}` && edge.target === `assetExtractionTask:${assetTaskId}`), "script should link to its asset extraction task");
  assert.ok(graph.edges.some((edge) => edge.source === `assetExtractionTask:${assetTaskId}` && edge.target === "assetGroup:scene"), "asset extraction task should link to produced asset group");
  assert.ok(graph.edges.some((edge) => edge.source === `storyboard:${storyboardId}` && edge.target === `task:${videoTaskId}`), "video generation task should link to its storyboard");
  const videoTaskNode = findNode(graph, `task:${videoTaskId}`);
  assert.equal((videoTaskNode.data as any).video.id, videoId, "video generation task should expose its generated video");
  assert.ok((videoTaskNode.data as any).src, "video generation task should expose a playable video src");
  assert.ok((graph.taskProgress || []).some((item: any) => Number(item.taskId) === Number(assetTaskId) && item.phase === "ai_extract"), "graph should expose task progress rows");

  await saveCreativeCanvasLayout({
    projectId,
    scriptId,
    viewKey: "overview",
    nodesLayout: [{ id: `script:${scriptId}`, x: 123, y: 456 }],
    viewport: { x: -12, y: -34, zoom: 0.5 },
  });
  const graphAfterLayout = await getCreativeCanvasGraph({ projectId, scriptId });
  assert.deepEqual(findNode(graphAfterLayout, `script:${scriptId}`).position, { x: 123, y: 456 }, "saved layout should override default position");
  assert.equal(graphAfterLayout.viewport.zoom, 0.5, "viewport should be restored");

  const threadKey = `${projectId}:scriptAgent:${scriptId}`;
  await saveAgentChatHistory({
    projectId,
    scriptId,
    threadKey,
    agentMode: "script",
    draft: "继续写下一场",
    lockedContext: "script:context",
    messages: [
      { id: "m1", role: "user", status: "complete", content: [{ id: "c1", type: "text", data: "当前什么阶段", status: "complete" }] },
      { id: "m2", role: "assistant", name: "统筹", status: "running", content: [{ id: "c2", type: "markdown", data: "正在分析", status: "running" }] },
    ],
  });
  await saveAgentChatHistory({
    projectId,
    scriptId,
    threadKey,
    agentMode: "script",
    draft: "更新后的草稿",
    lockedContext: "",
    messages: [{ id: "m3", role: "assistant", name: "统筹", status: "complete", content: [{ id: "c3", type: "markdown", data: "已恢复", status: "complete" }] }],
  });
  const history = await loadAgentChatHistory(threadKey);
  assert.equal(history.messages.length, 1, "chat history should upsert by threadKey");
  assert.equal(history.messages[0].id, "m3", "chat history should restore saved messages");
  assert.equal(history.draft, "更新后的草稿", "chat history should restore draft");

  const interruptedKey = `${projectId}:scriptAgent:${scriptId}:interrupted`;
  await saveAgentChatHistory({
    projectId,
    scriptId,
    threadKey: interruptedKey,
    messages: [{ id: "m4", role: "assistant", status: "running", content: [{ id: "c4", type: "markdown", data: "半截输出", status: "running" }] }],
  });
  const interrupted = await loadAgentChatHistory(interruptedKey);
  assert.equal(interrupted.messages[0].status, "error", "running messages should not restore as still running");
  assert.equal(interrupted.messages[0].content?.[0].status, "error", "running content should not restore as still running");

  const segment = await db("o_generationSegment").where("artifactId", artifact.id).where("segmentIndex", 0).first();
  assert.ok(segment, "test segment should exist");
  const patch = await patchCreativeCanvasText({
    segmentId: Number(segment.id),
    newText: "林澈推开旧剧院的沉重大门。",
    note: "creative canvas test",
  });
  assert.ok(patch.revisionId, "patch should create revision");
  assert.ok(patch.staleNodeIds.includes(`storyboardAnalysis:${scriptId}`), "script patch should mark storyboard analysis stale");
  assert.ok(patch.staleNodeIds.includes(`videoPrompt:${trackId}`), "script patch should mark video prompt stale");

  const updated = await db("o_script").where("id", scriptId).first();
  assert.equal(updated?.content, "林澈推开旧剧院的沉重大门。纸条在桌上发光。");
  const graphAfterPatch = await getCreativeCanvasGraph({ projectId, scriptId });
  assert.equal(findNode(graphAfterPatch, `storyboardAnalysis:${scriptId}`).stale, true, "graph should keep stale marker after patch");
  assert.equal(findNode(graphAfterPatch, `videoPrompt:${trackId}`).stale, true, "video prompt node should be stale after upstream edit");

  await cleanup(projectId);
  await knexDb.destroy();
}

main().catch(async (err) => {
  console.error(err);
  await knexDb.destroy();
  process.exit(1);
});
