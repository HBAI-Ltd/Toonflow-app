import { packLocalTensor, unpackLocalTensor, type LocalModelTensor } from "@toonflow/nodes-scaffold/nodeModel";
import { runMediaModelJob } from "@toonflow/node-shared/mediaModelJob";
import type { MediaToolContext } from "@toonflow/node-shared/mediaTools";
import { fallbackImageFormat, readImageBitmap } from "./imageCanvas";
import { fitsUpscaleSize, getUpscaleSample, upscaleScales, upscaleTiles } from "./upscaleTiles";

function surface(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("无法创建图片画布");
  return ctx;
}

function planarRgb(rgba: Uint8ClampedArray, normalize?: (value: number, channel: number) => number) {
  const area = rgba.length / 4;
  const rgb = normalize ? new Float32Array(area * 3) : new Uint8Array(area * 3);
  for (let c = 0; c < 3; c++) {
    for (let i = 0; i < area; i++) {
      const value = rgba[i * 4 + c]!;
      rgb[c * area + i] = normalize ? normalize(value, c) : value;
    }
  }
  return rgb;
}

async function infer(context: Pick<MediaToolContext, "model" | "signal">, id: string, inputs: Record<string, LocalModelTensor>, output: string, type: "float32" | "uint8", dims: number[]) {
  const result = await context.model.run({ id, inputs, outputs: [output] }, context.signal);
  context.signal.throwIfAborted();
  const tensor = result.outputs[output];
  if (tensor?.type !== type || tensor.dims.length !== dims.length || dims.some((value, i) => value !== tensor.dims[i])) {
    throw new Error("模型输出尺寸或格式与图片不符");
  }
  const bytes = unpackLocalTensor(tensor);
  const length = dims.reduce((a, b) => a * b, 1);
  if (bytes.length !== length * (type === "float32" ? 4 : 1)) throw new Error("模型输出数据不完整");
  return type === "float32" ? new Float32Array(bytes.buffer, bytes.byteOffset, length) : bytes;
}

export async function previewUpscaleSample(image: HTMLImageElement, scale: number,
  sample: { x: number; y: number }, signal: AbortSignal, infer: (input: Float32Array) => Promise<Float32Array>) {
  const { naturalWidth: width, naturalHeight: height } = image;
  if (!width || !height || !upscaleScales.some(value => value === scale)) throw new Error("请选择图片和有效的输出倍率");
  const region = getUpscaleSample(width, height, sample);
  const source = surface(region.inputWidth, region.inputHeight);
  let rgba: Uint8ClampedArray;
  try {
    source.drawImage(image, region.inputX, region.inputY, region.inputWidth, region.inputHeight, 0, 0, region.inputWidth, region.inputHeight);
    rgba = source.getImageData(0, 0, region.inputWidth, region.inputHeight).data;
  } finally { source.canvas.width = source.canvas.height = 0; }
  const target = surface(region.width * scale, region.height * scale);
  try {
    const tiles = upscaleTiles(rgba, region.inputWidth, region.inputHeight, { channels: 4, scale, signal, infer });
    for await (const tile of tiles) {
      const patch = target.createImageData(tile.width, tile.height);
      for (let i = 0; i < tile.width * tile.height; i++) {
        patch.data[4 * i] = tile.rgb[3 * i]!;
        patch.data[4 * i + 1] = tile.rgb[3 * i + 1]!;
        patch.data[4 * i + 2] = tile.rgb[3 * i + 2]!;
        patch.data[4 * i + 3] = 255;
      }
      target.putImageData(patch, tile.x + (region.inputX - region.x) * scale, tile.y + (region.inputY - region.y) * scale);
    }
    target.globalCompositeOperation = "destination-in";
    target.drawImage(image, -region.x * scale, -region.y * scale, width * scale, height * scale);
    return target.canvas;
  } catch (error) {
    target.canvas.width = target.canvas.height = 0;
    throw error;
  }
}

