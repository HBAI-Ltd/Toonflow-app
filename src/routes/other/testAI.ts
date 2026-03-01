import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import u from "@/utils";
import { z } from "zod";
import { tool } from "ai";
const router = express.Router();

// 检查语言模型
export default router.post(
  "/",
  validateFields({
    modelName: z.string(),
    apiKey: z.string(),
    baseURL: z.string().optional(),
    manufacturer: z.string(),
  }),
  async (req, res) => {
    const { modelName, apiKey, baseURL, manufacturer } = req.body;

    const getWeatherTool = tool({
      description: "Get the weather in a location",
      inputSchema: z.object({
        location: z.string().describe("The location to get the weather for"),
      }),
      execute: async ({ location }) => {
        return {
          location,
          temperature: 72 + Math.floor(Math.random() * 21) - 10,
        };
      },
    });
    try {
      const { reply } = await u.ai.text.invoke(
        {
          prompt: "请调用工具获取北京的天气，并回答我多少气温",
          tools: { getWeatherTool },
          output: {
            reply: z.string().describe("回复内容"),
          },
        },
        {
          model: modelName,
          apiKey,
          baseURL,
          manufacturer,
        },
      );
      res.status(200).send(success(reply));
    } catch (err) {
      const msg = u.error(err).message;
      console.error(msg);
      res.status(500).send(error(msg));
    }
  },
);
