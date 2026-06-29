import db from "@/utils/db";
import oss from "@/utils/oss";
import { getGenerationAuditGraph, patchGenerationSegment } from "@/utils/contentAudit";
import { listTaskProgress } from "@/utils/taskProgress";

/** 资产类型 → 组卡中文标签 */
const ASSET_GROUP_LABELS: Record<string, string> = {
  role: "角色资产",
  scene: "场景资产",
  tool: "道具资产",
};
const ASSET_GROUP_ORDER = ["role", "scene", "tool"] as const;

/** 把 o_image / o_video / o_storyboard 的 filePath 安全转成可访问 URL（缩略图优先） */
async function toThumbUrl(filePath: unknown): Promise<string> {
  const value = String(filePath ?? "").trim();
  if (!value) return "";
  try {
    return await oss.getSmallImageUrl(value);
  } catch {
    return "";
  }
}

async function toFileUrl(filePath: unknown): Promise<string> {
  const value = String(filePath ?? "").trim();
  if (!value) return "";
  try {
    return await oss.getFileUrl(value);
  } catch {
    return "";
  }
}

function normalizeMediaPath(value: unknown): string {
  return String(value ?? "").trim().replace(/^\/+/, "");
}

function scriptEpisodeOrder(row: any) {
  const text = `${row?.name || ""} ${row?.content || ""}`;
  const match = text.match(/\bEP\s*0*(\d+)\b/i) || text.match(/第\s*0*(\d+)\s*集/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function sortScriptRows<T extends { id?: number | null; name?: string | null; content?: string | null }>(rows: T[] = []) {
  return [...rows].sort((a, b) => (
    scriptEpisodeOrder(a)
    - scriptEpisodeOrder(b)
    || Number(a.id || 0) - Number(b.id || 0)
    || String(a.name || "").localeCompare(String(b.name || ""))
  ));
}

export interface CanvasPosition {
  x: number;
  y: number;
}

export interface CreativeCanvasNode {
  id: string;
  type: string;
  label: string;
  position: CanvasPosition;
  width?: number;
  height?: number;
  stale?: boolean;
  staleReason?: string;
  /** 节点状态：已完成 / 需复核 / 生成中 / 待补齐 */
  status?: string;
  /** 版本号（按审计快照次数推导，如 v3） */
  version?: number;
  /** 来源内容 hash（取最近一次审计快照 contentHash） */
  sourceHash?: string;
  /** 最近更新时间（毫秒时间戳） */
  updateTime?: number;
  /** 来源说明，如「来源：EP01 剧本」 */
  sourceLabel?: string;
  data: Record<string, unknown>;
}

export interface CreativeCanvasEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  data?: Record<string, unknown>;
}

export interface CreativeCanvasViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface CreativeCanvasGraphInput {
  projectId?: number;
  scriptId?: number;
  viewKey?: string;
  limit?: number;
}

export interface SaveCreativeCanvasLayoutInput {
  projectId: number;
  scriptId?: number | null;
  viewKey?: string;
  nodesLayout: unknown;
  edgesLayout?: unknown;
  viewport?: unknown;
}

export interface PatchCreativeCanvasTextInput {
  segmentId: number;
  newText: string;
  note?: string | null;
  createdBy?: string | null;
}

interface LayoutItem {
  id: string;
  x?: number;
  y?: number;
  position?: CanvasPosition;
  width?: number;
  height?: number;
}

interface StaleInfo {
  nodeId: string;
  reason: string;
}

interface StoryboardImageAttempt {
  id: string;
  filePath: string;
  thumbnail: string;
  state: string;
  reason: string;
  selected: boolean;
  createTime?: number | null;
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function previewText(value: unknown, max = 160): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

function compactRow(row: any) {
  if (!row) return row;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === "string" && value.length > 600) {
      result[key] = `${value.slice(0, 600)}...`;
    } else {
      result[key] = value;
    }
  }
  return result;
}

