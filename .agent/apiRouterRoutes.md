# 当前 API 路由清单

源码快照：2026-11-05。总流程及开启前后权限见 [API Router 图谱](apiRouterMap.md)。

## 清单口径

- [router.ts](../apps/server/src/router.ts) 当前注册 **216 个接口，21 个业务家族**，与 `apps/server/src/routes` 下 216 个 TypeScript 路由文件一一对应。
- 下表记录源码显式声明的 HTTP 方法与完整路径；不重复统计 Express 的隐式 HEAD、CORS 预检、尾斜线及大小写兼容。
- **接口已注册不代表多租户下获准访问。** 入口标记、登录身份、外层权限和接口内校验共同决定结果；不能把本表当作租户权限表。
- 这是源码静态清单，没有启动服务、调用模型或变更配置。未列上游供应商内部 HTTP 地址、第三方协议的每个 JSON-RPC 方法及运行时插件自定义网络请求。

## 自动注册的业务 API

| 家族 | 接口数 | 主要职责 |
| --- | ---: | --- |
| `/api/agent` | 14 | Agent 会话 |
| `/api/agents` | 9 | 团队与 A2A 配置 |
| `/api/ai` | 9 | 模型目录、执行、报价和任务 |
| `/api/assets` | 6 | 全局素材 |
| `/api/browser` | 2 | 浏览器控制 |
| `/api/channel` | 37 | Toonflow 渠道业务 |
| `/api/desktop` | 16 | 桌面原生能力 |
| `/api/ext` | 6 | 扩展插件 |
| `/api/ffmpeg` | 6 | FFmpeg |
| `/api/mcp` | 13 | MCP 配置与页面控制 |
| `/api/media` | 1 | 媒体预览 |
| `/api/mobileLink` | 6 | 设备互联服务端 |
| `/api/multiTenant` | 30 | 多租户控制、身份和平台管理 |
| `/api/nodes` | 6 | 节点插件 |
| `/api/plugins` | 2 | 插件开发与导出 |
| `/api/providers` | 11 | 独立模式供应商 |
| `/api/settings` | 6 | 设置 |
| `/api/singleAgent` | 5 | 单 Agent |
| `/api/skills` | 10 | 技能 |
| `/api/tools` | 7 | 工具插件 |
| `/api/workspaces` | 14 | 工作区与文件 |

### agent · Agent 会话

| 方法 | 完整路径 | 路由源码 |
| --- | --- | --- |
| POST | `/api/agent` | [agent.ts](../apps/server/src/routes/agent.ts) |
| POST | `/api/agent/answer` | [agent/answer.ts](../apps/server/src/routes/agent/answer.ts) |
| POST | `/api/agent/branch` | [agent/branch.ts](../apps/server/src/routes/agent/branch.ts) |
| POST | `/api/agent/canvasResult` | [agent/canvasResult.ts](../apps/server/src/routes/agent/canvasResult.ts) |
| POST | `/api/agent/create` | [agent/create.ts](../apps/server/src/routes/agent/create.ts) |
| GET | `/api/agent/get` | [agent/get.ts](../apps/server/src/routes/agent/get.ts) |
| GET | `/api/agent/list` | [agent/list.ts](../apps/server/src/routes/agent/list.ts) |
| GET | `/api/agent/mentionSource` | [agent/mentionSource.ts](../apps/server/src/routes/agent/mentionSource.ts) |
| DELETE | `/api/agent/message` | [agent/message.ts](../apps/server/src/routes/agent/message.ts) |
| DELETE | `/api/agent/queue` | [agent/queue.ts](../apps/server/src/routes/agent/queue.ts) |
| POST | `/api/agent/queue/steer` | [agent/queue/steer.ts](../apps/server/src/routes/agent/queue/steer.ts) |
| PATCH | `/api/agent/rename` | [agent/rename.ts](../apps/server/src/routes/agent/rename.ts) |
| GET | `/api/agent/skills` | [agent/skills.ts](../apps/server/src/routes/agent/skills.ts) |
| POST | `/api/agent/stop` | [agent/stop.ts](../apps/server/src/routes/agent/stop.ts) |

### agents · 团队与 A2A 配置

| 方法 | 完整路径 | 路由源码 |
| --- | --- | --- |
| GET | `/api/agents/a2a/get` | [agents/a2a/get.ts](../apps/server/src/routes/agents/a2a/get.ts) |
| PUT | `/api/agents/a2a/save` | [agents/a2a/save.ts](../apps/server/src/routes/agents/a2a/save.ts) |
| POST | `/api/agents/connect` | [agents/connect.ts](../apps/server/src/routes/agents/connect.ts) |
| GET | `/api/agents/get` | [agents/get.ts](../apps/server/src/routes/agents/get.ts) |
| POST | `/api/agents/install` | [agents/install.ts](../apps/server/src/routes/agents/install.ts) |
| GET | `/api/agents/read` | [agents/read.ts](../apps/server/src/routes/agents/read.ts) |
| PUT | `/api/agents/save` | [agents/save.ts](../apps/server/src/routes/agents/save.ts) |
| PUT | `/api/agents/setEnabled` | [agents/setEnabled.ts](../apps/server/src/routes/agents/setEnabled.ts) |
| DELETE | `/api/agents/uninstall` | [agents/uninstall.ts](../apps/server/src/routes/agents/uninstall.ts) |

