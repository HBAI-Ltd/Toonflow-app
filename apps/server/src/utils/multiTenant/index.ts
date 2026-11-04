import { dirname } from "node:path";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { Application, Request, Response } from "express";
import { createMultiTenant } from "@toonflow/multi-tenant-auth";
import type { AuthIdentity, ListUserOptions } from "@toonflow/multi-tenant-auth";
import { createSourceMapping } from "@toonflow/multi-tenant-source-mapping";
import type { SourceMapping } from "@toonflow/multi-tenant-source-mapping/config";
import conf from "@/utils/conf";
import { assertAppRequest } from "@/utils/mcp/control";
import { isMobileLinkRequest } from "@/utils/mobileLink";
import { changeMultiTenantEnabled } from "./runtime";
import { isEnabled } from "./mode";

export { startMultiTenantRuntime, stopMultiTenantRuntime } from "./runtime";
export { creationPort, isEnabled } from "./mode";
export { requestIdentity } from "./runtime";
export { currentIdentity } from "./context";
export { modelGateway, requireDirectModelAccess } from "./gateway";
export { userSettings } from "./settings";
export { getModelRouting, getAvailableModels, saveModelRouting, configureModelCloud, getModelProviders, saveModelProviders, inspectModelProvider, getUserBilling, creditUserBalance, releaseUserReservation, readOwnBalance } from "./management";

const control = createMultiTenant(dirname(conf.path));
const sourceMapping = createSourceMapping(dirname(conf.path));
let setupQueue = Promise.resolve();
const hostClients = new WeakMap<Application, { secretHash: string; token: string }>();

function digest(value: string) { return createHash("sha256").update(value).digest("hex"); }
function sameSecret(value: string, hash: string) {
  const actual = Buffer.from(digest(value), "hex");
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function cookie(req: Request, name: string) {
  const values = (req.get("cookie") ?? "").split(";").map(value => value.trim()).filter(value => value.startsWith(`${name}=`));
  return values.length === 1 ? values[0]!.slice(name.length + 1) : "";
}
function cookieOptions(req: Request, path: string) {
  return { httpOnly: true, sameSite: "strict" as const, secure: req.secure || (req.get("origin") ?? req.get("referer"))?.startsWith("https://") === true, path };
}
function assertUserRequest(req: Request) {
  if (!isEnabled()) throw Object.assign(new Error("多租户尚未开启"), { status: 403 });
  if (!req.res?.locals.multiTenantWeb) return assertAppRequest(req);
  let source: URL | undefined;
  try { source = new URL(req.get("origin") ?? req.get("referer") ?? ""); } catch { /* 来源无效时统一拒绝。 */ }
  if (!source || !["http:", "https:"].includes(source.protocol) || source.host !== req.get("host") || req.get("x-toonflow-workspace") !== "1") {
    throw Object.assign(new Error("只允许 Toonflow 页面访问账号接口"), { status: 403 });
  }
}
function assertControlRequest(req: Request) {
  if (req.res?.locals.multiTenantWeb) throw Object.assign(new Error("创作入口不能访问主机管理接口"), { status: 403 });
  assertAppRequest(req);
}

async function accessControl<T>(operation: () => Promise<T>) {
  try { return await operation(); }
  catch (cause) {
    if (cause instanceof z.ZodError) throw cause;
    const failure = (cause && typeof cause === "object" ? cause : {}) as { status?: number; code?: unknown; cause?: { code?: unknown } };
    if (failure.status && failure.status >= 400 && failure.status <= 599) throw cause;
    const code = failure.cause?.code ?? failure.code;
    // ORM 异常可能携带 SQL 参数或连接凭据；只保留诊断码，不向响应及统一错误日志传递原异常。
    throw Object.assign(new Error("多租户数据源访问失败，请检查配置与数据库状态"), {
      status: 503, ...(typeof code === "string" && /^[a-zA-Z0-9_]{1,64}$/.test(code) ? { code } : {}),
    });
  }
}

export function canSetup(req: Request) {
  return !req.res?.locals.multiTenantWeb && !isMobileLinkRequest(req)
    && req.get("x-toonflow-local-client") !== "0"
    && !req.get("forwarded") && !req.get("x-forwarded-for") && !req.get("x-real-ip")
    && ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress ?? "")
    && ["localhost", "127.0.0.1", "[::1]"].includes(req.hostname);
}

