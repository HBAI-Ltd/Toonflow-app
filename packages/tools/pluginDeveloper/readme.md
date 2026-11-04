# 插件开发工具

这是 Toonflow 的内置工具，源码位于 `packages/tools/pluginDeveloper`，随默认工具构建和打包。节点和工具的源码编译复用现有脚手架与工作区依赖，无需注册本地链接。

在本工具目录构建，产物为仓库根目录的 `build/tools/pluginDeveloper.tool.js`。常用依赖会预编译并压成 ZIP 嵌入该文件，构建时按最终 JS 的实际字节数限制在 10 MB 以下：

```sh
bun run build
```

仓库根目录的 `bun run build:tools` 会一并构建此工具；`bun run dev:plugins` 或以 `NODE_ENV=dev` 构建时同步到 `data/tools/`。

执行类型检查：

```sh
bun run typecheck
```

需要维护完整 SDK 时，可单独构建当前系统与架构的归档和校验清单，产物写入本工具目录的 `build/`：

```sh
bun run build:sdk
```

工具以单个 `.tool.js` 随应用提供。首次 `build` 校验并解开内置 ZIP，之后复用缓存。使用宿主 Zod 的工具、普通 CSS 的 Vue 界面和使用节点骨架、共享组件的节点可直接离线构建。缓存位于工具文件同级的 `pluginResources/pluginDeveloper/`，卸载时一并清理。`guide` 直接读取内置文档。

项目显式使用仅完整 SDK 提供的依赖时，构建才会尝试复用或下载兼容的 1.2.0 完整 SDK。项目语法和路径校验错误直接返回给调用方。
