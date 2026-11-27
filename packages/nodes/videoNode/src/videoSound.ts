import { markMessages } from "@toonflow/i18n/vue";
import { IconArrowsExchange, IconMicrophone, IconMusicPlus, IconVolume, IconVolumeOff, IconWaveSine } from "@tabler/icons-vue";
import type { MediaToolRunner } from "@toonflow/node-shared/mediaTools";
import { choice, field, imageAttachment, numeric, prepareJob, tempo, tool, type VideoJob } from "./videoToolJob";
import videoSyncEditor from "./components/videoSyncEditor.vue";

const audioVideo = { sourceMimeTypes: ["video/*", "audio/*"] };
export const soundTools = markMessages([
  tool("声音", "change-volume", "调整音量", [numeric("volume", "音量（%，0 为静音）", 120, 0, 500)], { icon: IconVolume, presets: [
    { label: "调大", values: { volume: 120 } }, { label: "调小", values: { volume: 70 } }, { label: "静音", values: { volume: 0 } },
  ] }),
  tool("声音", "add-audio-to-video", "添加配音或配乐", [choice("mode", "声音", { mix: "与原声混合", replace: "替换原声" }),
    numeric("volume", "添加音轨音量（%）", 100, 0, 300)], { icon: IconMusicPlus, menuField: "mode", accept: "audio/*", attachmentLabel: "选择音乐或配音", presets: [
    { label: "正常音量", values: { volume: 100 } }, { label: "轻声配乐", values: { volume: 25 } },
  ] }),
  tool("声音", "audio-video-sync", "对齐声音和画面", [numeric("delay", "声音偏移（秒）", 0.25, -120, 120, 0.01)], { icon: IconArrowsExchange, editor: videoSyncEditor }),
  tool("声音", "video-voice-changer", "改变声音高低", [numeric("pitch", "音高变化（半音）", 3, -12, 12)], { icon: IconMicrophone, presets: [
    { label: "声音高一点", values: { pitch: 3 } }, { label: "声音低一点", values: { pitch: -3 } }, { label: "声音更低", values: { pitch: -6 } },
  ] }),
  tool("剪辑", "remove-silence", "剪掉无声片段", [numeric("db", "静音阈值（dB）", -36, -90, -5), numeric("seconds", "最短静音时长（秒）", 0.5, 0.05, 60, 0.05)], { icon: IconVolumeOff, ...audioVideo, presets: [
    { label: "剪常见停顿", values: { db: -36, seconds: 0.5 } }, { label: "只剪长停顿", values: { db: -48, seconds: 1.2 } }, { label: "连短停顿也剪", values: { db: -36, seconds: 0.25 } },
  ] }),
  tool("生成视频", "audio-waveform-video", "生成音频波形视频", [field("color", "波形颜色", "#76debf", "color")],
    { icon: IconWaveSine, ...imageAttachment, sourceMimeTypes: ["audio/*"], outputs: [{ mimeType: "video/mp4" }], attachmentsRequired: false, attachmentLabel: "选择背景图片（可选）" }),
]);

export const audioSourceTools = soundTools.filter(tool => tool.sourceMimeTypes?.includes("audio/*"));

export const runAudioSourceTool: MediaToolRunner = async (id, context) => {
  const selected = audioSourceTools.find(tool => tool.id === id);
  if (!selected) throw new Error("未知的音频处理工具");
  if (!context.source.mimeType.startsWith("audio/")) throw new Error("请选择音频素材");
  return runSound(id, await prepareJob(selected, context));
};

