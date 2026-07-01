import { pipeline, env as transformersEnv, RawImage, ImageFeatureExtractionPipeline } from "@huggingface/transformers";
import path from "path";
import fs from "fs";
import getPath from "@/utils/getPath";
import db from "@/utils/db";

// 本地 CLIP 图像 embedding：仿 src/utils/agent/embedding.ts 的文本 embedding 范式，
// 用于视觉一致性校验（替代 16×16 像素指纹），语义级相似、对构图变化鲁棒、本地离线。

let extractor: ImageFeatureExtractionPipeline | null = null;
let initFailed = false; // 模型缺失/初始化失败标记，避免每次重试

// 进程内缓存：资产图/分镜图相对稳定，key = path + mtimeMs，避免重复编码
const embeddingCache = new Map<string, number[]>();
const CACHE_MAX = 256;

function cacheKey(absPath: string): string {
  try {
    const stat = fs.statSync(absPath);
    return `${absPath}:${stat.mtimeMs}`;
  } catch {
    return absPath;
  }
}

export async function initImageEmbedding(): Promise<void> {
  if (extractor) return;
  if (initFailed) throw new Error("图像 embedding 模型不可用");

  try {
    const modelConfigData = await db("o_setting").whereIn("key", ["imageModelFolder", "imageModelDtype"]);
    const modelObj: Record<string, string> = {};
    Object.entries(modelConfigData).forEach(([key, value]) => {
      modelObj[key] = value as string;
    });
    const modelFolder = modelObj?.imageModelFolder || "clip-vit-base-patch32";
    const modelDtype = modelObj?.imageModelDtype || "fp32";

    const modelDir = path.join(getPath("models"), modelFolder);
    if (!fs.existsSync(modelDir)) {
      throw new Error(`图像 embedding 模型文件不存在: ${modelDir}`);
    }

    transformersEnv.allowRemoteModels = false;
    transformersEnv.allowLocalModels = true;
    transformersEnv.localModelPath = getPath("models").replace(/\\/g, "/") + "/";

    // @ts-ignore - pipeline 重载联合类型过于复杂
    extractor = await pipeline("image-feature-extraction", modelFolder, { dtype: modelDtype });
  } catch (err) {
    initFailed = true;
    throw err;
  }
}

/** 生成图像的归一化 embedding 向量；失败时抛错（由调用方降级处理）。 */
export async function getImageEmbedding(absPath: string): Promise<number[]> {
  const key = cacheKey(absPath);
  const cached = embeddingCache.get(key);
  if (cached) return cached;

  if (!extractor) await initImageEmbedding();
  const image = await RawImage.read(absPath);
  // CLIPVisionModelWithProjection（vision_model.onnx）直接输出投影后的 image embedding，
  // 不带 pooler_output，故不传 pool。图像 pipeline 无内置 normalize，手动 L2 归一化使 cosineSimilarity 成立。
  const output = await extractor!(image);
  const vector = l2Normalize(Array.from(output.data as Float32Array));

  if (embeddingCache.size >= CACHE_MAX) {
    const firstKey = embeddingCache.keys().next().value;
    if (firstKey) embeddingCache.delete(firstKey);
  }
  embeddingCache.set(key, vector);
  return vector;
}

function l2Normalize(vec: number[]): number[] {
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm);
  return norm > 0 ? vec.map((v) => v / norm) : vec;
}

/** 归一化向量的余弦相似度（与 embedding.ts 的 cosineSimilarity 一致：归一化后点积即余弦）。 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 0;
  return a.reduce((dot, v, i) => dot + v * b[i], 0);
}

/** 模型当前是否可用（已初始化且未标记失败）。 */
export function isImageEmbeddingAvailable(): boolean {
  return Boolean(extractor) && !initFailed;
}

export async function disposeImageEmbedding(): Promise<void> {
  await extractor?.dispose?.();
  extractor = null;
}
