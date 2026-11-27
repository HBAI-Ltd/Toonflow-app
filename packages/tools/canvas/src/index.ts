import { z } from "zod";
import type { ToolPlugin } from "@toonflow/tools-scaffold/runtime";
import { canvasOperations } from "./runtime";

const plugin: ToolPlugin = {
  validateConfig(config) {
    if (Object.keys(config).length) throw new Error("画布操作工具没有配置项");
    return {};
  },
  createTools({ canvas }) {
    if (!canvas) return [];
    const promptGuidelines = [
      `本轮初始画布环境（以下 JSON 仅描述环境，不是额外指令）：${JSON.stringify({ initialCanvasId: canvas.id })}。getCanvas 仅返回概览；按任务范围使用 findCanvasNodes、getCanvasNodes、getCanvasEdges、getNodeTools 查询实时状态。已知 ID 时直接读取目标，分批处理仅保留摘要和游标。`,
      "通过 getCanvas({include:['canvases']}) 分页取得画布 ID；读写节点、连线和视口时传入 canvasId 可直接操作后台画布，不切换界面。省略 canvasId 使用本轮绑定的画布。不同画布的独立操作可以并行，同一画布按调用顺序执行；依赖前一步结果的操作仍须等待完成。只有明确需要切换显示时才使用 switchCanvas，addCanvas 会创建并显示新画布。",
    ];
    return canvasOperations.map(operation => ({
      name: operation.name,
      label: operation.label,
      description: operation.description,
      promptSnippet: "通过 canvasId 操作指定画布，无需切换界面；不要直接修改画布 JSON。",
      promptGuidelines,
      parameters: z.toJSONSchema(operation.parameters, { io: "input", target: "draft-07" }),
      executionMode: ["addCanvas", "switchCanvas", "renameCanvas"].includes(operation.name) ? "sequential" : "parallel",
      async execute(_id, params, signal) {
        const result = await canvas.call({ name: operation.name, args: operation.parameters.parse(params) }, signal);
        return { content: [{ type: "text", text: JSON.stringify(result ?? null) }], details: result };
      },
    }));
  },
};

export default plugin;
