import type { Request, Response, NextFunction } from "express";
import { error } from "@/lib/responseFormat";
import { isMultiUser, requireUser } from "@/utils/accounts/context";
import { systemConfig } from "@/utils/conf";
import { getDatabase } from "@/utils/accounts/database";

const memberRoutes = new Set([
  "GET /api/settings/get", "PUT /api/settings/save", "GET /api/settings/systemPrompt",
  "GET /api/settings/personalization/get", "PUT /api/settings/personalization/save",
  "GET /api/workspaces/list", "GET /api/workspaces/check", "POST /api/workspaces/selectDirectory", "POST /api/workspaces/clone",
  "GET /api/workspaces/files/list", "GET /api/workspaces/files/read", "PUT /api/workspaces/files/write",
  "POST /api/workspaces/files/write", "POST /api/workspaces/files/mkdir", "POST /api/workspaces/files/copy",
  "POST /api/workspaces/files/rename", "POST /api/workspaces/files/remove", "DELETE /api/workspaces/files/remove", "POST /api/workspaces/files/importImage",
  "GET /api/assets/list", "GET /api/assets/read", "PUT /api/assets/save", "POST /api/assets/save",
  "POST /api/assets/mkdir", "POST /api/assets/rename", "POST /api/assets/remove", "DELETE /api/assets/remove",
  "GET /api/ai/models", "POST /api/ai/generate", "GET /api/ai/media/models", "POST /api/ai/media/price",
  "POST /api/ai/media/generate", "POST /api/ai/media/tasks/status", "POST /api/ai/media/tasks/cancel",
  "GET /api/nodes/get", "GET /api/nodes/files", "GET /api/tools/get", "GET /api/tools/client", "GET /api/tools/renderers",
  "GET /api/ext/list", "GET /api/ext/read", "GET /api/skills/list", "GET /api/skills/get", "GET /api/skills/read",
  "GET /api/ffmpeg/status", "GET /api/ffmpeg/events", "GET /api/ffmpeg/progress",
  "POST /api/agent", "POST /api/agent/create", "POST /api/agent/answer", "POST /api/agent/canvasResult",
  "GET /api/agent/list", "GET /api/agent/get", "POST /api/agent/rename", "PUT /api/agent/rename", "DELETE /api/agent/message",
  "GET /api/agent/skills", "GET /api/agent/mentionSource",
  "POST /api/singleAgent/create", "POST /api/singleAgent/run", "POST /api/singleAgent/control",
  "POST /api/singleAgent/answer", "POST /api/singleAgent/toolResult",
  "GET /api/projects/list", "POST /api/projects/create", "PATCH /api/projects/update", "DELETE /api/projects/remove",
  "GET /api/account/usage", "POST /api/account/tasks/cancel", "GET /api/account/media/list", "POST /api/account/media/save",
]);

export function hostingPolicy(req: Request, res: Response, next: NextFunction) {
  if (!isMultiUser()) return next();
  // ACT: 旧 MCP/A2A 使用全局服务身份，没有租户协议；在托管模式关闭此旁路，网页 Agent 仍使用用户身份。
  if (/^\/(?:mcp|a2a)(?:\/|$)/i.test(req.path)) return res.status(403).json(error("托管模式不开放全局 MCP 和 A2A 入口", null, 403));
  if (!/^\/api(?:\/|$)/i.test(req.path)) return next();
  const path = req.path.replace(/\/+$/, "");
  if (path !== "/api/auth/status" && !getDatabase().query("SELECT value FROM accountMetadata WHERE key='tenantMigrationComplete' AND value='1'").get()) {
    return res.status(503).json(error("用户数据尚未完成初始化，请重启服务完成迁移", null, 503));
  }
  if (path.startsWith("/api/auth/")) return next();
  const user = requireUser();
  if (user.role === "admin" || memberRoutes.has(`${req.method} ${path}`)) return next();
  return res.status(403).json(error("此功能仅限管理员使用", null, 403));
}

export function sanitizeHostingError(value: unknown) {
  let message = value instanceof Error ? value.message : String(value ?? "请求失败");
  const secrets: string[] = [];
  const collect = (value: unknown, key = "") => {
    if (typeof value === "string" && /api.?key|secret|token|password|authorization|cookie/i.test(key) && value.length >= 4) secrets.push(value);
    else if (Array.isArray(value)) value.forEach(item => collect(item));
    else if (value && typeof value === "object") Object.entries(value).forEach(([key, item]) => collect(item, key));
  };
  collect(systemConfig.get("settings", {}));
  for (const secret of secrets) message = message.split(secret).join("[已隐藏]");
  return message.replace(/((?:api[_-]?key|secret|token|password|authorization|cookie)["']?\s*[:=]\s*["']?)[^\s"',;}&<>]+/gi, "$1[已隐藏]")
    .replace(/Bearer\s+[\w.+/=-]+/gi, "Bearer [已隐藏]").slice(0, 2000);
}
