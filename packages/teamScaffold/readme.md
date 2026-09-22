# Team Scaffold

`@toonflow/teams-scaffold` 负责团队清单校验、目录打包及标准 A2A 接入。模型、会话、工作区权限和成员执行由宿主提供，团队包不启动服务，也不包含模型密钥。

## 开发团队

团队放在 `packages/teams/<teamName>`，可参考 `storyboardTeam`：

```text
package.json
build.ts
team.json
readme.md
members/director.md
members/writer.md
skills/storyboard/SKILL.md
knowledge/continuity.md
tools/example.tool.js
```

`tools` 可省略；其中只接受通过现有 toolScaffold 构建的单文件工具，不再打包一套 SDK 或模型运行时。

```ts
import { createTeamConfig } from "@toonflow/teams-scaffold";

await createTeamConfig(import.meta.url, {
  sync: process.argv.includes("--sync") ? "replace" : "missing",
});
```

`createTeamConfig` 从 `build.ts` 同目录读取 `team.json` 与 `package.json`，发布版本以 `package.json.version` 为准，输出项目根目录 `build/agents/<name>/` 和 `build/agents/<name>.agent.zip`。构建同时检查清单、资源引用、委派环及路径，不发布 package.json、源码依赖或构建脚本。

仅 `NODE_ENV=dev` 时同步 `data/agents/<name>`。默认仅安装缺失团队，已有安装目录完整保留，避免覆盖用户修改的提示词、技能和知识。显式 `sync: "replace"` 才用本次产物完整替换，包括删除源码中不存在的旧文件；使用前应备份需要保留的修改。正式安装和升级的确认由宿主处理。

团队名、成员名、技能目录名和工具插件名使用小驼峰。入口必须是现有成员，委派关系不能成环；导演可以多次分别调用成员，但成员调用链不可递归。

成员字段：

| 字段 | 含义 |
| --- | --- |
| description | 供协调成员查看的职责摘要 |
| instructions | `members/` 内的 Markdown 相对路径 |
| delegates | 允许委派的成员名 |
| tools | 实际工具名称；省略时继承本轮宿主与团队私有工具，空数组关闭普通工具；显式名称必须在本轮可用 |
| skills | `skills/<name>/SKILL.md` 中的目录名 |
| knowledge | `knowledge/` 内的相对文件路径，或含文件的目录路径 |

根级 `tools` 是工具插件名到配置的映射，对应 `tools/<name>.tool.js`。它与成员的实际工具名称清单不同；插件可提供多个工具。运行时按需读取成员被授权的资源，不把全部正文塞进初始上下文。私有资源仅表示团队作用域，无法向本机用户隐藏文件，也不是可执行代码沙箱。

单文件、解包后的文件总量及压缩包均最多 20 MiB，目录与文件最多 2000 条目。拒绝符号链接、跨目录路径、Windows 保留文件名及大小写冲突。

## A2A

在 Toonflow 的「设置 → 插件市场 → Agent」中安装 `.agent.zip`，可以启用、禁用、导出、卸载或编辑成员说明、技能、知识与 `team.json`。团队安装在 `data/agents/<name>`；更新发现本地修改时会要求明确覆盖，开发构建也不会默认覆盖它们。团队资料工具允许成员在清单授予的范围内读写文本，不能借此修改工具代码或扩大成员授权。

主 Agent 使用现有 `subAgent` 工具调用团队，例如：

```json
{"tasks":[{"name":"分镜方案","team":"storyboardTeam","task":"根据工作区 story.md 整理文字分镜，先读取原文，不执行消耗算力的媒体生成。"}]}
```

不传 `team` 仍是临时子 Agent，无须安装团队，自动继承父 Agent 的全部工具，包括提问与继续委派，无需指定 `tools`。团队使用主 Agent 当前选定的模型和本轮工具，成员可用范围仍由团队清单决定，成员上下文独立。同批任务直接并行执行，不设并发名额或等待队列。任务数量、执行轮次、累计成员调用和总时长不设固定上限，团队委派关系仍须通过清单的无环校验。成员与工具在任务开始时加载，编辑用于后续任务；知识和 Skill 正文使用时读取。当前运行不因禁用插件而自动终止，应通过调用方取消任务。

