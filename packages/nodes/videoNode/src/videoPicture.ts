import { markMessages } from "@toonflow/i18n/vue";
import videoRegionEditor from "./components/videoRegionEditor.vue";
import videoColorEditor from "./components/videoColorEditor.vue";
import videoChromaEditor from "./components/videoChromaEditor.vue";
import videoTransformEditor from "./components/videoTransformEditor.vue";
import videoOverlayEditor from "./components/videoOverlayEditor.vue";
import videoSubtitleEditor from "./components/videoSubtitleEditor.vue";
import { IconArrowsDiagonal, IconBlur, IconCameraCheck, IconColorFilter, IconColorPicker, IconCrop, IconEraser, IconLayoutColumns, IconPhotoPlus, IconPictureInPicture, IconRotateClockwise2, IconSubtitles, IconTypography } from "@tabler/icons-vue";
import { choice, field, fitSize, imageAttachment, numeric, tool, videoAttachment, type VideoJob } from "./videoToolJob";
import { cropSize, maskRegion } from "./videoRegion";
import { drawOverlayText, overlayPosition, subtitleFileName } from "./videoOverlay";

const placement = [
  choice("position", "位置", { bottomRight: "右下", bottomLeft: "左下", topRight: "右上", topLeft: "左上", center: "居中", custom: "自由位置" }),
  numeric("positionX", "水平位置（%）", 50, 0, 100, 0.01), numeric("positionY", "垂直位置（%）", 50, 0, 100, 0.01),
];
const scale = numeric("scale", "叠加宽度（画面占比 %）", 25, 5, 100);
const region = [numeric("x", "左边距（%）", 10, 0, 99, 0.01), numeric("y", "上边距（%）", 10, 0, 99, 0.01),
  numeric("width", "区域宽度（%）", 25, 1, 100, 0.01), numeric("height", "区域高度（%）", 20, 1, 100, 0.01)];
const ratios = markMessages({ "16/9": "16:9 横屏", "9/16": "9:16 竖屏", "1/1": "1:1 方形", "4/3": "4:3 标准" });

