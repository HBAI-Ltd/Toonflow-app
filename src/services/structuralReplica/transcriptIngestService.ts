import fs from "node:fs/promises";
import { TranscriptSchema } from "./schemas";
import { saveTranscript } from "./repository";

export async function ingestTranscript(taskId: number, analysisDir: string) {
  const raw = JSON.parse(await fs.readFile(`${analysisDir}/transcript.json`, "utf8"));
  const transcript = TranscriptSchema.parse(raw);
  return await saveTranscript(taskId, transcript);
}
