import type { ModelPrice } from "./config";

export type ModelPriceUsage = {
  input?: number;
  output?: number;
  cacheRead?: number;
  cacheWrite?: number;
  requests?: number;
  seconds?: number;
};

function invalid(): never {
  throw Object.assign(new Error("模型计价参数无效"), { status: 400 });
}

function priceMicros(value: string) {
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(value)) invalid();
  const [whole, fraction = ""] = value.split(".");
  const micros = BigInt(whole!) * 1000000n + BigInt(fraction.padEnd(6, "0"));
  if (micros > 1000000000000000n) invalid();
  return micros;
}

function quantity(value: number) {
  if (!Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) invalid();
  const [significand, exponent = "0"] = String(value).split("e");
  const [whole, fraction = ""] = significand!.split(".");
  const scale = fraction.length - Number(exponent);
  const digits = BigInt(`${whole}${fraction}`);
  return scale < 0
    ? { numerator: digits * 10n ** BigInt(-scale), denominator: 1n }
    : { numerator: digits, denominator: 10n ** BigInt(scale) };
}

function amount(numerator: bigint, denominator: bigint) {
  const micros = (numerator + denominator - 1n) / denominator;
  const whole = micros / 1000000n;
  const fraction = (micros % 1000000n).toString().padStart(6, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function calculateModelPrice(price: ModelPrice, usage: ModelPriceUsage): { amount: string; currency: ModelPrice["currency"] } | null {
  if (price.mode === "perMillionTokens") {
    let numerator = 0n;
    for (const key of ["input", "output", "cacheRead", "cacheWrite"] as const) {
      const rate = priceMicros(price[key]);
      const count = usage[key];
      if (count === undefined) {
        if (rate > 0n) return null;
        continue;
      }
      if (!Number.isSafeInteger(count) || count < 0) invalid();
      numerator += rate * BigInt(count);
    }
    return { amount: amount(numerator, 1000000n), currency: price.currency };
  }
  const count = price.mode === "perRequest" ? usage.requests === undefined ? 1 : usage.requests : usage.seconds;
  if (count === undefined) return null;
  const value = quantity(count);
  return { amount: amount(priceMicros(price.amount) * value.numerator, value.denominator), currency: price.currency };
}
