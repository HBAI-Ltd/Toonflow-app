import express from "express";
import { error, success } from "@/lib/responseFormat";
import db from "@/utils/db";

const router = express.Router();

export default router.get("/", async (req, res) => {
  const settingData = await db("o_setting").whereIn("key", [
    "messagesPerSummary",
    "shortTermLimit",
    "summaryMaxLength",
    "summaryLimit",
    "ragLimit",
    "deepRetrieveSummaryLimit",
    "modelOnnxFile",
    "modelDtype",
  ]);

  if (!settingData) return res.status(400).send(error("获取记忆配置失败"));

  const memoryObj: Record<string, number | string | string[]> = {};

  settingData.forEach((item) => {
    if (item.key && item.value) {
      let value: number | string | string[] = item.value;

      if (item.key === "modelOnnxFile") {
        value = JSON.parse(item.value);
      } else if (item.key !== "modelDtype") {
        value = Number(value);
      }

      memoryObj[item.key] = value;
    }
  });

  res.status(200).send(success({ ...memoryObj }));
});
