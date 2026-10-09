import express from "express";
import type { Application, Request, Response, NextFunction } from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";
import type { Socket } from "node:net";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { hostname, networkInterfaces } from "node:os";
import { isAbsolute, posix } from "node:path";
import { realpath, stat } from "@toonflow/file";
import conf from "@/utils/conf";
import { errorFromCause } from "@/lib/responseFormat";

export type MobileLinkConfig = {
  enabled: boolean;
  port: number;
  publicUrl: string;
  directories: string[];
  devices: { id: string; name: string; tokenHash: string }[];
};
type Listener = { server: Server; sockets: Map<Socket, Set<string>> };
type Runtime = {
  supported: boolean; changing: boolean; lastSeen: Map<string, { at: number; appVersion?: string }>; listener?: Listener;
  pairing?: { codeHash: string; manualCodeHash: string; manualAttempts: number; manualWindowStartedAt: number };
};
const runtimes = new WeakMap<Application, Runtime>();
const deviceKey = Symbol("mobileLinkDevice");
const pairingKey = Symbol("mobileLinkPairing");

export function initializeMobileLinkRuntime(app: Application) {
  if (!runtimes.has(app)) runtimes.set(app, { supported: false, changing: false, lastSeen: new Map() });
}

function getRuntime(app: Application) {
  const runtime = runtimes.get(app);
  if (!runtime) throw Object.assign(new Error("设备互联尚未初始化"), { status: 503 });
  return runtime;
}

export function getMobileLinkConfig(): MobileLinkConfig {
  return conf.get("mobileLink", { enabled: false, port: 43123, publicUrl: "", directories: [], devices: [] });
}

export function isMobileLinkRequest(req: Request) {
  return Boolean(req.res && Reflect.get(req.res.locals, deviceKey));
}

export function assertMobileLinkControl(req: Request) {
  const origin = `${req.protocol}://${req.get("host")}`;
  const sameOrigin = req.get("origin") === undefined ? req.get("referer")?.startsWith(`${origin}/`) : req.get("origin") === origin;
  const localSocket = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress ?? "");
  const localHost = ["localhost", "127.0.0.1", "[::1]"].includes(req.hostname);
  if (isMobileLinkRequest(req) || !localSocket || !localHost || !sameOrigin ||
    (req.get("x-toonflow-mobile-link") !== "1" && req.get("x-toonflow-workspace") !== "1")) {
    throw Object.assign(new Error("只允许本机 Toonflow 页面管理设备互联"), { status: 403 });
  }
  if (!getRuntime(req.app).supported) throw Object.assign(new Error("当前运行环境不支持共享后端"), { status: 403 });
}