### ai · 模型目录、执行、报价和任务

| 方法 | 完整路径 | 路由源码 |
| --- | --- | --- |
| POST | `/api/ai/generate` | [ai/generate.ts](../apps/server/src/routes/ai/generate.ts) |
| POST | `/api/ai/media/balance` | [ai/media/balance.ts](../apps/server/src/routes/ai/media/balance.ts) |
| GET | `/api/ai/media/balanceEvents` | [ai/media/balanceEvents.ts](../apps/server/src/routes/ai/media/balanceEvents.ts) |
| POST | `/api/ai/media/generate` | [ai/media/generate.ts](../apps/server/src/routes/ai/media/generate.ts) |
| GET | `/api/ai/media/models` | [ai/media/models.ts](../apps/server/src/routes/ai/media/models.ts) |
| POST | `/api/ai/media/price` | [ai/media/price.ts](../apps/server/src/routes/ai/media/price.ts) |
| POST | `/api/ai/media/tasks/cancel` | [ai/media/tasks/cancel.ts](../apps/server/src/routes/ai/media/tasks/cancel.ts) |
| POST | `/api/ai/media/tasks/status` | [ai/media/tasks/status.ts](../apps/server/src/routes/ai/media/tasks/status.ts) |
| GET | `/api/ai/models` | [ai/models.ts](../apps/server/src/routes/ai/models.ts) |

### assets · 全局素材

| 方法 | 完整路径 | 路由源码 |
| --- | --- | --- |
| GET | `/api/assets/list` | [assets/list.ts](../apps/server/src/routes/assets/list.ts) |
| POST | `/api/assets/mkdir` | [assets/mkdir.ts](../apps/server/src/routes/assets/mkdir.ts) |
| GET | `/api/assets/read` | [assets/read.ts](../apps/server/src/routes/assets/read.ts) |
| DELETE | `/api/assets/remove` | [assets/remove.ts](../apps/server/src/routes/assets/remove.ts) |
| POST | `/api/assets/rename` | [assets/rename.ts](../apps/server/src/routes/assets/rename.ts) |
| PUT | `/api/assets/save` | [assets/save.ts](../apps/server/src/routes/assets/save.ts) |

### browser · 浏览器控制

| 方法 | 完整路径 | 路由源码 |
| --- | --- | --- |
| POST | `/api/browser/input` | [browser/input.ts](../apps/server/src/routes/browser/input.ts) |
| GET | `/api/browser/stream` | [browser/stream.ts](../apps/server/src/routes/browser/stream.ts) |

### channel · Toonflow 渠道业务

