#!/usr/bin/env node
import { readFile, stat } from "node:fs/promises";
import { parseArgs } from "node:util";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { z } from "zod";

async function main() {
  const { values } = parseArgs({ options: {
    url: { type: "string" },
    "token-env": { type: "string", default: "TOONFLOW_MCP_TOKEN" },
    runtime: { type: "string" },
    help: { type: "boolean" },
  } });
  if (values.help) {
    process.stderr.write("toonflow-mcp --url <MCP URL> --token-env <环境变量名>\ntoonflow-mcp --runtime <运行信息文件>\n");
    return;
  }
  if (Boolean(values.url) === Boolean(values.runtime)) throw new Error("请指定 --url 或 --runtime，二者只能选择一个");
  let endpoint = values.url;
  let token = process.env[values["token-env"]];
  if (values.runtime) {
    const info = await stat(values.runtime);
    if (process.platform !== "win32" && ((info.mode & 0o077) !== 0 || info.uid !== process.getuid?.())) {
      throw new Error("运行信息文件必须属于当前用户，且仅允许当前用户访问（chmod 600）");
    }
    const runtime = z.object({ pid: z.number().int().positive(), url: z.url(), token: z.string().min(1) }).parse(JSON.parse(await readFile(values.runtime, "utf8")));
    process.kill(runtime.pid, 0);
    endpoint = runtime.url;
    token = runtime.token;
  }
  if (!token) throw new Error(`未找到 MCP 访问凭证，请设置 ${values["token-env"]}`);
  const url = new URL(endpoint!);
  const local = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  if (!(["http:", "https:"].includes(url.protocol)) || (url.protocol === "http:" && !local)) {
    throw new Error("远程 MCP 必须使用 HTTPS；本机连接允许 HTTP");
  }
  if (values.runtime && !local) throw new Error("运行信息文件只允许指向本机 Toonflow");
  if (url.username || url.password) throw new Error("MCP URL 不允许包含账号或密码");
  const transport = new StreamableHTTPClientTransport(url, {
    requestInit: { headers: { Authorization: `Bearer ${token}` } },
  });
  const client = new Client({ name: "toonflow-stdio", version: "0.0.0" });
  await client.connect(transport);
  if (!client.getServerCapabilities()?.tools) {
    await client.close();
    throw new Error("目标服务未提供 MCP 工具");
  }
  const bridge = serveStdio(() => {
    const resources = client.getServerCapabilities()?.resources;
    const server = new McpServer({ name: "toonflow", version: "0.0.0" }, {
      capabilities: { tools: { listChanged: false }, ...(resources ? { resources: { subscribe: false, listChanged: false } } : {}) },
      instructions: client.getInstructions(),
    });
    server.server.setRequestHandler("tools/list", (request, context) => client.listTools(request.params, { signal: context.mcpReq.signal, cacheMode: "refresh" }));
    server.server.setRequestHandler("tools/call", (request, context) => client.callTool(request.params, { signal: context.mcpReq.signal, timeout: 30 * 60_000 }));
    if (resources) {
      server.server.setRequestHandler("resources/list", (request, context) => client.listResources(request.params, { signal: context.mcpReq.signal, cacheMode: "refresh" }));
      server.server.setRequestHandler("resources/read", (request, context) => client.readResource(request.params, { signal: context.mcpReq.signal, cacheMode: "refresh" }));
      server.server.setRequestHandler("resources/templates/list", (request, context) => client.listResourceTemplates(request.params, { signal: context.mcpReq.signal, cacheMode: "refresh" }));
    }
    return server;
  }, { onerror: error => console.error(error.message) });
  const close = async () => {
    await bridge.close();
    await transport.terminateSession().catch(error => console.error(error instanceof Error ? error.message : String(error)));
    await client.close();
  };
  process.stdin.once("end", () => void close());
  process.once("SIGINT", () => void close());
  process.once("SIGTERM", () => void close());
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
