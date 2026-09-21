import { createToolConfig } from "@toonflow/tools-scaffold";

await createToolConfig({
  name: "workspace",
  displayName: "工作区文件",
  description: "读取、列出和编辑当前工作区内的文件。",
  prompt: `路径相对于当前工作区解析。文件修改不得越出工作区；全局技能目录只允许读取技能及其附带资料。
修改已有文件前先读取相关内容，避免覆盖用户已有修改。
存在与任务匹配的可用技能时，先阅读技能目录中的 SKILL.md，再按需读取其引用的本地资料；不要一次加载全部技能，也不要只凭名称猜测技能内容。`,
  author: "Toonflow",
  github: "https://github.com/HBAI-Ltd/Toonflow-app",
  configRules: [
    { type: "switch", field: "readOnly", title: "只读模式", value: false, info: "开启后只允许读取文件和列出目录。" },
  ],
}, import.meta.url);
