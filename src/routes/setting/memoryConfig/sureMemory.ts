import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();

// 获取用户
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
    const locale = await getLocale(req as any);
    const { messagesPerSummary, shortTermLimit, summaryMaxLength, summaryLimit, ragLimit, deepRetrieveSummaryLimit, modelOnnxFile, modelDtype } =
      req.body;

    const upsert = async (key: string, value: string) => {
      const exists = await u.db("o_setting").where("key", key).first();
      if (exists) {
        await u.db("o_setting").where("key", key).update({ value });
      } else {
        await u.db("o_setting").insert({ key, value });
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

    res.status(200).send(success(null, t("setting.memoryConfig.sureMemory.saved", {}, locale)));
  },
);
