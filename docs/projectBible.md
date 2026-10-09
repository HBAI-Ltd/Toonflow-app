# Toonflow 项目圣经

> 这是 Toonflow 的迭代前必读文档。它记录项目当前的产品边界、运行链路、模块职责、数据边界和变更流程。代码与配置是最终事实来源；当文档与实现不一致时，先修正文档，再按实现确认变更方案。

## 文档状态

- 适用仓库：`HBAI-Ltd/Toonflow-app`
- 基线：当前工作区代码（2026-10-09）
- 维护方式：涉及目录职责、启动方式、数据位置、路由规则或扩展协议的改动，必须同步更新本圣经或对应子文档。
- 阅读顺序：本文 → [项目架构](./projectArchitecture.md) → [运行与构建](./projectRuntime.md) → [数据边界](./projectDataBoundaries.md) → [迭代流程](./projectIteration.md)。

## 1. 项目概要

Toonflow 是一个开源的 AI 短剧、漫剧和短视频创作平台。用户在无限画布中组织剧本、文本、角色、场景、图片、音频、视频和导演预演，并通过 Agent、模型提供方、MCP 和插件扩展创作流程。

项目同时提供三种运行形态：

| 形态 | 入口 | 说明 |
| --- | --- | --- |
| Web 开发 | `apps/web` + `apps/server` | Vite 提供页面，业务 Server 提供 API，适合日常开发。 |
| 独立服务 | `apps/server/src/index.ts` | 单进程监听 `3000`，静态托管构建后的 Web，可用于服务器或 Docker。 |
| 桌面应用 | `apps/desktop` | Electrobun 宿主加载构建后的 Web，并复用 `@toonflow/server/app`，处理原生文件、协议和更新。 |

核心产品原则：

1. 创作状态以工作区文件和应用设置为基础，不把业务数据隐藏在浏览器缓存里。
2. Web、独立 Server 与桌面端共享服务端业务能力；差异只放在宿主适配层。
3. 节点、工具、技能、扩展、提供方和团队是可安装资源，源码与 `data/` 中的运行副本分离。
4. 文件写入、插件安装、模型调用和导出失败必须向调用方暴露，不能吞错后返回成功。

## 2. 代码地图

| 目录 | 责任 | 变更入口 |
| --- | --- | --- |
| `apps/web/src` | 页面、画布、Agent UI、Pinia 状态、前端 API 封装 | Vue 页面、组件、`stores/`、`lib/` |
| `apps/server/src` | HTTP API、Agent、A2A、MCP、媒体、工作区和导出 | `app.ts`、`routes/`、`utils/`、`agent/` |
| `apps/desktop` | Electrobun 主进程、桌面协议、原生保存、更新 | `src/`、`scripts/` |
| `apps/updateServer` | 更新文件发布与更新服务 | 独立 Node/Bun 服务 |
| `packages/nodes` | 画布节点 | 每个目录独立构建为 `.umd.js` |
| `packages/tools` | Agent 工具和工具 UI | 每个目录独立构建为 `.tool.js` |
| `packages/ext` | 文件类型和界面扩展 | 每个目录独立构建为扩展包 |
| `packages/providers` | 语言/媒体模型提供方适配 | `src/` 及导出声明 |
| `packages/skills` | 全局技能和工作流知识 | `SKILL.md` 与附属资源 |
| `packages/teams` | Agent 团队包 | `team.json`、成员提示词、知识和技能 |
| `packages/mcp` | MCP HTTP/stdio 能力 | MCP 路由、资源、技能入口 |
| `packages/file` | 文件原语、原子写入和按路径协调 | 其他模块通过 `@toonflow/file` 使用 |
| `packages/i18n` | 语言检测、消息格式化和 Element Plus 字典 | 前后端共用 |
| `packages/*Scaffold` | 节点、工具、扩展、团队的开发脚手架 | 仅抽取真实复用的构建约定 |
| `data` | 本地设置、安装资源和开发运行数据 | Git 忽略，禁止提交真实数据 |
| `build` | 构建产物 | 可删除重建，不是源码编辑入口 |

## 3. 端到端链路

### 3.1 Web 开发

