import type { MediaTool, MediaToolContext, MediaToolResult } from "@toonflow/node-shared/mediaTools";
import { pictureTools, runPicture } from "./videoPicture";
import { soundTools, runSound } from "./videoSound";
import { runTimeline, timelineTools } from "./videoTimeline";
import { prepareJob, type VideoRunner } from "./videoToolJob";
import { modelVideoTools, runVideoModel } from "./videoInterpolation";
import { productionVideoTools, runProductionTool } from "./videoProductionTools";

const videoSoundTools = soundTools.filter(tool => !tool.sourceMimeTypes || tool.sourceMimeTypes.includes("video/*"));
const sections: [MediaTool[], VideoRunner][] = [[timelineTools, runTimeline], [pictureTools, runPicture], [videoSoundTools, runSound], [productionVideoTools, runProductionTool]];
const menuOrder = new Map([
  "split-video", "merge-video", "add-intro-image-to-video", "remove-silence", "fade-video",
  "speed-video", "reverse-video", "freeze-video", "stop-motion", "loop-video", "boomerang-video", "blendLoop",
  "crop-video", "reframe", "resize-video", "rotate-video",
  "adjust-video", "upscale", "rifeInterpolation", "video-stabilizer", "deflicker",
  "pixelate-video", "trackTarget", "remove-video-watermark", "patchGoodFrame", "repairBadFrame",
  "green-screen-editor", "portraitMatting", "blurBackground", "cleanBackground", "add-text-to-video", "add-photo-to-video", "picture-in-picture", "split-screen-video",
  "add-subtitles", "readSubtitles", "restoreSubtitles", "cleanPlate", "alignSubtitleTiming",
  "change-volume", "add-audio-to-video", "audio-video-sync", "video-voice-changer",
].map((id, index) => [id, index]));
export const videoTools: MediaTool[] = [...sections.flatMap(([tools]) => tools), ...modelVideoTools]
  .sort((a, b) => (menuOrder.get(a.id) ?? menuOrder.size) - (menuOrder.get(b.id) ?? menuOrder.size));

export async function runVideoTool(toolId: string, context: MediaToolContext): Promise<MediaToolResult[]> {
  const modelTool = modelVideoTools.find(tool => tool.id === toolId);
  if (modelTool) return runVideoModel(modelTool, context);
  for (const [tools, run] of sections) {
    const tool = tools.find(tool => tool.id === toolId);
    if (tool) return run(toolId, await prepareJob(tool, context));
  }
  throw new Error("未知的视频处理工具");
}