| 方法 | 完整路径 | 路由源码 |
| --- | --- | --- |
| POST | `/api/channel/account/getPointsConsumption` | [channel/account/getPointsConsumption.ts](../apps/server/src/routes/channel/account/getPointsConsumption.ts) |
| GET | `/api/channel/account/getPreviewData` | [channel/account/getPreviewData.ts](../apps/server/src/routes/channel/account/getPreviewData.ts) |
| GET | `/api/channel/account/getTaskRecords` | [channel/account/getTaskRecords.ts](../apps/server/src/routes/channel/account/getTaskRecords.ts) |
| POST | `/api/channel/account/getUsageStatistics` | [channel/account/getUsageStatistics.ts](../apps/server/src/routes/channel/account/getUsageStatistics.ts) |
| GET | `/api/channel/community/getAdvertisements` | [channel/community/getAdvertisements.ts](../apps/server/src/routes/channel/community/getAdvertisements.ts) |
| POST | `/api/channel/community/getExploreDownload` | [channel/community/getExploreDownload.ts](../apps/server/src/routes/channel/community/getExploreDownload.ts) |
| POST | `/api/channel/community/getExploreProcess` | [channel/community/getExploreProcess.ts](../apps/server/src/routes/channel/community/getExploreProcess.ts) |
| POST | `/api/channel/community/getExploreProject` | [channel/community/getExploreProject.ts](../apps/server/src/routes/channel/community/getExploreProject.ts) |
| POST | `/api/channel/community/getExploreProjects` | [channel/community/getExploreProjects.ts](../apps/server/src/routes/channel/community/getExploreProjects.ts) |
| POST | `/api/channel/community/getExploreUploadSignature` | [channel/community/getExploreUploadSignature.ts](../apps/server/src/routes/channel/community/getExploreUploadSignature.ts) |
| GET | `/api/channel/community/getSponsorList` | [channel/community/getSponsorList.ts](../apps/server/src/routes/channel/community/getSponsorList.ts) |
| POST | `/api/channel/community/uploadExploreProject` | [channel/community/uploadExploreProject.ts](../apps/server/src/routes/channel/community/uploadExploreProject.ts) |
| GET | `/api/channel/model/getModelData` | [channel/model/getModelData.ts](../apps/server/src/routes/channel/model/getModelData.ts) |
| POST | `/api/channel/plugin/deletePlugin` | [channel/plugin/deletePlugin.ts](../apps/server/src/routes/channel/plugin/deletePlugin.ts) |
| POST | `/api/channel/plugin/getPluginExistence` | [channel/plugin/getPluginExistence.ts](../apps/server/src/routes/channel/plugin/getPluginExistence.ts) |
| POST | `/api/channel/plugin/getPlugins` | [channel/plugin/getPlugins.ts](../apps/server/src/routes/channel/plugin/getPlugins.ts) |
| POST | `/api/channel/plugin/getUploadSignature` | [channel/plugin/getUploadSignature.ts](../apps/server/src/routes/channel/plugin/getUploadSignature.ts) |
| POST | `/api/channel/plugin/toggleCollection` | [channel/plugin/toggleCollection.ts](../apps/server/src/routes/channel/plugin/toggleCollection.ts) |
| POST | `/api/channel/plugin/updatePlugin` | [channel/plugin/updatePlugin.ts](../apps/server/src/routes/channel/plugin/updatePlugin.ts) |
| POST | `/api/channel/plugin/uploadPlugin` | [channel/plugin/uploadPlugin.ts](../apps/server/src/routes/channel/plugin/uploadPlugin.ts) |
| GET | `/api/channel/provider/getSource` | [channel/provider/getSource.ts](../apps/server/src/routes/channel/provider/getSource.ts) |
| POST | `/api/channel/subAccounts/create` | [channel/subAccounts/create.ts](../apps/server/src/routes/channel/subAccounts/create.ts) |
| POST | `/api/channel/subAccounts/get` | [channel/subAccounts/get.ts](../apps/server/src/routes/channel/subAccounts/get.ts) |
| POST | `/api/channel/subAccounts/remove` | [channel/subAccounts/remove.ts](../apps/server/src/routes/channel/subAccounts/remove.ts) |
| POST | `/api/channel/user/forgotPassword` | [channel/user/forgotPassword.ts](../apps/server/src/routes/channel/user/forgotPassword.ts) |
| GET | `/api/channel/user/getCaptcha` | [channel/user/getCaptcha.ts](../apps/server/src/routes/channel/user/getCaptcha.ts) |
| POST | `/api/channel/user/login` | [channel/user/login.ts](../apps/server/src/routes/channel/user/login.ts) |
| POST | `/api/channel/user/register` | [channel/user/register.ts](../apps/server/src/routes/channel/user/register.ts) |
| POST | `/api/channel/user/sendSmsCode` | [channel/user/sendSmsCode.ts](../apps/server/src/routes/channel/user/sendSmsCode.ts) |
| POST | `/api/channel/wallet/exchange` | [channel/wallet/exchange.ts](../apps/server/src/routes/channel/wallet/exchange.ts) |
| GET | `/api/channel/wallet/getActivity` | [channel/wallet/getActivity.ts](../apps/server/src/routes/channel/wallet/getActivity.ts) |
| GET | `/api/channel/wallet/getBonusBatches` | [channel/wallet/getBonusBatches.ts](../apps/server/src/routes/channel/wallet/getBonusBatches.ts) |
| GET | `/api/channel/wallet/getOrders` | [channel/wallet/getOrders.ts](../apps/server/src/routes/channel/wallet/getOrders.ts) |
| GET | `/api/channel/wallet/getPaymentStatus` | [channel/wallet/getPaymentStatus.ts](../apps/server/src/routes/channel/wallet/getPaymentStatus.ts) |
| GET | `/api/channel/wallet/getPlans` | [channel/wallet/getPlans.ts](../apps/server/src/routes/channel/wallet/getPlans.ts) |
| GET | `/api/channel/wallet/getPresentation` | [channel/wallet/getPresentation.ts](../apps/server/src/routes/channel/wallet/getPresentation.ts) |
| POST | `/api/channel/wallet/pay` | [channel/wallet/pay.ts](../apps/server/src/routes/channel/wallet/pay.ts) |

### desktop · 桌面原生能力

| 方法 | 完整路径 | 路由源码 |
| --- | --- | --- |
| POST | `/api/desktop/clipboard/read` | [desktop/clipboard/read.ts](../apps/server/src/routes/desktop/clipboard/read.ts) |
| POST | `/api/desktop/clipboard/write` | [desktop/clipboard/write.ts](../apps/server/src/routes/desktop/clipboard/write.ts) |
| POST | `/api/desktop/devtools` | [desktop/devtools.ts](../apps/server/src/routes/desktop/devtools.ts) |
| POST | `/api/desktop/notification` | [desktop/notification.ts](../apps/server/src/routes/desktop/notification.ts) |
| POST | `/api/desktop/openUrl` | [desktop/openUrl.ts](../apps/server/src/routes/desktop/openUrl.ts) |
| POST | `/api/desktop/plugins/install` | [desktop/plugins/install.ts](../apps/server/src/routes/desktop/plugins/install.ts) |
| POST | `/api/desktop/providerFile/read` | [desktop/providerFile/read.ts](../apps/server/src/routes/desktop/providerFile/read.ts) |
| POST | `/api/desktop/providerFile/select` | [desktop/providerFile/select.ts](../apps/server/src/routes/desktop/providerFile/select.ts) |
| POST | `/api/desktop/ready` | [desktop/ready.ts](../apps/server/src/routes/desktop/ready.ts) |
| POST | `/api/desktop/saveFile` | [desktop/saveFile.ts](../apps/server/src/routes/desktop/saveFile.ts) |
| POST | `/api/desktop/selectDirectory` | [desktop/selectDirectory.ts](../apps/server/src/routes/desktop/selectDirectory.ts) |
| POST | `/api/desktop/selectSaveFile` | [desktop/selectSaveFile.ts](../apps/server/src/routes/desktop/selectSaveFile.ts) |
| GET | `/api/desktop/update` | [desktop/update/index.ts](../apps/server/src/routes/desktop/update/index.ts) |
| POST | `/api/desktop/update/apply` | [desktop/update/apply.ts](../apps/server/src/routes/desktop/update/apply.ts) |
| POST | `/api/desktop/update/check` | [desktop/update/check.ts](../apps/server/src/routes/desktop/update/check.ts) |
| POST | `/api/desktop/update/download` | [desktop/update/download.ts](../apps/server/src/routes/desktop/update/download.ts) |

