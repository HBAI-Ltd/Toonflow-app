import type { Knex } from "knex";

export interface VideoPromptStoryboard {
  id: number;
  videoDesc: string | null;
  duration: string | null;
}

export async function getTrackStoryboardsForVideoPrompt(db: Knex, trackId: number, projectId: number): Promise<VideoPromptStoryboard[]> {
  const rows = await db("o_storyboard")
    .where({ trackId, projectId })
    .orderBy("index", "asc")
    .orderBy("id", "asc")
    .select("id", "videoDesc", "duration");

  return rows.filter((row: VideoPromptStoryboard) => row.videoDesc?.trim());
}
