import { z } from "zod";
import { t } from "@/lib/i18n";
import { localModelElementBytes, localModelTensorBytes, type LocalModelRunRequest, type LocalModelRunResult, type LocalModelTensor } from "@toonflow/plugin-server/localModelInference";
import { getRegisteredModel } from "@/utils/localModel";
import { getDeploymentModelRunner } from "@/utils/localModel/runners";
import { runOnnxModel } from "@/utils/localModel/onnx/runner";
import { runWhisper } from "@/utils/localModel/audio/whisper";
import { runDeepFilterNet } from "@/utils/localModel/audio/deepFilterNet";
import { requireDirectModelAccess } from "@/utils/multiTenant/gateway";

const name = z.string().min(1).max(1024).refine(value => !value.includes("\0") && !["__proto__", "constructor", "prototype"].includes(value));
const tensor = z.strictObject({
  type: z.enum(Object.keys(localModelElementBytes) as (keyof typeof localModelElementBytes)[]),
  dims: z.array(z.int().min(0).max(2147483647)).max(32),
  data: z.string().max(4 * Math.ceil(localModelTensorBytes / 3)),
});
const tensors = z.record(name, tensor).refine(value => Object.keys(value).length <= 64);
export const runSchema = z.strictObject({
  id: z.string().min(1).max(256),
  device: z.enum(["auto", "cpu", "gpu"]).optional(),
  inputs: tensors,
  outputs: z.array(name).min(1).max(64).refine(keys => keys.length === new Set(keys).size).optional(),
});
const resultSchema = z.strictObject({ provider: z.string().trim().min(1).max(256), outputs: tensors });

function tensorError(values: Record<string, LocalModelTensor>) {
  let totalBytes = 0;
  for (const [name, { type, dims, data }] of Object.entries(values)) {
    const length = dims.reduce((size, axis) => size * axis, localModelElementBytes[type] as number);
    totalBytes += length;
    if (!Number.isSafeInteger(totalBytes) || totalBytes > localModelTensorBytes) return t`输入张量总大小超过 64 MiB`;
    const padding = (3 - length % 3) % 3;
    if (data.length !== 4 * Math.ceil(length / 3) || !data.endsWith("=".repeat(padding))
      || /[^A-Za-z0-9+/]/.test(data.slice(0, data.length - padding))) return t`张量 ${name} 的数据与形状不符`;
  }
}

export async function runLocalModel(request: LocalModelRunRequest, signal?: AbortSignal): Promise<LocalModelRunResult> {
  requireDirectModelAccess();
  signal?.throwIfAborted();
  const parsed = runSchema.safeParse(request);
  if (!parsed.success) throw Object.assign(new Error("本地模型调用参数无效"), { status: 400 });
  const inputError = tensorError(parsed.data.inputs);
  if (inputError) throw Object.assign(new Error(inputError), { status: 400 });

  const model = await getRegisteredModel(parsed.data.id);
  const run = getDeploymentModelRunner(model) ?? (model.id === "whisper" ? runWhisper : model.id === "deepFilterNet" ? runDeepFilterNet : runOnnxModel);
  requireDirectModelAccess();
  signal?.throwIfAborted();
  const result = await run(parsed.data, signal);
  signal?.throwIfAborted();
  const checked = resultSchema.safeParse(result);
  if (checked.success && !tensorError(checked.data.outputs)) {
    const keys = Object.keys(checked.data.outputs);
    const selected = parsed.data.outputs;
    if (keys.length && (!selected || (keys.length === selected.length && selected.every(key => Object.hasOwn(checked.data.outputs, key))))) return checked.data;
  }
  throw Object.assign(new Error("本地模型响应无效"), { status: 502 });
}
