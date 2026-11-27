import { IconAdjustments, IconArrowsJoin, IconArrowBackUp, IconChartBar, IconEar, IconFilter, IconGauge, IconMicrophone, IconMusic, IconRepeat, IconScissors, IconVolume, IconWaveSine } from "@tabler/icons-vue";
import type { BrowserFfmpegFactory } from "@toonflow/ffmpeg/browser";
import { markMessages } from "@toonflow/i18n/vue";
import { runCommand } from "@toonflow/node-shared/mediaCommands";
import type { MediaTool, ToolField } from "@toonflow/node-shared/mediaTools";
import type { PcmOptions } from "@toonflow/node-shared/pcmPreview";
import { audioDuration, audioInputOptions, normalizePath, probeAudio, tempoFilter } from "./audioProcessing";

function control(key: string, label: string, value: number, min: number, max: number, step = 1): ToolField {
  return { key, label, value, min, max, step, type: "number" };
}

export const audioGroups = markMessages({ timeline: "音频剪辑", voice: "人声与字幕", repair: "降噪", mix: "音量与配乐", tone: "变声与音效" });
const { timeline, voice, repair, mix, tone } = audioGroups;
export const clipTool: MediaTool = { id: "audioClip", label: "剪辑音频", group: timeline, icon: IconScissors,
  fields: [{ type: "text", key: "segments", label: "保留片段", value: "" }] };
export const splitTool: MediaTool = { id: "audioSplit", label: "拆分音频", group: timeline, icon: IconScissors,
  fields: [{ type: "text", key: "cuts", label: "切点", value: "[]" }] };
export const speedTool: MediaTool = { id: "audioSpeed", label: "调整播放速度", group: timeline, icon: IconGauge,
  fields: [control("speed", "播放速度（倍）", 1.25, 0.1, 4, 0.05)] };
export const audioEffects = markMessages<MediaTool[]>([
  splitTool,
  { id: "audioMerge", label: "拼接音频", group: timeline, icon: IconArrowsJoin, accept: "audio/*", multiple: true, attachmentLabel: "拼接顺序" },
  { id: "audioLoop", label: "循环播放", group: timeline, icon: IconRepeat, fields: [control("count", "总播放次数", 2, 2, 20)] },
  { id: "audioReverse", label: "倒放音频", group: timeline, icon: IconArrowBackUp },
  { id: "replaceDialogue", label: "替换一段对白", group: voice, icon: IconMicrophone, accept: "audio/*", attachmentLabel: "选择补录音频",
    fields: [control("start", "替换起点（秒）", 0, 0, 86400, 0.01), control("end", "替换终点（秒）", 1, 0.01, 86400, 0.01)] },
  { id: "audioDenoise", label: "减轻背景噪声", group: repair, icon: IconEar, fields: [control("reduction", "降噪强度（dB）", 12, 1, 40)] },
  { id: "audioFilter", label: "减轻嗡嗡声和嘶嘶声", group: repair, icon: IconFilter, fields: [
    control("low", "低于此频率逐渐衰减（Hz）", 120, 20, 1000, 5), control("high", "高于此频率逐渐衰减（Hz）", 6500, 1500, 20000, 100),
  ] },
  { id: "audioGain", label: "调整音量", group: mix, icon: IconVolume, fields: [control("gain", "音量增益（dB）", 3, -36, 18, 0.5)] },
  { id: "audioNormalize", label: "统一整段音量", group: mix, icon: IconChartBar, fields: [
    control("loudness", "目标响度（LUFS）", -16, -30, -9, 0.5), control("peak", "真峰值上限（dBTP）", -1.5, -6, 0, 0.1),
  ] },
  { id: "audioCompress", label: "压低过响的声音", group: mix, icon: IconWaveSine, fields: [
    control("threshold", "压缩起点（dB）", -18, -48, -3), control("ratio", "压缩比（比 1）", 3, 1, 12, 0.5),
  ] },
  { id: "audioFade", label: "声音淡入淡出", group: mix, icon: IconVolume, fields: [
    control("fadeIn", "淡入时长（秒）", 0.2, 0, 15, 0.05), control("fadeOut", "淡出时长（秒）", 0.5, 0, 15, 0.05),
  ] },
  { id: "duckMusic", label: "说话时压低配乐", group: mix, icon: IconMusic, accept: "audio/*", attachmentLabel: "选择背景音乐",
    fields: [control("bed", "背景音乐音量（dB）", -10, -36, 0, 1), control("threshold", "对白触发阈值（dB）", -25, -48, -6, 1),
      control("release", "对白间隙恢复时间（毫秒）", 500, 100, 2000, 50)] },
  { id: "audioEqualize", label: "调节低中高音", group: tone, icon: IconAdjustments, fields: [
    control("bass", "低音（dB）", 0, -12, 12, 0.5), control("mid", "中音（dB）", 2, -12, 12, 0.5), control("treble", "高音（dB）", 0, -12, 12, 0.5),
  ] },
  { id: "audioPitch", label: "升调或降调", group: tone, icon: IconMicrophone, fields: [control("pitch", "音高变化（半音）", 2, -12, 12)] },
  { id: "audioReverb", label: "添加空间回响", group: tone, icon: IconMusic, fields: [
    control("room", "房间反射延时（毫秒）", 35, 10, 100), control("wet", "混响量（%）", 25, 0, 70),
  ] },
]);

