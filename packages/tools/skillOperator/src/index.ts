import { z } from "zod";
import type { ToolPlugin } from "@toonflow/tools-scaffold/runtime";

const configSchema = z.object({
  allowRead: z.boolean().default(true),
  allowCreate: z.boolean().default(true),
  allowUpdate: z.boolean().default(true),
}).strict();

const plugin: ToolPlugin = {
  validateConfig: config => configSchema.parse(config),
  createTools({ config, skills }) {
    if (!skills) return [];
    const { allowRead, allowCreate, allowUpdate } = configSchema.parse(config);
    const actions: ["list", ...("read" | "create" | "update")[]] = ["list"];
    if (allowRead) actions.push("read");
    if (allowCreate) actions.push("create");
    if (allowUpdate) actions.push("update");
    const requestSchema = z.object({
      action: z.enum(actions),
      name: z.string().trim().min(1).max(128).optional().describe("技能名称，read/create/update 必填；新技能使用小驼峰名称"),
      scope: z.enum(["workspace", "global"]).optional().describe("workspace 为当前工作区 skill，global 为全局技能；新建默认 workspace，其他操作默认按同名技能优先级选择"),
      path: z.string().min(1).max(4096).optional().describe("相对于该技能目录的文件路径，默认 SKILL.md；可指定 references 中的资料文件，不带章节锚点"),
      content: z.string().max(200000).optional().describe("create/update 必填：文件完整内容；SKILL.md 必须包含 name 和 description 的 YAML frontmatter"),
    }).strict();
    return [{
      name: "skillOperator",
      label: "Skill 操作器",
      description: `统一管理技能。当前允许的操作：${actions.join("、")}。list 实时返回技能目录，可用 scope 查询被同名工作区技能覆盖的全局版本；read 读取正文或资料；create 新建技能或资料且不覆盖；update 用完整内容修改已有文件。除 list 外必填 name，写入还需 content。新建技能先创建 SKILL.md。`,
      promptSnippet: "按需查询技能目录，读取并维护技能及其附带资料。",
      promptGuidelines: allowRead ? [
        "每次接到任务，先用 skillOperator(action=list) 检查技能名称和描述。任务匹配技能时，先用 action=read 读取 SKILL.md 再开始实质工作；disableModelInvocation=true 的技能仅在用户明确指定时读取使用。普通聊天或没有匹配项时不强行套用技能。",
        "按当前阶段读取所需 references。相对链接以当前文档目录解析，再换算成相对于该技能根目录的 path，去掉章节锚点。跨技能引用先 list 确认目标名称及 scope，不能假定全局与工作区技能同级。",
        "已在当前上下文完整读取且适用的技能可以复用。简短说明采用的技能，遵循其阶段和用户要求；只有目录或旧对话摘要不算读取正文，文件不可读时说明缺项，不假称已读取。",
      ] : ["Skill 操作器的正文读取权限已关闭；list 仅提供目录，不代表已经读取或采用技能。"],
      parameters: z.toJSONSchema(requestSchema, { io: "input", target: "draft-07" }),
      executionMode: "sequential",
      async execute(_id, params, signal) {
        const { action, name, scope, path, content } = requestSchema.parse(params);
        signal?.throwIfAborted();
        let result;
        if (action === "list") {
          result = { skills: skills.list(scope) };
        } else {
          if (!name) throw new Error("请提供技能名称 name");
          const location = { name, scope, path };
          if (action === "read") result = await skills.read(location, signal);
          else {
            if (content === undefined) throw new Error("请提供文件完整内容 content");
            result = await skills[action]({ ...location, content }, signal);
          }
        }
        return { content: [{ type: "text", text: JSON.stringify(result) }], details: result };
      },
    }];
  },
};

export default plugin;
