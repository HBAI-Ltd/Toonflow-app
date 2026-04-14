import express from "express";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import db from "@/utils/db";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    messagesPerSummary: z.number(),
    shortTermLimit: z.number(),
    summaryMaxLength: z.number(),
    summaryLimit: z.number(),
    ragLimit: z.number(),
    deepRetrieveSummaryLimit: z.number(),
    modelOnnxFile: z.array(z.string()),
    modelDtype: z.string(),
  }),
  async (req, res) => {
    const {
      messagesPerSummary,
      shortTermLimit,
      summaryMaxLength,
      summaryLimit,
      ragLimit,
      deepRetrieveSummaryLimit,
      modelOnnxFile,
      modelDtype,
    } = req.body;

    const upsert = async (key: string, value: string | number) => {
      const normalizedValue = String(value);
      const exists = await db("o_setting").where("key", key).first();

      if (exists) {
        await db("o_setting").where("key", key).update({ value: normalizedValue });
      } else {
        await db("o_setting").insert({ key, value: normalizedValue });
      }
    };

    await upsert("messagesPerSummary", messagesPerSummary);
    await upsert("shortTermLimit", shortTermLimit);
    await upsert("summaryMaxLength", summaryMaxLength);
    await upsert("summaryLimit", summaryLimit);
    await upsert("ragLimit", ragLimit);
    await upsert("deepRetrieveSummaryLimit", deepRetrieveSummaryLimit);
    await upsert("modelOnnxFile", JSON.stringify(modelOnnxFile));
    await upsert("modelDtype", modelDtype);

    res.status(200).send(success("保存设置成功"));
  },
);
