import u from "@/utils";

// 只包含 t_setting 表里实际存在的字段
const modelFields = {
  image: "imageModel",
  language: "languageModel",
  text: "languageModel",
} as const;

interface resData {
  model: string;
  apiKey: string;
  baseURL: string;
  manufacturer: "openAi" | "volcengine" | "runninghub" | "gemini" | "apimart";
}

type ModelType = keyof typeof modelFields;

// 定义返回类型映射
type ReturnType<T extends string> = T extends "video" ? resData[] : resData;

// 主方法
export default async function getConfig<T extends ModelType | "video">(type: T, manufacturer?: string): Promise<ReturnType<T>> {
  if (type === "video") {
    // 查询 t_config 表，返回数组
    const configList = await u.db("t_config").where("manufacturer", manufacturer).orderBy("sortIndex", "asc");

    return configList.map((i) => {
      return {
        ...i,
        baseURL: i.baseUrl,
      };
    }) as ReturnType<T>;
  }

  // 只查询当前需要的字段
  const modelName = modelFields[type as ModelType];
  const data: Record<string, any> | undefined = await u.db("t_setting").where({ id: 1 }).select([modelName]).first();

  if (!data) throw new Error("设置数据不存在");

  // 字段值为 JSON 字符串，解析
  return JSON.parse(data[modelName] || "{}") as ReturnType<T>;
}
