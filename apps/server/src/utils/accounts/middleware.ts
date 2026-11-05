import type { Request, Response, NextFunction } from "express";
import { error } from "@/lib/responseFormat";
import { isMultiUser, runWithUser } from "./context";
import { authenticateAccess, consumeAttempt, isInitialized, publicOrigin } from "./service";

export function accountMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!isMultiUser()) return next();
  try {
    const origin = publicOrigin();
    res.setHeader("Cache-Control", "no-store");
    if (req.get("host") !== origin.host || (req.get("origin") && req.get("origin") !== origin.origin)) {
      return res.status(403).json(error("请求来源不允许", null, 403));
    }
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && req.get("origin") !== origin.origin) {
      return res.status(403).json(error("请求来源不允许", null, 403));
    }
    if (!/^\/api(?:\/|$)/i.test(req.path)) return next();
    const path = req.path.replace(/\/+$/, "");
    if (path === "/api/auth/status" && req.method === "GET") return next();
    if (!isInitialized()) return res.status(503).json(error("管理员尚未初始化", null, 503));
    if (["/api/auth/login", "/api/auth/refresh", "/api/auth/logout"].includes(path) && req.method === "POST") {
      consumeAttempt(`ip:${req.ip ?? req.socket.remoteAddress ?? "unknown"}`, 60);
      return next();
    }
    const authorization = req.get("authorization") ?? "";
    const user = authorization.startsWith("Bearer ") ? authenticateAccess(authorization.slice(7)) : undefined;
    if (!user) return res.status(401).json(error("请先登录", null, 401));
    if (user.mustChangePassword && !["/api/auth/me", "/api/auth/password"].includes(path)) {
      return res.status(403).json(error("请先修改临时密码", { mustChangePassword: true }, 403));
    }
    if (path.startsWith("/api/admin/") && user.role !== "admin") return res.status(403).json(error("需要管理员权限", null, 403));
    return runWithUser(user, next);
  } catch (cause) {
    next(cause);
  }
}
