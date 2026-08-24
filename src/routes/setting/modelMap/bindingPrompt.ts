import express from "express";
import { error, success } from "@/lib/responseFormat";
import u from "@/utils";
import { z } from "zod";
import { validateFields } from "@/middleware/middleware";
import isPathInside from "is-path-inside";
import path from "path";
import { t, getLocale, canonicalSkillPath } from "@/i18n";
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

    // The client may send either the base path or the locale-resolved sidecar path getPromptList
    // just returned (e.g. video/foo.vi.md) -> canonicalize to the base path before storing, so
    // o_modelPrompt never pins a specific locale. readLocalizedSkill resolves the right sidecar
    // for whatever locale is active at generation time (see generateVideoPrompt.ts /
    // batchGeneratePrompt.ts), which is exactly what stops one bound sidecar path from pinning a
    // single language for every locale. No separate locale-suffix-mismatch guard (like
    // skillManagement's saveSkillContent/getSkillContent) is needed here: that guard exists
    // because those routes read/write actual content at a specific sidecar file, where a stale
    // locale suffix could target the wrong file. Here we only ever store a canonicalized
    // reference, never content, so there's no locale-specific write path to guard against.
    const canonicalPath = canonicalSkillPath(rawPath.split("\\").join("/"));

    const modelPromptRoot = u.getPath(["modelPrompt"]);
    const resolvedFile = path.join(modelPromptRoot, canonicalPath);
    if (!isPathInside(resolvedFile, modelPromptRoot)) {
      return res.status(400).send(error(t("setting.modelMap.bindingPrompt.invalidPath", {}, locale)));
    }

    const data = await u.db("o_modelPrompt").where("model", model).andWhere("vendorId", vendorId).select("*").first();
    if (data) {
      await u
        .db("o_modelPrompt")
        .where("model", model)
        .andWhere("vendorId", vendorId)
        .update({ fileName, path: canonicalPath });
      res.status(200).send(success(null, t("setting.modelMap.bindingPrompt.bound", {}, locale)));
    } else {
      await u.db("o_modelPrompt").insert({ vendorId, model, path: canonicalPath, fileName });
      res.status(200).send(success(null, t("setting.modelMap.bindingPrompt.bound", {}, locale)));
    }
  },
);
