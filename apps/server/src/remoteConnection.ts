import express from "express";
import { request as httpRequest } from "node:http";
import type { IncomingMessage } from "node:http";
import { request as httpsRequest } from "node:https";
import { resolve } from "node:path";
import { isIP } from "node:net";
import { readFile, rm, writeAtomic } from "@toonflow/file";
import { getLocale, languageRequest, translateError, translateMessage } from "./lib/i18n";
import { isRtlLocale } from "@toonflow/i18n";

type RemoteConnection = { url: string; name: string; deviceToken: string; appVersion?: string };

function readAppVersion(value: unknown) {
  return typeof value === "string" && /^[\w.+-]{1,64}$/.test(value) ? value : undefined;
}

function serverUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) throw new Error("连接地址无效");
  const source = value.trim();
  const bare = !/^[a-z][\w+.-]*:\/\//i.test(source);
  let url = new URL(bare ? `https://${source}` : source);
  const privateHost = isIP(url.hostname) === 4 && /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname) || url.hostname === "localhost";
  if (bare && privateHost) url = new URL(`http://${source}`);
  if ((url.protocol !== "https:" && !(url.protocol === "http:" && privateHost))
    || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("请使用局域网 HTTP 地址或公网 HTTPS 地址，且不包含路径");
  }
  return url.origin;
}

