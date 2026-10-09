import { translateError, translateMessage } from "./i18n";
import type { MessageDescriptor } from "@toonflow/i18n";
import { z } from "zod";
export interface ApiResponse<T = unknown> {
  code: number;
  data: T | null;
  message: string;
}

// 成功回调
export function success<T = unknown>(data: T | null = null, message: string | MessageDescriptor = "成功"): ApiResponse<T> {
  return {
    code: 200,
    data,
    message: translateMessage(message),
  };
}

// 错误响应，默认客户端错误
export function error<T = unknown>(message: string | MessageDescriptor = "", data: T | null = null, code: number = 400): ApiResponse<T> {
  return {
    code,
    data,
    message: translateMessage(message),
  };
}

export function errorFromCause(cause: unknown): ApiResponse {
  if (cause instanceof z.ZodError) {
    return error("参数错误", cause.issues.map(issue => ({ ...issue, message: translateMessage(issue.message) })), 400);
  }
  const failure = cause as { status?: number; code?: string } | null;
  const code = failure?.code;
  const status = failure?.status || ({ ENOENT: 404, ENOTDIR: 404, EEXIST: 409, ENOTEMPTY: 409, EACCES: 403, EPERM: 403 }[code ?? ""] ?? 500);
  const message =
    {
      ENOENT: "找不到这个文件或文件夹，可能已被移动、删除，或者位置选错了。",
      ENOTDIR: "你选中的是文件，但这里需要选择文件夹。请重新选择。",
      EEXIST: "这个名称已经被占用了，请换一个名称。原来的内容不会被覆盖。",
      ENOTEMPTY: "这个文件夹里还有内容，不能直接删除。请先清空或移走里面的文件。",
      EACCES: "没有权限访问这个文件或文件夹。请检查权限，或换一个位置重试。",
      EPERM: "系统不允许这次操作。文件可能正在被其他程序使用，请关闭后重试。",
      EISDIR: "你选中的是文件夹，但这里需要的是文件。请重新选择具体文件。",
    }[code ?? ""] ?? translateError(cause);
  return error(message, code ? { code } : null, status);
}
