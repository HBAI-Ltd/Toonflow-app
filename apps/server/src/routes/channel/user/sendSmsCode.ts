import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import channelRequest from "@/lib/channelRequest";

const fields = {
  phone: z.string().trim().min(1).max(64),
  verify: z.strictObject({ ticket: z.string().min(1).max(16384), randstr: z.string().min(1).max(4096) }),
  isForget: z.union([z.literal(0), z.literal(1)]).nullable().optional(),
};
const schema = z.strictObject(fields);

export default Router().post("/", validateFields(fields), (req, res) => channelRequest(req, res,
  (source, options) => source.sendSmsCode(schema.parse(req.body), options)));
