import express from "express";
import { error, success } from "@/lib/responseFormat";
import u from "@/utils";
import { z } from "zod";
import { validateFields } from "@/middleware/middleware";
import fs from "fs/promises";
import path from "path";
import { t, getLocale } from "@/i18n";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    path: z.string(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { path: filePath } = req.body;

    const modelPromptRoot = u.getPath(["modelPrompt"]);

    // 路径隧穿检测
    const resolvedRoot = path.resolve(modelPromptRoot);
    const resolvedFile = path.resolve(modelPromptRoot, filePath);
    if (!resolvedFile.startsWith(resolvedRoot + path.sep)) {
      return res.status(400).send(error(t("setting.modelMap.deletePrompt.invalidPath", {}, locale)));
    }

    // 文件不存在则报错
    try {
      await fs.access(resolvedFile);
    } catch {
      return res.status(404).send(error(t("setting.modelMap.deletePrompt.fileNotFound", {}, locale)));
    }

    await fs.unlink(resolvedFile);
    res.status(200).send(success(null, t("setting.modelMap.deletePrompt.deleted", {}, locale)));
  },
);
