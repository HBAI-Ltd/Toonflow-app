import en from "./locales/en.json";
import vi from "./locales/vi.json";
import zh from "./locales/zh.json";
import { DEFAULT_LOCALE, FALLBACK_LOCALE, LOCALES, type Locale } from "./types";

export type Catalog = Record<string, string>;

const CATALOGS: Record<Locale, Catalog> = { en, vi, zh };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole,
  );
}

/**
 * Builds a translate() function against an arbitrary set of catalogs. Exported so tests can
 * exercise the lookup/fallback/interpolation logic against synthetic fixture catalogs instead
 * of needing a test-only key checked into the shipped locale JSON files (see translate.test.ts).
 */
export function createTranslator(catalogs: Record<Locale, Catalog>) {
  return function translate(
    key: string,
    vars: Record<string, string | number> = {},
    locale: Locale = DEFAULT_LOCALE,
  ): string {
    const template = catalogs[locale]?.[key] ?? catalogs[FALLBACK_LOCALE]?.[key];
    if (template === undefined) {
      console.warn(`[i18n] thiếu khoá dịch: ${key}`);
      return key;
    }
    return interpolate(template, vars);
  };
}

export const t = createTranslator(CATALOGS);
