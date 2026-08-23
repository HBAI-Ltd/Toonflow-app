// utils/error.ts
import { serializeError } from "serialize-error";
import { isAxiosError } from "axios";

export interface NormalizedError {
  name: string;
  message: string;
  code?: string;
  status?: number;
  stack?: string;
  cause?: NormalizedError;
  responseData?: unknown;
  meta?: Record<string, unknown>;
}

export function normalizeError(error: unknown): NormalizedError {
  // Axios 特殊处理
  if (isAxiosError(error)) {
    return {
      name: "AxiosError",
      message: error.response?.data?.error?.message || error.response?.data?.message || error.message,
      code: error.code,
      status: error.response?.status,
      stack: error.stack,
      responseData: error.response?.data,
      meta: {
        url: error.config?.url,
        method: error.config?.method,
      },
    };
  }

  // 普通 Error，用 serialize-error 处理
  if (error instanceof Error) {
    const serialized = serializeError(error);
    return {
      name: serialized.name || "Error",
      message: serialized.message || "未知错误", // i18n-ignore — TODO(i18n): normalizeError is sync and called at 35+ call sites across the codebase; making it async to reach a locale would be a wide cross-cutting refactor
      code: (serialized as any).code,
      stack: serialized.stack,
      cause: error.cause ? normalizeError(error.cause) : undefined,
      meta: extractMeta(serialized),
    };
  }

  // 非 Error
  return {
    name: "UnknownError",
    message: String(error),
    meta: { raw: serializeError(error) },
  };
}

// 提取自定义属性
function extractMeta(obj: Record<string, unknown>): Record<string, unknown> | undefined {
  const standardKeys = ["name", "message", "stack", "cause"];
  const meta: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (!standardKeys.includes(key) && value !== undefined) {
      meta[key] = value;
    }
  }

  return Object.keys(meta).length > 0 ? meta : undefined;
}

export default normalizeError;
