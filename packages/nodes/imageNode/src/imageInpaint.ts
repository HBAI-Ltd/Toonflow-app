import { useNode, useVueFlow } from "@vue-flow/core";
import { uploadNodeFile, useNodeAi, useNodeFiles, type NodeImageRequest, type NodeImageResult } from "@toonflow/nodes-scaffold/runtime";
import { showNodeError } from "@toonflow/node-shared/showNodeError";

export type ImageInpaint = { source: string; original: string; guide: string; mask: string; images: NonNullable<NodeImageRequest["images"]> };
export type InpaintDraftInput = { prompt: string; images?: NodeImageRequest["images"] };

const inpaintInstruction = "对父节点提供的第一张原图片进行局部重绘。第二张图片是同一原图的标注图，红色涂抹标出了需要修改的区域；红色仅用于指示选区，不要把标注画进结果。只修改标注区域，保留原图的构图、尺寸比例和区域外内容，返回完整图片。";

export function buildInpaintPrompt(prompt: string) {
  return prompt.startsWith(inpaintInstruction) ? prompt : `${inpaintInstruction}\n\n重绘要求：\n${prompt}`;
}

export function useImageInpaint() {
  const { id, node } = useNode();
  const { findNode } = useVueFlow();
  const files = useNodeFiles();
  const ai = useNodeAi();

  return async function generateInpaint(input: NodeImageRequest, inpaint: ImageInpaint, signal: AbortSignal): Promise<NodeImageResult[]> {
    signal.throwIfAborted();
    if (!inpaint || ![inpaint.original, inpaint.guide, inpaint.mask].every(path => typeof path === "string" && path.trim())
      || !Array.isArray(inpaint.images) || inpaint.images.some(image => !image || typeof image.path !== "string" || !image.path.trim() || typeof image.mimeType !== "string" || !image.mimeType.startsWith("image/"))) {
      throw new Error("局部重绘素材无效，请重新创建重绘节点");
    }
    const workspace = files.getWorkspaceFiles();
    const temporaryId = crypto.randomUUID();
    const canvas = document.createElement("canvas");
    const urls: string[] = [];
    let outputPath = "";
    let committed = false;
    let requested = false;

    async function readImage(path: string, mimeType = "image/png") {
      const content = await workspace.read(path);
      signal.throwIfAborted();
      const image = new Image();
      const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
      urls.push(url);
      image.src = url;
      await image.decode();
      signal.throwIfAborted();
      return image;
    }

    try {
      const original = await readImage(inpaint.original);
      const mask = await readImage(inpaint.mask);
      const guide = await readImage(inpaint.guide);
      if (!original.naturalWidth || !original.naturalHeight || [mask, guide].some(image => image.naturalWidth !== original.naturalWidth || image.naturalHeight !== original.naturalHeight)) {
        throw new Error("局部重绘原图、引导图与蒙版尺寸不一致，请重新创建重绘节点");
      }
      canvas.width = original.naturalWidth;
      canvas.height = original.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("无法创建绘画画布");
      context.drawImage(mask, 0, 0);
      if (!context.getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value)) throw new Error("局部重绘蒙版为空，请重新涂抹区域");
      const { directory } = await workspace.list();
      signal.throwIfAborted();
      requested = true;
      // ACT: 供应商尚未统一支持原生 mask；使用涂色参考引导，再按本地蒙版合成，严格保留区域外像素。
      const [result] = await ai.generateImage({
        ...input,
        directory,
        outputDirectory: `assets/${temporaryId}`,
        images: [{ path: inpaint.original, mimeType: "image/png" }, { path: inpaint.guide, mimeType: "image/png" }, ...inpaint.images, ...(input.images ?? [])],
        prompt: buildInpaintPrompt(input.prompt),
      }, signal);
      signal.throwIfAborted();
      if (!result) throw new Error("供应商未返回图片");
      const generated = await readImage(result.path, result.mimeType);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(generated, 0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = "destination-in";
      context.drawImage(mask, 0, 0);
      context.globalCompositeOperation = "destination-over";
      context.drawImage(original, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("图片编码失败")), "image/png"));
      signal.throwIfAborted();
      outputPath = await uploadNodeFile(workspace, id, new File([blob], "image.png", { type: "image/png" }));
      signal.throwIfAborted();
      if (findNode(id) !== node) throw new Error("重绘节点已移除");
      await workspace.remove(`assets/${temporaryId}`, true).catch(error => {
        if (error?.response?.data?.data?.code !== "ENOENT") showNodeError(error, "重绘临时文件清理失败");
      });
      requested = false;
      signal.throwIfAborted();
      committed = true;
      return [{ path: outputPath, mimeType: "image/png", mediaType: "image" }];
    } finally {
      urls.forEach(url => URL.revokeObjectURL(url));
      canvas.width = canvas.height = 0;
      if (outputPath && !committed) await workspace.remove(outputPath).catch(error => showNodeError(error, "重绘临时文件清理失败"));
      if (requested) await workspace.remove(`assets/${temporaryId}`, true).catch(error => {
        if (error?.response?.data?.data?.code !== "ENOENT") showNodeError(error, "重绘临时文件清理失败");
      });
    }
  };
}
