import { DEFAULT_LOCALE, type Locale } from "./types";
import { isLocale } from "./translate";

export const LANGUAGE_SETTING_KEY = "content_language";

/** Chấp nhận cả mã ngắn (`vi`) lẫn mã đầy đủ của giao diện (`vi-VN`). */
export function localeFromHeader(header: unknown): Locale | null {
  if (typeof header !== "string") return null;
  const base = header.trim().toLowerCase().split("-")[0];
  return isLocale(base) ? base : null;
}

export async function getLocale(req?: { headers: Record<string, unknown> }): Promise<Locale> {
  const fromHeader = localeFromHeader(req?.headers?.["x-toonflow-lang"]);
  if (fromHeader) return fromHeader;

  const u = (await import("@/utils")).default;
  const row = await u.db("o_setting").where("key", LANGUAGE_SETTING_KEY).first();
  return isLocale(row?.value) ? row.value : DEFAULT_LOCALE;
}

export async function setLocale(locale: Locale): Promise<void> {
  const u = (await import("@/utils")).default;
  const existing = await u.db("o_setting").where("key", LANGUAGE_SETTING_KEY).first();
  if (existing) {
    await u.db("o_setting").where("key", LANGUAGE_SETTING_KEY).update({ value: locale });
  } else {
    await u.db("o_setting").insert({ key: LANGUAGE_SETTING_KEY, value: locale });
  }
}
