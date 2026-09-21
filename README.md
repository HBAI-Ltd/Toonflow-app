# toonflow

Bun Workspaces 项目，默认使用 TypeScript。Web 使用 Vue、Element Plus；独立 Server 使用 Express；桌面使用 Electrobun，在一个 Bun 主进程中运行共享 Server 和 Web。

## 目录

```text
apps/web/           页面与前端资源
apps/server/        业务 Server，桌面复用其 createApp
apps/desktop/       桌面入口、构建脚本与 Windows 安装器
apps/updateServer/  可独立部署的更新文件服务器与发布命令
packages/assets/    共享图片和图标
packages/providers/ 内置供应商，src/language 为语言模型，src/media 为媒体模型
packages/skills/    内置技能目录，每个技能一个子目录
packages/startup/   原生启动窗口、两阶段 Lottie 动画及播放库
compat/macIntel/    Intel Mac 的 Electrobun 1.18.1 兼容构建
build/              Web、Server、桌面构建产物
```

## 环境准备

使用 Bun 1.3.14，在仓库根目录执行：

```sh
bun install
```

Windows x64 和 Apple Silicon 使用 Electrobun 2.0.1。若首次构建前需要单独做类型检查，先执行 SDK 原生命令 `bun apps/desktop/node_modules/electrobun/bin/electrobun.cjs prepare` 准备 SDK。

Intel Mac 使用独立的 1.18.1，首次在 `compat/macIntel` 目录执行 `bun install --frozen-lockfile`，再运行桌面构建或开发命令生成适配文件。类型检查直接读取当前源码和已有 SDK 文件，不安装依赖或重建目录。

## 开发和构建

```sh
bun run dev:plugins         # 开发前构建节点和工具，并同步到 data
bun run dev                 # 同时启动 Web 和独立 Server
bun run dev:web
bun run dev:server
bun run dev:desktop         # 先执行 dev:plugins 并构建 Web，再启动桌面
bun run build               # 输出 build/web、build/server、build/skills、build/providers
bun run build:desktop       # 构建当前平台的桌面应用
bun run package:desktop     # 当前平台安装包：Windows NSIS / Mac DMG
bun run typecheck           # 单独执行类型检查
```

构建与类型检查分开执行。Server 和桌面主进程构建开启 Bun 压缩。Web 为兼容 vue-tsc 使用 TypeScript 6，其他子包使用 TypeScript 7。Web 开发服务默认端口为 5173，独立 Server 为 3000；`bun run start:server` 运行已构建的 Server。

`build:nodes`、`build:tools` 各自清理对应的 `build/` 产物目录后构建，不改动已安装的 `data/nodes`、`data/tools`。需要开发同步时显式执行 `dev:plugins`；单个节点的监听命令也会同步到 `data/nodes`。根目录 `dev` 不隐式构建插件。

独立 Server 使用单进程。桌面直接调用共享 createApp，在主进程监听 `127.0.0.1:0`，由系统分配空闲端口；页面与 API 使用实际分配的同一地址，不启动业务 Server 子进程。Windows 协议启动器通过 `Resources/desktopRuntime.json` 获取运行中应用的端口。HTTP 连接随主进程退出释放。

项目列表、引导状态和开发者开关通过现有设置接口保存在 `data/settings.json` 的 `settings.stores` 中，启动时先读取设置再初始化 Pinia，不受端口变化影响。首次迁移会保留当前来源可读取的旧 localStorage；旧固定端口的缓存无法直接跨来源读取。

桌面 HTTP 接口统一放在 `apps/server/src/routes/desktop/`，一个接口一个文件，包括供应商文件选择与读取、目录选择、窗口就绪、开发者工具和更新操作。桌面入口通过 `app.locals.desktop` 提供原生能力，Server 负责路由、参数校验、同源限制和统一 JSON 响应；独立 Server 不提供这些原生能力，访问返回 404。共享类型通过 `@toonflow/server/desktop` 导出。

## 网页安装插件

桌面安装后支持 `toonflow://install?type=<类型>&url=<编码后的下载地址>`。网页可生成链接并绑定到安装按钮：

```ts
const link = new URL("toonflow://install");
link.searchParams.set("type", "node");
link.searchParams.set("url", "https://example.com/plugins/exampleNode.umd.js");
window.location.href = link.href;
```

