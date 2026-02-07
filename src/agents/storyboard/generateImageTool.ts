import generateImagePromptsTool from "@/agents/storyboard/generateImagePromptsTool";
import u from "@/utils";
import sharp from "sharp";

interface AssetItem {
  name: string;
  description: string;
}

interface EpisodeData {
  episodeIndex: number;
  title: string;
  chapterRange: number[];
  scenes: AssetItem[];
  characters: AssetItem[];
  props: AssetItem[];
  coreConflict: string;
  openingHook: string;
  outline: string;
  keyEvents: string[];
  emotionalCurve: string;
  visualHighlights: string[];
  endingHook: string;
  classicQuotes: string[];
}

interface ImageInfo {
  name: string;
  type: string;
  filePath: string;
}

interface ResourceItem {
  name: string;
  intro: string;
}

// 资产过滤响应的 JSON Schema（手动构建，确保兼容 OpenAI strict 模式）
const filteredAssetsJsonSchema = {
  type: "object" as const,
  properties: {
    relevantAssets: {
      type: "array" as const,
      description: "与分镜内容相关的资产列表",
      items: {
        type: "object" as const,
        properties: {
          name: { type: "string" as const, description: "资产名称" },
          reason: { type: "string" as const, description: "选择该资产的原因" },
        },
        required: ["name", "reason"] as const,
        additionalProperties: false,
      },
    },
  },
  required: ["relevantAssets"] as const,
  additionalProperties: false,
};

// 压缩图片直到不超过指定大小
async function compressImage(buffer: Buffer, maxSizeBytes: number = 3 * 1024 * 1024): Promise<Buffer> {
  if (buffer.length <= maxSizeBytes) {
    return buffer;
  }
  let quality = 90;
  let compressedBuffer = await sharp(buffer).jpeg({ quality }).toBuffer();
  while (compressedBuffer.length > maxSizeBytes && quality > 10) {
    quality -= 10;
    compressedBuffer = await sharp(buffer).jpeg({ quality }).toBuffer();
  }
  if (compressedBuffer.length > maxSizeBytes) {
    const metadata = await sharp(buffer).metadata();
    let scale = 0.9;
    while (compressedBuffer.length > maxSizeBytes && scale > 0.1) {
      const newWidth = Math.round((metadata.width || 1000) * scale);
      const newHeight = Math.round((metadata.height || 1000) * scale);
      compressedBuffer = await sharp(buffer)
        .resize(newWidth, newHeight, { fit: "inside" })
        .jpeg({ quality: Math.max(quality, 30) })
        .toBuffer();
      scale -= 0.1;
    }
  }
  return compressedBuffer;
}

