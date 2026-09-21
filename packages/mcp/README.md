# @toonflow/mcp

Toonflow 的独立 MCP 适配包。宿主提供独立的本机 HTTP 监听端口，同时保留现有 Server 的 `/mcp` 路径；stdio 入口只连接正在运行的 Toonflow，不创建第二个应用进程。使用官方 MCP TypeScript SDK v2 的 Streamable HTTP 会话传输，兼容 2025 年版客户端协议并支持取消工具调用。

已验证 `2025-03-26`、`2025-06-18`、`2025-11-25` 初始化、SDK v2 自动协商回退、HTTP/stdio 工具调用与取消。未启用 2026 年版无会话 HTTP 协议。

## 开启

1. 启动 Toonflow，进入 **设置 → MCP**。
2. 打开 MCP 开关，复制连接地址和客户端配置。
3. 在外部 Coding 工具中添加 MCP 服务，重新连接后调用 `getAppState`。

开关默认关闭。访问凭证由设置管理；关闭或更换凭证会取消进行中的控制调用。画布、节点、当前文档和切换项目等界面操作需要打开的 Toonflow 窗口或网页。服务端文件、技能和媒体能力可以在没有前端连接时使用指定的工作区目录；Linux 部署的目录必须位于 `data/workspaces` 内。

本机 MCP 默认地址为 `http://127.0.0.1:10588/mcp`，仅监听本机回环地址。可在 **设置 → MCP** 手动修改首选端口，保存后自动切换 MCP 服务，无需重启 Toonflow。MCP 端口独立于桌面页面的随机端口，切换只影响 MCP 监听服务。

首选端口已被占用时，实例会向后顺延尝试端口；达到重试上限仍无法监听时报告失败。切换端口时先监听新地址，成功后再关闭旧地址；切换失败时保留原地址，并在设置中显示错误。多开时每个实例使用自己的实际地址，例如 `10588`、`3002`，请从目标实例的设置中复制配置。实际顺延端口不会覆盖保存的首选端口，已有实例也不会因较低端口空闲而自动迁移。共用同一 `data` 目录的实例共用首选端口、MCP 开关和访问凭证；保存新的首选端口后，各实例会自动应用并分别顺延。这些配置不是各窗口独立设置。

实际地址改变后，请从目标实例重新复制外部客户端的 HTTP 或 stdio 配置并重新连接。

## Streamable HTTP

将设置中给出的 MCP 地址填入支持 HTTP 的客户端，同时设置请求头：

```text
Authorization: Bearer <设置中的访问凭证>
```

不同客户端配置字段可能不同；以下为常见结构：

```json
{
  "mcpServers": {
    "toonflow": {
      "url": "http://127.0.0.1:<实际端口>/mcp",
      "headers": { "Authorization": "Bearer <访问凭证>" }
    }
  }
}
```

从本机访问设置时显示独立 MCP 监听地址；从远程访问设置时保留页面公网地址下的 `/mcp`。Linux 远程部署请通过 HTTPS 反向代理转发宿主 Server 的 `/mcp`，保留 Authorization 请求头，不将访问凭证写入 URL；本机回环监听地址不能直接用于远程连接。

MCP 凭证只保护 MCP 入口。现有 Web 页面及其接口本身就是管理端，不属于全站认证方案；Linux 远程部署应由反向代理身份认证或私有网络等部署侧措施保护整个站点。

## stdio

优先点击目标实例设置中的 **复制 stdio 配置**，其中已填写当前宿主的运行时、入口产物和运行信息文件的绝对路径。以下仅为配置结构示意：

```json
{
  "mcpServers": {
    "toonflow": {
      "command": "node",
      "args": ["<build/mcp/stdio.js 绝对路径>", "--runtime", "<运行信息文件绝对路径>"]
    }
  }
}
```

运行信息按实际 MCP 端口保存，例如 `data/mcpRuntime10588.json`、`data/mcpRuntime3002.json`，仅在 MCP 开启时生成。格式为 `{ "pid": 进程ID, "url": "http://127.0.0.1:端口/mcp", "token": "访问凭证" }`，由宿主维护；关闭或退出时只删除仍属于当前进程的文件。只允许连接本机地址；macOS/Linux 上文件必须属于当前用户且权限为 `0600`。

stdio 配置绑定所选数据目录内的实际端口，不会自动跟随某个窗口。修改首选端口或重启后，如果实际端口改变，需要从目标实例重新复制配置；重启后若仍取得原端口，重新连接 MCP 即可。多开顺序变化后，同一端口可能属于另一实例，连接前应核对目标实例的实际地址，并通过 `getAppState` 确认页面与工作区。各实例的 MCP 会话分别维护。

旧版共用的 `data/mcpRuntime.json` 不再作为运行信息别名维护；升级后请重新复制 stdio 配置。

也可以显式传入 URL，并从环境变量读取访问凭证：

```json
{
  "mcpServers": {
    "toonflow": {
      "command": "node",
      "args": ["<build/mcp/stdio.js 绝对路径>", "--url", "https://<服务域名>/mcp", "--token-env", "TOONFLOW_MCP_TOKEN"],
      "env": { "TOONFLOW_MCP_TOKEN": "<访问凭证>" }
    }
  }
}
```

Node.js 需要 20 或更新版本，也支持 Bun。源码开发可使用 `bun packages/mcp/src/stdio.ts`。stdio 的 stdout 只传输 MCP 消息，错误写入 stderr；桥接工具列表与调用，以及资源列表、读取和模板列表，保留取消信号。每次工具调用最长等待 30 分钟，异步生成节点按节点契约返回启动结果。

