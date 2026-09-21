import { createToolConfig } from "@toonflow/tools-scaffold";

await createToolConfig({
  name: "askUser",
  displayName: "提问器",
  description: "一次向用户提出一个或多个问题，支持回答或跳过本次提问。",
  author: "Toonflow",
  github: "https://github.com/HBAI-Ltd/Toonflow-app",
  prompt: `问题简短具体，相关问题合并提问。问题默认允许留空，不必把每项都设为 required。
参数校验失败表示表单尚未生成，读取工具返回的错误，修正参数并重新调用 askUser；不要让用户排查技术错误，也不要把失败当作已回答、已跳过或已授权。
等待用户提交回答或明确跳过，不模拟答案，也不把没有操作当作已经跳过。返回 skipped: true 只表示用户跳过了本次提问；多问题的 values 只包含已提交的答案。普通补充信息被跳过或部分未回答时，可基于已有信息和合理假设继续；缺少不可推断的必要信息时说明具体限制。阶段确认被跳过时保留当前成果，暂停依赖该决定的后续制作，不自动通过该阶段，也不循环追问。跳过、取消或未回答都不表示同意或授权。不为可合理推断的细节反复中断工作。注意末尾必须要留一个其他的输入框来让用户能够补充信息。`,
  configRules: [],
  components: { askUser: "src/questionCard.vue" },
}, import.meta.url);
