# 开发与扩展指南

[返回 Toonflow 首页](../README.md) · [文档目录](./readme.md) · [贡献指南](../CONTRIBUTING.md) · [开发规范](../AGENTS.md)

本文收录插件开发、源码运行、桌面打包和更新发布的详细说明。首次参与开发，可先阅读贡献指南。

## 🧩 插件与模型扩展

通过“设置 → 插件市场”发现和管理节点、工具与技能；市场顶部可以直接打开 [网页版市场](https://api.toonflow.net/console/plugIn) 和 [开发者文档](https://qcn7xdsqgc4z.feishu.cn/docx/KNBNd9naqolsy6xjAOCcEAkqnRd)。市场使用“账号与余额”中登录的 Toonflow 账号。

| 扩展类型 | 用途 | 开发入口 |
| --- | --- | --- |
| 节点 | 为画布增加交互组件、输入输出端口与节点操作。 | [节点脚手架](../packages/nodeScaffold/readme.md) · [内置节点](../packages/nodes/) |
| 工具 | 为 Agent 增加工作区操作、搜索、媒体生成等能力，可附带交互 UI。 | [工具脚手架](../packages/toolScaffold/readme.md) · [内置工具](../packages/tools/) |
| 技能 | 用 `SKILL.md` 和附属资料描述创作流程、方法与操作约定。 | [内置技能](../packages/skills/) |
| 提供方 | 适配不同平台的模型列表、请求参数和媒体返回结果。 | [提供方实现](../packages/providers/src/) |

节点与工具的配置表单统一使用 `@form-create/element-ui` 的规则；有必填项未填写时，配置按钮会显示红点。工具只接收自身配置，宿主不向工具直接传递完整应用设置。

媒体接口包含图片、视频和音频的扩展类型，实际能力由各提供方实现。技能既可以全局安装，也可以放在当前工作区的 `skill/` 目录，同名时优先使用工作区版本。

需要从外部 Coding 工具操作 Toonflow 时，在“设置 → MCP”开启服务并复制客户端配置，支持 HTTP 与 stdio 连接。画布和节点等界面操作需要保持 Toonflow 窗口或网页打开，详见 [MCP 接入说明](../packages/mcp/README.md)。

<details>
<summary><strong>通过网页唤起桌面安装插件</strong></summary>

安装桌面客户端后，网页可通过 `toonflow://install` 请求安装插件。应用会先展示类型、文件名和下载地址，用户确认后再下载与安装。

```ts
const link = new URL("toonflow://install");
link.searchParams.set("type", "node");
link.searchParams.set("url", "https://example.com/plugins/exampleNode.umd.js");
window.location.href = link.href;
```

| `type` | 文件格式 | 安装位置 |
| --- | --- | --- |
| `node` | `.umd.js` | `data/nodes/` |
| `tool` | `.tool.js` | `data/tools/` |
| `skill` | `SKILL.md`、`.zip`、`.tar`、`.tar.gz`、`.tgz` | `data/skills/<name>/` |
| `provider` | 媒体提供方 `.ts` | `data/providers/` |

下载地址须为 HTTP/HTTPS，文件名来自 URL 路径。同名节点、工具和技能在版本更高时允许更新；覆盖同版本或降级需在开发者选项中使用强制安装，提供方不覆盖同名项。

普通插件与技能包最多 20 MB，技能解压后也受此限制；提供方最多 2 MB。技能包支持 ZIP 和 TAR，须包含带有 `name`、`description` frontmatter 的 `SKILL.md`，附属资源放在其所在目录内。TAR 包使用普通 USTAR 格式，不包含链接及 PAX/GNU 扩展条目。

Windows 安装器负责注册协议；macOS 需要将应用放入 `/Applications` 或 `~/Applications`。普通浏览器开发模式不注册桌面协议。

</details>

---

## 🛠️ 开发与构建

前端、业务服务和桌面端在同一个 Bun Workspaces 仓库中维护。

| 层级 | 技术 |
| --- | --- |
| 运行时与包管理 | Bun 1.4.3、Bun Workspaces |
| 前端 | Vue 3、Vite、TypeScript、Pinia、Element Plus、Vue Flow |
| 服务端 | Bun、Express 5、Zod |
| Agent | Pi Agent SDK、工具插件、Markdown 技能与记忆 |
| 桌面 | Electrobun；Windows 使用 WebView2 和 NSIS 安装器 |
| 3D 与媒体 | Three.js、FFmpeg、可扩展的媒体提供方 |

### 本地开发

先安装 Git 和项目指定版本的 [Bun](https://bun.sh/)，然后执行：

```sh
git clone https://github.com/HBAI-Ltd/Toonflow-app.git
cd Toonflow-app
bun install

# 首次开发或修改插件后，构建节点和工具并同步到 data/
bun run dev:plugins

# 同时启动 Web 与业务 Server
bun run dev
```

打开 `http://localhost:5173`。独立 Server 默认监听 `3000`，Web 开发服务会代理 API 请求。`dev` 不会自动构建或同步插件，因此首次启动需要上面的 `dev:plugins` 步骤。

### 常用命令

以下命令在仓库根目录执行：

| 命令 | 用途 |
| --- | --- |
| `bun run dev:web` | 单独启动 Web 开发服务。 |
| `bun run dev:server` | 单独启动业务 Server。 |
| `bun run dev:plugins` | 构建节点和工具，并同步到开发数据目录。 |
| `bun run dev:desktop` | 同步开发插件、构建 Web，并启动桌面应用。 |
| `bun run build` | 构建工具、Web、Server、MCP，并输出技能和提供方文件。 |
| `bun run build:server` | 构建独立部署所需的节点、工具、Web、Server、MCP、技能和提供方，支持 Linux。 |
| `bun run build:nodes` | 构建节点到 `build/nodes/`，不写入 `data/nodes/`。 |
| `bun run build:tools` | 构建默认工具到 `build/tools/`，不写入 `data/tools/`；不包含可选的插件开发套件。 |
| `bun run start:server` | 运行 `build/server/` 中已构建的服务。 |
| `bun run build:desktop` | 构建当前平台的桌面应用及随包资源。 |
| `bun run package:desktop` | 生成当前平台的 Windows NSIS、macOS DMG 或 Linux DEB 安装包。 |
| `bun run release:desktop <版本号> --auto` | 生成当前平台安装包、完整更新包，并在存在上一版时生成 patch。 |
| `bun run typecheck` | 单独执行各工作区的类型检查。 |
| `bun run --cwd packages/i18n extract` | 手动抽取中文源文案和来源索引，不生成其他语言的译文。 |

构建与类型检查分别执行。新增、移动或删除业务接口后，在 `apps/server` 执行 `bun run routes` 生成路由。

Windows 桌面日志位于安装目录的 `app/bin/app.log`。桌面 JavaScript 日志、初始化与依赖加载异常追加到同一文件，保留错误堆栈；启动助手也记录异常退出码。日志采用追加写入，日志不可写时仍保留控制台输出和启动失败提示。

插件开发工具位于 `packages/tools/pluginDeveloper`，作为工作区子包随默认工具构建和内置，产物为 `build/tools/pluginDeveloper.tool.js`，开发构建同步到 `data/tools/`。SDK 下载、缓存和插件构建由工具负责，主程序只提供本机权限校验及安装、刷新、上传桥接。工具私有资源在卸载时一并清理。

### 云端渠道

账号、插件市场、余额统计、探索、首页广告和供应商 TS 的调用链为：页面直接请求本地 `/api/channel/*` → 后端 `Channel` 接口 → `Toonflow` 实现。前端只保留通用 HTTP 工具，不维护渠道抽象。外网地址、响应转换和供应商 TS 临时实现统一放在 `apps/server/src/utils/channel/toonflow.ts`，前后端共享的纯类型通过 `@toonflow/server/channel` 导出。

首页广告请求 `GET /api/channel/community/getAdvertisements`，经渠道转发至正式接口 `POST https://api.toonflow.net/web/toonflow/home/getAdvertisements`（`/web` 是部署代理前缀）。配置入口位于 API 管理后台侧栏“首页广告设置”（`/homeAdvertisement`），读取和保存分别使用管理员服务的 `POST /homeAdvertisement/getSettings`、`POST /homeAdvertisement/saveSettings`，图片通过 `POST /homeAdvertisement/getUploadSignature` 获取直传签名。客户端渠道仅公开读取广告，不转发管理员写入接口。服务端过滤停用和到期广告，返回 `banners`、`bannerMode`（`carousel` 轮换或 `stack` 叠加）、`bannerInterval`（2–60 秒，默认 5）及 `sidebar`；旧 `banner` 字段保留首条可见横幅。旧接口缺少 `banners` 时客户端兼容单条配置，明确的空数组不回退。首次部署按 API 管理员服务的迁移文档初始化广告表；构建不会自动执行数据库迁移。

顶部最多配置 10 条横幅，沿用现有广告表的 `banner.items` JSON 保存 `{ items, mode, interval }`，并镜像首条到旧字段；已有单横幅配置自动兼容，无需增加数据库字段。文字横幅最低 44px，正文支持行内 Markdown、回车换行和自动折行，高度随内容撑开；轮换跟随当前条目高度，叠加按顺序显示，每条可独立关闭。后台保存配置后刷新 Toonflow 首页即可读取；正常使用不要添加 `advertisementPreview` 参数。

本地 API 联调可直接请求管理服务 `62487` 和主服务 `62477`；主 API 设置 `ENABLE_BACKGROUND_JOBS=false`，关闭定时任务及视频、图片回调消费。Toonflow 广告读取统一使用正式地址，已移除临时本地接口覆盖，避免开发配置遮蔽线上已保存的广告。

开发环境仍可通过 `/#/home?advertisementPreview=text`、`image`、`web`、`carousel` 或 `stack` 显式查看临时示例；普通首页与生产构建均使用真实接口，接口失败时不回退到示例。

后端环境变量 `TOONFLOW_CHANNEL` 选择渠道，默认 `toonflow`。新增渠道时，实现 `utils/channel/types.ts` 中的 `Channel`，在 `utils/channel/index.ts` 注册实例，然后设置对应的渠道名称并重启后端；前端和业务路由无需修改。未注册的渠道会明确报错，不会回退到其他渠道。

鉴权请求使用服务端设置中保存的账号 Token，并核对前端携带的账号快照；渠道实例不保存可变 Token。供应商 TS 接口暂时返回空模型配置，真实接口就绪后替换 `Toonflow.getProviderSource`。

### 多语言维护

语言字典与翻译运行时集中在 [`packages/i18n`](../packages/i18n/readme.md)。Web 的明确展示位置由 Vite 插件在编译时转换，业务源码可继续使用中文；动态文案使用 `t` / `msg` 标签模板。服务端使用请求语言上下文，避免并发请求之间串语言。

修改中文文案后，手动执行上面的 `extract` 命令，再补齐 `packages/i18n/src/locales/` 中各语言的同名键，保留占位符。开发启动和构建不会自动抽取，也不会自动生成译文。翻译仅用于显示，不改变用户数据、模型正文或业务判断值；供应商、tools、nodes、节点脚手架子包及安装器不在翻译范围内。具体用法、语言回退规则和验证记录见[多语言维护说明](../packages/i18n/readme.md)。

<details>
<summary><strong>在本机运行构建后的 Web 与 Server</strong></summary>

首次从源码运行，完成依赖安装后执行：

```sh
bun run build:server
bun run start:server
```

然后打开 `http://localhost:3000`。这套命令使用仓库根目录的默认 `data/`；服务首次启动会从构建产物初始化内置节点、工具、技能和提供方，保留已有插件文件。迁移到其他目录或机器时，需一并处理运行依赖、配置和工作区，不能只复制 `build/` 就视作完整安装。

独立 Server 采用单进程运行。桌面端复用同一个 `createApp`，在主进程监听系统分配的本机端口。目录选择、原生保存与桌面更新等接口仅由桌面宿主提供。

</details>

<details>
<summary><strong>桌面构建准备：Windows、macOS 与 Linux</strong></summary>

六种桌面目标统一使用 Electrobun 2.0.5：Windows、macOS、Linux，各支持 x64 / ARM64。需要在对应系统与架构上构建，不提供跨系统交叉打包。安装工作区依赖后，首次构建或单独类型检查前显式准备当前平台 SDK：

```sh
bun apps/desktop/node_modules/electrobun/bin/electrobun.cjs prepare
```

**Windows**

运行应用需要 WebView2；ARM64 还需 .NET Framework 4.8.1，较新的 Windows 11 已内置。构建脚本通过 `%WINDIR%/Microsoft.NET/Framework64/v4.0.30319/csc.exe` 编译辅助程序。打包需要 NSIS，默认查找 `C:/Program Files (x86)/NSIS/makensis.exe`，可通过 `NSIS_PATH` 指定路径。首次打包会下载并验证微软 WebView2 引导程序。

```sh
bun run build:desktop
bun run package:desktop
```

Windows x64 安装包为 `toonflow-<版本>-Setup.exe`，ARM64 为 `toonflow-<版本>-win-arm64-Setup.exe`，分别位于 `build/desktop/artifacts/`、`build/desktop/artifacts/windowsArm64/`。

NSIS 安装包不内置 Bun。安装器会自动打开“必要运行时下载”，提供 npmmirror、CNPM 备用线路、GitHub 官方源、SourceForge 镜像四个预设入口，并在系统代理和直连之间自动回退；所有组合失败后才提示重试。npmmirror 与 CNPM 属于同一维护体系，使用不同下载入口，不视为两个独立镜像运营方。高级设置默认折叠，下载中可以暂停、切换来源或取消，缓存位于 `%LOCALAPPDATA%/local.toonflow.desktop/runtime/bun/<版本>/<架构>`。下载的 ZIP 与可执行文件均校验固定大小和 SHA-256，不接受任意版本替换。`/S` 安装使用相同下载流程，不显示交互窗口。首次下载成功后，重新安装可以复用已校验缓存。

线路探测最多 4 路并发，每次仅请求实际 ZIP 的前 32 KiB；单次目标上限 2 秒、整个阶段预算 6 秒，每条线路首次成功后才做第二次确认。出现连续两次成功的候选后，再留 500 毫秒比较其他已启动的线路，然后中断剩余探测、等待工作任务结束并开始单路下载；未测或探测失败的线路继续保留为后备。暂停、取消或更改设置会同时停止全部探测。短时结果只代表当前连接表现；操作系统的 DNS、代理和取消收尾仍可能增加实际等待时间，不承诺所有网络下恰好 6 秒结束。

为兼容已经安装的旧版更新助手，Windows 的 `.tar.zst` 更新归档仍保留 Bun；仅 NSIS 使用剔除运行时的独立归档，解压后删除这份归档，不将它冒用为原始增量基线。因此通过精简安装包安装后，首次更新会使用完整更新包，之后恢复正常增量更新。构建时的 Bun 版本和下载摘要由 `apps/desktop/runtimeInfo.json` 锁定，并与 Hutch 的托管版本核对；升级 SDK 携带的 Bun 时需同步核验相关平台的清单。

**macOS**

最低支持 macOS 14。先安装 Xcode Command Line Tools，Intel 与 Apple Silicon 使用同一 SDK 和构建入口。

在对应架构的 Mac 上生成原生启动库，然后构建：

```sh
bun packages/startup/scripts/buildMac.ts
bun run build:desktop
bun run package:desktop
```

启动库脚本会下载固定版本的 ThorVG 源码并校验摘要。安装包为 `toonflow-<版本>-macos-<架构>.dmg`，产物分别位于 `build/desktop/artifacts/macArm64/` 和 `build/desktop/artifacts/macX64/`。打开 DMG 后将 `toonflow.app` 拖入“应用程序”，再从“应用程序”打开 Toonflow。

原 PKG 打包实现已备份到 `apps/desktop/scripts/packageMacPkg.ts`，当前打包入口使用 DMG。以后恢复 PKG 时，除应用签名所需的 Developer ID Application 证书及私钥，还需要 Developer ID Installer 证书及匹配私钥。

macOS 默认内置 Bun，当前 DMG 打包不支持外置运行时试验，显式设置 `TOONFLOW_EXTERNAL_RUNTIME=1` 会中止打包。原 PKG 的精简安装与运行时下载逻辑随 `packageMacPkg.ts` 保留，但该备份不是当前构建或发布入口，恢复使用需要另行接入。外置 Bun 的可执行路径会改变系统识别的主 Bundle，仅修正 SDK 资源路径和工作目录不能保证麦克风权限、协议链接与应用身份正常；需要在 Intel、Apple Silicon Mac 上解决并验证这些行为，再考虑正式启用。

本机默认生成未做 Developer ID 签名与公证的开发包；GitHub Actions 的两种 Mac 包都会按下方配置自动签名并公证。旧版 Intel 客户端首次迁移到统一 SDK 版本时，须下载完整 DMG 覆盖安装，不能通过旧版增量更新直接迁移；安装前退出应用并备份原数据目录。对于自己构建且确认来源的开发应用，若被隔离属性拦截，可仅移除该应用的隔离属性，路径按实际位置调整：

```sh
xattr -dr com.apple.quarantine "/Applications/toonflow.app"
```

**Linux**

使用系统 GTKWebKit，不捆绑 CEF。以下以 Ubuntu 24.04 为例，显式安装桌面运行库与打包工具后构建：

```sh
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
  libgtk-3-0t64 libwebkit2gtk-4.1-0 libayatana-appindicator3-1 librsvg2-2 \
  zenity ffmpeg dpkg
bun run build:desktop
bun run package:desktop
```

安装包为 `toonflow-<版本>-linux-<架构>.deb`，产物分别位于 `build/desktop/artifacts/linuxX64/`、`build/desktop/artifacts/linuxArm64/`。使用 `sudo apt install ./安装包文件名.deb` 安装时会准备所需系统依赖与 FFmpeg，并先安装 `Pre-Depends` 声明的 `ca-certificates`、`curl`、`unzip`。安装需要可访问下载源的网络。

DEB 不内置 Bun 二进制。`preinst` 在首次安装、重装或升级的解包前阶段，准备 `apps/desktop/runtimeInfo.json` 锁定版本与架构的 ZIP，校验固定大小和 SHA-256，再流式解压指定成员到缓存临时文件并校验二进制大小和 SHA-256；下载或校验失败会在解包前中止安装。`postinst` 在配置阶段复核缓存与解压出的二进制，最后原子替换 `/opt/toonflow/bin/bun`；该阶段已有有效运行时可直接复用，不重新下载。

匹配版本与架构的 ZIP 缓存位于 `/var/cache/toonflow/bun-<版本>-linux-<架构>.zip`，由 root 持有且仅 root 可访问，复用前重新校验；重装与升级也先确保缓存有效。卸载由包管理器删除安装目录中的 Bun，下载缓存保留，不触碰用户项目与配置。SDK 的完整 `.tar.zst` 更新归档继续保留 Bun，更新清单、Hash 与增量基线不因 DEB 精简而改变。

完成 SDK 准备后，可显式运行 `bun run typecheck`。类型检查不会隐式安装依赖或编译原生库。

</details>

<details>
<summary><strong>发布、更新与插件同步</strong></summary>

**通过版本标签自动发布**

发布直接使用现有提交上的 `vX.Y.Z` 标签，无需 Git Flow 或 release 分支。

1. 提交要发布的代码，在 SourceTree 中选中该提交，点击 **标签**。
2. 填写完整标签名，例如 `v2.0.0`，确认标签指向要发布的提交。
3. 在左侧标签列表右键这个新标签，选择 **推送标签**，目标选择正式仓库 `origin`。只推送本次标签，不勾选“推送所有标签”。

推送标签会一并上传它所引用的提交，无需创建或推送发布分支。GitHub Actions 会自动运行 **Release Toonflow**，构建六种桌面目标与 Android ARM64，全部成功后创建对应 GitHub Release。

也可在仓库终端执行下面两条命令（将 `2.0.0` 换成本次版本）：

```sh
git tag -a v2.0.0 -m "Release v2.0.0"
git push --no-follow-tags origin refs/tags/v2.0.0:refs/tags/v2.0.0
```

版本格式为小写 `v` 加 `X.Y.Z`；轻量标签和附注标签均支持。使用新的版本号，不覆盖已有标签。构建失败时，在 Actions 中查看日志；代码不变可重跑任务，修改代码后使用新版本号。

**一次构建全部平台**

在 GitHub 仓库打开 **Actions → Release Toonflow → Run workflow**，选择要发布的可信分支，填写版本号（例如 `2.0.1`），将 `ref` 留空后运行。推送 `vX.Y.Z` 标签同样会触发发布。包含任一种 Mac 的签名构建要求 `ref` 与触发工作流的分支或标签指向同一提交，不允许借此切换到其他提交；在 Debug 工作流仅构建 Windows、Linux 或 Android 时可指定其他 `ref`。

工作流使用各系统与架构的原生运行器构建，全部成功后统一上传到对应 GitHub Release：

| 平台 | 安装包 | 更新文件 |
| --- | --- | --- |
| Windows x64 | `toonflow-<版本号>-Setup.exe` | `stable-win-x64-*` |
| Windows ARM64 | `toonflow-<版本号>-win-arm64-Setup.exe` | `stable-win-arm64-*` |
| macOS Intel | `toonflow-<版本号>-macos-x64.dmg` | `stable-macos-x64-*` |
| macOS Apple Silicon | `toonflow-<版本号>-macos-arm64.dmg` | `stable-macos-arm64-*` |
| Linux x64 | `toonflow-<版本号>-linux-x64.deb` | `stable-linux-x64-*` |
| Linux ARM64 | `toonflow-<版本号>-linux-arm64.deb` | `stable-linux-arm64-*` |
| Android ARM64 | `toonflow-<版本号>-android-arm64.apk` | APK 随 Release 发布，不使用桌面更新清单 |

各桌面目标包含完整更新包 `.tar.zst`、更新清单 `*-update.json`，以及**GitHub 最新发布版 → 当前版本**的 `<平台前缀>-<旧 hash>.patch`。首次发布找不到该目标清单（HTTP 404）时只生成安装包和完整更新包；Intel Mac 首次遇到旧 SDK 清单时也只生成统一 SDK 的首版完整包。其他网络错误、无效清单或缺失 patch 会中止构建。版本号必须高于更新源中的上一版。

构建固定使用 GitHub Releases 的 `releases/latest/download` 读取上一版清单及完整包，用于生成补丁。GitHub Actions 使用当前工作流仓库（`GITHUB_SERVER_URL` / `GITHUB_REPOSITORY`），本机构建默认使用 `HBAI-Ltd/Toonflow-app`。此地址写入 SDK 的构建配置，不受客户端设置影响；客户端运行时在“设置 → 关于”选择更新源，默认使用官方源 `https://api.toonflow.net/version/desktopUpdates`，也可切换到 GitHub Releases。开发者选项可保存一个自定义更新文件目录地址，保存后会出现在“关于”的更新源下拉框。Release 工作流会上传安装包和更新文件到 GitHub Release，再通过配置的托管接口登记六个桌面目标；使用独立更新服务时按下方命令单独同步。

[Debug 工作流](../.github/workflows/debug.yml) 可单独选择平台或全部平台，产物保留 7 天，不创建 Release。默认只打完整包，勾选 `generatePatch` 可验证增量构建。CI 构建和归档检查不等于已验证真实安装、GUI 启动或 macOS Gatekeeper。

**Windows 代码签名**

Windows 安装器和自有辅助 EXE 会写入产品、发布者与当前构建版本信息。默认没有签名证书，构建会明确提示产物未签名；版本信息不能代替数字签名，也不代表已通过 Defender 检测。

在有代码签名证书及匹配私钥的 Windows 构建机上，将证书安装到当前用户的 `My` 证书库，安装 Windows SDK 的 SignTool，并在执行现有打包命令前设置：

```powershell
$env:windowsSigningThumbprint = '证书的40位十六进制指纹'
$env:windowsSignToolPath = 'C:\Program Files (x86)\Windows Kits\10\bin\实际SDK版本\x64\signtool.exe'
bun run package:desktop
```

SignTool 已在 PATH 时可省略 `windowsSignToolPath`；指定路径时必须使用绝对路径，避免不同构建阶段的工作目录影响工具选择。未设置 `windowsSigningThumbprint` 才会跳过签名，显式空字符串、空白或无效指纹均报错。签名采用 SHA-256 与 RFC 3161 时间戳，默认使用 `http://timestamp.digicert.com`，可通过 `windowsSigningTimestampUrl` 指定证书服务商的时间戳地址。私钥保留在证书库或提供商的硬件中，不向脚本传递证书密码。

四个自有启动、协议、保存与更新辅助程序在 SDK 生成更新归档、Hash 和补丁前完成签名；安装检测程序、NSIS 内嵌卸载器和最终安装包也会签名并验证。NSIS 打包使用归档中的更新助手，并校验归档内四个辅助程序的版本；启用签名时还校验其签名、证书指纹和时间戳，不能用未签名旧归档只重签外壳。第三方文件保留其原有签名。配置了证书指纹后，证书、时间戳或签名验证失败均中止打包，不回退为未签名产物；最终 EXE 在暂存目录完成签名后才替换产物，失败不覆盖已有安装包。当前 GitHub 托管 Windows 运行器尚未配置证书，仍输出未签名包；启用 CI 签名需要先提供可用的签名身份。

签名接入与编译通过不等于误报已解除。Defender 已检测的原始文件需结合保护历史记录复核，必要时通过 [Microsoft Security Intelligence](https://www.microsoft.com/en-us/wdsi/filesubmission) 以软件开发者身份提交分析。

**macOS 自动签名与公证：首次配置**

在 GitHub 仓库的 **Settings → Secrets and variables → Actions → New repository secret** 添加：

| Secret | 内容 |
| --- | --- |
| `MACOS_CERTIFICATE_BASE64` | `.p12` 文件，包含唯一有效的 **Developer ID Application** 证书及匹配的私钥，编码为 Base64。 |
| `MACOS_CERTIFICATE_PASSWORD` | 导出该 `.p12` 时设置的非空密码。 |
| `MACOS_NOTARIZATION_KEY_ID` | App Store Connect 团队 API 密钥的 Key ID。 |
| `MACOS_NOTARIZATION_ISSUER_ID` | 该团队 API 密钥的完整 Issuer ID，不是 Team ID。 |
| `MACOS_NOTARIZATION_KEY_BASE64` | 对应 API 密钥的 `.p8` 私钥文件，编码为 Base64。 |

在 Windows PowerShell 中执行以下命令，把路径替换为本机证书路径。命令只复制到剪贴板，不打印证书内容，也不生成文件；随后粘贴到 `MACOS_CERTIFICATE_BASE64` 的 Secret 输入框：

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\证书目录\signing.p12')) | Set-Clipboard
```

然后单独执行下面的命令，把 `.p8` 路径替换为本机文件路径，将剪贴板内容保存到 `MACOS_NOTARIZATION_KEY_BASE64`：

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\证书目录\AuthKey_你的KeyID.p8')) | Set-Clipboard
```

粘贴保存后可执行 `Set-Clipboard -Value ''` 清空剪贴板。密码直接填写到 `MACOS_CERTIFICATE_PASSWORD`，不写进命令、源码或聊天记录。Base64 只是编码，不是加密；P12、P8、Base64、密码均不得提交到公开仓库或上传为构建产物。

公证使用 App Store Connect **团队 API 密钥**，Key ID、Issuer ID 与 P8 必须对应同一把有权限的密钥。应用与 DMG 复用这把公证密钥，更换签名 P12 不要求同时更换仍有效且有权限的公证 API 密钥。这种认证方式不需要 Apple ID 密码或 Team ID；P12 及其密码用于应用和 DMG 签名。

配置后，Debug 与 Release 的两种 Mac 构建都会自动导入临时钥匙串，使用 Developer ID Application 签署应用、原生代码与 DMG，并对应用与 DMG 分别提交 Apple 公证、等待通过、附加并验证公证票据。完整更新归档在应用公证后生成；上传前会验证更新归档中应用的签名和公证票据，并核对是否使用本次导入的 Developer ID Application 证书；DMG 会校验签名与公证票据，并挂载检查其中的应用。

缺少 Secret、没有唯一有效的 Developer ID Application 身份、Apple 拒绝公证或验收失败都会中止构建，不回退为未签名或未公证包。临时 P12 在导入步骤结束后删除；P8 与钥匙串在构建成功、失败或取消后的清理步骤中删除，均放在运行器临时目录。证书 Base64、密码和 P8 Base64 只注入凭据准备步骤，公证 API 标识只额外传给 Mac 构建步骤。公证等待计入工作流现有的 90 分钟超时，超时不会发布。

公开仓库只从可信的手动操作或 `v*` 标签触发签名，不接入 `pull_request` / `pull_request_target`。请用 GitHub Rulesets 保护发布分支及 `v*` 标签，并限制仓库写权限；签名构建会执行所选提交的代码，有权修改发布代码或工作流的人也处于 Secrets 的信任边界内。证书导入方式参见 [GitHub 官方说明](https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms/sign-xcode-applications)。

两种 Mac 的 CI 构建强制同时签名与公证，本机构建默认不启用。公证无需上架 App Store，首次打开仍可能出现确认打开互联网下载应用的提示。CI 验收不代替实际 Mac 上从浏览器下载、安装、启动及升级的验证，参见 [Apple 安全打开应用说明](https://support.apple.com/en-us/102445)。

若凭据准备步骤提示未找到唯一有效的签名身份，查看该步骤后续输出的证书类别、有效期和系统诊断。应用与 DMG 需要 `Developer ID Application`，`Developer ID Installer`、`Apple Development`、`Apple Distribution` 不能替代该身份。若类别正确，仍需检查是否含匹配私钥、是否过期，以及证书信任链；成功导入 P12 不等于存在有效的签名身份。诊断不会打印私钥、密码或证书姓名。

**本机打包与独立更新服务**

独立更新服务与业务 Server 分开运行，默认地址为 `http://127.0.0.1:8091`。其配置、部署与发布规则见 [更新服务说明](../apps/updateServer/readme.md)。

```sh
bun run start:updateServer

# 本机仅构建当前系统与架构；自动判断是否已有上一版
bun run release:desktop 2.0.0 --auto
bun run publish:update build/desktop/releases/2.0.0

# 服务器保留上一版时，构建并发布下一版本
bun run release:desktop 2.0.1
bun run publish:update build/desktop/releases/2.0.1
```

Windows x64 发布目录保留 `build/desktop/releases/<版本>/`；其他目标分别增加 `windowsArm64/`、`macX64/`、`macArm64/`、`linuxX64/` 或 `linuxArm64/`，例如 `build/desktop/releases/macArm64/2.0.1`。所有 release 模式都会生成安装包；`--auto` 自动判断基线，不带选项要求已有上一版，`--initial` 跳过基线检查且不生成 patch。同一平台、架构和版本不能重复生成快照。普通 `build:desktop`、`package:desktop` 不访问更新服务器。

桌面用户可在“设置 → 关于”检查更新、下载并重启应用。Windows 更新交换程序目录，保留 `data/` 和 `WebView2/`；卸载时也默认保留这些数据，选择“同时删除用户数据”才会一并清理。

内置节点与工具按构建 hash 同步：升级或降级后首次启动会替换同名内置插件；Windows 同版本重装也会触发同步。普通重启不重复覆盖。技能和提供方按首次初始化规则处理，保留已有文件；第三方插件和用户素材不随内置节点、工具的同步被覆盖。

</details>

### 项目结构

```text
apps/
  web/                 Vue 页面、设置、工作区与画布
  server/              业务接口与 Agent 运行时，桌面共享此服务
  desktop/             Electrobun 入口、构建脚本与安装器
  updateServer/        独立更新文件服务器与发布脚本
packages/
  assets/              共享图片与图标
  i18n/                多语言字典、运行时与文案抽取
  nodes/               内置画布节点
  nodeScaffold/        节点开发脚手架与运行时
  tools/               Agent 工具插件
  toolScaffold/        工具开发脚手架与运行时
  providers/           文本与媒体模型提供方
  skills/              Markdown 技能及附属资料
  mcp/                 MCP 服务与协议适配
  ffmpeg/              FFmpeg 能力
  startup/             原生启动窗口与动画
docs/                  项目介绍译版、开发文档与图片
build/                 构建产物
data/                  本机运行数据，不提交到仓库
```

---
