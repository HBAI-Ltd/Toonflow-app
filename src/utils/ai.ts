import axios from "axios";
import u from "@/utils";
import FormData from "form-data";
import axiosRetry from "axios-retry";
import { OpenAIChatModel, type OpenAIChatModelOptions } from "@aigne/openai";
import sharp from "sharp";

axiosRetry(axios, { retries: 3, retryDelay: () => 200 });

export const text = async (config: OpenAIChatModelOptions = {}) => {
  const { model, apiKey, baseURL } = await u.getConfig("language");
  return new OpenAIChatModel({
    apiKey: apiKey ?? "",
    baseURL: baseURL ?? "",
    model: model ?? "gpt-4.1",
    modelOptions: { temperature: 0.7 },
    ...config,
  });
};

interface ImageConfig {
  systemPrompt?: string;
  prompt: string;
  imageBase64: string[];
  size: "1K" | "2K" | "4K";
  aspectRatio: string;
  resType?: "url" | "b64";
}

const urlToBase64 = async (url: string): Promise<string> => {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  const base64 = Buffer.from(res.data).toString("base64");
  const mimeType = res.headers["content-type"] || "image/png";
  return `data:${mimeType};base64,${base64}`;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const pollTask = async (
  queryFn: () => Promise<{ completed: boolean; imageUrl?: string; error?: string }>,
  maxAttempts = 500,
  interval = 2000,
): Promise<string> => {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(interval);
    const { completed, imageUrl, error } = await queryFn();
    if (error) throw new Error(error);
    if (completed && imageUrl) return imageUrl;
  }
  throw new Error(`任务轮询超时，已尝试 ${maxAttempts} 次`);
};

