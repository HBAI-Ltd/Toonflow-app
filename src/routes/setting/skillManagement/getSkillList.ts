import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import fg from "fast-glob";
import path from "path";
import u from "@/utils";
import { getLocale, canonicalSkillPath, resolveSkillReadPath } from "@/i18n";

const router = express.Router();

export default router.post("/", async (req, res) => {
  const locale = await getLocale(req as any);
  const skillsRoot = u.getPath(["skills"]);

  const entries = await fg("**/*.md", {
    cwd: skillsRoot.replace(/\\/g, "/"),
    onlyFiles: true,
  });

  // Một skill có thể có tới 3 file trên đĩa (bản gốc .md + sidecar .en.md/.vi.md),
  // nhưng chỉ là một skill với người dùng -> quy tất cả về bản gốc rồi loại trùng.
  const canonicalPaths = Array.from(new Set(entries.map((relPath) => canonicalSkillPath(relPath)))).sort();

  // Với mỗi skill, trả về đúng đường dẫn locale hiện tại sẽ sửa: sidecar nếu đã có,
  // không thì bản gốc. Đây cũng là nhãn "đang xem ngôn ngữ nào" hiển thị trên UI.
  const result = canonicalPaths.map((relPath) => {
    const abs = path.join(skillsRoot, relPath);
    const resolvedAbs = resolveSkillReadPath(abs, locale);
    return path.relative(skillsRoot, resolvedAbs).split(path.sep).join("/");
  });

  res.status(200).send(success(result));
});
