import express from "express";
import { serializeError } from "serialize-error";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import db from "@/utils/db";
import runCode from "@/utils/vm";
import * as vendorUtils from "@/utils/vendor";
import { z } from "zod";
import { transform } from "sucrase";

const router = express.Router();

const vendorConfigSchema = z.object({
  id: z.string(),
  author: z.string(),
  description: z.string().optional(),
  name: z.string(),
  icon: z.string().optional(),
  inputs: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      type: z.enum(["text", "password", "url"]),
      required: z.boolean(),
      placeholder: z.string().optional(),
    }),
  ),
  inputValues: z.record(z.string(), z.string()),
  models: z.array(
    z.discriminatedUnion("type", [
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
  ),
});

export default router.post(
  "/",
  validateFields({
    id: z.string(),
    tsCode: z.string(),
  }),
  async (req, res) => {
    try {
      const { tsCode, id } = req.body;
      const jsCode = transform(tsCode, { transforms: ["typescript"] }).code;
      const exports = runCode(jsCode);

      if (!exports) return res.status(400).send(success("\u811a\u672c\u6587\u4ef6\u5fc5\u987b\u5bfc\u51fa\u5bf9\u8c61"));
      if (!exports.textRequest) return res.status(400).send(success("\u811a\u672c\u6587\u4ef6\u5fc5\u987b\u5bfc\u51fa\u6587\u672c\u8bf7\u6c42\u5bf9\u8c61"));
      if (!exports.imageRequest) return res.status(400).send(success("\u811a\u672c\u6587\u4ef6\u5fc5\u987b\u5bfc\u51fa\u56fe\u50cf\u8bf7\u6c42\u5bf9\u8c61"));
      if (!exports.videoRequest) return res.status(400).send(success("\u811a\u672c\u6587\u4ef6\u5fc5\u987b\u5bfc\u51fa\u89c6\u9891\u8bf7\u6c42\u5bf9\u8c61"));
      if (!exports.vendor) return res.status(400).send(success("\u811a\u672c\u6587\u4ef6\u5fc5\u987b\u5bfc\u51favendor\u5bf9\u8c61"));

      const vendor = exports.vendor;
      const result = vendorConfigSchema.safeParse(vendor);
      if (!result.success) {
        const errorMsg = result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
        return res.status(400).send(error(`vendor\u914d\u7f6e\u6821\u9a8c\u5931\u8d25: ${errorMsg}`));
      }

      const existingVendor = await db("o_vendorConfig").where("id", id).first();
      if (!existingVendor) {
        return res.status(400).send(error("\u4f9b\u5e94\u5546id\u4e0d\u5b58\u5728"));
      }

      if (vendor.id !== id) {
        return res.status(400).send(error("\u8bf7\u6c42id\u4e0evendor.id\u4e0d\u4e00\u81f4"));
      }

      await db("o_vendorConfig")
        .where("id", id)
        .update({
          inputValues: JSON.stringify(vendor.inputValues ?? {}),
          models: JSON.stringify(vendor.models ?? []),
        });
      vendorUtils.writeCode(id, tsCode);

      res.status(200).send(success(result.data));
    } catch (err) {
      console.log(err);
      res.status(400).send(error(serializeError(err).message || "\u672a\u77e5\u9519\u8bef"));
    }
  },
);
