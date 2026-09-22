import type { ToolDefinition } from "@earendil-works/pi-coding-agent";
import { ffmpegPlanSchema } from "@toonflow/ffmpeg/runtime";
import { z } from "zod";
import { executePlan, getStatus } from "@/utils/ffmpeg";

const parameters = z.strictObject({
  plan: ffmpegPlanSchema.describe("按 fluent-ffmpeg 顺序执行的链式方法记录。每步为 {method,args}；input/output 为工作区相对路径；ffprobe 放在末尾进行媒体探测。"),
});

export async function createFfmpegTool(cwd: string): Promise<ToolDefinition | undefined> {
  const { tools } = await getStatus();
  if (!tools.ffmpeg.path || tools.ffmpeg.error) return;
  return {
    name: "ffmpeg",
    label: "处理媒体",
    description: "使用本机 FFmpeg/FFprobe 处理工作区媒体：支持多输入、多输出、混音、叠加、字幕、时间滤镜、转场、转码和截帧。调用传 plan.steps，每步为 fluent-ffmpeg 方法及参数数组；回调、命令执行和程序路径设置不开放。input/output 及滤镜中的文件参数必须为当前工作区相对路径，不能使用 URL、绝对路径或越界路径。输出只创建新文件，不覆盖素材。探测使用 input 后接 ffprobe，返回真实媒体信息。",
    promptSnippet: "使用 ffmpeg 的 plan.steps 链式处理工作区媒体；保留原素材并写入新相对路径。",
    promptGuidelines: [
      '翻转示例：{"plan":{"steps":[{"method":"input","args":["assets/input.png"]},{"method":"videoFilters","args":["hflip"]},{"method":"frames","args":[1]},{"method":"output","args":["assets/flipped.png"]}]}}。',
      '复杂滤镜：使用多次 input、complexFilter（数组或字符串）、outputOptions（如 ["-map", "[out]"]）及 output。字幕优先结构化写法：{"method":"videoFilters","args":[[{"filter":"subtitles","options":{"filename":"assets/subtitles.srt"}}]]}；滤镜文件必须位于工作区。',
      '探测示例：{"plan":{"steps":[{"method":"input","args":["assets/input.mp4"]},{"method":"ffprobe","args":[]}]}}。仅支持包内已审查的文件访问入口；被拒绝的参数不能绕过。',
    ],
    parameters: z.toJSONSchema(parameters, { io: "input", target: "draft-07" }),
    executionMode: "sequential",
    async execute(_id, params, signal) {
      signal?.throwIfAborted();
      const args = parameters.parse(params);
      const details = await executePlan(cwd, args.plan, signal);
      return { content: [{ type: "text", text: JSON.stringify(details) }], details };
    },
  };
}