type RenderOptions = {
  tool: MediaTool;
  values: Record<string, string | number>;
  source: string;
  target: string;
  pcm?: PcmOptions;
  attachments?: string[];
  previewStart?: number;
  signal: AbortSignal;
  reportProgress?: (completed: number, total: number) => void;
};

export async function renderAudioEffect(ffmpeg: BrowserFfmpegFactory, options: RenderOptions) {
  const { tool, values, source, target, signal } = options;
  if (normalizePath(source) === normalizePath(target)) throw new Error("输出文件不能覆盖原音频");
  const params: Record<string, number> = {};
  for (const field of tool.fields ?? []) {
    const raw = values[field.key] ?? field.value;
    const value = Number(raw);
    if (raw === "" || !Number.isFinite(value) || value < field.min! || value > field.max! || (field.step === 1 && !Number.isInteger(value))) {
      throw new Error(`请检查「${field.label}」的数值`);
    }
    params[field.key] = value;
  }
  const inputOptions = audioInputOptions(options.pcm);
  const probe = await probeAudio(ffmpeg, source, signal, inputOptions);
  const duration = audioDuration(probe);
  const input = () => {
    const command = ffmpeg(source);
    if (inputOptions.length) command.inputOptions(inputOptions);
    return command.noVideo();
  };
  const command = input();
  let outputDuration = duration;
  let mapped = false;
  let filters: string[] = [];
  switch (tool.id) {
    case "replaceDialogue": {
      const replacement = options.attachments?.[0];
      if (!replacement) throw new Error("请选择补录音频");
      normalizePath(replacement);
      const { start, end } = params;
      if (start >= end || end > duration + 0.001) throw new Error("请在原声音频内选择替换范围");
      const span = end - start, recorded = audioDuration(await probeAudio(ffmpeg, replacement, signal));
      const speed = recorded / span;
      if (speed < 0.5 || speed > 2) throw new Error("补录时长与选区相差超过两倍，请调整选区或裁剪补录音频");
      const layout = "aresample=48000,aformat=channel_layouts=stereo";
      const graph = [`[1:a:0]${layout},${tempoFilter(speed)},apad,atrim=duration=${span},asetpts=PTS-STARTPTS[voice]`];
      const parts = ["[voice]"];
      if (start > 0) { graph.push(`[0:a:0]atrim=end=${start},asetpts=PTS-STARTPTS,${layout}[before]`); parts.unshift("[before]"); }
      if (end < duration) { graph.push(`[0:a:0]atrim=start=${end},asetpts=PTS-STARTPTS,${layout}[after]`); parts.push("[after]"); }
      graph.push(`${parts.join("")}concat=n=${parts.length}:v=0:a=1[mix]`);
      command.input(replacement).complexFilter(graph).outputOptions("-map", "[mix]");
      mapped = true;
      break;
    }
    case "duckMusic": {
      const music = options.attachments?.[0];
      if (!music) throw new Error("请选择背景音乐");
      normalizePath(music);
      const musicDuration = audioDuration(await probeAudio(ffmpeg, music, signal));
      command.input(music).inputOptions("-stream_loop", String(Math.max(0, Math.ceil(duration / musicDuration) - 1))).complexFilter([
        "[0:a:0]aresample=48000,aformat=channel_layouts=stereo,asetpts=PTS-STARTPTS,asplit=2[dialogue][trigger]",
        `[1:a:0]aresample=48000,aformat=channel_layouts=stereo,asetpts=PTS-STARTPTS,atrim=duration=${duration},volume=${params.bed}dB[music]`,
        `[music][trigger]sidechaincompress=threshold=${10 ** (params.threshold / 20)}:ratio=8:attack=15:release=${params.release}[ducked]`,
        "[dialogue][ducked]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.97:level=0:latency=1[mix]",
      ]).outputOptions("-map", "[mix]");
      mapped = true;
      break;
    }
    case "audioDenoise": filters = [`afftdn=nr=${params.reduction}:nf=-40:tn=1`]; break;
    case "audioGain": filters = [`volume=${params.gain}dB`]; break;
    case "audioFilter": filters = [`highpass=f=${params.low}`, `lowpass=f=${params.high}`]; break;
    case "audioEqualize": filters = [`bass=f=200:g=${params.bass}`, `equalizer=f=1500:t=o:w=1:g=${params.mid}`, `treble=f=5000:g=${params.treble}`]; break;
    case "audioCompress": filters = [`acompressor=threshold=${10 ** (params.threshold / 20)}:ratio=${params.ratio}:attack=10:release=120`]; break;
    case "audioNormalize": {
      let filter = `loudnorm=I=${params.loudness}:TP=${params.peak}:LRA=11`;
      const measured: Record<string, number> = {};
      const scan = input().outputOptions("-map", "0:a:0").audioFilters(filter + ":print_format=json").format("null").output(target + ".measure");
      scan.on("stderr", line => {
        for (const match of line.matchAll(/"(input_i|input_tp|input_lra|input_thresh|target_offset)"\s*:\s*"([^"]+)"/g)) measured[match[1]!] = Number(match[2]);
      });
      await runCommand(scan, signal);
      if (["input_i", "input_tp", "input_lra", "input_thresh", "target_offset"].every(key => Number.isFinite(measured[key]))) {
        filter += `:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true`;
      }
      filters = [filter];
      break;
    }
    case "audioReverb": {
      const wet = params.wet / 100;
      const delays = [1, 1.8, 2.9, 4.5].map(times => Math.round(params.room * times));
      const decays = [0.48, 0.3, 0.18, 0.1].map(level => level * wet);
      if (wet) {
        filters = [`aecho=1:${1 / (1 + wet)}:${delays.join("|")}:${decays.join("|")}`];
        outputDuration += delays[3]! / 1000;
      }
      break;
    }
    case "audioPitch": {
      const ratio = 2 ** (params.pitch / 12);
      filters = ["aresample=48000", `asetrate=${Math.round(48000 * ratio)}`, "aresample=48000", tempoFilter(1 / ratio)];
      break;
    }
    case "audioSpeed": filters = [tempoFilter(params.speed)]; outputDuration = duration / params.speed; break;
    case "audioFade": {
      if (params.fadeIn + params.fadeOut > duration + 0.001) throw new Error("淡入和淡出时长之和不能超过音频时长");
      if (params.fadeIn) filters.push(`afade=t=in:d=${params.fadeIn}`);
      if (params.fadeOut) filters.push(`afade=t=out:st=${Math.max(0, duration - params.fadeOut)}:d=${params.fadeOut}`);
      break;
    }
    case "audioLoop":
      command.inputOptions("-stream_loop", String(params.count - 1));
      outputDuration = duration * params.count;
      break;
    case "audioReverse": filters = ["areverse"]; break;
    case "audioMerge": {
      const more = options.attachments ?? [];
      if (!more.length || more.length > 63) throw new Error("请添加 1 至 63 条后续音频");
      for (const path of more) {
        normalizePath(path);
        outputDuration += audioDuration(await probeAudio(ffmpeg, path, signal));
        command.input(path);
      }
      const tracks = [source, ...more].map((_, i) => `[${i}:a:0]aresample=48000,aformat=channel_layouts=stereo,asetpts=PTS-STARTPTS[a${i}]`);
      tracks.push(`${[source, ...more].map((_, i) => `[a${i}]`).join("")}concat=n=${tracks.length}:v=0:a=1[mix]`);
      command.complexFilter(tracks).outputOptions("-map", "[mix]");
      mapped = true;
      break;
    }
    default: throw new Error("未知的音频效果");
  }
  if (tool.id === "audioFilter" || tool.id === "audioEqualize" || tool.id === "audioGain") {
    // 在浮点输出采样率下处理，避免窄带录音的滤波频率越界，或多段增益中途削顶。
    filters.unshift("aresample=48000:osf=fltp");
    if (params.gain > 0 || params.bass > 0 || params.mid > 0 || params.treble > 0) {
      filters.push("alimiter=limit=0.99:level=0:latency=1");
    }
  }
  if (!mapped) command.outputOptions("-map", "0:a:0");
  if (filters.length) command.audioFilters(filters);
  if (options.previewStart !== undefined) {
    const start = Math.min(Math.max(0, options.previewStart), Math.max(0, outputDuration - 0.25));
    command.seekOutput(start).duration(Math.min(8, outputDuration - start));
  }
  command.audioCodec("pcm_s16le").audioFrequency(48000).format("wav").output(target);
  command.on("progress", event => {
    const [h, m, s] = event.timemark.split(":").map(Number);
    const seconds = h * 3600 + m * 60 + s;
    if (Number.isFinite(seconds)) options.reportProgress?.(seconds, outputDuration);
  });
  await runCommand(command, signal);
}
