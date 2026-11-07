import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { resolve } from "node:path";
import type { RequestHandler, Response } from "express";
import { z } from "zod";
import { readFile, writeAtomic } from "@toonflow/file";
import { isRtlLocale } from "@toonflow/i18n";
import { getRuntimePlatform } from "@/lib/platform";
import { getLocale, translateMessage } from "@/lib/i18n";
import { error, success } from "@/lib/responseFormat";

const derivePassword = promisify(scrypt);
const sessionDuration = 7 * 24 * 60 * 60 * 1000;
const cookieName = "toonflowAccess";
let access: { hash: Buffer; salt: Buffer; key: Buffer; attempts: Map<string, { count: number; windowEndsAt: number }> } | undefined;

export async function initializeAccess(dataDirectory: string) {
  const platform = getRuntimePlatform();
  if (platform.desktop || platform.mobile || platform.development) return false;
  const invalidConfiguration = "访问密码配置无效，请检查 access.json 或 TOONFLOW_SERVER_PASSWORD（12–1024 个字符）";
  let configuration: unknown = { password: process.env.TOONFLOW_SERVER_PASSWORD };
  if (!process.env.TOONFLOW_SERVER_PASSWORD) {
    const path = resolve(dataDirectory, "access.json");
    let source: string;
    try { source = await readFile(path, "utf8"); }
    catch (cause) {
      if ((cause as NodeJS.ErrnoException).code !== "ENOENT") throw cause;
      // 每次安装独立生成默认密码；独占创建，绝不覆盖已有配置。
      const defaults = JSON.stringify({ password: randomBytes(18).toString("base64url") }, null, 2) + "\n";
      try { await writeAtomic(path, defaults, { exclusive: true, mode: 0o600 }); }
      catch (cause) { if ((cause as NodeJS.ErrnoException).code !== "EEXIST") throw cause; }
      source = await readFile(path, "utf8");
    }
    try { configuration = JSON.parse(source); }
    catch { throw new Error(invalidConfiguration); }
  }
  const parsed = z.object({ password: z.string().max(1024).refine(value => value.trim().length >= 12) }).safeParse(configuration);
  if (!parsed.success) throw new Error(invalidConfiguration);
  const salt = randomBytes(32);
  access = { hash: await derivePassword(parsed.data.password, salt, 32) as Buffer, salt, key: randomBytes(32), attempts: new Map() };
  return true;
}

function signSession(expires: string) {
  return createHmac("sha256", access!.key).update(expires).digest("hex");
}

function createSession() {
  const expires = String(Date.now() + sessionDuration);
  return `${expires}.${signSession(expires)}`;
}

export function getAccessHeaders(): Record<string, string> {
  return access ? { Cookie: `${cookieName}=${createSession()}` } : {};
}

function sendLoginPage(response: Response, message = "", status = 401) {
  const text = (value: string) => Bun.escapeHTML(translateMessage(value));
  response.status(status).set({
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    "Referrer-Policy": "same-origin",
    "X-Content-Type-Options": "nosniff",
  }).type("html").send(`<!doctype html>
<html lang="${getLocale()}" dir="${isRtlLocale(getLocale()) ? "rtl" : "ltr"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TTLflow</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100svh; display: grid; place-items: center; padding: 24px; background: #f5f7fa; color: #303133; font-family: "Inter", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; }
  .accessPanel { width: min(100%, 360px); padding: 32px; border: 1px solid #dcdfe6; border-radius: 12px; background: #fff; }
  h1 { margin: 0 0 12px; font-size: 30px; font-weight: 600; }
  p { margin: 0 0 28px; font-size: 14px; line-height: 1.6; color: #606266; }
  label { display: block; margin-bottom: 8px; font-size: 14px; }
  input, button { width: 100%; min-height: 44px; border-radius: 8px; font: inherit; }
  input { padding: 10px 12px; border: 1px solid #dcdfe6; background: #fff; color: #303133; }
  button { margin-top: 20px; padding: 10px 16px; border: 0; background: #2563eb; color: #fff; cursor: pointer; }
  input:focus-visible, button:focus-visible { outline: 2px solid #2563eb; outline-offset: 3px; }
  .accessError { margin: 12px 0 0; color: #b42318; }
</style></head>
<body><main class="accessPanel"><h1>TTLflow</h1><p>${text("请输入服务器访问密码")}</p>
<form method="post" action="/api/access/login">
  <label for="password">${text("密码")}</label>
  <input id="password" name="password" type="password" autocomplete="current-password" maxlength="1024" required autofocus${message ? ' aria-describedby="accessError" aria-invalid="true"' : ""}>
  ${message ? `<p id="accessError" class="accessError" role="alert">${text(message)}</p>` : ""}
  <button type="submit">${text("登录")}</button>
</form></main></body></html>`);
}

export const accessRequest: RequestHandler = (request, response, next) => {
  response.set("Cache-Control", "no-store");
  if (request.method === "POST" && /^\/api\/access\/login\/?$/i.test(request.path)) return next();
  const cookie = (request.get("cookie") ?? "").split(";").map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`));
  const session = /^(\d{13})\.([a-f0-9]{64})$/.exec(cookie?.slice(cookieName.length + 1) ?? "");
  if (session && Number(session[1]) > Date.now() && timingSafeEqual(Buffer.from(session[2], "hex"), Buffer.from(signSession(session[1]), "hex"))) {
    return next();
  }
  response.set("X-Toonflow-Access", "required");
  if (request.method === "GET" && !/^\/(api|mcp|a2a)(\/|$)/i.test(request.path) && request.accepts("html")) {
    return sendLoginPage(response);
  }
  response.status(401).json(error("请输入服务器访问密码", null, 401));
};

export async function login(password: string, response: Response, secure: boolean, client: string, json: boolean) {
  if (!access) return response.status(404).json(error("", null, 404));
  const now = Date.now();
  for (const [address, attempt] of access.attempts) {
    if (attempt.windowEndsAt <= now) access.attempts.delete(address);
  }
  let attempt = access.attempts.get(client);
  if (!attempt) {
    // shortcut: 单进程最多保存 4096 个客户端的限流记录；更大访问量交给可信反向代理限流。
    if (access.attempts.size >= 4096) access.attempts.delete(access.attempts.keys().next().value!);
    attempt = { count: 0, windowEndsAt: now + 60000 };
    access.attempts.set(client, attempt);
  }
  response.set("Cache-Control", "no-store");
  if (attempt.count >= 10) {
    response.set("Retry-After", String(Math.ceil((attempt.windowEndsAt - now) / 1000)));
    return json ? response.status(429).json(error("登录尝试过于频繁，请稍后重试", null, 429))
      : sendLoginPage(response, "登录尝试过于频繁，请稍后重试", 429);
  }
  attempt.count++;
  const actual = await derivePassword(password, access.salt, 32) as Buffer;
  if (!timingSafeEqual(actual, access.hash)) return json ? response.status(401).json(error("密码错误，请重试", null, 401))
    : sendLoginPage(response, "密码错误，请重试");
  response.cookie(cookieName, createSession(), {
    httpOnly: true, sameSite: "strict", secure, path: "/", maxAge: sessionDuration,
  });
  return json ? response.json(success()) : response.redirect(303, "/");
}
