import u from "@/utils";
import { t, getLocale, type Locale } from "@/i18n";

type AIType = "text" | "image" | "video";

interface BaseConfig {
  model: string;
  apiKey: string;
  manufacturer: string;
}

interface TextResData extends BaseConfig {
  baseURL: string;
  manufacturer: "deepseek" | "openAi" | "doubao" | "other";
}

// 图像模型配置接口
interface ImageResData extends BaseConfig {
  manufacturer: "gemini" | "volcengine" | "kling" | "vidu" | "runninghub" | "apimart" | "other";
}

interface VideoResData extends BaseConfig {
  baseURL: string;
  manufacturer: "openAi" | "volcengine" | "runninghub" | "apimart" | "confyUI";
}

type ResDataMap = {
  text: TextResData;
  image: ImageResData;
  video: VideoResData;
};

const errorMessageKeys: Record<AIType, string> = {
  text: "utils.getConfig.textConfigNotFound",
  image: "utils.getConfig.imageConfigNotFound",
  video: "utils.getConfig.videoConfigNotFound",
};

function getErrorMessages(locale: Locale): Record<AIType, string> {
  return {
    text: t(errorMessageKeys.text, {}, locale),
    image: t(errorMessageKeys.image, {}, locale),
    video: t(errorMessageKeys.video, {}, locale),
  };
}

const needBaseURL: AIType[] = ["text", "video", "image"];

export default async function getConfig<T extends AIType>(aiType: T, manufacturer?: string): Promise<ResDataMap[T]> {
  const locale = await getLocale();
  const config = await u
    .db("t_config")
    .where("type", aiType)
    .modify((qb) => {
      if (manufacturer) {
        qb.where("manufacturer", manufacturer);
      }
    })
    .first();

  if (!config) throw new Error(getErrorMessages(locale)[aiType]);

  const result: BaseConfig = {
    model: config?.model ?? "",
    apiKey: config?.apiKey ?? "",
    manufacturer: config?.manufacturer ?? "",
  };

  if (needBaseURL.includes(aiType)) {
    return { ...result, baseURL: config.baseUrl } as ResDataMap[T];
  }

  return result as ResDataMap[T];
}
