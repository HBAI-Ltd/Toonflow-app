import express from "express";
import { error, success } from "@/lib/responseFormat";
import u from "@/utils";
import { z } from "zod";
import { validateFields } from "@/middleware/middleware";
import isPathInside from "is-path-inside";
import path from "path";
import { t, getLocale, canonicalSkillPath, skillPathLocale } from "@/i18n";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    vendorId: z.string(),
    model: z.string(),
    path: z.string(),
    fileName: z.string(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { vendorId, model, path: rawPath, fileName } = req.body;

    // getPromptList.ts (Settings → Model Map) returns two kinds of path for a prompt file: the
    // canonical (unsuffixed) path — "follow the prompt_language setting" — and, one per language
    // variant actually on disk, an explicit locale-suffixed path (e.g. video/foo.en.md) — "pin
    // this language for this model". Picking one of those explicit-language entries is a
    // deliberate choice a user makes from a clearly labelled list, so — unlike the earlier
    // canonicalize-everything behaviour — it's stored as-is here and honoured as a pin by
    // generateVideoPrompt.ts/batchGeneratePrompt.ts (via skillPathLocale). Only a path with no
    // locale suffix gets canonicalized, so the base/canonical form is what's actually stored for
    // "follow the setting", never a client-supplied variant that happens to already be canonical
    // shaped. The clear labelling in getPromptList.ts is what stops this from happening by
    // accident — see that file's comments.
    const normalizedPath = rawPath.split("\\").join("/");
    const pinnedLocale = skillPathLocale(normalizedPath);
    const storedPath = pinnedLocale ? normalizedPath : canonicalSkillPath(normalizedPath);

    const modelPromptRoot = u.getPath(["modelPrompt"]);
    const resolvedFile = path.join(modelPromptRoot, storedPath);
    if (!isPathInside(resolvedFile, modelPromptRoot)) {
      return res.status(400).send(error(t("setting.modelMap.bindingPrompt.invalidPath", {}, locale)));
    }

    const data = await u.db("o_modelPrompt").where("model", model).andWhere("vendorId", vendorId).select("*").first();
    if (data) {
      await u
        .db("o_modelPrompt")
        .where("model", model)
        .andWhere("vendorId", vendorId)
        .update({ fileName, path: storedPath });
      res.status(200).send(success(null, t("setting.modelMap.bindingPrompt.bound", {}, locale)));
    } else {
      await u.db("o_modelPrompt").insert({ vendorId, model, path: storedPath, fileName });
      res.status(200).send(success(null, t("setting.modelMap.bindingPrompt.bound", {}, locale)));
    }
  },
);
