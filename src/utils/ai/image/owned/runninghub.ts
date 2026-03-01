import axios from "axios";
import FormData from "form-data";
import sharp from "sharp";
import { pollTask } from "@/utils/ai/utils";

// 上传 base64 图片到 runninghub
const uploadBase64ToRunninghub = async (base64Image: string, apiKey: string, baseURL: string): Promise<string> => {
  try {
    apiKey = apiKey.replace("Bearer ", "");
    // 移除 base64 前缀
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    let buffer = Buffer.from(base64Data, "base64");

    // 压缩图片到 7MB 以下
    const MAX_SIZE = 7 * 1024 * 1024; // 7MB
    if (buffer.length > MAX_SIZE) {
      let quality = 90;

      while (buffer.length > MAX_SIZE && quality > 10) {
        const compressed = await sharp(buffer).jpeg({ quality, mozjpeg: true }).toBuffer();
        buffer = Buffer.from(compressed);
        quality -= 10;
      }

      // 如果仍然超过限制，进一步调整尺寸
      if (buffer.length > MAX_SIZE) {
        const metadata = await sharp(buffer).metadata();
        const scale = Math.sqrt(MAX_SIZE / buffer.length);

        const resized = await sharp(buffer)
          .resize({
            width: Math.floor((metadata.width || 1920) * scale),
            height: Math.floor((metadata.height || 1080) * scale),
            fit: "inside",
          })
          .jpeg({ quality: 80, mozjpeg: true })
          .toBuffer();

        buffer = Buffer.from(resized);
      }
    }

    // 创建 FormData
    const formData = new FormData();
    formData.append("file", buffer, {
      filename: "image.jpg",
      contentType: "image/jpeg",
    });

    // 上传图片
    const uploadRes = await axios.post(`https://www.runninghub.cn/openapi/v2/media/upload/binary`, formData, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (uploadRes.data.code !== 0 || !uploadRes.data.data?.download_url) {
      throw new Error(`图片上传失败: ${JSON.stringify(uploadRes.data)}`);
    }

    return uploadRes.data.data.download_url;
  } catch (error) {
    console.error("上传图片时发生错误:", error);
    throw error;
  }
};

export default async (input: ImageConfig, config: AIConfig): Promise<string> => {
  if (!config.apiKey) throw new Error("缺少API Key");
  const apiKey = config.apiKey.replace("Bearer ", "");
  const baseURL = "https://www.runninghub.cn";
  const imageUrls = await Promise.all(input.imageBase64.map((base64Image) => uploadBase64ToRunninghub(base64Image, apiKey, baseURL)));
  const fullPrompt = input.systemPrompt ? `${input.systemPrompt}\n\n${input.prompt}` : input.prompt;

  const endpoint = input.imageBase64.length === 0 ? "/openapi/v2/rhart-image-n-pro/text-to-image" : "/openapi/v2/rhart-image-n-pro/edit";
  const taskRes = await axios.post(
    `https://www.runninghub.cn${endpoint}`,
    { prompt: fullPrompt, resolution: input.size, aspectRatio: input.aspectRatio, ...(imageUrls.length > 0 && { imageUrls }) },
    { headers: { Authorization: "Bearer " + apiKey } },
  );
  const taskId = taskRes.data.taskId;
  if (!taskId) throw new Error(`任务创建失败，${JSON.stringify(taskRes.data)}`);

  return pollTask(async () => {
    const res = await axios.post(`https://www.runninghub.cn/task/openapi/outputs`, { taskId, apiKey: apiKey });
    const { code, msg, data } = res.data;
    if (code === 0 && msg === "success") return { completed: true, url: data?.[0]?.fileUrl };
    if (code === 804 || code === 813) return { completed: false };
    if (code === 805) return { completed: false, error: `任务失败: ${data?.[0]?.failedReason?.exception_message || "未知原因"}` };
    return { completed: false, error: `未知状态: code=${code}, msg=${msg}` };
  });
};
