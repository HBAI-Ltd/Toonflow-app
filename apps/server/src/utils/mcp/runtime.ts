import { once } from "node:events";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { dirname, resolve } from "node:path";
import type { Express } from "express";
import conf from "@/utils/conf";
import { getMcpSettings } from "@/utils/mcp/control";

let runtime: { app: Express; appOrigin: string; server?: Server; url?: string; port?: number; preferredPort?: number; file?: string; command: string; entry: string; error?: string } | undefined;
let reloadQueue = Promise.resolve();

function removeRuntime(file?: string) {
  if (!file) return;
  // ACT: 文件按端口复用；只清理自己的记录，不能删除接替此端口的另一个实例。
  try {
    if (JSON.parse(readFileSync(file, "utf8")).pid === process.pid) rmSync(file, { force: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") console.error("清理 MCP 运行信息失败：", error);
  }
}

function saveRuntime(value = runtime) {
  const { enabled, token } = getMcpSettings();
  if (!value?.file) return;
  if (enabled && token.length >= 32) {
    writeFileSync(value.file, JSON.stringify({ pid: process.pid, url: value.url, token }), { mode: 0o600 });
  } else removeRuntime(value.file);
}

export function initializeMcpRuntime(app: Express, url: string, entry: string, command = process.execPath) {
  runtime = { app, appOrigin: new URL(url).origin, entry, command };
  return reloadMcpRuntime();
}

export function reloadMcpRuntime() {
  // ACT: 设置保存和跨进程 watch 共用串行重载，避免同时抢端口；不重启宿主服务。
  reloadQueue = reloadQueue.catch(() => {}).then(async () => {
    const current = runtime;
    if (!current) return;
    const preferredPort = getMcpSettings().port;
    if (current.server && current.preferredPort === preferredPort && !current.error) return;
    const server = createServer((req, res) => {
      // 复用宿主协议和鉴权，但固定端口只暴露 MCP，不开放页面及管理接口。
      if (!/^\/mcp\/?(?:\?|$)/.test(req.url ?? "")) {
        res.writeHead(404).end();
        return;
      }
      current.app(req, res);
    });
    let file: string | undefined;
    try {
      // ACT: 单机多开最多尝试 32 个相邻端口；直接 listen，避免探测后端口被抢占。
      for (let port = preferredPort; port <= Math.min(preferredPort + 31, 65535); port++) {
        if (port === current.port) {
          current.preferredPort = preferredPort;
          current.error = undefined;
          return;
        }
        try {
          const listening = once(server, "listening");
          server.listen(port, "127.0.0.1");
          await listening;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "EADDRINUSE") continue;
          throw error;
        }
        file = resolve(dirname(conf.path), `mcpRuntime${port}.json`);
        const next = { ...current, server, preferredPort, port, url: `http://127.0.0.1:${port}/mcp`, file, error: undefined };
        saveRuntime(next);
        runtime = next;
        server.unref();
        current.server?.close();
        current.server?.closeAllConnections();
        removeRuntime(current.file);
        return;
      }
      throw new Error(`MCP 端口 ${preferredPort}–${Math.min(preferredPort + 31, 65535)} 均已占用，请修改首选端口`);
    } catch (error) {
      server.close();
      removeRuntime(file);
      current.error = `MCP 端口切换失败${current.url ? "，继续使用原地址" : ""}：${error instanceof Error ? error.message : String(error)}`;
      console.error(current.error);
    }
  });
  return reloadQueue;
}

export function getMcpRuntime() {
  const preferredPort = getMcpSettings().port;
  return {
    appOrigin: runtime?.appOrigin,
    endpoint: runtime?.url ?? null,
    preferredPort,
    port: runtime?.port ?? null,
    error: runtime?.error ?? null,
    stdio: runtime?.file && existsSync(runtime.entry)
      ? { command: runtime.command, args: [runtime.entry, "--runtime", runtime.file] }
      : null,
  };
}

conf.onDidChange("settings", (next, previous) => {
  if (JSON.stringify(next?.mcp) === JSON.stringify(previous?.mcp)) return;
  saveRuntime();
  void reloadMcpRuntime().catch(error => console.error("重载 MCP 失败：", error));
});

process.once("exit", () => removeRuntime(runtime?.file));