| type | 下载文件 | 安装位置 |
| --- | --- | --- |
| `node` | 节点脚手架生成的 `exampleNode.umd.js` | `data/nodes/` |
| `tool` | 工具脚手架生成的 `exampleTool.tool.js` | `data/tools/` |
| `skill` | `SKILL.md`、`.tar`、`.tar.gz` 或 `.tgz` | `data/skills/<name>/` |
| `provider` | 现有媒体供应商格式的 `exampleProvider.ts` | `data/providers/` |

下载地址须为 HTTP/HTTPS，文件名从 URL 路径获取。技能包必须含一个 `SKILL.md`，其 frontmatter 包含 `name` 和 `description`，其他资源与它位于同一目录；压缩包使用普通 USTAR 格式，不含链接或 PAX/GNU 扩展条目。技能包和其他插件最多 20 MB（技能解压后同样限制），供应商最多 2 MB。安装不会覆盖同名文件。

应用先显示插件类型、文件名和完整下载地址，确认后才下载并安装。节点、工具和技能会进入已安装插件列表；供应商出现在图像视频模型设置中。取消不下载、不写文件。网页无需也不能直接调用桌面安装接口。

Windows 由 NSIS 为当前用户注册协议，已安装版本自动更新后会在启动时补注册；构建本身不修改系统注册表。macOS 通过应用的 URL Scheme 注册，需要将应用放入 `/Applications` 或 `~/Applications`。普通浏览器开发与 Linux Server 不注册桌面协议。

## 启动动画

桌面通过 `@toonflow/startup` 的 `showNativeSplash(assetDir, onClose)` 显示原生透明无边框窗口，返回 `finish()` 和 `close()`。`assetDir` 指向打包后的 `startup` 资源目录。Windows 使用 Win32，macOS 使用 AppKit；动画内容和两阶段播放逻辑共用，不创建额外 WebView。

启动时循环绘制 Logo，主窗口保持隐藏。Windows 动画在同一进程的独立 Worker 中绘制并处理窗口消息，不受服务初始化阻塞。首页路由完成、Vue 挂载和页面加载完成后，通过同源 `/api/desktop/ready` 通知主进程；保留完整动画收尾帧，但最多播放 600ms 后显示主窗口。普通浏览器直接进入首页，已移除原来的 `/loading` 页面和固定等待。

卸载入口和协议的注册修复在主窗口显示后异步执行。

Windows 启动窗口显示在任务栏，可从任务栏关闭或使用 Alt+F4；即使页面一直没有就绪，也能退出。用户关闭优先于动画收尾，不会再显示主窗口。macOS 使用普通应用的 Dock 显示策略，退出沿用 Electrobun 的原有流程。

动画文件是 `packages/startup/assets/startup.json`，保留 `loading`、`ready` 标记即可替换素材。文字为矢量轮廓，运行时不依赖指定字体。Windows x64 运行库已随源码提供，许可和重建方式在 `packages/startup/assets/`。

macOS 首次构建需要先在 Mac 上显式执行以下命令，生成当前架构的原生库；需要已安装 Xcode Command Line Tools。脚本首次下载固定版本 ThorVG 源码并校验摘要，不安装工具；普通桌面构建不会隐式下载或编译原生库。

```sh
bun packages/startup/scripts/buildMac.ts
bun run build:desktop
```

Intel 和 Apple Silicon 分别使用 `macX64`、`macArm64` 资源。macOS 的原生窗口和动态库需要在对应机器上实际验证；Windows 构建通过不能代替这项验证。

Web 使用 Vue Router 和 Element Plus 按需导入。组件标签采用小驼峰；Element Plus 的小驼峰 API 别名需要显式导入及其样式。`src/types/components.d.ts` 由插件生成并随源码保留，供首次类型检查使用。

## 桌面安装包

Windows 需要 NSIS，默认路径为 `C:/Program Files (x86)/NSIS/makensis.exe`，可用 `NSIS_PATH` 覆盖。安装包位于 `build/desktop/artifacts/toonflow-<版本>-Setup.exe`。首次打包下载微软 WebView2 引导程序，打包时验证微软签名，安装器在缺少运行时时提示补装。

Windows 安装器支持选择安装目录，首次默认使用 `%LOCALAPPDATA%/local.toonflow.desktop/stable`，重新安装时读取已记录的位置。完成页默认勾选“立即打开 Toonflow”。安装包仅保存一份完整应用 tar，由 Windows 系统 `tar.exe` 解压到 `app/`，原始 tar 保留在 `self-extraction/<hash>.tar`。NSIS 卸载器使用 `UninstallNSIS.exe`，按安装时记录的实际目录卸载；不嵌套 Electrobun Setup。不具备应用内更新能力的旧版，先用新版安装包覆盖安装。

