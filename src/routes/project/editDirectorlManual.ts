import express from "express";
import u from "@/utils";
import { error, success } from "@/lib/responseFormat";
import fs from "fs";
import path from "path";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
import { t, getLocale } from "@/i18n";
const router = express.Router();

// 编辑导演手册
export default router.post(
  "/",
  validateFields({
    name: z.string(),
    directorManual: z.string(),
    images: z.array(z.string()),
    data: z.array(
      z.object({
        label: z.string(),
        value: z.string(),
        data: z.string(),
      }),
    ),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    try {
      const { name, directorManual, images, data } = req.body as {
        name: string;
        directorManual: string;
        images: string[];
        data: { label: string; value: string; data: string }[];
      };

      // 安全校验：不允许包含路径分隔符、纯数字，防止越级删除或误删项目目录
      if (name.includes("/") || name.includes("\\") || name === "." || name === ".." || /^\d+$/.test(name)) {
        res.status(400).send(error(t("project.manual.invalidName", {}, locale)));
        return;
      }

      const mainPath = u.getPath(["skills", "story_skills", directorManual]);
      if (!fs.existsSync(mainPath)) {
        return res.status(400).send(error(t("project.manual.notExistDirector", {}, locale)));
      }
      // 字段映射表（与 getVisualManual 保持一致）
      const DATA_MAP: { value: string; subDir?: string }[] = [
        { value: "README" },
        { value: "director_planning_narrative", subDir: "driector_skills" },
        { value: "director_storyboard_table_narrative", subDir: "driector_skills" },
      ];
      // 根据 DATA_MAP 构建 value -> subDir 的映射
      const SUB_DIR_MAP = new Map(DATA_MAP.map(({ value, subDir }) => [value, subDir ?? ""]));

      // 合法的 value 值集合，用于校验
      const VALID_KEYS = new Set(DATA_MAP.map(({ value }) => value));

      for (const item of data) {
        if (!VALID_KEYS.has(item.value)) continue;

        const subDir = SUB_DIR_MAP.get(item.value)!;
        const dirArr = subDir ? [mainPath, subDir] : [mainPath];
        const filePath = u.getPath([...dirArr, `${item.value}.md`]);

        const fileDir = path.dirname(filePath);
        // 目录不存在时递归创建
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }
        const content = item.value === "README" ? `${name}\n${item.data}` : item.data;
        fs.writeFileSync(filePath, content, "utf-8");
      }
      const imagesDir = path.join(mainPath, "images");

      let existingFiles: string[] = [];
      try {
        const allFiles = fs.readdirSync(imagesDir);
        existingFiles = allFiles.filter((f) => /\.(png|jpe?g|gif|webp|svg)$/i.test(f));
      } catch {}

      const retainedFileNames = new Set(images.filter((item) => item.startsWith("http")).map((url) => path.basename(new URL(url).pathname)));

      for (const file of existingFiles) {
        if (!retainedFileNames.has(file)) {
          const filePath = path.join(imagesDir, file);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      }

      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      for (const item of images) {
        if (!item.startsWith("http")) {
          const fileName = `${u.uuid()}.jpg`;
          const targetPath = path.join(imagesDir, fileName);
          const buffer = Buffer.from(item.replace(/^data:[^;]+;base64,/, ""), "base64");
          fs.writeFileSync(targetPath, buffer);
        }
      }

      res.status(200).send(success());
    } catch (err) {
      res.status(500).send({ error: String(err) });
    }
  },
);