### ext · 扩展插件

| 方法 | 完整路径 | 路由源码 |
| --- | --- | --- |
| POST | `/api/ext/install` | [ext/install.ts](../apps/server/src/routes/ext/install.ts) |
| GET | `/api/ext/list` | [ext/list.ts](../apps/server/src/routes/ext/list.ts) |
| GET | `/api/ext/read` | [ext/read.ts](../apps/server/src/routes/ext/read.ts) |
| PUT | `/api/ext/save` | [ext/save.ts](../apps/server/src/routes/ext/save.ts) |
| PUT | `/api/ext/setEnabled` | [ext/setEnabled.ts](../apps/server/src/routes/ext/setEnabled.ts) |
| DELETE | `/api/ext/uninstall` | [ext/uninstall.ts](../apps/server/src/routes/ext/uninstall.ts) |

### ffmpeg · FFmpeg

| 方法 | 完整路径 | 路由源码 |
| --- | --- | --- |
| POST | `/api/ffmpeg/cancel` | [ffmpeg/cancel.ts](../apps/server/src/routes/ffmpeg/cancel.ts) |
| POST | `/api/ffmpeg/download` | [ffmpeg/download.ts](../apps/server/src/routes/ffmpeg/download.ts) |
| GET | `/api/ffmpeg/events` | [ffmpeg/events.ts](../apps/server/src/routes/ffmpeg/events.ts) |
| POST | `/api/ffmpeg/execute` | [ffmpeg/execute.ts](../apps/server/src/routes/ffmpeg/execute.ts) |
| GET | `/api/ffmpeg/progress` | [ffmpeg/progress.ts](../apps/server/src/routes/ffmpeg/progress.ts) |
| GET | `/api/ffmpeg/status` | [ffmpeg/status.ts](../apps/server/src/routes/ffmpeg/status.ts) |

### mcp · MCP 配置与页面控制

| 方法 | 完整路径 | 路由源码 |
| --- | --- | --- |
| GET | `/api/mcp/control/events` | [mcp/control/events.ts](../apps/server/src/routes/mcp/control/events.ts) |
| POST | `/api/mcp/control/result` | [mcp/control/result.ts](../apps/server/src/routes/mcp/control/result.ts) |
| POST | `/api/mcp/control/state` | [mcp/control/state.ts](../apps/server/src/routes/mcp/control/state.ts) |
| POST | `/api/mcp/servers/importDxt` | [mcp/servers/importDxt.ts](../apps/server/src/routes/mcp/servers/importDxt.ts) |
| POST | `/api/mcp/servers/importJson` | [mcp/servers/importJson.ts](../apps/server/src/routes/mcp/servers/importJson.ts) |
| POST | `/api/mcp/servers/inspectDxt` | [mcp/servers/inspectDxt.ts](../apps/server/src/routes/mcp/servers/inspectDxt.ts) |
| GET | `/api/mcp/servers/list` | [mcp/servers/list.ts](../apps/server/src/routes/mcp/servers/list.ts) |
| DELETE | `/api/mcp/servers/remove` | [mcp/servers/remove.ts](../apps/server/src/routes/mcp/servers/remove.ts) |
| PUT | `/api/mcp/servers/save` | [mcp/servers/save.ts](../apps/server/src/routes/mcp/servers/save.ts) |
| POST | `/api/mcp/servers/setEnabled` | [mcp/servers/setEnabled.ts](../apps/server/src/routes/mcp/servers/setEnabled.ts) |
| POST | `/api/mcp/servers/test` | [mcp/servers/test.ts](../apps/server/src/routes/mcp/servers/test.ts) |
| GET | `/api/mcp/skill` | [mcp/skill.ts](../apps/server/src/routes/mcp/skill.ts) |
| GET | `/api/mcp/status` | [mcp/status.ts](../apps/server/src/routes/mcp/status.ts) |

### media · 媒体预览

| 方法 | 完整路径 | 路由源码 |
| --- | --- | --- |
| POST | `/api/media/preview` | [media/preview.ts](../apps/server/src/routes/media/preview.ts) |

