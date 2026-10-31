import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import channelRequest from "@/lib/channelRequest";

const fields = { orderNumber: z.string().trim().min(1).max(200) };
const schema = z.strictObject(fields);

export default Router().get("/", validateFields(fields, "query"), (req, res) => channelRequest(req, res,
  (channel, options) => channel.getWalletPaymentStatus(schema.parse(req.query).orderNumber, options), true));
