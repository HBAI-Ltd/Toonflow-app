import express from "express";
import type { Request, Response, NextFunction } from "express";
import { lstatSync } from "node:fs";
import { join, resolve } from "node:path";
import { error } from "@/lib/responseFormat";

export function createApp(publicDirectory: string) {
  const app = express();
  const publicDir = resolve(publicDirectory);
  app.set("case sensitive routing", true);
  app.disable("x-powered-by");
  app.disable("etag");

  app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });

  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.set("Allow", "GET, HEAD").status(405).end();
      return;
    }
    const name = req.path.slice(1);
    const filePath = join(publicDir, name);
    // ACT: 只服务发布器生成的平铺 ASCII 文件名，不解码 URL，也不跟随符号链接。
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name) || !lstatSync(filePath, { throwIfNoEntry: false })?.isFile()) {
      res.status(404).end();
      return;
    }
    res.sendFile(filePath, { cacheControl: false, lastModified: false, etag: false }, err => {
      if (err) next(err);
    });
  });

  app.use((err: Error & { status?: number; code?: string }, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    const status = err.status ?? (err.code === "ENOENT" ? 404 : 500);
    const message = status >= 500 ? "服务器内部错误" : err.message;
    res.status(status).json(error(message, null, status));
  });
  return app;
}
