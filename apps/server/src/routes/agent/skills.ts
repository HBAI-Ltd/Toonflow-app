import { parseFrontmatter } from "@earendil-works/pi-coding-agent";
import { readFile } from "@toonflow/file";
import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().get("/", validateFields({ directory: z.string().min(1).max(4096) }, "query"), async (req, res) => {
  const cwd = await u.workspace.resolveWorkspace(req, req.query.directory as string);
  const { skills } = u.agent.loadAgentSkills(cwd);
  const items = await Promise.all(skills.map(async ({ name, description, filePath }) => {
    const { frontmatter } = parseFrontmatter(await readFile(filePath, "utf8"));
    const metadata = frontmatter.metadata && typeof frontmatter.metadata === "object" && !Array.isArray(frontmatter.metadata)
      ? frontmatter.metadata as Record<string, unknown> : {};
    return {
      name,
      displayName: typeof metadata.displayName === "string" && metadata.displayName.trim() ? metadata.displayName : name,
      description,
    };
  }));
  res.set("Cache-Control", "no-store");
  res.json(success(items));
});
