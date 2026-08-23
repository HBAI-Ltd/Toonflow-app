export const LOCALES = ["en", "vi", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const FALLBACK_LOCALE: Locale = "zh";
