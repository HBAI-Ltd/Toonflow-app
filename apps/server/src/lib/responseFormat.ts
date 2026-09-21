export interface ApiResponse<T = unknown> {
  code: number;
  data: T | null;
  message: string;
}

// 成功回调
export function success<T = unknown>(data: T | null = null, message: string = "成功"): ApiResponse<T> {
  return {
    code: 200,
    data,
    message,
  };
}

// 错误响应，默认客户端错误
export function error<T = unknown>(message: string = "", data: T | null = null, code: number = 400): ApiResponse<T> {
  return {
    code,
    data,
    message,
  };
}
