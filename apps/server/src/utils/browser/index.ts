import { createBrowserRuntime } from "@toonflow/tool-browser/host";
import type { ToolContext } from "@toonflow/tools-scaffold/runtime";

export const browserRuntime = createBrowserRuntime();

export function createBrowserContext(cwd: string): ToolContext["browser"] {
  if (process.env.toonflowDesktop !== "1" && process.env.NODE_ENV !== "dev") return;
  return { execute: (sessionId, args, config, signal, onUpdate) => browserRuntime.execute(cwd, sessionId, args, config, signal, onUpdate) };
}

export function closeBrowsers() {
  return browserRuntime.closeAll();
}