### mobileLink · 设备互联服务端

| 方法 | 完整路径 | 路由源码 |
| --- | --- | --- |
| PUT | `/api/mobileLink/config` | [mobileLink/config.ts](../apps/server/src/routes/mobileLink/config.ts) |
| GET | `/api/mobileLink/heartbeat` | [mobileLink/heartbeat.ts](../apps/server/src/routes/mobileLink/heartbeat.ts) |
| POST | `/api/mobileLink/pair` | [mobileLink/pair.ts](../apps/server/src/routes/mobileLink/pair.ts) |
| POST | `/api/mobileLink/pairing` | [mobileLink/pairing.ts](../apps/server/src/routes/mobileLink/pairing.ts) |
| POST | `/api/mobileLink/revoke` | [mobileLink/revoke.ts](../apps/server/src/routes/mobileLink/revoke.ts) |
| GET | `/api/mobileLink/status` | [mobileLink/status.ts](../apps/server/src/routes/mobileLink/status.ts) |

### multiTenant · 多租户控制、身份和平台管理

| 方法 | 完整路径 | 路由源码 |
| --- | --- | --- |
| POST | `/api/multiTenant/billing/credit` | [multiTenant/billing/credit.ts](../apps/server/src/routes/multiTenant/billing/credit.ts) |
| POST | `/api/multiTenant/billing/release` | [multiTenant/billing/release.ts](../apps/server/src/routes/multiTenant/billing/release.ts) |
| GET | `/api/multiTenant/billing/user` | [multiTenant/billing/user.ts](../apps/server/src/routes/multiTenant/billing/user.ts) |
| PUT | `/api/multiTenant/enabled` | [multiTenant/enabled.ts](../apps/server/src/routes/multiTenant/enabled.ts) |
| POST | `/api/multiTenant/hostSession` | [multiTenant/hostSession.ts](../apps/server/src/routes/multiTenant/hostSession.ts) |
| POST | `/api/multiTenant/login` | [multiTenant/login.ts](../apps/server/src/routes/multiTenant/login.ts) |
| POST | `/api/multiTenant/logout` | [multiTenant/logout.ts](../apps/server/src/routes/multiTenant/logout.ts) |
| GET | `/api/multiTenant/models/available` | [multiTenant/models/available.ts](../apps/server/src/routes/multiTenant/models/available.ts) |
| POST | `/api/multiTenant/models/cloud` | [multiTenant/models/cloud.ts](../apps/server/src/routes/multiTenant/models/cloud.ts) |
| GET | `/api/multiTenant/models/get` | [multiTenant/models/get.ts](../apps/server/src/routes/multiTenant/models/get.ts) |
| PUT | `/api/multiTenant/models/save` | [multiTenant/models/save.ts](../apps/server/src/routes/multiTenant/models/save.ts) |
| GET | `/api/multiTenant/providers/get` | [multiTenant/providers/get.ts](../apps/server/src/routes/multiTenant/providers/get.ts) |
| POST | `/api/multiTenant/providers/inspect` | [multiTenant/providers/inspect.ts](../apps/server/src/routes/multiTenant/providers/inspect.ts) |
| PUT | `/api/multiTenant/providers/save` | [multiTenant/providers/save.ts](../apps/server/src/routes/multiTenant/providers/save.ts) |
| PUT | `/api/multiTenant/registration` | [multiTenant/registration.ts](../apps/server/src/routes/multiTenant/registration.ts) |
| POST | `/api/multiTenant/setup` | [multiTenant/setup.ts](../apps/server/src/routes/multiTenant/setup.ts) |
| GET | `/api/multiTenant/sourceMapping/get` | [multiTenant/sourceMapping/get.ts](../apps/server/src/routes/multiTenant/sourceMapping/get.ts) |
| PUT | `/api/multiTenant/sourceMapping/save` | [multiTenant/sourceMapping/save.ts](../apps/server/src/routes/multiTenant/sourceMapping/save.ts) |
| GET | `/api/multiTenant/state` | [multiTenant/state.ts](../apps/server/src/routes/multiTenant/state.ts) |
| GET | `/api/multiTenant/status` | [multiTenant/status.ts](../apps/server/src/routes/multiTenant/status.ts) |
| GET | `/api/multiTenant/user/balance` | [multiTenant/user/balance.ts](../apps/server/src/routes/multiTenant/user/balance.ts) |
| POST | `/api/multiTenant/user/host` | [multiTenant/user/host.ts](../apps/server/src/routes/multiTenant/user/host.ts) |
| POST | `/api/multiTenant/user/login` | [multiTenant/user/login.ts](../apps/server/src/routes/multiTenant/user/login.ts) |
| POST | `/api/multiTenant/user/logout` | [multiTenant/user/logout.ts](../apps/server/src/routes/multiTenant/user/logout.ts) |
| POST | `/api/multiTenant/user/register` | [multiTenant/user/register.ts](../apps/server/src/routes/multiTenant/user/register.ts) |
| GET | `/api/multiTenant/user/session` | [multiTenant/user/session.ts](../apps/server/src/routes/multiTenant/user/session.ts) |
| POST | `/api/multiTenant/users/create` | [multiTenant/users/create.ts](../apps/server/src/routes/multiTenant/users/create.ts) |
| GET | `/api/multiTenant/users/list` | [multiTenant/users/list.ts](../apps/server/src/routes/multiTenant/users/list.ts) |
| PUT | `/api/multiTenant/users/password` | [multiTenant/users/password.ts](../apps/server/src/routes/multiTenant/users/password.ts) |
| PUT | `/api/multiTenant/users/state` | [multiTenant/users/state.ts](../apps/server/src/routes/multiTenant/users/state.ts) |

