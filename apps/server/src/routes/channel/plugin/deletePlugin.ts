import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import channelRequest from "@/lib/channelRequest";

const fields = { id: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER) };
const schema = z.strictObject(fields);

export default Router().post("/", validateFields(fields), (req, res) => channelRequest(req, res,
  (channel, options) => channel.deletePlugin(schema.parse(req.body).id, options), true));
