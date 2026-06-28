import { Tool } from "ai";

/**
 * 包装工具集以统计实际执行次数。
 * 用于强制"审核必须基于工具实证"：监督层若零工具调用，其结论应判为无效。
 */
export function createToolUseCounter(tools: Record<string, Tool>): {
  tools: Record<string, Tool>;
  getCount: () => number;
  getToolCount: (name: string) => number;
} {
  let count = 0;
  const counts: Record<string, number> = {};
  const wrapped = Object.fromEntries(
    Object.entries(tools).map(([name, t]) => {
      if (typeof t.execute !== "function") return [name, t];
      const originalExecute = t.execute.bind(t);
      return [
        name,
        {
          ...t,
          execute: async (...args: Parameters<NonNullable<Tool["execute"]>>) => {
            count++;
            counts[name] = (counts[name] ?? 0) + 1;
            return originalExecute(...args);
          },
        },
      ];
    }),
  );
  return { tools: wrapped, getCount: () => count, getToolCount: (name) => counts[name] ?? 0 };
}

export const SUPERVISION_INVALID_MESSAGE = [
  "【审核无效】监督层在本次审核中没有调用任何数据工具（如 get_planData / get_novel_events），",
  "违反了「工具调取优先，不得凭记忆审核」的硬性规则，其结论已被系统作废且未入档。",
  "请重新派发审核任务，并在任务描述中明确要求先调用工具获取实际数据。",
].join("");
