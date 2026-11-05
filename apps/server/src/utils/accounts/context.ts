import { AsyncLocalStorage } from "node:async_hooks";

export interface AccountUser {
  id: string;
  username: string;
  role: "admin" | "user";
  enabled: boolean;
  mustChangePassword: boolean;
  storageLimitBytes: number;
}

const context = new AsyncLocalStorage<AccountUser>();

export function isMultiUser() {
  return process.env.TOONFLOW_MULTI_USER === "1";
}

export function currentUser() {
  return context.getStore();
}

export function requireUser() {
  const user = currentUser();
  if (!user) throw Object.assign(new Error("请先登录"), { status: 401 });
  return user;
}

export function runWithUser<T>(user: AccountUser, operation: () => T): T {
  return context.run(user, operation);
}