卸载会清理程序、全部更新基线和 SDK 辅助文件。卸载确认页提供“同时删除用户数据”复选框，默认不勾选，保留 `data/` 和保存项目列表等本地状态的 `WebView2/`；勾选后会一并清理这两个目录，静默卸载仍保留数据。

安装写入和卸载删除前，会检查目标安装目录内的程序是否仍在运行。检测到运行中时先提示关闭，可重试或取消；检查失败也会停止操作，静默模式返回非零状态，不强制结束进程。

NSIS 安装时使用随包 Bun 写入 SDK 安装记录并复制 SDK 原生助手，避免首次启动触发 SDK 的 PowerShell 补登记流程。Windows 应用内更新由随包的 `updateHelper.exe` 执行，安装目录从正在运行的应用位置确定，不要求位于 SDK 默认目录。

Windows 启动动画在加载本地服务前显示，窗口、绘制和消息循环运行在同一进程的独立 Worker 线程，避免服务或 WebView2 初始化阻塞后出现“未响应”；页面就绪后的动画收尾最多 600ms。动画失败时记录错误并继续启动，用户主动关闭启动窗口才取消启动。

桌面构建会先构建 `packages/tools/*`、`packages/nodes/*`，并把产物打包到 `Resources/app/tools`、`Resources/app/nodes`；`packages/providers/src` 按 `language/`、`media/` 分类原样打包到 `Resources/app/providers`。语言模型面板使用 `languageProviders` 预设，媒体模型面板使用 `mediaProviders`，同一厂商可以分别提供两种定义。

后端 `apps/server/src/app.ts` 的 `autoInstallProviders` 白名单包含 `tfRouter.ts`，首次启动只复制缺少的白名单供应商，其余由用户在设置中主动添加。供应商初始化后不随桌面构建升级覆盖，保留用户修改；语言预设仍由用户填写配置后保存到设置，不作为媒体供应商安装。

桌面节点和工具的 `initialized` 标记记录应用构建 hash。升级或降级后的首次启动会用随包文件覆盖同名内置节点和工具，恢复随包提供但已卸载的节点和工具；普通重启不重复同步。Windows 安装器只清除节点和工具的初始化标记，因此同版本重装也会在首次启动时同步这两类插件。供应商、技能、第三方插件、用户设置和素材保留；包内已不再提供的旧插件不会自动删除。macOS 覆盖相同构建不会触发同步。

`packages/skills/` 原样打包到 `Resources/app/skills`，首次初始化时复制到 `data/skills/`，包含 `SKILL.md` 和附带资源，不覆盖已有文件。独立 Server 构建输出 `build/skills/`，部署时一并携带；开发环境从源码目录初始化，运行时均使用 `data/skills/`。桌面和独立 Server 的技能均沿用首次初始化标记，不随构建升级覆盖，空目录不写标记。

Agent 每次发送消息时同时扫描全局 `data/skills/` 和当前工作区的 `skill/`，同名技能优先使用工作区版本。“Skill 操作器”统一提供目录查询、读取、新建和修改，三个读写权限默认开启；新建默认保存在工作区，也可指定全局范围。技能说明与权限随工具打包，发布只需一个 `.tool.js`。

Mac 在对应架构机器上执行相同的 `build:desktop`、`package:desktop` 命令，不支持跨系统或跨架构构建。Intel 与 Apple Silicon 产物分别在 `build/desktop/artifacts/macX64/`、`macArm64/`。两者共用 `packages/assets/logo.iconset`，默认通过 Electrobun 对应用、更新包内的应用和 DMG 做 ad-hoc 临时签名，不进行 Apple 公证。可用 `ELECTROBUN_DEVELOPER_ID` 覆盖签名身份，正式分发还需要配置公证。

将 DMG 内的应用复制到 `/Applications/` 或 `~/Applications/` 后再运行。ad-hoc 签名不代表通过 Gatekeeper；浏览器或微信下载的测试包仍可能被隔离。仅对自己构建且确认来源的测试版本，可移除该应用的隔离属性（按实际安装位置调整路径）：

```sh
xattr -dr com.apple.quarantine "/Applications/toonflow.app"
```

