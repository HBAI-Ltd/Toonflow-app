import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { error } from "./responseFormat";
import { t, translateMessage, validationOptions } from "./i18n";

// ACT: 浏览器请求必须与当前服务同源；不带来源头的本机脚本、原生客户端和桌面/移动网关转发的远程请求继续放行。
export function sameOriginRequest(req: Request, res: Response, next: NextFunction) {
  const source = req.get("origin") ?? req.get("referer");
  if (source === undefined) return next();
  let host: string | undefined;
  try { host = new URL(source).host; } catch { /* 无效来源与跨站来源统一拒绝。 */ }
  if (!host || host.toLowerCase() !== (req.get("host") ?? "").toLowerCase()) {
    return res.status(403).json(error("跨站请求已被拒绝，请通过 Toonflow 页面访问", null, 403));
  }
  next();
}

export function validateFields(
  shape: Record<string, z.ZodType>,
  source: "body" | "query" | "params" = "body", // 默认校验 body
) {
  const schema = z.object(shape);

  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[source];
    const parseResult = schema.safeParse(data, validationOptions());
    if (!parseResult.success) {
      const errors = parseResult.error.issues.map((issue) => t`字段 ${issue.path.join(".")} ${translateMessage(issue.message)}`);
      console.error(errors);
      return res.status(400).json(error("参数错误", errors));
    }
    next();
  };
}
