import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import channelRequest from "@/lib/channelRequest";

const timestamp = z.number().int().nonnegative().refine(value => Number.isFinite(new Date(value).getTime()));
const fields = { key: z.string().trim().max(1000).optional(), startTime: timestamp, finishTime: timestamp };
const schema = z.strictObject(fields).refine(value => value.finishTime >= value.startTime, {
  path: ["finishTime"], message: "结束时间不能早于开始时间",
});

export default Router().post("/", validateFields(fields), (req, res) => channelRequest(req, res,
  (channel, options) => channel.getPointsConsumption(schema.parse(req.body), options), true));
