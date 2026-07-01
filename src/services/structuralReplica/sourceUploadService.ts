import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import u from "@/utils";
import type { o_sr_upload_part } from "@/types/database";
import { getTaskOrThrow, listUploadParts, saveSourceMedia, saveUploadPart, updateTaskStatus } from "./repository";

const ALLOWED_MIME_TYPES = new Set(["video/mp4", "video/quicktime"]);
const DEFAULT_MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;
export const SOURCE_UPLOAD_CHUNK_SIZE = 8 * 1024 * 1024;

export interface InitUploadInput {
  taskId: number;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  sha256?: string | null;
}

export interface InitUploadResult {
  uploadId: string;
  chunkSize: number;
  uploadedParts: o_sr_upload_part[];
}

export interface SaveChunkInput {
  taskId: number;
  uploadId: string;
  partIndex: number;
  buffer: Buffer;
}

export interface SaveChunkResult {
  partIndex: number;
  partSize: number;
  partSha256: string;
}

export interface CompleteUploadInput {
  taskId: number;
  uploadId: string;
  totalParts: number;
}

export interface CompleteUploadResult {
  sourcePath: string;
  sourceUrl: string;
  sha256: string;
  sizeBytes: number;
  status: string | null | undefined;
}

function getMaxUploadBytes(): number {
  const configured = Number(process.env.SR_MAX_UPLOAD_BYTES);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MAX_UPLOAD_BYTES;
}

function ensureSupportedSource(input: InitUploadInput) {
  if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
    throw new Error("仅支持 video/mp4 或 video/quicktime");
  }
  if (!input.sizeBytes || input.sizeBytes <= 0) {
    throw new Error("文件大小必须大于 0");
  }
  if (input.sizeBytes > getMaxUploadBytes()) {
    throw new Error("文件大小超过上传上限");
  }
}

function getUploadPartRelPath(taskId: number, uploadId: string, partIndex: number) {
  return path.join("tmp", "structuralReplica", String(taskId), uploadId, `${partIndex}.part`);
}

function getFinalSourceRelPath(projectId: number, taskId: number) {
  return path.join(String(projectId), "structuralReplica", String(taskId), "source", "source.mp4");
}

function normalizeOssPath(relPath: string) {
  return `/${relPath.split(path.sep).join("/")}`;
}

function sha256Buffer(buffer: Buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function sha256File(filePath: string) {
  const hash = crypto.createHash("sha256");
  await pipeline(fs.createReadStream(filePath), hash);
  return hash.digest("hex");
}

async function getFileSize(filePath: string) {
  const stat = await fsp.stat(filePath);
  return stat.size;
}

async function assertUploadTask(taskId: number) {
  const task = await getTaskOrThrow(taskId);
  if (!task.projectId) throw new Error("任务缺少 projectId");
  return task;
}

export async function initUpload(input: InitUploadInput): Promise<InitUploadResult> {
  ensureSupportedSource(input);
  await assertUploadTask(input.taskId);

  const uploadId = `sr_upload_${Date.now()}_${crypto.randomUUID()}`;
  await updateTaskStatus(input.taskId, "source_uploading");

  return {
    uploadId,
    chunkSize: SOURCE_UPLOAD_CHUNK_SIZE,
    uploadedParts: [],
  };
}

export async function saveChunk(input: SaveChunkInput): Promise<SaveChunkResult> {
  if (!input.uploadId) throw new Error("缺少 uploadId");
  if (!Number.isInteger(input.partIndex) || input.partIndex < 0) throw new Error("partIndex 必须为非负整数");
  if (!input.buffer.length) throw new Error("分片内容为空");

  await assertUploadTask(input.taskId);
  const relPath = getUploadPartRelPath(input.taskId, input.uploadId, input.partIndex);
  const absPath = u.getPath(relPath);
  await fsp.mkdir(path.dirname(absPath), { recursive: true });
  await fsp.writeFile(absPath, input.buffer);

  const partSha256 = sha256Buffer(input.buffer);
  await saveUploadPart({
    taskId: input.taskId,
    uploadId: input.uploadId,
    partIndex: input.partIndex,
    partSize: input.buffer.length,
    partSha256,
    path: relPath.split(path.sep).join("/"),
  });

  return {
    partIndex: input.partIndex,
    partSize: input.buffer.length,
    partSha256,
  };
}

function assertContiguousParts(parts: o_sr_upload_part[], totalParts: number) {
  if (parts.length !== totalParts) {
    throw new Error(`分片数量不完整，期望 ${totalParts} 个，实际 ${parts.length} 个`);
  }

  for (let index = 0; index < totalParts; index += 1) {
    const part = parts[index];
    if (part?.partIndex !== index) {
      throw new Error(`分片索引不连续，缺少 partIndex=${index}`);
    }
    if (!part.path) {
      throw new Error(`分片 partIndex=${index} 缺少文件路径`);
    }
  }
}

export async function completeUpload(input: CompleteUploadInput): Promise<CompleteUploadResult> {
  if (!input.uploadId) throw new Error("缺少 uploadId");
  if (!Number.isInteger(input.totalParts) || input.totalParts <= 0) throw new Error("totalParts 必须为正整数");

  const task = await assertUploadTask(input.taskId);
  const parts = await listUploadParts(input.taskId, input.uploadId);
  assertContiguousParts(parts, input.totalParts);

  const sourceRelPath = getFinalSourceRelPath(task.projectId!, input.taskId);
  const sourcePath = normalizeOssPath(sourceRelPath);
  const outputAbsPath = u.getPath(path.join("oss", sourceRelPath));
  await fsp.mkdir(path.dirname(outputAbsPath), { recursive: true });

  const output = fs.createWriteStream(outputAbsPath);
  const outputFinished = new Promise<void>((resolve, reject) => {
    output.on("finish", resolve);
    output.on("error", reject);
  });
  try {
    for (const part of parts) {
      await pipeline(fs.createReadStream(u.getPath(part.path!)), output, { end: false });
    }
  } finally {
    output.end();
  }
  await outputFinished;

  const [sha256, sizeBytes] = await Promise.all([sha256File(outputAbsPath), getFileSize(outputAbsPath)]);
  await saveSourceMedia({
    taskId: input.taskId,
    sourcePath,
    sizeBytes,
    sha256,
    hasAudio: 0,
  });
  const updatedTask = await updateTaskStatus(input.taskId, "source_uploaded");

  return {
    sourcePath,
    sourceUrl: await u.oss.getFileUrl(sourcePath),
    sha256,
    sizeBytes,
    status: updatedTask.status,
  };
}
