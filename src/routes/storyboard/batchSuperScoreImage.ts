import express from "express";
import u from "@/utils";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
import { v4 } from "uuid";
import axios from "axios";

const router = express.Router();

// url转base64
async function urlToBase64(imageUrl: string): Promise<string> {
  const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const contentType = response.headers["content-type"] || "image/png";
  const base64 = Buffer.from(response.data, "binary").toString("base64");
  return `data:${contentType};base64,${base64}`;
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function isDataUrl(value: string): boolean {
  return /^data:image\//i.test(value.trim());
}

async function sourceToBase64(imageSource: string): Promise<string> {
  const source = imageSource.trim();
  if (!source) throw new Error("图片地址为空");
  if (isDataUrl(source)) return source;

  if (isHttpUrl(source)) {
    try {
      const pathname = new URL(source).pathname;
      return await u.oss.getImageBase64(pathname);
    } catch {
      return await urlToBase64(source);
    }
  }

  return await u.oss.getImageBase64(source);
}

// 超分并保存到 oss
async function superResolutionAndSave(src: string, projectId: number, videoRatio: string): Promise<{ ossPath: string; base64: string }> {
  const apiConfig = await u.getPromptAi("storyboardImage");
  const contentStr = await u.ai.image(
    {
      aspectRatio: videoRatio,
      size: "1K",
      resType: "b64",
      systemPrompt: "你的核心任务是将所给的图片超分到 1K ，不改变图片任何内容，仅改变分辨率",
      prompt: "你的核心任务是将所给的图片超分到 1K ，不改变图片任何内容，仅改变分辨率",
      imageBase64: [await sourceToBase64(src)],
    },
    apiConfig,
  );
  const match = contentStr.match(/base64,([A-Za-z0-9+/=]+)/);
  const base64Str = match ? match[1] : contentStr;
  const buffer = Buffer.from(base64Str, "base64");
  const ossPath = `/${projectId}/chat/${v4()}.jpg`;
  await u.oss.writeFile(ossPath, buffer);
  return { ossPath, base64: `data:image/jpg;base64,${base64Str}` };
}

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    scriptId: z.number().nullable(),
    imageList: z.array(
      z.object({
        cells: z.array(
          z.object({
            id: z.string(),
            prompt: z.string().optional(),
            src: z.string(),
          }),
        ),
      }),
    ),
  }),
  async (req, res) => {
    const { projectId, scriptId, imageList } = req.body;
    const scriptData = await u.db("t_script").where("id", scriptId).select("content").first();
    if (!scriptData) return res.status(500).send(error("剧本不存在"));
    const projectData = await u.db("t_project").where({ id: +projectId }).select("artStyle", "videoRatio").first();
    if (!projectData) return res.status(500).send(error("项目不存在"));

    // 遍历处理每个分镜段
    const processSegment = async (segment: { cells: { id: string; src: string }[] }) => {
      // 超分所有 cell
      const cellsWithSuperscore = await Promise.all(
        segment.cells.map(async (cell) => {
          const { ossPath } = await superResolutionAndSave(cell.src, projectId, projectData.videoRatio!);
          return {
            id: cell.id,
            projectId,
            scriptId,
            filePath: ossPath, // oss 路径（未签名）
            src: cell.src,
            type: "分镜",
          };
        }),
      );
      return cellsWithSuperscore;
    };

    // 处理每个段
    const results = await Promise.allSettled(imageList.map(processSegment));

    // 展开放回并签名 filePath
    const flatList = await Promise.all(
      results.flatMap((item: any) =>
        (item.value as any[]).map(async (cell) => ({
          ...cell,
          filePath: await u.oss.getFileUrl(cell.filePath ?? ""),
        })),
      ),
    );
    res.status(200).send(success(flatList));
  },
);
