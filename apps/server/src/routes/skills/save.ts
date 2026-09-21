import { parseFrontmatter } from "@earendil-works/pi-coding-agent";
import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";

const router = Router();

export default router.put("/", validateFields({
  name: z.string().min(1).max(1024),
  path: z.string().min(1).max(1024).optional(),
  content: z.string(),
}), async (req, res) => {
  if (!u.workspace.isLocalWorkspaceRequest(req)) return res.status(403).json(error("请在桌面端或服务器本机编辑技能", null, 403));
  const { name, path, content } = req.body as { name: string; path?: string; content: string };
  if (Buffer.byteLength(content, "utf8") > u.skillFile.maxBytes) return res.status(413).json(error("技能文件不能超过 20 MB", null, 413));
  if (content.includes("\u0000")) return res.status(400).json(error("内容不能包含空字符", null, 400));
  // ACT: 锁住技能根目录以覆盖扫描与替换，避免同进程安装/文件操作交错；高并发时再细化锁范围。
  const release = u.workspaceFile.lockWorkspaceFiles([u.skillFile.directory()]);
  try {
    const { target, isMain } = await u.skillFile.locate(name, path);
    if (isMain) {
      try {
        const normalized = content.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
        if (!/^---\n[\s\S]*?\n---(?:\n|$)/.test(normalized) || !/^---(?:\n|$)/.test(normalized.slice(normalized.indexOf("\n---", 3) + 1))) {
          throw new Error("frontmatter");
        }
        // SDK 使用 yaml.parse 并向外抛错；不重新序列化，保留原文、注释和换行。
        const { frontmatter } = parseFrontmatter(content);
        z.object({ name: z.literal(name), description: z.string().max(1024).refine(value => Boolean(value.trim())) }).parse(frontmatter);
      } catch {
        return res.status(400).json(error("SKILL.md 必须包含合法 YAML、与原技能相同的字符串 name，以及非空且不超过 1024 字符的 description", null, 400));
      }
    }
    await u.workspaceFile.writeWorkspaceFile(target, content);
    res.json(success(null, "已保存"));
  } finally { release(); }
});