// 上传 base64 图片到 runninghub
const uploadBase64ToRunninghub = async (base64Image: string, apiKey: string, baseURL: string): Promise<string> => {
  try {
    apiKey = apiKey.replace("Bearer ", "");
    // 移除 base64 前缀
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    let buffer = Buffer.from(base64Data, "base64");

    // 压缩图片到 5MB 以下
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
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

const generators = {
  volcengine: async (config: ImageConfig, apiKey: string, baseURL: string, model: string) => {
    if (config.size == "1K") config.size = "2K";
    apiKey = apiKey.replace("Bearer ", "");
    const body: Record<string, any> = {
      model,
      prompt: config.prompt,
      size: config.size,
      response_format: "url",
      sequential_image_generation: "disabled",
      stream: false,
      watermark: false,
    };
    // 图生图：存在图片时添加 image 字段（需要 Data URI 格式）
    if (config.imageBase64 && config.imageBase64.length > 0) {
      body.image = config.imageBase64.map((img) =>
        img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}`
      );
    }
    try {
      const res = await axios.post(`https://ark.cn-beijing.volces.com/api/v3/images/generations`, body, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return res.data.data[0].url;
    } catch (err: any) {
      console.error("[volcengine 图像生成失败]", JSON.stringify(err?.response?.data || err.message));
      console.error("[volcengine 请求参数]", JSON.stringify({ model, size: config.size, promptLength: config.prompt?.length, imageCount: config.imageBase64?.length }));
      throw err;
    }
  },

  gemini: async (config: ImageConfig, apiKey: string, baseURL: string, model: string) => {
    apiKey = apiKey.replace("Bearer ", "");
    const messages = [
      ...(config.systemPrompt ? [{ role: "system", content: config.systemPrompt }] : []),
      { role: "user", content: config.prompt },
      ...config.imageBase64.map((img) => ({ role: "user", content: { image: img } })),
    ];
    const res = await axios.post(
      `${baseURL}/chat/completions`,
      { model, stream: false, messages, extra_body: { google: { image_config: { aspect_ratio: config.aspectRatio, image_size: config.size } } } },
      { headers: { Authorization: "Bearer " + apiKey } },
    );

    return res.data.choices[0].message.content;
  },

  runninghub: async (config: ImageConfig, apiKey: string, baseURL: string) => {
    apiKey = apiKey.replace("Bearer ", "");
    const imageUrls = await Promise.all(config.imageBase64.map((base64Image) => uploadBase64ToRunninghub(base64Image, apiKey, baseURL)));

    const endpoint = config.imageBase64.length === 0 ? "/openapi/v2/rhart-image-n-pro/text-to-image" : "/openapi/v2/rhart-image-n-pro/edit";
    const taskRes = await axios.post(
      `https://www.runninghub.cn${endpoint}`,
      { prompt: config.prompt, resolution: config.size, aspectRatio: config.aspectRatio, ...(imageUrls.length > 0 && { imageUrls }) },
      { headers: { Authorization: "Bearer " + apiKey } },
    );
    const taskId = taskRes.data.taskId;
    if (!taskId) throw new Error(`任务创建失败，${JSON.stringify(taskRes.data)}`);

    return pollTask(async () => {
      const res = await axios.post(`https://www.runninghub.cn/task/openapi/outputs`, { taskId, apiKey: apiKey });
      const { code, msg, data } = res.data;
      if (code === 0 && msg === "success") return { completed: true, imageUrl: data?.[0]?.fileUrl };
      if (code === 804 || code === 813) return { completed: false };
      if (code === 805) return { completed: false, error: `任务失败: ${data?.[0]?.failedReason?.exception_message || "未知原因"}` };
      return { completed: false, error: `未知状态: code=${code}, msg=${msg}` };
    });
  },

  apimart: async (config: ImageConfig, apiKey: string, baseURL: string, model: string) => {
    apiKey = apiKey.replace("Bearer ", "");
    const taskRes = await axios.post(
      `https://api.apimart.ai/v1/images/generations`,
      { model: "gemini-3-pro-image-preview", prompt: config.prompt, size: config.aspectRatio, n: 1, resolution: config.size },
      { headers: { Authorization: apiKey } },
    );

    if (taskRes.data.code !== 200 || !taskRes.data.data?.[0]?.task_id) throw new Error("任务创建失败: " + JSON.stringify(taskRes.data));

    const taskId = taskRes.data.data[0].task_id;
    return pollTask(async () => {
      const res = await axios.get(`https://api.apimart.ai/v1/tasks/${taskId}`, { headers: { Authorization: apiKey }, params: { language: "en" } });
      if (res.data.code !== 200) return { completed: false, error: `查询失败: ${JSON.stringify(res.data)}` };
      const { status, result } = res.data.data;
      if (status === "completed") return { completed: true, imageUrl: result?.images?.[0]?.url?.[0] };
      if (status === "failed" || status === "cancelled") return { completed: false, error: `任务${status}` };
      return { completed: false };
    });
  },
};

export const generateImage = async (config: ImageConfig, replaceConfig?: Awaited<ReturnType<typeof u.getConfig<"image">>>): Promise<string> => {
  let { model, apiKey, baseURL, manufacturer } = await u.getConfig("image");
  if (replaceConfig) {
    model = replaceConfig.model || model;
    apiKey = replaceConfig.apiKey || apiKey;
    baseURL = replaceConfig.baseURL || baseURL;
    manufacturer = replaceConfig.manufacturer || manufacturer;
  }
  const generator = generators[manufacturer as keyof typeof generators];
  if (!generator) throw new Error(`不支持的厂商: ${manufacturer}`);

  let imageUrl = await generator(config, apiKey ?? "", baseURL ?? "", model ?? "");
  if (!config.resType) config.resType = "b64";
  if (config.resType === "b64" && imageUrl.startsWith("http")) imageUrl = await urlToBase64(imageUrl);
  return imageUrl;
};

type VideoAspectRatio = "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "21:9" | "adaptive";
interface BaseVideoConfig {
  prompt: string;
  savePath: string;
  imageBase64?: string[]; // 单张参考图片 base64
}
interface DoubaoVideoConfig extends BaseVideoConfig {
  duration: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12; // 支持 2~12 秒
  aspectRatio: VideoAspectRatio;
  audio?: boolean;
}
interface RunninghubVideoConfig extends BaseVideoConfig {
  duration: 10 | 15; // 仅支持 10 或 15 秒
  aspectRatio: "16:9" | "9:16" | "1:1"; // 仅支持这三种比例
}
interface OpenAIVideoConfig extends BaseVideoConfig {
  duration: 10 | 15; // 仅支持 10 或 15 秒
  aspectRatio: Exclude<VideoAspectRatio, "adaptive">; // 不支持 adaptive
}
type VideoConfig = DoubaoVideoConfig | RunninghubVideoConfig | OpenAIVideoConfig;
const generateVideoWithConfig = async (config: VideoConfig, configItem: { model: string; apiKey: string; baseURL: string; manufacturer: string }) => {
  const { apiKey, baseURL, manufacturer, model } = configItem;
  const imageArrPath = [];
  for (const imageVal of config?.imageBase64!) {
    // 判断是否为base64串
    const isBase64 = typeof imageVal === "string" && /^data:image\/[a-zA-Z0-9\+\-\.]+;base64,[\s\S]+$/.test(imageVal.trim());
    if (isBase64) {
      imageArrPath.push(imageVal);
    } else {
      const base64 = await urlToBase64(imageVal);
      imageArrPath.push(base64);
    }
  }
  config.imageBase64 = imageArrPath;
  let videoUrl: string | null = null;
  if (manufacturer === "volcengine") {
    const doubaoConfig = config as DoubaoVideoConfig;
    const actualModel = model || "doubao-seedance-1-5-pro-251215";
    // seedance-1-5-pro 支持首尾帧模式(flf2v)，其他模型只支持单图参考(i2v)或纯文本(t2v)
    const supportsFlf2v = actualModel.includes("seedance-1-5") || actualModel.includes("seedance-2");
    const imageContent = doubaoConfig.imageBase64
      ? supportsFlf2v
        ? doubaoConfig.imageBase64.map((base64, i) => ({
            type: "image_url",
            image_url: { url: base64 },
            role: i === 0 ? "first_frame" : "last_frame",
          }))
        : // 非 1-5-pro 模型：只取第一张图作为参考图(i2v)，不传 role
          [{ type: "image_url", image_url: { url: doubaoConfig.imageBase64[0] } }]
      : [];
    const createRes = await axios.post(
      baseURL ?? "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks",
      {
        model: actualModel,
        content: [
          { type: "text", text: config.prompt },
          ...imageContent,
        ],
        generate_audio: doubaoConfig.audio ?? false,
        duration: doubaoConfig.duration,
        resolution: doubaoConfig.aspectRatio,
        watermark: false,
      },
      { headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` } },
    );
    const taskId = createRes.data.id;
    if (!taskId) throw new Error("视频任务创建失败");
    videoUrl = await pollTask(async () => {
      const res = await axios.get(`${baseURL ?? "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks"}/${taskId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const { status, content, error: taskError } = res.data;
      if (status === "succeeded") return { completed: true, imageUrl: content?.video_url };
      if (["failed", "cancelled", "expired"].includes(status)) {
        const detail = taskError?.message || taskError?.code || content?.error || JSON.stringify(res.data);
        console.error("[volcengine 视频任务失败]", detail);
        return { completed: false, error: `任务${status}: ${detail}` };
      }
      if (["queued", "running"].includes(status)) return { completed: false };
      return { completed: false, error: `未知状态: ${status}` };
    });
  } else if (manufacturer === "runninghub") {
    const runninghubConfig = config as RunninghubVideoConfig;
    // 如果有图片，先上传
    let uploadedImageUrl: string | undefined;
    if (runninghubConfig.imageBase64 && runninghubConfig.imageBase64.length > 0) {
      uploadedImageUrl = await uploadBase64ToRunninghub(runninghubConfig.imageBase64[0]!, apiKey ?? "", "https://www.runninghub.cn");
    }

    const endpoint = uploadedImageUrl ? "/openapi/v2/rhart-video-s/image-to-video" : "/openapi/v2/rhart-video-s/text-to-video";
    const requestBody = uploadedImageUrl
      ? {
          prompt: config.prompt,
          imageUrl: uploadedImageUrl,
          duration: String(runninghubConfig.duration) as "10" | "15",
          aspectRatio: runninghubConfig.aspectRatio,
        }
      : { prompt: config.prompt, model };
    const createRes = await axios.post(`https://www.runninghub.cn${endpoint}`, requestBody, {
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
    });

    const { taskId, status: initialStatus, errorMessage } = createRes.data;
    if (!taskId) throw new Error(`视频任务创建失败: ${errorMessage || "未知错误"}`);
    if (initialStatus === "FAILED") throw new Error(`任务创建失败: ${errorMessage}`);
    videoUrl = await pollTask(async () => {
      const res = await axios.post(
        `https://www.runninghub.cn/task/openapi/outputs`,
        { apiKey: apiKey?.replace("Bearer ", ""), taskId },
        { headers: { Authorization: "Bearer " + apiKey } },
      );
      const { code, msg, data } = res.data;

      // 成功完成
      if (code === 0 && msg === "success" && data?.[0]?.fileUrl) {
        return { completed: true, imageUrl: data[0].fileUrl };
      }

      // 进行中
      if (code === 804 || code === 813) {
        return { completed: false };
      }

      // 失败
      if (code === 805) {
        const failedReason = data?.[0]?.failedReason;
        let errorMsg = "未知原因";

        if (failedReason) {
          // 尝试多种可能的错误信息字段
          errorMsg =
            failedReason.exception_message ||
            failedReason.exceptionMessage ||
            failedReason.message ||
            failedReason.reason ||
            JSON.stringify(failedReason);
        }

        return {
          completed: false,
          error: `任务失败: ${errorMsg}`,
        };
      }

      // 其他未知状态
      return {
        completed: false,
        error: `未知状态: code=${code}, msg=${msg}, data=${JSON.stringify(data)}`,
      };
    });
  } else if (manufacturer === "openAi") {
    const openaiConfig = config as OpenAIVideoConfig;
    // 如果有图片，先上传
    let uploadedImageUrl: string | undefined;
    if (openaiConfig.imageBase64 && openaiConfig.imageBase64.length) {
      const base64Data = openaiConfig.imageBase64[0]!.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const formData = new FormData();
      formData.append("file", buffer, { filename: "image.jpg", contentType: "image/jpeg" });
      const uploadRes = await axios.post(`${baseURL}/videos`, formData, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...formData.getHeaders(),
        },
      });
      uploadedImageUrl = uploadRes.data?.id || uploadRes.data?.url;
    }

    // 创建视频生成任务
    const formData = new FormData();
    formData.append("model", model);
    formData.append("prompt", config.prompt);
    formData.append("seconds", String(openaiConfig.duration));

    // 根据 aspectRatio 设置 size
    const sizeMap: Record<string, string> = {
      "16:9": "1920x1080",
      "9:16": "1080x1920",
      "1:1": "1080x1080",
      "4:3": "1440x1080",
      "3:4": "1080x1440",
      "21:9": "2560x1080",
    };
    formData.append("size", sizeMap[openaiConfig.aspectRatio] || "1920x1080");
    if (uploadedImageUrl) {
      formData.append("input_reference", uploadedImageUrl);
    }
    const createRes = await axios.post(`${baseURL}/videos`, formData, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...formData.getHeaders(),
      },
    });

    const taskId = createRes.data?.id;

    if (!taskId) throw new Error("视频任务创建失败");
    // 轮询任务状态
    videoUrl = await pollTask(async () => {
      const res = await axios.get(`${baseURL}/videos/${taskId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });
      const { status, imageUrl, failReason } = res.data;
      if (status === "SUCCESS") return { completed: true, imageUrl };
      if (status === "FAILURE" || status === "CANCEL") {
        return { completed: false, error: `任务${status}: ${failReason || "未知原因"}` };
      }
      if (["NOT_START", "SUBMITTED", "IN_PROGRESS", "MODAL"].includes(status)) {
        return { completed: false };
      }
      return { completed: false, error: `未知状态: ${status}` };
    });
  } else if (manufacturer === "apimart") {
    // apimart 视频生成
    const apimartConfig = config as OpenAIVideoConfig;
    const apimartBaseURL = "https://api.apimart.ai";

    // 上传图片到 apimart 图床
    let imageUrls: string[] = [];
    if (apimartConfig.imageBase64 && apimartConfig.imageBase64.length > 0) {
      for (const base64Image of apimartConfig.imageBase64) {
        // 如果已经是 URL，直接使用
        if (base64Image.startsWith("http")) {
          imageUrls.push(base64Image);
          continue;
        }

        // 获取预签名 URL
        const presignRes = await axios.post(
          "https://apimart.ai/api/upload/presign",
          { contentType: "image/jpeg", fileExtension: "jpeg", permanent: false },
          { headers: { "Content-Type": "application/json" } },
        );

        if (!presignRes.data.success || !presignRes.data.presignedUrl || !presignRes.data.cdnUrl) {
          throw new Error(`获取预签名 URL 失败: ${JSON.stringify(presignRes.data)}`);
        }

        const { presignedUrl, cdnUrl } = presignRes.data;

        // 移除 base64 前缀并转为 buffer
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // 上传图片到预签名 URL
        await axios.put(presignedUrl, buffer, {
          headers: { "Content-Type": "image/jpeg" },
        });

        imageUrls.push(cdnUrl);
      }
    }

    // 创建视频生成任务
    const requestBody: {
      model: string;
      prompt: string;
      duration: number;
      aspect_ratio: string;
      image_urls?: string[];
    } = {
      model: model || "sora-2",
      prompt: config.prompt,
      duration: apimartConfig.duration,
      aspect_ratio: apimartConfig.aspectRatio,
    };

    if (imageUrls.length > 0) {
      requestBody.image_urls = imageUrls;
    }

    const createRes = await axios.post(`${apimartBaseURL}/v1/videos/generations`, requestBody, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (createRes.data.code !== 200 || !createRes.data.data?.[0]?.task_id) {
      const errorMsg = createRes.data.error?.message || JSON.stringify(createRes.data);
      throw new Error(`视频任务创建失败: ${errorMsg}`);
    }

    const taskId = createRes.data.data[0].task_id;

    // 轮询任务状态
    videoUrl = await pollTask(async () => {
      const res = await axios.get(`${apimartBaseURL}/v1/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        params: { language: "en" },
      });

      // 检查是否有错误
      if (res.data.error) {
        return {
          completed: false,
          error: `查询失败: ${res.data.error.message || JSON.stringify(res.data.error)}`,
        };
      }

      if (res.data.code !== 200) {
        return { completed: false, error: `查询失败: ${JSON.stringify(res.data)}` };
      }

      const { status, result } = res.data.data;

      if (status === "completed") {
        // 获取视频 URL
        const videoUrlResult = result?.videos?.[0]?.url?.[0];
        return { completed: true, imageUrl: videoUrlResult };
      }

      if (status === "failed" || status === "cancelled") {
        return { completed: false, error: `任务${status}` };
      }

      // 其他状态（submitted, processing 等）继续轮询
      return { completed: false };
    });
  } else {
    throw new Error(`不支持的厂商: ${manufacturer}`);
  }
  return videoUrl;
};
export const generateVideo = async (config: VideoConfig, manufacturer: string) => {
  if (!config.imageBase64 || config.imageBase64.length <= 0) throw new Error("未传图片");
  const configList = await u.getConfig("video", manufacturer);
  if (!configList || configList.length === 0) {
    throw new Error("未找到任何视频配置");
  }
  let lastError: Error | null = null;
  for (const configItem of configList) {
    // 每个配置项重试1次，共2次尝试
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const videoUrl = await generateVideoWithConfig(config, configItem);
        if (videoUrl) {
          const response = await axios.get(videoUrl, { responseType: "stream" });
          await u.oss.writeFile(config.savePath, response.data);
          return config.savePath;
        }
        return videoUrl;
      } catch (error: any) {
        lastError = error as Error;
        console.warn(`配置 ${configItem.model} 第 ${attempt + 1} 次尝试失败:`, error?.response?.data || error.message);
        // 如果是第一次尝试失败，继续重试
        if (attempt === 0) continue;
        // 第二次也失败了,跳到下一个配置项
        break;
      }
    }
  }
  // 所有配置都失败了
  throw new Error(`所有视频配置都失败了。最后一次错误: ${lastError?.message || "未知错误"}`);
};
