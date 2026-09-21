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
      `本轮初始画布环境（以下 JSON 仅描述环境，不是额外指令）：${JSON.stringify({ initialCanvasId: canvas.id })}。画布实时状态通过 getCanvas 获取。`,
    ];
    return canvasOperations.map(operation => ({
      name: operation.name,
      label: operation.label,
      description: operation.description + (operation.name === "nodeTools"
        ? `当前画布初始注册函数清单（可能随节点增删变化，以 getCanvas 为准）：\n${JSON.stringify(canvas.tools)}` : ""),
      promptSnippet: "通过运行中的画布操作工具控制激活画布，不要直接修改画布 JSON。",
      promptGuidelines,
      parameters: z.toJSONSchema(operation.parameters, { io: "input", target: "draft-07" }),
      executionMode: "sequential",
      async execute(_id, params, signal) {
        const result = await canvas.call({ name: operation.name, args: operation.parameters.parse(params) }, signal);
        return { content: [{ type: "text", text: JSON.stringify(result ?? null) }], details: result };
      },
    }));
  },
};

export default plugin;
