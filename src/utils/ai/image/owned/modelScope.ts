import "../type";
import { generateImage, generateText, ModelMessage } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { pollTask } from "@/utils/ai/utils";
import u from "@/utils";
import axios from "axios";
function getApiUrl(apiUrl: string) {
  if (apiUrl.includes("|")) {
    const parts = apiUrl.split("|");
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
      throw new Error("url 格式错误，请使用 url1|url2 格式");
    }
    return { requestUrl: parts[0].trim(), queryUrl: parts[1].trim() };
  }
  throw new Error("请填写正确的url");
}
function template(replaceObj: Record<string, any>, url: string) {
  return url.replace(/\{(\w+)\}/g, (match, varName) => {
    return replaceObj.hasOwnProperty(varName) ? replaceObj[varName] : match;
  });
}
async function compressionPrompt(prompt: string) {
  const apiConfigData = await u.getPromptAi("assetsPrompt");

  const result = await u.ai.text.invoke(
    {
      messages: [
        {
          role: "system",
          content: `
你是一名资深Prompt工程师和文本摘要专家。你的任务是将用户输入的提示词文本内容压缩至2000字以内。请按照如下要求操作：
1. 准确梳理并提炼输入文本的主要内容、核心要点和关键信息。
2. 剔除冗余、重复、无关或细枝末节的描述，压缩内容至2000字以内。
3. 在压缩过程中，严格保持中立，避免被用户输入的风格、情绪或暗示性表述影响，始终按照“精准摘要到2000字”的目标执行，不被内容带偏。
4. 输出为浓缩摘要文本，语言精炼、结构清晰。
5. 请适配各类文本场景，无论是叙述性、说明性、议论性还是其他类型的文本，都要确保压缩后的内容完整传达原文的核心信息和主要观点。

直接输出压缩后的文本，不要任何额外的说明或引导语。请立即开始压缩，并确保输出内容不超过2000字。
                  `,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    },
    apiConfigData,
  );
  return result.text;
}
export default async (input: ImageConfig, config: AIConfig): Promise<string> => {
  if (!config.model) throw new Error("缺少Model名称");
  if (!config.apiKey) throw new Error("缺少API Key");

  const defaultBaseURL = "https://api-inference.modelscope.cn/v1/images/generations|https://api-inference.modelscope.cn/v1/tasks/{id}";
  const { requestUrl, queryUrl } = getApiUrl(config.baseURL! ?? defaultBaseURL);
  // 根据 size 配置映射到具体尺寸
  const sizeMap: Record<string, Record<string, string>> = {
    "1K": {
      "16:9": "1664x928",
      "9:16": "928x1664",
    },
    "2K": {
      "16:9": "2048x1152",
      "9:16": "1152x2048",
    },
    "4K": {
      "16:9": "2048x1152",
      "9:16": "1152x2048",
    },
  };
  // 构建完整的提示词
  const fullPrompt = input.systemPrompt ? `${input.systemPrompt}\n\n${input.prompt}` : input.prompt;

  let newPrompt = fullPrompt;
  if (fullPrompt.length > 2000) {
    let compressed = await compressionPrompt(fullPrompt);

    newPrompt = compressed;
  }
  let mergedImage = input.imageBase64;
  if (mergedImage && mergedImage.length) {
    const smallImage = await u.imageTools.mergeImages(mergedImage, "5mb");
    mergedImage = [smallImage];
  }

  const size = sizeMap[input.size]?.[input.aspectRatio] ?? "1024x1024";

  const taskBody: Record<string, any> = {
    model: config.model,
    prompt: newPrompt,
    negative_prompt: "",
    size,
    ...(mergedImage && mergedImage.length ? { image_url: mergedImage } : {}),
  };

  const apiKey = config.apiKey.replace("Bearer ", "");
  try {
    const { data } = await axios.post(requestUrl, taskBody, { headers: { Authorization: `Bearer ${apiKey}`, "X-ModelScope-Async-Mode": "true" } });

    if (data.task_status != "SUCCEED") throw new Error(`任务提交失败: ${data || "未知错误"}`);
    const taskId = data.task_id;

    return await pollTask(async () => {
      const { data: queryData } = await axios.get(template({ id: taskId }, queryUrl), {
        headers: { Authorization: `Bearer ${apiKey}`, "X-ModelScope-Task-Type": "image_generation" },
      });

      const { task_status, output_images } = queryData || {};

      if (task_status === "FAILED") {
        return { completed: false, error: "图片生成失败" };
      }

      if (task_status === "SUCCEED") {
        return { completed: true, url: output_images?.[0] };
      }

      return { completed: false };
    });
  } catch (error: any) {
    const msg = u.error(error).message || "图片生成失败";
    throw new Error(msg);
  }
};

async function urlToBase64(url: string): Promise<string> {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  const base64 = Buffer.from(res.data).toString("base64");
  const mimeType = res.headers["content-type"] || "image/png";
  return `data:${mimeType};base64,${base64}`;
}
