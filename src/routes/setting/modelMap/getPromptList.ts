import express from "express";
import { success } from "@/lib/responseFormat";
import u from "@/utils";
import fg from "fast-glob";
import path from "path";
import fs from "fs";
import { t, getLocale, getPromptLanguage, canonicalSkillPath, localizedSkillPath, readLocalizedSkill, LOCALES, FALLBACK_LOCALE } from "@/i18n";
const router = express.Router();

export default router.get("/", async (req, res) => {
  // Labels are read by a person (Settings → Model Map), so they follow content_language.
  const locale = await getLocale(req as any);
  // What the "Default" entry's preview content actually resolves to right now.
  const promptLocale = await getPromptLanguage();
  const modelPromptRoot = u.getPath(["modelPrompt"]);

  const entries = await fg("**/*.md", {
    cwd: modelPromptRoot.replace(/\\/g, "/"),
    onlyFiles: true,
  });
  const entrySet = new Set(entries);

  // A prompt file can have up to 3 files on disk (original .md + .en.md/.vi.md translation
  // sidecars). Group them by canonical path so each group can be expanded into a "follow the
  // prompt-language setting" entry plus one entry per language variant actually present on disk.
  const canonicalPaths = Array.from(new Set(entries.map((relPath) => canonicalSkillPath(relPath)))).sort();

  const result = canonicalPaths.flatMap((canonicalPath) => {
    const name = path.basename(canonicalPath, ".md");
    const type = canonicalPath.includes("/") ? canonicalPath.split("/")[0] : "";

    const items: { path: string; name: string; type: string; data: string }[] = [];

    // Default entry: bound to the canonical (unsuffixed) path. bindingPrompt.ts stores this
    // as-is, and generateVideoPrompt.ts/batchGeneratePrompt.ts resolve it against whatever
    // prompt_language is set at generation time — i.e. it always "follows the setting".
    items.push({
      path: canonicalPath,
      name: t("setting.modelMap.getPromptList.defaultLabel", { name }, locale),
      type,
      data: readLocalizedSkill(path.join(modelPromptRoot, canonicalPath), promptLocale),
    });

    // One entry per language variant actually available on disk. Picking one of these and
    // binding it (see bindingPrompt.ts) pins that language for this model regardless of the
    // prompt_language setting — a deliberate choice the label makes explicit so it can't happen
    // by accident.
    for (const loc of LOCALES) {
      // zh has no sidecar file (it *is* the canonical/original file — see src/i18n/skillPath.ts),
      // so its "variant" path is the canonical path itself. Binding it is therefore
      // indistinguishable from Default at the storage level: it also just resolves via
      // prompt_language, and only actually renders Chinese when prompt_language is "zh" (or no
      // translated sidecar exists for whatever locale is set). It's still listed — the file is a
      // real, available language variant — but it cannot be pinned the way en/vi can.
      const variantRelPath = loc === FALLBACK_LOCALE ? canonicalPath : localizedSkillPath(canonicalPath, loc);
      if (!entrySet.has(variantRelPath)) continue;
      const abs = path.join(modelPromptRoot, variantRelPath);
      items.push({
        path: variantRelPath,
        name: t("setting.modelMap.getPromptList.languageLabel", { name, language: t(`common.locale.${loc}`, {}, locale) }, locale),
        type,
        data: fs.readFileSync(abs, "utf-8"),
      });
    }

    return items;
  });

  res.status(200).send(success(result));
});
