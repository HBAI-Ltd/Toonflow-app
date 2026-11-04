import type { Request } from "express";
import { lstat, mkdir, realpath, stat } from "@toonflow/file";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import conf from "@/utils/conf";
import { getMobileLinkConfig, isMobileLinkRequest } from "@/utils/mobileLink";
import { getRuntimePlatform } from "@/lib/platform";

export function isLocalHostRequest(req: Request) {
  if (isMobileLinkRequest(req) || req.res?.locals.multiTenantWeb || req.res?.locals.multiTenantUser?.role === "user") return false;
  if (conf.get("settings", {}).multiTenantEnabled === true && req.res?.locals.multiTenantUser?.role !== "admin") return false;
  const localAddress = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress ?? "") && req.get("x-toonflow-local-client") !== "0";
  const localHost = ["localhost", "127.0.0.1", "[::1]"].includes(req.hostname);
  return localAddress && localHost;
}

export async function getWorkspaceRoot(req: Request) {
  const user = req.res?.locals.multiTenantUser;
  if (req.res?.locals.multiTenantWeb && !user) throw Object.assign(new Error("请先登录 Toonflow"), { status: 401 });
  if (user?.role === "user" && !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(user.id)) {
    throw Object.assign(new Error("账号工作区身份无效"), { status: 403 });
  }
  let root = await realpath(dirname(conf.path));
  const parts = user?.role === "user" ? ["multiTenant", "workspaces", user.id] : ["workspaces"];
  for (const part of parts) {
    const path = resolve(root, part);
    try { await mkdir(path, { mode: 0o700 }); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
    const info = await lstat(path);
    if (!info.isDirectory() || info.isSymbolicLink()) throw Object.assign(new Error("工作区目录必须是普通目录"), { status: 403 });
    const actual = await realpath(path);
    const offset = relative(root, actual);
    if (offset === ".." || offset.startsWith(`..${sep}`) || isAbsolute(offset)) {
      throw Object.assign(new Error("只能访问当前账号的工作区"), { status: 403 });
    }
    root = actual;
  }
  return root;
}

export function isLocalWorkspaceRequest(req: Request) {
  const origin = req.get("origin");
  const localOrigin = `${req.protocol}://${req.get("host")}`;
  const sameOrigin = origin === undefined ? req.get("referer")?.startsWith(`${localOrigin}/`) : origin === localOrigin;
  return isLocalHostRequest(req) && sameOrigin && req.get("x-toonflow-workspace") === "1";
}

export async function resolveWorkspace(req: Request, path: string) {
  if (!isAbsolute(path)) throw Object.assign(new Error("工作目录必须是绝对路径"), { status: 400 });
  const user = req.res?.locals.multiTenantUser;
  if (req.res?.locals.multiTenantWeb && !user) throw Object.assign(new Error("请先登录 Toonflow"), { status: 401 });
  const userRoot = user?.role === "user" ? await getWorkspaceRoot(req) : null;
  if (userRoot) {
    const offset = relative(userRoot, resolve(path));
    if (offset === ".." || offset.startsWith(`..${sep}`) || isAbsolute(offset)) {
      throw Object.assign(new Error("只能访问当前账号的工作区"), { status: 403 });
    }
  }
  const directory = await realpath(path).catch((err: NodeJS.ErrnoException) => {
    if (err.code === "ENOENT" || err.code === "ENOTDIR") throw Object.assign(new Error("工作目录不存在，请重新选择文件夹"), { status: 404 });
    throw err;
  });
  if (!(await stat(directory)).isDirectory()) throw Object.assign(new Error("工作目录不是文件夹，请重新选择"), { status: 404 });
  if (user?.role === "admin") return directory;
  if (userRoot) {
    const offset = relative(userRoot, directory);
    if (offset !== ".." && !offset.startsWith(`..${sep}`) && !isAbsolute(offset)) return directory;
    throw Object.assign(new Error("只能访问当前账号的工作区"), { status: 403 });
  }
  if (getRuntimePlatform().local && isLocalWorkspaceRequest(req)) return directory;

  if (isMobileLinkRequest(req)) {
    for (const root of getMobileLinkConfig().directories) {
      const offset = relative(root, directory);
      if (offset !== ".." && !offset.startsWith(`..${sep}`) && !isAbsolute(offset)) return directory;
    }
  }

  const root = await realpath(resolve(dirname(conf.path), "workspaces")).catch((err: NodeJS.ErrnoException) => {
    if (err.code === "ENOENT") return null;
    throw err;
  });
  if (root) {
    const offset = relative(root, directory);
    if (offset !== ".." && !offset.startsWith(`..${sep}`) && !isAbsolute(offset)) return directory;
  }
  throw Object.assign(new Error("服务器部署只能使用服务器工作区"), { status: 403 });
}
