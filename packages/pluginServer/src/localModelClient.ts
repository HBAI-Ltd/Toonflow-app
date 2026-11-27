import type { LocalModelItem } from "./localModels.ts";
import { localModelTensorBytes, type LocalModelRunRequest, type LocalModelRunResult, type LocalModelTensor, type LocalModelTensorType } from "./localModelInference.ts";
import { base64ToBytes, bytesToBase64 } from "./protocol.ts";

export type { LocalModelItem, LocalModelDefinition } from "./localModels.ts";
export { localModelId } from "./localModels.ts";
export type { LocalModelRunRequest, LocalModelRunResult, LocalModelTensor, LocalModelTensorType } from "./localModelInference.ts";

export interface LocalModelClient {
  list(signal?: AbortSignal): Promise<LocalModelItem[]>;
  run(request: LocalModelRunRequest, signal?: AbortSignal): Promise<LocalModelRunResult>;
}

/** data 采用 ONNX 对应类型的小端连续字节，支持 typed array 的子视图。 */
export function packLocalTensor(type: LocalModelTensorType, dims: number[], data: ArrayBufferView): LocalModelTensor {
  if (data.byteLength > localModelTensorBytes) throw new Error("本地模型张量超过大小上限");
  return { type, dims, data: bytesToBase64(new Uint8Array(data.buffer, data.byteOffset, data.byteLength)) };
}

export function unpackLocalTensor(tensor: LocalModelTensor): Uint8Array<ArrayBuffer> {
  return base64ToBytes(tensor.data, localModelTensorBytes);
}

export function createLocalModelClient(lifetime?: AbortSignal): LocalModelClient {
  async function request<T>(route: string, body: LocalModelRunRequest | undefined, signal?: AbortSignal) {
    const language = (globalThis as { document?: { documentElement: { lang: string } } }).document?.documentElement.lang;
    const response = await fetch("/api/localModels/" + route, {
      method: body ? "POST" : "GET",
      headers: { "x-toonflow-workspace": "1", ...(language ? { "Accept-Language": language } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
      cache: "no-store", body: body ? JSON.stringify(body) : undefined,
      signal: lifetime && signal ? AbortSignal.any([lifetime, signal]) : signal ?? lifetime,
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null) as { message?: string } | null;
      throw Object.assign(new Error(result?.message || `本地模型请求失败（HTTP ${response.status}）`), { status: response.status });
    }
    const result = await response.json() as { code: number; data: T; message?: string } | null;
    if (result?.code !== 200) throw new Error(result?.message || "本地模型响应无效");
    return result.data;
  }
  return {
    async list(signal) { return (await request<{ items: LocalModelItem[] }>("status", undefined, signal)).items; },
    run: (input, signal) => request<LocalModelRunResult>("run", input, signal),
  };
}
