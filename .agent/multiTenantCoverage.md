# 多租户功能接入清单

2026-11-05 源码核查。用于判断下一步改造范围，不是调用流程图。本次没有修改业务代码、开放权限或运行服务。

## 先分清三个判断

1. **请求 URL 带 `/multiTenant`**：当前主要是账号、认证、余额和后台管理 API。
2. **经过多租户鉴权**：开启时，同一个 Bun app 的 `/api/*`、`/mcp`、`/a2a` 先经过 `multiTenantAccess`；被拒绝也属于经过校验，不代表功能完成改造。
3. **业务完成多租户适配**：还需检查数据归属、会话／任务归属、凭据、来源选择、计费等。模型 gateway 只统一模型能力，不是所有外部服务的通用代理。

当前结论：**账号、模型执行、内部钱包已接入当前账号隔离模式；Agent 只统一了模型执行，整套 Agent／工具业务仍未完成租户化；不少旧能力通过禁止普通账号访问来保护。**

## 逐功能覆盖

下表以开启多租户、从 10888 创作为前提。“超管可用”仍受原功能配置、来源和工作区等校验。后台管理接口走控制入口。关闭多租户时保留原独立链路，不执行多租户身份分流和内部 SQL 钱包扣费。

| 功能 | 实际入口／执行位置 | 已接入的内容 | 尚未接入／仍保留的旧实现 | 普通账号 |
| --- | --- | --- | --- | --- |
| 登录、注册、退出、本人余额 | `/api/multiTenant/user/*` | SQL 账号、会话、注册策略、本人钱包 | 不等于已有组织租户与成员体系 | 可用 |
| 文本生成 | `/api/ai/generate` | gateway 路由、平台凭据、报价、预占、结算 | URL 保留原样，实际模型请求由 Bun 发出 | 可用 |
| 图片／视频／音频生成 | `/api/ai/media/*` | 同一 gateway；持久任务、owner、报价与计费 | 任务和交付文件仍是文件，未实现分布式执行租约 | 可用，仅本人任务 |
| Agent 对话的模型调用 | `/api/agent` → Agent runtime | 外层身份校验；每个模型 turn 进入 gateway.run | Agent 其他能力不能由模型已统一推导为全部已适配 | **403**，超管可用 |
| Agent 会话、历史、停止、回传 | `/api/agent/*` | 外层鉴权、既有工作区检查 | 仍旧会话／文件／桥接结构；未建立完整 owner 范围 | **403** |
| singleAgent／A2A | `/api/singleAgent/*`、`/a2a/*` | 模型 turn 复用 gateway；协议另有校验 | singleAgent 为进程内会话；A2A 为全局配置／Token | **403** |
| 手动画布增删、移动、连线 | VueFlow／浏览器内存 | 无需服务端模型处理 | 这是本地 UI 操作，不应为了统一而逐次送模型网关 | 可用 |
| 画布／文档／工作区保存 | `useWorkspaceFiles` → `/api/workspaces/files/*` | 身份与用户根目录隔离、真实路径及文件边界 | 仍按目录与文件存储；无完整 SQL 项目登记／共享模型 | 可用，仅本人目录 |
| Agent 控制画布 | Agent 下发 canvasCall → 前端执行 → `/api/agent/canvasResult` | HTTP 鉴权、原调用与目录校验 | pendingCalls 按 callId／cwd 管理，未带完整用户／租户归属 | **Agent 入口 403** |
| 用户设置／项目列表 | `/api/settings/get/save` | 普通账号 SQL settings＋revision；超管创作字段白名单 | 超管沿 settings.json，未新增主机 CAS | 可用，按身份分域 |
| 全局素材库／个性化记忆 | `/api/assets/*`、`/api/settings/personalization/*` | 仅外层鉴权与原业务检查 | 素材、memory.md、AGENTS.md 等仍为宿主全局数据 | **403** |
| 节点／扩展／工具清单 | nodes get/files、ext list/read、tools get | 精确只读放行、配置脱敏 | 共用宿主插件安装目录，非用户独立安装和配置 | 指定只读入口可用 |
| FFmpeg／媒体预览／浏览器工具 | `/api/ffmpeg/*`、`/api/media/preview`、`/api/browser/*` | 外层鉴权与原工作区检查 | 旧工具及进程内运行态；无统一租户配额／任务调度 | **403** |
| 社区探索／广告／赞助／下载信息 | 六个只读 `/api/channel/community/*` | 身份鉴权和只读白名单 | **仍由 Bun 的旧 channel 请求 Toonflow 云；未应用来源映射** | 指定只读入口可用 |
| 社区发布／旧个人云业务 | `/api/channel/*` 对应业务 | 部分仅外层鉴权，个人账号／钱包／插件等公开入口已禁用 | 原个人云凭据与业务仍保留；未形成平台社区发布或租户个人云映射 | 发布未完成；个人云管理 403 |
| 网页搜索／抓取 | Agent → 工具插件 | Agent 外层权限；DeepSeek 专用模型搜索另有拒绝 guard | **Bun 工具直接调用 Tavily／DDG／目标网页，不受来源映射或模型计费控制** | Agent 未开放 |
| Agent 的插件市场工具 | Agent → createPluginMarketTools | Agent 外层权限、既有安装确认 | **搜索仍取旧全局个人云 token → channel.getPlugins**；内部函数不再经过被封的 HTTP 路由 | Agent 未开放 |
| Agent 的外部 MCP 工具 | Agent → createMcpAgentTools | Agent 外层权限 | **读取全局 conf.mcpServers → client.callTool**；未接租户来源、工具配额或统一计费 | Agent 未开放 |
| MCP 页面控制／外部接入 | `/api/mcp/control/*`、`/mcp` | 外层权限与原 MCP 校验 | 全局 Token／connections Map；不是租户连接体系，额外 MCP 监听在开启后被拦截 | **403** |
| 语音输入／音频转文字 | 浏览器 SpeechRecognition | 文件转写的文件读取仍经过工作区授权 | **识别不进 Bun 模型 gateway，无平台路由、报价与扣费**；是否联网由浏览器实现决定 | 取决于前端入口及浏览器支持；Agent 发起仍被 Agent 权限限制 |
| 平台账号／供应商／模型／价格／余额管理 | 控制口 `/api/multiTenant/*` | 独立领域包、管理鉴权、SQL／CAS／幂等账务 | 不是所有旧平台设置均已有后台替代页 | 仅超管管理 |
| 其他业务数据源映射 | `/api/multiTenant/sourceMapping/*` | SQL 草稿保存＋CAS | **始终 applied:false**；未真正控制供应商来源／插件／社区；真实模型另走 modelRouting | 仅超管配置草稿 |

