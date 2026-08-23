import express from "express";
import { serializeError } from "serialize-error";
import { success, error } from "@/lib/responseFormat";
import { validateFields, safeParseWithLocale } from "@/middleware/middleware";
import u from "@/utils";
import { z } from "zod";
import { transform } from "sucrase";
import { t, getLocale } from "@/i18n";
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
    const locale = await getLocale(req as any);
    try {
      const { tsCode, id } = req.body;
      const jsCode = transform(tsCode, { transforms: ["typescript"] }).code;
      const exports = u.vm(jsCode);
      if (!exports) return res.status(400).send(success(null, t("setting.vendorConfig.updateCode.mustExportObject", {}, locale)));
      if (!exports.textRequest)
        return res.status(400).send(success(null, t("setting.vendorConfig.updateCode.mustExportTextRequest", {}, locale)));
      if (!exports.imageRequest)
        return res.status(400).send(success(null, t("setting.vendorConfig.updateCode.mustExportImageRequest", {}, locale)));
      if (!exports.videoRequest)
        return res.status(400).send(success(null, t("setting.vendorConfig.updateCode.mustExportVideoRequest", {}, locale)));
      if (!exports.vendor) return res.status(400).send(success(null, t("setting.vendorConfig.updateCode.mustExportVendorObject", {}, locale)));
      const vendor = exports.vendor;
      // z.config() is global; resolve it right next to the parse call with no
      // await in between (see safeParseWithLocale in middleware.ts) so an
      // interleaved request cannot flip the locale used for these messages.
      const result = safeParseWithLocale(vendorConfigSchema, vendor, locale);
      if (!result.success) {
        const errorMsg = result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
        return res.status(400).send(error(t("setting.vendorConfig.updateCode.validationFailed", { errorMsg }, locale)));
      }
      await u
        .db("o_vendorConfig")
        .where("id", id)
        .update({
          models: JSON.stringify(vendor.models ?? []),
        });
      u.vendor.writeCode(id, tsCode);

      res.status(200).send(success(result.data));
    } catch (err) {
      console.log(err);
      res.status(400).send(error(serializeError(err).message || t("setting.vendorConfig.updateCode.unknownError", {}, locale)));
    }
  },
);