export const pictureTools = markMessages([
  tool("打码与修复", "pixelate-video", "局部打码", [choice("effect", "遮挡方式", { mosaic: "马赛克", blur: "模糊" }), ...region, numeric("strength", "遮挡强度（像素）", 12, 2, 96)], { editor: videoRegionEditor, icon: IconBlur, menuField: "effect" }),
  tool("画质与调色", "video-stabilizer", "视频防抖", [choice("range", "抖动幅度", { normal: "标准", large: "较大" })], { icon: IconCameraCheck, menuField: "range" }),
  tool("裁剪与尺寸", "rotate-video", "旋转与翻转", [choice("angle", "旋转角度", { right: "顺时针 90°", none: "保持原角度", left: "逆时针 90°", half: "180°" }),
    choice("axis", "旋转后翻转", { none: "不翻转", h: "水平", v: "垂直", both: "水平和垂直" })], { editor: videoTransformEditor, icon: IconRotateClockwise2, menuPresets: [
    { label: "顺时针 90°", values: { angle: "right", axis: "none" } },
    { label: "逆时针 90°", values: { angle: "left", axis: "none" } },
    { label: "旋转 180°", values: { angle: "half", axis: "none" } },
    { label: "水平翻转", values: { angle: "none", axis: "h" } },
    { label: "垂直翻转", values: { angle: "none", axis: "v" } },
    { label: "手动调整", values: {} },
  ] }),
  tool("裁剪与尺寸", "resize-video", "调整画面尺寸", [numeric("width", "输出宽度（像素）", 1280, 2, 8192), numeric("height", "输出高度（像素）", 720, 2, 8192)], { editor: videoTransformEditor, icon: IconArrowsDiagonal }),
  tool("画质与调色", "adjust-video", "画面调色", [numeric("brightness", "亮度", 0, -1, 1, 0.05), numeric("contrast", "对比度", 1, 0, 3, 0.05),
    numeric("saturation", "饱和度", 1, 0, 3, 0.05), numeric("temperature", "冷暖", 0, -1, 1, 0.05), numeric("sharpness", "锐化", 0, 0, 3, 0.1)], { editor: videoColorEditor, icon: IconColorFilter }),
  tool("裁剪与尺寸", "crop-video", "裁剪画面", [choice("ratio", "裁剪比例", ratios), numeric("x", "水平对齐（%）", 50, 0, 100, 0.01), numeric("y", "垂直对齐（%）", 50, 0, 100, 0.01),
    numeric("scale", "裁剪范围（%）", 100, 1, 100, 0.01)], { editor: videoRegionEditor, icon: IconCrop, menuField: "ratio" }),
  tool("人物与背景", "green-screen-editor", "绿幕换背景", [field("key", "要去掉的颜色", "#00ff00", "color"), numeric("similarity", "去除相近颜色的范围", 0.16, 0.01, 1, 0.01),
    field("background", "背景颜色", "#222222", "color"), numeric("despill", "减轻边缘绿光", 0, 0, 1, .01)], { editor: videoChromaEditor, icon: IconColorPicker, ...imageAttachment, attachmentsRequired: false, attachmentLabel: "选择背景图（可选）" }),
  tool("打码与修复", "remove-video-watermark", "擦除固定水印", region, { editor: videoRegionEditor, icon: IconEraser }),
  tool("文字与画面叠加", "split-screen-video", "两个视频同屏播放", [choice("layout", "排列方向", { horizontal: "左右", vertical: "上下" })], { editor: videoOverlayEditor, icon: IconLayoutColumns, ...videoAttachment, menuField: "layout" }),
  tool("字幕", "add-subtitles", "添加字幕", [], { editor: videoSubtitleEditor, icon: IconSubtitles, accept: ".srt,.vtt,.ass,.ssa", attachmentLabel: "选择字幕文件" }),
  tool("文字与画面叠加", "add-text-to-video", "添加文字", [field("text", "文字内容", "", "textarea"), numeric("size", "字号（像素）", 48, 8, 300),
    field("color", "文字颜色", "#ffffff", "color"), ...placement], { editor: videoOverlayEditor, icon: IconTypography }),
  tool("文字与画面叠加", "add-photo-to-video", "添加图片", [scale, ...placement], { editor: videoOverlayEditor, icon: IconPhotoPlus, ...imageAttachment }),
  tool("文字与画面叠加", "picture-in-picture", "制作画中画", [scale, ...placement, choice("audio", "声音", { source: "原视频", mix: "混合两路声音" })], { editor: videoOverlayEditor, icon: IconPictureInPicture, ...videoAttachment }),
]);

async function renderText(job: VideoJob) {
  const text = job.s("text");
  if (!text) throw new Error("请输入要叠加的文字");
  const canvas = document.createElement("canvas");
  drawOverlayText(canvas, text, job.n("size"), job.s("color"), job.width, job.height);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("无法生成文字图层"))));
  const path = job.file("text.png");
  await job.workspace.write(path, blob, true);
  return path;
}

async function combine(id: string, job: VideoJob) {
  const { command, attachments, n, s, width, height, audio } = job;
  const pip = id === "picture-in-picture", split = id === "split-screen-video", text = id === "add-text-to-video";
  const path = text ? await renderText(job) : attachments[0];
  const cmd = command().input(path);
  let graph: string[];
  if (split) {
    const fit = fitSize(Math.max(2, width - width % 2), Math.max(2, height - height % 2));
    graph = [`[0:v:0]${fit},setpts=PTS-STARTPTS[left]`, `[1:v:0]${fit},setpts=PTS-STARTPTS[right]`,
      `[left][right]${s("layout") === "horizontal" ? "hstack" : "vstack"}=shortest=1[v]`];
    cmd.outputOptions("-shortest");
  } else {
    const scale = text ? "" : `scale=${Math.max(2, 2 * Math.floor(width * n("scale") / 200))}:-2,`;
    graph = [`[1:v:0]${scale}format=rgba[layer]`,
      `[0:v:0][layer]overlay=${overlayPosition(s("position"), n("positionX"), n("positionY"))}:eof_action=${pip ? "pass" : "repeat"}[v]`];
  }
  let audioMap = "0:a:0?";
  if (split || (pip && s("audio") === "mix")) {
    const otherAudio = (await job.probe(path)).streams.some(s => s.codec_type === "audio");
    if (otherAudio && audio) {
      graph.push(`[0:a:0][1:a:0]amix=inputs=2:duration=${split ? "shortest" : "first"}[sound]`);
      audioMap = "[sound]";
    } else if (otherAudio) audioMap = "1:a:0";
  }
  cmd.duration(job.duration);
  const result = await job.mp4(cmd, graph, audioMap);
  if (text) await job.workspace.remove(path);
  return result;
}

