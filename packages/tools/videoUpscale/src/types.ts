export const upscaleResolutions = ["720p", "1080p", "4k"] as const;
export type UpscaleResolution = typeof upscaleResolutions[number];

export interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  frameRate: number;
  hasAudio: boolean;
  audioDuration?: number;
}

export interface UpscaleQuote extends VideoInfo {
  path: string;
  sourceHash: string;
  resolution: UpscaleResolution;
  estimatedCostUsd: number;
}

export type UpscaleState = "uploading" | "submitting" | "processing" | "succeeded" | "failed";

export interface UpscaleTaskStatus {
  taskId: string;
  state: UpscaleState;
  path: string;
  resolution: UpscaleResolution;
  estimatedCostUsd: number;
  costUsd?: number;
  result?: { path: string; mimeType: "video/mp4"; width: number; height: number; duration: number };
  message?: string;
}

export interface UpscaleTask extends UpscaleTaskStatus {
  workspace: string;
  account: string;
  sourceHash: string;
  source: VideoInfo;
  objectKey: string;
  remoteId?: string;
  outputHash?: string;
}