`apps/web/src/main.ts` 创建 Vue 应用、Pinia、路由和多语言；`apps/web/src/router/index.ts` 进入 hello、home、workspace 页面。Vite 开发服务默认监听 `5173`，将 `/api`、`/a2a`、`/mcp` 代理到 Server 的 `3000`。

### 3.2 Server

`apps/server/src/index.ts` 根据源码或构建位置定位应用根目录，确定 `TOONFLOW_DATA_DIR` 后调用 `createApp`。`createApp` 按顺序初始化插件副本、设置语言回退、加载模型、注册自动生成的 API 路由、MCP、A2A 和静态 Web，并在最后挂载统一错误处理。

`apps/server/src/core.ts` 扫描 `src/routes/**/*.ts` 生成 `src/router.ts`。文件相对路径决定 `/api` 后的路径，接口文件内部只注册一个方法和 `"/"` 路径。`router.ts` 是生成物，禁止手工维护。

### 3.3 桌面

桌面构建将 Web、MCP、节点、工具、扩展、提供方和启动资源复制到 `build/desktop/app`。桌面宿主加载 Web 页面并通过 `@toonflow/server/app` 复用 Server；桌面专属能力通过 `/api/desktop` 和协议/原生辅助程序接入。桌面端开发不依赖同时运行 `bun run dev`。

### 3.4 Agent 与扩展

Agent 请求由 Server 处理，工具来自 `packages/tools` 或 `data/tools`，技能来自 `packages/skills`、工作区技能或 `data/skills`，模型由 `packages/providers` 和设置配置决定。MCP 对外暴露受授权的工具与资源，A2A 提供 Agent 间调用入口。节点负责画布内交互，工具负责 Agent 能力，二者不要互相承担宿主职责。

## 4. 关键不变量

- 服务端所有输入使用现有 `validateFields`/Zod 校验；校验不会把解析后的默认值写回请求对象。
- JSON API 使用 `{ code, data, message }`，复用 `success`/`error`；HTTP 状态码由路由或统一错误处理中间件设置。
- 全局设置只有 `apps/server/src/utils/conf` 创建 `conf` 实例；设置保存是完整覆盖语义。
- 前端工作区文件统一使用 `apps/web/src/lib/workspaceFiles.ts` 的 `useWorkspaceFiles`，路径是工作区相对路径，目录是绝对路径。
- 覆盖快照使用 `writeAtomic`/`writeAtomicSync`；不能用“先检查再覆盖”代替独占创建。
- `data/`、`build/`、日志、个人配置和真实素材不进入提交。
- 新增、移动、重命名或删除 Server 路由后必须生成 `apps/server/src/router.ts`。
- 组件文件和新增目录遵循根目录 `AGENTS.md` 的小驼峰规范；`.vue` 顶层顺序固定为 template、script、style。
- 仓库不新增测试文件；验证使用已有的类型检查、构建和必要的手动 HTTP/界面操作。

## 5. 文档索引

| 文档 | 关注点 |
| --- | --- |
| [项目架构](./projectArchitecture.md) | 模块依赖、调用方向、入口和扩展装载关系 |
| [运行与构建](./projectRuntime.md) | 本地开发、桌面、独立 Server、Docker 和常用命令 |
| [数据边界](./projectDataBoundaries.md) | `data/`、工作区、设置、插件和构建产物的读写边界 |
| [迭代流程](./projectIteration.md) | 改动前检查、按范围验证、路由和文档同步清单 |
| [开发与扩展指南](./development.md) | 面向开发者的插件、发布和平台说明 |
| [贡献指南](../CONTRIBUTING.md) | Issue、PR、贡献和安全边界 |
| [开发规范](../AGENTS.md) | 代码、命名、文件操作、Server 和验证规范 |

## 6. 发现与待确认事项

- 项目同时保留 Web 开发数据与桌面/独立服务运行数据的能力，任何新功能都应明确数据目录，不要隐式使用 `process.cwd()`。
- `agentsRoot` 当前在独立入口和桌面配置中被注释，团队源码仍可单独构建；涉及团队恢复或打包时必须重新确认这两个装载点。
- 路由生成依赖开发阶段执行 `buildRoute`；生产构建使用已生成的 `router.ts`，不能把动态扫描当作部署时行为。
- 真实模型、媒体生成、桌面安装/升级和跨平台原生行为不能由类型检查或 Web 构建代替验证。
