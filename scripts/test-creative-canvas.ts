import assert from "assert";
import fs from "fs";
import express from "express";
import type { AddressInfo } from "net";
import db, { db as knexDb } from "@/utils/db";
import { getCreativeCanvasGraph, patchCreativeCanvasText, saveCreativeCanvasLayout } from "@/utils/creativeCanvas";
import { recordGenerationArtifact } from "@/utils/contentAudit";
import { loadAgentChatHistory, saveAgentChatHistory } from "@/utils/agentChatHistory";
import updateNovelRouter from "@/routes/novel/updateNovel";

async function waitForTables() {
  for (let i = 0; i < 50; i++) {
    const hasCanvas = await db.schema.hasTable("o_creativeCanvasState");
    const hasArtifact = await db.schema.hasTable("o_generationArtifact");
    const hasSegment = await db.schema.hasTable("o_generationSegment");
    const hasRevision = await db.schema.hasTable("o_generationRevision");
    const hasTaskProgress = await db.schema.hasTable("o_taskProgress");
    const hasChatHistory = await db.schema.hasTable("o_agentChatHistory");
    const hasNovel = await db.schema.hasTable("o_novel");
    const hasChapterOrder = hasNovel && (await db.schema.hasColumn("o_novel", "chapterOrder"));
    const hasSectionOrder = hasNovel && (await db.schema.hasColumn("o_novel", "sectionOrder"));
    const hasSection = hasNovel && (await db.schema.hasColumn("o_novel", "section"));
    if (hasCanvas && hasArtifact && hasSegment && hasRevision && hasTaskProgress && hasChatHistory && hasChapterOrder && hasSectionOrder && hasSection) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("creative canvas tables were not created");
}

async function cleanup(projectId: number) {
  const scripts = await db("o_script").where("projectId", projectId).select("id");
  const scriptIds = scripts.map((item) => item.id).filter(Boolean) as number[];
  const storyboards = await db("o_storyboard").where("projectId", projectId).select("id");
  const storyboardIds = storyboards.map((item) => item.id).filter(Boolean) as number[];
  const assets = await db("o_assets").where("projectId", projectId).select("id");
  const assetIds = assets.map((item) => item.id).filter(Boolean) as number[];
  await db("o_imageFlow").where("id", projectId + 9000).delete();
  if (storyboardIds.length) await db("o_assets2Storyboard").whereIn("storyboardId", storyboardIds).delete();
  if (scriptIds.length) await db("o_scriptAssets").whereIn("scriptId", scriptIds).delete();
  if (assetIds.length) await db("o_image").whereIn("assetsId", assetIds).delete();
  await db("o_generationRevision").where("projectId", projectId).delete();
  await db("o_generationSegment").where("projectId", projectId).delete();
  await db("o_generationArtifact").where("projectId", projectId).delete();
  await db("o_creativeCanvasState").where("projectId", projectId).delete();
  await knexDb("o_agentChatHistory").where("projectId", projectId).delete();
  await db("o_agentWorkData").where("projectId", projectId).delete();
  if (await db.schema.hasTable("o_taskProgress")) await db("o_taskProgress").where("projectId", projectId).delete();
  await db("o_video").where("projectId", projectId).delete();
  await db("o_videoTrack").where("projectId", projectId).delete();
  await db("o_storyboard").where("projectId", projectId).delete();
  await db("o_assets").where("projectId", projectId).delete();
  await db("o_tasks").where("projectId", projectId).delete();
  if (await db.schema.hasTable("o_genQueue")) await db("o_genQueue").where("projectId", projectId).delete();
  await db("o_script").where("projectId", projectId).delete();
  await db("o_novel").where("projectId", projectId).delete();
  await db("o_project").where("id", projectId).delete();
}

function findNode(graph: Awaited<ReturnType<typeof getCreativeCanvasGraph>>, id: string) {
  const node = graph.nodes.find((item) => item.id === id);
  assert.ok(node, `missing node ${id}`);
  return node;
}

async function postUpdateNovel(body: Record<string, unknown>) {
  const app = express();
  app.use(express.json());
  app.use("/", (updateNovelRouter as any).default ?? updateNovelRouter);
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const port = (server.address() as AddressInfo).port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json: any = {};
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, json, text };
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
}

