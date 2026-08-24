import { FALLBACK_LOCALE, type Locale } from "@/i18n/types";

/**
 * Text for a seed prompt, keyed by locale. Only `zh` is populated today — `en`/`vi` are left
 * empty on purpose (this task moves text, it does not translate it). A later task fills in the
 * missing locales without needing to touch any consumer of this shape.
 */
export type LocaleText = Partial<Record<Locale, string>>;

/**
 * Resolves the text for `locale`, falling back to `FALLBACK_LOCALE` exactly the way
 * src/i18n/translate.ts's `createTranslator` falls back for UI copy.
 */
export function resolveSeedText(text: LocaleText, locale: Locale): string {
  const value = text[locale] ?? text[FALLBACK_LOCALE];
  if (value === undefined) {
    throw new Error(`[prompts] no seed text for locale "${locale}" or fallback "${FALLBACK_LOCALE}"`);
  }
  return value;
}