## Agent 和画布的准确判断

`fetch("/api/agent")`、`fetch("/api/agent/canvasResult")` 是同源 Bun 请求，没有外部 host，也没有查到全局 Axios baseURL 指向外网的配置。

Agent 内部的模型调用已经经过多租户模型网关。**未统一的主要是 Agent 的业务运行态和工具执行能力**：画布回传、临时会话、MCP 连接及全局工具配置。当前普通账号 403 并不意味着这些功能可以直接解除限制。

画布需要分三件事看：

- 移动、连线、增删节点：浏览器本地操作，不需要模型请求。
- 保存画布：通过已按身份隔离的工作区接口写文件，不需要模型计费。
- 节点生成／Agent 模型 turn：必须经过模型 gateway，目前内置链路已接入。

## 真正未经过 Bun 的浏览器请求

| 请求 | 当前情况 | 是否属于模型旁路 |
| --- | --- | --- |
| 语音识别／转写 | 浏览器 SpeechRecognition；代码未强制本地识别 | 属于未纳入平台模型服务的识别能力，与“音频生成”不同 |
| 匿名统计 | 浏览器直发 `api.toonflow.net/web/telemetry/report`；受隐私开关控制，普通账号 bootstrap 不注册统计 | 不是模型请求；超管／独立创作可能发送 |
| 社区图片／视频展示 | 浏览器读取 coverUrl／videoUrl | 是资源展示，不是模型执行 |
| 原社区／插件预签名上传 | 获取上传授权后浏览器 PUT 到 uploadUrl | 是对象上传；相关多租户发布功能尚未完成，不能视为普通租户已开放 |