### nodes · 节点插件

| 方法 | 完整路径 | 路由源码 |
| --- | --- | --- |
| GET | `/api/nodes/files` | [nodes/files.ts](../apps/server/src/routes/nodes/files.ts) |
| GET | `/api/nodes/get` | [nodes/get.ts](../apps/server/src/routes/nodes/get.ts) |
| POST | `/api/nodes/install` | [nodes/install.ts](../apps/server/src/routes/nodes/install.ts) |
| PUT | `/api/nodes/save` | [nodes/save.ts](../apps/server/src/routes/nodes/save.ts) |
| PUT | `/api/nodes/setEnabled` | [nodes/setEnabled.ts](../apps/server/src/routes/nodes/setEnabled.ts) |
| DELETE | `/api/nodes/uninstall` | [nodes/uninstall.ts](../apps/server/src/routes/nodes/uninstall.ts) |

### plugins · 插件开发与导出

| 方法 | 完整路径 | 路由源码 |
| --- | --- | --- |
| POST | `/api/plugins/develop` | [plugins/develop.ts](../apps/server/src/routes/plugins/develop.ts) |
| GET | `/api/plugins/export` | [plugins/export.ts](../apps/server/src/routes/plugins/export.ts) |

### providers · 独立模式供应商

| 方法 | 完整路径 | 路由源码 |
| --- | --- | --- |
| POST | `/api/providers/account/install` | [providers/account/install.ts](../apps/server/src/routes/providers/account/install.ts) |
| POST | `/api/providers/debug/inspect` | [providers/debug/inspect.ts](../apps/server/src/routes/providers/debug/inspect.ts) |
| POST | `/api/providers/debug/run` | [providers/debug/run.ts](../apps/server/src/routes/providers/debug/run.ts) |
| POST | `/api/providers/media/add` | [providers/media/add.ts](../apps/server/src/routes/providers/media/add.ts) |
| DELETE | `/api/providers/media/delete` | [providers/media/delete.ts](../apps/server/src/routes/providers/media/delete.ts) |
| GET | `/api/providers/media/list` | [providers/media/list.ts](../apps/server/src/routes/providers/media/list.ts) |
| POST | `/api/providers/media/models` | [providers/media/models.ts](../apps/server/src/routes/providers/media/models.ts) |
| PUT | `/api/providers/media/save` | [providers/media/save.ts](../apps/server/src/routes/providers/media/save.ts) |
| GET | `/api/providers/media/source` | [providers/media/source.ts](../apps/server/src/routes/providers/media/source.ts) |
| POST | `/api/providers/media/validate` | [providers/media/validate.ts](../apps/server/src/routes/providers/media/validate.ts) |
| POST | `/api/providers/models` | [providers/models.ts](../apps/server/src/routes/providers/models.ts) |

### settings · 设置

| 方法 | 完整路径 | 路由源码 |
| --- | --- | --- |
| GET | `/api/settings/get` | [settings/get.ts](../apps/server/src/routes/settings/get.ts) |
| GET | `/api/settings/personalization/get` | [settings/personalization/get.ts](../apps/server/src/routes/settings/personalization/get.ts) |
| PUT | `/api/settings/personalization/save` | [settings/personalization/save.ts](../apps/server/src/routes/settings/personalization/save.ts) |
| PUT | `/api/settings/save` | [settings/save.ts](../apps/server/src/routes/settings/save.ts) |
| GET | `/api/settings/systemPrompt` | [settings/systemPrompt.ts](../apps/server/src/routes/settings/systemPrompt.ts) |

### singleAgent · 单 Agent

| 方法 | 完整路径 | 路由源码 |
| --- | --- | --- |
| POST | `/api/singleAgent/answer` | [singleAgent/answer.ts](../apps/server/src/routes/singleAgent/answer.ts) |
| POST | `/api/singleAgent/control` | [singleAgent/control.ts](../apps/server/src/routes/singleAgent/control.ts) |
| POST | `/api/singleAgent/create` | [singleAgent/create.ts](../apps/server/src/routes/singleAgent/create.ts) |
| POST | `/api/singleAgent/run` | [singleAgent/run.ts](../apps/server/src/routes/singleAgent/run.ts) |
| POST | `/api/singleAgent/toolResult` | [singleAgent/toolResult.ts](../apps/server/src/routes/singleAgent/toolResult.ts) |

### skills · 技能

