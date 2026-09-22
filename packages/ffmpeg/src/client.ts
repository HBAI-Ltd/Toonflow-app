import { ffmpegAliases, ffmpegMethods } from "./types";
import type { FfmpegCommand, FfmpegContext, FfmpegMethod, FfmpegPlan, FfmpegResult } from "./types";

export type { FfmpegCommand, FfmpegContext, FfmpegConvertOptions, FfmpegPlan, FfmpegResult } from "./types";

const methods = new Set<string>(ffmpegMethods);

function copyArgument(value: unknown, ancestors = new Set<object>()): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) return value;
  if (!value || typeof value !== "object" || ancestors.has(value)) throw new Error("FFmpeg 参数必须是无循环引用的 JSON 值");
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== null && Object.getPrototypeOf(value)?.constructor?.name !== "Object") {
    throw new Error("FFmpeg 参数不能包含实例、流或二进制内容，请使用工作区相对路径");
  }
  ancestors.add(value);
  try {
    return Array.isArray(value)
      ? Array.from(value, item => copyArgument(item, ancestors))
      : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copyArgument(item, ancestors)]));
  } finally { ancestors.delete(value); }
}

export function createFfmpegClient(
  execute: (plan: FfmpegPlan, signal?: AbortSignal) => Promise<FfmpegResult>,
  convert: FfmpegContext["convert"],
): FfmpegContext {
  const ffmpeg: FfmpegContext = Object.assign(async (build: (command: FfmpegCommand) => unknown, signal?: AbortSignal) => {
    signal?.throwIfAborted();
    if (typeof build !== "function") throw new Error("FFmpeg 需要同步的链式配置回调");
    const plan: FfmpegPlan = { steps: [] };
    let active = true;
    const command = new Proxy(Object.freeze(Object.create(null)), {
      get(_target, key) {
        if (key === "then") return undefined;
        const method = typeof key === "string" && Object.hasOwn(ffmpegAliases, key)
          ? ffmpegAliases[key as keyof typeof ffmpegAliases] : key;
        if (typeof method !== "string" || !methods.has(method)) throw new Error(`不支持的 FFmpeg 方法：${String(key)}`);
        return (...args: unknown[]) => {
          if (!active) throw new Error("FFmpeg 配置回调已经结束");
          if (plan.steps.at(-1)?.method === "ffprobe") throw new Error("ffprobe 必须是最后一个链式方法");
          plan.steps.push({ method: method as FfmpegMethod, args: args.map(argument => copyArgument(argument)) });
          return command;
        };
      },
    }) as FfmpegCommand;
    try {
      const result = build(command);
      if (result !== command && result && (typeof result === "object" || typeof result === "function") && typeof (result as PromiseLike<unknown>).then === "function") {
        void Promise.resolve(result).catch(() => {});
        throw new Error("FFmpeg 配置回调不能使用 async；请先准备素材，再配置命令");
      }
    } finally { active = false; }
    signal?.throwIfAborted();
    if (!plan.steps.length) throw new Error("请先配置 FFmpeg 输入和输出，或调用 ffprobe");
    return execute(plan, signal);
  }, { convert });
  return ffmpeg;
}