export function registerHostClient(app: Application, secret: string) {
  if (secret.length < 32 || secret.length > 256) throw new Error("主机身份凭据无效");
  hostClients.set(app, { secretHash: digest(secret), token: randomBytes(32).toString("hex") });
}

export function authenticateHost(req: Request) {
  const host = hostClients.get(req.app);
  const token = cookie(req, "toonflowHostSession");
  return !!host && canSetup(req) && /^[a-f0-9]{64}$/.test(token) && sameSecret(token, digest(host.token));
}

export function hostSession(req: Request, res: Response) {
  assertControlRequest(req);
  const host = hostClients.get(req.app);
  const secret = req.get("x-toonflow-host-token") ?? "";
  if (!host || !canSetup(req) || secret.length < 32 || secret.length > 256 || !sameSecret(secret, host.secretHash)) {
    throw Object.assign(new Error("主机身份验证失败"), { status: 403 });
  }
  res.cookie("toonflowHostSession", host.token, cookieOptions(req, "/"));
  return { authenticated: true };
}

export async function status(req: Request) {
  assertControlRequest(req);
  return { configured: await accessControl(() => control.isConfigured()), enabled: isEnabled(), canSetup: canSetup(req) };
}

export function setup(req: Request, userName: string, password: string, enabled: boolean) {
  assertControlRequest(req);
  if (!canSetup(req)) throw Object.assign(new Error("请在宿主本机页面首次设置超级管理员账号和密码"), { status: 403 });
  const saving = setupQueue.then(async () => {
    await accessControl(() => control.setup(userName, password));
    await changeMultiTenantEnabled(req.app, enabled, () => conf.set("settings.multiTenantEnabled", enabled), req.res);
    return { configured: true, enabled: isEnabled() };
  });
  setupQueue = saving.then(() => {}, () => {});
  return saving;
}

export async function login(req: Request, res: Response, userName: string, password: string) {
  assertControlRequest(req);
  const token = await accessControl(() => control.login(userName, password));
  res.cookie("toonflowAdminSession", token, cookieOptions(req, "/api/multiTenant"));
  return { token, enabled: isEnabled() };
}

export async function authorize(req: Request) {
  assertControlRequest(req);
  if (authenticateHost(req)) return;
  const value = req.get("authorization") ?? "";
  await accessControl(() => control.authorize(value.startsWith("Bearer ") ? value.slice(7) : cookie(req, "toonflowAdminSession")));
}

export async function logout(req: Request, res: Response) {
  assertControlRequest(req);
  const value = req.get("authorization") ?? "";
  await accessControl(() => control.logout(value.startsWith("Bearer ") ? value.slice(7) : cookie(req, "toonflowAdminSession")));
  const host = hostClients.get(req.app);
  if (authenticateHost(req) && host) host.token = randomBytes(32).toString("hex");
  res.clearCookie("toonflowAdminSession", cookieOptions(req, "/api/multiTenant"));
  res.clearCookie("toonflowHostSession", cookieOptions(req, "/"));
  return { enabled: isEnabled() };
}

export async function authenticateWeb(req: Request): Promise<AuthIdentity | null> {
  if (!isEnabled()) return null;
  return accessControl(() => control.authenticateWeb(cookie(req, "toonflowWebSession")));
}

export async function userSession(req: Request) {
  const publicWeb = req.res?.locals.multiTenantWeb === true;
  if (publicWeb) assertUserRequest(req);
  else assertControlRequest(req);
  const host = !publicWeb && authenticateHost(req);
  let user: AuthIdentity | null = null;
  if (publicWeb) user = await authenticateWeb(req);
  else if (host) user = await accessControl(() => control.getAdminIdentity());
  else {
    try {
      await authorize(req);
      user = await accessControl(() => control.getAdminIdentity());
    } catch (error) {
      if ((error as { status?: number }).status !== 401) throw error;
    }
  }
  return { user, publicWeb, enabled: isEnabled(), host, registrationEnabled: await accessControl(() => control.getRegistrationEnabled()) };
}