| 方法 | 完整路径 | 路由源码 |
| --- | --- | --- |
| POST | `/api/skills/create` | [skills/create.ts](../apps/server/src/routes/skills/create.ts) |
| GET | `/api/skills/get` | [skills/get.ts](../apps/server/src/routes/skills/get.ts) |
| POST | `/api/skills/install` | [skills/install.ts](../apps/server/src/routes/skills/install.ts) |
| GET | `/api/skills/list` | [skills/list.ts](../apps/server/src/routes/skills/list.ts) |
| PUT | `/api/skills/move` | [skills/move.ts](../apps/server/src/routes/skills/move.ts) |
| PUT | `/api/skills/order` | [skills/order.ts](../apps/server/src/routes/skills/order.ts) |
| GET | `/api/skills/read` | [skills/read.ts](../apps/server/src/routes/skills/read.ts) |
| PUT | `/api/skills/save` | [skills/save.ts](../apps/server/src/routes/skills/save.ts) |
| PUT | `/api/skills/setEnabled` | [skills/setEnabled.ts](../apps/server/src/routes/skills/setEnabled.ts) |
| DELETE | `/api/skills/uninstall` | [skills/uninstall.ts](../apps/server/src/routes/skills/uninstall.ts) |

### tools · 工具插件

| 方法 | 完整路径 | 路由源码 |
| --- | --- | --- |
| GET | `/api/tools/client` | [tools/client.ts](../apps/server/src/routes/tools/client.ts) |
| GET | `/api/tools/get` | [tools/get.ts](../apps/server/src/routes/tools/get.ts) |
| POST | `/api/tools/install` | [tools/install.ts](../apps/server/src/routes/tools/install.ts) |
| GET | `/api/tools/renderers` | [tools/renderers.ts](../apps/server/src/routes/tools/renderers.ts) |
| PUT | `/api/tools/save` | [tools/save.ts](../apps/server/src/routes/tools/save.ts) |
| PUT | `/api/tools/setEnabled` | [tools/setEnabled.ts](../apps/server/src/routes/tools/setEnabled.ts) |
| DELETE | `/api/tools/uninstall` | [tools/uninstall.ts](../apps/server/src/routes/tools/uninstall.ts) |

### workspaces · 工作区与文件

| 方法 | 完整路径 | 路由源码 |
| --- | --- | --- |
| GET | `/api/workspaces/check` | [workspaces/check.ts](../apps/server/src/routes/workspaces/check.ts) |
| POST | `/api/workspaces/clone` | [workspaces/clone.ts](../apps/server/src/routes/workspaces/clone.ts) |
| POST | `/api/workspaces/files/copy` | [workspaces/files/copy.ts](../apps/server/src/routes/workspaces/files/copy.ts) |
| GET | `/api/workspaces/files/export` | [workspaces/files/export.ts](../apps/server/src/routes/workspaces/files/export.ts) |
| POST | `/api/workspaces/files/importImage` | [workspaces/files/importImage.ts](../apps/server/src/routes/workspaces/files/importImage.ts) |
| GET | `/api/workspaces/files/list` | [workspaces/files/list.ts](../apps/server/src/routes/workspaces/files/list.ts) |
| POST | `/api/workspaces/files/mkdir` | [workspaces/files/mkdir.ts](../apps/server/src/routes/workspaces/files/mkdir.ts) |
| GET | `/api/workspaces/files/read` | [workspaces/files/read.ts](../apps/server/src/routes/workspaces/files/read.ts) |
| DELETE | `/api/workspaces/files/remove` | [workspaces/files/remove.ts](../apps/server/src/routes/workspaces/files/remove.ts) |
| POST | `/api/workspaces/files/rename` | [workspaces/files/rename.ts](../apps/server/src/routes/workspaces/files/rename.ts) |
| POST | `/api/workspaces/files/reveal` | [workspaces/files/reveal.ts](../apps/server/src/routes/workspaces/files/reveal.ts) |
| PUT | `/api/workspaces/files/write` | [workspaces/files/write.ts](../apps/server/src/routes/workspaces/files/write.ts) |
| GET | `/api/workspaces/list` | [workspaces/list.ts](../apps/server/src/routes/workspaces/list.ts) |
| POST | `/api/workspaces/selectDirectory` | [workspaces/selectDirectory.ts](../apps/server/src/routes/workspaces/selectDirectory.ts) |

## 自动 router 之外的挂载

以下不包含在上面的 216 个接口中。它们分属业务 app、设备壳层或独立更新服务，不能合并计算为同一份公开 API。

### 同一 Bun 业务 app 的协议与静态资源

| 方法 | 路径 | 实际去向与边界 | 源码 |
| --- | --- | --- | --- |
| POST / GET / DELETE，由 SDK 处理 | `/mcp` | Streamable HTTP MCP；初始化、工具与资源调用、事件流及会话结束。仍需 MCP 开关和 Bearer 凭据 | [挂载](../apps/server/src/app.ts)、[协议实现](../packages/mcp/src/index.ts) |
| GET | `/a2a/:name/.well-known/agent-card.json` | 团队 Agent Card；团队和 A2A 开关决定是否存在，先经过多租户外层边界 | [宿主](../apps/server/src/agent/a2a/index.ts)、[协议实现](../packages/teamScaffold/src/a2a.ts) |
| POST | `/a2a/:name` | A2A JSON-RPC 消息、任务查询与取消等由 SDK 分派；需要独立 Bearer 身份 | [协议实现](../packages/teamScaffold/src/a2a.ts) |
| GET / HEAD | `/` 及构建后的静态资源路径 | `express.static(webRoot)`；浏览器 hash 路由不是新增 HTTP API | [app.ts](../apps/server/src/app.ts) |

