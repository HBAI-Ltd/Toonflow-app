import { IconBrush, IconGridDots, IconHandStop, IconLayersSubtract, IconMountain, IconWand } from "@tabler/icons-vue";
import { runMediaModelJob } from "@toonflow/node-shared/mediaModelJob";
import type { MediaTool, MediaToolContext } from "@toonflow/node-shared/mediaTools";
import { readImageBitmap } from "./imageCanvas";
import { imageTypes } from "./imageSequenceTools";
import { texturePixels } from "./texturePixels";
import productionImageEditor from "./components/productionImageEditor.vue";

const general = { sourceMimeTypes: imageTypes, editor: productionImageEditor };
export const imageProductionTools: MediaTool[] = [
  { ...general, id: "lineArt", modelId: "teed", label: "图片转线稿", group: "绘画参考", icon: IconBrush,
    fields: [{ key: "ink", label: "线稿颜色", type: "select", value: "black", options: [{ value: "black", label: "白底黑线" }, { value: "white", label: "黑底白线" }] }] },
  { ...general, id: "animeMask", modelId: "animeFace", label: "制作动漫人物选区", group: "抠图", icon: IconLayersSubtract,
    fields: [{ key: "part", label: "选择部位", type: "select", value: "4", options: ["背景", "头发", "眼睛", "嘴部", "面部", "身体皮肤", "服装"].map((label, i) => ({ label, value: String(i) })) }] },
  { sourceMimeTypes: imageTypes, id: "handPose", modelId: "handPose", label: "画出手部骨架", group: "绘画参考", icon: IconHandStop },
  { ...general, id: "heightNormal", label: "高度图转法线图", group: "制作贴图", icon: IconMountain,
    fields: [{ key: "strength", label: "凹凸强度", type: "number", min: 0.1, max: 10, step: 0.1, value: 2 },
      { key: "convention", label: "法线方向", type: "select", value: "openGl", options: [{ value: "openGl", label: "OpenGL（Y+）" }, { value: "directX", label: "DirectX（Y−）" }] }] },
  { ...general, id: "seamlessTile", label: "去掉平铺接缝", group: "制作贴图", icon: IconGridDots,
    fields: [{ key: "band", label: "边缘过渡宽度（%）", type: "number", value: 12, min: 1, max: 50 }] },
  { ...general, id: "removeMatte", label: "清除抠图白边或黑边", group: "抠图", icon: IconWand,
    fields: [{ key: "matte", label: "要清除的边缘颜色", type: "select", value: "white", options: [{ value: "white", label: "白边" }, { value: "black", label: "黑边" }] }] },
];

export async function runProductionImage(tool: MediaTool, context: MediaToolContext) {
  const { id } = tool;
  const { source, directory, workspace, outputDirectory, values, signal, reportProgress } = context;
  const path = outputDirectory + "/" + id + ".png";
  if (id === "heightNormal" || id === "seamlessTile" || id === "removeMatte") {
    const image = await readImageBitmap(context, source.url);
    const canvas = document.createElement("canvas");
    try {
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("无法打开图片画布");
      ctx.drawImage(image, 0, 0);
      const pixels = await texturePixels(id, ctx.getImageData(0, 0, image.width, image.height), values, signal, reportProgress);
      ctx.putImageData(pixels, 0, 0);
      const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("图片编码失败")), "image/png"));
      signal.throwIfAborted();
      await workspace.write(path, png, true);
    } finally { image.close(); canvas.width = canvas.height = 0; }
  } else {
    const options = id === "animeMask" ? { operation: id, part: Number(values.part) } : id === "lineArt" ? { operation: id, ink: values.ink } : { operation: id };
    await runMediaModelJob("image", { source: source.url, directory, output: path, options }, signal, reportProgress);
  }
  return [{ path, mimeType: "image/png", label: tool.label }];
}
