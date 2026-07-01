import fs from "node:fs/promises";
import { FrameSampleSchema } from "./schemas";
import { saveFrameSamples } from "./repository";
import { toOssRelPath } from "./artifactPaths";

export async function ingestFrameSamples(taskId: number, analysisDir: string) {
  const raw = JSON.parse(await fs.readFile(`${analysisDir}/frames.json`, "utf8"));
  const samples = (raw.samples || []).map((sample: unknown) => {
    const parsed = FrameSampleSchema.parse(sample);
    return {
      ...parsed,
      filePath: toOssRelPath(parsed.filePath) ?? parsed.filePath,
    };
  });
  return await saveFrameSamples(taskId, samples);
}