export async function createRemoteConnection(directory: string, options: {
  deviceName?: string;
  appVersion?: string;
  validateTarget?: (url: string) => void;
  onChange?: (remote: boolean) => Promise<void>;
  restart?: () => void;
} = {}) {
  const path = resolve(directory, "mobileConnection.json");
  let connection: RemoteConnection | undefined;
  let savedText: string | undefined;
  try {
    savedText = await readFile(path, "utf8");
    const saved = JSON.parse(savedText);
    if (typeof saved.deviceToken !== "string" || !/^[\w-]{32,256}$/.test(saved.deviceToken) || typeof saved.name !== "string") {
      throw new Error("设备连接配置无效");
    }
    connection = { url: serverUrl(saved.url), deviceToken: saved.deviceToken, name: saved.name.slice(0, 128), appVersion: readAppVersion(saved.appVersion) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  // ACT: 切换只写下一次启动配置，当前进程继续使用原目标；重启换端口隔离旧页面和未完成请求。
  const active = connection;
  const appVersion = readAppVersion(options.appVersion);
  let remoteAppVersion = active?.appVersion;
  const restart = options.restart ? "host" : "mobile";
  let changing = false;
  let online: boolean | null = null;
  let lastSuccess = 0;
  let heartbeatController: AbortController | undefined;
  async function refreshConnection() {
    if (!active || heartbeatController) return;
    const controller = new AbortController();
    heartbeatController = controller;
    try {
      const result = await fetch(`${active.url}/api/mobileLink/heartbeat`, {
        headers: { "X-Toonflow-Device-Token": active.deviceToken, "X-Toonflow-App-Version": appVersion ?? "" }, redirect: "error",
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(3000)]),
      });
      const body = await result.json() as { code?: number; data?: { appVersion?: unknown } };
      online = result.ok && body.code === 200;
      if (online) {
        lastSuccess = Date.now();
        remoteAppVersion = readAppVersion(body.data?.appVersion);
      }
    } catch {
      online = false;
    } finally {
      heartbeatController = undefined;
    }
  }
  const heartbeatTimer = active ? setInterval(() => { void refreshConnection(); }, 5000) : undefined;
  heartbeatTimer?.unref();
  void refreshConnection();
  const status = () => active
    ? { mode: "remote", name: active.name, url: active.url, appVersion, remoteAppVersion, online: online === true ? Date.now() - lastSuccess < 15000 : online }
    : { mode: "local", appVersion };
  const router = express.Router();
  router.use(languageRequest);
  async function saveConnection(value?: RemoteConnection) {
    const previous = savedText;
    const next = value ? JSON.stringify(value) : undefined;
    if (next) await writeAtomic(path, next, { mode: 0o600 });
    else await rm(path, { force: true });
    try {
      // 写入让出事件循环后也要复检，不能在配对期间开启共享后自动停掉它。
      if (value) options.validateTarget?.(value.url);
      await options.onChange?.(Boolean(value));
      savedText = next;
    } catch (error) {
      if (previous) await writeAtomic(path, previous, { mode: 0o600 });
      else await rm(path, { force: true });
      throw error;
    }
  }
  function completeChange(response: express.Response, value: { mode: string; url?: string; name?: string }) {
    if (options.restart) {
      let restarted = false;
      const restartHost = () => {
        if (restarted) return;
        restarted = true;
        clearTimeout(timer);
        options.restart?.();
      };
      // 已提交的切换必须完成；Bun 中请求被取消时可能不再触发 finish/close。
      const timer = setTimeout(restartHost, 500);
      timer.unref();
      response.once("finish", restartHost);
    }
    response.json({ ...value, restart });
  }
  router.get("/connection", (_request, response) => { response.json(status()); });
  router.use(express.json({ limit: "8kb" }));
  router.use((request, response, next) => {
    if (request.get("x-toonflow-workspace") !== "1") return void response.sendStatus(403);
    if (changing) return void response.status(409).json({ message: translateMessage("正在切换连接，请稍候") });
    next();
  });
  router.post("/connect", async (request, response) => {
    let pair: { url: string; code: string };
    try {
      if (request.body?.qrCode !== undefined) {
        const text = request.body.qrCode;
        if (typeof text !== "string" || text.length > 4096) throw new Error("请扫描 Toonflow 的互联二维码");
        const value = JSON.parse(text);
        if (value.type !== "toonflowMobile" || value.version !== 1 || typeof value.code !== "string" || !/^[\w-]{32,256}$/.test(value.code)) {
          throw new Error("请扫描 Toonflow 的互联二维码");
        }
        pair = { url: serverUrl(value.url), code: value.code };
      } else {
        const code = request.body?.code;
        if (typeof code !== "string" || !/^\d{12}$/.test(code)) throw new Error("请输入 12 位数字配对码");
        pair = { url: serverUrl(request.body?.url), code };
      }
      options.validateTarget?.(pair.url);
    } catch (error) {
      const status = (error as { status?: number })?.status;
      response.status(Number.isInteger(status) && status! >= 400 && status! <= 599 ? status! : 400).json({ message: error instanceof Error ? translateError(error) : translateMessage("二维码无效") });
      return;
    }
    changing = true;
    try {
      const result = await fetch(`${pair.url}/api/mobileLink/pair`, {
        method: "POST", redirect: "error", signal: AbortSignal.timeout(15000),
        headers: { "Content-Type": "application/json", "Accept-Language": request.get("accept-language") ?? "" }, body: JSON.stringify({ code: pair.code, name: options.deviceName?.trim().slice(0, 100) || "Toonflow" }),
      });
      const body = await result.json() as { code?: number; message?: string; data?: RemoteConnection };
      if (!result.ok || body.code !== 200) throw Object.assign(new Error(body.message || "连接失败，请刷新二维码重试"), { status: result.ok ? 502 : result.status });
      if (!body.data || typeof body.data.name !== "string" || typeof body.data.deviceToken !== "string"
        || !/^[\w-]{32,256}$/.test(body.data.deviceToken)) throw new Error("服务器返回了无效的连接凭据");
      options.validateTarget?.(pair.url);
      await saveConnection({ url: pair.url, name: body.data.name.slice(0, 128), deviceToken: body.data.deviceToken, appVersion: readAppVersion(body.data.appVersion) });
      completeChange(response, { mode: "remote", url: pair.url, name: body.data.name });
    } catch (error) {
      // 不将请求对象或设备凭据写入日志/错误页。
      const status = (error as { status?: number })?.status;
      response.status(Number.isInteger(status) && status! >= 400 && status! <= 599 ? status! : 502).json({ message: error instanceof Error ? translateError(error) : translateMessage("无法连接服务器") });
    } finally {
      changing = false;
    }
  });
  router.post("/disconnect", async (_request, response) => {
    changing = true;
    try {
      await saveConnection();
      completeChange(response, { mode: "local" });
    } finally {
      changing = false;
    }
  });
  return { router, remote: Boolean(active), proxy: active ? remoteProxy(active) : undefined,
    stop() { clearInterval(heartbeatTimer); heartbeatController?.abort(); } };
}

