import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import channelRequest from "@/lib/channelRequest";

const fields = {
  phone: z.string().trim().min(1).max(64),
  verificationCode: z.string().trim().min(1).max(128),
  newPassword: z.string().min(6).max(4096),
  confirmPassword: z.string().min(6).max(4096),
};
const schema = z.strictObject(fields).refine(value => value.newPassword === value.confirmPassword, {
  path: ["confirmPassword"], message: "两次输入的密码不一致",
});

export default Router().post("/", validateFields(fields), (req, res) => channelRequest(req, res,
  (source, options) => source.forgotPassword(schema.parse(req.body), options)));
