import express from "express";
import u from "@/utils";
import fs from "node:fs/promises";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();

// 删除导演手册
export default router.post(
  "/",
  validateFields({
    name: z.string(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    try {
      const { name } = req.body as { name: string };

      // 安全校验：不允许包含路径分隔符、纯数字，防止越级删除或误删项目目录
      if (name.includes("/") || name.includes("\\") || name === "." || name === ".." || /^\d+$/.test(name)) {
        res.status(400).send(error(t("project.manual.invalidName", {}, locale)));
        return;
      }

      const artPromptsDir = u.getPath(["skills", "story_skills", name]);

      try {
        const stat = await fs.stat(artPromptsDir);
        if (!stat.isDirectory()) {
          throw new Error(t("project.manual.notFolder", { path: artPromptsDir }, locale));
        }
        await fs.rm(artPromptsDir, { recursive: true, force: true });
      } catch (e) {
        console.error("[Delete director manual] Delete failed:", artPromptsDir, e);
      }
      res.status(200).send(success({ message: t("project.manual.deleted", {}, locale) }));
    } catch (err) {
      res.status(500).send(error(u.error(err).message || t("project.manual.deleteFailedFallback", {}, locale)));
    }
  },
);
