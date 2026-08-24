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
  if (fromHeader) {
    // Keep the stored setting following the UI: startup work (fixDB, the prompt seed sync,
    // i18nSeed) runs with no request and can only read the stored o_setting value, so if the
    // frontend has been sending a header locale that never gets persisted, that work keeps
    // resolving to the stale/default stored locale forever. Persisting here — the one place a
    // header locale is actually observed — is best-effort: getLocale is on the hot path for
    // nearly every route, so a persistence failure (or the read it requires to know whether
    // anything even changed) must never fail the request itself. persistLocaleFromHeader does
    // not call getLocale, so this cannot recurse.
    await persistLocaleFromHeader(fromHeader).catch((err) => {
      console.error(`Failed to save locale "${fromHeader}" from request header to settings; continuing with that locale anyway.`, err);
    });
    return fromHeader;
  }

  const u = (await import("@/utils")).default;
  const row = await u.db("o_setting").where("key", LANGUAGE_SETTING_KEY).first();
  return isLocale(row?.value) ? row.value : DEFAULT_LOCALE;
}

/**
 * Writes `locale` into o_setting only when it differs from what's currently stored there — a
 * request whose header already matches the stored value must not touch the database at all.
 * Deliberately self-contained (does its own existing-row lookup rather than calling setLocale,
 * which does the same lookup) so it is obvious by inspection that this write path never calls back
 * into getLocale.
 */
async function persistLocaleFromHeader(locale: Locale): Promise<void> {
  const u = (await import("@/utils")).default;
  const existing = await u.db("o_setting").where("key", LANGUAGE_SETTING_KEY).first();
  if (isLocale(existing?.value) && existing.value === locale) return;
  if (existing) {
    await u.db("o_setting").where("key", LANGUAGE_SETTING_KEY).update({ value: locale });
  } else {
    await u.db("o_setting").insert({ key: LANGUAGE_SETTING_KEY, value: locale });
  }
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
