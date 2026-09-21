import { lstat, readFile, realpath, stat } from "node:fs/promises";
import { relative } from "node:path";
import type { ToolDefinition } from "@earendil-works/pi-coding-agent";
import { z } from "zod";
import { getStatus } from "@/utils/media/ffmpeg";
import { convertMedia, ffmpegOptionsSchema, maxMediaBytes } from "@/utils/media/ffmpegProcessor";
import { lockWorkspaceFiles, resolveWorkspacePath, writeWorkspaceFile } from "@/utils/workspace/files";

const parameters = z.strictObject({
  input: z.string().min(1).max(4096).describe("工作区内的输入媒体文件相对路径"),
  output: z.string().min(1).max(4096).describe("工作区内的新输出文件相对路径，父目录须已存在，不能覆盖文件"),
  options: ffmpegOptionsSchema,
});

export async function createFfmpegTool(cwd: string): Promise<ToolDefinition | undefined> {
  const { tools } = await getStatus();
  if (!tools.ffmpeg.path || tools.ffmpeg.error) return;
  const directory = await realpath(cwd);
  return {
    name: "ffmpeg",
    label: "处理媒体",
    description: "使用本机 FFmpeg 对工作区媒体进行转码、按秒裁剪、缩放、水平或垂直翻转、截取单帧、提取音轨或静音。翻转设置 options.vf 为 hflip（左右镜像）或 vflip（上下镜像）。输入输出各不超过 100 MB；输出仅新建文件，父目录须存在。路径必须相对当前工作区，不支持 URL、绝对路径或任意命令。使用字节管道，需要随机寻址的输入可能无法转换。",
    promptSnippet: "使用 ffmpeg 处理工作区媒体；保留原素材，将结果写入新的相对路径。",
    parameters: z.toJSONSchema(parameters, { io: "input", target: "draft-07" }),
    executionMode: "sequential",
    async execute(_id, params, signal) {
      signal?.throwIfAborted();
      const args = parameters.parse(params);
      const input = await resolveWorkspacePath(directory, args.input);
      const output = await resolveWorkspacePath(directory, args.output);
      const release = lockWorkspaceFiles([input.path, output.path]);
      try {
        const exists = await lstat(output.path).catch((error: NodeJS.ErrnoException) => {
          if (error.code === "ENOENT") return null;
          throw error;
        });
        if (exists) throw new Error("输出文件或目录已存在，请使用新的文件名");
        const info = await stat(input.path);
        if (!info.isFile() || !info.size || info.size > maxMediaBytes) throw new Error("输入必须是工作区内非空且不超过 100 MB 的普通文件");
        const result = await convertMedia(await readFile(input.path, { signal }), args.options, signal);
        // 转换期间目录可能变化，落盘前再次检查真实路径；沿用工作区原子写入且不覆盖。
        const target = await resolveWorkspacePath(directory, relative(directory, output.path));
        signal?.throwIfAborted();
        await writeWorkspaceFile(target.path, result.data, true);
        const details = { path: relative(directory, target.path).replaceAll("\\", "/"), mimeType: result.mimeType };
        return { content: [{ type: "text", text: JSON.stringify(details) }], details };
      } finally { release(); }
    },
  };
}