内置画布节点的文件预览通常使用同源工作区读取再生成 blob URL；Markdown 图片导入、社区项目克隆等还会交 Bun 下载，不能只见 `fetch` 就判断为浏览器直连外部。动态节点／工具插件不是网络沙箱，本次结论限于核查到的仓库内置链路，不能推广为任意第三方插件均无法自行出网。

## 下一步需要决定的改造范围

以下是基于现状的建议，尚未实施：

1. **先决定是否开放租户 Agent。** 若开放，优先补会话、任务、停止、工具调用、画布指令／结果回传的 owner 与连接归属，再放开对应 API。不能只改 URL 前缀或删除 403。
2. **确定“平台统一”的范围。** 模型已经统一；若社区、插件市场、搜索、抓取、MCP、ASR 也要由后台决定来源、凭据和配额，应在各业务能力入口接入相应策略。尤其内部工具调用也要执行策略，不能只封旧 HTTP 路径。
3. **明确共享与私有数据。** 全局素材、记忆、插件配置、浏览器会话与工具任务尚有宿主级状态；需要选择平台共享、用户私有或暂不开放，再实施归属改造。

**统一重点应是身份上下文、业务授权与来源策略；模型继续复用 modelGateway。统一把 URL 改成 `/multiTenant/...` 不会自动完成以上改造。**

## 关键源码定位

| 判断 | 代码 |
| --- | --- |
| API 外层多租户校验和白名单 | [app.ts](../apps/server/src/app.ts)、[runtime.ts](../apps/server/src/utils/multiTenant/runtime.ts) |
| Agent 请求与画布回传 | [conversation.vue](../apps/web/src/components/agent/conversation.vue)、[canvas bridge](../apps/server/src/agent/bridge/canvas.ts) |
| Agent 模型统一执行 | [runtime/model.ts](../apps/server/src/agent/runtime/model.ts)、[runtime/requests.ts](../apps/server/src/agent/runtime/requests.ts) |
| 画布本地执行与保存 | [canvas/index.vue](../apps/web/src/pages/workspace/panels/canvas/index.vue)、[useCanvasTools.ts](../apps/web/src/pages/workspace/panels/canvas/useCanvasTools.ts)、[workspaceFiles.ts](../apps/web/src/lib/workspaceFiles.ts) |
| 节点统一模型请求 | [nodeAi.ts](../packages/nodeScaffold/src/nodeAi.ts)、[领域 gateway](../packages/multiTenant/gateway/index.ts) |
| 内部工具与旧云凭据 | [agent/tools/index.ts](../apps/server/src/agent/tools/index.ts)、[pluginMarket.ts](../apps/server/src/lib/pluginMarket.ts) |
| 外部 MCP、全局连接与临时会话 | [mcp/servers.ts](../apps/server/src/utils/mcp/servers.ts)、[mcp/control.ts](../apps/server/src/utils/mcp/control.ts)、[singleAgent/index.ts](../apps/server/src/utils/singleAgent/index.ts) |
| 搜索／抓取 | [webSearch](../packages/tools/webSearch/src/index.ts)、[webFetch](../packages/tools/webFetch/src/index.ts) |
| 社区仍用旧 channel；来源仍草稿 | [channelRequest.ts](../apps/server/src/lib/channelRequest.ts)、[channel/index.ts](../apps/server/src/utils/channel/index.ts)、[sourceMapping/index.ts](../packages/multiTenant/sourceMapping/index.ts) |
| 浏览器识别、统计启用条件 | [asr/index.ts](../packages/asr/src/index.ts)、[anonymousData.ts](../apps/web/src/lib/anonymousData.ts)、[creation bootstrap](../apps/web/src/bootstrap/creation.ts) |

完整 HTTP 地址仍可查 [API 路由清单](apiRouterRoutes.md)；该清单的“接口存在”不等于本表中的“已完成多租户适配”。
