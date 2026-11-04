import { z } from "zod";

const relativePathSchema = z.string().min(1).max(4096).regex(
  /^(?!\.{1,2}(?:\/|$))(?!.*\/\.{1,2}(?:\/|$))[^/\\:\u0000-\u001f\u007f]+(?:\/[^/\\:\u0000-\u001f\u007f]+)*$/,
  "请使用以 / 分隔的相对路径，不能包含空路径段、.、..、盘符或控制字符",
);

export const sandboxRequestSchema = z.object({
  command: z.string().min(1).max(20000).describe("在 /workspace 执行的 Bash 脚本；JavaScript 使用 js-exec，Python 使用 python3"),
  files: z.array(z.object({
    path: relativePathSchema.describe("相对于虚拟 /workspace 的文件路径，例如 script.py"),
    content: z.string().max(1024 * 1024).describe("文件完整文本内容"),
  }).strict()).max(32).optional().describe("在本次沙盒中创建的文本文件"),
  imports: z.array(z.object({
    path: z.string().min(1).max(4096).describe("工作区相对文件路径，或 skillOperator 返回的全局技能文件绝对路径"),
    target: relativePathSchema.describe("导入后相对于虚拟 /workspace 的文件路径"),
  }).strict()).max(32).optional().describe("本次运行需要读取的文件；不会自动导入整个目录或脚本依赖"),
  exports: z.array(z.object({
    path: relativePathSchema.describe("待导出的文件，相对于虚拟 /workspace"),
    target: relativePathSchema.describe("保存位置，相对于当前工作区；自动创建缺失的父目录"),
    overwrite: z.boolean().optional().default(false).describe("是否允许覆盖已有工作区文件，默认只允许新建"),
  }).strict()).max(32).optional().describe("仅在命令成功后写回工作区的文件；未列出的文件随本次沙盒销毁"),
  timeoutMs: z.number().int().min(1).max(60000).optional().default(30000).describe("执行超时，单位毫秒，默认 30000，最多 60000"),
}).strict();

export type SandboxRequest = z.infer<typeof sandboxRequestSchema>;
