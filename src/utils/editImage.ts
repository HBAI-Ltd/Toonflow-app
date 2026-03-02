import u from "@/utils";
import axios from "axios";
import { v4 as uuid } from "uuid";
async function getImageBase64ForId(imageId: string | number) {
  const imagePath = await u
    .db("t_assets")
    .select("filePath")
    .where({ id: Number(imageId) })
    .first();

  if (!imagePath || !imagePath.filePath) return ""; // 未找到图片路径
  const url = await u.oss.getFileUrl(imagePath.filePath);
  return await urlToBase64(url);
}

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
// 将图片ID和指令转换为base64数组和替换后的指令
async function convertDirectiveAndImages(images: Record<string, string>, directive: string) {
  // step1: 列出所有别名
  const aliasList = Object.keys(images);
  // step2: 在指令中提取所有 @别名出现
  const aliasRegex = /@[\u4e00-\u9fa5\w]+/g;
  const referencedAliases = directive.match(aliasRegex) || [];
  // step3: 检查别名
  for (const alias of referencedAliases) {
    if (!(alias in images)) {
      throw new Error(`您引用了不存在的图片：${alias}`);
    }
  }
  // step4: 构建别名与顺序编号映射
  const aliasToIndex: Record<string, number> = {};
  aliasList.forEach((alias, i) => {
    aliasToIndex[alias] = i + 1;
  });
  // step5: 替换指令中的别名为"图N"
  let prompt = directive;
  for (const [alias, idx] of Object.entries(aliasToIndex)) {
    // 转义alias可能含特殊字符
    const reg = new RegExp(alias.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1"), "g");
    prompt = prompt.replace(reg, `图${idx}`);
  }
  // step6: 依次获取图片 base64 内容（区分id或者本身就是base64）
  const base64Images: string[] = [];

  for (const imageVal of Object.values(images)) {
    // 判断是否为base64串
    if (typeof imageVal !== "string") continue;
    const normalizedValue = imageVal.trim();
    if (!normalizedValue) continue;

    if (isDataUrl(normalizedValue)) {
      base64Images.push(normalizedValue);
      continue;
    }

    if (/^\d+$/.test(normalizedValue)) {
      const base64 = await getImageBase64ForId(Number(normalizedValue));
      base64Images.push(base64);
      continue;
    }

    if (isHttpUrl(normalizedValue)) {
      const base64 = await urlToBase64(normalizedValue);
      base64Images.push(base64);
      continue;
    }

    // 兼容 /a/b.png、a/b.png 等相对路径输入
    const base64 = await u.oss.getImageBase64(normalizedValue);
    base64Images.push(base64);
  }
  return {
    prompt,
    images: base64Images,
  };
}

/**
 * 示例用法：
 *
 * editImages(
 *   {
 *     "@图8": "456",   // key: 图片别名（如@图8），value: 图片ID（如456）
 *     "@图10": "123"   // key: 图片别名（如@图10），value: 图片ID（如123）
 *   },
 *   "将@图10中圈起来的部分换成@图8"
 * );
 */
export default async (images: Record<string, string>, directive: string, projectId: number, aspectRatio: string | null) => {
  const { prompt, images: base64Images } = await convertDirectiveAndImages(images, directive);
  const apiConfig = await u.getPromptAi("editImage");

  const contentStr = await u.ai.image(
    {
      systemPrompt: "根据用户提供的具体修改指令，对上传的图片进行智能编辑。",
      prompt: prompt,
      imageBase64: base64Images,
      aspectRatio: aspectRatio ? aspectRatio : "16:9",
      size: "1K",
    },
    apiConfig,
  );
  const match = contentStr.match(/base64,([A-Za-z0-9+/=]+)/);
  const buffer = Buffer.from(match && match.length >= 1 ? match[1]! : contentStr, "base64");
  const filePath = `/${projectId}/storyboard/${uuid()}.jpg`;
  await u.oss.writeFile(filePath, buffer);
  return filePath;
};