async function main() {
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("match[0].slice(1)"), "prompt @ mention trigger should read the matched token");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes('kind: "storyboard"'), "storyboard prompt editor should use the shared floating mention picker");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes('kind: "videoPrompt"'), "video prompt editor should use the shared floating mention picker");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("routeStageAgentMessage"), "non-script tabs should route agent composer commands to existing actions");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("startAgentResize"), "agent panel should expose a drag resize handler");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("layoutVideoRows"), "layout optimizer should align storyboard, video prompt, video, and task rows by graph links");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("layoutNodeHeight"), "layout optimizer should stack cards by their declared heights");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("flowHeight"), "expanded image generation flows should use staged non-overlapping columns");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("storyboardStatusAnswer"), "storyboard agent should answer stage-level status questions without requiring a selected node");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("agentMentionItems"), "agent composer should offer @ mentions for visible canvas nodes");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("agentTargetStatusAnswer"), "agent composer should answer status questions for mentioned canvas nodes");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("videoPromptTargets"), "video agent should map mentioned storyboards to linked video prompt cards");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("isVideoCountQuestion"), "video agent should treat video count questions as queries");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("videoPromptTargetsByShotNumber"), "video agent should map 镜头N wording to the linked video prompt");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("videoStatusAnswer"), "video agent should summarize generation, selection, and compose readiness");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("submitVideoCompose"), "video agent should submit selected tracks to compose/merge endpoints");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("/production/workbench/generateVideo"), "video agent should submit real video generation separately from prompt regeneration");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("已收到，开始提交"), "stage agent should acknowledge long-running video actions before awaiting backend work");
  assert.ok(fs.existsSync("src/routes/creativeCanvas/resolveIntent.ts"), "creative canvas should expose an LLM intent resolver endpoint");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("/creativeCanvas/resolveIntent"), "agent composer should call the LLM intent fallback");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("nodePositionOverrides"), "expanded asset and image-flow cards should keep drag positions");
  assert.ok(!fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("firstFlowItem"), "asset group expansion should not auto-open the first asset image flow");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes('else if (node.type === "asset" && node.data?.asset?.flowId) toggleAssetFlow'), "clicking an asset card with a real flow should expand it");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("点击展开资产卡片"), "asset group hint should describe the first expansion level only");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("assetImage"), "expanded assets should render separate image cards");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("tfcc-asset-prompt-preview"), "expanded asset cards should show compact prompt previews");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("assetTypeLabel"), "expanded asset cards should show readable id and type titles");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("enableScore: true"), "asset candidate generation should enable score-based selection");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("candidateCount: 4"), "asset candidate generation should create multiple image cards");
  assert.ok(!fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("tfcc-asset-flow-toggle"), "asset cards should not add a separate flow button");
  assert.ok(!fs.readFileSync("data/web/creative-canvas.js", "utf8").includes('text: "生成资产图"'), "asset prompt cards should not expose a separate inspector generate button");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes('viewKey: state.view || "overview"'), "canvas layout should load and save per tab view");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("restoreVirtualNodePositions"), "expanded virtual cards should restore saved positions");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("syncCanvasHostInset"), "canvas overlay should avoid the host GUI title bar");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("scheduleCanvasResizeFit"), "canvas should refit after GUI window resize");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes('return AGENT_PROFILES[state.view] ? state.view : "overview"'), "agent mode should be fixed by the active tab");
  assert.ok(!fs.readFileSync("data/web/creative-canvas.js", "utf8").includes('state.view === "overview" ? nodeCategory'), "overview agent should not be hijacked by the selected node");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("overviewStatusAnswer"), "overview agent should answer project progress and next-step questions");
  assert.ok(fs.readFileSync("data/web/creative-canvas.js", "utf8").includes("runOverviewDispatch"), "overview agent should dispatch explicit cross-stage commands");
  const canvasJs = fs.readFileSync("data/web/creative-canvas.js", "utf8");
  assert.ok(canvasJs.includes("const fallback = graphNodes().find((node) => visible.has(node.id))"), "switching to an empty tab should select a visible fallback node");
  assert.ok(canvasJs.includes('{ key: "source", label: "原文管理" }'), "canvas should expose source management as a first-class view");
  assert.ok(canvasJs.includes('node.type === "novelChapter"'), "source chapters should render as individual chapter nodes");
  assert.ok(canvasJs.includes('node.type === "novelSection"'), "source events should render as event analysis nodes");
  assert.ok(canvasJs.includes('node.type === "sourceReference"'), "source reference images should render as canvas nodes");
  assert.ok(canvasJs.includes("/novel/event/generateEvents"), "source chapter cards should be able to trigger event analysis");
  assert.ok(canvasJs.includes("/production/editImage/generateFlowImage"), "source chapter cards should be able to generate reference images");
  const submitVideosBlock = canvasJs.slice(canvasJs.indexOf("async function submitVideos"), canvasJs.indexOf("async function sendAgentMessage"));
  assert.ok(!submitVideosBlock.includes("audio: false"), "video generation should not force optional audio off");
  assert.ok(canvasJs.includes("Array.isArray(result)"), "source chapter inspector should accept the actual getNovelData array response");
  assert.ok(canvasJs.includes("chapterOrder: full.chapterOrder"), "source chapter save should persist the editable chapterOrder");
  assert.ok(canvasJs.includes("sectionOrder: full.sectionOrder"), "source chapter save should persist the editable sectionOrder");
  assert.ok(canvasJs.includes("normalizeNovelSaveItem"), "source chapter save should normalize editable order fields before posting");
  assert.ok(canvasJs.includes("delete state.novelFullCache[pid]") && canvasJs.includes("loadNovelFull({ force: true })"), "source chapter save should reload server data instead of trusting local cache");
  assert.ok(canvasJs.includes("章 Order") && canvasJs.includes("节 Order"), "source inspector should expose chapter and section order fields");
  assert.ok(canvasJs.includes('state.view === "script" && (node.type === "novelChapter" || node.type === "novelSection")'), "script canvas should keep upstream source/event nodes visible so edges have anchors");
  assert.ok(canvasJs.includes('if (node.type === "novelChapter") return renderSourceInspectorContent(node);') && canvasJs.includes('if (node.type === "novelSection") return renderSourceEventInspectorContent(node);'), "source event nodes should not use the chapter editing inspector");
  assert.ok(canvasJs.includes("renderSourceEventInspectorContent"), "source event nodes should have a read-only event inspector");
  assert.ok(canvasJs.includes("sourceChapterDisplayTitle"), "source chapter cards should title chapters with chapter and section order");
  assert.ok(canvasJs.includes("if (!hasSection) return chapterPart"), "source chapter cards should not display a fake section 0 title");
  assert.ok(canvasJs.includes("sourceDisplayData"), "source cards should prefer the full editable novel data over stale graph summaries");
  assert.ok(canvasJs.includes("sourceProjectStats"), "source project card should use source-specific stats");
  assert.ok(canvasJs.includes('chip(sourceStats.chapterCount, "章")') && canvasJs.includes('chip(sourceStats.sectionCount, "节")'), "source project card should show chapter and section counts");
  assert.ok(!canvasJs.includes('chip(summary.novelCount, "章节")'), "overview project card should not collapse chapter and section counts into one chip");
  assert.ok(!canvasJs.includes("runScriptAgentPrompt"), "script workflow should use the agent composer instead of project-card shortcut buttons");
  assert.ok(canvasJs.includes("function httpOriginFallback()"), "canvas should not use file:// or null as the backend origin fallback");
  assert.ok(canvasJs.includes("resolveRuntimeApiBase") && canvasJs.includes("toonflow://getappurl"), "canvas should read the current Electron backend URL instead of stale persisted ports");
  assert.ok(canvasJs.includes("function socketOrigin()"), "script agent socket should derive the backend origin from apiBase");
  assert.ok(canvasJs.includes("function mediaUrl(value)"), "canvas media URLs should normalize backend-relative asset paths");
  assert.ok(canvasJs.includes('url.port === "0"'), "canvas media URLs should repair stale localhost:0 asset URLs");
  assert.ok(canvasJs.includes("key === \"src\" && [\"img\", \"video\", \"source\"].includes(tag)") && canvasJs.includes("mediaUrl(value)"), "image and video src attributes should resolve through the backend origin");
  assert.ok(canvasJs.includes("接口返回非 JSON，可能连接到了错误的前端地址或旧服务"), "canvas API calls should fail clearly when connected to the wrong origin");
  assert.ok(canvasJs.includes("${socketOrigin()}/socket.io/socket.io.js"), "script agent should load the Socket.IO client from the backend origin");
  assert.ok(canvasJs.includes("${socketOrigin()}/api/socket/scriptAgent"), "script agent should connect to the backend socket namespace");
  assert.ok(canvasJs.includes("window.__tfccSocketIoPromise = null"), "failed Socket.IO client loads should be retryable");
  assert.ok(!canvasJs.includes("${location.origin}/socket.io/socket.io.js"), "script agent should not load Socket.IO from the frontend origin");
  assert.ok(!canvasJs.includes("${location.origin}/api/socket/scriptAgent"), "script agent should not connect sockets through the frontend origin");
  assert.ok(fs.readFileSync("data/web/index.html", "utf8").includes("creative-canvas.js?v=20260629000100"), "creative canvas script URL should bust stale renderer cache");
  assert.ok(fs.readFileSync("src/app.ts", "utf8").includes("process.env.PORT = String(realPort)"), "random-port backend startup should expose the real port to OSS URL generation");
  const updateAgentMessageBlock = canvasJs.slice(canvasJs.indexOf("function updateAgentMessage"), canvasJs.indexOf("function addAgentContent"));
  assert.ok(updateAgentMessageBlock.includes("state.agentRunning = false;"), "script agent terminal message updates should clear the current running state");
  assert.ok(!updateAgentMessageBlock.includes("state.agentMessages.some"), "stale pending history should not keep the script composer in stop mode");
  assert.ok(canvasJs.includes('node.type === "storySkeleton"') && canvasJs.includes('node.type === "adaptationStrategy"'), "script agent plan outputs should render as canvas cards");
  const scriptAgentTools = fs.readFileSync("src/agents/scriptAgent/tools.ts", "utf8");
  assert.ok(scriptAgentTools.includes("chapterOrder, chapterIndex"), "script agent should treat chapterOrder as the display order with chapterIndex fallback");
  assert.ok(scriptAgentTools.includes('whereIn("chapterOrder", chapterOrders)'), "script agent event lookup should query by chapterOrder");
  assert.ok(scriptAgentTools.includes('where("chapterOrder", chapterOrder)'), "script agent original text lookup should query by chapterOrder");
  assert.ok(!scriptAgentTools.includes('"chapterIndex as index"'), "script agent should not expose import chapterIndex as the user-facing chapter number");
  assert.ok(!scriptAgentTools.includes(".where({ chapterIndex })"), "script agent should not query original text by import chapterIndex");
  assert.ok(canvasJs.includes("sourceEventBadge"), "source event state should drive card and inspector status");
  assert.ok(canvasJs.includes("sourceEventPreview"), "source event cards should have explicit pending, failed, and empty previews");
  assert.ok(canvasJs.includes("事件正在分析，完成后会自动刷新。"), "source event cards should show an analysis-in-progress preview instead of copied chapter text");
  assert.ok(!canvasJs.includes("data.event || data.chapterData"), "source event cards should not fall back to chapter text when event analysis is pending");
  assert.ok(canvasJs.includes("patchNovelFullCache(novelId, { event: \"\", eventState: 0"), "reanalyzing a source chapter should clear stale cached events immediately");
  assert.ok(canvasJs.includes("delete state.novelFullCache[pid]") && canvasJs.includes("await loadNovelFull({ force: true });"), "source event polling should refresh full chapter data after backend analysis updates");
  assert.ok(canvasJs.includes("scheduleSourceEventPoll"), "source event analysis should poll until the backend result is visible");
  assert.ok(fs.readFileSync("src/utils/creativeCanvas.ts", "utf8").includes("COALESCE(chapterOrder, chapterIndex, id)"), "source chapters should be sorted by chapterOrder with chapterIndex fallback");
  assert.ok(fs.readFileSync("src/routes/novel/getNovelData.ts", "utf8").includes('"chapterIndex as index"'), "full novel data should expose the same index alias used by save");
  assert.ok(!canvasJs.includes("}/2000"), "source body character count should not show a fake hard limit");
  assert.ok(canvasJs.includes("currentProjectProgressItems"), "progress board should use project-level progress when no script is selected");
  assert.ok(canvasJs.includes('text: scriptContext ? "当前剧集进度" : "当前项目进度"'), "progress board title should match project versus episode context");
  const assetRoute = canvasJs.slice(canvasJs.indexOf('const assetAnswer = mode === "asset"'), canvasJs.indexOf('} else if (mode === "storyboard")'));
  assert.ok(canvasJs.includes("isAssetStatusQuestion"), "asset agent should recognize natural asset status wording");
  assert.ok(canvasJs.includes("如何了") && canvasJs.includes("什么情况"), "asset status matcher should cover natural progress questions");
  assert.ok(canvasJs.includes("wantsAssetAction"), "asset agent should require explicit action wording before submitting asset jobs");
  assert.ok(canvasJs.includes("assetStatusAnswer"), "asset agent should answer stage-level completeness questions");
  assert.ok(canvasJs.includes("maybePromptAssetImageNextStage"), "asset agent should prompt for image generation after extraction completes");
  assert.ok(canvasJs.includes("是否进入下一阶段「自动生成全部资产图」"), "asset extraction completion prompt should offer the asset-image next stage");
  assert.ok(canvasJs.includes("/assetsGenerate/batchGenerateImageAssets"), "asset agent should batch-submit all missing asset image candidates");
  assert.ok(canvasJs.includes("scheduleAssetImagePoll"), "asset candidate image generation should refresh the canvas while jobs are running");
  assert.ok(canvasJs.includes("hasAssetImageWorkInProgress"), "asset image polling should stop when candidate jobs finish");
  assert.ok(canvasJs.includes("wantsNextStage") && canvasJs.includes("enterNextStageFromAgent"), "asset agent should understand next-stage navigation");
  assert.ok(canvasJs.includes("analysis: \"storyboard\""), "next-stage navigation should map storyboard analysis to the storyboard canvas tab");
  assert.ok(assetRoute.indexOf("shouldSubmitAllAssetImages") < assetRoute.indexOf("wantsNextStage(text)"), "asset image confirmation should run before generic next-stage navigation");
  assert.ok(assetRoute.indexOf("shouldSubmitAllAssetImages") < assetRoute.indexOf("extractAssetsForScript(scriptId())"), "asset image generation should not fall through to asset re-extraction");
  assert.ok(assetRoute.indexOf("wantsNextStage(text)") < assetRoute.indexOf("} else if (assetAnswer)"), "asset next-stage commands should not be answered as asset status");
  assert.ok(assetRoute.includes("} else if (assetAnswer)"), "asset status questions should be answered before action routing");
  assert.ok(assetRoute.indexOf("assetAnswer") < assetRoute.indexOf("extractAssetsForScript(scriptId())"), "asset status questions should not fall through to extraction");
  assert.ok(assetRoute.includes("else if (wantsAssetAction(text))"), "asset extraction should only run for explicit asset action requests");
  assert.ok(assetRoute.includes('assetStatusAnswer("资产状态")'), "ambiguous asset input should fall back to a status answer instead of extraction");
  assert.ok(canvasJs.includes('"auditArtifact", "auditSegment"'), "overview should hide audit history cards instead of showing event snapshots as duplicate business nodes");
  const socketOutputBlock = canvasJs.slice(canvasJs.indexOf('socket.on("message"'), canvasJs.indexOf('socket.on("getPlanData"'));
  assert.ok(canvasJs.includes("agentBodyScrollSnapshot") && canvasJs.includes("restoreAgentOutputScroll"), "agent panel rerenders should preserve chat scroll position");
  assert.ok(canvasJs.includes("agentStickToOutput"), "local agent messages should keep full rerenders focused on the latest chat output");
  assert.ok(canvasJs.includes("state.agentStickToOutput = true"), "new local agent messages should request bottom scroll restoration");
  assert.ok(socketOutputBlock.includes("renderAgentOnly(true)"), "agent streaming socket updates should keep the chat body focused on latest output");
  assert.ok(canvasJs.includes('if (state.view === "script") return null'), "script canvas view should not be scoped by the episode selector");
  assert.ok(canvasJs.includes("usesScriptFilterForView() && state.selectedScriptId"), "episode filtering should only apply to script-scoped production views");
  const updateAgentContentBlock = canvasJs.slice(canvasJs.indexOf("function updateAgentContent"), canvasJs.indexOf("function contentText"));
  assert.ok(updateAgentContentBlock.includes("syncScriptAgentArtifacts(message.id)"), "script agent artifacts should sync during streaming content updates");
  assert.ok(canvasJs.includes("function scriptArtifactIssue"), "script agent should detect incomplete scriptItem output");
  assert.ok(canvasJs.includes("缺少 </scriptItem>，未写入剧本卡片"), "incomplete script output should explain why no card was created");
  assert.ok(canvasJs.includes("syncScriptAgentArtifacts(message.id, true)"), "terminal script agent messages should validate incomplete artifacts");
  assert.ok(canvasJs.includes("资产提取接口未返回任务编号，任务未提交成功"), "asset extraction should require a real backend task id before reporting success");
  assert.ok(canvasJs.includes("脚本处于提取中，但未找到任务记录"), "asset extraction progress should expose missing backend task records");
  assert.ok(canvasJs.includes('content?.type === "thinking" && content.status === "complete"'), "completed thinking/tool progress should not stay in the visible chat transcript");
  assert.ok(canvasJs.includes("stripCompletedAgentProcessText"), "completed script agent messages should hide trailing tool progress text");
  assert.ok(canvasJs.includes("scriptEpisodeOrderValue"), "script canvas layout should sort episode cards by EP number before id fallback");
  assert.ok(!canvasJs.includes('markStaleAgentArtifacts("上次生成中断")'), "history reload should not mark active script output as failed");
  assert.ok(!canvasJs.includes('markStaleAgentArtifacts("连接中断")'), "temporary socket disconnect should not mark active script output as failed");
  assert.ok(canvasJs.includes('markStaleAgentArtifacts("已停止生成")'), "stopped script output should be marked instead of silently staying pending");
  assert.ok(canvasJs.includes("ensureProductionAgentSocket"), "storyboard stage should connect to productionAgent for AI shot breakdown");
  assert.ok(canvasJs.includes('socket.on("getFlowData"'), "productionAgent socket should be able to read canvas production workspace data");
  assert.ok(canvasJs.includes('socket.on("saveFlowData"'), "productionAgent socket should be able to persist director plan and storyboard table data");
  assert.ok(canvasJs.includes('socket.on("addStoryboard"'), "productionAgent socket should be able to write storyboard cards back to the canvas");
  assert.ok(canvasJs.includes("wantsStoryboardAnalysisAction"), "storyboard agent should recognize analysis and shot-breakdown requests");
  assert.ok(canvasJs.includes("wantsStoryboardPipelineContinuation"), "storyboard agent should treat plan confirmations as pipeline continuations");
  assert.ok(canvasJs.includes("shouldRunStoryboardPipeline"), "storyboard pipeline confirmations should be routed before status answers");
  assert.ok(canvasJs.includes("recentStoryboardDecisionPrompt"), "storyboard agent should inspect recent decision prompts before routing short replies");
  assert.ok(canvasJs.includes("wantsStoryboardDecisionExecution"), "complete storyboard decision replies should continue the production pipeline");
  assert.ok(canvasJs.includes("storyboardDecisionReplyAnswer"), "incomplete storyboard decision replies should get a targeted clarification");
  assert.ok(canvasJs.includes("我理解你要处理「时长修复」"), "duration repair without A/B should not fall back to missing storyboard status");
  assert.ok(canvasJs.includes("storyboardDecisionAnswer"), "storyboard decision clarifications should be routed before generic status answers");
  assert.ok(canvasJs.includes('!shouldRunStoryboardPipeline ? storyboardStatusAnswer(text) : ""'), "storyboard status answers should not intercept pipeline continuation commands");
  assert.ok(canvasJs.includes("完整分镜"), "storyboard agent should treat repair-style replies as pipeline continuation commands");
  assert.ok(canvasJs.includes("审[计核]修复"), "storyboard agent should route audit repair commands into the production pipeline");
  assert.ok(canvasJs.includes("add_flowData_storyboard") && canvasJs.includes("真实分镜节点") && canvasJs.includes("写入(?:真实)?分镜"), "storyboard agent should route explicit write-to-board commands into the production pipeline");
  assert.ok(canvasJs.includes("recentAgentDialogueText(8)"), "storyboard pipeline prompts should include recent agent context for option-based replies");
  assert.ok(canvasJs.includes("submitStoryboardAnalysis"), "storyboard agent should submit missing storyboard analysis instead of requiring an existing storyboard card");
  assert.ok(canvasJs.includes('socket.emit("storyboardPipeline"'), "storyboard agent should submit the full production pipeline instead of a generic chat request");
  assert.ok(canvasJs.includes("nodeMarkdownPreview"), "canvas nodes should render markdown previews instead of raw markdown text");
  assert.ok(canvasJs.includes("shortMarkdown"), "canvas markdown previews should preserve line breaks for tables and headings");
  assert.ok(canvasJs.includes("beginNodeResize"), "canvas nodes should expose a manual resize handler");
  assert.ok(canvasJs.includes("tfcc-node-resize"), "canvas nodes should render a resize handle");
  assert.ok(canvasJs.includes("nodePreviewLimit"), "resized canvas nodes should reveal more markdown preview content");
  assert.ok(canvasJs.includes("parseProductionAgentArtifacts"), "production agent XML artifacts should have a frontend fallback parser");
  assert.ok(canvasJs.includes("syncProductionAgentArtifacts"), "production agent XML artifacts should be synced into canvas workspace data");
  assert.ok(canvasJs.includes("__tfccProductionContext"), "production agent socket should keep a stable project/script context snapshot");
  assert.ok(canvasJs.includes("getProductionFlowData(productionContext)"), "production agent tools should read from the socket context snapshot");
  assert.ok(canvasJs.includes("saveProductionFlowData(next, productionContext)"), "production agent XML fallback should persist recovered pipeline artifacts to the socket context");
  const productionAgentSocket = fs.readFileSync("src/socket/routes/productionAgent.ts", "utf8");
  assert.ok(productionAgentSocket.includes('socket.on("storyboardPipeline"'), "productionAgent backend should expose a storyboard pipeline event");
  const productionTools = fs.readFileSync("src/agents/productionAgent/tools.ts", "utf8");
  assert.ok(productionTools.includes("save_flowData"), "productionAgent should have a tool for persisting pipeline artifacts");
  assert.ok(productionTools.includes("const res = await socketQueue") && productionTools.includes("新增分镜失败"), "storyboard tool should wait for canvas write success and surface failures");
  assert.ok(productionTools.includes("flexibleNumberArraySchema") && productionTools.includes("flexibleBooleanSchema"), "storyboard write tool should accept model-natural booleans and asset-id arrays without schema-level parameter errors");
  assert.ok(productionTools.includes("JSON.parse(value)") && productionTools.includes("shouldGenerateImage ="), "storyboard write tool should normalize flexible inputs before sending them to the canvas bridge");
  assert.ok(canvasJs.includes("? (/^(?:true|1|yes|y|是|需要|生成)$/i.test(raw.shouldGenerateImage.trim()) ? 1 : 0)"), "storyboard socket bridge should send numeric shouldGenerateImage to the REST validator");
  const productionAgentIndex = fs.readFileSync("src/agents/productionAgent/index.ts", "utf8");
  assert.ok(productionAgentIndex.includes("counter.getToolCount(requiredToolName)"), "production subagents should validate the specific persistence tool they are instructed to call");
  assert.ok(productionAgentIndex.includes('requiredToolName: "save_flowData"'), "director and storyboard-table subagents should require save_flowData instead of accepting text-only output");
  assert.ok(productionAgentIndex.includes('requiredToolName: "add_flowData_storyboard"'), "storyboard-panel subagent should require add_flowData_storyboard instead of accepting text-only output");
  assert.ok(productionAgentIndex.includes("禁止在正文输出完整分镜表") && productionAgentIndex.includes("禁止在正文输出分镜 XML"), "storyboard subagents should pass large artifacts through tools instead of streaming long table text");
  assert.ok(fs.readFileSync("src/utils/agent/toolUseGuard.ts", "utf8").includes("getToolCount"), "tool-use guard should count calls by tool name");
  const canvasCss = fs.readFileSync("data/web/creative-canvas.css", "utf8");
  const assetListCss = canvasCss.slice(canvasCss.indexOf(".tfcc-asset-list {"), canvasCss.indexOf(".tfcc-asset-list-row {"));
  const chatStreamCss = canvasCss.slice(canvasCss.indexOf(".tfcc-chat-body .tfcc-agent-stream {"), canvasCss.indexOf("/* 会话消息头"));
  assert.ok(!assetListCss.includes("overflow-y"), "asset preview list should use the inspector column scroll instead of nested scrolling");
  assert.ok(chatStreamCss.includes("overflow: visible"), "asset task history should not create a nested scroll inside the chat body");
  assert.ok(fs.readFileSync("data/web/creative-canvas.css", "utf8").includes("--tfcc-agent-width"), "agent panel width should be controlled by a CSS variable");
  assert.ok(fs.readFileSync("data/web/creative-canvas.css", "utf8").includes("var(--tfcc-host-top, 0px)"), "canvas overlay should reserve host title bar height");
  assert.ok(fs.readFileSync("data/web/creative-canvas.css", "utf8").includes("height: 210px;"), "expanded asset cards should have a bounded height");
  assert.ok(fs.readFileSync("data/web/creative-canvas.css", "utf8").includes("position: fixed;"), "prompt mention menu should float instead of expanding the node");
  assert.ok(fs.readFileSync("data/web/creative-canvas.css", "utf8").includes("resize: vertical;"), "editable prompt cards should allow vertical resizing");

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
  const [novelId] = await db("o_novel").insert({
    projectId,
    chapterIndex: 1,
    chapterOrder: 1,
    sectionOrder: 0,
    reel: "正文卷",
    chapter: "旧剧院",
    section: "开场",
    chapterData: "林澈收到纸条。",
    eventState: 1,
    event: "林澈进入旧剧院，发现桌上的纸条发光。",
    createTime: Date.now(),
  });
  const [conflictNovelId] = await db("o_novel").insert({
    projectId,
    chapterIndex: 2,
    chapterOrder: 2,
    sectionOrder: 0,
    reel: "正文卷",
    chapter: "冲突章节",
    section: "冲突节",
    chapterData: "冲突测试。",
    eventState: 0,
    createTime: Date.now(),
  });
  const conflictResult = await postUpdateNovel({
    id: conflictNovelId,
    index: 2,
    chapterOrder: 1,
    sectionOrder: 0,
    reel: "正文卷",
    chapter: "冲突章节",
    section: "冲突节",
    chapterData: "冲突测试。",
    event: "",
  });
  assert.equal(conflictResult.status, 400, `duplicate chapter/section order should be rejected: ${conflictResult.text}`);
  assert.match(String((conflictResult.json as any).message || ""), /冲突/, "duplicate order rejection should explain the conflict");
  await db("o_novel").where("id", conflictNovelId).delete();
  const sectionUpdateResult = await postUpdateNovel({
    id: novelId,
    index: 1,
    chapterOrder: 1,
    sectionOrder: 2,
    reel: "正文卷",
    chapter: "旧剧院",
    section: "纸条发光",
    chapterData: "林澈收到纸条。",
    event: "林澈进入旧剧院，发现桌上的纸条发光。",
  });
  assert.equal(sectionUpdateResult.status, 200, `section order and title should be saved: ${sectionUpdateResult.text}`);
  const updatedNovel = await db("o_novel").where("id", novelId).select("sectionOrder", "section").first();
  assert.equal(updatedNovel?.sectionOrder, 2, "section order should persist to o_novel");
  assert.equal(updatedNovel?.section, "纸条发光", "section title should persist to o_novel");
  const [scriptId] = await db("o_script").insert({
    projectId,
    name: "第1集",
    content: "林澈走进旧剧院。纸条在桌上发光。",
    createTime: Date.now(),
  });
  const [otherScriptId] = await db("o_script").insert({
    projectId,
    name: "远山的呼唤 EP03: 神农架·启程",
    content: "林澈走进办公室。",
    createTime: Date.now() + 1,
  });
  const [ep02ScriptId] = await db("o_script").insert({
    projectId,
    name: "远山的呼唤 EP02: 三年磨一剑",
    content: "林澈准备第二集。",
    createTime: Date.now() + 2,
  });
  await db("o_agentWorkData").insert({
    projectId,
    key: "scriptAgent",
    data: JSON.stringify({
      storySkeleton: "林澈发现纸条后进入旧剧院，故事围绕纸条秘密展开。",
      adaptationStrategy: "保留旧剧院悬疑主线，强化开场三十秒钩子。",
      script: [],
    }),
    createTime: Date.now(),
    updateTime: Date.now(),
  });
  await db("o_agentWorkData").insert({
    projectId,
    episodesId: scriptId,
    key: "productionAgent",
    data: JSON.stringify({
      script: "林澈走进旧剧院。纸条在桌上发光。",
      scriptPlan: "导演规划：旧剧院开场需要低照度、慢推镜头和纸条特写。",
      assets: [],
      storyboardTable: "分镜表：镜头1旧剧院全景，镜头2纸条特写。",
      storyboard: [],
    }),
    createTime: Date.now(),
    updateTime: Date.now(),
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
  const [referenceOnlyAssetId] = await db("o_assets").insert({
    projectId,
    scriptId,
    name: "参考角色",
    type: "role",
    describe: "只作为分镜参考图出现的角色",
    prompt: "reference role sheet",
  });
  await db("o_scriptAssets").insert({ scriptId, assetId: referenceOnlyAssetId });
  const referenceOnlyImage = "/creative-canvas-test/reference-role.png";
  await db("o_image").insert({ assetsId: referenceOnlyAssetId, filePath: referenceOnlyImage, state: "已完成" });
  await db("o_imageFlow").insert({
    id: projectId + 9000,
    flowData: JSON.stringify({
      nodes: [
        { id: "upload-reference-role", type: "upload", data: { image: referenceOnlyImage } },
        {
          id: "generated-scene",
          type: "generated",
          data: {
            generatedImage: "/creative-canvas-test/generated-scene.png",
            references: [{ image: referenceOnlyImage }],
            prompt: "scene image using the role as a reference",
          },
        },
      ],
      edges: [{ id: "edge-reference-role", source: "upload-reference-role", target: "generated-scene" }],
    }),
  });
  const [otherAssetId] = await db("o_assets").insert({
    projectId,
    scriptId: otherScriptId,
    name: "办公室",
    type: "scene",
    describe: "明亮整洁的办公室",
    prompt: "modern office interior, bright daylight",
  });
  await db("o_scriptAssets").insert({ scriptId: otherScriptId, assetId: otherAssetId });
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
  await db("o_videoTrack").where("id", trackId).update({ videoId });
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
  const novelChapter = findNode(graph, `novelChapter:${novelId}`);
  assert.equal(novelChapter.type, "novelChapter", "source management should render a chapter node");
  assert.equal(novelChapter.label, "旧剧院", "chapter card title should match the editable chapter title");
  assert.equal((novelChapter.data as any).id, novelId, "chapter node should reference the source novel chapter");
  assert.equal((novelChapter.data as any).chapter, "旧剧院", "chapter node should expose the chapter title");
  assert.equal((novelChapter.data as any).chapterOrder, 1, "chapter node should expose display order separately from chapterIndex");
  assert.equal((novelChapter.data as any).sectionOrder, 2, "chapter node should expose section order");
  assert.equal((novelChapter.data as any).section, "纸条发光", "chapter node should expose section title");
  assert.equal((graph.summary as any).novelCount, 1, "canvas summary should expose source chapter count");
  const novelSection = findNode(graph, `novelSection:${novelId}`);
  assert.equal(novelSection.type, "novelSection", "event analysis should render as an event node");
  assert.equal((novelSection.data as any).id, novelId, "event node should reference the source novel chapter");
  findNode(graph, `script:${scriptId}`);
  const storySkeletonNode = findNode(graph, "scriptPlan:storySkeleton");
  assert.equal(storySkeletonNode.type, "storySkeleton", "script agent story skeleton should render as a canvas card");
  assert.match(String((storySkeletonNode.data as any).contentPreview), /旧剧院/, "story skeleton card should expose its plan preview");
  const adaptationNode = findNode(graph, "scriptPlan:adaptationStrategy");
  assert.equal(adaptationNode.type, "adaptationStrategy", "script agent adaptation strategy should render as a canvas card");
  assert.match(String((adaptationNode.data as any).contentPreview), /三十秒钩子/, "adaptation strategy card should expose its plan preview");
  assert.ok(graph.edges.some((edge: any) => edge.source === `novelChapter:${novelId}` && edge.target === `novelSection:${novelId}`), "event node should be linked from its chapter");
  assert.ok(graph.edges.some((edge: any) => edge.source === `novelSection:${novelId}` && edge.target === `script:${scriptId}`), "script should be linked from event analysis when source events exist");
  assert.ok(graph.edges.some((edge: any) => edge.source === `novelSection:${novelId}` && edge.target === "scriptPlan:storySkeleton"), "story skeleton should be linked from event analysis");
  assert.ok(graph.edges.some((edge: any) => edge.source === "scriptPlan:storySkeleton" && edge.target === "scriptPlan:adaptationStrategy"), "adaptation strategy should be linked from story skeleton");
  assert.ok(graph.edges.some((edge: any) => edge.source === "scriptPlan:adaptationStrategy" && edge.target === `script:${scriptId}`), "script should be linked from adaptation strategy");
  const productionPlanNode = findNode(graph, `scriptPlan:production:${scriptId}`);
  assert.equal(productionPlanNode.type, "scriptPlan", "production director plan should render as a storyboard pipeline card");
  assert.match(String((productionPlanNode.data as any).contentPreview), /低照度/, "production director plan card should expose its saved content");
  const productionStoryboardTableNode = findNode(graph, `storyboardTable:${scriptId}`);
  assert.equal(productionStoryboardTableNode.type, "storyboardTable", "production storyboard table should render as a storyboard pipeline card");
  assert.match(String((productionStoryboardTableNode.data as any).contentPreview), /镜头1/, "storyboard table card should expose its saved content");
  assert.ok(graph.edges.some((edge: any) => edge.source === `script:${scriptId}` && edge.target === `scriptPlan:production:${scriptId}`), "production director plan should be linked from the active script");
  assert.ok(graph.edges.some((edge: any) => edge.source === `scriptPlan:production:${scriptId}` && edge.target === `storyboardTable:${scriptId}`), "storyboard table should be linked from production director plan");
  assert.ok(graph.edges.some((edge: any) => edge.source === `storyboardTable:${scriptId}` && edge.target === `storyboardAnalysis:${scriptId}`), "storyboard analysis should be linked from the saved storyboard table");
  const scriptViewGraph = await getCreativeCanvasGraph({ projectId, scriptId, viewKey: "script" });
  findNode(scriptViewGraph, `script:${scriptId}`);
  findNode(scriptViewGraph, `script:${ep02ScriptId}`);
  findNode(scriptViewGraph, `script:${otherScriptId}`);
  assert.deepEqual(
    scriptViewGraph.nodes.filter((node) => node.type === "script").map((node) => node.label),
    ["第1集", "远山的呼唤 EP02: 三年磨一剑", "远山的呼唤 EP03: 神农架·启程"],
    "script cards should be sorted by episode number instead of insert id",
  );
  // 资产现在聚合为按 type 的组卡（scene 资产 -> assetGroup:scene）
  const sceneGroup = findNode(graph, "assetGroup:scene");
  assert.equal(sceneGroup.type, "assetGroup", "scene assets should aggregate into an assetGroup node");
  assert.equal((sceneGroup.data as any).assetType, "scene", "asset group should carry its asset type");
  assert.equal((sceneGroup.data as any).count, 1, "scene group should count its members");
  assert.ok(Array.isArray((sceneGroup.data as any).items), "asset group should expose items for inspector");
  assert.ok(Array.isArray((sceneGroup.data as any).thumbnails), "asset group should expose a thumbnails array");
  assert.equal((sceneGroup.data as any).items[0].id, assetId, "asset group item should reference the underlying asset id");
  assert.deepEqual((sceneGroup.data as any).items.map((item: any) => item.id), [assetId], "asset group should only include assets linked to the active script");
  assert.equal((sceneGroup.data as any).items[0].flowId, 909001, "asset group item should expose its flowId for the image-flow drawer");
  const roleGroup = findNode(graph, "assetGroup:role");
  const referenceOnlyItem = (roleGroup.data as any).items.find((item: any) => item.id === referenceOnlyAssetId);
  assert.ok(referenceOnlyItem, "role group should include the reference-only role asset");
  assert.equal(referenceOnlyItem.flowId, null, "asset flow should not be inferred from image-flow reference images");
  assert.equal(referenceOnlyItem.images.length, 1, "asset group item should expose generated image cards");
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
  assert.ok(graph.edges.some((edge) => edge.source === `videoPrompt:${trackId}` && edge.target === `task:${videoTaskId}`), "video generation task should link from its video prompt");
  const videoTaskNode = findNode(graph, `task:${videoTaskId}`);
  assert.equal((videoTaskNode.data as any).video.id, videoId, "video generation task should expose its generated video");
  assert.equal((videoTaskNode.data as any).src, "", "video generation task should not duplicate the playable video node");
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
  await saveCreativeCanvasLayout({
    projectId,
    scriptId,
    viewKey: "asset",
    nodesLayout: [{ id: `script:${scriptId}`, x: 789, y: 321 }],
    viewport: { x: 10, y: 20, zoom: 0.8 },
  });
  const graphAfterAssetLayout = await getCreativeCanvasGraph({ projectId, scriptId, viewKey: "asset" });
  assert.deepEqual(findNode(graphAfterAssetLayout, `script:${scriptId}`).position, { x: 789, y: 321 }, "asset tab should restore its own layout");
  const graphAfterOverviewLayout = await getCreativeCanvasGraph({ projectId, scriptId, viewKey: "overview" });
  assert.deepEqual(findNode(graphAfterOverviewLayout, `script:${scriptId}`).position, { x: 123, y: 456 }, "overview layout should not be overwritten by asset tab layout");
  const virtualNodeId = `expandedAsset:assetGroup:scene:${assetId}`;
  await saveCreativeCanvasLayout({
    projectId,
    scriptId,
    viewKey: "asset",
    nodesLayout: [{ id: virtualNodeId, x: 456, y: 654 }],
  });
  const graphWithVirtualLayout = await getCreativeCanvasGraph({ projectId, scriptId, viewKey: "asset" });
  assert.deepEqual((graphWithVirtualLayout as any).layout.nodesLayout[virtualNodeId], { id: virtualNodeId, x: 456, y: 654 }, "saved virtual card layout should be returned for frontend restoration");

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
  assert.equal(interrupted.messages[0].status, "running", "history restore should preserve running messages instead of marking them failed");
  assert.equal(interrupted.messages[0].content?.[0].status, "running", "history restore should preserve running content instead of marking it failed");

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
  assert.ok(patch.staleNodeIds.includes(`video:${videoId}`), "script patch should mark selected video stale through videoId");

  const updated = await db("o_script").where("id", scriptId).first();
  assert.equal(updated?.content, "林澈推开旧剧院的沉重大门。纸条在桌上发光。");
  const graphAfterPatch = await getCreativeCanvasGraph({ projectId, scriptId });
  assert.equal(findNode(graphAfterPatch, `storyboardAnalysis:${scriptId}`).stale, true, "graph should keep stale marker after patch");
  assert.equal(findNode(graphAfterPatch, `videoPrompt:${trackId}`).stale, true, "video prompt node should be stale after upstream edit");
  assert.equal(findNode(graphAfterPatch, `video:${videoId}`).stale, true, "selected video node should be stale after upstream edit");

  await cleanup(projectId);
  await knexDb.destroy();
}

main().catch(async (err) => {
  console.error(err);
  await knexDb.destroy();
  process.exit(1);
});
