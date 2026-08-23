import { t } from "@/i18n/translate";

export interface ApiResponse {
  code: number;
  data: any;
  message: string;
}

// 成功回调
export function success<T>(data: T | null = null, message?: string): ApiResponse {
  return {
    code: 200,
    data,
    // i18n-ignore — TODO(i18n): success() is synchronous and called at ~360
    // call sites across the codebase with no locale argument, so t() always
    // resolves to DEFAULT_LOCALE here regardless of the caller's actual
    // locale. Threading a locale through every call site is a wide
    // cross-cutting refactor this branch does not attempt (same constraint
    // as normalizeError in src/utils/error.ts).
    message: message ?? t("common.success"),
  };
}

// 客户端错误响应
export function error<T>(message: string = "", data: T | null = null): ApiResponse {
  return {
    code: 400,
    data,
    message,
  };
}
