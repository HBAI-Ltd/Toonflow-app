import { createBrowserRuntime } from "@toonflow/tool-browser/host";
import type { ToolContext } from "@toonflow/tools-scaffold/runtime";
import { getRuntimePlatform } from "@/lib/platform";

export const browserRuntime = createBrowserRuntime();

export function createBrowserContext(cwd: string): ToolContext["browser"] {
  const platform = getRuntimePlatform();
  if (!platform.desktop && !platform.development) return;
  return { execute: (sessionId, args, config, signal, onUpdate) => browserRuntime.execute(cwd, sessionId, args, config, signal, onUpdate) };
}

export function closeBrowsers() {
  return browserRuntime.closeAll();
}
