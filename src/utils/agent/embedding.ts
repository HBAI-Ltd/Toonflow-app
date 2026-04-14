import * as ONNX_WEB from "onnxruntime-web";
import { pipeline, env as transformersEnv, FeatureExtractionPipeline } from "@huggingface/transformers";
import path from "path";
import fs from "fs";
import getPath from "@/utils/getPath";
import db from "@/utils/db";

// ── 模型配置 ──
// const modelOnnxFile = ["all-MiniLM-L6-v2", "onnx", "model_fp16.onnx"]; // 模型文件路径
// const modelDtype = "fp16" as const; // 量化类型：fp32
let extractor: FeatureExtractionPipeline | null = null;

function shouldSkipEmbedding(): boolean {
  return process.env.TOONFLOW_SKIP_EMBEDDING === "1";
}

export async function initEmbedding(): Promise<void> {
  if (shouldSkipEmbedding()) return;
  if (extractor) return;

  const modelConfigData = await db("o_setting").whereIn("key", ["modelOnnxFile", "modelDtype"]);
  const modelObj: Record<string, string> = {};
  Object.entries(modelConfigData).forEach(([key, value]) => {
    modelObj[key] = value as string;
  });
  let modelOnnxFile = modelObj?.modelOnnxFile ? JSON.parse(modelObj.modelOnnxFile) : ["all-MiniLM-L6-v2", "onnx", "model_fp16.onnx"]; // 模型文件路径
  let modelDtype = modelObj?.modelDtype ?? ("fp16" as const); // 量化类型：fp32
  const onnxPath = path.join(getPath("models"), ...modelOnnxFile);
  if (!fs.existsSync(onnxPath)) {
    throw new Error(`Embedding 模型文件不存在: ${onnxPath}`);
  }

  transformersEnv.allowRemoteModels = false;
  transformersEnv.allowLocalModels = true;
  transformersEnv.localModelPath = getPath("models").replace(/\\/g, "/") + "/";

  const modelFolder = modelOnnxFile[0];
  // @ts-ignore - pipeline 重载联合类型过于复杂
  extractor = await pipeline("feature-extraction", modelFolder, { dtype: modelDtype });
}

export async function getEmbedding(text: string): Promise<number[]> {
  if (shouldSkipEmbedding()) return [];
  if (!extractor) await initEmbedding();
  const output = await extractor!(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  return a.reduce((dot, v, i) => dot + v * b[i], 0);
}

export async function disposeEmbedding(): Promise<void> {
  if (shouldSkipEmbedding()) {
    extractor = null;
    return;
  }
  await extractor?.dispose?.();
  extractor = null;
}
