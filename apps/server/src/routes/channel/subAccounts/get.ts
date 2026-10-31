import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import channelRequest from "@/lib/channelRequest";

const fields = {
  page: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  limit: z.number().int().min(1).max(100),
  credential: z.string().trim().max(1000).optional(),
};
const schema = z.strictObject(fields);

export default Router().post("/", validateFields(fields), (req, res) => channelRequest(req, res,
  (channel, options) => channel.getSubAccounts(schema.parse(req.body), options), true));
