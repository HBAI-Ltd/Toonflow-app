import { IntlMessageFormat } from "intl-messageformat";
import { escapeMessageText } from "./messageText.ts";
export { escapeMessageText } from "./messageText.ts";
import zhTw from "./locales/zhTw.json" with { type: "json" };
import en from "./locales/en.json" with { type: "json" };
import ja from "./locales/ja.json" with { type: "json" };
import ru from "./locales/ru.json" with { type: "json" };
import vi from "./locales/vi.json" with { type: "json" };
import th from "./locales/th.json" with { type: "json" };
import ko from "./locales/ko.json" with { type: "json" };
import hi from "./locales/hi.json" with { type: "json" };
import id from "./locales/id.json" with { type: "json" };
import ms from "./locales/ms.json" with { type: "json" };
import fil from "./locales/fil.json" with { type: "json" };
import bn from "./locales/bn.json" with { type: "json" };
import ur from "./locales/ur.json" with { type: "json" };
import ta from "./locales/ta.json" with { type: "json" };
import te from "./locales/te.json" with { type: "json" };
import mr from "./locales/mr.json" with { type: "json" };
import pa from "./locales/pa.json" with { type: "json" };
import ar from "./locales/ar.json" with { type: "json" };
import fa from "./locales/fa.json" with { type: "json" };
import tr from "./locales/tr.json" with { type: "json" };
import pt from "./locales/pt.json" with { type: "json" };

export type Locale = "zh-CN" | "zh-TW" | "en" | "ja" | "ru" | "vi" | "th" | "ko" | "hi"
  | "id" | "ms" | "fil" | "bn" | "ur" | "ta" | "te" | "mr" | "pa" | "ar" | "fa" | "tr" | "pt";
export interface MessageDescriptor { id: string; values?: Record<string, unknown> }
export type Catalogs = Partial<Record<Locale, Record<string, string>>>;
export const supportedLocales: { code: Locale; name: string }[] = [
  { code: "zh-CN", name: "简体中文" }, { code: "zh-TW", name: "繁體中文" },
  { code: "en", name: "English" }, { code: "ja", name: "日本語" },
  { code: "ru", name: "Русский" }, { code: "vi", name: "Tiếng Việt" },
  { code: "th", name: "ไทย" }, { code: "ko", name: "한국어" }, { code: "hi", name: "हिन्दी" },
  { code: "id", name: "Bahasa Indonesia" }, { code: "ms", name: "Bahasa Melayu" }, { code: "fil", name: "Filipino" },
  { code: "bn", name: "বাংলা" }, { code: "ur", name: "اردو" }, { code: "ta", name: "தமிழ்" },
  { code: "te", name: "తెలుగు" }, { code: "mr", name: "मराठी" }, { code: "pa", name: "ਪੰਜਾਬੀ" },
  { code: "ar", name: "العربية" }, { code: "fa", name: "فارسی" }, { code: "tr", name: "Türkçe" },
  { code: "pt", name: "Português (Brasil)" },
];
const catalogs: Catalogs = { "zh-TW": zhTw, en, ja, ru, vi, th, ko, hi, id, ms, fil, bn, ur, ta, te, mr, pa, ar, fa, tr, pt };
let activeLocale: Locale = "zh-CN";
const listeners = new Set<(locale: Locale) => void>();
const formatters = new Map<string, IntlMessageFormat>();

export function normalizeLocale(value: unknown): Locale | undefined {
  if (typeof value !== "string") return;
  let language: Intl.Locale;
  try { language = new Intl.Locale(value.trim().replaceAll("_", "-")); }
  catch { return; }
  const script = language.maximize().script;
  if (language.language === "zh") {
    if (script === "Hans") return "zh-CN";
    if (script === "Hant") return "zh-TW";
    return;
  }
  const base = language.language === "tl" ? "fil" : language.language === "in" ? "id" : language.language;
  const locale = supportedLocales.find(item => item.code === base)?.code;
  // ACT: 每种新增语言只提供一种文字体系；pa-Arab/pa-PK 等不能误用 Gurmukhi 译文。
  return locale && script === new Intl.Locale(locale).maximize().script ? locale : undefined;
}

export function detectLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const locale = normalizeLocale(language);
    if (locale) return locale;
  }
  return "en";
}

export function isRtlLocale(locale: Locale): boolean { return ["ar", "fa", "ur"].includes(locale); }

export function getLocale(): Locale { return activeLocale; }
export function setLocale(locale: Locale) {
  if (locale === activeLocale) return;
  activeLocale = locale;
  for (const listener of listeners) listener(locale);
}
export function subscribeLocale(listener: (locale: Locale) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function msg(strings: TemplateStringsArray, ...values: unknown[]): MessageDescriptor {
  if (!values.length) return { id: strings[0] };
  return {
    id: strings.map((part, index) => escapeMessageText(part) + (index < values.length ? `{${index}}` : "")).join(""),
    values: Object.fromEntries(values.map((value, index) => [index, value])),
  };
}

export function translate(message: string | MessageDescriptor, values?: Record<string, unknown>, language: Locale = activeLocale, dictionaries: Catalogs = catalogs): string {
  const id = typeof message === "string" ? message : message.id;
  const parameters = values ?? (typeof message === "string" ? undefined : message.values);
  const catalog = Object.hasOwn(dictionaries, language) ? dictionaries[language] : undefined;
  const translated = catalog && Object.hasOwn(catalog, id) && typeof catalog[id] === "string" ? catalog[id] : id;
  if (!parameters || !Object.keys(parameters).length) return translated;
  const format = (text: string) => {
    const cacheKey = `${language}\0${text}`;
    let formatter = formatters.get(cacheKey);
    if (!formatter) {
      formatter = new IntlMessageFormat(text, language, undefined, { ignoreTag: true });
      // ACT: 字典与语言切换共享缓存，限制 2000 项；无需随用户输入增长。
      if (formatters.size >= 2000) formatters.delete(formatters.keys().next().value!);
      formatters.set(cacheKey, formatter);
    }
    const result = formatter.format(Object.fromEntries(Object.entries(parameters).map(([key, value]) => [key,
      typeof value === "number" || value instanceof Date ? value : String(value),
    ])));
    return Array.isArray(result) ? result.join("") : String(result);
  };
  try { return format(translated); }
  catch {
    // ACT: 损坏或缺参数的外部语言包回退原文；参数只替换一次，不再解析用户输入。
    try { return format(id); }
    catch { return id.replace(/\{(\d+)\}/g, (token, key) => Object.hasOwn(parameters, key) ? String(parameters[key]) : token); }
  }
}

export function t(strings: TemplateStringsArray, ...values: unknown[]): string {
  return translate(msg(strings, ...values));
}

/**
 * 原样返回参数，只供文案抽取识别：其中的中文字面量会收进字典，数据本身保持原文。
 * 用于业务比较或交给 Agent 的数据数组，显示时再在显示边界调用 translate。
 */
export function markMessages<T>(value: T): T { return value; }

// 插件使用自带字典翻译，语言由宿主提供：Web 读取响应式语言，Server 读取请求语言。
export function createTranslator(dictionaries: Catalogs, getLanguage: () => Locale = getLocale) {
  const translateText = (message: string | MessageDescriptor, values?: Record<string, unknown>) =>
    translate(message, values, getLanguage(), dictionaries);
  return { msg, translate: translateText, t: (strings: TemplateStringsArray, ...values: unknown[]) => translateText(msg(strings, ...values)) };
}
