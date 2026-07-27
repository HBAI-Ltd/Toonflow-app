// import "./logger";
import "./err";
import "./env";
import express, { Request, Response, NextFunction } from "express";
import { Server } from "socket.io";
import http from "node:http";
import expressWs from "express-ws";
import logger from "morgan";
import cors from "cors";
import buildRoute from "@/core";
import path from "path";
import fs from "fs";
import u from "@/utils";
import jwt from "jsonwebtoken";
import socketInit from "@/socket/index";
import { isEletron } from "@/utils/getPath";
import { ensureThumbnail, ThumbnailSize } from "@/utils/image";
import {
  CompanionApiManager,
  type CompanionApiDefinition,
} from "@/lib/companionApis";

const app = express();
const server = http.createServer(app);
let companionApiManager: CompanionApiManager | undefined;
let shutdownHooksRegistered = false;

interface VendorConnection {
  baseUrl: string;
  apiKey: string;
}

function cleanCompanionApiKey(value: string): string {
  return value.trim().replace(/^Bearer\s+/i, "");
}

function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getCompanionProjectDir(
  serviceName: "chatgpt2api" | "doubao2api",
): string {
  const explicit =
    serviceName === "chatgpt2api"
      ? process.env.TOONFLOW_CHATGPT2API_DIR
      : process.env.TOONFLOW_DOUBAO2API_DIR;
  if (explicit?.trim()) return path.resolve(explicit.trim());

  const servicesRoot = process.env.TOONFLOW_SERVICES_ROOT?.trim();
  return servicesRoot
    ? path.resolve(servicesRoot, serviceName)
    : path.resolve(process.cwd(), "..", serviceName);
}

