import fs from "node:fs/promises";
import { ShotDetectionSchema } from "./schemas";
import { saveShotDetection } from "./repository";

export async function ingestShotDetection(taskId: number, analysisDir: string) {
  const raw = JSON.parse(await fs.readFile(`${analysisDir}/shots.json`, "utf8"));
  const shotDetection = ShotDetectionSchema.parse(raw);
  return await saveShotDetection(taskId, shotDetection);
}
