// ACT: 当前 Markdown 使用纯文本着色；保留库的 Web 入口，避免携带完整语言集。
export * from "shiki/bundle/web";
export { createJavaScriptRegexEngine } from "shiki/engine/javascript";
