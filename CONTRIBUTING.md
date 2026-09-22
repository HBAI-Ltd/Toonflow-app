# Contributing · 贡献指南

欢迎参与 Toonflow。无论是反馈问题、改进文档、开发插件，还是修复代码，都可以帮助创作者更顺畅地完成作品。

参与讨论和协作前，请阅读 [社区行为准则](./CODE_OF_CONDUCT.md)。项目介绍和使用方法见 [README](./README.md)，完整开发说明见 [开发与扩展指南](./docs/development.md)，代码修改以 [开发规范](./AGENTS.md) 为准。

## 从哪里开始

- **报告问题**：在 [GitHub Issues](https://github.com/HBAI-Ltd/Toonflow-app/issues) 搜索已有记录，再补充信息或提交新问题。
- **提出建议**：说明创作场景、遇到的限制和期望结果；较大的功能或架构调整建议先讨论范围与影响。
- **改进文档**：修正错误、补全步骤，或提供能够复现的操作说明。
- **开发扩展**：参考 [节点脚手架](./packages/nodeScaffold/readme.md)、[工具脚手架](./packages/toolScaffold/readme.md) 和现有实现。
- **贡献代码**：选择一个明确的问题，提交范围集中的 Pull Request（PR）。

不必等到能修改代码才参与。清晰的复现步骤、经过脱敏的截图和实际使用反馈同样有价值。

## 提交 Issue

一个 Issue 尽量只描述一个问题，标题直接说明出错位置或期望行为。请提供：

1. Toonflow 版本；从源码运行时附上相关提交或分支信息。
2. 操作系统、处理器架构，以及桌面端或浏览器运行方式。
3. 从初始状态开始的最短复现步骤，注明是否每次都出现。
4. 期望结果与实际结果，必要时附截图或短视频。
5. 与问题有关的错误日志，保留错误上下文并删除无关内容。
6. 涉及插件或模型时，注明插件版本、提供方与模型名称。

请先删去 API Key、访问令牌、账号信息和个人路径。不要上传完整 `data/`、真实用户配置、私有工作区或未经授权的素材；需要示例时，使用最小的脱敏内容。

涉及安全漏洞或不宜公开的敏感信息时，请通过 [联系邮箱](mailto:ltlctools@outlook.com) 说明情况，避免在公开 Issue 中披露可被利用的细节。

## 准备开发环境

本仓库使用 Bun Workspaces，Web、业务 Server 和桌面端在同一个仓库中开发，无需另行克隆前端仓库。

- 安装 Git 和根目录 `package.json` 中指定的 **Bun 1.3.14**，使用 `bun --version` 确认版本。
- 使用 Bun 安装依赖、运行脚本，不混用 npm、Yarn 或 pnpm 的安装流程。
- 除特别说明外，下面的命令都在仓库根目录执行。桌面端另有平台要求，见下方说明。

需要提交 PR 时，可以先 Fork 仓库，再克隆自己的 Fork；下面演示从项目仓库开始：

```sh
git clone https://github.com/HBAI-Ltd/Toonflow-app.git
cd Toonflow-app
bun install
```

### Web 与业务 Server

```sh
# 首次开发或修改节点、工具后，构建并同步到 data/
bun run dev:plugins

# 同时启动 Web 与业务 Server
bun run dev
```

打开 `http://localhost:5173`，若该端口被占用，以 Vite 终端输出为准。业务 Server 监听 `3000`；Vite 将 `/api`、`/a2a`、`/mcp` 代理到 `127.0.0.1:3000`。启动失败时先检查端口占用，不要重复启动同一服务。

`dev` 只启动 Web 和 Server，**不会自动执行 `dev:plugins`，也不会启动桌面窗口**。日常开发按需选择：

| 命令 | 用途 |
| --- | --- |
| `bun run dev:web` | 只启动 Vite；需要接口的功能仍依赖另行启动的业务 Server。 |
| `bun run dev:server` | 只启动业务 Server，使用 Bun 监听源码变化。 |
| `bun run dev:plugins` | 一次性构建节点、工具并同步到 `data/`，不是持续监听命令。 |
| `bun run dev:desktop` | 完成下方平台准备后，构建并启动桌面应用。 |

更新服务与业务 Server 相互独立，普通开发无需启动。涉及更新功能时再按 [更新服务说明](./apps/updateServer/readme.md) 使用 `bun run dev:updateServer`。

### 桌面开发（按需）

桌面脚本支持 **Windows x64、macOS arm64 和 macOS x64**，需要在对应系统与架构上运行；当前不支持 Linux 桌面构建。

- **Windows x64**：使用 Electrobun 2.0.1。运行窗口需要 WebView2；构建脚本会调用 `%WINDIR%/Microsoft.NET/Framework64/v4.0.30319/csc.exe` 编译原生辅助程序。NSIS 是制作 Windows 安装包的要求，不是普通 Web 开发或桌面开发的前置条件。
- **macOS**：先安装 Xcode Command Line Tools。Apple Silicon 使用 Electrobun 2.0.1；Intel Mac 使用独立的 Electrobun 1.18.1 兼容构建，先安装其依赖：

```sh
# 仅 Intel Mac 需要；执行后回到仓库根目录
cd compat/macIntel
bun install --frozen-lockfile
cd ../..
```

Apple Silicon 与 Intel Mac 都需要在各自的 Mac 上准备当前架构的原生启动库，首次桌面开发或更新原生启动实现后执行：

```sh
bun packages/startup/scripts/buildMac.ts
```

完成对应平台准备后，启动桌面开发：

```sh
bun run dev:desktop
```

该命令会同步开发节点和工具、构建 Web 与 MCP，再启动桌面应用。桌面宿主复用业务 Server，并监听系统分配的本机端口，**不需要提前运行 `bun run dev`**。它使用构建后的 Web 页面，不是 Vite 热更新页面；修改 Web 后需重新构建再验证。

目录选择、原生保存、协议唤起和更新等行为必须在桌面宿主中验证，浏览器验证不能替代。安装包、SDK 准备和平台限制详见 [开发与构建指南](./docs/development.md)。

## 定位代码与开发扩展

| 改动范围 | 主要入口 |
| --- | --- |
| 页面、画布、设置与前端状态 | `apps/web/src/` |
| HTTP 接口、Agent 运行时与服务端工具 | `apps/server/src/` |
| 桌面宿主、原生交互、安装与更新 | `apps/desktop/`；Intel Mac 兼容层在 `compat/macIntel/` |
| 画布节点 | `packages/nodes/`、[节点脚手架](./packages/nodeScaffold/readme.md) |
| Agent 工具及其交互组件 | `packages/tools/`、[工具脚手架](./packages/toolScaffold/readme.md) |
| 模型提供方与技能 | `packages/providers/src/`、`packages/skills/` |

修改节点或工具时，编辑 `packages/` 中的源码，再运行 `bun run dev:plugins`。它会写入 `build/nodes/`、`build/tools/`，并**覆盖 `data/nodes/`、`data/tools/` 中的同名开发产物**；不要直接修改这些产物来代替源码改动。该命令不清理旧产物，改名或删除插件后需检查开发目录中的残留文件。

`bun run build:nodes` 和 `bun run build:tools` 则分别清空对应的 `build/` 子目录后重新构建，不同步到 `data/`。不要把生产构建当作开发插件同步。其他扩展方式见 [开发与扩展指南](./docs/development.md)。

## 数据与工作区边界

- Web/Server 开发默认使用仓库根目录的 `data/`，桌面开发脚本也显式使用该目录。这里包含设置、插件等本机数据，必须保持 Git 忽略；不要与日常使用的数据混用，也不要让多个服务进程同时写同一数据目录或工作区。
- 验证配置或文件写入时，使用独立的临时数据目录和工作区。独立 Server 可在启动前设置 `TOONFLOW_DATA_DIR`；复用 `createApp` 时通过 `dataDirectory` 传入，且必须在动态加载路由前确定目录。先确认实际读写位置，再执行保存、覆盖或删除操作。
- 前端工作区文件操作统一复用 `apps/web/src/lib/workspaceFiles.ts` 默认导出的 `useWorkspaceFiles`，不要重复封装 Axios 或拼接文件接口。文件 `path`、`target` 使用工作区内相对路径，目录参数使用绝对路径。
- 防抖、保存队列或跨 `await` 的多步操作先获取目录字符串快照，再使用固定目录实例，避免切换项目后写错目录。`readJson<T>` 不校验业务结构，调用方仍须检查文件标记与内容。
- 全局设置继续使用设置接口及 `u.conf`，不重复创建配置实例；未经需求不要把完整覆盖保存改成部分合并。项目列表由 Pinia 持久化，移除列表项不等于删除工作区文件。写入失败必须向调用方反馈，不能吞掉异常后返回成功。

## 保持修改集中

开始前先阅读 [AGENTS.md](./AGENTS.md)，再跟踪相关实现与调用方。修复共享逻辑中的根因，优先复用已有工具、Store 和依赖。

- 一次 PR 解决一个明确问题，避免夹带无关重构、格式化或依赖升级。
- 默认使用 TypeScript；新增文件、目录、自有变量、函数及常量统一小驼峰命名，如 `userStore.ts`、`editorPanel/`，不使用短横线、蛇形、大驼峰或全大写。已有例外不是新增代码的依据，类型名保持 TypeScript 的类型命名习惯。
- 函数保持小而聚焦，仅在复用或可读性有明确收益时抽取逻辑。不为简单需求增加抽象层、新框架或重复封装；只实现已经讨论清楚的范围，不擅自添加占位内容或扩展功能。
- 跨工作区使用包名及声明的 exports，不直接穿透其他包的 `src/`。第三方导入保留原始导出名，不为转换大小写添加 `as`；新增 Node 内置模块引用使用 `node:`，仅用于类型的引用使用 `import type`。
- 保留现有格式；Server 使用双引号、分号、两空格缩进。删除未使用的 import 与变量，不添加无意义的 `async` 包装。
- 有意的简化使用 `ACT:` 注释说明；存在已知上限时写清限制和后续升级方向。不以精简为由省略入参校验、安全、无障碍或防止数据丢失的处理。
- 不提交密钥、个人配置、运行数据、工作区素材或无关构建产物。

修改模型提供方时，以实际接口文档和请求、响应为依据。涉及持久化、工作区文件或插件安装时，保留现有的数据边界与失败处理。

### Vue 组件约定

- 自有组件的文件名、导入绑定和模板标签都用小驼峰，例如 `showBox.vue`、`import showBox from "./showBox.vue"`、`<showBox />`。
- 第三方组件优先使用短横线标签，如 `<el-button />`、`<vue-flow />`，脚本导入仍保留 `ElButton`、`VueFlow` 等原始导出名。所有组件模板标签都禁止大驼峰。
- 所有组件属性、动态绑定和具名 `v-model` 参数使用小驼峰，如 `showArrow`、`:nodeTypes`、`v-model:snapEnabled`。`v-if`、`aria-label`、`data-*` 等 Vue 语法、HTML 标准或接口强制名称保留原样。
- `.vue` 顶层区块按 `<template>` → `<script>` → `<style>` 排列；不需要的区块可以省略。DOM 类名及样式选择器使用小驼峰，SCSS 按 DOM 结构嵌套；不手改工具自动生成的声明文件。

### Server 接口约定

- 沿用 Bun、TypeScript、ES Modules 和 Express。独立入口 `src/index.ts` 单进程监听；桌面通过 `@toonflow/server/app` 复用 `createApp`，不导入独立启动入口，不增加 cluster。
- **一个接口一个文件**：`src/routes/` 下的每个 `.ts` 都会被扫描为路由，文件默认导出 Router，只注册一个 HTTP 方法与路径，接口内使用 `"/"`。工具、类型和配置不要放进路由目录，也不为简单接口增加 controller、service、repository 层。
- 路由按文件相对路径生成 `/api` 前缀，大小写与路径一致，`index.ts` 对应所在目录。例如 `routes/settings/get.ts` 对应 `/api/settings/get`，HTTP 方法由文件内的注册语句决定。
- 新增、移动、重命名或删除路由后，执行 `bun run --cwd apps/server routes`。**不要手改 `src/router.ts` 的 imports、注册项或 hash**，也不要依赖构建或文件监听自动补齐；更改 URL 或 HTTP 方法前搜索并同步所有调用方。
- Server 的 `@/` 指向 `apps/server/src/`；业务工具放在 `utils/` 对应模块，通过 `src/utils.ts` 统一导出，接口使用 `import u from "@/utils"`。
- 外部输入复用 `validateFields` 与 Zod，查询参数和路径参数显式指定来源。该中间件只校验，不把默认值、转换或裁剪结果写回请求；需要规范化时显式处理。
- JSON 响应复用 `success`、`error`，保持 `{ code, data, message }`。包装函数不会设置 HTTP 状态，需要时显式调用 `res.status(...)`；普通异常交给统一错误处理中间件，流式响应沿用流内错误处理和资源清理。

## 验证你的改动

根据改动选择已有命令和必要的手动验证，环境准备、类型检查和构建分别执行，不隐式绑定到其他命令。

### 类型检查的桌面前置条件

根目录 `bun run typecheck` 会检查各工作区，包括桌面端。Windows x64 或 Apple Silicon 在首次桌面构建前单独检查类型时，先准备 Electrobun SDK：

```sh
bun apps/desktop/node_modules/electrobun/bin/electrobun.cjs prepare
```

Intel Mac 则先安装兼容 SDK，并运行一次桌面开发或构建命令生成适配文件。类型检查本身不会安装依赖、生成适配文件或编译原生库。只改 Web 或 Server 时，可以先执行下面对应工作区的检查。

### 按改动选择命令

以下命令均从仓库根目录执行：

| 命令 | 适用情况 |
| --- | --- |
| `bun run --cwd apps/server routes` | 服务端路由文件新增、移动、重命名或删除后生成注册文件。 |
| `bun run --cwd apps/web typecheck` | 检查 Web 的 TypeScript 与 Vue 类型。 |
| `bun run --cwd apps/server typecheck` | 检查业务 Server 类型。 |
| `bun run typecheck` | 完成对应环境准备后，检查各工作区类型；适合共享接口或跨包改动。 |
| `bun run --cwd apps/web build` | 验证 Web 构建，输出到 `build/web/`。 |
| `bun run --cwd apps/server build` | 构建 Server、MCP，并输出技能与提供方文件；不代替路由生成。 |
| `bun run build` | 构建工具、Web、Server、MCP，并输出技能与提供方；**不包含节点、桌面构建或类型检查**。 |
| `bun run build:desktop` | 构建当前平台桌面应用及随包资源，包含节点、工具、Web 与 MCP 构建。 |
| `bun run package:desktop` | 重新构建并制作 Windows NSIS 安装包或 macOS DMG，需满足对应平台的打包要求。 |

需要验证构建后的 Web 与独立 Server 时，首次仍先执行 `bun run dev:plugins`，再执行 `bun run build`、`bun run start:server`，访问 `http://localhost:3000`。独立 Server 不负责初始化节点；不能只复制 `build/` 就视作完整安装，也不要与开发 Server 同时占用 `3000`。

仅改文档时，检查内容、命令、链接和 Markdown 展示即可。代码改动按受影响范围进行类型检查、构建或实际操作验证，不要求每次都执行全部命令。

**仓库禁止编写或新增任何测试文件，包括以其他名称或后缀替代的测试文件；默认不新增测试框架或自动检查入口。** 请遵循已有开发规范，通过必要的命令和手动步骤验证改动。

记录真实的检查结果和未验证部分：类型检查与构建通过，不代表真实模型调用、媒体生成、桌面安装、升级或数据持久化已经验证。遇到未改动文件中的已有错误时，注明位置及其对本次验证的影响。

## 提交 Pull Request

从当前代码创建自己的工作分支，保持提交内容围绕本次修改。推送前检查 diff，确认没有混入本机数据和无关文件。

PR 标题直接说明解决的问题，正文建议包含：

- **问题与关联**：原有行为、影响的使用场景，以及相关 Issue。
- **改动结果**：用户会看到什么变化，涉及哪些范围。
- **验证方式**：实际执行的命令、复现步骤和结果；界面改动附上必要截图。
- **验证边界**：未运行的环境、未调用的模型服务，以及尚未验证的安装或升级行为。
- **兼容性影响**：需要用户迁移配置或调整现有流程时，说明具体影响。

根据评审意见继续更新同一个 PR。讨论中有不明确的地方，可以补充背景或解释取舍；提交 PR 不代表改动一定会被合并。

## 许可与素材

Toonflow 采用 [MIT 许可证](./LICENSE)。提交代码、文档、图片、字体或其他素材前，请确认你有权将其用于本项目，并保留需要保留的版权与许可证声明。

第三方依赖和素材遵循各自的许可。请勿提交来源不明、未经授权或含有个人敏感信息的内容。
