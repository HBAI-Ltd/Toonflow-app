# Toonflow 运行与构建

[返回项目圣经](./projectBible.md)

## 环境基线

- Bun `1.3.14`，使用 Bun Workspaces；不要混用 npm、Yarn 或 pnpm 安装依赖。
- TypeScript、Vue 3、Vite、Pinia、Element Plus、Vue Flow、Express 5、Zod、Electrobun 2.0.1。
- 媒体与导出依赖 FFmpeg；桌面端还需要对应平台的 WebView/原生工具链。

## 首次启动

```sh
bun install
bun run dev:plugins
bun run dev
```

访问 `http://localhost:5173`；业务 Server 默认 `http://localhost:3000`。`dev` 不会自动构建或同步插件，也不会启动桌面窗口。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `bun run dev:web` | 只启动 Vite |
| `bun run dev:server` | 只启动业务 Server |
| `bun run dev:plugins` | 构建并同步节点、工具到开发数据目录 |
| `bun run dev:desktop` | 构建 Web/MCP/插件并启动桌面 |
| `bun run --cwd apps/server routes` | 重新生成 Server 路由注册表 |
| `bun run --cwd apps/web typecheck` | Web 类型检查 |
| `bun run --cwd apps/server typecheck` | Server 类型检查 |
| `bun run --cwd apps/web build` | Web 构建 |
| `bun run --cwd apps/server build` | Server/MCP/技能/提供方构建 |
| `bun run build` | 工具、扩展、Web、Server 的仓库构建 |
| `bun run build:desktop` | 当前平台桌面构建 |
| `bun run package:desktop` | 当前平台安装包/DMG 打包 |

## 独立 Server 和 Docker

```sh
bun run dev:plugins
bun run build
bun run start:server
```

独立 Server 从源码或 `build/server` 的文件位置定位仓库根目录，默认使用根目录 `data/`，可用 `TOONFLOW_DATA_DIR` 指定数据目录。Docker 使用 `/app/data`，容器内以 `bun` 用户运行，端口只映射到宿主 `127.0.0.1:3000`。

```sh
docker compose up --build
```

只复制 `build/` 不能视为完整安装；Server 仍需要运行时资源、数据目录和依赖。

## 桌面平台

- Windows x64：需要 WebView2；打包需要 NSIS。
- macOS arm64：使用 Electrobun 2.0.1 和 Xcode Command Line Tools。
- macOS x64：先在 `compat/macIntel` 安装锁定依赖，使用兼容 SDK。
- Linux：当前不支持桌面构建，使用 Web/Server 或 Docker。

桌面开发会构建后的 Web 页面，不提供 Vite 热更新。修改 Web 后重新构建再验证；目录选择、协议唤起、原生保存和更新必须在桌面宿主中验证。

## 发布与更新

桌面发布配置位于 `electrobun.config.ts` 和 `apps/desktop/scripts/`。更新基线默认取 GitHub Release，增量补丁由 `generateUpdatePatch=1` 显式开启。签名、公证和发布凭据只来自 CI Secret，不得写入源码、日志或构建产物。

## 运行排查

1. 启动失败：先检查 Bun 版本、端口 `3000/5173` 和 `logs/toonflow-dev.log`。
2. 插件缺失：先运行 `bun run dev:plugins`，确认 `data/nodes`、`data/tools` 是否为当前源码构建结果。
3. API 不通：确认 Web 代理目标、Server 是否监听，以及 `TOONFLOW_DATA_DIR` 是否可写。
4. 路由不通：确认新增路由后是否执行 `bun run --cwd apps/server routes`。
5. 桌面异常：区分 Web 页面问题、Server 复用问题、WebView2/原生辅助程序和更新流程问题，不用浏览器验证替代桌面验证。