对外服务在同一页面的「A2A 服务」中开启：选择明确授权的工作区和文本模型，保存后复制访问令牌，以及团队卡片上的 Agent Card 地址。默认关闭；远端调用不能指定其他本机目录或模型。Linux 部署只允许服务器工作区，配置入口须从本机访问。已有页面控制连接时可复用画布工具，未连接页面时只具备当前可用的文件及服务端工具。

「连接远程 Agent」保存外部服务的完整 Agent Card 地址和可选 Bearer 令牌，连接名也用于 `subAgent` 的 `team` 字段。只有任务文本发送到远端，不传模型密钥、宿主工具或自动上传工作区文件。返回 `inputRequired` 时，将补充内容与原 `taskId`、`contextId` 一起提交同一团队。远端用量不计入本机可核实的模型用量。

`@toonflow/teams-scaffold/a2a` 使用官方 `@a2a-js/sdk` 1.2.0，协议为 A2A 1.0。导出的 `AgentCard`、`Message`、`Task`、`Artifact` 均为 SDK 原始类型；使用 SDK 的 `fromJSON` / `toJSON` 转换线上 JSON，不手工拼接内部 oneof 结构。

```ts
import { createTeamAgentCard, createTeamA2aRouter } from "@toonflow/teams-scaffold/a2a";

app.use("/team", createTeamA2aRouter({
  card: createTeamAgentCard(manifest, "https://example.com/team"),
  authenticate: async request => verifyBearerAndGetStableUserId(request),
  execute: async ({ taskId, contextId, message, task, userId, signal, emit }) => {
    emit({ type: "status", text: "正在执行" });
    return runTeam({ taskId, contextId, message, task, userId, signal, emit });
  },
  onCancel: taskId => clearSavedSession(taskId),
}));
```

宿主回调返回 `{ status: "completed" | "inputRequired", text, artifacts? }`；异常记录为失败。通过 `emit` 发布状态文本或标准 Artifact 更新。需要补充信息时返回 `inputRequired`，宿主保存自己的会话状态；下一条用户消息携带原 taskId 和 contextId 再次调用 `execute`，其中 task 包含已保存的协议历史。完成或失败后不能继续原任务。

Card 位于挂载路径下 `/.well-known/agent-card.json`，公开团队能力摘要和 Bearer 认证声明，不公开私有正文。宿主验证 Bearer 并返回稳定身份；任务的读取、列表、续跑和取消均按该身份隔离。执行回调必须处理 AbortSignal 并等待所有子工作结束，取消响应才会确认 CANCELED；`onCancel` 在通过身份校验并完成取消后清理宿主状态。SSE 断开不会自动取消任务。

任务、事件和身份索引使用 SDK 内存存储，服务重启后不恢复；宿主需自行清理保存的模型会话。首期不提供推送通知或旧版 0.3 兼容层。

```ts
import { createTeamA2aClient } from "@toonflow/teams-scaffold/a2a";

const client = await createTeamA2aClient({
  url: "https://example.com/team/.well-known/agent-card.json",
  token: "由宿主读取的密钥",
});
const card = await client.getAgentCard();
```

客户端返回官方 Client，支持其消息、SSE、任务读取、列表和取消接口；可发现 JSON-RPC 或 HTTP+JSON 服务。传入的 URL 是完整 Card 地址。携带 token 时不允许 Card 把请求转发到其他 origin，且禁止 HTTP 重定向，避免密钥随 Card 或跳转泄露。媒体文件不会由这个适配器自动下载。

## 验证

脚手架修改后运行 `bun run --cwd packages/teamScaffold typecheck`，示例执行 `bun run --cwd packages/teams/storyboardTeam build`。构建本身会检查所有成员引用、资源限制和发布内容；实际成员执行、授权和模型调用仍需由宿主联调。