export async function estimateImageMap(context: Pick<MediaToolContext, "model" | "signal" | "values">, id: string, image: ImageBitmap) {
  const depth = id === "depthAnything";
  const direction = context.values.depthDirection ?? "nearWhite";
  if (depth && direction !== "nearWhite" && direction !== "farWhite") throw new Error("请选择深度图的近远明暗");
  const { width, height } = image;
  // ViT 特征块为 14 像素，保持长宽比。限制极长画幅的长边，避免注意力计算随图像面积平方增长。
  const scale = Math.min(518 / Math.min(width, height), 1008 / Math.max(width, height));
  const w = depth ? Math.max(14, Math.round(width * scale / 14) * 14) : 1024;
  const h = depth ? Math.max(14, Math.round(height * scale / 14) * 14) : 1024;
  const input = surface(w, h);
  input.drawImage(image, 0, 0, w, h);
  const mean = [0.485, 0.456, 0.406], std = [0.229, 0.224, 0.225];
  const rgb = planarRgb(input.getImageData(0, 0, w, h).data, (value, c) => depth ? (value / 255 - mean[c]!) / std[c]! : value / 255);
  const tensor = packLocalTensor("float32", [1, 3, h, w], rgb);
  const map = depth
    ? await infer(context, id, { pixel_values: tensor }, "predicted_depth", "float32", [1, h, w])
    : await infer(context, id, { input: tensor }, "output", "float32", [1, 1, h, w]);
  let min = Infinity, max = -Infinity;
  for (const value of map) { min = Math.min(value, min); max = Math.max(value, max); }
  if (!Number.isFinite(min) || !Number.isFinite(max)) throw new Error("模型返回了无效的像素");
  const pixels = input.createImageData(w, h);
  for (let i = 0; i < map.length; i++) {
    const value = 255 * (max > min ? (map[i]! - min) / (max - min) : depth ? 0 : Math.max(0, Math.min(1, min)));
    const gray = depth && direction === "farWhite" ? 255 - value : value;
    pixels.data[i * 4] = pixels.data[i * 4 + 1] = pixels.data[i * 4 + 2] = depth ? gray : 255;
    pixels.data[i * 4 + 3] = depth ? 255 : value;
  }
  input.putImageData(pixels, 0, 0);
  const target = surface(width, height);
  target.drawImage(image, 0, 0);
  target.globalCompositeOperation = depth ? "source-in" : "destination-in";
  target.drawImage(input.canvas, 0, 0, width, height);
  return target.canvas;
}

async function repair(context: MediaToolContext, image: ImageBitmap) {
  const maskUrl = context.values.mask;
  if (typeof maskUrl !== "string" || !maskUrl.startsWith("data:image/png;base64,")) throw new Error("请先涂抹要修复的区域");
  const mask = new Image();
  mask.src = maskUrl;
  await mask.decode();
  const selection = surface(mask.naturalWidth, mask.naturalHeight);
  selection.drawImage(mask, 0, 0);
  const { width, height } = selection.canvas;
  const alpha = selection.getImageData(0, 0, width, height).data;
  let left = width, top = height, right = -1, bottom = -1;
  for (let i = 0; i < alpha.length / 4; i++) {
    if (!alpha[i * 4 + 3]) continue;
    const x = i % width, y = Math.floor(i / width);
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  if (right < left || bottom < top) throw new Error("请先涂抹要修复的区域");
  const sx = image.width / width, sy = image.height / height;
  const pad = Math.max(32, Math.ceil(Math.max((right - left + 1) * sx, (bottom - top + 1) * sy) / 3));
  const x = Math.max(0, Math.floor(left * sx) - pad), y = Math.max(0, Math.floor(top * sy) - pad);
  const cw = Math.min(image.width, Math.ceil((right + 1) * sx) + pad) - x;
  const ch = Math.min(image.height, Math.ceil((bottom + 1) * sy) + pad) - y;
  const scale = Math.min(1, 1024 / Math.max(cw, ch));
  const w = Math.max(1, Math.round(cw * scale)), h = Math.max(1, Math.round(ch * scale));
  const crop = surface(w, h);
  crop.drawImage(image, x, y, cw, ch, 0, 0, w, h);
  const rgb = planarRgb(crop.getImageData(0, 0, w, h).data);
  crop.clearRect(0, 0, w, h);
  crop.drawImage(mask, x / sx, y / sy, cw / sx, ch / sy, 0, 0, w, h);
  const maskData = crop.getImageData(0, 0, w, h).data;
  // MI-GAN 的 uint8 蒙版白色表示保留，黑色表示修复。
  const keep = Uint8Array.from({ length: w * h }, (_, i) => maskData[4 * i + 3] ? 0 : 255);
  const out = await infer(context, "migan", {
    image: packLocalTensor("uint8", [1, 3, h, w], rgb), mask: packLocalTensor("uint8", [1, 1, h, w], keep),
  }, "result", "uint8", [1, 3, h, w]);
  const patch = crop.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    for (let c = 0; c < 3; c++) patch.data[i * 4 + c] = out[c * w * h + i]!;
    patch.data[i * 4 + 3] = 255;
  }
  crop.putImageData(patch, 0, 0);
  const target = surface(image.width, image.height);
  target.drawImage(crop.canvas, x, y, cw, ch);
  target.globalCompositeOperation = "destination-in";
  target.drawImage(mask, 0, 0, image.width, image.height);
  target.globalCompositeOperation = "destination-over";
  target.drawImage(image, 0, 0);
  return target.canvas;
}

