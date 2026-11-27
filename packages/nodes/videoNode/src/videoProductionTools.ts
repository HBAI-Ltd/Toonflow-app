import { markMessages } from "@toonflow/i18n/vue";
import { IconClockEdit, IconEraser, IconFocus2, IconMovie, IconRepeat, IconSubtitles, IconWand } from "@tabler/icons-vue";
import type { MediaTool } from "@toonflow/node-shared/mediaTools";
import { maskRegion, patchFeather, subtitleRegion } from "./videoRegion";
import { numeric, tool, type VideoJob } from "./videoToolJob";
import videoRegionEditor from "./components/videoRegionEditor.vue";
import productionTimeEditor from "./components/productionTimeEditor.vue";
import subtitleAlignEditor from "./components/subtitleAlignEditor.vue";
import { readSubtitleCues, timestamp } from "./videoSubtitleTiming";

const area = (x: number, y: number, w: number, h: number) => [numeric("x", "左边界", x, 0, 99.99, .01), numeric("y", "上边界", y, 0, 99.99, .01),
  numeric("width", "宽度", w, .01, 100, .01), numeric("height", "高度", h, .01, 100, .01)];
const subtitleArea = area(subtitleRegion.x, subtitleRegion.y, subtitleRegion.width, subtitleRegion.height), targetArea = area(30, 25, 40, 50);
const at = (key: string, label: string, value: number) => numeric(key, label, value, -1, 86400, .0001);
const reference = at("referenceTime", "干净参考帧", -1);
const vtt = [{ mimeType: "text/vtt", label: "可编辑字幕" }];
export const productionModelTools: MediaTool[] = markMessages([
  tool("字幕", "restoreSubtitles", "擦除字幕", subtitleArea, { icon: IconEraser, modelId: "ppOcrV5Det", additionalModelIds: ["migan"], editor: videoRegionEditor }),
  tool("字幕", "readSubtitles", "提取字幕", subtitleArea, { icon: IconSubtitles, modelId: "ppOcrV5Rec", editor: videoRegionEditor, outputs: vtt }),
  tool("打码与修复", "trackTarget", "跟踪打码", targetArea, { icon: IconFocus2, modelId: "vitTrack", editor: videoRegionEditor }),
  tool("打码与修复", "repairBadFrame", "修复一帧坏画面", [at("time", "损坏画面", -1)], { icon: IconMovie, modelId: "rife", editor: productionTimeEditor }),
]);

export const productionVideoTools: MediaTool[] = markMessages([
  tool("字幕", "cleanPlate", "用背景盖住字幕", [...subtitleArea, reference], { editor: videoRegionEditor, icon: IconEraser }),
  tool("打码与修复", "patchGoodFrame", "用另一帧修补画面", [...targetArea, reference, at("start", "修补起点", 0), at("end", "修补终点", 1)], { editor: videoRegionEditor, icon: IconWand }),
  tool("变速与循环", "blendLoop", "让首尾循环更自然", [numeric("seconds", "接缝过渡时长", .4, .05, 5, .01)], { editor: productionTimeEditor, icon: IconRepeat }),
  tool("人物与背景", "cleanBackground", "提取固定镜头背景图", [], { icon: IconFocus2, outputs: [{ mimeType: "image/png", label: "干净背景" }] }),
  tool("画质与调色", "deflicker", "减少画面闪烁", [numeric("frames", "减少闪烁的力度", 5, 2, 31)], { editor: productionTimeEditor, icon: IconWand }),
  tool("字幕", "alignSubtitleTiming", "对齐字幕时间", [at("sourceA", "字幕锚点一", -1), at("targetA", "视频锚点一", -1),
    at("sourceB", "字幕锚点二", -1), at("targetB", "视频锚点二", -1)], { editor: subtitleAlignEditor, icon: IconClockEdit, outputs: vtt,
    accept: ".srt,.vtt", attachmentLabel: "选择字幕文件（SRT 或 VTT）" }),
]);