// 拼接多张图片为一张
async function mergeImages(imagePaths: string[]): Promise<Buffer> {
  const imageBuffers = await Promise.all(imagePaths.map((path) => u.oss.getFile(path)));
  const imageMetadatas = await Promise.all(imageBuffers.map((buffer) => sharp(buffer).metadata()));
  const maxHeight = Math.max(...imageMetadatas.map((m) => m.height || 0));
  const resizedImages = await Promise.all(
    imageBuffers.map(async (buffer, index) => {
      const metadata = imageMetadatas[index];
      const aspectRatio = (metadata.width || 1) / (metadata.height || 1);
      const newWidth = Math.round(maxHeight * aspectRatio);
      return {
        buffer: await sharp(buffer).resize(newWidth, maxHeight, { fit: "cover" }).toBuffer(),
        width: newWidth,
      };
    }),
  );
  let currentX = 0;
  const compositeInputs = resizedImages.map(({ buffer, width }) => {
    const input = {
      input: buffer,
      left: currentX,
      top: 0,
    };
    currentX += width;
    return input;
  });
  const mergedImage = await sharp({
    create: {
      width: currentX,
      height: maxHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite(compositeInputs)
    .jpeg({ quality: 90 })
    .toBuffer();
  return compressImage(mergedImage);
}

// 进一步压缩单张图片到指定大小
async function compressToSize(buffer: Buffer, targetSize: number): Promise<Buffer> {
  if (buffer.length <= targetSize) {
    return buffer;
  }

  const metadata = await sharp(buffer).metadata();
  let quality = 80;
  let scale = 1.0;
  let compressedBuffer = buffer;

  // 先尝试降低质量
  while (compressedBuffer.length > targetSize && quality > 10) {
    compressedBuffer = await sharp(buffer).jpeg({ quality }).toBuffer();
    quality -= 10;
  }

  // 如果还是太大，缩小尺寸
  while (compressedBuffer.length > targetSize && scale > 0.2) {
    scale -= 0.1;
    const newWidth = Math.round((metadata.width || 1000) * scale);
    const newHeight = Math.round((metadata.height || 1000) * scale);
    compressedBuffer = await sharp(buffer)
      .resize(newWidth, newHeight, { fit: "inside" })
      .jpeg({ quality: Math.max(quality, 20) })
      .toBuffer();
  }

  return compressedBuffer;
}

// 确保图片列表总大小不超过指定限制
async function ensureTotalSizeLimit(buffers: Buffer[], maxTotalBytes: number = 10 * 1024 * 1024): Promise<Buffer[]> {
  let totalSize = buffers.reduce((sum, buf) => sum + buf.length, 0);

  if (totalSize <= maxTotalBytes) {
    return buffers;
  }

  // 计算每张图片的平均目标大小
  const avgTargetSize = Math.floor(maxTotalBytes / buffers.length);

  // 按大小降序排列，优先压缩大图片
  const indexedBuffers = buffers.map((buf, idx) => ({ buf, idx, size: buf.length }));
  indexedBuffers.sort((a, b) => b.size - a.size);

  const result = [...buffers];

  for (const item of indexedBuffers) {
    totalSize = result.reduce((sum, buf) => sum + buf.length, 0);
    if (totalSize <= maxTotalBytes) {
      break;
    }

    // 计算这张图片需要压缩到的目标大小
    const excessSize = totalSize - maxTotalBytes;
    const targetSize = Math.max(item.buf.length - excessSize, avgTargetSize, 100 * 1024); // 最小100KB

    if (item.buf.length > targetSize) {
      result[item.idx] = await compressToSize(item.buf, targetSize);
    }
  }

  return result;
}

// 处理图片列表，确保不超过10张且每张不超过3MB，总大小不超过10MB
async function processImages(images: ImageInfo[]): Promise<Buffer[]> {
  const maxImages = 10;
  let processedBuffers: Buffer[];

  if (images.length <= maxImages) {
    const buffers = await Promise.all(images.map((img) => u.oss.getFile(img.filePath)));
    processedBuffers = await Promise.all(buffers.map((buffer) => compressImage(buffer)));
  } else {
    const mergeStartIndex = maxImages - 1;
    const firstBuffers = await Promise.all(images.slice(0, mergeStartIndex).map((img) => u.oss.getFile(img.filePath)));
    const compressedFirstImages = await Promise.all(firstBuffers.map((buffer) => compressImage(buffer)));
    const imagesToMergeList = images.slice(mergeStartIndex).map((img) => img.filePath);
    const mergedImage = await mergeImages(imagesToMergeList);
    processedBuffers = [...compressedFirstImages, mergedImage];
  }

  // 确保总大小不超过10MB
  return ensureTotalSizeLimit(processedBuffers);
}

// 使用 AI 过滤与分镜相关的资产
async function filterRelevantAssets(prompts: string[], allResources: ResourceItem[], availableImages: ImageInfo[]): Promise<ImageInfo[]> {
  if (allResources.length === 0 || availableImages.length === 0) {
    return availableImages;
  }

  const availableNames = new Set(availableImages.map((img) => img.name));
  const availableResources = allResources.filter((r) => availableNames.has(r.name));

  if (availableResources.length === 0) {
    return availableImages;
  }

  try {
    const chatModel = await u.ai.text({});
    const result = await chatModel!.invoke({
      messages: [
        {
          role: "user",
          content: `请分析以下分镜描述，从可用资产中筛选出与分镜内容直接相关的资产。

分镜描述：
${prompts.map((p, i) => `${i + 1}. ${p}`).join("\n")}

可用资产列表：
${availableResources.map((r) => `- ${r.name}：${r.intro}`).join("\n")}

请仅选择在分镜中明确出现或被提及的角色、场景、道具。不要选择与分镜内容无关的资产。
请严格按照 JSON 格式返回结果，包含 relevantAssets 数组字段。`,
        },
      ],
      responseFormat: {
        type: "json_schema",
        jsonSchema: {
          name: "filteredAssets",
          strict: true,
          schema: filteredAssetsJsonSchema,
        },
      },
    });

    const data = result?.json as { relevantAssets?: Array<{ name: string; reason: string }> };

    if (!data?.relevantAssets || data.relevantAssets.length === 0) {
      return availableImages;
    }

    const relevantNames = new Set(data.relevantAssets.map((a) => a.name));
    const filteredImages = availableImages.filter((img) => relevantNames.has(img.name));

    return filteredImages.length > 0 ? filteredImages : availableImages;
  } catch (err: any) {
    // 资产过滤失败时降级：返回全部可用资产，不阻断图片生成流程
    console.warn("资产过滤失败，使用全部资产:", err.message);
    return availableImages;
  }
}

// 构建资产映射提示词
function buildResourcesMapPrompts(images: ImageInfo[]): string {
  if (images.length === 0) return "";

  const mapping = images.map((item, index) => {
    if (index < 9) {
      return `${item.name}=图片${index + 1}`;
    } else {
      return `${item.name}=图10-${index - 8}`;
    }
  });

  return `其中人物、场景、道具参考对照关系如下：${mapping.join(", ")}。`;
}

export default async (cells: { prompt: string }[], scriptId: number, projectId: number) => {
  const scriptData = await u.db("t_script").where({ id: scriptId, projectId }).first();
  const projectInfo = await u.db("t_project").where({ id: projectId }).first();

  const row = await u.db("t_outline").where({ id: scriptData?.outlineId!, projectId }).first();
  const outline: EpisodeData | null = row?.data ? JSON.parse(row.data) : null;

  const resources: ResourceItem[] = outline
    ? (["characters", "props", "scenes"] as const).flatMap((k) => outline[k]?.map((i) => ({ name: i.name, intro: i.description })) ?? [])
    : [];

  const resourceNames = resources.map((r) => r.name);
  const imagesRaw = await u.db("t_assets").whereIn("name", resourceNames).andWhere({ projectId }).select("name", "type", "filePath");

  const allImages = imagesRaw
    .sort((a, b) => {
      const order = ["角色", "场景", "道具"];
      return order.indexOf(a.type!) - order.indexOf(b.type!);
    })
    .filter((img) => img.filePath) as ImageInfo[];

  if (allImages.length === 0) {
    throw new Error("未找到可用的图片资源");
  }

  const cellPrompts = cells.map((c) => c.prompt);

  // 使用 AI 过滤相关资产
  const filteredImages = await filterRelevantAssets(cellPrompts, resources, allImages);

  const resourcesMapPrompts = buildResourcesMapPrompts(filteredImages);
  console.log("====润色前：", cellPrompts);
  const promptsData = await generateImagePromptsTool({
    prompts: cellPrompts,
    style: `类型：${projectInfo?.type!}，风格：${projectInfo?.artStyle!}`,
    aspectRatio: projectInfo?.videoRatio! as any,
    assetsName: resources,
  });

  //   const prompts = `请生成${promptsData.gridLayout.totalCells}格,${promptsData.gridLayout.cols}列×${promptsData.gridLayout.rows}行宫格图。

  // ${promptsData.prompt}

  // 注意：请严格按照提示词内容生成图片，确保人物样貌、艺术风格、色调光影一致。
  // `;
  const prompts = promptsData.prompt;
  console.log("====润色后：", prompts);

  const processedImages = await processImages(filteredImages);

  const contentStr = await u.ai.generateImage({
    systemPrompt: resourcesMapPrompts,
    prompt: prompts,
    size: "4K",
    aspectRatio: projectInfo?.videoRatio ? (projectInfo.videoRatio as any) : "16:9",
    imageBase64: processedImages.map((buf) => buf.toString("base64")),
  });

  const match = contentStr.match(/base64,([A-Za-z0-9+/=]+)/);
  const base64Str = match?.[1] ?? contentStr;
  const buffer = Buffer.from(base64Str, "base64");

  return buffer;
};
