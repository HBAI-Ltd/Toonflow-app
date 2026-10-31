import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import channelRequest from "@/lib/channelRequest";

const fields = {
  userName: z.string().trim().min(1).max(320),
  password: z.string().min(1).max(4096),
  captcha: z.string().trim().min(1).max(128),
  originalCaptcha: z.string().min(1).max(4096),
};
const schema = z.strictObject(fields);

export default Router().post("/", validateFields(fields), (req, res) => channelRequest(req, res,
  (source, options) => source.login(schema.parse(req.body), options)));
