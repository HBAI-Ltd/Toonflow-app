export const SrTaskStatuses = [
  "draft",
  "source_uploading",
  "source_uploaded",
  "preprocessing",
  "transcribing",
  "detecting_shots",
  "sampling_frames",
  "understanding_frames",
  "ir_built",
  "dialogue_reviewed",
  "asset_gap_ready",
  "assets_bound",
  "storyboard_generated",
  "checked",
  "pushed",
  "failed",
] as const;

export type SrTaskStatus = (typeof SrTaskStatuses)[number];

const statusSet = new Set<string>(SrTaskStatuses);

const allowedTransitions: Record<SrTaskStatus, SrTaskStatus[]> = {
  draft: ["source_uploading", "failed"],
  source_uploading: ["source_uploaded", "failed"],
  source_uploaded: ["preprocessing", "failed"],
  preprocessing: ["transcribing", "detecting_shots", "failed"],
  transcribing: ["detecting_shots", "failed"],
  detecting_shots: ["sampling_frames", "failed"],
  sampling_frames: ["understanding_frames", "failed"],
  understanding_frames: ["ir_built", "failed"],
  ir_built: ["understanding_frames", "dialogue_reviewed", "asset_gap_ready", "failed"],
  dialogue_reviewed: ["understanding_frames", "ir_built", "asset_gap_ready", "failed"],
  asset_gap_ready: ["understanding_frames", "ir_built", "assets_bound", "failed"],
  assets_bound: ["understanding_frames", "ir_built", "asset_gap_ready", "storyboard_generated", "failed"],
  storyboard_generated: ["checked", "failed"],
  checked: ["pushed", "failed"],
  pushed: [],
  failed: ["preprocessing", "understanding_frames"],
};

export function isSrTaskStatus(status: string): status is SrTaskStatus {
  return statusSet.has(status);
}

export function assertTransition(from: string, to: string): asserts to is SrTaskStatus {
  if (!isSrTaskStatus(from)) throw new Error(`Unknown structural replica task status: ${from}`);
  if (!isSrTaskStatus(to)) throw new Error(`Unknown structural replica task status: ${to}`);
  if (from === to) return;

  const allowed = allowedTransitions[from];
  if (!allowed.includes(to)) {
    throw new Error(`Invalid structural replica task status transition: ${from} -> ${to}`);
  }
}

export function isTerminalStatus(status: string): boolean {
  return status === "pushed" || status === "failed";
}
