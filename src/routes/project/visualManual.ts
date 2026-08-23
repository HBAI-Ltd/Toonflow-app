import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import getPath from "@/utils/getPath";
import fs from "fs";
import path from "path";
import { t, getLocale } from "@/i18n";
const router = express.Router();

// 视觉手册
export default router.post(
  "/",
  validateFields({
    type: z.string(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { type } = req.body;
    const basePath = getPath(["skills", "art_skills", "chinese_sweet_romance"]);
    // 递归查找 basePath 下名为 `${type}.md` 的文件
    const findFile = (dir: string, target: string): string | null => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const found = findFile(fullPath, target);
          if (found) return found;
        } else if (entry.isFile() && entry.name === target) {
          return fullPath;
        }
      }
      return null;
    };
    const filePath = findFile(basePath, `${type}.md`);
    if (!filePath) {
      res.status(404).json({ error: t("project.visualManual.fileNotFound", { type }, locale) });
      return;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    res.status(200).send(success(content));
  },
);
