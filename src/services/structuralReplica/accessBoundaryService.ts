import u from "@/utils";

export interface SrRequestUser {
  id?: number | string | null;
}

function userId(user?: SrRequestUser | null): number | null {
  const id = Number(user?.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function ownsProject(project: { id?: number | null; userId?: number | null } | undefined, user?: SrRequestUser | null): boolean {
  if (!project?.id) return false;
  const requestUserId = userId(user);
  if (!requestUserId) return true;
  return !project.userId || Number(project.userId) === requestUserId;
}

export async function assertProjectAccess(projectId: number, user?: SrRequestUser | null) {
  const project = await u.db("o_project").where("id", projectId).first();
  if (!project) throw new Error("project not found");
  if (!ownsProject(project, user)) throw new Error("project access denied");
  return project;
}

export async function assertTaskAccess(taskId: number, user?: SrRequestUser | null) {
  const task = await u.db("o_sr_task").where("id", taskId).first();
  if (!task) throw new Error("structural replica task not found");
  await assertProjectAccess(Number(task.projectId), user);
  return task;
}

export async function assertAssetAccess(assetId: number, user?: SrRequestUser | null) {
  const asset = await u.db("o_assets").where("id", assetId).first();
  if (!asset) throw new Error("asset not found");
  if (asset.projectId) await assertProjectAccess(Number(asset.projectId), user);
  return asset;
}