export async function runPicture(id: string, job: VideoJob) {
  const { s, n, width, height, filter, command, mp4 } = job;
  switch (id) {
    case "pixelate-video":
    case "remove-video-watermark": {
      const { x, y, w, h } = maskRegion(width, height, { x: n("x"), y: n("y"), width: n("width"), height: n("height") }, id === "remove-video-watermark" ? 2 : 0);
      if (w < 2 || h < 2) throw new Error("所选区域太小，请调整位置或大小");
      if (id === "remove-video-watermark") return filter(`delogo=x=${x}:y=${y}:w=${w}:h=${h}`);
      const strength = n("strength");
      const effect = s("effect") === "blur" ? `gblur=sigma=${strength}`
        : `scale=${Math.max(1, Math.floor(w / strength))}:${Math.max(1, Math.floor(h / strength))}:flags=area,scale=${w}:${h}:flags=neighbor`;
      return mp4(command(), ["[0:v:0]split[base][region]", `[region]crop=${w}:${h}:${x}:${y},${effect}[patch]`, `[base][patch]overlay=${x}:${y}[v]`]);
    }
    case "video-stabilizer": {
      const range = Math.min(s("range") === "large" ? 32 : 16, 16 * Math.floor(Math.min(width, height) / 64));
      if (!range) throw new Error("视频边长过小，无法进行防抖分析");
      return filter(`deshake=rx=${range}:ry=${range}:edge=mirror`);
    }
    case "rotate-video": {
      const angle = s("angle"), axis = s("axis");
      const transforms: string[] = [];
      if (angle === "half") transforms.push("hflip", "vflip");
      if (angle === "right" || angle === "left") transforms.push(`transpose=${angle === "right" ? "clock" : "cclock"}`);
      if (axis === "h" || axis === "both") transforms.push("hflip");
      if (axis === "v" || axis === "both") transforms.push("vflip");
      if (!transforms.length) throw new Error("请选择旋转角度或翻转方向");
      return filter(transforms.join(","));
    }
    case "resize-video": return filter(fitSize(n("width") - n("width") % 2, n("height") - n("height") % 2));
    case "adjust-video": return filter(`eq=brightness=${n("brightness")}:contrast=${n("contrast")}:saturation=${n("saturation")},colorbalance=rs=${0.25*n("temperature")}:bs=${-0.25*n("temperature")},unsharp=5:5:${n("sharpness")}`);
    case "crop-video": {
      const { w, h } = cropSize(width, height, s("ratio"), n("scale"));
      return filter(`crop=${w}:${h}:(iw-ow)*${n("x")/100}:(ih-oh)*${n("y")/100}`);
    }
    case "green-screen-editor": {
      const cmd = command();
      const w = width - width % 2, h = height - height % 2;
      const bg = job.attachments[0];
      const backgroundColor = bg ? "black" : "0x" + s("background").slice(1);
      const graph = ["[0:v:0]split[base][subject]",
        `[base]format=yuv420p,drawbox=c=${backgroundColor}:t=fill[${bg ? "solid" : "bg"}]`];
      if (bg) {
        cmd.input(bg);
        graph.push(`[1:v:0]${fitSize(w, h)}[still]`, "[solid][still]overlay=eof_action=repeat[bg]");
      }
      const spill = n("despill") > 0 ? `,despill=type=green:mix=0.5:green=-${n("despill")}:alpha=0` : "";
      graph.push(`[subject]chromakey=0x${s("key").slice(1)}:${n("similarity")}:0.06${spill}[fg]`, "[bg][fg]overlay[v]");
      return mp4(cmd.duration(job.duration), graph);
    }
    case "add-subtitles": {
      const path = job.attachments[0], name = subtitleFileName(path);
      await job.workspace.write(job.file(name), await job.workspace.read(path), true);
      const result = await filter(`subtitles=${name}`);
      await job.workspace.remove(job.file(name));
      return result;
    }
    case "split-screen-video":
    case "add-text-to-video":
    case "add-photo-to-video":
    case "picture-in-picture": return combine(id, job);
    default: throw new Error("未知的视频画面操作");
  }
}
