import { Request, Response, NextFunction } from "express";
import { z, ZodTypeAny } from "zod";

import { zhCN } from "zod/locales";
import { t, getLocale } from "@/i18n";

z.config(zhCN());

export function validateFields(
  shape: Record<string, ZodTypeAny>,
  source: "body" | "query" | "params" = "body", // 默认校验 body
) {
  const schema = z.object(shape);

  return async (req: Request, res: Response, next: NextFunction) => {
    const data = req[source];
    const parseResult = schema.safeParse(data);
    if (!parseResult.success) {
      const locale = await getLocale(req as any);
      const errors = parseResult.error.issues.map((issue) =>
        t("middleware.validation.fieldError", { field: issue.path.join("."), message: issue.message }, locale),
      );
      console.error(errors);
      return res.status(400).json({ message: t("middleware.validation.invalidParams", {}, locale), errors });
    }
    next();
  };
}
