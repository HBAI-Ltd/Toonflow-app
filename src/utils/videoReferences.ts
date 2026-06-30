import db from "@/utils/db";
import oss from "@/utils/oss";
import type { ReferenceList, ReferenceRole } from "@/utils/ai";

type ParsedVideoMode = string | string[];

export interface UploadReferenceInput {
  id: number;
  sources: string;
}

interface MediaItem {
  id?: number;
  source: "assets" | "storyboard";
  type: "image" | "audio" | "video";
  path: string;
  name?: string;
  index?: number;
  frameRole?: "firstFrame" | "lastFrame";
}

const FRAME_MODES = new Set(["singleImage", "startFrameOptional", "endFrameOptional", "startEndRequired"]);

export function parseVideoMode(mode: unknown): ParsedVideoMode {
  if (Array.isArray(mode)) return mode.map(String);
  if (typeof mode !== "string") return String(mode || "text");
  const trimmed = mode.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
  }
  return trimmed || "text";
}

export function normalizedVideoModeText(mode: unknown): string {
  const parsed = parseVideoMode(mode);
  return Array.isArray(parsed) ? JSON.stringify(parsed) : parsed;
}

function mediaType(value: unknown): "image" | "audio" | "video" {
  const type = String(value || "").toLowerCase();
  if (type === "audio") return "audio";
  if (type === "video") return "video";
  return "image";
}

