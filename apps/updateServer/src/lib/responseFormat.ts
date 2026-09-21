export interface ApiResponse<T = unknown> {
  code: number;
  data: T | null;
  message: string;
}

export function error<T = unknown>(message: string = "", data: T | null = null, code: number = 400): ApiResponse<T> {
  return { code, data, message };
}