export function getMobileLinkStatus(app: Application) {
  const runtime = getRuntime(app);
  const config = getMobileLinkConfig();
  const enabled = Boolean(runtime.listener?.server.listening);
  const now = Date.now();
  const addresses = Object.values(networkInterfaces()).flatMap(entries => entries ?? [])
    .filter(entry => entry.family === "IPv4" && !entry.internal && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(entry.address))
    .sort((left, right) => Number(right.address.startsWith("192.168.")) - Number(left.address.startsWith("192.168.")))
    .map(entry => `http://${entry.address}:${config.port}`);
  return { initialized: conf.has("mobileLink"), enabled, hubEnabled: config.enabled || enabled, pairingAvailable: enabled && Boolean(runtime.pairing), port: config.port,
    addresses: [...new Set(addresses)], publicUrl: config.publicUrl, directories: config.directories, appVersion: app.locals.appVersion,
    devices: config.devices.map(({ id, name }) => {
      const seen = runtime.lastSeen.get(id);
      return { id, name, online: enabled && seen !== undefined && now - seen.at < 15000, lastSeen: seen?.at, appVersion: seen?.appVersion };
    }) };
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function matchesHash(value: string, hash: string) {
  const actual = Buffer.from(digest(value), "hex");
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function closeListener(listener?: Listener) {
  if (!listener) return;
  listener.server.close();
  for (const socket of listener.sockets.keys()) socket.destroy();
}

async function listen(app: Application, port: number) {
  const gateway = express();
  const listener: Listener = { server: createServer(gateway), sockets: new Map() };
  listener.server.on("connection", socket => {
    listener.sockets.set(socket, new Set());
    socket.once("close", () => listener.sockets.delete(socket));
  });
  gateway.use("/api/mobileLink/pair", express.json({ limit: "4kb" }));
  gateway.use((req, res, next) => {
    const path = posix.normalize(decodeURIComponent(new URL(req.url, "http://localhost").pathname).replaceAll("\\", "/")).toLowerCase();
    if (req.method === "POST" && path.replace(/\/$/, "") === "/api/mobilelink/pair") {
      Object.defineProperty(res.locals, pairingKey, { value: true });
      return app(req, res, next);
    }
    const heartbeat = req.method === "GET" && path.replace(/\/$/, "") === "/api/mobilelink/heartbeat";
    if (path === "/api/desktop" || path.startsWith("/api/desktop/") || (!heartbeat && (path === "/api/mobilelink" || path.startsWith("/api/mobilelink/")))) {
      throw Object.assign(new Error("共享连接不能访问本机管理接口"), { status: 403 });
    }
    const token = req.get("x-toonflow-device-token") ?? "";
    const device = token.length >= 32 && token.length <= 128 && getMobileLinkConfig().devices.find(item => matchesHash(token, item.tokenHash));
    if (!device) throw Object.assign(new Error("设备未配对或授权已撤销"), { status: 401 });
    Object.defineProperty(res.locals, deviceKey, { value: device.id });
    const lastSeen = getRuntime(app).lastSeen;
    const version = req.get("x-toonflow-app-version");
    const appVersion = version && /^[\w.+-]{1,64}$/.test(version) ? version : undefined;
    lastSeen.set(device.id, { at: Date.now(), appVersion: heartbeat ? appVersion : lastSeen.get(device.id)?.appVersion });
    listener.sockets.get(req.socket)?.add(device.id);
    app(req, res, next);
  });
  gateway.use((cause: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(cause);
    const body = errorFromCause(cause);
    res.status(body.code).set("Cache-Control", "no-store").json(body);
  });
  await new Promise<void>((resolve, reject) => {
    listener.server.once("error", reject);
    listener.server.listen(port, "0.0.0.0", () => {
      listener.server.off("error", reject);
      resolve();
    });
  });
  return listener;
}

export async function startMobileLinkRuntime(app: Application) {
  const runtime = getRuntime(app);
  runtime.supported = true;
  const config = getMobileLinkConfig();
  if (config.enabled && !runtime.listener) {
    const listener = await listen(app, config.port);
    if (runtime.supported) runtime.listener = listener;
    else closeListener(listener);
  }
}

export function stopMobileLinkRuntime(app: Application) {
  const runtime = getRuntime(app);
  runtime.pairing = undefined;
  runtime.lastSeen.clear();
  closeListener(runtime.listener);
  runtime.listener = undefined;
  runtime.supported = false;
}

export function suspendMobileLinkRuntime(app: Application) {
  // 切为客户端后不自动恢复共享；回到独立运行时由用户重新开启。
  if (getMobileLinkConfig().enabled) conf.set("mobileLink", { ...getMobileLinkConfig(), enabled: false });
  stopMobileLinkRuntime(app);
}

export async function configureMobileLink(app: Application, value: Omit<MobileLinkConfig, "devices">) {
  const runtime = getRuntime(app);
  if (!runtime.supported) throw Object.assign(new Error("当前运行环境不支持共享后端"), { status: 403 });
  if (runtime.changing) throw Object.assign(new Error("设备互联配置正在保存，请稍后重试"), { status: 409 });
  runtime.changing = true;
  let listener: Listener | undefined;
  try {
    let publicUrl = value.publicUrl.trim();
    if (publicUrl) {
      const url = URL.canParse(publicUrl) ? new URL(publicUrl) : null;
      if (!url || url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
        throw Object.assign(new Error("公网地址必须是 HTTPS 根地址，不能包含路径、账号或参数"), { status: 400 });
      }
      publicUrl = url.origin;
    }
    const directories: string[] = [];
    for (const path of value.directories) {
      if (!isAbsolute(path)) throw Object.assign(new Error("共享目录必须是绝对路径"), { status: 400 });
      const directory = await realpath(path);
      if (!(await stat(directory)).isDirectory()) throw Object.assign(new Error("共享路径必须是文件夹"), { status: 400 });
      directories.push(directory);
    }
    const config = getMobileLinkConfig();
    const replaceListener = value.enabled && (!runtime.listener || config.port !== value.port);
    if (replaceListener) listener = await listen(app, value.port);
    if (!runtime.supported) throw Object.assign(new Error("设备互联已停止"), { status: 503 });
    conf.set("mobileLink", { ...getMobileLinkConfig(), enabled: value.enabled, port: value.port, publicUrl, directories: [...new Set(directories)] });
    runtime.pairing = undefined;
    runtime.lastSeen.clear();
    if (!value.enabled || replaceListener) {
      closeListener(runtime.listener);
      runtime.listener = listener;
    } else {
      // 共享范围变化时让已有流断开，下一次请求重新检查当前目录权限。
      for (const socket of runtime.listener?.sockets.keys() ?? []) socket.destroy();
    }
    return getMobileLinkStatus(app);
  } catch (error) {
    closeListener(listener);
    throw error;
  } finally {
    runtime.changing = false;
  }
}

export function createMobilePairing(app: Application, source: string) {
  const runtime = getRuntime(app);
  const status = getMobileLinkStatus(app);
  if (!status.enabled) throw Object.assign(new Error("请先开启设备互联"), { status: 409 });
  const url = new URL(source);
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash || ![...status.addresses, status.publicUrl].includes(url.origin)) {
    throw Object.assign(new Error("请选择当前共享地址生成配对码"), { status: 400 });
  }
  const code = randomBytes(32).toString("base64url");
  const manualCode = randomInt(1_000_000_000_000).toString().padStart(12, "0");
  runtime.pairing = { codeHash: digest(code), manualCodeHash: digest(manualCode), manualAttempts: 0, manualWindowStartedAt: Date.now() };
  return { qrCode: JSON.stringify({ type: "toonflowMobile", version: 1, appVersion: app.locals.appVersion, url: url.origin, name: hostname(), code }), manualCode, url: url.origin };
}

export function pairMobileDevice(req: Request, code: string, name: string) {
  if (!req.res || !Reflect.get(req.res.locals, pairingKey)) {
    throw Object.assign(new Error("请连接设备互联共享端口进行配对"), { status: 403 });
  }
  const runtime = getRuntime(req.app);
  const pairing = runtime.pairing;
  const manual = /^\d{12}$/.test(code);
  if (pairing && manual) {
    const now = Date.now();
    if (now - pairing.manualWindowStartedAt >= 60000) {
      pairing.manualAttempts = 0;
      pairing.manualWindowStartedAt = now;
    }
    if (pairing.manualAttempts >= 10) {
      req.res.set("Retry-After", String(Math.ceil((pairing.manualWindowStartedAt + 60000 - now) / 1000)));
      throw Object.assign(new Error("配对码尝试过于频繁，请稍后重试或扫描二维码"), { status: 429 });
    }
    pairing.manualAttempts++;
  }
  if (!pairing || !matchesHash(code, manual ? pairing.manualCodeHash : pairing.codeHash)) {
    throw Object.assign(new Error("配对码无效或已使用，请重新获取"), { status: 401 });
  }
  // ACT: 配对码仅属于当前进程；同步消费和写入，重复及并发请求只能成功一次。
  runtime.pairing = undefined;
  const deviceToken = randomBytes(32).toString("base64url");
  const config = getMobileLinkConfig();
  config.devices.push({ id: crypto.randomUUID(), name: name.trim(), tokenHash: digest(deviceToken) });
  conf.set("mobileLink", config);
  return { deviceToken, name: hostname(), appVersion: req.app.locals.appVersion };
}

export function revokeMobileDevice(app: Application, id: string) {
  const config = getMobileLinkConfig();
  conf.set("mobileLink", { ...config, devices: config.devices.filter(item => item.id !== id) });
  const runtime = getRuntime(app);
  runtime.lastSeen.delete(id);
  for (const [socket, devices] of runtime.listener?.sockets ?? []) if (devices.has(id)) socket.destroy();
}
