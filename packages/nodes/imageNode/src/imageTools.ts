import { IconBackground, IconCube, IconEraser, IconFocus2, IconPhotoScan } from "@tabler/icons-vue";
import { markMessages } from "@toonflow/i18n/vue";
import type { MediaTool, MediaToolContext, MediaToolResult } from "@toonflow/node-shared/mediaTools";
import { runCommand } from "@toonflow/node-shared/mediaCommands";
import { runMediaModelJob } from "@toonflow/node-shared/mediaModelJob";
import { readImageBitmap } from "./imageCanvas";
import imageSequenceEditor from "./components/imageSequenceEditor.vue";
import imageRepairMask from "./components/imageRepairMask.vue";
import imageUpscaleEditor from "./components/imageUpscaleEditor.vue";
import imageDepthEditor from "./components/imageDepthEditor.vue";
import materialNormalEditor from "./components/materialNormalEditor.vue";
import { imageAlignmentTool, runImageAlignment } from "./imageAlignment";
import { imageProductionTools, runProductionImage } from "./imageProductionTools";
import { runImageModel } from "./imageModels";
import { getSequenceFrame, imageTypes, imageSequenceTools, sequenceRatio } from "./imageSequenceTools";

export const imageTools: MediaTool[] = markMessages<MediaTool[]>([
  { id: "realEsrgan", modelId: "realEsrgan", label: "高清放大", icon: IconPhotoScan, group: "修图", sourceMimeTypes: imageTypes,
    editor: imageUpscaleEditor, fields: [{ key: "scale", label: "放大倍数", type: "number", min: 2, max: 4, value: 4 }] },
  { id: "migan", modelId: "migan", label: "擦除物体", icon: IconEraser, group: "修图", sourceMimeTypes: imageTypes,
    editor: imageRepairMask, fields: [{ key: "mask", label: "修复选区", type: "text", value: "" }] },
  { id: "ormbg", modelId: "ormbg", label: "去除背景", icon: IconBackground, group: "抠图", sourceMimeTypes: imageTypes },
  { id: "depthAnything", modelId: "depthAnything", label: "生成深度图", icon: IconFocus2, group: "制作贴图", sourceMimeTypes: imageTypes, editor: imageDepthEditor,
    fields: [{ key: "depthDirection", label: "深度图明暗", type: "select", value: "nearWhite", options: [{ value: "nearWhite", label: "近处亮，远处暗" }, { value: "farWhite", label: "近处暗，远处亮" }] }] },
  { id: "normalMap", modelId: "deepBump", label: "照片转法线图", icon: IconCube, group: "制作贴图", sourceMimeTypes: imageTypes,
    editor: materialNormalEditor, fields: [
      { key: "convention", label: "法线方向", type: "select", value: "openGl", options: [{ value: "openGl", label: "OpenGL（Y+）" }, { value: "directX", label: "DirectX（Y−）" }] },
      { key: "strength", label: "凹凸强度", type: "number", min: 0.1, max: 2, step: 0.1, value: 1 }] },
  ...imageProductionTools,
  imageAlignmentTool,
  ...imageSequenceTools.map(tool => ({ ...tool, get label() { return tool.label; }, editor: imageSequenceEditor })),
]);

export async function runImageTool(id: string, context: MediaToolContext): Promise<MediaToolResult[]> {
  const { workspace, source, attachments, signal, outputDirectory, values } = context;
  const tool = imageTools.find(item => item.id === id);
  if (!tool) throw new Error("未知的图片工具");
  if (id === imageAlignmentTool.id) return runImageAlignment(context);
  if (imageProductionTools.includes(tool)) return runProductionImage(tool, context);
  if (id === "normalMap") {
    const path = outputDirectory + "/normalMap.png";
    const options = { operation: id, convention: values.convention, strength: Number(values.strength) };
    await runMediaModelJob("image", { directory: context.directory, source: source.url, output: path, options }, signal, context.reportProgress);
    return [{ path, mimeType: "image/png", label: tool.label }];
  }
  if (tool.modelId) return runImageModel(tool.modelId, context);
  const slideshow = id === "image-slideshow";
  const sound = slideshow ? context.extraAttachments ?? [] : attachments;
  if (sound.length > 1) throw new Error("请选择一段配音或背景音乐");
  const paths = slideshow ? [source.url, ...attachments] : [source.url];
  if (slideshow && paths.length < 2) throw new Error("请至少添加一张后续图片");
  if (paths.length > 300) throw new Error("幻灯片每次最多支持 300 张图片");
  const duration = Number(values.seconds);
  if (!Number.isSafeInteger(duration) || duration < 1 || duration > (slideshow ? 120 : 14400)) throw new Error("时长超出允许范围");
  if (!sequenceRatio.options!.some(option => option.value === values.ratio)) throw new Error("请选择有效的画面比例");
  const frame = document.createElement("canvas");
  const ctx = frame.getContext("2d");
  if (!ctx) throw new Error("无法创建图片画布");
  const ffmpeg = await context.ffmpeg();
  const temp = `${outputDirectory}/slides`;
  await workspace.mkdir(temp);
  try {
    for (const [i, path] of paths.entries()) {
      const image = await readImageBitmap(context, path);
      try {
        if (i === 0) {
          const { width, height } = getSequenceFrame(values.ratio, image.width, image.height);
          frame.width = width;
          frame.height = height;
        }
        const scale = Math.min(frame.width / image.width, frame.height / image.height);
        const w = image.width * scale;
        const h = image.height * scale;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, frame.width, frame.height);
        ctx.drawImage(image, (frame.width - w) / 2, (frame.height - h) / 2, w, h);
      } finally { image.close(); }
      const blob = await new Promise<Blob>((resolve, reject) => frame.toBlob(value => value ? resolve(value) : reject(new Error("图片编码失败")), "image/png"));
      signal.throwIfAborted();
      await workspace.write(`${temp}/slide${String(i).padStart(4, "0")}.png`, blob, true);
    }
    const command = slideshow
      ? ffmpeg(`${temp}/slide%04d.png`).inputOptions("-framerate", `1/${duration}`, "-start_number", "0")
      : ffmpeg(`${temp}/slide0000.png`).inputOptions("-loop", "1", "-framerate", "25");
    if (sound[0]) command.input(sound[0]).inputOptions("-stream_loop", "-1");
    const output = `${outputDirectory}/video.mp4`;
    command.output(output).duration(duration * paths.length).videoFilters("fps=25").videoCodec("libx264")
      .outputOptions("-pix_fmt", "yuv420p", "-movflags", "+faststart", "-preset", "fast", "-map", "0:v:0");
    if (sound[0]) command.audioCodec("aac").outputOptions("-map", "1:a:0");
    else command.noAudio();
    await runCommand(command, signal);
    return [{ path: output, mimeType: "video/mp4" }];
  } finally {
    frame.width = frame.height = 0;
    await workspace.remove(temp, true);
  }
}
