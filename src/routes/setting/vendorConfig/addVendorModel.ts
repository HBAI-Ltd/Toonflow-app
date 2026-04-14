import express from "express";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import db from "@/utils/db";
import { z } from "zod";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    id: z.string(),
    model: z.discriminatedUnion("type", [
      z.object({
        name: z.string(),
        modelName: z.string(),
        type: z.literal("text"),
        think: z.boolean(),
      }),
      z.object({
        name: z.string(),
        modelName: z.string(),
        type: z.literal("image"),
        mode: z.array(z.enum(["text", "singleImage", "multiReference"])),
      }),
      z.object({
        name: z.string(),
        modelName: z.string(),
        type: z.literal("video"),
        mode: z.array(
          z.union([
            z.enum(["singleImage", "startEndRequired", "endFrameOptional", "startFrameOptional", "text", "audioReference", "videoReference"]),
            z.array(z.string().regex(/^(videoReference|imageReference|audioReference):\d+$/)),
          ]),
        ),
        audio: z.union([z.literal("optional"), z.boolean()]),
        durationResolutionMap: z.array(
          z.object({
            duration: z.array(z.number()),
            resolution: z.array(z.string()),
          }),
        ),
      }),
    ]),
  }),
  async (req, res) => {
    const { id, model } = req.body;

    const models = await db("o_vendorConfig").where("id", id).first("models");
    if (models?.models) {
      const existingModels = JSON.parse(models.models);
      existingModels.push(model);
      await db
        ("o_vendorConfig")
        .where("id", id)
        .update({
          models: JSON.stringify(existingModels),
        });
    }
    res.status(200).send(success("更新成功"));
  },
);
