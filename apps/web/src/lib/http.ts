import axios from "axios";
import type { AxiosRequestConfig } from "axios";

type HttpRequestConfig = Pick<AxiosRequestConfig, "data" | "headers" | "params" | "signal" | "timeout"> & {
  method: "GET" | "POST" | "PUT" | "DELETE";
  url: string;
};
type HttpResponse<T> = { code: number; data: T; message?: string };

export default async function http<T>(config: HttpRequestConfig): Promise<T> {
  if (!/^\/api\/[a-zA-Z0-9]+(?:\/[a-zA-Z0-9]+)*$/.test(config.url)) throw new Error("请求必须使用本地接口路径");
  try {
    const { data } = await axios.request<HttpResponse<T>>({
      timeout: 25000,
      ...config,
      headers: { ...config.headers, "x-toonflow-workspace": "1" },
    });
    if (!data || typeof data.code !== "number") throw new Error("接口响应格式不正确");
    if (data.code !== 200) throw Object.assign(new Error(data.message || "请求失败"), { status: data.code });
    return data.data;
  } catch (error) {
    if (axios.isCancel(error) || !axios.isAxiosError<{ message?: unknown }>(error)) throw error;
    const message = error.response?.data?.message;
    throw Object.assign(new Error(typeof message === "string" && message ? message : error.code === "ECONNABORTED"
      ? "请求超时，请重试" : "请求失败，请检查网络连接"), { status: error.response?.status });
  }
}