async function encodeCanvas(canvas: HTMLCanvasElement) {
  try {
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("图片编码失败")), "image/png"));
  } finally { canvas.width = canvas.height = 0; }
}

async function upscaleSource(context: MediaToolContext, scale: number) {
  const { source, sourcePreviewUrl, signal } = context;
  if (!fallbackImageFormat(source.url, source.mimeType) || !sourcePreviewUrl?.startsWith("blob:")) return source.url;
  // 直接使用节点已加载的原尺寸 Blob，兼容浏览器或宿主已能显示的 HEIF 系列图片。
  const blob = await (await fetch(sourcePreviewUrl, { signal })).blob();
  const signature = await blob.slice(0, 6).text();
  if (signature === "GIF87a" || signature === "GIF89a") throw new Error("请选择静态图片，GIF 不能用于此工具");
  const image = await createImageBitmap(blob).catch(() => undefined);
  if (!image) { signal.throwIfAborted(); return source.url; }
  let canvas: HTMLCanvasElement;
  try {
    signal.throwIfAborted();
    if (!fitsUpscaleSize(image.width, image.height, scale)) throw new Error("输出尺寸超过上限，请降低倍率或裁剪原图");
    const target = surface(image.width, image.height);
    target.drawImage(image, 0, 0);
    canvas = target.canvas;
  } finally { image.close(); }
  const png = await encodeCanvas(canvas);
  signal.throwIfAborted();
  const path = `${context.outputDirectory}/source.png`;
  await context.workspace.write(path, png, true);
  return path;
}

export async function runImageModel(id: string, context: MediaToolContext) {
  const path = `${context.outputDirectory}/${id}.png`;
  if (id === "realEsrgan") {
    const options = { operation: "upscale", scale: Number(context.values.scale ?? 4) };
    if (!upscaleScales.some(scale => scale === options.scale)) throw new Error("请选择图片和有效的输出倍率");
    const source = await upscaleSource(context, options.scale);
    await runMediaModelJob("image", { directory: context.directory, source, output: path, options },
      context.signal, context.reportProgress);
    return [{ path, mimeType: "image/png" }];
  }
  const image = await readImageBitmap(context, context.source.url);
  try {
    const canvas = id === "migan" ? await repair(context, image) : await estimateImageMap(context, id, image);
    const blob = await encodeCanvas(canvas);
    context.signal.throwIfAborted();
    await context.workspace.write(path, blob, true);
    return [{ path, mimeType: "image/png" }];
  } finally { image.close(); }
}
