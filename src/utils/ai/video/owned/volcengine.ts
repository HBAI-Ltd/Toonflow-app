import "../type";
import axios from "axios";
import { pollTask, validateVideoConfig } from "@/utils/ai/utils";

export default async (input: VideoConfig, config: AIConfig) => {
  if (!config.apiKey) throw new Error("缺少API Key");

  // const { owned, images, hasStartEndType } = validateVideoConfig(input, config);
  const hasStartEndType = input.mode === "startEnd";
  const authorization = "Bearer " + config.apiKey.replace(/^Bearer\s*/i, "").trim();
  const baseUrl = config.baseURL ?? "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks";
  const images = input.imageBase64 || [];
  // 判断是否为首尾帧模式（需要两张图且类型支持首尾帧）
  const isStartEndMode = images.length === 2 && hasStartEndType;

  // 构建图片内容
  const imageContent = images.map((base64, index) => {
    const item: Record<string, any> = {
      type: "image_url",
      image_url: { url: base64 },
    };
    if (isStartEndMode) {
      item.role = index === 0 ? "first_frame" : "last_frame";
    }
    return item;
  });

  // 构建请求体
  const requestBody: Record<string, any> = {
    model: config.model,
    content: [{ type: "text", text: input.prompt }, ...imageContent],
    duration: input.duration,
    resolution: input.resolution,
    watermark: false,
  };

  // 仅当模型支持音频时才添加 generate_audio 字段
  if (input?.audio) {
    requestBody.generate_audio = input.audio ?? false;
  }
  // 创建视频生成任务
  const createResponse = await axios.post(baseUrl, requestBody, {
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
    },
  });

  const taskId = createResponse.data.id;

  if (!taskId) throw new Error("视频任务创建失败");

  // 轮询任务状态
  return await pollTask(async () => {
    const data = await axios.get(`${baseUrl}/${taskId}`, {
      headers: { Authorization: authorization },
    });

    const { status, content } = data.data;

    switch (status) {
      case "succeeded":
        return { completed: true, url: content?.video_url };
      case "failed":
      case "cancelled":
      case "expired":
        return { completed: false, error: `任务${status}` };
      case "queued":
      case "running":
        return { completed: false };
      default:
        return { completed: false, error: `未知状态: ${status}` };
    }
  });
};
