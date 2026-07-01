import fs from "node:fs/promises";
import path from "node:path";
import isPathInside from "is-path-inside";
import u from "@/utils";

export interface CleanupResult {
  dryRun: boolean;
  removedFiles: string[];
  archivedJobs: number;
  expiredExports: number;
}

async function safeRm(filePath: string, allowedRoot: string, dryRun: boolean, removedFiles: string[]) {
  const absolute = path.resolve(filePath);
  if (!isPathInside(absolute, allowedRoot) && absolute !== allowedRoot) throw new Error(`cleanup path outside data root: ${filePath}`);
  try {
    const stat = await fs.stat(absolute);
    if (!stat.isFile()) return;
    removedFiles.push(absolute);
    if (!dryRun) await fs.rm(absolute, { force: true });
  } catch {
    return;
  }
}

function parseJson<T>(data: string | null | undefined, fallback: T): T {
  if (!data) return fallback;
  try {
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

async function safeRmOssRelPath(relPath: string | null | undefined, dataRoot: string, dryRun: boolean, removedFiles: string[]) {
  if (!relPath) return;
  const normalized = String(relPath).replace(/^[/\\]+/, "");
  await safeRm(u.getPath(["oss", ...normalized.split(/[\\/]+/)]), dataRoot, dryRun, removedFiles);
}

export async function cleanupStructuralReplicaArtifacts(options: { dryRun?: boolean; olderThanMs?: number; now?: number } = {}): Promise<CleanupResult> {
  const dryRun = options.dryRun !== false;
  const now = options.now ?? Date.now();
  const olderThanMs = options.olderThanMs ?? 14 * 24 * 60 * 60 * 1000;
  const dataRoot = u.getPath();
  const removedFiles: string[] = [];

  const expiredExports = await u.db("o_sr_timeline_export").where("expiresAt", "<", now).whereNot("status", "expired").select("*");
  for (const exp of expiredExports) {
    await safeRmOssRelPath(exp.outputPath, dataRoot, dryRun, removedFiles);
    const report = parseJson<{ subtitlePath?: string | null }>(exp.reportJson, {});
    await safeRmOssRelPath(report.subtitlePath, dataRoot, dryRun, removedFiles);
  }
  if (!dryRun && expiredExports.length) {
    await u
      .db("o_sr_timeline_export")
      .whereIn(
        "id",
        expiredExports.map((item) => item.id),
      )
      .update({ status: "expired", updatedAt: now });
  }

  const staleFailedCandidates = await u
    .db("o_sr_generation_candidate")
    .where("status", "failed")
    .andWhere("updatedAt", "<", now - olderThanMs)
    .select("*");
  for (const candidate of staleFailedCandidates) {
    await safeRmOssRelPath(candidate.videoPath, dataRoot, dryRun, removedFiles);
  }

  const oldJobs = await u
    .db("o_sr_generation_job")
    .whereIn("status", ["succeeded", "failed"])
    .andWhere("finishedAt", "<", now - olderThanMs)
    .select("id");
  if (!dryRun && oldJobs.length) {
    await fs.mkdir(u.getPath(["tmp", "structuralReplica", "archive"]), { recursive: true });
    await fs.writeFile(
      u.getPath(["tmp", "structuralReplica", "archive", `generation-jobs-${now}.json`]),
      JSON.stringify(oldJobs, null, 2),
      "utf8",
    );
  }
  return { dryRun, removedFiles, archivedJobs: oldJobs.length, expiredExports: expiredExports.length };
}
