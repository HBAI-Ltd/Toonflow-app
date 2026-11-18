import { AsyncLocalStorage } from "node:async_hooks";
import { detectLocale, msg, normalizeLocale, translate } from "@toonflow/i18n";
import type { Locale, MessageDescriptor } from "@toonflow/i18n";
import type { RequestHandler } from "express";
import { ar, bn, en, fa, hi, id, ja, ko, ms, pt, ru, ta, th, tr, ur, vi, zhCN, zhTW } from "zod/locales";
import { z } from "zod";

const requestLocale = new AsyncLocalStorage<Locale>();
// ACT: 已安装的 Zod 没有 fil/te/mr/pa，参数校验提示回退英文；应用消息仍使用所选语言。
const validationLocales = {
  "zh-CN": zhCN(), "zh-TW": zhTW(), en: en(), ja: ja(), ru: ru(), vi: vi(), th: th(), ko: ko(), hi: hi(),
  id: id(), ms: ms(), fil: en(), bn: bn(), ur: ur(), ta: ta(), te: en(), mr: en(), pa: en(), ar: ar(), fa: fa(), tr: tr(), pt: pt(),
};
let localeFallback = () => detectLocale([Intl.DateTimeFormat().resolvedOptions().locale]);
// ACT: 仅注册一次分派器；每次校验读取当前异步上下文，绝不按请求改写全局语言。
z.config({ localeError: issue => validationLocales[getLocale()].localeError(issue) });

export function setLocaleFallback(resolve: () => Locale) { localeFallback = resolve; }
export function getLocale(): Locale { return requestLocale.getStore() ?? localeFallback(); }
export function runWithLocale<T>(locale: Locale, operation: () => T): T { return requestLocale.run(locale, operation); }

export function resolveRequestLocale(header?: string): Locale {
  const languages = (header ?? "").split(",").map((part, index) => {
    const match = /^([a-z]{1,8}(?:-[a-z\d]{1,8})*)(?:\s*;\s*q=(0(?:\.\d{0,3})?|1(?:\.0{0,3})?))?$/i.exec(part.trim());
    return { locale: match ? normalizeLocale(match[1]) : undefined, weight: Number(match?.[2] ?? 1), index };
  }).filter(item => item.locale && item.weight > 0)
    .sort((left, right) => right.weight - left.weight || left.index - right.index);
  return languages[0]?.locale ?? localeFallback();
}

export const languageRequest: RequestHandler = (request, response, next) => {
  const locale = resolveRequestLocale(request.get("accept-language"));
  response.setHeader("Content-Language", locale);
  response.vary("Accept-Language");
  runWithLocale(locale, next);
};

export function translateMessage(message: string | MessageDescriptor, values?: Record<string, unknown>): string {
  return translate(message, values, getLocale());
}

export function translateError(error: unknown): string {
  const descriptor = error && typeof error === "object" && "i18nMessage" in error ? error.i18nMessage : undefined;
  if (descriptor && typeof descriptor === "object" && !Array.isArray(descriptor) && "id" in descriptor && typeof descriptor.id === "string") {
    const values = "values" in descriptor ? descriptor.values : undefined;
    if (values === undefined || (values && typeof values === "object" && !Array.isArray(values)
      && [Object.prototype, null].includes(Object.getPrototypeOf(values)))) return translateMessage(descriptor as MessageDescriptor);
  }
  return translateMessage(error && typeof error === "object" && "message" in error && typeof error.message === "string" ? error.message : String(error));
}

export function t(strings: TemplateStringsArray, ...values: unknown[]): string {
  return translateMessage(msg(strings, ...values));
}

export function validationOptions() { return { error: validationLocales[getLocale()].localeError }; }

export { msg };
