import { timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { z } from "zod";
import conf from "@/utils/conf";

export const controlStateSchema = z.object({
  directory: z.string().max(4096).nullable(),
  canvasId: z.string().max(256).nullable(),
  panel: z.string().max(32),
  projectList: z.array(z.object({ directory: z.string().max(4096), name: z.string().max(256), lastOpenedAt: z.number() })).max(1000),
  tools: z.array(z.object({
    nodeId: z.string().max(256), name: z.templateLiteral(["node:", z.string()]), nodeLabel: z.string().max(200).optional(),
    description: z.string().max(4000), parameters: z.record(z.string(), z.json()),
  })).max(10000),
}).passthrough();

type ControlState = z.infer<typeof controlStateSchema>;
type ControlResult = { result?: unknown; error?: string };
type Connection = { id: string; state: ControlState; revision: number; response: Response; pending?: { id: string; finish(result: ControlResult): void } };
// ACT: 控制连接只属于当前单进程，重连重新注册，不持久化运行中的命令。
const connections = new Map<string, Connection>();

export function getMcpSettings() {
  const value = conf.get("settings", {}).mcp as { enabled?: unknown; token?: unknown; port?: unknown } | undefined;
  return {
    enabled: value?.enabled === true,
    token: typeof value?.token === "string" ? value.token : "",
    port: typeof value?.port === "number" && Number.isInteger(value.port) && value.port >= 1 && value.port <= 65535 ? value.port : 10588,
  };
}

function allowedHost(req: Request) {
  const local = process.env.toonflowDesktop === "1" || (process.env.NODE_ENV === "dev" && ["win32", "darwin"].includes(process.platform));
  return !local || ["localhost", "127.0.0.1", "[::1]"].includes(req.hostname);
}

export function getAppOrigin(req: Request) {
  const source = req.get("origin") ?? req.get("referer");
  if (!source || !allowedHost(req)) throw Object.assign(new Error("只允许 Toonflow 页面访问控制连接"), { status: 403 });
  let url: URL;
  try { url = new URL(source); }
  catch { throw Object.assign(new Error("页面来源无效"), { status: 403 }); }
  if (!["http:", "https:"].includes(url.protocol) || url.host !== req.get("host")) throw Object.assign(new Error("页面来源与服务地址不一致"), { status: 403 });
  return url.origin;
}

export function authorizeMcp(req: Request) {
  const { enabled, token } = getMcpSettings();
  if (!enabled || token.length < 32 || !allowedHost(req)) return false;
  const actual = Buffer.from(req.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${token}`);
  if (req.get("origin")) {
    try { getAppOrigin(req); } catch { return false; }
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function assertAppRequest(req: Request) {
  getAppOrigin(req);
  if (req.get("x-toonflow-workspace") !== "1") throw Object.assign(new Error("只允许 Toonflow 页面访问控制连接"), { status: 403 });
}

export function assertControlRequest(req: Request) {
  assertAppRequest(req);
  if (!authorizeMcp(req)) throw Object.assign(new Error("MCP 未开启或访问凭证无效"), { status: 403 });
}

export function listConnections() {
  return [...connections.values()].map(({ id, state }) => ({ id, state }));
}

export function getConnection(id?: string, directory?: string) {
  if (id) {
    const connection = connections.get(id);
    if (!connection) throw new Error("Toonflow 页面已断开，请重新调用 getAppState");
    return connection;
  }
  const matches = [...connections.values()].filter(item => !directory || item.state.directory === directory);
  if (matches.length > 1) throw new Error("存在多个 Toonflow 页面，请用 target.connectionId 指定操作目标");
  return matches[0];
}

export function connectControl(id: string, response: Response) {
  if (connections.has(id)) throw Object.assign(new Error("控制连接已存在"), { status: 409 });
  const connection: Connection = { id, response, revision: 0, state: { directory: null, canvasId: null, panel: "home", projectList: [], tools: [] } };
  response.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" });
  response.flushHeaders();
  connections.set(id, connection);
  response.write(`data: ${JSON.stringify({ type: "ready" })}\n\n`);
  const heartbeat = setInterval(() => response.write(": keepalive\n\n"), 20000);
  const socket = response.socket;
  const close = () => {
    clearInterval(heartbeat);
    response.off("close", close);
    socket?.off("close", close);
    if (connections.get(id) === connection) connections.delete(id);
    connection.pending?.finish({ error: "Toonflow 页面已断开，操作已取消" });
  };
  response.once("close", close);
  socket?.once("close", close);
}

export function updateControlState(id: string, revision: number, state: ControlState) {
  const connection = getConnection(id)!;
  if (revision <= connection.revision) return;
  connection.revision = revision;
  connection.state = state;
}

export function finishControlCall(connectionId: string, callId: string, result: ControlResult) {
  const connection = getConnection(connectionId)!;
  if (connection.pending?.id !== callId) throw Object.assign(new Error("控制命令已取消或不存在"), { status: 404 });
  connection.pending.finish(result);
}

export function callControl(connectionId: string, name: string, args: Record<string, unknown>, signal: AbortSignal, directory?: string) {
  signal.throwIfAborted();
  const connection = getConnection(connectionId)!;
  if (connection.pending) throw new Error("此页面正在执行另一条控制命令，请等待完成");
  if (directory && connection.state.directory !== directory) throw new Error("工作区已切换，请重新调用 getAppState");
  const callId = crypto.randomUUID();
  return new Promise<unknown>((resolve, reject) => {
    const finish = ({ result, error }: ControlResult) => {
      if (connection.pending?.id !== callId) return;
      delete connection.pending;
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      if (error !== undefined) reject(new Error(error));
      else resolve(result);
    };
    const abort = () => {
      if (!connection.response.destroyed) connection.response.write(`data: ${JSON.stringify({ type: "cancel", callId })}\n\n`);
      finish({ error: "控制命令已取消或超时" });
    };
    const timer = setTimeout(abort, 120000);
    connection.pending = { id: callId, finish };
    signal.addEventListener("abort", abort, { once: true });
    connection.response.write(`data: ${JSON.stringify({ type: "call", callId, name, args, directory })}\n\n`);
  });
}

for (const key of ["settings.mcp.enabled", "settings.mcp.token"] as const) conf.onDidChange(key, () => {
  for (const connection of connections.values()) {
    connection.pending?.finish({ error: "MCP 设置已修改，控制命令已取消" });
    connection.response.end();
  }
  connections.clear();
});