此操作仅作用于指定的测试应用，不关闭系统 Gatekeeper，也不替代正式签名和公证。

## GitHub Actions

- `debug.yml`：在 Actions 中手动运行 **Debug desktop build**，选择 `windowsX64`、`macArm64`、`macX64` 或 `all`。`ref` 可填写分支、标签或提交，留空使用当前选择的代码；`version` 可填写 `2.0.1`，留空优先使用 `vX.Y.Z` 标签，否则使用项目配置版本。完成后在运行摘要中输出下载链接，产物保留 7 天，需要登录 GitHub 下载，不创建 GitHub Release。
- `release.yml`：推送 `vX.Y.Z` 标签（如 `v2.0.1`）后，复用同一构建流程，分别在 `windows-2025`、`macos-15`（Apple Silicon）、`macos-15-intel` 构建；全部成功后，将安装包及完整更新文件上传到对应 GitHub Release。当前版本号仅支持 `X.Y.Z`，与现有桌面发布脚本一致。

工作流固定使用 `package.json` 中的 Bun 版本，自动准备 NSIS、Mac 原生启动库和 Intel 兼容 SDK。本次仅包含 Windows/macOS 桌面端；手动 debug 是打包验证，未自动启动 GUI 或安装应用。

可在仓库 **Settings → Secrets and variables → Actions → Variables** 配置 `UPDATE_BASE_URL`，写入应用使用的更新服务地址；未配置时沿用项目配置。工作流使用 `release:desktop <版本> --initial` 生成完整包，不请求旧版基线、不生成增量补丁，也不执行 `publish:update`；独立更新服务仍按下文单独发布。Mac 上传前会解包检查图标、Bun 和应用入口，并验证应用签名、DMG 完整性及签名；这些检查不等于通过 Gatekeeper 或真机启动验证。

## 更新构建和发布

更新服务独立运行，不随业务服务启动，也不进入桌面包：

```sh
bun run start:updateServer
# 或监视源码变更
bun run dev:updateServer
```

默认监听 `127.0.0.1:8091`。部署到其他机器时修改 `apps/updateServer/src/index.ts` 的 `host`、`port`，桌面构建时设置 `updateBaseUrl` 为可访问的文件根地址。

构建和发布分开，以下版本号仅为示例，同一目标应使用未发布的新版本：

```sh
# 首次基线：构建安装包与完整更新归档
bun run release:desktop 2.0.0 --initial
bun run publish:update build/desktop/releases/2.0.0
# 后续版本：服务器仍保留上一版时，先构建增量，再发布
bun run release:desktop 2.0.1
bun run publish:update build/desktop/releases/2.0.1
```

Mac 的版本目录增加 `macX64/` 或 `macArm64/`，例如 `build/desktop/releases/macX64/2.0.1`。更新服务支持 Intel 旧清单和 Windows、Apple Silicon 新清单。服务器在另一台机器时，将版本目录复制过去，再执行 `bun run publish <版本目录>`；详见 [更新服务说明](apps/updateServer/readme.md)。

构建和服务器端均保留版本快照，同一目标的相同版本禁止重复发布。快照复制或发布失败时只清理本次新建的快照目录，允许重试；已存在的快照保留。发布先替换归档与补丁，最后切换清单，并保留历史补丁；失败时不回滚已替换的公开文件。常规 build/package 不访问更新服务器，只有非 initial 的 release 开启增量构建。

桌面端在设置的“关于”页面检查更新、下载更新包，再点击“重启并更新”。下载期间可以继续使用应用，重启前请先完成正在进行的任务。独立 Web 提示使用桌面客户端，dev 通道不执行更新检查。桌面更新接口沿用同源限制；下载和应用接口不接受外部传入的安装路径或更新包路径。

Windows 复用原有 `.patch`、`bspatch` 和完整包；保留安装后的 `self-extraction` 原始 tar，缺少基线、补丁不可用或超过 8 跳时回退到完整包下载。准备记录只保存版本、hash 和 SHA-256，完整搬迁安装目录后仍可识别。助手在退出前验证归档和暂存解包，退出后只交换 `app/`，保留 `data/`、`WebView2/`；替换或启动失败时恢复旧版本。旧 `app` 暂存在 `self-extraction/appPrevious-<事务号>`，新版本成功运行并读取更新状态后再清理；不提供断电后的自动恢复。macOS 继续使用原 SDK 更新器。
