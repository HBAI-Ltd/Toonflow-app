import { createHash, randomUUID } from "node:crypto";
import { isAbsolute } from "node:path";
import { DEFAULT_MAX_BYTES, formatSize, type ToolDefinition } from "@earendil-works/pi-coding-agent";
import { connectMcpServer, getMcpError, mcpServerSchema } from "@toonflow/mcp/client";
import type { McpServerConfig, SavedMcpServer } from "@toonflow/mcp/client";
import conf from "@/utils/conf";
import { getRuntimePlatform } from "@/lib/platform";
import { removeMcpBundle } from "@/utils/mcp/dxt";
import { t, translateMessage } from "@/lib/i18n";

export { mcpServerSchema };

type Connection = Awaited<ReturnType<typeof connectMcpServer>>;
type ServerState = { status: "connected" | "error"; toolCount?: number; loadError?: string };
const connections = new Map<string, { revision: string; pending: Promise<Connection> }>();
const serverStates = new Map<string, ServerState>();

export function listMcpServers() {
  return conf.get("mcpServers", []).map(server => {
    const state = server.enabled ? serverStates.get(server.id) : undefined;
    return {
      ...server, status: server.enabled ? "idle" : "disabled", ...state,
      ...(state?.loadError ? { loadError: translateMessage(state.loadError) } : {}),
    };
  });
}

function validateServer(input: McpServerConfig) {
  const server = mcpServerSchema.parse(input);
  if (server.transport === "stdio") {
    if (getRuntimePlatform().mobile) throw Object.assign(new Error("当前移动端不支持启动本地 MCP，请添加远程 MCP"), { status: 400 });
    if (server.cwd && !isAbsolute(server.cwd)) throw Object.assign(new Error("MCP 工作目录必须是绝对路径"), { status: 400 });
  }
  return server;
}

async function closeServer(id: string) {
  const entry = connections.get(id);
  connections.delete(id);
  serverStates.delete(id);
  if (entry) await (await entry.pending.catch(() => undefined))?.close().catch(() => {});
}

export async function closeMcpServers() {
  await Promise.all([...connections.keys()].map(closeServer));
}

export async function saveMcpServer(input: McpServerConfig) {
  const parsed = validateServer(input);
  const servers = conf.get("mcpServers", []);
  const index = parsed.id ? servers.findIndex(server => server.id === parsed.id) : -1;
  if (parsed.id && index < 0) throw Object.assign(new Error("MCP 配置不存在，请刷新后重试"), { status: 404 });
  if (index < 0 && servers.length >= 128) throw Object.assign(new Error("最多添加 128 个 MCP 服务"), { status: 400 });
  const server: SavedMcpServer = { ...parsed, id: parsed.id ?? randomUUID() };
  if (index < 0) servers.push(server);
  else servers[index] = server;
  conf.set("mcpServers", servers);
  await closeServer(server.id);
  return server;
}

export function saveImportedMcpServers(inputs: McpServerConfig[], bundleId?: string) {
  const imported = inputs.map(input => ({ ...validateServer({ ...input, id: undefined }), id: randomUUID() }));
  const servers = conf.get("mcpServers", []);
  if (!imported.length || imported.length + servers.length > 128) {
    throw Object.assign(new Error("请导入至少一个 MCP 服务，服务总数不能超过 128 个"), { status: 400 });
  }
  // ACT: 整批校验后一次存盘，任一配置无效时不留下部分导入结果。
  conf.set({
    mcpServers: [...servers, ...imported],
    ...(bundleId ? { mcpBundles: { ...conf.get("mcpBundles", {}), [imported[0]!.id]: bundleId } } : {}),
  });
  return imported;
}

