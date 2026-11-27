import { join, relative } from "node:path";
import { lstat, readFile } from "@toonflow/file";
import { fitsUpscaleSize, predictUpscaleTile, upscaleTiles } from "@toonflow/node-image/upscaleTiles";
import type { ImageModelOptions } from "@/routes/localModels/processImage";
import { runLocalModel } from "@/utils/localModel/inference";
import { createMaterialNormals } from "@/utils/localModel/image/materialNormals";
import { createHandPose } from "@/utils/localModel/image/handPose";
import { extractImageParts } from "@/utils/localModel/image/parts";
import { createPreview } from "@/utils/media/preview";
import { requireDirectModelAccess } from "@/utils/multiTenant/gateway";
import { lockWorkspaceFiles, resolveWorkspacePath, writeWorkspaceFile } from "@/utils/workspace/files";

const resultPath = /^assets\/[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}\/([a-z]+)\.png$/i;
const sizeError = "输出尺寸超过上限，请降低倍率或裁剪原图";

async function decodeImage(content: Buffer, scale: number, signal: AbortSignal) {
  const signature = content.toString("ascii", 0, 6);
  if (signature === "GIF87a" || signature === "GIF89a") throw new Error("请选择静态图片，GIF 不能用于此工具");
  const maxPixels = Math.floor(48_000_000 / (scale * scale));
  const image = new Bun.Image(content, { maxPixels });
  let png: Uint8Array;
  try {
    const { width, height } = await image.metadata();
    if (!fitsUpscaleSize(width, height, scale)) throw new Error(sizeError);
    // 统一为已按 EXIF 方向解码的首帧，避免 WASM 解码器直接分配未经尺寸校验的输入。
    png = await image.png({ compressionLevel: 1 }).bytes();
  } catch (cause) {
    signal.throwIfAborted();
    if ((cause as NodeJS.ErrnoException).code === "ERR_IMAGE_TOO_MANY_PIXELS") throw new Error(sizeError);
    if (cause instanceof Error && cause.message === sizeError) throw cause;
    // 与画布的 HEIC / HEIF / AVIF 兼容预览共用受限 FFmpeg 解码。其他内容不会传给通用解封装器。
    if (content.toString("ascii", 4, 8) !== "ftyp" || !/^(avif|avis|heic|heix|hevc|hevx|heim|heis|mif1|msf1)$/.test(content.toString("ascii", 8, 12))) {
      throw new Error("无法解码这张图片", { cause });
    }
    png = (await createPreview(content, "image", signal, maxPixels)).data;
  }
  signal.throwIfAborted();
  // 读取受信编码器给出的 PNG IHDR。这里的宽高已经包含旋转及兼容解码带来的变化。
  const header = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const width = header.getUint32(16), height = header.getUint32(20);
  if (!width || !height || !fitsUpscaleSize(width, height, scale)) throw new Error(sizeError);
  const { PhotonImage } = await import("@silvia-odwyer/photon-node");
  const decoded = PhotonImage.new_from_byteslice(png);
  try { return { rgba: decoded.get_raw_pixels(), width, height }; }
  finally { decoded.free(); }
}

async function upscaleImage(source: Awaited<ReturnType<typeof decodeImage>>, scale: number,
  onProgress: (completed: number, total: number) => void, signal: AbortSignal) {
  const { width, height, rgba } = source;
  const targetWidth = width * scale, targetHeight = height * scale;
  const output = new Uint8Array(targetWidth * targetHeight * 4);
  let opaque = true;
  for (let i = 0; i < rgba.length; i += 4) {
    const alpha = rgba[i + 3]!;
    if (alpha < 255) opaque = false;
    if (!alpha) rgba.fill(0, i, i + 3);
  }
  const infer = (input: Float32Array) => predictUpscaleTile(input, runLocalModel, signal);
  onProgress(0, 1);
  for await (const tile of upscaleTiles(rgba, width, height, { channels: 4, scale, signal, infer })) {
    for (let y = 0; y < tile.height; y++) {
      const py = Math.max(0, Math.min(height - 1, (tile.y + y + 0.5) / scale - 0.5));
      const first = Math.floor(py) * width, next = Math.min(first + width, (height - 1) * width);
      const dy = py - Math.floor(py);
      for (let x = 0; x < tile.width; x++) {
        const dst = ((tile.y + y) * targetWidth + tile.x + x) * 4, src = (y * tile.width + x) * 3;
        let alpha = 255;
        if (!opaque) {
          // Canvas 原来用 destination-in 拉伸原始透明通道；保持同样的像素中心与双线性采样。
          const px = Math.max(0, Math.min(width - 1, (tile.x + x + 0.5) / scale - 0.5));
          const left = Math.floor(px), right = Math.min(left + 1, width - 1), dx = px - left;
          const top = rgba[(first + left) * 4 + 3]! * (1 - dx) + rgba[(first + right) * 4 + 3]! * dx;
          const bottom = rgba[(next + left) * 4 + 3]! * (1 - dx) + rgba[(next + right) * 4 + 3]! * dx;
          alpha = Math.round(top * (1 - dy) + bottom * dy);
        }
        if (alpha) {
          output[dst] = tile.rgb[src]!;
          output[dst + 1] = tile.rgb[src + 1]!;
          output[dst + 2] = tile.rgb[src + 2]!;
        }
        output[dst + 3] = alpha;
      }
    }
    onProgress(tile.completed, tile.total);
  }
  signal.throwIfAborted();
  const { PhotonImage } = await import("@silvia-odwyer/photon-node");
  const result = new PhotonImage(output, targetWidth, targetHeight);
  try { return result.get_bytes(); }
  finally { result.free(); }
}

export async function processWorkspaceImage(root: string, source: string, output: string, options: ImageModelOptions,
  onProgress: (completed: number, total: number) => void, signal: AbortSignal) {
  requireDirectModelAccess();
  signal.throwIfAborted();
  const expectedName = options.operation === "upscale" ? "realEsrgan" : options.operation;
  if (resultPath.exec(output)?.[1] !== expectedName) throw Object.assign(new Error("文件路径无效"), { status: 400 });
  const [input, target] = await Promise.all([resolveWorkspacePath(root, source), resolveWorkspacePath(root, output)]);
  if (relative(join(root, output), target.path)) throw Object.assign(new Error("不能通过符号链接操作文件"), { status: 403 });
  const release = lockWorkspaceFiles([input.path, target.path]);
  try {
    const info = await lstat(input.path);
    if (!info.isFile() || !info.size || info.size > 256 * 1024 * 1024) throw new Error("请选择不超过 256 MB 的图片文件");
    const existing = await lstat(target.path).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    if (existing) throw Object.assign(new Error("已存在同名文件或目录"), { status: 409, code: "EEXIST" });
    const image = await decodeImage(await readFile(input.path, { signal }), options.operation === "upscale" ? options.scale : 1, signal);
    let result: Uint8Array;
    switch (options.operation) {
      case "upscale": result = await upscaleImage(image, options.scale, onProgress, signal); break;
      case "normalMap": result = await createMaterialNormals(image, options, onProgress, signal); break;
      case "handPose": result = await createHandPose(image, onProgress, signal); break;
      default: result = await extractImageParts(image, options, onProgress, signal);
    }
    requireDirectModelAccess();
    if ((await resolveWorkspacePath(root, output)).path !== target.path) throw Object.assign(new Error("文件路径无效"), { status: 403 });
    signal.throwIfAborted();
    await writeWorkspaceFile(target.path, result, true);
  } finally { release(); }
}
