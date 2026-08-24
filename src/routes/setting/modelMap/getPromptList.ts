import express from "express";
import { success } from "@/lib/responseFormat";
import u from "@/utils";
import fg from "fast-glob";
import path from "path";
import { getLocale, canonicalSkillPath, resolveSkillReadPath, readLocalizedSkill } from "@/i18n";
const router = express.Router();

export default router.get("/", async (req, res) => {
  const locale = await getLocale(req as any);
  const modelPromptRoot = u.getPath(["modelPrompt"]);

  const entries = await fg("**/*.md", {
    cwd: modelPromptRoot.replace(/\\/g, "/"),
    onlyFiles: true,
  });

  // A prompt file can have up to 3 files on disk (original .md + .en.md/.vi.md translation
  // sidecars), but is a single binding candidate to the user -> canonicalize to the original and
  // dedupe before listing (mirrors getSkillList.ts).
  const canonicalPaths = Array.from(new Set(entries.map((relPath) => canonicalSkillPath(relPath)))).sort();

  const result = canonicalPaths.map((relPath) => {
    const abs = path.join(modelPromptRoot, relPath);
    // Path shown/bound is the one the active locale would actually read: sidecar if it exists,
    // otherwise the original. Content is read through the same locale resolution rather than
    // whatever the glob happened to return, so the preview always matches what generation uses.
    const resolvedAbs = resolveSkillReadPath(abs, locale);
    const resolvedRelPath = path.relative(modelPromptRoot, resolvedAbs).split(path.sep).join("/");
    const content = readLocalizedSkill(abs, locale);
    const name = path.basename(relPath, ".md");
    const type = relPath.includes("/") ? relPath.split("/")[0] : "";
    return { path: resolvedRelPath, name, type, data: content };
  });

  res.status(200).send(success(result));
});
