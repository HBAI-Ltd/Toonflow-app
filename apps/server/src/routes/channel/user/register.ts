import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import channelRequest from "@/lib/channelRequest";

const fields = {
  userName: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(64),
  password: z.string().min(6).max(4096),
  verificationCode: z.string().trim().min(1).max(128),
  invitationCode: z.string().trim().max(200).optional(),
};
const schema = z.strictObject(fields);

export default Router().post("/", validateFields(fields), (req, res) => channelRequest(req, res,
  (source, options) => source.register(schema.parse(req.body), options)));