async function getVendorConnection(
  vendorId: "chatgptWebSol" | "doubaoWeb",
  fallbackBaseUrl: string,
): Promise<VendorConnection> {
  const timeoutMs = positiveNumber(
    process.env.TOONFLOW_COMPANION_CONFIG_TIMEOUT_MS,
    10_000,
  );
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() <= deadline) {
    try {
      const row = await u
        .db("o_vendorConfig")
        .where("id", vendorId)
        .select("inputValues")
        .first();
      if (row) {
        const inputValues =
          typeof row.inputValues === "string"
            ? JSON.parse(row.inputValues)
            : row.inputValues;
        return {
          baseUrl:
            typeof inputValues?.baseUrl === "string" &&
            inputValues.baseUrl.trim()
              ? inputValues.baseUrl.trim()
              : fallbackBaseUrl,
          apiKey:
            typeof inputValues?.apiKey === "string"
              ? inputValues.apiKey
              : "",
        };
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const detail =
    lastError instanceof Error ? `：${lastError.message}` : "";
  throw new Error(`无法读取供应商 ${vendorId} 的连接配置${detail}`);
}

async function ensureCompanionApis(): Promise<void> {
  if (companionApiManager) return;

  const [chatgpt, doubao] = await Promise.all([
    getVendorConnection(
      "chatgptWebSol",
      "http://127.0.0.1:8000/v1",
    ),
    getVendorConnection("doubaoWeb", "http://127.0.0.1:9090"),
  ]);
  const definitions: CompanionApiDefinition[] = [
    {
      id: "chatgpt2api",
      displayName: "chatgpt2api",
      baseUrl: chatgpt.baseUrl,
      apiKey: chatgpt.apiKey,
      expectedModelIds: ["gpt-5.6-sol-wm"],
      projectDir: getCompanionProjectDir("chatgpt2api"),
      condaEnv:
        process.env.TOONFLOW_CHATGPT2API_CONDA_ENV?.trim() ||
        "chatgpt2api-py313",
      pythonArgs: ["main.py"],
      processEnv: cleanCompanionApiKey(chatgpt.apiKey)
        ? {
            CHATGPT2API_AUTH_KEY: cleanCompanionApiKey(
              chatgpt.apiKey,
            ),
          }
        : undefined,
    },
    {
      id: "doubao2api",
      displayName: "doubao2api",
      baseUrl: doubao.baseUrl,
      apiKey: doubao.apiKey,
      expectedModelIds: ["doubao-video"],
      projectDir: getCompanionProjectDir("doubao2api"),
      condaEnv:
        process.env.TOONFLOW_DOUBAO2API_CONDA_ENV?.trim() || "base",
      pythonArgs: ["-m", "doubao2api"],
      processEnv: cleanCompanionApiKey(doubao.apiKey)
        ? {
            DOUBAO_API_KEY: cleanCompanionApiKey(doubao.apiKey),
          }
        : undefined,
    },
  ];

  const manager = new CompanionApiManager(definitions, {
    startupTimeoutMs: positiveNumber(
      process.env.TOONFLOW_COMPANION_STARTUP_TIMEOUT_MS,
      60_000,
    ),
  });
  companionApiManager = manager;
  try {
    await manager.ensureAll();
  } catch (error) {
    companionApiManager = undefined;
    throw error;
  }

  if (!shutdownHooksRegistered) {
    shutdownHooksRegistered = true;
    process.once("exit", () => companionApiManager?.stopOwnedSync());
    if (!isElectron) {
      for (const signal of ["SIGINT", "SIGTERM", "SIGUSR2"] as const) {
        process.once(signal, () => {
          void closeServe().finally(() => {
            if (signal === "SIGUSR2") {
              process.kill(process.pid, signal);
            } else {
              process.exit(signal === "SIGINT" ? 130 : 143);
            }
          });
        });
      }
    }
  }
}

async function checkPermissions() {
  if (!isEletron()) return true;
  const userDataPath = u.getPath();
  try {
    fs.mkdirSync(userDataPath, { recursive: true });
    const testFile = path.join(userDataPath, ".access_test");
    fs.writeFileSync(testFile, "test");
    fs.unlinkSync(testFile);
  } catch (e) {
    const { dialog, app } = require("electron");
    const { response } = await dialog.showMessageBox({
      type: "warning",
      title: "权限不足",
      message: "应用无法访问数据目录",
      detail: `无法读写以下目录：\n${userDataPath}\n\n请联系管理员授予权限，或以管理员身份运行本程序。`,
      buttons: ["确认退出"],
      defaultId: 0,
    });
    if (response === 0) {
      app.quit();
    }
  }
}

export default async function startServe(randomPort: Boolean = false) {
  await checkPermissions();

  await u.writeVersion();
  await ensureCompanionApis();
  const io = new Server(server, { cors: { origin: "*" } });
  socketInit(io);

  if (process.env.NODE_ENV == "dev") await buildRoute();

  expressWs(app);

  app.use(logger("dev"));
  app.use(cors({ origin: "*" }));
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ extended: true, limit: "100mb" }));

  // oss 静态资源
  const ossDir = u.getPath("oss");
  if (!fs.existsSync(ossDir)) {
    fs.mkdirSync(ossDir, { recursive: true });
  }
  console.log("文件目录:", ossDir);
  app.use(
    "/oss",
    (req, res, next) => {
      // 如果传参 type=small，则返回小图
      if (req.query.size) {
        const size = req.query.size as string;
        const smallImageBaseDir = path.join(ossDir, "smallImage");
        const originalPath = path.join(ossDir, req.path);

        // 解析 size 参数
        let sizeSubDir: string;
        let sizeOpts: ThumbnailSize | undefined;

        // 判断是否为 WIDTHxHEIGHT 格式，如 "200x300"：等比压缩到指定宽高边界
        const dimensMatch = size.match(/^(\d+)x(\d+)$/i);
        // 判断是否为百分比格式，如 "30"、"30%"：等比压缩到原图的指定百分比
        const percentMatch = size.match(/^(\d+(?:\.\d+)?)\s*%?$/);

        if (dimensMatch) {
          const w = parseInt(dimensMatch[1], 10);
          const h = parseInt(dimensMatch[2], 10);
          sizeSubDir = `${w}x${h}`;
          sizeOpts = { type: "dimensions", width: w, height: h };
        } else if (percentMatch) {
          const pct = parseFloat(percentMatch[1]);
          sizeSubDir = `${percentMatch[1]}p`;
          sizeOpts = { type: "percentage", value: pct };
        } else {
          // 无效的 size 参数，降级返回原图
          express.static(ossDir, { acceptRanges: false })(req, res, next);
          return;
        }

        const ext = path.extname(req.path);
        const base = path.basename(req.path, ext);
        const dir = path.dirname(req.path);
        const smallImagePath = path.join(smallImageBaseDir, dir, `${base}_${sizeSubDir}${ext}`);

        ensureThumbnail(originalPath, smallImagePath, sizeOpts).then((thumbnailPath) => {
          if (thumbnailPath) {
            res.sendFile(thumbnailPath);
          } else {
            // 缩略图生成失败，降级返回原图
            express.static(ossDir, { acceptRanges: false })(req, res, next);
          }
        });
        return;
      }
      next();
    },
    express.static(ossDir, { acceptRanges: false }),
  );
  // skills 静态资源
  const skillsDir = u.getPath("skills");
  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }
  console.log("文件目录:", skillsDir);
  // 只允许图片文件访问
  app.use(
    "/skills",
    (req, res, next) => {
      /\.(jpe?g|png|gif|webp|svg|ico|bmp)$/i.test(req.path) ? next() : res.status(403).end();
    },
    express.static(skillsDir, { acceptRanges: false }),
  );

  // assets 静态资源
  const assetsDir = u.getPath("assets");
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  console.log("文件目录:", assetsDir);
  app.use("/assets", express.static(assetsDir, { acceptRanges: false }));

  // data/web 静态网站
  const webDir = u.getPath("web");
  if (fs.existsSync(webDir)) {
    console.log("静态网站目录:", webDir);
    app.use(express.static(webDir, { acceptRanges: false }));
  } else {
    console.warn("静态网站目录不存在:", webDir);
  }

  app.use(async (req, res, next) => {
    const setting = await u.db("o_setting").where("key", "tokenKey").select("value").first();
    if (!setting) return res.status(444).send({ message: "服务器秘钥未配置，请联系管理员" });
    const { value: tokenKey } = setting;
    // 从 header 或 query 参数获取 token
    const rawToken = req.headers.authorization || (req.query.token as string) || "";
    const token = rawToken.replace("Bearer ", "");
    // 白名单路径
    if (req.path === "/api/login/login") return next();

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

  // 404 处理
  app.use((_, res, next: NextFunction) => {
    return res.status(404).send({ message: "API 404 Not Found" });
  });

  // 错误处理
  app.use((err: any, _: Request, res: Response, __: NextFunction) => {
    res.locals.message = err.message;
    res.locals.error = err;
    console.error(err);
    res.status(err.status || 500).send(err);
  });

  const port = randomPort ? 0 : 10588;
  return await new Promise((resolve) => {
    server.listen(port, async () => {
      const address = server.address();
      const realPort = typeof address === "string" ? address : address?.port;
      console.log(`[服务启动成功]: http://localhost:${realPort}`);
      resolve(realPort);
    });
  });
}

// 支持await关闭
export function closeServe(): Promise<void> {
  return new Promise((resolve, reject) => {
    const closeCompanions = async (serverError?: Error) => {
      try {
        await companionApiManager?.stopOwned();
        companionApiManager = undefined;
      } catch (error) {
        if (!serverError) {
          reject(error);
          return;
        }
      }
      if (serverError) {
        reject(serverError);
        return;
      }
      resolve();
    };

    if (!server.listening) {
      void closeCompanions();
      return;
    }
    server.close((err?: Error) => {
      if (!err) console.log("[服务已关闭]");
      void closeCompanions(err);
    });
  });
}

const isElectron = typeof process.versions?.electron !== "undefined";
if (!isElectron) {
  void startServe().catch(async (error) => {
    console.error("[服务启动失败]:", error);
    try {
      await closeServe();
    } finally {
      process.exit(1);
    }
  });
}
