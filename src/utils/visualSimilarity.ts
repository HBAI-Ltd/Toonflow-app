import sharp from "sharp";
import { getImageEmbedding, cosineSimilarity } from "@/utils/agent/imageEmbedding";

export interface VisualFingerprint {
  size: number;
  pixels: Buffer;
}

export async function createVisualFingerprint(absPath: string, size = 16): Promise<VisualFingerprint> {
  const pixels = await sharp(absPath)
    .rotate()
    .resize(size, size, { fit: "cover" })
    .raw()
    .toBuffer();
  return { size, pixels };
}

export function compareVisualFingerprints(a: VisualFingerprint, b: VisualFingerprint): number {
  if (a.size !== b.size || a.pixels.length !== b.pixels.length || !a.pixels.length) return 0;
  let diff = 0;
  for (let i = 0; i < a.pixels.length; i += 1) diff += Math.abs(a.pixels[i] - b.pixels[i]);
  return Math.max(0, Math.min(1, 1 - diff / (a.pixels.length * 255)));
}

export async function compareImageFiles(aAbsPath: string, bAbsPath: string, size = 16): Promise<number> {
  const [a, b] = await Promise.all([
    createVisualFingerprint(aAbsPath, size),
    createVisualFingerprint(bAbsPath, size),
  ]);
  return compareVisualFingerprints(a, b);
}

/**
 * 基于本地 CLIP 图像 embedding 的语义级相似度（余弦，[0,1]）。
 * 比 16×16 像素指纹更能区分"微变脸/服装漂移"，且对构图/景别变化鲁棒。
 * 模型不可用时抛错，由调用方降级到 compareImageFiles（像素指纹）。
 */
export async function compareImageFilesByEmbedding(aAbsPath: string, bAbsPath: string): Promise<number> {
  const [a, b] = await Promise.all([getImageEmbedding(aAbsPath), getImageEmbedding(bAbsPath)]);
  return Math.max(0, Math.min(1, cosineSimilarity(a, b)));
}
