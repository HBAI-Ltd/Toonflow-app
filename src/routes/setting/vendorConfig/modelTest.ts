import express from "express";
import { tool } from "ai";
import { z } from "zod";
import Ai from "@/utils/ai";
import normalizeError from "@/utils/error";
import oss from "@/utils/oss";
import db from "@/utils/db";
import * as vendorUtils from "@/utils/vendor";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    modelName: z.string(),
    type: z.enum(["text", "video", "image"]),
    id: z.string(),
  }),
  async (req, res) => {
    const { modelName, type, id } = req.body;

    try {
      const requestConfig: {
        image: {
          prompt: string;
          referenceList: never[];
          size: "1K";
          aspectRatio: "16:9";
        };
        video: Record<string, unknown>;
      } = {
        image: {
          prompt:
            "A 2x2 animal collage illustration with a cat, dog, cow, and horse in four clean panels, bright colors, consistent lighting, polished digital art.",
          referenceList: [],
          size: "1K",
          aspectRatio: "16:9",
        },
        video: {},
      };

      const vendorConfigData = await db("o_vendorConfig").where("id", id).first();
      if (!vendorConfigData) return res.status(500).send(error("Vendor config not found"));
      if (!vendorConfigData.models) return res.status(500).send(error("Vendor models not found"));

      const modelList = await vendorUtils.getModelList(vendorConfigData.id!);
      const selectedModel = modelList.find((item: { modelName?: string }) => item.modelName === modelName);

      if (!selectedModel) return res.status(400).send(error("Model not found"));

      // Baseline tests should not depend on live third-party model availability.
      if (process.env.TOONFLOW_MOCK_VENDOR_TEST === "1") {
        return res.status(200).send(success(`[mock vendor test] ${id}:${modelName}:${type}`));
      }

      if (type === "video") {
        requestConfig.video = {
          model: modelName,
          duration: selectedModel.durationResolutionMap[0].duration[0],
          resolution: selectedModel.durationResolutionMap[0].resolution[0],
          aspectRatio: "16:9",
          prompt:
            "A surreal supermarket scene where a horse-headed man compares shampoo, cries dramatically, then moonwalks away. Security-camera style.",
          referenceList: [],
          audio: false,
          mode: ["text"],
        };
      }

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

      if (type === "text") {
        const { textStream } = await Ai.Text(`${id}:${modelName}`).stream({
          prompt: "Use the weather tool to tell me the weather on Mars.",
          tools: { getWeatherTool },
        });

        let fullResponse = "";
        for await (const chunk of textStream) {
          fullResponse += chunk;
        }

        if (!fullResponse) return res.status(500).send(error("Model returned empty response"));
        return res.status(200).send(success(fullResponse));
      }

      const aiTypeFn = {
        image: "Image",
        video: "Video",
      } as const;
      const filename = type === "video" ? "test.mp4" : "testImage.jpg";
      const reqFn = await Ai[aiTypeFn[type as "image" | "video"]](`${id}:${modelName}`).run(
        requestConfig[type as "image" | "video"] as any,
      );

      await reqFn.save(filename);
      const resultUrl = await oss.getFileUrl(filename);
      return res.status(200).send(success(resultUrl));
    } catch (err) {
      console.error(err);
      const msg = normalizeError(err).message;
      console.error(msg);
      return res.status(500).send(error(msg));
    }
  },
);