async function removeSilence(job: VideoJob) {
  const { command, duration, audio, video, n } = job;
  job.reportOutputs?.([{ mimeType: video ? "video/mp4" : "audio/wav" }]);
  const silence: { start: number; end: number }[] = [];
  let start: number | undefined;
  const scan = command().noVideo().audioFilters(`silencedetect=noise=${n("db")}dB:d=${n("seconds")}`)
    .outputOptions("-map", `0:${audio!.index}`).format("null").output(job.file("silence.null"));
  scan.on("stderr", line => {
    const begin = line.match(/silence_start:\s*([0-9.e+-]+)/);
    const finish = line.match(/silence_end:\s*([0-9.e+-]+)/);
    if (begin) start = Math.max(0, Number(begin[1]));
    if (finish && start !== undefined) {
      silence.push({ start, end: Math.min(duration, Number(finish[1])) });
      start = undefined;
    }
  });
  await job.run(scan);
  if (start !== undefined) silence.push({ start, end: duration });
  const keep: { start: number; end: number }[] = [];
  let cursor = 0;
  for (const gap of silence) {
    if (gap.start - cursor > 0.001) keep.push({ start: cursor, end: gap.start });
    cursor = Math.max(cursor, gap.end);
  }
  if (duration - cursor > 0.001) keep.push({ start: cursor, end: duration });
  if (!keep.length) throw new Error("整段素材都低于静音阈值，请降低阈值");
  const graph: string[] = [], maps: string[] = [];
  for (const [i, range] of keep.entries()) {
    const selection = `start=${range.start}:end=${range.end}`;
    if (video) graph.push(`[0:${video.index}]trim=${selection},setpts=PTS-STARTPTS[v${i}]`);
    graph.push(`[0:${audio!.index}]atrim=${selection},asetpts=PTS-STARTPTS[a${i}]`);
    maps.push(`${video ? `[v${i}]` : ""}[a${i}]`);
  }
  graph.push(`${maps.join("")}concat=n=${keep.length}:v=${Number(!!video)}:a=1${video ? "[v]" : ""}[a]`);
  if (video) return job.mp4(command(), graph, "[a]");
  return job.output(command().complexFilter(graph).outputOptions("-map", "[a]").audioCodec("pcm_s16le"), "result.wav", "audio/wav");
}

export async function runSound(id: string, job: VideoJob) {
  const { n, s, command, mp4, duration, audio, attachments } = job;
  if (!audio && id !== "add-audio-to-video" && !(id === "change-volume" && n("volume") === 0)) throw new Error("当前素材没有音轨");
  switch (id) {
    case "change-volume": {
      const gain = n("volume") / 100;
      if (!gain) return mp4(command(), undefined, "");
      const filter = `volume=${gain}` + (gain > 1 ? ",alimiter=limit=0.99:level=0:latency=1" : "");
      return mp4(command().audioFilters(filter));
    }
    case "add-audio-to-video": {
      const cmd = command().input(attachments[0]).inputOptions("-stream_loop", "-1").duration(duration);
      const mix = s("mode") === "mix" && !!audio;
      const gain = n("volume") / 100;
      const limitMusic = !mix && gain > 1 ? ",alimiter=limit=0.99:level=0:latency=1" : "";
      const graph = ["[0:v:0]null[v]", `[1:a:0]volume=${gain}${limitMusic},atrim=duration=${duration}[music]`];
      if (mix) {
        const limitMix = gain > 0 ? ",alimiter=limit=0.97:level=0:latency=1" : "";
        graph.push(`[0:a:0]apad,atrim=duration=${duration}[original]`,
          `[original][music]amix=inputs=2:duration=first:normalize=0${limitMix}[a]`);
      }
      return mp4(cmd, graph, mix ? "[a]" : "[music]");
    }
    case "audio-video-sync": {
      const shift = n("delay");
      if (Math.abs(shift) >= duration) throw new Error("声音偏移量必须小于素材时长");
      const filter = shift >= 0 ? `adelay=${Math.round(shift * 1000)}:all=1` : `atrim=start=${-shift},asetpts=PTS-STARTPTS`;
      return mp4(command().duration(duration).audioFilters(`${filter},apad,atrim=duration=${duration}`));
    }
    case "video-voice-changer": {
      const ratio = 2 ** (n("pitch") / 12);
      return mp4(command().audioFilters(`aresample=48000,asetrate=${Math.round(48000 * ratio)},aresample=48000,${tempo(1 / ratio)}`));
    }
    case "audio-waveform-video": {
      const cmd = command();
      const graph = [];
      if (attachments[0]) {
        cmd.input(attachments[0]).inputOptions("-loop", "1");
        graph.push("[1:v:0]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1[bg]");
      } else graph.push("color=c=0x172028:s=1280x720:r=25[bg]");
      graph.push(`[0:a:0]aformat=channel_layouts=mono,showwaves=s=1280x360:mode=cline:rate=25:draw=full:colors=0x${s("color").slice(1)},format=rgba[wave]`,
        "[bg][wave]overlay=0:(H-h)/2:shortest=1[v]");
      return mp4(cmd.duration(duration), graph, "0:a:0");
    }
    case "remove-silence": return removeSilence(job);
    default: throw new Error("未知的声音处理操作");
  }
}
