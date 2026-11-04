export type AdminRequest = <T>(config: {
  method: "GET" | "POST" | "PUT";
  url: string;
  data?: unknown;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}) => Promise<T>;
