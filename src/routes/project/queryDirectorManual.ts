import express from "express";
import type { Request } from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import fs from "fs";
import path from "path";
const router = express.Router();

// 字段映射表
const DATA_MAP: { label: string; value: string; subDir?: string }[] = [
  { label: "README", value: "README" },
  { label: "导演规划", value: "director_planning_narrative", subDir: "driector_skills" },
  { label: "分镜表", value: "director_storyboard_table_narrative", subDir: "driector_skills" },
];

// 读取 md 文件内容，文件不存在时返回空字符串
function readMd(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

function skillImageUrl(req: Request, ...parts: string[]) {
  const host = req.get("host") || "localhost:10588";
  const proto = req.protocol || "http";
  return encodeURI(`${proto}://${host}/${path.posix.join("skills", ...parts)}`);
}

// 获取 images 文件夹下所有图片文件路径列表
async function readAllImages(req: Request, imagesDir: string) {
  try {
    const ossPath = u.getPath(path.join("skills", "story_skills", imagesDir, "images"));
    const files = fs.readdirSync(ossPath);
    return files
      .filter((f) => /\.(png|jpe?g|gif|webp|svg)$/i.test(f))
      .map((f) => skillImageUrl(req, "story_skills", imagesDir, "images", f));
  } catch {
    return [];
  }
}

// 获取导演手册
export default router.post("/", async (req, res) => {
  try {
    const artPromptsDir = u.getPath(["skills", "story_skills"]);

    // 读取所有风格文件夹
    const styleDirs = fs
      .readdirSync(artPromptsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    const result = await Promise.all(
      styleDirs.map(async (directorManual) => {
        const styleDir = path.join(artPromptsDir, directorManual);
        const images = await readAllImages(req, directorManual);
        const readmePath = path.join(styleDir, "README.md");
        const readmeContent = fs.readFileSync(readmePath, "utf-8");
        const firstLine = readmeContent.split("\n")[0].replace(/--/g, "");
        const data = DATA_MAP.map(({ label, value, subDir }) => {
          let mdPath: string;
          if (subDir) {
            mdPath = path.join(styleDir, subDir, `${value}.md`);
          } else {
            mdPath = path.join(styleDir, `${value}.md`);
          }
          return {
            label,
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