function remoteProxy(connection: RemoteConnection): express.RequestHandler {
  return (request, response) => {
    const localOrigin = `http://${request.get("host")}`;
    const target = new URL(connection.url);
    // 用 pathname/search 赋值，不让 //evil.example 这类路径替换目标主机。
    const queryStart = request.originalUrl.indexOf("?");
    target.pathname = queryStart < 0 ? request.originalUrl : request.originalUrl.slice(0, queryStart);
    target.search = queryStart < 0 ? "" : request.originalUrl.slice(queryStart);
    const headers = { ...request.headers };
    const hopHeaders = ["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade"];
    for (const name of [...hopHeaders, ...(request.get("connection") ?? "").toLowerCase().split(/\s*,\s*/), "cookie", "host", "origin", "referer", "forwarded", "x-toonflow-desktop", "x-toonflow-local-client"]) delete headers[name];
    for (const name of Object.keys(headers)) if (name.startsWith("x-forwarded-")) delete headers[name];
    headers.origin = connection.url;
    headers.referer = `${connection.url}/`;
    headers["x-toonflow-device-token"] = connection.deviceToken;
    let upstreamResponse: IncomingMessage | undefined;
    const upstream = (target.protocol === "https:" ? httpsRequest : httpRequest)(target, { method: request.method, headers }, result => {
      upstreamResponse = result;
      clearTimeout(headerTimeout);
      if (request.path === "/" && (result.statusCode ?? 500) >= 400) {
        result.resume();
        showConnectionError(response, result.statusCode === 401 ? "连接已失效，请切回本机后重新扫码。" : "服务器暂时不可用。");
        return;
      }
      const location = result.headers.location;
      if (location) {
        const redirect = URL.canParse(location, target.href) ? new URL(location, target) : undefined;
        if (!redirect || redirect.origin !== connection.url) {
          result.resume();
          showConnectionError(response, "服务器返回了其他地址，请重新扫码连接。", request.path === "/");
          return;
        }
        result.headers.location = `${localOrigin}${redirect.pathname}${redirect.search}${redirect.hash}`;
      }
      response.status(result.statusCode ?? 502);
      const skip = [...hopHeaders, ...(result.headers.connection ?? "").toLowerCase().split(/\s*,\s*/), "set-cookie", "content-security-policy", "cache-control", "strict-transport-security", "referrer-policy"];
      for (const [name, value] of Object.entries(result.headers)) if (value !== undefined && !skip.includes(name)) response.setHeader(name, value);
      result.on("error", () => response.destroy());
      result.pipe(response);
    });
    const headerTimeout = setTimeout(() => upstream.destroy(new Error("连接服务器超时")), 20000);
    headerTimeout.unref();
    upstream.on("error", () => {
      clearTimeout(headerTimeout);
      if (response.destroyed) return;
      if (response.headersSent) return void response.destroy();
      showConnectionError(response, "无法连接服务器，请检查电脑是否运行、网络和防火墙设置。", request.path === "/");
    });
    const close = () => {
      clearTimeout(headerTimeout);
      upstreamResponse?.destroy();
      upstream.destroy();
      request.socket.off("close", close);
    };
    request.once("aborted", close);
    request.socket.once("close", close);
    response.once("close", close);
    // ACT: 原始请求/响应流直接管道传输，保留 Range、上传与 Agent/SSE 增量数据，并传播取消。
    if (request.headers["content-length"] || request.headers["transfer-encoding"]) request.pipe(upstream);
    else upstream.end();
  };
}

function showConnectionError(response: express.Response, message: string, page = true) {
  message = translateMessage(message);
  if (!page) return void response.status(502).json({ message });
  const locale = getLocale();
  const title = Bun.escapeHTML(translateMessage("连接未完成"));
  const retry = Bun.escapeHTML(translateMessage("重试"));
  const disconnect = Bun.escapeHTML(translateMessage("断开并独立运行"));
  const failure = Bun.escapeHTML(translateMessage("切换失败，请重试"));
  // 错误页来自本机，远端离线时仍可主动独立运行。返回200避免原生HTTP错误遮住恢复按钮。
  response.status(200).type("html").send(`<!doctype html><html lang="${locale}" dir="${isRtlLocale(locale) ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Toonflow</title><style>body{font:16px system-ui;background:#fff;color:#303133;text-align:center;padding:8vh 24px}button{padding:12px 20px;margin:12px;border:1px solid #dcdfe6;border-radius:8px;background:#fff;color:#409eff;font:inherit}</style></head><body><h2>${title}</h2><p>${Bun.escapeHTML(message)}</p><button onclick="location.reload()">${retry}</button><button data-error="${failure}" onclick="this.disabled=true;fetch('/api/connection/disconnect',{method:'POST',headers:{'x-toonflow-workspace':'1','Accept-Language':'${locale}'}}).then(async r=>{if(!r.ok)throw Error();if((await r.json()).restart==='mobile')location.href='toonflow://restart'}).catch(()=>{this.disabled=false;alert(this.dataset.error)})">${disconnect}</button><script>if(new URLSearchParams(location.search).get("desktop")==="1")fetch("/api/desktop/ready",{method:"POST",headers:{"x-toonflow-desktop":"1","Content-Type":"application/json"},body:JSON.stringify({failed:true})}).catch(()=>{});</script></body></html>`);
}