function selectedVideoId(row: any): number | null {
  const id = row?.videoId ?? row?.selectVideoId;
  const value = Number(id);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function isSelectedStoryboardImage(row: any): boolean {
  return Boolean(String(row?.filePath ?? "").trim()) && row?.state === "已完成";
}

function storyboardImageStatus(attempt: StoryboardImageAttempt, currentSelectedPath: string): string {
  const path = normalizeMediaPath(attempt.filePath);
  if (currentSelectedPath && path === currentSelectedPath) return "已选中";
  if (!currentSelectedPath && attempt.selected) return "已选中";
  if (attempt.state === "生成失败") return "需复核";
  if (attempt.state === "生成中") return "生成中";
  return attempt.state || "未生成";
}

function normalizeLayoutMap(input: unknown): Record<string, LayoutItem> {
  const parsed = parseJson<any>(input, {});
  if (Array.isArray(parsed)) {
    return parsed.reduce<Record<string, LayoutItem>>((acc, item) => {
      if (item?.id) acc[item.id] = item;
      return acc;
    }, {});
  }
  if (parsed && typeof parsed === "object") return parsed;
  return {};
}

function applySavedPosition(id: string, fallback: CanvasPosition, layout: Record<string, LayoutItem>): CanvasPosition {
  const saved = layout[id];
  if (!saved) return fallback;
  if (saved.position && typeof saved.position.x === "number" && typeof saved.position.y === "number") return saved.position;
  if (typeof saved.x === "number" && typeof saved.y === "number") return { x: saved.x, y: saved.y };
  return fallback;
}

function targetNodeId(targetType: string | null | undefined, targetId: string | number | null | undefined): string | null {
  if (targetId == null) return null;
  const id = String(targetId);
  if (targetType === "o_script") return `script:${id}`;
  if (targetType === "o_assets") return `asset:${id}`;
  if (targetType === "o_storyboard") return `storyboard:${id}`;
  if (targetType === "o_videoTrack") return `videoPrompt:${id}`;
  if (targetType === "o_novel") return `novel:${id}`;
  if (targetType === "o_agentWorkData") return `agentWork:${id}`;
  return null;
}

function uniqueEdges(edges: CreativeCanvasEdge[]): CreativeCanvasEdge[] {
  const seen = new Set<string>();
  return edges.filter((edge) => {
    if (seen.has(edge.id)) return false;
    seen.add(edge.id);
    return true;
  });
}

function taskRelatedData(task: any): Record<string, any> {
  return parseJson<Record<string, any>>(task?.relatedObjects, {});
}

function taskScriptId(task: any): number | null {
  return taskScriptIds(task)[0] ?? null;
}

function taskScriptIds(task: any): number[] {
  const related = taskRelatedData(task);
  const values = [
    related.scriptId,
    related.data?.scriptId,
    related.payload?.scriptId,
    task?.scriptId,
    ...(Array.isArray(related.scriptIds) ? related.scriptIds : []),
    ...(Array.isArray(related.data?.scriptIds) ? related.data.scriptIds : []),
    ...(Array.isArray(related.payload?.scriptIds) ? related.payload.scriptIds : []),
  ];
  const result = values
    .map((value) => {
      if (value == null || value === "") return null;
      const numberValue = Number(value);
      return Number.isFinite(numberValue) ? numberValue : null;
    })
    .filter((value): value is number => value != null);
  return Array.from(new Set(result));
}

function taskPrimaryScriptId(task: any): number | null {
  const related = taskRelatedData(task);
  const value = related.scriptId ?? related.data?.scriptId ?? related.payload?.scriptId ?? task?.scriptId ?? taskScriptIds(task)[0];
  if (value == null || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function isAssetExtractionTask(task: any): boolean {
  const related = taskRelatedData(task);
  return /资产提取|extractAssets/i.test(String(task?.taskClass || "")) || related.source === "script.extractAssets";
}

async function findCanvasState(projectId: number, scriptId: number | null, viewKey: string) {
  const query = db("o_creativeCanvasState").where("projectId", projectId).where("viewKey", viewKey);
  if (scriptId == null) query.whereNull("scriptId");
  else query.where("scriptId", scriptId);
  return query.first();
}

async function collectDownstreamStale(targetType: string | null | undefined, targetId: string | number | null | undefined): Promise<StaleInfo[]> {
  const stale: StaleInfo[] = [];
  if (!targetType || targetId == null) return stale;
  const id = Number(targetId);
  const add = (nodeId: string, reason: string) => stale.push({ nodeId, reason });

  if (targetType === "o_script") {
    add(`storyboardAnalysis:${id}`, "剧本文本已修改，下游分镜分析需要复核");
    const storyboards = await db("o_storyboard").where("scriptId", id).select("id", "trackId");
    const tracks = await db("o_videoTrack").where("scriptId", id).select("id", "videoId", "selectVideoId");
    const videos = await db("o_video").where("scriptId", id).select("id");
    const assets = await db("o_assets").where("scriptId", id).select("id");
    storyboards.forEach((item: any) => {
      add(`storyboard:${item.id}`, "剧本文本已修改，分镜可能需要重做");
      if (item.trackId) add(`videoPrompt:${item.trackId}`, "上游分镜已变化，视频 prompt 可能过期");
    });
    assets.forEach((item: any) => add(`asset:${item.id}`, "剧本文本已修改，资产抽取可能需要复核"));
    tracks.forEach((item: any) => {
      add(`videoPrompt:${item.id}`, "剧本文本已修改，视频 prompt 可能过期");
      const videoId = selectedVideoId(item);
      if (videoId) add(`video:${videoId}`, "上游 prompt 已变化，视频结果可能过期");
    });
    videos.forEach((item: any) => add(`video:${item.id}`, "剧本文本已修改，视频结果可能过期"));
  }

  if (targetType === "o_assets") {
    const links = await db("o_assets2Storyboard").where("assetId", id).select("storyboardId");
    const storyboardIds = links.map((item: any) => item.storyboardId).filter(Boolean);
    const storyboards = storyboardIds.length ? await db("o_storyboard").whereIn("id", storyboardIds).select("id", "trackId", "scriptId") : [];
    storyboards.forEach((item: any) => {
      add(`storyboard:${item.id}`, "资产描述已修改，关联分镜需要复核");
      if (item.trackId) add(`videoPrompt:${item.trackId}`, "关联分镜依赖的资产已变化");
      if (item.scriptId) add(`storyboardAnalysis:${item.scriptId}`, "资产描述已修改，分镜分析需要复核");
    });
  }

  if (targetType === "o_storyboard") {
    const storyboard = await db("o_storyboard").where("id", id).first();
    if (storyboard?.trackId) {
      add(`videoPrompt:${storyboard.trackId}`, "分镜内容已修改，视频 prompt 可能过期");
      const tracks = await db("o_videoTrack").where("id", storyboard.trackId).select("id", "videoId", "selectVideoId");
      tracks.forEach((item: any) => {
        const videoId = selectedVideoId(item);
        if (videoId) add(`video:${videoId}`, "上游分镜已变化，视频结果可能过期");
      });
      const videos = await db("o_video").where("videoTrackId", storyboard.trackId).select("id");
      videos.forEach((item: any) => add(`video:${item.id}`, "上游分镜已变化，视频结果可能过期"));
    }
  }

  if (targetType === "o_videoTrack") {
    const track = await db("o_videoTrack").where("id", id).first();
    const videoId = selectedVideoId(track);
    if (videoId) add(`video:${videoId}`, "视频 prompt 已修改，选中视频可能过期");
    const videos = await db("o_video").where("videoTrackId", id).select("id");
    videos.forEach((item: any) => add(`video:${item.id}`, "视频 prompt 已修改，视频结果可能过期"));
  }

  const direct = targetNodeId(targetType, targetId);
  if (direct) add(direct, "内容已被人工编辑");
  return stale;
}

async function collectProjectStale(projectId?: number): Promise<Record<string, string>> {
  if (projectId == null) return {};
  const revisions = await db("o_generationRevision").where("projectId", projectId).orderBy("createTime", "desc").limit(200);
  const staleMap: Record<string, string> = {};
  for (const revision of revisions as any[]) {
    const staleItems = await collectDownstreamStale(revision.targetType, revision.targetId);
    staleItems.forEach((item) => {
      if (!staleMap[item.nodeId]) staleMap[item.nodeId] = item.reason;
    });
  }
  return staleMap;
}

function createNode(
  nodes: CreativeCanvasNode[],
  staleMap: Record<string, string>,
  layout: Record<string, LayoutItem>,
  node: Omit<CreativeCanvasNode, "position"> & { fallbackPosition: CanvasPosition },
) {
  const { fallbackPosition, ...rest } = node;
  const isStale = Boolean(staleMap[node.id]);
  nodes.push({
    ...rest,
    position: applySavedPosition(node.id, fallbackPosition, layout),
    stale: isStale,
    staleReason: staleMap[node.id],
    // stale 优先于内部状态展示为「需复核」
    status: isStale ? "需复核" : node.status,
  });
}

/**
 * 审计快照索引：targetType:targetId -> { version(快照次数), latest(最近一条快照行) }
 * 用于给业务节点补 version / sourceHash / updateTime。
 */
type AuditIndex = Map<string, { version: number; latest: any }>;

function buildAuditIndex(artifacts: any[]): AuditIndex {
  const index: AuditIndex = new Map();
  // artifacts 已按 createTime desc 排序
  for (const artifact of artifacts) {
    const key = `${artifact.targetType}:${artifact.targetId}`;
    const existing = index.get(key);
    if (existing) {
      existing.version += 1;
    } else {
      index.set(key, { version: 1, latest: artifact });
    }
  }
  return index;
}

function auditMetaFor(index: AuditIndex, targetType: string, targetId: string | number | null | undefined) {
  if (targetId == null) return {};
  const entry = index.get(`${targetType}:${String(targetId)}`);
  if (!entry) return {};
  return {
    version: entry.version,
    sourceHash: entry.latest?.contentHash ?? undefined,
    updateTime: entry.latest?.createTime ?? undefined,
  };
}

export async function getCreativeCanvasGraph(input: CreativeCanvasGraphInput) {
  const viewKey = input.viewKey || "overview";
  const limit = Math.min(Math.max(input.limit ?? 80, 1), 200);
  const project =
    input.projectId != null
      ? await db("o_project").where("id", input.projectId).first()
      : await db("o_project").orderBy("createTime", "desc").orderBy("id", "desc").first();
  const projectId = project?.id ?? input.projectId;
  const scriptFilter = input.scriptId != null ? input.scriptId : undefined;
  const layoutState = projectId != null ? await findCanvasState(projectId, scriptFilter ?? null, viewKey) : null;
  const layout = normalizeLayoutMap(layoutState?.nodesLayout);
  const viewport = parseJson<CreativeCanvasViewport>(layoutState?.viewport, { x: 0, y: 0, zoom: 0.72 });
  const staleMap = await collectProjectStale(projectId);

  const nodes: CreativeCanvasNode[] = [];
  const edges: CreativeCanvasEdge[] = [];

  if (!project || projectId == null) {
    return {
      project: null,
      scriptId: scriptFilter ?? null,
      viewKey,
      nodes,
      edges,
      viewport,
      tasks: [],
      queues: [],
      scriptOptions: [],
      summary: { projectCount: 0, novelCount: 0, eventCount: 0, scriptCount: 0, assetCount: 0, storyboardCount: 0, videoPromptCount: 0, videoCount: 0 },
      staleNodeIds: [],
      audit: { artifacts: [], segments: [], revisions: [] },
    };
  }

  createNode(nodes, staleMap, layout, {
    id: `project:${project.id}`,
    type: "project",
    label: project.name || `项目 ${project.id}`,
    fallbackPosition: { x: 0, y: 120 },
    width: 300,
    height: 180,
    data: { project: compactRow(project), introPreview: previewText(project.intro) },
  });

  const novels = await db("o_novel").where("projectId", projectId).orderByRaw("COALESCE(chapterOrder, chapterIndex, id) asc").orderByRaw("COALESCE(sectionOrder, 0) asc").orderBy("id", "asc").limit(limit);

  const novelEvents = novels.filter((item: any) => String(item.event ?? "").trim());

  novels.forEach((item: any, i: number) => {
    const nodeId = `novelChapter:${item.id}`;
    createNode(nodes, staleMap, layout, {
      id: nodeId,
      type: "novelChapter",
      label: item.chapter || `章节 ${i + 1}`,
      fallbackPosition: { x: 320, y: -160 + i * 240 },
      width: 360,
      height: 200,
      status: item.errorReason ? "需复核" : "已完成",
      sourceLabel: "来源：导入原文",
      data: {
        id: item.id,
        chapterIndex: item.chapterIndex,
        chapterOrder: item.chapterOrder ?? item.chapterIndex ?? i + 1,
        sectionOrder: item.sectionOrder ?? 0,
        reel: item.reel,
        chapter: item.chapter,
        section: item.section || "",
        chapterData: previewText(item.chapterData, 220),
        event: previewText(item.event, 160),
        eventState: item.eventState ?? null,
        errorReason: item.errorReason ?? null,
      },
    });
    edges.push({ id: `project:${project.id}->${nodeId}`, source: `project:${project.id}`, target: nodeId, type: "contains", label: "原文" });
  });

  novelEvents.forEach((item: any, i: number) => {
    const nodeId = `novelSection:${item.id}`;
    const chapterNodeId = `novelChapter:${item.id}`;
    createNode(nodes, staleMap, layout, {
      id: nodeId,
      type: "novelSection",
      label: `事件 ${i + 1}`,
      fallbackPosition: { x: 720, y: -160 + i * 240 },
      width: 360,
      height: 200,
      status: "已完成",
      sourceLabel: "来源：原文管理",
      data: {
        id: item.id,
        eventIndex: i + 1,
        chapterIndex: item.chapterIndex,
        chapterOrder: item.chapterOrder ?? item.chapterIndex ?? i + 1,
        sectionOrder: item.sectionOrder ?? 0,
        reel: item.reel,
        chapter: item.chapter,
        section: item.section || "",
        event: previewText(item.event, 220),
      },
    });
    const eventSource = novels.length ? chapterNodeId : `project:${project.id}`;
    edges.push({ id: `${eventSource}->${nodeId}`, source: eventSource, target: nodeId, type: "generates", label: "事件分析" });
  });

  const allScripts = sortScriptRows(await db("o_script").where("projectId", projectId).select("id", "name").orderBy("id", "asc").limit(100));
  let scriptsQuery = db("o_script").where("projectId", projectId).orderBy("id", "asc").limit(12);
  if (scriptFilter != null && viewKey !== "script") scriptsQuery = scriptsQuery.where("id", scriptFilter);
  const scripts = sortScriptRows(await scriptsQuery);
  const activeScriptId = scriptFilter ?? scripts[0]?.id ?? null;
  const scriptAssets = activeScriptId != null ? await db("o_scriptAssets").where("scriptId", activeScriptId) : [];
  const activeAssetIds = scriptAssets.map((item: any) => Number(item.assetId)).filter((id: number) => Number.isFinite(id));
  const assetsQuery = db("o_assets").where("projectId", projectId).orderBy("id", "asc").limit(limit);
  if (activeScriptId != null) {
    if (activeAssetIds.length) assetsQuery.whereIn("id", activeAssetIds);
    else assetsQuery.whereRaw("1 = 0");
  }
  const assets = await assetsQuery;
  let storyboardQuery = db("o_storyboard").where("projectId", projectId).orderBy("index", "asc").orderBy("id", "asc").limit(limit);
  if (activeScriptId != null) storyboardQuery = storyboardQuery.where("scriptId", activeScriptId);
  const storyboards = await storyboardQuery;
  const storyboardIds = storyboards.map((item: any) => item.id).filter(Boolean);
  const storyboardAssetLinks = storyboardIds.length ? await db("o_assets2Storyboard").whereIn("storyboardId", storyboardIds) : [];
  let videoTrackQuery = db("o_videoTrack").where("projectId", projectId).orderBy("id", "asc").limit(limit);
  if (activeScriptId != null) videoTrackQuery = videoTrackQuery.where("scriptId", activeScriptId);
  const videoTracks = await videoTrackQuery;
  let videoQuery = db("o_video").where("projectId", projectId).orderBy("id", "asc").limit(limit);
  if (activeScriptId != null) videoQuery = videoQuery.where("scriptId", activeScriptId);
  const videos = await videoQuery;
  const videoIds = videos.map((item: any) => Number(item.id)).filter((id: number) => Number.isFinite(id));
  const hasVideoReviewTable = videoIds.length ? await db.schema.hasTable("o_videoReview") : false;
  const videoReviews = hasVideoReviewTable ? await db("o_videoReview").whereIn("videoId", videoIds) : [];
  const videoReviewByVideoId = new Map<number, any>();
  for (const review of videoReviews as any[]) {
    videoReviewByVideoId.set(Number(review.videoId), {
      ...compactRow(review),
      issues: parseJson(review.issues, []),
      report: parseJson(review.report, {}),
      retryable: Boolean(review.retryable),
    });
  }
  const tasks = await db("o_tasks").where("projectId", projectId).orderBy("id", "desc").limit(12);
  const taskIds = tasks.map((item: any) => Number(item.id)).filter((id) => Number.isFinite(id));
  const taskProgress = await listTaskProgress(projectId, taskIds);
  const queues = (await db.schema.hasTable("o_genQueue"))
    ? await db("o_genQueue").where("projectId", projectId).orderBy("id", "desc").limit(12)
    : [];
  const scriptAgentWork = await db("o_agentWorkData").where({ projectId, key: "scriptAgent" }).first();
  const scriptAgentData = parseJson<Record<string, any>>(scriptAgentWork?.data, {});
  const productionAgentWork = activeScriptId != null
    ? await db("o_agentWorkData").where({ projectId, key: "productionAgent", episodesId: activeScriptId }).first()
    : null;
  const productionAgentData = parseJson<Record<string, any>>(productionAgentWork?.data, {});
  const audit = await getGenerationAuditGraph({ projectId, limit });
  const auditIndex = buildAuditIndex(audit.artifacts);

  // ─── 媒体缩略图聚合 ───────────────────────────────────────────
  // 资产候选图：选定图(o_assets.imageId)优先，否则取该资产任意一张已生成图
  const assetIds = assets.map((item: any) => Number(item.id)).filter((id: number) => Number.isFinite(id));
  const assetImages = assetIds.length ? await db("o_image").whereIn("assetsId", assetIds).select("id", "assetsId", "filePath", "state", "batchId", "score", "scoreReason", "errorReason") : [];
  const assetThumbMap = new Map<number, string>();
  const assetImageMap = new Map<number, any[]>();
  const assetImagePathMap = new Map<number, string[]>();
  const assetFlowMap = new Map<number, number>();
  {
    const selectedImageId = new Map<number, number>();
    assets.forEach((asset: any) => {
      if (asset.imageId != null) selectedImageId.set(Number(asset.id), Number(asset.imageId));
      if (asset.flowId != null) assetFlowMap.set(Number(asset.id), Number(asset.flowId));
    });
    const byAsset = new Map<number, any[]>();
    for (const img of assetImages as any[]) {
      const aid = Number(img.assetsId);
      if (!byAsset.has(aid)) byAsset.set(aid, []);
      byAsset.get(aid)!.push(img);
    }
    for (const [aid, imgs] of byAsset) {
      const selId = selectedImageId.get(aid);
      const chosen = (selId != null && imgs.find((i: any) => Number(i.id) === selId)) || imgs.find((i: any) => i.filePath) || null;
      if (chosen?.filePath) {
        assetThumbMap.set(aid, await toThumbUrl(chosen.filePath));
      }
      assetImageMap.set(aid, await Promise.all(
        imgs
          .map(async (img: any, index: number) => ({
            id: img.id,
            index,
            thumbnail: img.filePath ? await toThumbUrl(img.filePath) : "",
            filePath: img.filePath,
            state: img.state || "",
            batchId: img.batchId || "",
            score: img.score ?? null,
            scoreReason: img.scoreReason || "",
            errorReason: img.errorReason || "",
            selected: selId != null && Number(img.id) === selId,
          })),
      ));
      const paths = imgs.map((img: any) => normalizeMediaPath(img.filePath)).filter(Boolean);
      if (paths.length) assetImagePathMap.set(aid, paths);
    }
  }
  if (assetImagePathMap.size) {
    // ponytail: JSON scan is fine for current local flow counts; add a relation table if this gets large.
    const flowRows = await db("o_imageFlow").select("id", "flowData");
    const pathToFlowId = new Map<string, number>();
    for (const row of flowRows as any[]) {
      try {
        const flow = JSON.parse(row.flowData || "{}");
        for (const node of flow.nodes || []) {
          const data = node.data || {};
          [data.generatedImage]
            .map(normalizeMediaPath)
            .filter(Boolean)
            .forEach((path) => {
              if (!pathToFlowId.has(path)) pathToFlowId.set(path, Number(row.id));
            });
        }
      } catch {
        // Ignore broken legacy flow JSON.
      }
    }
    for (const [assetId, paths] of assetImagePathMap) {
      const flowId = paths.map((path) => pathToFlowId.get(path)).find(Boolean);
      if (flowId && !assetFlowMap.has(assetId)) assetFlowMap.set(assetId, flowId);
    }
  }
  // 分镜缩略图
  const storyboardThumbMap = new Map<number, string>();
  for (const sb of storyboards as any[]) {
    if (sb.filePath) storyboardThumbMap.set(Number(sb.id), await toThumbUrl(sb.filePath));
  }
  const storyboardImageAttemptMap = new Map<number, StoryboardImageAttempt[]>();
  if (storyboardIds.length) {
    const imageArtifacts = await db("o_generationArtifact")
      .where({
        projectId,
        artifactType: "storyboardImage",
        targetType: "o_storyboard",
      })
      .whereIn("targetId", storyboardIds.map((id: number) => String(id)))
      .orderBy("createTime", "asc")
      .limit(500);
    const seen = new Set<string>();
    for (const artifact of imageArtifacts as any[]) {
      const storyboardId = Number(artifact.targetId);
      const meta = parseJson<Record<string, any>>(artifact.meta, {});
      const filePath = String(meta.filePath || "").trim();
      if (!Number.isFinite(storyboardId) || !filePath) continue;
      const key = `${storyboardId}:${normalizeMediaPath(filePath)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const attempt: StoryboardImageAttempt = {
        id: `storyboardImage:${storyboardId}:artifact:${artifact.id}`,
        filePath,
        thumbnail: await toThumbUrl(filePath),
        state: String(meta.state || "已完成"),
        reason: String(meta.reason || ""),
        selected: Boolean(meta.selected),
        createTime: artifact.createTime,
      };
      if (!storyboardImageAttemptMap.has(storyboardId)) storyboardImageAttemptMap.set(storyboardId, []);
      storyboardImageAttemptMap.get(storyboardId)!.push(attempt);
    }
  }
  // 视频海报/可播放地址
  const videoUrlMap = new Map<number, string>();
  for (const video of videos as any[]) {
    if (video.filePath) videoUrlMap.set(Number(video.id), await toFileUrl(video.filePath));
  }

  const lastNovelEvent = novelEvents[novelEvents.length - 1];
  const lastNovel = novels[novels.length - 1];
  const scriptParentId = lastNovelEvent ? `novelSection:${lastNovelEvent.id}` : lastNovel ? `novelChapter:${lastNovel.id}` : `project:${project.id}`;
  const scriptSourceLabel = novelEvents.length ? "来源：事件分析" : novels.length ? "来源：原文管理" : project.name ? `来源：${project.name}` : "来源：项目";
  const storySkeletonText = String(scriptAgentData.storySkeleton ?? "").trim();
  const adaptationStrategyText = String(scriptAgentData.adaptationStrategy ?? "").trim();
  const storySkeletonNodeId = storySkeletonText ? "scriptPlan:storySkeleton" : null;
  const adaptationStrategyNodeId = adaptationStrategyText ? "scriptPlan:adaptationStrategy" : null;
  if (storySkeletonNodeId) {
    createNode(nodes, staleMap, layout, {
      id: storySkeletonNodeId,
      type: "storySkeleton",
      label: "故事骨架",
      fallbackPosition: { x: 400, y: -140 },
      width: 360,
      height: 220,
      status: "已完成",
      sourceLabel: "来源：剧本 Agent",
      data: {
        workDataId: scriptAgentWork?.id ?? null,
        planType: "storySkeleton",
        content: storySkeletonText,
        contentPreview: previewText(storySkeletonText, 300),
      },
    });
    edges.push({ id: `${scriptParentId}->${storySkeletonNodeId}`, source: scriptParentId, target: storySkeletonNodeId, type: "generates", label: "故事骨架" });
  }
  if (adaptationStrategyNodeId) {
    createNode(nodes, staleMap, layout, {
      id: adaptationStrategyNodeId,
      type: "adaptationStrategy",
      label: "改编策略",
      fallbackPosition: { x: 800, y: -140 },
      width: 360,
      height: 220,
      status: "已完成",
      sourceLabel: "来源：剧本 Agent",
      data: {
        workDataId: scriptAgentWork?.id ?? null,
        planType: "adaptationStrategy",
        content: adaptationStrategyText,
        contentPreview: previewText(adaptationStrategyText, 300),
      },
    });
    edges.push({
      id: `${storySkeletonNodeId || scriptParentId}->${adaptationStrategyNodeId}`,
      source: storySkeletonNodeId || scriptParentId,
      target: adaptationStrategyNodeId,
      type: "generates",
      label: "改编策略",
    });
  }
  const scriptPlanParentId = adaptationStrategyNodeId || storySkeletonNodeId;
  scripts.forEach((script: any, index: number) => {
    createNode(nodes, staleMap, layout, {
      id: `script:${script.id}`,
      type: "script",
      label: script.name || `剧本 ${script.id}`,
      fallbackPosition: { x: 400, y: index * 260 },
      width: 360,
      height: 220,
      sourceLabel: scriptSourceLabel,
      ...auditMetaFor(auditIndex, "o_script", script.id),
      data: { script: compactRow(script), contentPreview: previewText(script.content, 260) },
    });
    edges.push({ id: `${scriptParentId}->script:${script.id}`, source: scriptParentId, target: `script:${script.id}`, type: "contains", label: "剧本" });
    if (scriptPlanParentId) {
      edges.push({ id: `${scriptPlanParentId}->script:${script.id}`, source: scriptPlanParentId, target: `script:${script.id}`, type: "generates", label: "生成剧本" });
    }
  });

  const activeScriptLabel = scripts.find((item: any) => item.id === activeScriptId)?.name || (activeScriptId != null ? `剧本 ${activeScriptId}` : "");
  const assetSourceLabel = activeScriptLabel ? `来源：${activeScriptLabel}` : "来源：当前剧本";
  const productionScriptPlanText = String(productionAgentData.scriptPlan ?? "").trim();
  const productionStoryboardTableText = String(productionAgentData.storyboardTable ?? "").trim();
  const productionScriptPlanNodeId = activeScriptId != null && productionScriptPlanText ? `scriptPlan:production:${activeScriptId}` : null;
  const productionStoryboardTableNodeId = activeScriptId != null && productionStoryboardTableText ? `storyboardTable:${activeScriptId}` : null;

  if (productionScriptPlanNodeId) {
    createNode(nodes, staleMap, layout, {
      id: productionScriptPlanNodeId,
      type: "scriptPlan",
      label: "导演规划",
      fallbackPosition: { x: 820, y: -200 },
      width: 380,
      height: 240,
      status: "已完成",
      sourceLabel: "来源：分镜 Agent",
      data: {
        scriptId: activeScriptId,
        workDataId: productionAgentWork?.id ?? null,
        planType: "scriptPlan",
        content: productionScriptPlanText,
        contentPreview: previewText(productionScriptPlanText, 320),
      },
    });
    edges.push({
      id: `script:${activeScriptId}->${productionScriptPlanNodeId}`,
      source: `script:${activeScriptId}`,
      target: productionScriptPlanNodeId,
      type: "generates",
      label: "导演规划",
    });
  }

  if (productionStoryboardTableNodeId) {
    createNode(nodes, staleMap, layout, {
      id: productionStoryboardTableNodeId,
      type: "storyboardTable",
      label: "分镜表",
      fallbackPosition: { x: 1240, y: -200 },
      width: 420,
      height: 260,
      status: "已完成",
      sourceLabel: "来源：分镜 Agent",
      data: {
        scriptId: activeScriptId,
        workDataId: productionAgentWork?.id ?? null,
        planType: "storyboardTable",
        content: productionStoryboardTableText,
        contentPreview: previewText(productionStoryboardTableText, 360),
      },
    });
    edges.push({
      id: `${productionScriptPlanNodeId || `script:${activeScriptId}`}->${productionStoryboardTableNodeId}`,
      source: productionScriptPlanNodeId || `script:${activeScriptId}`,
      target: productionStoryboardTableNodeId,
      type: "generates",
      label: "分镜表",
    });
  }

  if (activeScriptId != null) {
    createNode(nodes, staleMap, layout, {
      id: `storyboardAnalysis:${activeScriptId}`,
      type: "storyboardAnalysis",
      label: "分镜分析",
      fallbackPosition: { x: 860, y: 80 },
      width: 920,
      height: 560,
      sourceLabel: assetSourceLabel,
      data: {
        scriptId: activeScriptId,
        shotCount: storyboards.length,
        thumbnails: storyboards
          .slice(0, 8)
          .map((item: any) => storyboardThumbMap.get(Number(item.id)) || "")
          .filter(Boolean),
        shots: storyboards.slice(0, 12).map((item: any) => ({
          id: item.id,
          index: item.index,
          duration: item.duration,
          narrative: previewText(item.videoDesc || item.prompt, 160),
          time: item.duration,
          lens: item.shotType || item.cameraMovement || "",
          image: previewText(item.prompt, 160),
          sound: previewText(item.dialogue || item.soundEffect, 160),
          thumbnail: storyboardThumbMap.get(Number(item.id)) || "",
        })),
      },
    });
    const storyboardAnalysisSourceId = productionStoryboardTableNodeId || productionScriptPlanNodeId || `script:${activeScriptId}`;
    edges.push({
      id: `${storyboardAnalysisSourceId}->storyboardAnalysis:${activeScriptId}`,
      source: storyboardAnalysisSourceId,
      target: `storyboardAnalysis:${activeScriptId}`,
      type: "analysis",
      label: "结构化分镜",
    });
  }

  // ─── 资产组卡：按 type 聚合为角色/场景/道具三张大卡 ──────────────
  // 个体资产→组卡的映射，用于把脚本/分镜/提取任务的边重连到组卡
  const assetIdToGroup = new Map<number, string>();
  {
    const grouped = new Map<string, any[]>();
    assets.forEach((asset: any) => {
      const type = ASSET_GROUP_ORDER.includes(asset.type) ? asset.type : "tool";
      if (!grouped.has(type)) grouped.set(type, []);
      grouped.get(type)!.push(asset);
      assetIdToGroup.set(Number(asset.id), `assetGroup:${type}`);
    });
    let groupIndex = 0;
    for (const type of ASSET_GROUP_ORDER) {
      const items = grouped.get(type);
      if (!items || !items.length) continue;
      const groupId = `assetGroup:${type}`;
      const anyStale = items.some((asset: any) => staleMap[`asset:${asset.id}`]);
      const failed = items.some((asset: any) => asset.promptState === "failed" || asset.promptState === "error");
      const status = anyStale ? "需复核" : failed ? "需复核" : "已完成";
      createNode(nodes, staleMap, layout, {
        id: groupId,
        type: "assetGroup",
        label: ASSET_GROUP_LABELS[type],
        fallbackPosition: { x: 1860, y: groupIndex * 250 },
        width: 320,
        height: 220,
        status,
        sourceLabel: assetSourceLabel,
        data: {
          assetType: type,
          count: items.length,
          thumbnails: items
            .map((asset: any) => assetThumbMap.get(Number(asset.id)) || "")
            .filter(Boolean)
            .slice(0, 8),
          items: items.map((asset: any) => ({
            id: asset.id,
            name: asset.name,
            type: asset.type,
            thumbnail: assetThumbMap.get(Number(asset.id)) || "",
            images: assetImageMap.get(Number(asset.id)) || [],
            prompt: asset.prompt || asset.describe || "",
            promptPreview: previewText(asset.prompt || asset.describe, 160),
            promptState: asset.promptState ?? null,
            flowId: assetFlowMap.get(Number(asset.id)) ?? null,
            remark: asset.remark ?? null,
            describe: asset.describe || "",
          })),
        },
      });
      // 组卡自身的 stale（任一成员 stale 即整体需复核）
      if (anyStale) {
        const staleNode = nodes.find((n) => n.id === groupId);
        if (staleNode) {
          staleNode.stale = true;
          staleNode.staleReason = "组内资产存在需复核内容";
        }
      }
      groupIndex += 1;
    }
  }

  // 脚本→资产组（去重）
  const scriptToGroupEdges = new Set<string>();
  scriptAssets.forEach((link: any) => {
    const groupId = assetIdToGroup.get(Number(link.assetId));
    if (!groupId) return;
    const edgeId = `script:${link.scriptId}->${groupId}`;
    if (scriptToGroupEdges.has(edgeId)) return;
    scriptToGroupEdges.add(edgeId);
    edges.push({ id: edgeId, source: `script:${link.scriptId}`, target: groupId, type: "uses", label: "使用资产" });
  });

  const assetById = new Map((assets as any[]).map((asset: any) => [Number(asset.id), asset]));

  storyboards.forEach((storyboard: any, index: number) => {
    const sbThumb = storyboardThumbMap.get(Number(storyboard.id)) || "";
    const storyboardId = Number(storyboard.id);
    const currentSelectedPath = isSelectedStoryboardImage(storyboard) ? normalizeMediaPath(storyboard.filePath) : "";
    const linkedAssets = storyboardAssetLinks
      .filter((link: any) => Number(link.storyboardId) === Number(storyboard.id))
      .map((link: any) => assetById.get(Number(link.assetId)))
      .filter(Boolean);
    const mentions = linkedAssets.map((asset: any, assetIndex: number) => ({
      token: `@图片${assetIndex + 1}`,
      label: `${asset.name || `资产${asset.id}`}${asset.type ? ` ${asset.type}` : ""}`,
      image: assetThumbMap.get(Number(asset.id)) || "",
    }));
    const prompt = storyboard.prompt || storyboard.videoDesc || "";
    createNode(nodes, staleMap, layout, {
      id: `storyboard:${storyboard.id}`,
      type: "storyboard",
      label: `镜头 ${storyboard.index ?? index + 1}`,
      fallbackPosition: { x: 1840, y: -220 + index * 380 },
      width: 280,
      height: 360,
      status: storyboard.state === "已完成" ? "已完成" : storyboard.state === "生成中" ? "生成中" : storyboard.state === "生成失败" ? "需复核" : undefined,
      ...auditMetaFor(auditIndex, "o_storyboard", storyboard.id),
      data: { storyboard: compactRow(storyboard), prompt, videoDesc: storyboard.videoDesc || "", promptPreview: previewText(prompt, 260), thumbnail: sbThumb, mentions },
    });
    const currentPath = normalizeMediaPath(storyboard.filePath);
    const omitCurrentPath = storyboard.state === "生成中" ? "" : currentPath;
    const attempts = (storyboardImageAttemptMap.get(storyboardId) || [])
      .filter((attempt) => !omitCurrentPath || normalizeMediaPath(attempt.filePath) !== omitCurrentPath);
    if (storyboard.state === "生成中") {
      attempts.push({
        id: `storyboardImage:${storyboard.id}`,
        filePath: "",
        thumbnail: "",
        state: "生成中",
        reason: "",
        selected: false,
      });
    } else if (storyboard.filePath) {
      attempts.push({
        id: `storyboardImage:${storyboard.id}`,
        filePath: storyboard.filePath,
        thumbnail: sbThumb,
        state: storyboard.state || "已完成",
        reason: storyboard.reason || "",
        selected: isSelectedStoryboardImage(storyboard),
      });
    }
    if (!attempts.length) {
      attempts.push({
        id: `storyboardImage:${storyboard.id}`,
        filePath: "",
        thumbnail: "",
        state: storyboard.state || "未生成",
        reason: storyboard.reason || "",
        selected: false,
      });
    }
    attempts.forEach((attempt, attemptIndex) => {
      const status = storyboardImageStatus(attempt, currentSelectedPath);
      createNode(nodes, staleMap, layout, {
        id: attempt.id,
        type: "storyboardImage",
        label: attempts.length > 1 ? `图片 ${storyboard.index ?? index + 1}-${attemptIndex + 1}` : `图片 ${storyboard.index ?? index + 1}`,
        fallbackPosition: { x: 2160, y: -220 + index * 380 + attemptIndex * 240 },
        width: 280,
        height: 210,
        status,
        ...auditMetaFor(auditIndex, "o_storyboard", storyboard.id),
        data: {
          storyboardId: storyboard.id,
          storyboardIndex: storyboard.index ?? index + 1,
          image: {
            storyboardId: storyboard.id,
            state: status,
            selected: status === "已选中",
            filePath: attempt.filePath,
            reason: attempt.reason,
            createTime: attempt.createTime ?? null,
          },
          thumbnail: attempt.thumbnail,
          promptPreview: previewText(prompt, 180),
        },
      });
      edges.push({
        id: `storyboard:${storyboard.id}->${attempt.id}`,
        source: `storyboard:${storyboard.id}`,
        target: attempt.id,
        type: "generates",
        label: "图片",
      });
    });
    if (storyboard.scriptId) {
      edges.push({
        id: `storyboardAnalysis:${storyboard.scriptId}->storyboard:${storyboard.id}`,
        source: `storyboardAnalysis:${storyboard.scriptId}`,
        target: `storyboard:${storyboard.id}`,
        type: "expands",
        label: "镜头",
      });
    }
  });

  const groupToStoryboardEdges = new Set<string>();
  storyboardAssetLinks.forEach((link: any) => {
    const groupId = assetIdToGroup.get(Number(link.assetId));
    if (!groupId) return;
    const edgeId = `${groupId}->storyboard:${link.storyboardId}`;
    if (groupToStoryboardEdges.has(edgeId)) return;
    groupToStoryboardEdges.add(edgeId);
    edges.push({
      id: edgeId,
      source: groupId,
      target: `storyboard:${link.storyboardId}`,
      type: "references",
      label: "关联分镜",
    });
  });

  videoTracks.forEach((track: any, index: number) => {
    const trackStoryboards = storyboards.filter((item: any) => Number(item.trackId) === Number(track.id));
    const storyboard = trackStoryboards[0];
    const trackStoryboardIds = new Set(trackStoryboards.map((item: any) => Number(item.id)));
    const linkedAssets = Array.from(new Map(storyboardAssetLinks
      .filter((link: any) => trackStoryboardIds.has(Number(link.storyboardId)))
      .map((link: any) => assetById.get(Number(link.assetId)))
      .filter(Boolean)
      .map((asset: any) => [Number(asset.id), asset])).values());
    const selectedStoryboards = trackStoryboards.filter(isSelectedStoryboardImage);
    const videoPromptId = `videoPrompt:${track.id}`;
    const mentions = [
      ...linkedAssets.map((asset: any, assetIndex: number) => ({
        token: `@图片${assetIndex + 1}`,
        label: `${asset.name || `资产${asset.id}`}${asset.type ? ` ${asset.type}` : ""}`,
        image: assetThumbMap.get(Number(asset.id)) || "",
      })),
      ...selectedStoryboards.map((item: any) => ({
        token: `@镜头${item.index ?? index + 1}`,
        label: `镜头 ${item.index ?? index + 1} 分镜图`,
        image: storyboardThumbMap.get(Number(item.id)) || "",
      })),
    ];

    linkedAssets.forEach((asset: any, assetIndex: number) => {
      const thumbnail = assetThumbMap.get(Number(asset.id)) || "";
      createNode(nodes, staleMap, layout, {
        id: `videoReference:${track.id}:asset:${asset.id}`,
        type: "videoReference",
        label: `@图片${assetIndex + 1} ${asset.name || `资产 ${asset.id}`}`,
        fallbackPosition: { x: 1880, y: -160 + index * 390 + assetIndex * 120 },
        width: 220,
        height: 150,
        status: thumbnail ? "已完成" : "需复核",
        sourceLabel: "来源：轨道参考资产",
        data: {
          reference: {
            id: asset.id,
            source: "asset",
            type: asset.type || "",
            name: asset.name || "",
            token: `@图片${assetIndex + 1}`,
            filePath: asset.imagePath || "",
          },
          thumbnail,
          promptPreview: asset.prompt || asset.describe || "",
        },
      });
      edges.push({
        id: `videoReference:${track.id}:asset:${asset.id}->${videoPromptId}`,
        source: `videoReference:${track.id}:asset:${asset.id}`,
        target: videoPromptId,
        type: "references",
        label: "参考输入",
      });
    });

    selectedStoryboards.forEach((item: any, storyboardIndex: number) => {
      createNode(nodes, staleMap, layout, {
        id: `videoReference:${track.id}:storyboard:${item.id}`,
        type: "videoReference",
        label: `@镜头${item.index ?? storyboardIndex + 1} 分镜图`,
        fallbackPosition: { x: 1880, y: -160 + index * 390 + (linkedAssets.length + storyboardIndex) * 120 },
        width: 220,
        height: 150,
        status: "已完成",
        sourceLabel: "来源：已选分镜图",
        ...auditMetaFor(auditIndex, "o_storyboard", item.id),
        data: {
          reference: {
            id: item.id,
            source: "storyboard",
            type: "storyboard",
            name: `镜头 ${item.index ?? storyboardIndex + 1}`,
            token: `@镜头${item.index ?? storyboardIndex + 1}`,
            filePath: item.filePath || "",
          },
          thumbnail: storyboardThumbMap.get(Number(item.id)) || "",
          promptPreview: item.prompt || item.videoDesc || "",
        },
      });
      edges.push({
        id: `videoReference:${track.id}:storyboard:${item.id}->${videoPromptId}`,
        source: `videoReference:${track.id}:storyboard:${item.id}`,
        target: videoPromptId,
        type: "references",
        label: "首帧参考",
      });
    });

    const promptMentions = mentions.filter(Boolean);
    if (storyboard && !selectedStoryboards.length) {
      promptMentions.push({
        token: `@镜头${storyboard.index ?? index + 1}`,
        label: `镜头 ${storyboard.index ?? index + 1}`,
        image: storyboardThumbMap.get(Number(storyboard.id)) || "",
      });
    }
    createNode(nodes, staleMap, layout, {
      id: videoPromptId,
      type: "videoPrompt",
      label: `视频 Prompt ${track.id}`,
      fallbackPosition: { x: 2240, y: -160 + index * 390 },
      width: 300,
      height: 350,
      sourceLabel: "来源：分镜分析",
      ...auditMetaFor(auditIndex, "o_videoTrack", track.id),
      data: { videoTrack: compactRow(track), prompt: track.prompt || "", promptPreview: previewText(track.prompt, 260), mentions: promptMentions },
    });
    if (storyboard) {
      edges.push({
        id: `storyboard:${storyboard.id}->videoPrompt:${track.id}`,
        source: `storyboard:${storyboard.id}`,
        target: `videoPrompt:${track.id}`,
        type: "generates",
        label: "生成 prompt",
      });
    }
  });

  videos.forEach((video: any, index: number) => {
    const review = videoReviewByVideoId.get(Number(video.id));
    const status = review?.status === "failed" || review?.status === "warning"
      ? "需复核"
      : video.state === "生成成功" || video.state === "已完成" ? "已完成" : video.state === "生成中" ? "生成中" : video.state === "生成失败" ? "需复核" : undefined;
    createNode(nodes, staleMap, layout, {
      id: `video:${video.id}`,
      type: "video",
      label: `视频 ${video.id}`,
      fallbackPosition: { x: 2640, y: -120 + index * 180 },
      width: 240,
      height: 140,
      status,
      sourceLabel: "来源：视频 Prompt",
      data: { video: compactRow(video), review, poster: videoUrlMap.get(Number(video.id)) || "", src: videoUrlMap.get(Number(video.id)) || "" },
    });
    if (video.videoTrackId) {
      edges.push({
        id: `videoPrompt:${video.videoTrackId}->video:${video.id}`,
        source: `videoPrompt:${video.videoTrackId}`,
        target: `video:${video.id}`,
        type: "renders",
        label: "生成视频",
      });
    }
  });
  const storyboardByTrackId = new Map<number, any>();
  storyboards.forEach((storyboard: any) => {
    const trackId = Number(storyboard.trackId);
    if (Number.isFinite(trackId)) storyboardByTrackId.set(trackId, storyboard);
  });
  const storyboardByVideoId = new Map<number, any>();
  const videoById = new Map<number, any>();
  videos.forEach((video: any) => {
    const videoId = Number(video.id);
    if (Number.isFinite(videoId)) videoById.set(videoId, video);
    const trackId = Number(video.videoTrackId);
    const storyboard = storyboardByTrackId.get(trackId);
    if (Number.isFinite(videoId) && storyboard) storyboardByVideoId.set(videoId, storyboard);
  });

  // ─── 概览聚合卡：视频 Prompt 与视频结果各一张代表卡 ───────────────
  if (videoTracks.length) {
    const samplePrompts = videoTracks
      .slice(0, 3)
      .map((track: any) => previewText(track.prompt, 90))
      .filter(Boolean);
    createNode(nodes, staleMap, layout, {
      id: "videoPromptGroup",
      type: "videoPromptGroup",
      label: "视频 Prompt",
      fallbackPosition: { x: 2260, y: 40 },
      width: 360,
      height: 220,
      status: "已完成",
      sourceLabel: "来源：分镜分析",
      data: { count: videoTracks.length, samples: samplePrompts },
    });
    if (activeScriptId != null) {
      edges.push({
        id: `storyboardAnalysis:${activeScriptId}->videoPromptGroup`,
        source: `storyboardAnalysis:${activeScriptId}`,
        target: "videoPromptGroup",
        type: "generates",
        label: "生成 prompt",
      });
    }
  }

  if (videos.length) {
    const doneStates = new Set(["生成成功", "已完成"]);
    const doneCount = videos.filter((video: any) => doneStates.has(String(video.state))).length;
    const running = videos.some((video: any) => video.state === "生成中") || doneCount < videos.length;
    createNode(nodes, staleMap, layout, {
      id: "videoGroup",
      type: "videoGroup",
      label: "视频结果",
      fallbackPosition: { x: 2700, y: 40 },
      width: 360,
      height: 220,
      status: running && doneCount < videos.length ? "生成中" : "已完成",
      sourceLabel: "来源：视频 Prompt",
      data: {
        count: videos.length,
        doneCount,
        posters: videos
          .map((video: any) => videoUrlMap.get(Number(video.id)) || "")
          .filter(Boolean)
          .slice(0, 8),
      },
    });
    edges.push({
      id: "videoPromptGroup->videoGroup",
      source: "videoPromptGroup",
      target: "videoGroup",
      type: "renders",
      label: "生成视频",
    });
  }

  audit.artifacts.forEach((artifact: any, index: number) => {
    const id = `auditArtifact:${artifact.id}`;
    createNode(nodes, staleMap, layout, {
      id,
      type: "auditArtifact",
      label: artifact.title || `${artifact.artifactType}`,
      fallbackPosition: { x: 760, y: 500 + index * 150 },
      width: 260,
      height: 120,
      data: { artifact: compactRow(artifact), contentPreview: previewText(artifact.content, 180) },
    });
    const target = targetNodeId(artifact.targetType, artifact.targetId);
    if (target) {
      edges.push({
        id: `${target}->${id}`,
        source: target,
        target: id,
        type: "auditedBy",
        label: "审计快照",
      });
    }
  });

  audit.segments.forEach((segment: any, index: number) => {
    const id = `auditSegment:${segment.id}`;
    createNode(nodes, staleMap, layout, {
      id,
      type: "auditSegment",
      label: previewText(segment.text, 36) || `片段 ${segment.id}`,
      fallbackPosition: { x: 1080, y: 520 + index * 96 },
      width: 300,
      height: 88,
      data: { segment: compactRow(segment), editable: true },
    });
    edges.push({
      id: `auditArtifact:${segment.artifactId}->${id}`,
      source: `auditArtifact:${segment.artifactId}`,
      target: id,
      type: "contains",
      label: "句子",
    });
  });

  tasks.forEach((task: any, index: number) => {
    const assetTask = isAssetExtractionTask(task);
    const taskSids = taskScriptIds(task);
    const taskSid = taskPrimaryScriptId(task);
    const nodeId = assetTask ? `assetExtractionTask:${task.id}` : `task:${task.id}`;
    const related = taskRelatedData(task);
    const relatedVideo = related.videoId ? videoById.get(Number(related.videoId)) : null;
    const isVideoGenerationTask = relatedVideo && /视频生成/.test(String(task.taskClass || ""));
    const relatedVideoSrc = relatedVideo && !isVideoGenerationTask ? videoUrlMap.get(Number(relatedVideo.id)) || "" : "";
    createNode(nodes, staleMap, layout, {
      id: nodeId,
      type: assetTask ? "assetExtractionTask" : "task",
      label: assetTask ? `资产提取任务 #${task.id}` : task.taskClass || `任务 ${task.id}`,
      fallbackPosition: assetTask ? { x: 40, y: 260 + index * 130 } : { x: 3160, y: index * 120 },
      width: assetTask ? 300 : 260,
      height: assetTask ? 118 : relatedVideoSrc ? 190 : 100,
      data: {
        task: compactRow(task),
        progress: taskProgress.filter((item: any) => Number(item.taskId) === Number(task.id)).map(compactRow),
        video: relatedVideo ? compactRow(relatedVideo) : null,
        src: relatedVideoSrc,
      },
    });
    const relatedVideoPromptId = isVideoGenerationTask && relatedVideo?.videoTrackId ? `videoPrompt:${relatedVideo.videoTrackId}` : null;
    const videoTaskStoryboard = related.videoId ? storyboardByVideoId.get(Number(related.videoId)) : null;
    if (relatedVideoPromptId) {
      edges.push({
        id: `${relatedVideoPromptId}->${nodeId}`,
        source: relatedVideoPromptId,
        target: nodeId,
        type: "videoTask",
        label: "视频生成",
      });
    } else if (videoTaskStoryboard) {
      edges.push({
        id: `storyboard:${videoTaskStoryboard.id}->${nodeId}`,
        source: `storyboard:${videoTaskStoryboard.id}`,
        target: nodeId,
        type: "videoTask",
        label: "视频生成",
      });
    } else if (!assetTask) {
      edges.push({
        id: `project:${project.id}->${nodeId}`,
        source: `project:${project.id}`,
        target: nodeId,
        type: "task",
        label: "任务",
      });
    }
    if (assetTask && taskSids.length) {
      taskSids.forEach((sid) => {
        edges.push({
          id: `script:${sid}->${nodeId}`,
          source: `script:${sid}`,
          target: nodeId,
          type: "task",
          label: "提取资产",
        });
      });
      const taskSidSet = new Set(taskSids.map(Number));
      const taskToGroupEdges = new Set<string>();
      scriptAssets
        .filter((link: any) => taskSidSet.has(Number(link.scriptId)))
        .forEach((link: any) => {
          const groupId = assetIdToGroup.get(Number(link.assetId));
          if (!groupId) return;
          const edgeId = `${nodeId}->${groupId}`;
          if (taskToGroupEdges.has(edgeId)) return;
          taskToGroupEdges.add(edgeId);
          edges.push({
            id: edgeId,
            source: nodeId,
            target: groupId,
            type: "generates",
            label: "产出资产",
          });
        });
    }
  });

  return {
    project: compactRow(project),
    scriptId: activeScriptId,
    viewKey,
    nodes,
    edges: uniqueEdges(edges).filter((edge) => nodes.some((node) => node.id === edge.source) && nodes.some((node) => node.id === edge.target)),
    viewport,
    layout: { nodesLayout: layout },
    tasks: tasks.map(compactRow),
    taskProgress: taskProgress.map(compactRow),
    queues: queues.map(compactRow),
    scriptOptions: allScripts.map(compactRow),
    summary: {
      projectCount: 1,
      novelCount: novels.length,
      eventCount: novelEvents.length,
      scriptCount: allScripts.length,
      storySkeletonCount: storySkeletonText ? 1 : 0,
      adaptationStrategyCount: adaptationStrategyText ? 1 : 0,
      productionScriptPlanCount: productionScriptPlanText ? 1 : 0,
      productionStoryboardTableCount: productionStoryboardTableText ? 1 : 0,
      assetCount: assets.length,
      storyboardCount: storyboards.length,
      videoPromptCount: videoTracks.length,
      videoCount: videos.length,
      videoReviewCount: videoReviews.length,
      videoReviewWarningCount: videoReviews.filter((item: any) => item.status === "warning" || item.status === "failed").length,
      auditArtifactCount: audit.artifacts.length,
      auditSegmentCount: audit.segments.length,
      revisionCount: audit.revisions.length,
    },
    staleNodeIds: Object.keys(staleMap),
    audit: {
      artifacts: audit.artifacts.map(compactRow),
      segments: audit.segments.map(compactRow),
      revisions: audit.revisions.map(compactRow),
    },
  };
}

export async function saveCreativeCanvasLayout(input: SaveCreativeCanvasLayoutInput) {
  const viewKey = input.viewKey || "overview";
  const scriptId = input.scriptId ?? null;
  const now = Date.now();
  const payload = {
    projectId: input.projectId,
    scriptId,
    viewKey,
    nodesLayout: JSON.stringify(input.nodesLayout ?? {}),
    edgesLayout: JSON.stringify(input.edgesLayout ?? {}),
    viewport: JSON.stringify(input.viewport ?? { x: 0, y: 0, zoom: 0.72 }),
    updateTime: now,
  };
  const existing = await findCanvasState(input.projectId, scriptId, viewKey);
  if (existing?.id) {
    await db("o_creativeCanvasState").where("id", existing.id).update(payload);
    return { id: existing.id, updated: true };
  }
  const [id] = await db("o_creativeCanvasState").insert({ ...payload, createTime: now });
  return { id, updated: false };
}

export async function patchCreativeCanvasText(input: PatchCreativeCanvasTextInput) {
  const segment = await db("o_generationSegment").where("id", input.segmentId).first();
  if (!segment) throw new Error("内容片段不存在");
  const artifact = await db("o_generationArtifact").where("id", segment.artifactId).first();
  if (!artifact) throw new Error("生成物不存在");
  const patch = await patchGenerationSegment({
    segmentId: input.segmentId,
    newText: input.newText,
    note: input.note ?? "creative canvas patch",
    createdBy: input.createdBy ?? "admin",
  });
  const staleItems = await collectDownstreamStale(artifact.targetType, artifact.targetId);
  const staleNodeIds = Array.from(new Set(staleItems.map((item) => item.nodeId)));
  return {
    ...patch,
    staleNodeIds,
    stale: staleItems,
    target: {
      targetType: artifact.targetType,
      targetId: artifact.targetId,
      targetField: artifact.targetField,
    },
  };
}
