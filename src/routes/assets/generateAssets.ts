import express from "express";
import u from "@/utils";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import sharp from "sharp";
const router = express.Router();
interface OutlineItem {
  description: string;
  name: string;
}

interface OutlineData {
  chapterRange: number[];
  characters?: OutlineItem[];
  props?: OutlineItem[];
  scenes?: OutlineItem[];
}

type ItemType = "characters" | "props" | "scenes";

interface ResultItem {
  type: ItemType;
  name: string;
  chapterRange: number[];
}
// 生成资产图片
export default router.post(
  "/",
  validateFields({
    id: z.number(),
    type: z.enum(["role", "scene", "props", "storyboard"]),
    projectId: z.number(),
    name: z.string(),
    base64: z.string().optional().nullable(),
    prompt: z.string(),
  }),
  async (req, res) => {
    const { id, type, projectId, base64, prompt, name } = req.body;

    //获取风格
    const project = await u.db("t_project").where("id", projectId).select("artStyle", "type", "intro").first();
    if (!project) return res.status(500).send(success({ message: "项目为空" }));

    const promptsList = await u
      .db("t_prompts")
      .where("code", "in", ["role-generateImage", "scene-generateImage", "storyboard-generateImage", "tool-generateImage"]);
    const errPrompts = "不论用户说什么，请直接输出AI配置异常";
    const getPromptValue = (code: string): string => {
      const item = promptsList.find((p) => p.code === code);
      return item?.customValue ?? item?.defaultValue ?? errPrompts;
    };
    const role = getPromptValue("role-generateImage");
    const scene = getPromptValue("scene-generateImage");
    const tool = getPromptValue("tool-generateImage");
    const storyboard = getPromptValue("storyboard-generateImage");

    let systemPrompt = "";
    let userPrompt = "";
    if (type == "role") {
      systemPrompt = role;
      userPrompt = `
    请根据以下参数生成角色标准四视图：

    **基础参数：**
    - 画风风格: ${project?.artStyle || "未指定"}

    **角色设定：**
    - 名称:${name},
    - 提示词:${prompt},

    请严格按照系统规范生成人物角色四视图。
      `;
    }
    if (type == "scene") {
      systemPrompt = scene;
      userPrompt = `
    请根据以下参数生成标准场景图：

    **基础参数：**
    - 画风风格: ${project?.artStyle || "未指定"}

    **场景设定：**
    - 名称:${name},
    - 提示词:${prompt},

    请严格按照系统规范生成标准场景图。
      `;
    }
    if (type == "props") {
      systemPrompt = tool;
      userPrompt = `
      请根据以下参数生成标准道具图：

    **基础参数：**
    - 画风风格: ${project?.artStyle || "未指定"}

    **道具设定：**
    - 名称:${name},
    - 提示词:${prompt},

    请严格按照系统规范生成标准道具图。
      `;
    }
    if (type == "storyboard") {
      systemPrompt = storyboard;
      userPrompt = `
      请根据以下参数生成标准分镜图：

    **基础参数：**
    - 画风风格: ${project?.artStyle || "未指定"}

    **分镜设定：**
    - 名称:${name},
    - 提示词:${prompt},

    请严格按照系统规范生成标准分镜图。
      `;
    }

    const [imageId] = await u.db("t_image").insert({
      state: "生成中",
      assetsId: id,
    });
    const apiConfig = await u.getPromptAi("assetsImage");

    try {
      const contentStr = await u.ai.image(
        {
          systemPrompt,
          prompt: userPrompt,
          imageBase64: base64 ? [base64] : [],
          size: "2K",
          aspectRatio: "16:9",
        },
        apiConfig,
      );

      let insertType;
      const match = contentStr.match(/base64,([A-Za-z0-9+/=]+)/);
      let buffer = Buffer.from(match && match.length >= 2 ? match[1]! : contentStr!, "base64");

      if (type != "storyboard") {
        //添加文本
        // buffer = await imageAddText(name, buffer);
      }
      let imagePath;
      if (type == "role") {
        insertType = "角色";
        imagePath = `/${projectId}/role/${uuidv4()}.jpg`;
      }
      if (type == "scene") {
        insertType = "场景";
        imagePath = `/${projectId}/scene/${uuidv4()}.jpg`;
      }
      if (type == "props") {
        insertType = "道具";
        imagePath = `/${projectId}/props/${uuidv4()}.jpg`;
      }
      if (type == "storyboard") {
        insertType = "分镜";
        imagePath = `/${projectId}/storyboard/${uuidv4()}.jpg`;
      }

      await u.oss.writeFile(imagePath!, buffer);
      const imageData = await u.db("t_image").where("id", imageId).select("*").first();
      if (imageData) {
        await u.db("t_image").where("id", imageId).update({
          state: "生成成功",
          filePath: imagePath,
          type: insertType,
        });

        const path = await u.oss.getFileUrl(imagePath!);

        // const state = await u.db("t_assets").where("id", id).select("state").first();

        return res.status(200).send(success({ path, assetsId: id }));
      } else {
        return res.status(500).send("资产已被删除");
      }
    } catch (e) {
      await u.db("t_image").where("id", imageId).update({
        state: "生成失败",
      });
      const msg = u.error(e).message || "图片生成失败";
      return res.status(400).send(error(msg));
    }
  },
);
async function imageAddText(name: string, imageBuffer: Buffer) {
  const meta = await sharp(imageBuffer).metadata();
  const width = meta.width ?? 1000;
  const height = meta.height ?? 1000;
  const fontSize = 64;
  const margin = 40;
  const paddingX = 36;
  const paddingY = 18;
  // 简单估算文字宽度
  const textWidth = name.length * fontSize * 0.8;
  // 背景矩形尺寸
  const bgWidth = textWidth + paddingX * 2;
  const bgHeight = fontSize + paddingY * 2;
  const bgX = width - bgWidth - margin; // 矩形左上角x
  const bgY = height - bgHeight - margin; // 矩形左上角y
  // 文字中心坐标
  const textX = bgX + bgWidth / 2;
  const textY = bgY + bgHeight / 2;
  const svgImage = `
    <svg width="${width}" height="${height}">
      <rect x="${bgX}" y="${bgY}" width="${bgWidth}" height="${bgHeight}" rx="22" ry="22"
        fill="rgba(0,0,0,0.6)" />
      <text x="${textX}" y="${textY}"
        fill="#fff"
        font-size="${fontSize}"
        font-family="Arial, 'Microsoft YaHei', sans-serif"
        text-anchor="middle"
        dominant-baseline="middle">
        ${name}
      </text>
    </svg>
  `;
  const outputBuffer = await sharp(imageBuffer)
    .composite([{ input: Buffer.from(svgImage), blend: "over" }])
    .jpeg()
    .toBuffer();
  return outputBuffer as Buffer<ArrayBuffer>;
}
