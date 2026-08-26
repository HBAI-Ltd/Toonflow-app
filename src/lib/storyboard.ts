import type { Knex } from "knex";

export interface DeleteStoryboardsInput {
  ids: number[];
  projectId: number;
  scriptId?: number;
  requireAll?: boolean;
}

export interface DeleteStoryboardsResult {
  deletedIds: number[];
  deletedCount: number;
}

interface StoryboardDeleteRow {
  id: number;
  trackId: number | null;
  flowId: number | null;
}

export async function deleteStoryboards(
  { ids, projectId, scriptId, requireAll = false }: DeleteStoryboardsInput,
  db: Knex,
): Promise<DeleteStoryboardsResult> {
  const uniqueIds = [...new Set(ids)];

  return db.transaction(async (trx) => {
    const storyboardData = (await trx("o_storyboard")
      .whereIn("id", uniqueIds)
      .where("projectId", projectId)
      .modify((query) => {
        if (scriptId !== undefined) query.where("scriptId", scriptId);
      })
      .select("id", "trackId", "flowId")) as StoryboardDeleteRow[];

    if (requireAll && storyboardData.length !== uniqueIds.length) {
      throw new Error("分镜数据已变化，请重新读取");
    }

    const deletedIds = storyboardData.map((item) => item.id);
    if (!deletedIds.length) return { deletedIds: [], deletedCount: 0 };

    const flowIds = [...new Set(storyboardData.map((item) => item.flowId).filter((id): id is number => id != null))];

    await trx("o_assets2Storyboard").whereIn("storyboardId", deletedIds).delete();
    if (flowIds.length) await trx("o_imageFlow").whereIn("id", flowIds).delete();
    await trx("o_storyboard").whereIn("id", deletedIds).delete();

    return { deletedIds, deletedCount: deletedIds.length };
  });
}
