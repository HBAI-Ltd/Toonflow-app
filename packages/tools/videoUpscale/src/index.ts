import { z } from "zod";
import type { ToolContext, ToolPlugin } from "@toonflow/tools-scaffold/runtime";
import { configSchema, resolutionSchema } from "./api";
import { upscaleResolutions } from "./types";
import { quote, start, status } from "./tasks";

const path = z.string().min(1).max(4096).refine(value => !/[\x00-\x1f]/.test(value)
  && !/^(?:[\\/]|[a-z][a-z\d+.-]*:)/i.test(value) && !value.split(/[\\/]+/).includes(".."), "视频路径必须位于工作区内");
const requestSchema = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("quote"), path, resolution: resolutionSchema }),
  z.strictObject({ action: z.literal("start"), taskId: z.string().uuid(), path, resolution: resolutionSchema,
    sourceHash: z.string().regex(/^[a-f\d]{64}$/), estimatedCostUsd: z.number().finite().nonnegative() }),
  z.strictObject({ action: z.literal("status"), taskId: z.string().uuid() }),
]);
const querySchema = z.discriminatedUnion("action", [requestSchema.options[0], requestSchema.options[2]]);

async function handle(context: ToolContext, args: unknown, signal?: AbortSignal) {
  const request = requestSchema.parse(args);
  if (request.action === "quote") return quote(context, request.path, request.resolution, signal);
  if (request.action === "start") return start(context, request, signal);
  return status(context, request.taskId, signal);
}

const plugin: ToolPlugin = {
  validateConfig: config => configSchema.parse(config),
  clientTools: { videoUpscale: handle },
  createTools(context) {
    return [{
      name: "videoUpscale",
      label: "视频升清",
      description: "为工作区视频估算升至 720p、1080p 或 4K 的费用，或查询已有任务。付费提交由用户在视频节点的升清面板中发起。",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["quote", "status"], description: "quote 需 path；status 需已存在任务的 taskId" },
          path: { type: "string", description: "工作区内的视频相对路径" },
          resolution: { type: "string", enum: [...upscaleResolutions], description: "quote 的目标分辨率，默认 720p；status 不传此字段" },
          taskId: { type: "string", description: "升清面板保存的任务 UUID" },
        },
        required: ["action"], additionalProperties: false,
      },
      async execute(_id, args, signal) {
        const details = await handle(context, querySchema.parse(args), signal);
        return { content: [{ type: "text", text: JSON.stringify(details) }], details };
      },
    }];
  },
};

export default plugin;
