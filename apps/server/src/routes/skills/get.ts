import { loadSkillsFromDir, parseFrontmatter } from "@earendil-works/pi-coding-agent";
import { lstat, readFile } from "@toonflow/file";
import { dirname, relative, resolve, sep } from "node:path";
import { Router } from "express";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

const router = Router();

export default router.get("/", async (req, res) => {
  const skillsDirectory = resolve(dirname(u.conf.path), "skills");
  const { skills } = loadSkillsFromDir({ dir: skillsDirectory, source: "user" });
  const items = await Promise.all(skills.map(async (skill) => {
    const { frontmatter } = parseFrontmatter(await readFile(skill.filePath, "utf8"));
    // ACT: 旧技能没有安装记录，用独占目录创建时间兜底，避免编辑 SKILL.md 后重新排序。
    const baseDir = dirname(skill.filePath);
    const info = await lstat(dirname(baseDir) === skillsDirectory ? baseDir : skill.filePath);
    const metadata = frontmatter.metadata && typeof frontmatter.metadata === "object" && !Array.isArray(frontmatter.metadata)
      ? frontmatter.metadata as Record<string, unknown> : {};
    let github = "";
    if (typeof metadata.github === "string" && URL.canParse(metadata.github)) {
      const url = new URL(metadata.github);
      if (url.origin === "https://github.com" && !url.username && !url.password) github = url.href;
    }
    return {
      name: skill.name,
      marketIdentifiers: u.pluginInstall.getMarketIdentifiers("skill", skill.name),
      installedAt: u.conf.get("pluginInstalledAt", {})[`skill:${skill.name}`] ?? (info.birthtimeMs || info.mtimeMs),
      builtin: req.app.locals.builtinPlugins.skill.has(relative(skillsDirectory, skill.filePath).split(sep)[0]),
      version: typeof metadata.version === "string" ? metadata.version.trim() : "",
      displayName: typeof metadata.displayName === "string" && metadata.displayName.trim() ? metadata.displayName : skill.name,
      description: skill.description,
      author: typeof metadata.author === "string" ? metadata.author : "",
      github,
      enabled: u.skillFile.isEnabled(skill.name),
    };
  }));
  res.json(success(items.sort((left, right) => left.name.localeCompare(right.name))));
});
