import { IconEar, IconMicrophone, IconScissors, IconSubtitles } from "@tabler/icons-vue";
import { markMessages } from "@toonflow/i18n/vue";
import { runMediaModelJob } from "@toonflow/node-shared/mediaModelJob";
import type { MediaTool, MediaToolContext, ToolField } from "@toonflow/node-shared/mediaTools";
import { isPcmMimeType, type PcmOptions } from "@toonflow/node-shared/pcmPreview";
import { audioGroups } from "./audioEffects";

const tracks = [
  { name: "voice", label: "人声", mimeType: "audio/wav" },
  { name: "music", label: "伴奏", mimeType: "audio/wav" },
];
export const separationTool: MediaTool = {
  id: "separateVocals", modelId: "demucs", group: audioGroups.voice, label: "分离人声与伴奏", icon: IconMicrophone,
  outputs: tracks,
};

const pauseFields: ToolField[] = [{ type: "select", key: "pauseMs", label: "要缩短的停顿", value: "600", options: [
  { label: "停顿至少 0.3 秒", value: "300" }, { label: "停顿至少 0.6 秒", value: "600" }, { label: "停顿至少 1.2 秒", value: "1200" },
] }];
const languageFields: ToolField[] = [{ type: "select", key: "language", label: "对白语言", value: "auto", options: [
  { label: "自动识别语言", value: "auto" }, { label: "中文", value: "zh" }, { label: "英文", value: "en" },
  { label: "日语", value: "ja" }, { label: "韩语", value: "ko" },
] }];

export const speechTools = markMessages<MediaTool[]>([
  { id: "denoiseSpeech", modelId: "deepFilterNet", group: audioGroups.repair, label: "让人声更清楚", icon: IconEar },
  { id: "tightenSpeech", modelId: "sileroVad", group: audioGroups.voice, label: "缩短说话停顿", icon: IconScissors, menuField: "pauseMs", fields: pauseFields },
  { id: "transcribe", modelId: "whisper", group: audioGroups.voice, label: "语音转字幕", icon: IconSubtitles, menuField: "language",
    fields: languageFields, outputs: [{ mimeType: "text/srt", label: "对白字幕" }] },
]);

export async function processSpeechTool(operation: string, context: MediaToolContext, pcm?: PcmOptions) {
  const tool = speechTools.find(item => item.id === operation);
  if (!tool) throw new Error("未知的语音处理工具");
  const subtitles = operation === "transcribe";
  const name = subtitles ? "subtitles.srt" : operation === "tightenSpeech" ? "dialogue.wav" : "enhanced.wav";
  const path = `${context.outputDirectory}/${name}`;
  const options = { operation, pcm, ...(subtitles ? { language: context.values.language } : operation === "tightenSpeech" ? { pauseMs: Number(context.values.pauseMs) } : {}) };
  await runMediaModelJob("audio", { directory: context.directory, source: context.source.url, output: path, options }, context.signal, context.reportProgress);
  return [{ path, label: subtitles ? "对白字幕" : tool.label, mimeType: subtitles ? "text/srt" : "audio/wav" }];
}

export async function separateAudio({ directory, source, outputDirectory, signal, reportProgress }: MediaToolContext, pcm?: PcmOptions) {
  if (isPcmMimeType(source.mimeType) && !pcm) throw new Error("请先在音频预览中填写有效的 PCM 采样率、声道数和采样格式");
  const results = tracks.map(({ name, mimeType, label }) => ({ path: `${outputDirectory}/${name}.wav`, mimeType, label }));
  await runMediaModelJob("audio", { directory, source: source.url, output: results[0]!.path, options: { operation: "separateVocals", pcm } }, signal, reportProgress);
  return results;
}
