import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import channelRequest from "@/lib/channelRequest";

const timestamp = z.number().int().refine(value => Number.isFinite(new Date(value).getTime()), "统计时间格式不正确");
const fields = {
  startTime: timestamp,
  finishTime: timestamp,
  modelName: z.string().trim().max(200).optional(),
  keyId: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER).optional(),
  groupBy: z.enum(["model", "key"]).optional(),
};
const schema = z.strictObject(fields).refine(value => value.finishTime >= value.startTime
  && value.finishTime - value.startTime <= 31 * 24 * 60 * 60 * 1000, {
  path: ["finishTime"], message: "统计时间范围必须在 31 天以内，且结束时间不能早于开始时间",
});

export default Router().post("/", validateFields(fields), (req, res) => channelRequest(req, res,
  (source, options) => source.getUsageStatistics(schema.parse(req.body), options), true));
