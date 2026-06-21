import crypto from "crypto";
import db from "@/utils/db";
import type { EffectivePrompt } from "@/utils/promptCenter";

export type GenerationArtifactType =
  | "event"
  | "script"
  | "storyboardPrompt"
  | "storyboardVideoDesc"
  | "videoPrompt"
  | "assetPrompt"
  | "manual";

interface TargetConfig {
  idColumn: string;
  fields: string[];
}

const TARGETS: Record<string, TargetConfig> = {
  o_novel: { idColumn: "id", fields: ["event", "chapterData"] },
  o_script: { idColumn: "id", fields: ["content"] },
  o_storyboard: { idColumn: "id", fields: ["prompt", "videoDesc", "dialogue", "soundEffect", "shotType", "cameraMovement"] },
  o_assets: { idColumn: "id", fields: ["prompt", "describe"] },
  o_videoTrack: { idColumn: "id", fields: ["prompt"] },
  o_agentWorkData: { idColumn: "id", fields: ["data"] },
};

export interface ContentTarget {
  targetType: keyof typeof TARGETS | string;
  targetId: number | string;
  targetField: string;
}

export interface RecordGenerationArtifactInput extends ContentTarget {
  projectId?: number | null;
  artifactType: GenerationArtifactType | string;
  title?: string | null;
  content: string;
  effectivePrompt?: EffectivePrompt | null;
  promptHash?: string | null;
  promptVersionId?: number | null;
  promptSource?: string | null;
  promptUsageId?: number | null;
  modelName?: string | null;
  taskId?: number | null;
  parentArtifactId?: number | null;
  meta?: Record<string, unknown> | null;
}

export interface SegmentPatchInput {
  segmentId: number;
  newText: string;
  note?: string | null;
  createdBy?: string | null;
}

export function hashContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function assertTarget(targetType: string, targetField: string): TargetConfig {
  const config = TARGETS[targetType];
  if (!config) throw new Error(`不支持的内容目标: ${targetType}`);
  if (!config.fields.includes(targetField)) throw new Error(`不支持的内容字段: ${targetType}.${targetField}`);
  return config;
}

export function splitContentSegments(content: string): Array<{ index: number; text: string; startOffset: number; endOffset: number; type: string }> {
  const segments: Array<{ index: number; text: string; startOffset: number; endOffset: number; type: string }> = [];
  const pattern = /[^\n。！？!?；;]+[。！？!?；;]?/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    const raw = match[0];
    const leadingTrim = raw.length - raw.trimStart().length;
    const trailingTrim = raw.length - raw.trimEnd().length;
    const text = raw.trim();
    if (!text) continue;
    const startOffset = match.index + leadingTrim;
    const endOffset = match.index + raw.length - trailingTrim;
    segments.push({
      index: segments.length,
      text,
      startOffset,
      endOffset,
      type: text.includes("\n") ? "paragraph" : "sentence",
    });
  }
  if (!segments.length && content.trim()) {
    const leadingTrim = content.length - content.trimStart().length;
    const text = content.trim();
    segments.push({
      index: 0,
      text,
      startOffset: leadingTrim,
      endOffset: leadingTrim + text.length,
      type: "text",
    });
  }
  return segments;
}

export async function recordGenerationArtifact(input: RecordGenerationArtifactInput): Promise<{ id: number; contentHash: string; segmentCount: number }> {
  assertTarget(input.targetType, input.targetField);
  const content = input.content ?? "";
  const contentHash = hashContent(content);
  const now = Date.now();
  const promptHash = input.promptHash ?? input.effectivePrompt?.hash ?? null;
  const promptVersionId = input.promptVersionId ?? input.effectivePrompt?.versionId ?? null;
  const promptSource = input.promptSource ?? input.effectivePrompt?.key ?? input.effectivePrompt?.sourcePath ?? input.effectivePrompt?.promptType ?? null;

  const [id] = await db("o_generationArtifact").insert({
    projectId: input.projectId ?? null,
    artifactType: input.artifactType,
    targetType: input.targetType,
    targetId: String(input.targetId),
    targetField: input.targetField,
    title: input.title ?? null,
    content,
    contentHash,
    promptHash,
    promptVersionId,
    promptSource,
    modelName: input.modelName ?? null,
    taskId: input.taskId ?? null,
    promptUsageId: input.promptUsageId ?? null,
    parentArtifactId: input.parentArtifactId ?? null,
    meta: input.meta ? JSON.stringify(input.meta) : null,
    createTime: now,
  });

  const segments = splitContentSegments(content);
  if (segments.length) {
    await db("o_generationSegment").insert(
      segments.map((segment) => ({
        artifactId: id,
        projectId: input.projectId ?? null,
        artifactType: input.artifactType,
        segmentIndex: segment.index,
        segmentType: segment.type,
        startOffset: segment.startOffset,
        endOffset: segment.endOffset,
        text: segment.text,
        hash: hashContent(segment.text),
        createTime: now,
      })),
    );
  }

  return { id, contentHash, segmentCount: segments.length };
}

export async function snapshotTargetContent(input: Omit<RecordGenerationArtifactInput, "content">): Promise<{ id: number; contentHash: string; segmentCount: number }> {
  const target = assertTarget(input.targetType, input.targetField);
  const row = await db(input.targetType).where(target.idColumn, input.targetId).first();
  if (!row) throw new Error("目标内容不存在");
  return recordGenerationArtifact({
    ...input,
    content: String(row[input.targetField] ?? ""),
  });
}

