import type { z } from "@toonflow/nodes-scaffold/runtime";

// ACT: 工具参数不合规时给中文说明（字段路径+原因），不把zod的原始JSON抛给模型或显示给用户。
export function describeToolArgsError(name: string, error: z.ZodError) {
  const issues = error.issues.slice(0, 6).map(issue => {
    const path = issue.path.length ? issue.path.join(".") : "参数";
    switch (issue.code) {
      case "too_big": return issue.origin === "array" || issue.origin === "set" ? `${path}最多${issue.maximum}项` : issue.origin === "string" ? `${path}最多${issue.maximum}个字` : `${path}不能超过${issue.maximum}`;
      case "too_small": return issue.origin === "array" || issue.origin === "set" ? `${path}至少${issue.minimum}项` : issue.origin === "string" ? `${path}至少${issue.minimum}个字` : `${path}不能小于${issue.minimum}`;
      case "invalid_type": return `${path}应为${issue.expected}`;
      case "unrecognized_keys": return `${path}有不支持的字段：${issue.keys.join("、")}`;
      case "invalid_value": return `${path}只能取${issue.values.map(value => JSON.stringify(value)).join("/")}`;
      default: return `${path}：${issue.message}`;
    }
  });
  return `${name}参数不符合要求：${issues.join("；")}${error.issues.length > 6 ? "等" : ""}`;
}

export function parseToolArgs<Schema extends z.ZodType>(name: string, schema: Schema, value: unknown): z.output<Schema> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  throw new Error(describeToolArgsError(name, result.error));
}
