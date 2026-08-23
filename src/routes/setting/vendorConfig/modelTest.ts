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
    type: z.enum(["text", "video", "image"]),
    id: z.string(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { modelName, type, id } = req.body;

    try {
      const requestFn: Record<string, { fnName: string; modelData?: any }> = {
        text: { fnName: "textRequest" },
        image: {
          fnName: "imageRequest",
          modelData: {
            // i18n-ignore — literal AI test prompt, not a user-facing string
            prompt: // i18n-ignore
              "一张16:9比例的图片，完美等分为2x2四宫格布局，各区域无缝衔接：\n左上宫格：一只可爱的猫，毛发蓬松，眼睛明亮，姿态俏皮\n右上宫格：一只友善的狗，金毛犬，表情愉悦，摇着尾巴\n左下宫格：一头健壮的牛，田园背景，目光温和，皮毛光泽\n右下宫格：一匹骏马，姿态优雅，鬃毛飘逸，肌肉健美\n风格要求：四个宫格风格统一，色彩鲜艳饱和，高清画质，细节清晰锐利，专业插画风格，线条干净，统一的左上方光源，柔和阴影，和谐配色，卡通/半写实风格，宫格间用白色或浅灰细线分隔", //图片提示词
            referenceList: [], //输入的图片提示词
            size: "1K", // 图片尺寸
            aspectRatio: "16:9",
          },
        },
        video: { fnName: "videoRequest", modelData: {} },
      } as const;
      const vendorConfigData = await u.db("o_vendorConfig").where("id", id).first();

      if (!vendorConfigData) return res.status(500).send(error(t("setting.vendorConfig.modelTest.vendorConfigNotFound", {}, locale)));
      if (!vendorConfigData.models) return res.status(500).send(error(t("setting.vendorConfig.modelTest.modelListNotFound", {}, locale)));

      const modelList = await u.vendor.getModelList(vendorConfigData.id!);

      const selectedModel = modelList.find((i: any) => i.modelName == modelName);
      if (type == "video") {
        requestFn["video"].modelData = {
          model: modelName,
          duration: selectedModel.durationResolutionMap[0].duration[0],
          resolution: selectedModel.durationResolutionMap[0].resolution[0],
          aspectRatio: "16:9",
          prompt:
            "A shirtless middle-aged man with a horse head is standing in a supermarket, carefully comparing two identical bottles of shampoo for 3 seconds, then suddenly bursts into tears, drops to his knees dramatically, a flock of pigeons explodes out of nowhere from behind him, the supermarket lights flicker, an old grandma nearby continues shopping completely unbothered, the horse head man instantly stops crying, puts both shampoo bottles back, and moonwalks away disappearing into the vegetable section. Security camera footage style, slightly grainy, 5 seconds.",
          referenceList: [],
          audio: false,
          mode: "text",
        };
      }
      const reqConfig = requestFn[type as "text" | "video" | "image"];

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

      if (type == "text") {
        const { textStream } = await u.Ai.Text(`${id}:${modelName}`).stream({
          prompt: "请调用工具获取火星的天气，并回答我多少气温", // i18n-ignore — literal AI test prompt, not a user-facing string
          tools: { getWeatherTool },
        });
        let fullResponse = "";
        for await (const chunk of textStream) {
          fullResponse += chunk;
        }
        if (!fullResponse) return res.status(500).send(error(t("setting.vendorConfig.modelTest.noModelResult", {}, locale)));
        res.status(200).send(success(fullResponse));
      } else {
        const aiTypeFn = {
          image: "Image",
          video: "Video",
        } as const;
        const reqFn = await u.Ai[aiTypeFn[type as "image" | "video"]](`${id}:${modelName}`).run({
          ...reqConfig.modelData,
        });
        await reqFn.save(type == "video" ? "test.mp4" : "testImage.jpg");
        const resultUrl = await u.oss.getFileUrl(type == "video" ? "test.mp4" : "testImage.jpg");
        res.status(200).send(success(resultUrl));
      }
    } catch (err) {
      console.error(err);
      const msg = u.error(err).message;
      console.error(msg);
      res.status(500).send(error(msg));
    }
  },
);
