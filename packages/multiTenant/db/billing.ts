export const maxWalletMicros = Number.MAX_SAFE_INTEGER;

export function validateWalletAmount(amount: number) {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw Object.assign(new Error("钱包金额必须是安全范围内的非负整数"), { status: 400, code: "walletAmountInvalid" });
  }
}

export function walletStateConflict(): never {
  throw Object.assign(new Error("钱包账本状态不一致，请联系管理员"), { status: 409, code: "walletStateConflict" });
}

export function walletBalanceOverflow(): never {
  throw Object.assign(new Error("钱包余额超过安全范围"), { status: 409, code: "walletBalanceOverflow" });
}

export function walletSettlementExceeded(): never {
  throw Object.assign(new Error("结算金额不能超过预占金额"), { status: 400, code: "walletSettlementExceeded" });
}
