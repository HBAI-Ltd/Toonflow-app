import { z } from "zod";
import type { ToolDefinition } from "@earendil-works/pi-coding-agent";
import type { QuestionContext, QuestionRequest } from "@toonflow/tools-scaffold/runtime";
import { translateMessage } from "@/lib/i18n";
import { searchPluginMarketSchema, installMarketPluginSchema, searchPluginMarket, resolveMarketPlugin, installMarketPlugin } from "@/lib/pluginMarket";

export function createPluginMarketTools(question?: QuestionContext): ToolDefinition[] {
  return [{
    name: "searchPluginMarket", label: "搜索插件市场",
    description: "按关键词或类型搜索 Toonflow 插件市场，返回可用于安装的市场条目 ID。",
    parameters: z.toJSONSchema(searchPluginMarketSchema, { io: "input", target: "draft-07" }),
    async execute(_id, params, signal) {
      const details = await searchPluginMarket(params, signal);
      return { content: [{ type: "text", text: JSON.stringify(details) }], details };
    },
  }, {
    name: "installMarketPlugin", label: "安装市场插件",
    description: "按搜索结果的 ID 请求安装单个市场插件。等待本机用户在 Toonflow 中确认后下载并安装。用户取消后不要再次申请同一插件。",
    parameters: z.toJSONSchema(installMarketPluginSchema, { io: "input", target: "draft-07" }),
    executionMode: "sequential",
    async execute(toolCallId, params, signal) {
      if (!question) throw new Error("请先打开 Toonflow 桌面或网页");
      const plugin = resolveMarketPlugin(params, signal);
      const types = { node: "节点", tool: "工具", skill: "技能", ext: "文件扩展", agent: "Agent" };
      const request: QuestionRequest & { requiresLocalApproval: true } = {
        requiresLocalApproval: true,
        title: translateMessage("安装插件"),
        question: [
          [translateMessage("插件市场"), translateMessage(types[plugin.type]), plugin.name, plugin.version].filter(Boolean).join(" · "),
          plugin.fileName,
          plugin.supplier && `${translateMessage("供应商")} · ${plugin.supplier}`,
          translateMessage("插件可能执行代码并访问本地文件，请仅安装信任来源的插件。"),
        ].filter(Boolean).join("\n"),
        fields: [{ field: "approved", title: translateMessage("确认安装"), type: "switch", required: true }],
      };
      const answer = await question.ask(toolCallId, request, signal);
      signal?.throwIfAborted();
      const details = !answer.skipped && answer.values?.approved === true
        ? { ...await installMarketPlugin(plugin, signal), installed: true }
        : { installed: false, reason: "userDeclined" };
      return { content: [{ type: "text", text: JSON.stringify(details) }], details };
    },
  }];
}
