import type { NextFunction, Request, Response } from "express";
import { assertAssetAccess, assertProjectAccess, assertTaskAccess } from "@/services/structuralReplica/accessBoundaryService";

function firstPositiveInt(values: unknown[]): number | null {
  for (const value of values) {
    const num = Number(value);
    if (Number.isFinite(num) && num > 0) return num;
  }
  return null;
}

export async function checkStructuralReplicaAccess(req: Request): Promise<void> {
  if (!req.path.startsWith("/api/structuralReplica")) return;
  const user = (req as any).user;
  const source = { ...(req.query || {}), ...(req.params || {}), ...(req.body || {}) } as Record<string, unknown>;
  const taskId = firstPositiveInt([source.taskId]);
  if (taskId) {
    await assertTaskAccess(taskId, user);
    return;
  }
  const assetId = firstPositiveInt([source.assetId]);
  if (assetId) {
    await assertAssetAccess(assetId, user);
    return;
  }
  const projectId = firstPositiveInt([source.projectId]);
  if (projectId) await assertProjectAccess(projectId, user);
}

export async function structuralReplicaAccessBoundary(req: Request, res: Response, next: NextFunction) {
  try {
    await checkStructuralReplicaAccess(req);
    next();
  } catch (error) {
    res.status(403).send({ message: error instanceof Error ? error.message : String(error) });
  }
}
