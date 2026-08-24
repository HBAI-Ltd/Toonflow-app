import type { Knex } from "knex";
import { DEFAULT_LOCALE, type Locale } from "./types";
import { isLocale } from "./translate";

export const LANGUAGE_SETTING_KEY = "content_language";

/**
 * `prompt_language` is deliberately a separate o_setting key from `content_language`: the UI can be
 * fully localized while the text actually sent to image/video models defaults to English, which is
 * the high-resource language for those models — a Vietnamese/Chinese prompt can measurably degrade
 * generation quality. See getPromptLanguage/setPromptLanguage below and src/i18n/index.ts's export
 * list; every reader of data/modelPrompt or data/skills content that feeds a model must resolve
 * locale through getPromptLanguage(), never getLocale()/content_language.
 */
export const PROMPT_LANGUAGE_SETTING_KEY = "prompt_language";

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
  await writeLocaleIfChanged(locale, u.db);
}

export async function setLocale(locale: Locale): Promise<void> {
  const u = (await import("@/utils")).default;
  await writeLocaleIfChanged(locale, u.db);
}

/**
 * Single choke point for both places the stored content_language changes: setLocale (called by
 * POST /api/setting/language/setLanguage) and the header-driven persistence inside getLocale.
 * Writes o_setting.content_language only when the value actually differs from what's stored.
 *
 * Does NOT re-sync the guarded seed prompts (o_prompt) — those are model-facing text and follow
 * prompt_language instead (see writePromptLanguageIfChanged below). content_language only drives
 * what a person reads (API messages, the skill-manual viewer, etc.), so changing it must not touch
 * the seeded prompts sent to a model.
 */
async function writeLocaleIfChanged(locale: Locale, db: Knex): Promise<void> {
  const existing = await db("o_setting").where("key", LANGUAGE_SETTING_KEY).first();
  if (isLocale(existing?.value) && existing.value === locale) return;
  if (existing) {
    await db("o_setting").where("key", LANGUAGE_SETTING_KEY).update({ value: locale });
  } else {
    await db("o_setting").insert({ key: LANGUAGE_SETTING_KEY, value: locale });
  }
}

/**
 * Reads o_setting.prompt_language — the locale for text actually sent to image/video models
 * (data/modelPrompt files, the guarded o_prompt seed rows, data/skills content fed to a model).
 * Absent (pre-existing install with no row, or a DB seeded before this setting existed) resolves
 * to DEFAULT_LOCALE ("en") without needing a migration, mirroring how getLocale falls back for
 * content_language. Deliberately independent of content_language and of the request header: the
 * UI's display language and the language a model is prompted in are two different concerns.
 */
export async function getPromptLanguage(): Promise<Locale> {
  const u = (await import("@/utils")).default;
  const row = await u.db("o_setting").where("key", PROMPT_LANGUAGE_SETTING_KEY).first();
  return isLocale(row?.value) ? row.value : DEFAULT_LOCALE;
}

export async function setPromptLanguage(locale: Locale): Promise<void> {
  const u = (await import("@/utils")).default;
  await writePromptLanguageIfChanged(locale, u.db);
}

/**
 * Single choke point for the stored prompt_language changing (POST
 * /api/setting/language/setPromptLanguage today). Writes o_setting.prompt_language only when the
 * value actually differs from what's stored — and, only on that actual change, re-syncs the guarded
 * seed prompts (o_prompt) to the new locale via syncGuardedPromptSeeds, so a prompt-language switch
 * takes effect immediately instead of only on the next app restart (fixDB.ts also runs this at
 * startup). This is the old writeLocaleIfChanged behaviour, moved here because the seed prompts are
 * model-facing text and must follow prompt_language, not content_language.
 *
 * The prompt sync is best-effort: its failure is caught and logged here in plain English and never
 * propagates, because setPromptLanguage is called directly from its route with no wrapping catch of
 * its own — a sync failure must not fail that request.
 *
 * No recursion: syncGuardedPromptSeeds takes the knex connection and locale as plain arguments and
 * never calls getLocale/setLocale/getPromptLanguage/setPromptLanguage itself.
 */
async function writePromptLanguageIfChanged(locale: Locale, db: Knex): Promise<void> {
  const existing = await db("o_setting").where("key", PROMPT_LANGUAGE_SETTING_KEY).first();
  if (isLocale(existing?.value) && existing.value === locale) return;
  if (existing) {
    await db("o_setting").where("key", PROMPT_LANGUAGE_SETTING_KEY).update({ value: locale });
  } else {
    await db("o_setting").insert({ key: PROMPT_LANGUAGE_SETTING_KEY, value: locale });
  }

  const { syncGuardedPromptSeeds } = await import("@/lib/migrations/promptSeedSync");
  await syncGuardedPromptSeeds(db, locale).catch((err) => {
    console.error(`Failed to re-sync seed prompts to prompt language "${locale}" after a change; continuing with the change anyway.`, err);
  });
}
