import { loadSkillsFromDir, parseFrontmatter } from "@earendil-works/pi-coding-agent";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Router } from "express";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

const router = Router();

export default router.get("/", async (_req, res) => {
  const { skills } = loadSkillsFromDir({ dir: resolve(dirname(u.conf.path), "skills"), source: "user" });
  const items = await Promise.all(skills.map(async (skill) => {
    const { frontmatter } = parseFrontmatter(await readFile(skill.filePath, "utf8"));
    const metadata = frontmatter.metadata && typeof frontmatter.metadata === "object" && !Array.isArray(frontmatter.metadata)
      ? frontmatter.metadata as Record<string, unknown> : {};
    let github = "";
    if (typeof metadata.github === "string" && URL.canParse(metadata.github)) {
      const url = new URL(metadata.github);
      if (url.origin === "https://github.com" && !url.username && !url.password) github = url.href;
    }
    return {
      name: skill.name,
      version: typeof metadata.version === "string" ? metadata.version.trim() : "",
      displayName: typeof metadata.displayName === "string" && metadata.displayName.trim() ? metadata.displayName : skill.name,
      description: skill.description,
      author: typeof metadata.author === "string" ? metadata.author : "",
      github,
    };
  }));
  res.json(success(items.sort((left, right) => left.name.localeCompare(right.name))));
});
