import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import u from "@/utils";
import { z } from "zod";
import { tool, jsonSchema } from "ai";
import { t, getLocale } from "@/i18n";
const router = express.Router();

// 检查语言模型
export default router.post(
  "/",
  validateFields({
    modelName: z.string(),
    id: z.string(),
    messages: z.array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    ),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { modelName, messages, id } = req.body;

    try {
      const vendorConfigData = await u.db("o_vendorConfig").where("id", id).first();

      if (!vendorConfigData) return res.status(500).send(error(t("setting.vendorConfig.modelTest.textTest.vendorConfigNotFound", {}, locale)));
      if (!vendorConfigData.models) return res.status(500).send(error(t("setting.vendorConfig.modelTest.textTest.modelListNotFound", {}, locale)));

      const modelList = await u.vendor.getModelList(vendorConfigData.id!);

      const getWeatherTool = tool({
        description: "Get the weather in a location",
        inputSchema: jsonSchema<{ location: string }>(
          z
            .object({
              location: z.string().describe("The location to get the weather for"),
            })
            .toJSONSchema(),
        ),
        execute: async ({ location }) => {
          return {
            location,
            temperature: 72 + Math.floor(Math.random() * 21) - 10,
          };
        },
      });

      const data = await u.Ai.Text(`${id}:${modelName}`).invoke({
        messages,
        tools: { getWeatherTool },
      });
      console.log("%c Line:46 🍐 data", "background:#6ec1c2", data);
      if (!data) return res.status(500).send(error(t("setting.vendorConfig.modelTest.textTest.noModelResult", {}, locale)));
      res.status(200).send(success({ thinking: data.reasoningText, content: data.text }));
    } catch (err) {
      console.error(err);
      const msg = u.error(err).message;
      console.error(msg);
      res.status(500).send(error(msg));
    }
  },
);
