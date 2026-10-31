import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import channelRequest from "@/lib/channelRequest";

const fields = {
  status: z.enum(["available", "used", "expired"]),
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(Number.MAX_SAFE_INTEGER)),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100)),
};
const schema = z.strictObject(fields);

export default Router().get("/", validateFields(fields, "query"), (req, res) => channelRequest(req, res,
  (channel, options) => channel.getWalletBonusBatches(schema.parse(req.query), options), true));
