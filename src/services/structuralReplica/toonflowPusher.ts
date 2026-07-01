import u from "@/utils";
import { db } from "@/utils/db";
import { getTaskBundle } from "./repository";
import { ConsistencyReportSchema, RegeneratedStoryboardSchema } from "./schemas";

export interface PushToProductionInput {
  taskId: number;
  createScript?: boolean;
  scriptName?: string;
}

export interface PushToProductionResult {
  scriptId: number;
  storyboardIds: number[];
  trackIds: number[];
}

function makeTrackId(index: number): number {
  return Date.now() + index;
}

export async function pushToProduction(input: PushToProductionInput): Promise<PushToProductionResult> {
  const bundle = await getTaskBundle(input.taskId);
  if (!bundle.regeneratedStoryboard?.dataJson) throw new Error("regenerated storyboard not found");
  if (!bundle.report?.reportJson) throw new Error("consistency report not found");
  if (!bundle.task.projectId) throw new Error("task projectId not found");

  const report = ConsistencyReportSchema.parse(JSON.parse(bundle.report.reportJson));
  if (report.status === "blocked") throw new Error("consistency report has blockers");

  const storyboard = RegeneratedStoryboardSchema.parse(JSON.parse(bundle.regeneratedStoryboard.dataJson));
  const projectId = bundle.task.projectId;
  return await db.transaction(async (trx) => {
    let scriptId = bundle.task.scriptId || null;
    if (!scriptId) {
      if (input.createScript === false) throw new Error("task has no scriptId; createScript must be true");
      const [newScriptId] = await trx("o_script").insert({
        projectId,
        name: input.scriptName || bundle.task.name || `Structural Replica ${input.taskId}`,
        content: "",
        createTime: Date.now(),
        extractState: 0,
        errorReason: null,
      });
      scriptId = Number(newScriptId);
      await trx("o_sr_task").where("id", input.taskId).update({ scriptId, updatedAt: Date.now() });
    }

    const storyboardIds: number[] = [];
    const trackIdByName = new Map<string, number>();
    const rowsByTrack = new Map<string, typeof storyboard.rows>();

    for (const row of storyboard.rows) {
      rowsByTrack.set(row.track, [...(rowsByTrack.get(row.track) || []), row]);
    }

    let trackIndex = 0;
    for (const [track, rows] of rowsByTrack) {
      const duration = rows.reduce((sum, row) => sum + row.duration, 0);
      const trackId = makeTrackId(trackIndex++);
      await trx("o_videoTrack").insert({
        id: trackId,
        projectId,
        scriptId,
        duration,
      });
      trackIdByName.set(track, trackId);
    }

    for (let index = 0; index < storyboard.rows.length; index += 1) {
      const row = storyboard.rows[index];
      const trackId = trackIdByName.get(row.track);
      const [storyboardId] = await trx("o_storyboard").insert({
        prompt: row.prompt,
        duration: String(row.duration),
        state: row.state || "未生成",
        filePath: row.src,
        scriptId,
        projectId,
        track: row.track,
        trackId,
        index: index + 1,
        videoDesc: row.videoDesc,
        shouldGenerateImage: row.shouldGenerateImage,
        createTime: Date.now(),
      });
      const id = Number(storyboardId);
      storyboardIds.push(id);

      if (row.associateAssetsIds.length) {
        await trx("o_assets2Storyboard").insert(
          row.associateAssetsIds.map((assetId) => ({
            assetId,
            storyboardId: id,
          })),
        );
      }
    }

    const mappings = storyboard.rows.map((row, index) => ({
      taskId: input.taskId,
      shotId: row.shotId,
      storyboardId: storyboardIds[index],
      trackId: trackIdByName.get(row.track) || null,
    }));

    await trx("o_sr_storyboard_mapping").where("taskId", input.taskId).delete();
    if (mappings.length) await trx("o_sr_storyboard_mapping").insert(mappings.map((mapping) => ({ ...mapping, createdAt: Date.now() })));

    return {
      scriptId,
      storyboardIds,
      trackIds: [...trackIdByName.values()],
    };
  });
}
