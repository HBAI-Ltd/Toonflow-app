export type Wallet = { balance: number; currency: string; multiplier: number | null; effectiveMultiplier: number; billingEnabled: boolean };
export type LedgerEntry = { id: string; taskId: string | null; actorId: string | null; amount: number; balance: number; note: string; createdAt: number };
export type TaskBilling = {
  status: string; currency: string; enabled?: boolean; multiplier: number | null; upstreamAmount: number | null; chargedAmount: number | null;
  requests: { requestId: string | null; status: string; note: string; upstreamAmount: number | null; chargedAmount: number | null }[];
};

const moneyFormat = new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
export function formatMoney(value: number | null | undefined) { return value == null ? "—" : `¥${moneyFormat.format(value)}`; }
export function billingStatus(value?: TaskBilling) {
  if (!value || value.status === "legacy") return "历史记录，未计费";
  if (value.status === "untracked") return "无可核对账单";
  if (value.status === "pending") return "待核对";
  return value.enabled ? "已结算" : "已核对，计费关闭";
}