export function importMcpServers(source: string) {
  const invalid = (message: string): never => { throw Object.assign(new Error(message), { status: 400 }); };
  const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
  let parsed: unknown;
  try { parsed = JSON.parse(source); }
  catch { return invalid("请输入有效的 MCP JSON 配置"); }
  let entries: [string | undefined, unknown][];
  if (isRecord(parsed) && Object.hasOwn(parsed, "mcpServers")) {
    if (!isRecord(parsed.mcpServers)) return invalid("mcpServers 必须是以服务名称为键的 JSON 对象");
    entries = Object.entries(parsed.mcpServers);
  } else if (Array.isArray(parsed)) {
    entries = parsed.map(value => [undefined, value]);
  } else if (isRecord(parsed)) {
    entries = [[undefined, parsed]];
  } else return invalid("请提供 mcpServers 对象或带名称的 MCP 配置");
  if (!entries.length || entries.length > 128) return invalid("一次可导入 1 至 128 个 MCP 服务");
  const fields = new Set(["id", "name", "type", "transport", "enabled", "disabled", "command", "args", "env", "cwd", "url", "headers"]);
  const servers = entries.map(([key, value], index) => {
    const label = t`第 ${index + 1} 个 MCP 配置`;
    if (!isRecord(value)) return invalid(t`${label}必须是 JSON 对象`);
    if (Object.keys(value).some(field => !fields.has(field))) return invalid(t`${label}包含不支持的字段，请保留名称、连接方式和连接参数`);
    const normalizeTransport = (transport: unknown) => transport === "streamable-http" ? "http" : transport;
    if (value.type !== undefined && value.transport !== undefined && normalizeTransport(value.type) !== normalizeTransport(value.transport)) {
      return invalid(t`${label}的 type 与 transport 不一致`);
    }
    if (value.disabled !== undefined && typeof value.disabled !== "boolean") return invalid(t`${label}的 disabled 必须是布尔值`);
    if (value.enabled !== undefined && value.disabled !== undefined && value.enabled === value.disabled) return invalid(t`${label}的 enabled 与 disabled 冲突`);
    const { id: _id, type: _type, disabled, ...config } = value;
    const result = mcpServerSchema.safeParse({
      ...config,
      name: key ?? value.name,
      transport: normalizeTransport(value.transport !== undefined ? value.transport : value.type !== undefined ? value.type : value.url !== undefined ? "http" : "stdio"),
      enabled: value.enabled !== undefined ? value.enabled : disabled === undefined ? true : !disabled,
    });
    if (!result.success) {
      const field = result.error.issues[0]?.path.join(".") || translateMessage("配置");
      return invalid(t`${label}的 ${field} 格式无效，请检查必填项和字段类型`);
    }
    return result.data;
  });
  return saveImportedMcpServers(servers);
}

export async function setMcpServerEnabled(id: string, enabled: boolean) {
  const server = conf.get("mcpServers", []).find(item => item.id === id);
  if (!server) throw Object.assign(new Error("MCP 配置不存在，请刷新后重试"), { status: 404 });
  return saveMcpServer({ ...server, enabled });
}

export async function removeMcpServer(id: string) {
  const servers = conf.get("mcpServers", []);
  if (!servers.some(server => server.id === id)) throw Object.assign(new Error("MCP 配置不存在，请刷新后重试"), { status: 404 });
  // ACT: 包文件删除失败时保留已停用的配置，用户可重试，Agent 不会重新启动正在删除的服务。
  conf.set("mcpServers", servers.map(server => server.id === id ? { ...server, enabled: false } : server));
  await closeServer(id);
  await removeMcpBundle(id);
  conf.set("mcpServers", conf.get("mcpServers", []).filter(server => server.id !== id));
}

async function readTools(connection: Connection) {
  if (!connection.client.getServerCapabilities()?.tools) return [];
  return (await connection.client.listTools(undefined, { timeout: 15_000, signal: AbortSignal.timeout(15_000), cacheMode: "refresh" })).tools;
}

export async function testMcpServer(input: McpServerConfig) {
  const server = validateServer(input);
  let connection: Connection | undefined;
  try {
    connection = await connectMcpServer(server);
    const tools = await readTools(connection);
    return {
      serverName: connection.client.getServerVersion()?.name,
      tools: tools.map(tool => ({ name: tool.name, description: tool.description ?? "" })),
    };
  } catch (error) {
    throw Object.assign(new Error(getMcpError(error, server)), { status: 400 });
  } finally {
    await connection?.close();
  }
}

async function getConnection(server: SavedMcpServer) {
  const revision = JSON.stringify(server);
  const current = conf.get("mcpServers", []).find(item => item.id === server.id);
  if (!current?.enabled || JSON.stringify(current) !== revision) throw new Error("MCP 配置已修改，请重新连接");
  const existing = connections.get(server.id);
  if (existing?.revision === revision) return existing.pending;
  const entry = {
    revision,
    pending: Promise.resolve().then(async () => {
      if (existing) await (await existing.pending.catch(() => undefined))?.close().catch(() => {});
      if (connections.get(server.id) !== entry) throw new Error("MCP 配置已修改，请重新连接");
      return connectMcpServer(server);
    }).then(async connection => {
      if (connections.get(server.id) !== entry) {
        await connection.close();
        throw new Error("MCP 配置已修改，请重新连接");
      }
      connection.client.onclose = () => {
        if (connections.get(server.id) !== entry) return;
        connections.delete(server.id);
        serverStates.set(server.id, { status: "error", loadError: "MCP 连接已断开，下次使用时重新连接" });
      };
      return connection;
    }).catch(error => {
      if (connections.get(server.id) === entry) connections.delete(server.id);
      throw error;
    }),
  };
  connections.set(server.id, entry);
  return entry.pending;
}

