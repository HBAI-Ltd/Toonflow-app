import { markMessages } from "@toonflow/i18n/vue";
import videoTimeEditor from "./components/videoTimeEditor.vue";
import videoCadenceEditor from "./components/videoCadenceEditor.vue";
import videoBoomerangEditor from "./components/videoBoomerangEditor.vue";
import { IconArrowsJoin, IconBrightnessHalf, IconGauge, IconMovie, IconPhoto, IconPlayerPause, IconPlayerTrackPrev, IconRepeat, IconScissors } from "@tabler/icons-vue";
import type { MediaToolResult } from "@toonflow/node-shared/mediaTools";
import { choice, durationField, fitSize, imageAttachment, numeric, tempo, timeField, tool, videoAttachment, videoFrameRate, type VideoJob } from "./videoToolJob";

const repeat = numeric("count", "播放次数", 2, 2, 100);
const length = numeric("seconds", "片段时长（秒）", 5, 0.1, 86400, 0.1);
const seconds = numeric("seconds", "过渡时长（秒）", 0.5, 0.05, 120, 0.05);
const direction = choice("mode", "方向", markMessages({ both: "淡入与淡出", in: "淡入", out: "淡出" }));

export const timelineTools = markMessages([
  tool("剪辑", "merge-video", "拼接视频", [], { icon: IconArrowsJoin, ...videoAttachment, multiple: true, attachmentLabel: "按播放顺序添加视频" }),
  tool("变速与循环", "reverse-video", "倒放视频", [choice("sound", "声音", { reverse: "同步倒放", mute: "静音" })], { icon: IconPlayerTrackPrev, menuField: "sound" }),
  tool("变速与循环", "boomerang-video", "正放后倒放", [numeric("start", "开始时间（秒）", 0, 0, 86400, 0.01),
    numeric("end", "结束时间（秒）", 2, 0.01, 86400, 0.01), numeric("speed", "播放倍速", 1, 0.5, 2, 0.25),
    numeric("repeats", "往返次数", 1, 1, 10)], { editor: videoBoomerangEditor, icon: IconRepeat }),
  tool("剪辑", "split-video", "拆分视频", [choice("splitMode", "拆分方式", { count: "按段数均分", duration: "按时长" }), length,
    numeric("parts", "片段数量", 2, 2, 100)], { editor: videoTimeEditor, icon: IconScissors }),
  tool("剪辑", "fade-video", "淡入淡出", [direction, seconds], { editor: videoTimeEditor, icon: IconBrightnessHalf, menuField: direction.key }),
  tool("变速与循环", "speed-video", "调整播放速度", [numeric("speed", "播放倍速", 1.5, 0.25, 4, 0.05)], { editor: videoTimeEditor, icon: IconGauge }),
  tool("变速与循环", "loop-video", "循环播放", [repeat], { editor: videoTimeEditor, icon: IconRepeat }),
  tool("变速与循环", "freeze-video", "定格画面", [timeField, durationField], { editor: videoTimeEditor, icon: IconPlayerPause }),
  tool("变速与循环", "stop-motion", "制作定格动画效果", [numeric("cadence", "每秒保留画面数", 6, 1, 24)], { editor: videoCadenceEditor, icon: IconMovie }),
  tool("剪辑", "add-intro-image-to-video", "插入片头图片", [durationField], { icon: IconPhoto, ...imageAttachment }),
]);

function audioClip(index: number, duration: number, hasAudio: boolean) {
  const input = hasAudio ? `[${index}:a:0]aresample=48000,aformat=channel_layouts=stereo,apad` : "anullsrc=r=48000:cl=stereo";
  return `${input},atrim=duration=${duration},asetpts=PTS-STARTPTS[a${index}]`;
}

async function concatenate(job: VideoJob, intro: boolean) {
  const { command, attachments, duration, n, width, height } = job;
  const cmd = command();
  const rate = videoFrameRate(job.video)?.expression ?? "30";
  const inputs = [{ duration, audio: !!job.audio }];
  for (const path of attachments) {
    cmd.input(path);
    if (intro) {
      cmd.inputOptions("-loop", "1", "-framerate", rate, "-t", String(n("seconds")));
      inputs.push({ duration: n("seconds"), audio: false });
    } else {
      const data = await job.probe(path);
      if (!data.streams.some(s => s.codec_type === "video" && !s.disposition?.attached_pic)) throw new Error("合并列表中存在没有画面的视频");
      const length = Number(data.format.duration);
      if (!Number.isFinite(length) || length <= 0) throw new Error("无法读取待合并视频的时长");
      inputs.push({ duration: length, audio: data.streams.some(s => s.codec_type === "audio") });
    }
  }
  const graph: string[] = [];
  const sound = inputs.some(input => input.audio);
  for (const [index, input] of inputs.entries()) {
    graph.push(`[${index}:v:0]${fitSize(Math.max(2, width - width % 2), Math.max(2, height - height % 2))},fps=${rate},format=yuv420p,setpts=PTS-STARTPTS[v${index}]`);
    if (sound) graph.push(audioClip(index, input.duration, input.audio));
  }
  let order = inputs.map((_, index) => `[v${index}]${sound ? `[a${index}]` : ""}`);
  if (intro) order = order.reverse();
  graph.push(`${order.join("")}concat=n=${inputs.length}:v=1:a=${Number(sound)}[v]${sound ? "[a]" : ""}`);
  return job.mp4(cmd, graph, sound ? "[a]" : "");
}

