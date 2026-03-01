import "../type";
import axios from "axios";
import u from "@/utils";

export default async (input: ImageConfig, config: AIConfig): Promise<string> => {
  if (!config.model) throw new Error("缺少Model名称");
  if (!config.apiKey) throw new Error("缺少API Key");

  const apiKey = "Bearer " + config.apiKey.replace(/Bearer\s+/g, "").trim();
  const size = input.size === "1K" ? "2K" : input.size;
  const sizeMap: Record<string, Record<string, string>> = {
    "16:9": {
      "2K": "2848x1600",
      "4K": "4096x2304",
    },
    "9:16": {
      "2K": "1600x2848",
      "4K": "2304x4096",
    },
  };
  const fullPrompt = input.systemPrompt ? `${input.systemPrompt}\n\n${input.prompt}` : input.prompt;

  const body: Record<string, any> = {
    model: config.model,
    prompt: fullPrompt,
    size: sizeMap[input.aspectRatio][size],
    response_format: "url",
    sequential_image_generation: "disabled",
    stream: false,
    watermark: false,
    ...(input.imageBase64 && { image: input.imageBase64 }),
  };
  const url = config.baseURL ?? "https://ark.cn-beijing.volces.com/api/v3/images/generations";
  try {
    const { data } = await axios.post(url, body, { headers: { Authorization: apiKey } });
    return data.data[0]?.url;
  } catch (error) {
    const msg = u.error(error).message || "Volcengine 图片生成失败";
    throw new Error(msg);
  }
};
