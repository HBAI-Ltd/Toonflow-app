import { z } from "zod";
import { modelAmountSchema } from "@toonflow/multi-tenant-models/config";

export const billingCurrencySchema = z.enum(["CNY", "USD"]);
export const billingCreditSchema = z.strictObject({
  userId: z.uuid(),
  currency: billingCurrencySchema,
  amount: modelAmountSchema.refine(value => /[1-9]/.test(value), "充值金额必须大于 0"),
  requestId: z.uuid(),
  note: z.string().trim().max(256).optional(),
});
const tokenCount = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
export const billingUsageSchema = z.strictObject({
  input: tokenCount.optional(),
  output: tokenCount.optional(),
  cacheRead: tokenCount.optional(),
  cacheWrite: tokenCount.optional(),
  requests: tokenCount.optional(),
  seconds: z.number().finite().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
});

export type BillingCurrency = z.infer<typeof billingCurrencySchema>;
export type BillingCredit = z.infer<typeof billingCreditSchema>;
export type BillingUsage = z.infer<typeof billingUsageSchema>;
export type BillingWallet = { currency: BillingCurrency; balance: string; reserved: string; available: string };
export type BillingTransaction = {
  id: string;
  kind: "credit" | "model";
  status: "reserved" | "settled" | "released";
  amount: string;
  currency: BillingCurrency;
  createdAt: number;
  label: string;
  note: string;
};
export type BillingSnapshot = { wallets: BillingWallet[]; transactions: BillingTransaction[] };
export type BillingChargeReceipt = { status: "reserved" | "settled" | "released"; amount: string; currency: BillingCurrency };
export type BillingReleaseMetadata = { actorId: string; reason: string };
export type BillingSettlement = { amount: string; currency: BillingCurrency; capped: boolean; status: "settled" | "released" };
