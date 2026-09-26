import type { Ref } from "vue";

export type UiLocale = "zh" | "en";
export type TranslationParams = Record<string, string | number>;
export type TranslationCatalog = Readonly<Record<string, string>>;

type LocaleSource = Readonly<Pick<Ref<UiLocale>, "value">>;
type LocaleHost = { locale: LocaleSource };

const localeHostKey = Symbol.for("toonflow.i18n.host");
const localePattern = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;

type GlobalWithLocale = typeof globalThis & { [localeHostKey]?: LocaleHost };

function localeHost() {
  return globalThis as GlobalWithLocale;
}

export function bindLocale(locale: LocaleSource) {
  const host = localeHost();
  host[localeHostKey] = { locale };
  return () => {
    if (host[localeHostKey]?.locale === locale) delete host[localeHostKey];
  };
}

export function getLocale(): UiLocale {
  return localeHost()[localeHostKey]?.locale.value === "en" ? "en" : "zh";
}

// ACT: 元数据只在同一页面的 UMD 间共享，不进入序列化消息；message 保持协议原文。
const errorDisplayKey = Symbol.for("toonflow.i18n.errorDisplay");
type DisplayError = Error & { [errorDisplayKey]?: () => string };

export function createDisplayError(message: string, display: () => string): Error {
  const error = new Error(message);
  Object.defineProperty(error, errorDisplayKey, { value: display });
  return error;
}

export function getErrorDisplay(error: unknown): string {
  if (error instanceof Error) {
    const display = Object.hasOwn(error, errorDisplayKey) ? (error as DisplayError)[errorDisplayKey] : undefined;
    return typeof display === "function" ? display() : error.message;
  }
  return String(error);
}

export function createTranslator(catalogs: { zh: TranslationCatalog; en?: TranslationCatalog }) {
  return (key: string, params?: TranslationParams) => {
    const source = getLocale() === "en" && Object.hasOwn(catalogs.en ?? {}, key)
      ? catalogs.en![key]
      : Object.hasOwn(catalogs.zh, key) ? catalogs.zh[key] : undefined;
    if (source === undefined) return key;
    return params ? source.replace(localePattern, (token, name: string) => Object.hasOwn(params, name) ? String(params[name]) : token) : source;
  };
}
