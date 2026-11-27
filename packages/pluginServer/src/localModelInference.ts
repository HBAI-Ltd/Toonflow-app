export const localModelTensorBytes = 64 * 1024 * 1024;

export const localModelElementBytes = {
  float32: 4, float64: 8, float16: 2, int8: 1, uint8: 1, int16: 2, uint16: 2,
  int32: 4, uint32: 4, int64: 8, uint64: 8, bool: 1,
} as const;

export type LocalModelTensorType = keyof typeof localModelElementBytes;
export interface LocalModelTensor {
  type: LocalModelTensorType;
  dims: number[];
  /** 连续、小端、按行排列的张量字节，标准 Base64 编码。标量的 dims 为 []。 */
  data: string;
}
export interface LocalModelRunRequest {
  id: string;
  device?: "auto" | "cpu" | "gpu";
  inputs: Record<string, LocalModelTensor>;
  outputs?: string[];
}
export interface LocalModelRunResult {
  provider: string;
  outputs: Record<string, LocalModelTensor>;
}
