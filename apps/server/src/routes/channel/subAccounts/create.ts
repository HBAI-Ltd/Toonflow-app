import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import channelRequest from "@/lib/channelRequest";

const fields = {
  name: z.string().trim().min(1).max(200),
  quotaType: z.union([z.literal(0), z.literal(1)]),
  expirationType: z.union([z.literal(0), z.literal(1)]),
  balance: z.number().finite().nonnegative().optional(),
  expiresAt: z.number().int().refine(value => Number.isFinite(new Date(value).getTime())).optional(),
};
const schema = z.strictObject(fields)
  .refine(value => value.quotaType === 1 ? value.balance !== undefined : value.balance === undefined, {
    path: ["balance"], message: "限额时必须设置额度，不限额时无需设置额度",
  })
  .refine(value => value.expirationType === 1 ? value.expiresAt !== undefined && value.expiresAt > Date.now() : value.expiresAt === undefined, {
    path: ["expiresAt"], message: "请选择未来的到期时间，永久有效时无需设置到期时间",
  });

export default Router().post("/", validateFields(fields), (req, res) => channelRequest(req, res,
  (channel, options) => channel.createSubAccount(schema.parse(req.body), options), true));
