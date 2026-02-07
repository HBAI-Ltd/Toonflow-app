import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
import { OpenAIChatModel } from "@aigne/openai";
const router = express.Router();

// 检查语言模型
export default router.post(
  "/",
  validateFields({
    modelName: z.string(),
    apiKey: z.string(),
    baseURL: z.string().optional(),
  }),
  async (req, res) => {
    const { modelName, apiKey, baseURL } = req.body;

    try {
      const model = new OpenAIChatModel({
        apiKey: apiKey ?? "",
        baseURL: baseURL ?? "",
        model: modelName,
        modelOptions: { temperature: 0.7 },
      });

      const result = await model.invoke({
        messages: [{ role: "user", content: "请回复：连接成功" }],
      });

      const reply = result?.text || result?.json || "连接成功";
      console.log("testAI reply:", reply);
      res.status(200).send(success(reply));
    } catch (err) {
      console.log(err);
      if (typeof err === "string") return res.status(500).send(error(err));
      const msg = err instanceof Error ? err.message : (err as any)?.error?.message;
      return res.status(500).send(error(msg || "未知错误"));
    }
  },
);
