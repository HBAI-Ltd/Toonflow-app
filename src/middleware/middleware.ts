import { Request, Response, NextFunction } from "express";
import { z, ZodTypeAny } from "zod";

import { en, vi, zhCN } from "zod/locales";
import { t, getLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";

const ZOD_LOCALES: Record<Locale, () => ReturnType<typeof en>> = {
  en,
  vi,
  zh: zhCN,
};

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
    // z.config() is global, mutable state. There must be NO `await` between this
    // call and schema.safeParse(data) below: Node processes one synchronous block
    // at a time, so keeping them adjacent guarantees no other request's handler
    // can interleave and observe (or overwrite) the wrong locale.
    z.config(ZOD_LOCALES[locale]());
    const parseResult = schema.safeParse(data);
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
