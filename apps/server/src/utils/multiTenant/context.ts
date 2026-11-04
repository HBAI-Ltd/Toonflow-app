import { AsyncLocalStorage } from "node:async_hooks";
import type { AuthIdentity } from "@toonflow/multi-tenant-auth";

const identityContext = new AsyncLocalStorage<AuthIdentity>();

export function currentIdentity() { return identityContext.getStore(); }

export function runWithIdentity(identity: AuthIdentity, operation: () => void) {
  return identityContext.run(identity, operation);
}
