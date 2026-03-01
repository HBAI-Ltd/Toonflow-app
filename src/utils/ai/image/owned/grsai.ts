import axios from "axios";
import u from "@/utils";
import { pollTask } from "@/utils/ai/utils";
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
async function processImages(imageBase64: string[]): Promise<Array<string>> {
  let images = imageBase64.filter((img) => img?.trim());
  if (images.length === 0) return [];

  // 压缩所有图片到10MB以内
  images = await Promise.all(images.map((img) => u.imageTools.compressImage(img, "10mb")));

  // 参考主体数量和参考图片数量之和不得超过10
  if (images.length > 6) {
    const mergeImageList = images.splice(5);
    const mergedImage = await u.imageTools.mergeImages(mergeImageList, "10mb");
    images.push(mergedImage);
  }

  return images;
}

export default async (input: ImageConfig, config: AIConfig): Promise<string> => {
  if (!config.apiKey) throw new Error("缺少API Key");
  const apiKey = config.apiKey.replace("Bearer ", "");

  const defaultBaseURL = "https://grsai.dakka.com.cn/v1/draw/nano-banana|https://grsai.dakka.com.cn/v1/draw/result";

  const { requestUrl, queryUrl } = getApiUrl(config.baseURL! || defaultBaseURL);
  // 构建完整的提示词
  const fullPrompt = input.systemPrompt ? `${input.systemPrompt}\n\n${input.prompt}` : input.prompt;

  let mergedImage = await processImages(input.imageBase64 || []);

  const taskBody: Record<string, any> = {
    model: config.model,
    prompt: fullPrompt,
    imageSize: input.size,
    aspectRatio: input.aspectRatio,
    ...(mergedImage && mergedImage.length ? { urls: mergedImage } : {}),
    webHook: "-1",
  };

  try {
    
    const { data } = await axios.post(requestUrl, taskBody, { headers: { Authorization: `Bearer ${apiKey}` } });
    

    if (data.code != 0) throw new Error(`任务提交失败: ${data ? JSON.stringify(data, null, 2) : "未知错误"}`);

    return await pollTask(async () => {
      const { data: queryData } = await axios.post(
        queryUrl,
        {
          id: data.data.id,
        },
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      );
      
      if (queryData.code != 0) throw new Error(`查询任务失败: ${queryData ? JSON.stringify(queryData, null, 2) : "未知错误"}`);
      const { status, results, error, failure_reason } = queryData.data || {};

      if (status === "failed") {
        return { completed: false, error: failure_reason + "\n" + error || "图片生成失败" };
      }

      if (status === "succeeded") {
        return { completed: true, url: results?.[0].url };
      }

      return { completed: false };
    });
  } catch (error: any) {
    const msg = u.error(error).message || "图片生成失败";
    throw new Error(msg);
  }
};
