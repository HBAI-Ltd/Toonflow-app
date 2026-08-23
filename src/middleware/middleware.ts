import { Request, Response, NextFunction } from "express";
import { z, ZodTypeAny } from "zod";

import { en, vi, zhCN } from "zod/locales";
import { t, getLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";

const ZOD_LOCALES: Record<Locale, () => ReturnType<typeof en>> = {
  en,
  vi,
  zh: zhCN,
};

/**
 * z.config() is global, mutable state shared by the whole process. There must
 * be NO `await` between setting it and calling schema.safeParse(): Node runs
 * one synchronous block at a time, so keeping the two calls adjacent (this
 * function does both inside a single synchronous call) guarantees no other
 * request's handler can interleave and observe — or overwrite — the wrong
 * locale between them. Callers must resolve `locale` first (that part can
 * safely be async/awaited) and only invoke this helper once they are ready
 * to parse immediately.
 */
export function safeParseWithLocale<T extends ZodTypeAny>(
  schema: T,
  data: unknown,
  locale: Locale,
): ReturnType<T["safeParse"]> {
  z.config(ZOD_LOCALES[locale]());
  return schema.safeParse(data) as ReturnType<T["safeParse"]>;
}

export function validateFields(
  shape: Record<string, ZodTypeAny>,
  source: "body" | "query" | "params" = "body", // 默认校验 body
) {
  const schema = z.object(shape);

  return async (req: Request, res: Response, next: NextFunction) => {
    const data = req[source];
    let locale: Locale;
    try {
      locale = await getLocale(req as any);
    } catch (err) {
      // A locale preference lookup failure must not fail the request closed —
      // fall back to the default locale and keep validating.
      console.error("getLocale failed, falling back to default locale:", err);
      locale = DEFAULT_LOCALE;
    }
    const parseResult = safeParseWithLocale(schema, data, locale);
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((issue) =>
        t("middleware.validation.fieldError", { field: issue.path.join("."), message: issue.message }, locale),
      );
      console.error(errors);
      return res.status(400).json({ message: t("middleware.validation.invalidParams", {}, locale), errors });
    }
    next();
  };
}