export async function registerUser(req: Request, res: Response, userName: string, password: string) {
  assertUserRequest(req);
  const result = await accessControl(() => control.register(userName, password));
  res.cookie("toonflowWebSession", result.token, { ...cookieOptions(req, "/"), maxAge: 8 * 60 * 60 * 1000 });
  return { user: result.user };
}

export async function loginUser(req: Request, res: Response, userName: string, password: string) {
  assertUserRequest(req);
  const result = await accessControl(() => control.loginWeb(userName, password));
  res.cookie("toonflowWebSession", result.token, { ...cookieOptions(req, "/"), maxAge: 8 * 60 * 60 * 1000 });
  return { user: result.user };
}

export async function loginHostWeb(req: Request, res: Response) {
  assertUserRequest(req);
  const host = hostClients.get(req.app);
  const secret = req.get("x-toonflow-host-token") ?? "";
  if (!req.res?.locals.multiTenantWeb || !host || secret.length < 32 || secret.length > 256 || !sameSecret(secret, host.secretHash)) {
    throw Object.assign(new Error("主机身份验证失败"), { status: 403 });
  }
  const result = await accessControl(() => control.loginHostWeb());
  res.cookie("toonflowWebSession", result.token, { ...cookieOptions(req, "/"), maxAge: 8 * 60 * 60 * 1000 });
  return { user: result.user };
}

export async function logoutUser(req: Request, res: Response) {
  assertUserRequest(req);
  await accessControl(() => control.logoutWeb(cookie(req, "toonflowWebSession")));
  res.clearCookie("toonflowWebSession", cookieOptions(req, "/"));
  return { user: null };
}

export async function readUserSettings(userId: string) {
  return accessControl(() => control.readUserSettings(userId));
}

export async function writeUserSettings(userId: string, settings: Record<string, unknown>, expectedRevision: number) {
  return accessControl(() => control.writeUserSettings(userId, settings, expectedRevision));
}

export async function listUsers(req: Request, query: ListUserOptions) {
  await authorize(req);
  return accessControl(() => control.listUsers(query));
}

export async function createUser(req: Request, userName: string, password: string) {
  await authorize(req);
  return accessControl(() => control.createUser(userName, password));
}

export async function setUserDisabled(req: Request, id: string, disabled: boolean) {
  await authorize(req);
  return accessControl(() => control.setUserDisabled(id, disabled));
}

export async function resetUserPassword(req: Request, id: string, password: string) {
  await authorize(req);
  return accessControl(() => control.resetUserPassword(id, password));
}

export async function state(req: Request) {
  await authorize(req);
  const value = conf.get("settings", {}).ui;
  const ui = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return {
    enabled: isEnabled(),
    registrationEnabled: await accessControl(() => control.getRegistrationEnabled()),
    user: await accessControl(() => control.getAdminIdentity()),
    ui: Object.fromEntries(["theme", "language", "primaryColor", "fontScale", "radius"]
      .filter(key => Object.hasOwn(ui, key)).map(key => [key, ui[key]])),
  };
}

export async function setEnabled(req: Request, enabled: boolean) {
  await authorize(req);
  await changeMultiTenantEnabled(req.app, enabled, () => conf.set("settings.multiTenantEnabled", enabled), req.res);
  return { enabled: isEnabled() };
}

export async function setRegistrationEnabled(req: Request, registrationEnabled: boolean) {
  await authorize(req);
  return { registrationEnabled: await accessControl(() => control.setRegistrationEnabled(registrationEnabled)) };
}

export async function readSourceMapping(req: Request) {
  await authorize(req);
  return accessControl(() => sourceMapping.read());
}

export async function saveSourceMapping(req: Request, mappings: SourceMapping, expectedRevision: number) {
  await authorize(req);
  return accessControl(() => sourceMapping.save(mappings, expectedRevision));
}
