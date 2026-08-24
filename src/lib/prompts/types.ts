import { FALLBACK_LOCALE, type Locale } from "@/i18n/types";

/**
 * Text for a seed prompt, keyed by locale. All four seed prompts (eventExtraction,
 * scriptAssetExtraction, videoPromptGeneration, audioBindPrompt) now have zh/en/vi populated.
 * The type stays `Partial` so a future seed prompt can still be added zh-only and translated later
 * without needing to touch any consumer of this shape — `resolveSeedText` falls back to
 * `FALLBACK_LOCALE` for any locale left empty.
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
