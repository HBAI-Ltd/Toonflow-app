import { randomUUID } from "node:crypto";
import { CallToolResultSchema } from "@modelcontextprotocol/core";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { fromJsonSchema, isInitializeRequest, McpServer, ProtocolError, ProtocolErrorCode } from "@modelcontextprotocol/server";
import type { CallToolResult, ReadResourceResult, Resource } from "@modelcontextprotocol/server";
import { Router } from "express";
import type { Request } from "express";

export type { ReadResourceResult, Resource } from "@modelcontextprotocol/server";

export type McpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute(args: Record<string, unknown>, signal: AbortSignal): Promise<unknown>;
};

export type McpOptions = {
  getTools(): Promise<McpTool[]>;
  authorize(request: Request): boolean | Promise<boolean>;
  resources?: {
    list(signal: AbortSignal): Promise<Resource[]>;
    read(uri: string, signal: AbortSignal): Promise<ReadResourceResult>;
  };
};

function toToolResult(value: unknown): CallToolResult {
  const data = JSON.parse(JSON.stringify(value ?? null));
  if (data && Array.isArray(data.content)) {
    const result = CallToolResultSchema.parse(data);
    return {
      content: result.content,
      structuredContent: result.structuredContent ?? (data.details === undefined ? undefined : { details: data.details }),
      isError: result.isError,
    };
  }
  return {
    content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data) }],
    structuredContent: data && typeof data === "object" && !Array.isArray(data) ? data : { result: data },
  };
}

export function createMcpRouter(options: McpOptions) {
  const createServer = () => {
    const resources = options.resources;
    const server = new McpServer({ name: "toonflow", version: "0.0.0" }, {
      capabilities: { tools: { listChanged: false }, ...(resources ? { resources: { subscribe: false, listChanged: false } } : {}) },
      instructions: "先调用 getAppState 获取连接和工作区；从 tools/list 读取当前工具参数。业务工具使用 {target: {connectionId, directory}, args: {...}}。画布与节点必须使用实时工具，禁止直接修改画布 JSON。"
        + (resources ? "通过 resources/list 发现全局技能和附属资料，再以返回的 URI 调用 resources/read 读取最新内容。" : ""),
    });
    if (resources) {
      server.server.setRequestHandler("resources/list", async (_request, context) => ({ resources: await resources.list(context.mcpReq.signal) }));
      server.server.setRequestHandler("resources/read", async (request, context) => {
        try { return await resources.read(request.params.uri, context.mcpReq.signal); }
        catch (error) {
          const failure = error as { status?: number; code?: string } | null;
          const message = error instanceof Error ? error.message : String(error);
          if (failure?.status === 404 || failure?.code === "ENOENT") throw new ProtocolError(ProtocolErrorCode.ResourceNotFound, message);
          if (failure?.status === 400 || error instanceof URIError) throw new ProtocolError(ProtocolErrorCode.InvalidParams, message);
          throw error;
        }
      });
      server.server.setRequestHandler("resources/templates/list", async () => ({ resourceTemplates: [] }));
    }
    server.server.setRequestHandler("tools/list", async () => ({
      tools: (await options.getTools()).map(tool => ({ name: tool.name, description: tool.description, inputSchema: { ...tool.inputSchema, type: "object" as const } })),
    }));
    server.server.setRequestHandler("tools/call", async (request, context) => {
      const tool = (await options.getTools()).find(item => item.name === request.params.name);
      if (!tool) throw new ProtocolError(ProtocolErrorCode.InvalidParams, `工具不存在或已停用：${request.params.name}`);
      try {
        const parsed = await fromJsonSchema<Record<string, unknown>>(tool.inputSchema)["~standard"].validate(request.params.arguments ?? {});
        if (parsed.issues) throw new Error(parsed.issues.map(issue => issue.message).join("；"));
        return toToolResult(await tool.execute(parsed.value, context.mcpReq.signal));
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }] };
      }
    });
    return server;
  };
  // ACT: 使用支持取消通知的 Streamable HTTP 会话；单进程宿主不持久化 MCP 会话。
  const sessions = new Map<string, NodeStreamableHTTPServerTransport>();
  const router = Router();
  router.use(async (request, response) => {
    try {
      if (!await options.authorize(request)) {
        response.setHeader("WWW-Authenticate", 'Bearer realm="Toonflow"');
        response.status(401).json({ jsonrpc: "2.0", id: null, error: { code: -32001, message: "MCP 未开启或访问凭证无效" } });
        return;
      }
      const sessionId = request.get("mcp-session-id");
      let transport = sessionId ? sessions.get(sessionId) : undefined;
      if (!sessionId && isInitializeRequest(request.body)) {
        transport = new NodeStreamableHTTPServerTransport({
          sessionIdGenerator: randomUUID,
          onsessioninitialized: id => { sessions.set(id, transport!); },
        });
        transport.onclose = () => {
          if (transport?.sessionId) sessions.delete(transport.sessionId);
        };
        await createServer().connect(transport);
      }
      if (!transport) {
        response.status(sessionId ? 404 : 400).json({ jsonrpc: "2.0", id: null, error: { code: -32000, message: "MCP 会话不存在，请重新连接" } });
        return;
      }
      await transport.handleRequest(request, response, request.body);
    } catch (error) {
      if (response.headersSent) {
        response.end();
        return;
      }
      response.status(500).json({ jsonrpc: "2.0", id: null, error: { code: -32603, message: error instanceof Error ? error.message : String(error) } });
    }
  });
  return Object.assign(router, { close: async () => {
    await Promise.all([...sessions.values()].map(transport => transport.close()));
  } });
}
