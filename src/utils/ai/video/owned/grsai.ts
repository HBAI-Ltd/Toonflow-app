import "../type";
import fs from "fs";
import path from "path";
import axios from "axios";
import { pollTask, validateVideoConfig } from "@/utils/ai/utils";

const buildInlineImage = (data: string) => ({ inlineData: { mimeType: "image/png", data } });

export default async (input: VideoConfig, config: AIConfig) => {
  if (!config.model) throw new Error("缺少Model名称");
  if (!config.apiKey) throw new Error("缺少API Key");

  // const { owned, images, hasStartEndType } = validateVideoConfig(input, config);

  const defaultBaseUrl = ["https://grsai.dakka.com.cn/v1/video/{model}", "https://grsai.dakka.com.cn/v1/draw/result"].join("|");

  const [submitUrl, queryUrl] = (config.baseURL || defaultBaseUrl).split("|");

  const headers = { Authorization: "Bearer " + config.apiKey };
  let inputObj: Record<string, any> = {};
  let taskUrl = submitUrl.replace("{model}", config.model);
  if (config.model.includes("veo")) {
    inputObj = {
      model: config.model,
      prompt: input.prompt,
      firstFrameUrl: "",
      lastFrameUrl: "",
      aspectRatio: input.aspectRatio,
      webHook: "-1",
    };
    inputObj.firstFrameUrl = input.imageBase64?.[0] ?? "";
    inputObj.lastFrameUrl = input.imageBase64?.[1] ?? "";

    taskUrl = submitUrl.replace("{model}", "veo");
  } else {
    inputObj = {
      model: config.model,
      prompt: input.prompt,
      url: "",
      aspectRatio: input.aspectRatio,
      duration: +input.duration,
      webHook: "-1",
    };
    inputObj.url = input.imageBase64?.[0] ?? "";

    taskUrl = submitUrl.replace("{model}", "sora-video");
  }

  const { data } = await axios.post(taskUrl, { ...inputObj }, { headers: { ...headers, "Content-Type": "application/json" } });

  if (data.code != 0) throw new Error(`任务提交失败: ${data ? JSON.stringify(data, null, 2) : "未知错误"}`);

  return await pollTask(async () => {
    const { data: queryData } = await axios.post(
      queryUrl,
      {
        id: data.data.id,
      },
      {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      },
    );
    if (queryData.code != 0) throw new Error(`查询任务失败: ${queryData ? JSON.stringify(queryData, null, 2) : "未知错误"}`);
    const { status, error, failure_reason, url } = queryData.data || {};

    if (status === "failed") {
      return { completed: false, error: failure_reason + "\n" + error || "图片生成失败" };
    }

    if (status === "succeeded") {
      return { completed: true, url: url };
    }

    return { completed: false };
  });
};
