import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import u from "@/utils";
import { z } from "zod";
import { transform } from "sucrase";
import { t, getLocale } from "@/i18n";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    id: z.string(),
    inputValues: z.record(z.string(), z.string()),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { id, inputValues } = req.body;

    await u
      .db("o_vendorConfig")
      .where("id", id)
      .update({
        inputValues: JSON.stringify(inputValues),
      });
    res.status(200).send(success(null, t("setting.vendorConfig.updateVendorInputs.updated", {}, locale)));
  },
);