export async function runProductionTool(id: string, job: VideoJob) {
  if (id === "deflicker") return job.filter("deflicker=size=" + job.n("frames") + ":mode=am");
  if (id === "cleanBackground") {
    const cmd = job.command().noAudio().videoFilters(`setpts=PTS-STARTPTS,fps=9/${job.duration}:eof_action=pass,tpad=stop_mode=clone:stop=9,tmedian=radius=4`).outputOptions("-frames:v", "1");
    return job.output(cmd, "background.png", "image/png");
  }
  if (id === "alignSubtitleTiming") {
    const bytes = await job.workspace.read(job.attachments[0]!);
    if (bytes.byteLength > 8 * 1024 * 1024) throw new Error("字幕文件不能超过 8 MB");
    const cues = readSubtitleCues(new TextDecoder().decode(bytes));
    const a = job.n("sourceA"), b = job.n("sourceB"), ta = job.n("targetA"), tb = job.n("targetB");
    if (a < 0 || ta < 0 || ta >= job.duration || (b >= 0 || tb >= 0) && (b <= a || tb <= ta || tb >= job.duration)) throw new Error("请按对白顺序对齐，第二句应在第一句之后。");
    const slope = b < 0 ? 1 : (tb - ta) / (b - a);
    const corrected = cues.flatMap(cue => {
      const start = Math.max(0, (cue.start - a) * slope + ta), end = Math.min(job.duration, (cue.end - a) * slope + ta);
      if (Math.round(end * 1000) <= Math.round(start * 1000)) return [];
      return timestamp(start) + " --> " + timestamp(end) + cue.settings + "\n" + cue.text;
    });
    if (!corrected.length) throw new Error("校时后的字幕全部在视频时长之外");
    const path = job.file("calibrated.vtt");
    await job.workspace.write(path, "WEBVTT\n\n" + corrected.join("\n\n") + "\n", true);
    return [{ path, mimeType: "text/vtt", label: "已对齐的字幕" }];
  }
  if (id === "blendLoop") {
    const k = job.n("seconds"), d = job.duration;
    if (2 * k >= d) throw new Error("过渡时长必须小于片段时长的一半");
    const graph = [`[0:v]trim=start=${d-k},setpts=PTS-STARTPTS[tail]`, `[0:v]trim=end=${k},setpts=PTS-STARTPTS[head]`,
      `[tail][head]xfade=duration=${k}:offset=0[seam]`, `[0:v]trim=start=${k}:end=${d-k},setpts=PTS-STARTPTS[body]`, "[seam][body]concat=n=2:v=1:a=0[v]"];
    if (job.audio) graph.push(`[0:a]atrim=start=${d-k},asetpts=PTS-STARTPTS[at]`, `[0:a]atrim=end=${k},asetpts=PTS-STARTPTS[ah]`,
      `[at][ah]acrossfade=d=${k}[as]`, `[0:a]atrim=start=${k}:end=${d-k},asetpts=PTS-STARTPTS[ab]`, "[as][ab]concat=n=2:v=0:a=1[a]");
    return job.mp4(job.command(), graph, job.audio ? "[a]" : "");
  }
  const time = job.n("referenceTime"), start = id === "patchGoodFrame" ? job.n("start") : 0, end = id === "patchGoodFrame" ? job.n("end") : job.duration;
  if (time < 0 || time >= job.duration || start < 0 || end > job.duration + .001 || end <= start) throw new Error("请在有效视频时长内选择参考帧和修补区间");
  const box = maskRegion(job.width, job.height, { x: job.n("x"), y: job.n("y"), width: job.n("width"), height: job.n("height") }, 0);
  if (box.w < 2 || box.h < 2) throw new Error("修补选区过小");
  const edge = patchFeather(job.width, job.height, box);
  const ramps = [[edge.left, "X+0.5"], [edge.right, "W-X-0.5"], [edge.top, "Y+0.5"], [edge.bottom, "H-Y-0.5"]] as const;
  const alpha = ramps.filter(([distance]) => distance > 0).map(([distance, position]) => `*min(1,(${position})/${distance})`).join("");
  // 参考画面只解码一帧。只在与原画相接的边缘渐变，贴到视频边缘的内容仍能完整盖住。
  const feather = alpha ? `,format=yuva444p,geq=lum='lum(X,Y)':cb='cb(X,Y)':cr='cr(X,Y)':a='255${alpha}':i=nearest` : "";
  const cmd = job.command().input(job.source).seekInput(time);
  return job.mp4(cmd, [`[1:v]trim=end_frame=1,setpts=PTS-STARTPTS,crop=${box.w}:${box.h}:${box.x}:${box.y}${feather}[patch]`,
    `[0:v][patch]overlay=${box.x}:${box.y}:eof_action=repeat:enable='between(t,${start},${end})'[v]`]);
}
