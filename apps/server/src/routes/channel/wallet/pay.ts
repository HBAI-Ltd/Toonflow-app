import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import channelRequest from "@/lib/channelRequest";

const fields = {
  comboId: z.union([z.literal(-1), z.number().int().min(1).max(Number.MAX_SAFE_INTEGER)]),
  payType: z.enum(["wechat", "alipay"]),
  customMoney: z.number().min(1).refine(value => Number(value.toFixed(2)) === value).optional(),
  expectedAmount: z.number().min(0.01).refine(value => Number(value.toFixed(2)) === value),
  expectedBonusAmount: z.number().nonnegative(),
  expectedBonus: z.strictObject({
    bonusAmount: z.number().nonnegative(),
    bonusActivityName: z.string().nullable(),
    bonusExpireMode: z.enum(["days", "fixed"]).nullable(),
    bonusValidDays: z.number().int().positive().nullable(),
    bonusExpiresAt: z.number().int().nonnegative().refine(value => Number.isFinite(new Date(value).getTime())).nullable(),
  }),
};
const schema = z.strictObject(fields).refine(value => value.comboId !== -1 || value.customMoney !== undefined, {
  path: ["customMoney"], message: "请输入 1 元及以上的自定义充值金额，最多保留两位小数",
});

export default Router().post("/", validateFields(fields), (req, res) => channelRequest(req, res,
  (channel, options) => channel.createWalletPayment(schema.parse(req.body), options), true));