function toolName(id: string, name: string) {
  return `mcp_${name.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32)}_${createHash("sha256").update(`${id}\0${name}`).digest("hex").slice(0, 16)}`;
}

type ResultContent = { type: "text"; text: string } | { type: "image"; data: string; mimeType: string };

// ACT: MCP 结果大小不受控，文本总量沿用 read 的 50KB 上限并保留头部；截断处不保证 JSON 结构完整，需要更多内容时由模型缩小查询或分页。
function limitResultText(parts: ResultContent[]) {
  let remaining = DEFAULT_MAX_BYTES;
  let omitted = 0;
  const content = parts.flatMap((part): ResultContent[] => {
    if (part.type !== "text") return [part];
    const size = Buffer.byteLength(part.text);
    if (size <= remaining) {
      remaining -= size;
      return [part];
    }
    // 截断点可能落在多字节字符中间，去掉残缺字符。
    const text = Buffer.from(part.text).subarray(0, remaining).toString().replace(/�+$/, "");
    omitted += size - remaining;
    remaining = 0;
    return text ? [{ type: "text", text }] : [];
  });
  if (omitted) content.push({ type: "text", text: `[MCP 结果超过 ${formatSize(DEFAULT_MAX_BYTES)}，已截断 ${formatSize(omitted)}；请缩小查询范围或分页获取]` });
  return content;
}

export async function createMcpAgentTools(): Promise<ToolDefinition[]> {
  const servers = conf.get("mcpServers", []).filter(server => server.enabled);
  const groups = await Promise.all(servers.map(async server => {
    try {
      validateServer(server);
      const connection = await getConnection(server);
      const definitions = await readTools(connection);
      serverStates.set(server.id, { status: "connected", toolCount: definitions.length });
      return definitions.map((definition): ToolDefinition => ({
        name: toolName(server.id, definition.name),
        label: `${server.name} · ${definition.title ?? definition.name}`,
        description: `[MCP: ${server.name}] ${definition.description ?? definition.name}`,
        parameters: definition.inputSchema,
        async execute(_id, args, signal) {
          signal?.throwIfAborted();
          const current = conf.get("mcpServers", []).find(item => item.id === server.id);
          if (!current?.enabled) throw new Error(`MCP ${server.name} 已停用或删除`);
          if (JSON.stringify(current) !== JSON.stringify(server)) throw new Error(`MCP ${server.name} 配置已修改，请重新发送消息以加载工具`);
          const active = await getConnection(current);
          const result = await active.client.callTool({ name: definition.name, arguments: args as Record<string, unknown> }, { signal, timeout: 30 * 60_000 });
          const content = limitResultText(result.content.map(part => {
            if (part.type === "text") return { type: "text" as const, text: part.text };
            if (part.type === "image") return { type: "image" as const, data: part.data, mimeType: part.mimeType };
            return { type: "text" as const, text: JSON.stringify(part) };
          }));
          // ACT: Pi 只把抛出的错误记为工具失败；MCP isError 不能作为普通成功结果返回。
          if (result.isError) throw new Error(content.filter(part => part.type === "text").map(part => part.text).join("\n") || `MCP ${server.name} 工具执行失败`);
          if (!content.length && result.structuredContent !== undefined) content.push(...limitResultText([{ type: "text", text: JSON.stringify(result.structuredContent) }]));
          return { content, details: { serverId: server.id, toolName: definition.name, structuredContent: result.structuredContent } };
        },
      }));
    } catch (error) {
      const loadError = getMcpError(error, server);
      serverStates.set(server.id, { status: "error", loadError });
      // ACT: 单个外部服务离线时保留其他工具，并向 Agent 明确提供故障原因。
      return [{
        name: toolName(server.id, "connectionError"), label: `${server.name} · 连接失败`,
        description: `MCP ${server.name} 当前无法连接：${loadError}。请告知用户在设置的插件市场中检查此 MCP。`,
        parameters: { type: "object", properties: {}, additionalProperties: false },
        async execute() { throw new Error(`MCP ${server.name}：${loadError}`); },
      } satisfies ToolDefinition];
    }
  }));
  return groups.flat();
}