## Skill

`skills/toonflow/SKILL.md` 面向外部 Agent，随包打包到 `build/mcp/skills/toonflow/SKILL.md`，也可以从设置中导出。将整个 `toonflow` 目录放进外部工具支持的 Skill 目录。

Skill 介绍实时画布、节点参数、媒体引用与生成结果的操作顺序。连接 MCP 不会自动安装 Skill；不安装 Skill 也能根据工具说明调用。

## 全局技能资源

全局 `data/skills` 中已安装技能的主文和附属文件通过标准 MCP resources 提供给外部 Agent：

1. 调用 `resources/list` 发现文件及其 URI。
2. 将返回的 URI 传入 `resources/read`，读取所需技能或附属资料。

URI 结构为 `toonflow://skills/<技能名称编码>/<技能内文件路径分段编码>`。技能名称整体使用 `encodeURIComponent`，文件路径中的每段独立编码并保留 `/` 层级；使用列表返回的 URI 即可，无需猜测磁盘路径。

资源接口和工具共用 MCP 开关及 Bearer 凭证。每次请求读取最新目录或文件，stdio 桥接也会刷新上游资源，不缓存技能内容；不提供资源订阅或变更推送，模板列表为空。资源读取不会执行技能中的脚本，也不会自动安装 Skill 到外部客户端。

## 工具约定

`getAppState` 使用 `{}`，先发现连接及工作区。其余业务工具使用以下结构，实际可用字段以 `tools/list` 返回的 JSON Schema 为准：

```json
{
  "target": { "connectionId": "连接 ID", "directory": "工作区绝对路径", "canvasId": "当前画布 ID" },
  "args": { "工具原有参数": "值" }
}
```

`target` 及其字段可选，操作画布时建议明确传入 `connectionId`、`directory` 和 `canvasId`，避免用户手动切换画布后旧命令作用于新画布。切换项目或画布成功后重新读取状态，更新目标 ID。

画布工具与内置 Agent 共用已有实现。节点能力通过 `getCanvas` 或 `addNode` 的结果发现，再通过 `nodeTools` 调用。插件禁用、目标不匹配、连接断开时返回明确错误。

| 能力 | 调用方式 |
| --- | --- |
| 应用管理 | `listAppOperations` 使用 `{ "args": {} }` 查询当前 31 项管理操作，或 `{ "args": { "name": "操作名" } }` 查询单项描述和 schema；随后 `appOperation` 使用 `{ "args": { "name": "操作名", "parameters": {} } }` 执行。覆盖插件、技能、媒体供应商、素材库和 Agent 历史；以实际返回的操作列表和 schema 为准。 |
| 会话管理 | 通过 `appOperation` 调用对应操作，工作目录由 `target.directory` 或指定页面的工作区注入，不在 `parameters` 中另填目录。 |
| 委托内置 Agent | 按用户请求调用 `runAgent`，`args` 提供 `providerId`、`modelId`、`prompt`，可选 `sessionFile` 继续已有对话；等待本轮完成后返回回复及对话文件。调用会使用配置的模型。 |
| 文件和媒体传输 | `workspaceFiles` 的 `action` 支持 `list`、`mkdir`、`rename`、`remove`、`readBinary`、`writeBinary`。二进制通过 Base64 传输，解码后不超过 20 MiB；写入默认 `exclusive: true`，不覆盖已有文件。文本读写复用已启用的文件工具。 |
| 文档编辑 | 先 `getDocument` 取得 `text`，再 `writeDocument` 传入新 `text` 和原文 `expectedText`；原文不匹配时拒绝写入。已打开的画布和文档拒绝通过原始文件操作修改，应使用对应界面工具。 |

管理结果中的供应商密钥等敏感字段显示为 `[REDACTED]`。不要将读到的脱敏对象整体回写；按操作 schema 提交需要修改的字段，必须提供密钥时填写真实值。

## 宿主接入

```ts
import { createMcpRouter } from "@toonflow/mcp";

const mcp = createMcpRouter({
  getTools: async () => tools,
  authorize: request => verifyMcpAccess(request),
  resources: {
    list: signal => listGlobalSkillFiles(signal),
    read: (uri, signal) => readGlobalSkillFile(uri, signal),
  },
});
app.use("/mcp", mcp);
```

每项工具包含 `name`、`description`、`inputSchema`（JSON Schema）与 `execute(args, signal)`。SDK 校验工具输入，普通结果转换为文本与结构化结果，已有工具的 content 保留为 MCP 内容块；执行异常返回 `isError: true`。`mcp.close()` 释放协议资源，业务任务的取消由宿主同时处理。

`resources` 可选，提供时声明 MCP 资源能力。`list(signal)` 返回 `Promise<Resource[]>`，`read(uri, signal)` 返回 `Promise<ReadResourceResult>`；这两个官方 SDK 类型可从 `@toonflow/mcp` 导入。目录扫描、URI 校验、文件读取和权限检查由宿主实现，包负责协议转发与取消信号传递。

宿主负责 MCP 开关、Bearer 凭证、Host/Origin 校验和工作区权限。包不依赖 `apps/server/src` 或前端组件，也不自行创建 HTTP 监听端口。

```sh
bun run --filter @toonflow/mcp typecheck
bun run --filter @toonflow/mcp build
```

产物位于 `build/mcp/`，包括 HTTP 模块、stdio 入口、README 和 Skill。stdio 所需 SDK 已打包，可直接使用 Node.js/Bun 运行；独立导入 HTTP 模块时宿主需提供 Express 5。
