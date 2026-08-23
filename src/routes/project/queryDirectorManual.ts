import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import fs from "fs";
import path from "path";
import { t, getLocale } from "@/i18n";
const router = express.Router();

// 字段映射表
const DATA_MAP: { value: string; subDir?: string }[] = [
  { value: "README" },
  { value: "director_planning_narrative", subDir: "driector_skills" },
  { value: "director_storyboard_table_narrative", subDir: "driector_skills" },
];

// value -> label 的翻译键，README 保留原样
function labelForValue(value: string, locale: import("@/i18n").Locale): string {
  if (value === "README") return "README";
  return t(`project.directorManual.label.${value}`, {}, locale);
}

// 读取 md 文件内容，文件不存在时返回空字符串
function readMd(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

// 获取 images 文件夹下所有图片文件路径列表
async function readAllImages(imagesDir: string) {
  try {
    const ossPath = u.getPath(path.join("skills", "story_skills", imagesDir, "images"));
    const files = fs.readdirSync(ossPath);
    const images = files.filter((f) => /\.(png|jpe?g|gif|webp|svg)$/i.test(f)).map((f) => path.join("story_skills", imagesDir, "images", f));
    if (images.length) {
      return Promise.all(images.map(async (i) => await u.oss.getFileUrl(i, "skills")));
    } else {
      return [];
    }
  } catch {
    return [];
  }
}

// 获取导演手册
export default router.post("/", async (req, res) => {
  try {
    const locale = await getLocale(req as any);
    const artPromptsDir = u.getPath(["skills", "story_skills"]);

    // 读取所有风格文件夹
    const styleDirs = fs
      .readdirSync(artPromptsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    const result = await Promise.all(
      styleDirs.map(async (directorManual) => {
        const styleDir = path.join(artPromptsDir, directorManual);
        const images = await readAllImages(directorManual);
        const readmePath = path.join(styleDir, "README.md");
        const readmeContent = fs.readFileSync(readmePath, "utf-8");
        const firstLine = readmeContent.split("\n")[0].replace(/--/g, "");
        const data = DATA_MAP.map(({ value, subDir }) => {
          let mdPath: string;
          if (subDir) {
            mdPath = path.join(styleDir, subDir, `${value}.md`);
          } else {
            mdPath = path.join(styleDir, `${value}.md`);
          }
          return {
            label: labelForValue(value, locale),
            value,
            data: readMd(mdPath),
          };
        });

        return {
          name: firstLine,
          image: images,
          directorManual: directorManual,
          data,
        };
      }),
    );
    res.status(200).send(success(result));
  } catch (err) {
    res.status(500).send({ error: String(err) });
  }
});
