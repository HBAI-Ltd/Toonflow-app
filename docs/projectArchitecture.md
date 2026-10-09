# Toonflow 项目架构

[返回项目圣经](./projectBible.md)

## 分层关系

```text
用户
  ├─ Web/Vite ───────────────┐
  └─ Electrobun Desktop ─────┤
                              ▼
                    apps/server/src/app.ts
                              ├─ routes/*      HTTP API
                              ├─ agent/*       Agent、A2A、画布桥接
                              ├─ utils/*       工作区、插件、媒体、设置
                              ├─ @toonflow/mcp MCP 路由与资源
                              └─ static Web    构建后的 apps/web
                              │
      ┌───────────────────────┼────────────────────────┐
      ▼                       ▼                        ▼
 packages/file          packages/providers        data/<resource>
 原子文件能力            模型适配                  运行时安装副本
```

## 调用方向

1. 页面和组件调用前端 `lib/`、Store 或 HTTP API，不直接访问服务端文件系统。
2. Server 路由调用 `utils.ts` 统一导出的业务模块；公共文件能力调用 `@toonflow/file`。
3. `packages/file` 只提供文件原语和队列，不承载工作区授权、设置语义或插件事务。
4. 桌面宿主只提供原生能力和启动/更新编排，业务规则放在可复用的 Server 模块。
5. 节点和工具通过脚手架约定接入宿主，不反向导入 `apps/web/src` 或 `apps/server/src` 的私有实现。

## 前端边界

- `pages/` 是路由级页面；`components/` 是可组合界面；`stores/` 保存跨页面状态；`lib/` 放 API/协议/转换等前端基础能力。
- 当前路由为 `/hello`、`/home`、`/workspace`，`/canvas` 兼容重定向到 `/workspace`。
- 工作区文件必须经过 `useWorkspaceFiles`；项目列表由 `workspace` Store 持久化，移除项目不会删除工作区。
- 第三方组件可使用库原始导出名，但模板标签和属性遵守 `AGENTS.md` 的命名约束。

## Server 边界

- `app.ts` 负责装配，不监听端口；`index.ts` 才是独立 Server 启动入口。
- `routes/` 一个文件一个接口，目录结构自动映射 URL；不要在其中放工具或聚合模块。
- `core.ts` 生成路由注册表；手工编辑 `router.ts` 会在下一次生成时丢失。
- `utils.ts` 是业务工具统一出口，路由优先 `import u from "@/utils"`。
- 统一错误处理中间件负责 Zod、文件系统错误和未处理异常；流式接口已发送响应头后自行处理流内错误和清理。

## 扩展装载

| 类型 | 源码 | 构建/运行副本 | 文件形态 |
| --- | --- | --- | --- |
| 节点 | `packages/nodes/*` | `build/nodes` → `data/nodes` | `.umd.js` |
| 工具 | `packages/tools/*` | `build/tools` → `data/tools` | `.tool.js` |
| 扩展 | `packages/ext/*` | `build/ext` → `data/ext` | 扩展 bundle |
| 提供方 | `packages/providers/src` | `build/providers` 或源码目录 → `data/providers` | `.ts` |
| 技能 | `packages/skills` | `build/skills` 或源码目录 → `data/skills` | `SKILL.md`/包 |
| 团队 | `packages/teams/*` | `build/agents` → `data/agents` | Agent 包 |

安装副本由 Server 启动时初始化。节点和工具在开发同步时可覆盖同名运行副本；技能和团队默认只补首次安装，提供方内置文件按源码修订值更新，用户独立文件和配置保留。

## 依赖与复用原则

- 跨工作区引用只使用包名和声明的 exports。
- 文件、原子写入和工作区队列复用 `@toonflow/file`，不在业务模块重复包装原生 `fs`。
- API 响应、校验、语言处理和配置实例复用现有 Server 工具。
- 新增抽象前先搜索调用方；只有存在复用或明显提升可读性时才抽取。