async function splitClips(job: VideoJob) {
  const results: MediaToolResult[] = [];
  const equalParts = job.s("splitMode") === "count";
  const seconds = equalParts ? job.duration / job.n("parts") : job.n("seconds");
  const count = equalParts ? job.n("parts") : Math.ceil(job.duration / seconds);
  const frameCount = Number(job.video?.nb_frames);
  if (Number.isFinite(frameCount) && frameCount > 0 && count > frameCount) throw new Error("片段数量超过源视频帧数，请减少段数或增加每段时长");
  const clips = [];
  for (let i = 0; i < count; i++) {
    const start = i * seconds, end = Math.min(job.duration, (i + 1) * seconds);
    if (end - start <= 0.001) continue;
    clips.push({ start, length: end - start, mimeType: "video/mp4", label: `片段 ${i + 1}（${start.toFixed(2)}–${end.toFixed(2)} 秒）` });
  }
  job.reportOutputs?.(clips);
  for (const [i, clip] of clips.entries()) {
    const name = `clip${String(i + 1).padStart(3, "0")}.mp4`;
    // 按源时间戳划分半开区间，防止相邻片段在非整帧边界重复一帧。
    const range = `start=${clip.start}:end=${clip.start + clip.length}`;
    const graph = [`[0:${job.video!.index}]trim=${range},setpts=PTS-STARTPTS[v]`];
    if (job.audio) graph.push(`[0:${job.audio.index}]atrim=${range},asetpts=PTS-STARTPTS[a]`);
    const cmd = job.command().seekInput(clip.start).inputOptions("-copyts", "-start_at_zero").outputOptions("-fps_mode:v", "passthrough");
    const [result] = await job.mp4(cmd, graph, job.audio ? "[a]" : "", name);
    results.push({ ...result, label: clip.label });
  }
  return results;
}

export async function runTimeline(id: string, job: VideoJob) {
  const { n, s, duration, filter, mp4, command, audio } = job;
  switch (id) {
    case "merge-video":
    case "add-intro-image-to-video":
      return concatenate(job, id === "add-intro-image-to-video");
    case "reverse-video":
      return mp4(command(), ["[0:v:0]reverse[v]", ...(audio && s("sound") === "reverse" ? ["[0:a:0]areverse[a]"] : [])], audio && s("sound") === "reverse" ? "[a]" : "");
    case "boomerang-video": {
      const from = n("start"), to = Math.min(duration, n("end")), repeats = n("repeats");
      const length = to - from;
      if (from >= duration || length <= 0 || length > 10.001) throw new Error("请选择视频内最长 10 秒的片段");
      const frames = Math.round(length * 24 / n("speed"));
      if (frames < 1) throw new Error("选区太短，请延长片段或降低播放倍速");
      const graph = [`[0:${job.video!.index}]trim=duration=${length},setpts=(PTS-STARTPTS)/${n("speed")},fps=24:round=up,split[f][r]`,
        "[r]reverse,setpts=PTS-STARTPTS[b]", "[f][b]concat=n=2:v=1:a=0[v]"];
      const cycle = await mp4(command().seekInput(from), graph, "", repeats === 1 ? "result.mp4" : "cycle.mp4");
      if (repeats === 1) return cycle;
      const loop = command(cycle[0]!.path).inputOptions("-stream_loop", String(repeats - 1)).noAudio().videoCodec("copy")
        .outputOptions("-map", "0:v:0", "-movflags", "+faststart");
      return job.output(loop, "result.mp4", "video/mp4");
    }
    case "split-video": return splitClips(job);
    case "stop-motion":
      return mp4(command().duration(duration), [`[0:${job.video!.index}]setpts=PTS-STARTPTS,fps=${n("cadence")}:round=up,tpad=stop_mode=clone:stop_duration=1,fps=24[v]`]);
    case "fade-video": {
      const both = s("mode") === "both";
      const len = Math.min(n("seconds"), duration / (both ? 2 : 1));
      const fades = [];
      if (both || s("mode") === "in") fades.push(`fade=t=in:st=0:d=${len}`);
      if (both || s("mode") === "out") fades.push(`fade=t=out:st=${duration - len}:d=${len}`);
      return filter(fades.join(","), fades.map(f => `a${f}`).join(","));
    }
    case "speed-video": {
      const speed = n("speed");
      const cmd = command().duration(duration / speed);
      if (audio) cmd.audioFilters(tempo(speed));
      return mp4(cmd, [`[0:v:0]setpts=(PTS-STARTPTS)/${speed}[v]`]);
    }
    case "loop-video":
      return mp4(command().inputOptions("-stream_loop", String(n("count") - 1)).duration(duration * n("count")));
    case "freeze-video": {
      const at = n("start"), hold = n("seconds");
      if (at >= duration) throw new Error("定格时间点必须在视频内");
      const graph = at === 0 ? [`[0:v:0]tpad=start_mode=clone:start_duration=${hold}[v]`] : [
        `[0:v:0]trim=end=${at},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=${hold}[head]`,
        `[0:v:0]trim=start=${at},setpts=PTS-STARTPTS[tail]`, "[head][tail]concat=n=2:v=1:a=0[v]"];
      if (audio) {
        graph.push(`anullsrc=r=48000:cl=stereo,atrim=duration=${hold}[pause]`, `[0:a:0]atrim=start=${at},asetpts=PTS-STARTPTS[after]`);
        if (at > 0) graph.push(`[0:a:0]atrim=end=${at},asetpts=PTS-STARTPTS[before]`);
        graph.push(`${at > 0 ? "[before]" : ""}[pause][after]concat=n=${at > 0 ? 3 : 2}:v=0:a=1[a]`);
      }
      return mp4(command(), graph, audio ? "[a]" : "");
    }
    default: throw new Error("未知的时间线操作");
  }
}
