import en from "./locales/en.json";
import vi from "./locales/vi.json";
import zh from "./locales/zh.json";
import { DEFAULT_LOCALE, FALLBACK_LOCALE, LOCALES, type Locale } from "./types";

type Catalog = Record<string, string>;

const CATALOGS: Record<Locale, Catalog> = { en, vi, zh };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole,
  );
}

export function t(
  key: string,
  vars: Record<string, string | number> = {},
  locale: Locale = DEFAULT_LOCALE,
): string {
  const template = CATALOGS[locale]?.[key] ?? CATALOGS[FALLBACK_LOCALE]?.[key];
  if (template === undefined) {
    console.warn(`[i18n] thiếu khoá dịch: ${key}`);
    return key;
  }
  return interpolate(template, vars);
}
