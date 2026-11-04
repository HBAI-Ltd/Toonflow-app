import { z } from "zod";
import type { ToolPlugin } from "@toonflow/tools-scaffold/runtime";
import { pluginDevelopmentSchema } from "./runtime";

export { develop as developPlugin } from "./development";

const plugin: ToolPlugin = {
  validateConfig(config) {
    if (Object.keys(config).length) throw new Error("插件开发工具没有配置项");
    return {};
  },
  createTools({ canvas }) {
    if (!canvas) return [];
    return [{
      name: "developPlugin",
      label: "开发插件",
      description: "在桌面端或服务器本机开发插件。guide 读取节点或工具 SDK 文档；build 编译工作区项目；install 安装最近成功构建的产物并刷新画布；upload 在已登录账号下为新插件打开预填的市场上传表单，无需先安装。用户在表单中提交审核。path 始终是项目目录。",
      parameters: z.toJSONSchema(pluginDevelopmentSchema, { io: "input", target: "draft-07" }),
      executionMode: "sequential",
      async execute(_id, params, signal) {
        const result = await canvas.call({ name: "developPlugin", args: pluginDevelopmentSchema.parse(params) }, signal);
        return { content: [{ type: "text", text: JSON.stringify(result ?? null) }], details: result };
      },
    }];
  },
};

export default plugin;