function limitFromMode(mode: string[], prefix: string): number {
  const item = mode.find((value) => value.toLowerCase().startsWith(`${prefix.toLowerCase()}:`));
  const value = item ? Number(item.split(":")[1]) : 0;
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function isStoryboardSource(value: string) {
  return value.toLowerCase() === "storyboard";
}

async function explicitMedia(uploadData: UploadReferenceInput[]): Promise<MediaItem[]> {
  const rows: MediaItem[] = [];
  for (const item of uploadData) {
    if (isStoryboardSource(item.sources)) {
      const storyboard = await db("o_storyboard").where("id", item.id).select("id", "filePath", "state", "index").first();
      if (storyboard?.filePath && storyboard.state === "已完成") {
        rows.push({ id: storyboard.id, source: "storyboard", type: "image", path: storyboard.filePath, name: `镜头 ${storyboard.index ?? storyboard.id}`, index: storyboard.index ?? undefined, frameRole: "firstFrame" });
      }
      continue;
    }
    if (item.sources === "assets") {
      const asset = await db("o_assets")
        .where("o_assets.id", item.id)
        .leftJoin("o_image", "o_assets.imageId", "o_image.id")
        .select("o_assets.id", "o_assets.name", "o_assets.type as assetType", "o_image.filePath", "o_image.type as imageType")
        .first();
      if (asset?.filePath) rows.push({ id: asset.id, source: "assets", type: mediaType(asset.imageType || asset.assetType), path: asset.filePath, name: asset.name || `资产 ${asset.id}` });
    }
  }
  return rows;
}

async function selectedLastFrameMap(storyboardIds: number[]): Promise<Map<number, MediaItem>> {
  const result = new Map<number, MediaItem>();
  if (!storyboardIds.length) return result;
  const rows = await db("o_generationArtifact")
    .where({
      artifactType: "storyboardImage",
      targetType: "o_storyboard",
    })
    .whereIn("targetId", storyboardIds.map(String))
    .orderBy("createTime", "desc")
    .select("targetId", "meta");
  for (const row of rows as any[]) {
    const storyboardId = Number(row.targetId);
    if (!Number.isFinite(storyboardId) || result.has(storyboardId)) continue;
    try {
      const meta = JSON.parse(row.meta || "{}");
      if (meta.frameRole === "lastFrame" && meta.selected && meta.state === "已完成" && meta.filePath) {
        result.set(storyboardId, {
          id: storyboardId,
          source: "storyboard",
          type: "image",
          path: meta.filePath,
          name: `镜头 ${storyboardId} 尾帧`,
          frameRole: "lastFrame",
        });
      }
    } catch {
      // Ignore broken legacy metadata.
    }
  }
  return result;
}

async function trackMedia(projectId: number, trackId: number): Promise<MediaItem[]> {
  const storyboards = await db("o_storyboard")
    .where({ projectId, trackId })
    .orderBy("index", "asc")
    .orderBy("id", "asc")
    .select("id", "filePath", "state", "index");
  const storyboardMedia = storyboards
    .filter((item: any) => item.filePath && item.state === "已完成")
    .map((item: any) => ({ id: item.id, source: "storyboard" as const, type: "image" as const, path: item.filePath, name: `镜头 ${item.index ?? item.id}`, index: item.index, frameRole: "firstFrame" as const }));

  const storyboardIds = storyboards.map((item: any) => Number(item.id)).filter((id: number) => Number.isFinite(id));
  const lastFrameMap = await selectedLastFrameMap(storyboardIds);
  const lastFrameMedia = storyboardMedia.map((item) => lastFrameMap.get(Number(item.id))).filter(Boolean) as MediaItem[];
  if (!storyboardIds.length) return storyboardMedia;
  const assets = await db("o_assets2Storyboard")
    .whereIn("o_assets2Storyboard.storyboardId", storyboardIds)
    .leftJoin("o_assets", "o_assets2Storyboard.assetId", "o_assets.id")
    .leftJoin("o_image", "o_assets.imageId", "o_image.id")
    .orderBy("o_assets2Storyboard.rowid")
    .select("o_assets.id", "o_assets.name", "o_assets.type as assetType", "o_image.filePath", "o_image.type as imageType");

  const seen = new Set<number>();
  const assetMedia = assets
    .filter((item: any) => item.id && item.filePath && !seen.has(Number(item.id)))
    .map((item: any) => {
      seen.add(Number(item.id));
      return { id: item.id, source: "assets" as const, type: mediaType(item.imageType || item.assetType), path: item.filePath, name: item.name || `资产 ${item.id}` };
    });
  return [...assetMedia, ...storyboardMedia, ...lastFrameMedia];
}

async function toReference(item: MediaItem, role: ReferenceRole): Promise<ReferenceList> {
  return {
    type: item.type,
    base64: await oss.getImageBase64(item.path),
    role,
    source: item.source,
    id: item.id,
    name: item.name,
  } as ReferenceList;
}

function chooseFirstFrame(storyboards: MediaItem[], assets: MediaItem[]) {
  return storyboards.find((item) => item.frameRole !== "lastFrame") || assets[0] || null;
}

function chooseLastFrame(storyboards: MediaItem[]) {
  const explicit = storyboards.find((item) => item.frameRole === "lastFrame");
  if (explicit) return explicit;
  if (storyboards.length < 2) return null;
  return storyboards[storyboards.length - 1];
}

export async function resolveVideoReferences(input: {
  projectId: number;
  trackId: number;
  mode: unknown;
  uploadData?: UploadReferenceInput[];
}): Promise<ReferenceList[]> {
  const mode = parseVideoMode(input.mode);
  const media = input.uploadData?.length ? await explicitMedia(input.uploadData) : await trackMedia(input.projectId, input.trackId);
  const imageAssets = media.filter((item) => item.source === "assets" && item.type === "image");
  const storyboardImages = media.filter((item) => item.source === "storyboard" && item.type === "image");
  const videoAssets = media.filter((item) => item.source === "assets" && item.type === "video");
  const audioAssets = media.filter((item) => item.source === "assets" && item.type === "audio");

  if (Array.isArray(mode)) {
    const imageLimit = limitFromMode(mode, "imageReference");
    const videoLimit = limitFromMode(mode, "videoReference");
    const audioLimit = limitFromMode(mode, "audioReference");
    const refs = [
      ...imageAssets.slice(0, imageLimit).map((item) => toReference(item, "imageReference")),
      ...storyboardImages.slice(0, Math.max(0, imageLimit - imageAssets.length)).map((item) => toReference(item, "imageReference")),
      ...videoAssets.slice(0, videoLimit).map((item) => toReference(item, "videoReference")),
      ...audioAssets.slice(0, audioLimit).map((item) => toReference(item, "audioReference")),
    ];
    return await Promise.all(refs);
  }

  if (!FRAME_MODES.has(mode)) return [];

  const firstFrame = chooseFirstFrame(storyboardImages, imageAssets);
  const lastFrame = chooseLastFrame(storyboardImages);
  if (mode === "startEndRequired" && (!firstFrame || !lastFrame)) {
    throw new Error("当前模型需要首尾帧，但该视频轨道没有两张已完成分镜图。请先生成/选定首帧和尾帧。");
  }

  const refs: Promise<ReferenceList>[] = [];
  if (firstFrame) refs.push(toReference(firstFrame, "firstFrame"));
  if ((mode === "endFrameOptional" || mode === "startEndRequired") && lastFrame) refs.push(toReference(lastFrame, "lastFrame"));
  if (audioAssets[0]) refs.push(toReference(audioAssets[0], "audioReference"));
  return await Promise.all(refs);
}
