import "./logger";
import "./err";
import "./env";
import express, { Request, Response, NextFunction } from "express";
import expressWs from "express-ws";
import logger from "morgan";
import cors from "cors";
import buildRoute from "@/core";
import fs from "fs";
import path from "path";
import u from "@/utils";
import jwt from "jsonwebtoken";

const app = express();
let server: ReturnType<typeof app.listen> | null = null;
const isElectron = typeof process.versions?.electron !== "undefined";
const apiPrefixes = [
  "/assets/",
  "/index",
  "/novel/",
  "/other/",
  "/outline/",
  "/project/",
  "/prompt/",
  "/script/",
  "/setting/",
  "/storyboard/",
  "/task/",
  "/user/",
  "/video/",
];

export default async function startServe() {
  if (process.env.NODE_ENV == "dev") await buildRoute();

  expressWs(app);

  app.use(logger("dev"));
  app.use(cors({ origin: "*" }));
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ extended: true, limit: "100mb" }));

  let rootDir: string;
  if (isElectron) {
    const { app } = require("electron");
    const userDataDir: string = app.getPath("userData");
    rootDir = path.join(userDataDir, "uploads");
  } else {
    rootDir = path.join(process.cwd(), "uploads");
  }

  // 确保 uploads 目录存在
  if (!fs.existsSync(rootDir)) {
    fs.mkdirSync(rootDir, { recursive: true });
  }
  console.log("文件目录:", rootDir);

  app.use(express.static(rootDir));

  let webDir: string | null = null;
  if (!isElectron) {
    webDir = path.join(process.cwd(), "scripts", "web");
    if (fs.existsSync(webDir)) {
      app.use(express.static(webDir));
      console.log("前端目录:", webDir);
    }
  }

  app.use(async (req, res, next) => {
    if (req.path === "/other/login") return next();

    if (!isElectron) {
      const isApiPath = apiPrefixes.some((prefix) => req.path.startsWith(prefix));
      if (!isApiPath) return next();
    }

    const setting = await u.db("t_setting").where("id", 1).select("tokenKey").first();
    if (!setting) return res.status(500).send({ message: "服务器未配置，请联系管理员" });
    const { tokenKey } = setting;
    // 从 header 或 query 参数获取 token
    const rawToken = req.headers.authorization || (req.query.token as string) || "";
    const token = rawToken.replace("Bearer ", "");

    if (!token) return res.status(401).send({ message: "未提供token" });
    try {
      const decoded = jwt.verify(token, tokenKey as string);
      (req as any).user = decoded;
      next();
    } catch (err) {
      return res.status(401).send({ message: "无效的token" });
    }
  });

  const router = await import("@/router");
  await router.default(app);

  if (!isElectron && webDir) {
    const indexPath = path.join(webDir, "index.html");
    if (fs.existsSync(indexPath)) {
      app.use((req, res, next) => {
        if (req.method === "GET") {
          const isApiPath = apiPrefixes.some((prefix) => req.path.startsWith(prefix));
          if (!isApiPath) return res.sendFile(indexPath);
        }
        next();
      });
    }
  }

  // 404 处理
  app.use((_, res, next: NextFunction) => {
    return res.status(404).send({ message: "Not Found" });
  });

  // 错误处理
  app.use((err: any, _: Request, res: Response, __: NextFunction) => {
    res.locals.message = err.message;
    res.locals.error = err;
    console.error(err);
    res.status(err.status || 500).send(err);
  });

  const port = parseInt(process.env.PORT || "60000");
  server = app.listen(port, async () => {
    const address = server?.address();
    const realPort = typeof address === "string" ? address : address?.port;
    console.log(`[服务启动成功]: http://localhost:${realPort}`);
  });
}

// 支持await关闭
export function closeServe(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (server) {
      server.close((err?: Error) => {
        if (err) return reject(err);
        console.log("[服务已关闭]");
        resolve();
      });
    } else {
      resolve();
    }
  });
}

if (!isElectron) startServe();