export async function searchGenerationSegments(input: {
  projectId?: number;
  query: string;
  artifactType?: string;
  limit?: number;
}) {
  const limit = Math.min(Math.max(input.limit ?? 30, 1), 100);
  let q = db("o_generationSegment as s")
    .leftJoin("o_generationArtifact as a", "a.id", "s.artifactId")
    .select(
      "s.id",
      "s.artifactId",
      "s.projectId",
      "s.artifactType",
      "s.segmentIndex",
      "s.segmentType",
      "s.startOffset",
      "s.endOffset",
      "s.text",
      "s.hash",
      "a.targetType",
      "a.targetId",
      "a.targetField",
      "a.title",
      "a.promptHash",
      "a.promptVersionId",
      "a.promptSource",
      "a.modelName",
      "a.createTime",
    )
    .where("s.text", "like", `%${input.query}%`)
    .orderBy("a.createTime", "desc")
    .limit(limit);
  if (input.projectId !== undefined) q = q.where("s.projectId", input.projectId);
  if (input.artifactType) q = q.where("s.artifactType", input.artifactType);
  return q;
}

export async function getGenerationAuditGraph(input: {
  projectId?: number;
  targetType?: string;
  targetId?: string | number;
  artifactType?: string;
  limit?: number;
}) {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
  let query = db("o_generationArtifact").select("*").orderBy("createTime", "desc").limit(limit);
  if (input.projectId !== undefined) query = query.where("projectId", input.projectId);
  if (input.targetType) query = query.where("targetType", input.targetType);
  if (input.targetId !== undefined) query = query.where("targetId", String(input.targetId));
  if (input.artifactType) query = query.where("artifactType", input.artifactType);

  const artifacts = await query;
  const artifactIds = artifacts.map((item: any) => item.id).filter(Boolean);
  const segments = artifactIds.length
    ? await db("o_generationSegment").whereIn("artifactId", artifactIds).orderBy(["artifactId", "segmentIndex"])
    : [];
  const revisions = artifactIds.length
    ? await db("o_generationRevision").whereIn("artifactId", artifactIds).orderBy("createTime", "desc")
    : [];

  const nodes = [
    ...artifacts.map((item: any) => ({
      id: `artifact:${item.id}`,
      type: "artifact",
      label: item.title || `${item.artifactType} ${item.targetType}.${item.targetField}`,
      data: item,
    })),
    ...segments.map((item: any) => ({
      id: `segment:${item.id}`,
      type: "segment",
      label: item.text.length > 36 ? `${item.text.slice(0, 36)}...` : item.text,
      data: item,
    })),
  ];

  const edges = [
    ...segments.map((item: any) => ({
      id: `artifact:${item.artifactId}->segment:${item.id}`,
      source: `artifact:${item.artifactId}`,
      target: `segment:${item.id}`,
      type: "contains",
    })),
    ...artifacts
      .filter((item: any) => item.parentArtifactId)
      .map((item: any) => ({
        id: `artifact:${item.parentArtifactId}->artifact:${item.id}`,
        source: `artifact:${item.parentArtifactId}`,
        target: `artifact:${item.id}`,
        type: "revision",
      })),
  ];

  return { nodes, edges, artifacts, segments, revisions };
}

export async function patchGenerationSegment(input: SegmentPatchInput) {
  const segment = await db("o_generationSegment").where("id", input.segmentId).first();
  if (!segment) throw new Error("内容片段不存在");
  const artifact = await db("o_generationArtifact").where("id", segment.artifactId).first();
  if (!artifact) throw new Error("生成物不存在");
  const targetType = artifact.targetType;
  const targetField = artifact.targetField;
  const targetId = artifact.targetId;
  const artifactType = artifact.artifactType;
  if (!targetType || !targetField || targetId == null || !artifactType) throw new Error("生成物目标信息不完整");
  if (artifact.contentHash == null) throw new Error("生成物缺少内容 hash");
  if (segment.startOffset == null || segment.endOffset == null || segment.text == null) throw new Error("片段位置信息不完整");

  const target = assertTarget(targetType, targetField);
  const row = await (db as any)(targetType).where(target.idColumn, targetId).first();
  if (!row) throw new Error("目标内容不存在");
  const currentContent = String(row[targetField] ?? "");
  if (hashContent(currentContent) !== artifact.contentHash) {
    throw new Error("目标内容已变化，请刷新审计快照后再修改");
  }
  if (currentContent.slice(segment.startOffset, segment.endOffset) !== segment.text) {
    throw new Error("片段位置已变化，请刷新审计快照后再修改");
  }

  const nextContent = `${currentContent.slice(0, segment.startOffset)}${input.newText}${currentContent.slice(segment.endOffset)}`;
  const now = Date.now();
  const [revisionId] = await db("o_generationRevision").insert({
    artifactId: artifact.id,
    segmentId: segment.id,
    projectId: artifact.projectId,
    targetType: artifact.targetType,
    targetId: artifact.targetId,
    targetField: artifact.targetField,
    beforeText: segment.text,
    afterText: input.newText,
    beforeHash: segment.hash,
    afterHash: hashContent(input.newText),
    note: input.note ?? null,
    createdBy: input.createdBy ?? "admin",
    createTime: now,
  });

  await (db as any)(targetType).where(target.idColumn, targetId).update({
    [targetField]: nextContent,
  });

  const snapshot = await recordGenerationArtifact({
    projectId: artifact.projectId ?? null,
    artifactType,
    targetType,
    targetId,
    targetField,
    title: artifact.title,
    content: nextContent,
    promptHash: artifact.promptHash,
    promptVersionId: artifact.promptVersionId,
    promptSource: artifact.promptSource,
    promptUsageId: artifact.promptUsageId,
    modelName: artifact.modelName,
    taskId: artifact.taskId,
    parentArtifactId: artifact.id,
    meta: { revisionId, reason: "segmentPatch" },
  });

  return {
    revisionId,
    artifactId: snapshot.id,
    contentHash: snapshot.contentHash,
    segmentCount: snapshot.segmentCount,
  };
}