MCP 另有本机独立监听器：首选 `127.0.0.1:10588`，占用时最多尝试后续 31 个端口；只转发 `/mcp` 到同一个业务 app，其余路径返回 404。多租户开启后，这个监听器没有公开创作入口标记，会被外层权限拒绝，不是已完成的多租户 MCP 入口。见 [mcp/runtime.ts](../apps/server/src/utils/mcp/runtime.ts) 和 [multiTenant/runtime.ts](../apps/server/src/utils/multiTenant/runtime.ts)。

### 桌面与移动壳层的设备连接 API

以下路径由壳层先处理，不在 `apps/server/src/router.ts` 中。

| 方法 | 完整路径 | 职责 | 源码 |
| --- | --- | --- | --- |
| GET | `/api/connection/connection` | 当前本机／远端连接状态；路径中的 connection 确实重复两次 | [remoteConnection.ts](../apps/server/src/remoteConnection.ts) |
| POST | `/api/connection/connect` | 配对并保存下次连接目标 | [remoteConnection.ts](../apps/server/src/remoteConnection.ts) |
| POST | `/api/connection/disconnect` | 断开远端连接并切回本机目标 | [remoteConnection.ts](../apps/server/src/remoteConnection.ts) |

挂载位置：[桌面 connection.ts](../apps/desktop/src/connection.ts)、[移动 server.ts](../apps/mobile/src/server.ts)。桌面平台主机模式通过 `localOnly` 禁止切换远端，保留旧连接配置；这些路径不在 10888 的公开业务入口上。独立 server 不挂载这组壳层 API。

### 移动壳层本机 API

| 方法 | 完整路径 | 职责 | 源码 |
| --- | --- | --- | --- |
| GET | `/` | 一次性启动凭据兑换壳层 Cookie、连接参数重定向及浏览器能力探测 | [server.ts](../apps/mobile/src/server.ts) |
| GET | `/api/mobile/runtime` | 本机 Bun、平台与运行环境信息 | [server.ts](../apps/mobile/src/server.ts) |
| POST | `/api/mobile/exports` | 暂存待原生导出的二进制文件，返回本机下载 URL | [server.ts](../apps/mobile/src/server.ts) |
| GET | `/api/mobile/exports/:id` | 读取对应暂存导出 | [server.ts](../apps/mobile/src/server.ts) |
| DELETE | `/api/mobile/exports/:id` | 移除对应暂存导出 | [server.ts](../apps/mobile/src/server.ts) |

移动壳监听 `127.0.0.1` 随机端口，并在上述接口之前校验本机来源和本次启动 Cookie；之后才代理远端或复用业务 app。当前移动启动源码没有调用 `startMultiTenantRuntime`，不能据此宣称移动壳可作为多租户主机。

### 独立更新服务

| 方法 | 路径 | 职责 | 源码 |
| --- | --- | --- | --- |
| GET / HEAD | `/:fileName` | 只读取发布目录下已存在的平铺 ASCII 文件；不允许目录遍历、子目录和非文件对象 | [app.ts](../apps/updateServer/src/app.ts) |

`apps/updateServer` 是独立应用，默认监听 `127.0.0.1:8091`，不是创作 Bun app 的路由。其他方法返回 405；无效文件名或不存在文件返回 404。见 [index.ts](../apps/updateServer/src/index.ts)。

## 流式响应与长任务

这些仍属于上面的 API 或协议挂载，不应再画成额外后端。

| 入口 | 传输形态 |
| --- | --- |
| `POST /api/ai/generate` | SSE 文本生成事件 |
| `POST /api/agent`、`POST /api/singleAgent/run` | NDJSON Agent 事件 |
| `GET /api/browser/stream` | NDJSON 浏览器事件 |
| `POST /api/providers/debug/run` | NDJSON 供应商调试事件；多租户禁止直接调试旁路 |
| `GET /api/ai/media/balanceEvents` | 独立模式供应商余额 SSE；多租户公开入口禁止 |
| `GET /api/mcp/control/events` | MCP 页面控制 SSE，配合 state/result 回传 |
| `POST /api/ffmpeg/execute`、`GET /api/ffmpeg/events` | FFmpeg SSE |
| `POST /api/ai/media/generate` → `POST /api/ai/media/tasks/status` | 持久媒体任务与状态查询；取消使用 tasks/cancel |
| `/mcp`、`/a2a/:name` | 协议 SDK 管理的流式响应与会话／任务 |

## 刷新清单时的依据

自动路由由 [core.ts](../apps/server/src/core.ts) 生成：文件相对路径转为 `/api` 路径，`index.ts` 对应所在目录。HTTP 方法以每个路由文件的注册语句为准，不能从 get/save 等文件名猜测。上面的数量来自当前源码，后续增减路由应同步本清单；本次不执行路由生成、不改变业务源码。
