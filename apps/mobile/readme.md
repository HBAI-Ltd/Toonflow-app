# Toonflow Android

> X5 接入尚未完成：目前缺少腾讯控制台提供的新版动态 SDK（44382）及绑定 `com.toonflow.mobile` / APK 签名的 `config.tbs`。当前 44286 原生代码是待替换的接入草案，不能作为新版 X5 发布；下述 X5 流程说明的是目标行为。官方[公网接入文档](https://st.tencent-cloud.com/jax-static/tbs/PublicNetGuide0724.md)与[试用申请指引](https://st.tencent-cloud.com/jax-static/TBS-WebIndex/docs/1005/console_doc.md)说明了所需资料，ARM64 组件选择 `x5webview64`。

Android WebView 加载同一 APK 内 Bun 启动的真实 Toonflow 前端和后端。页面复用 `apps/web`，后端通过 `@toonflow/server/app` 接入，内置节点、工具、扩展、供应商和技能沿用现有构建产物。

## 设备互联与手动连接

桌面「设置 → 设备互联」中的「允许其他设备连接」默认关闭。开启后直接显示二维码，局域网地址优先选择 `192.168.*`。手机和电脑都可以在 Home 页「设置」右侧或首次配置 hello 页点击「设备互联」，使用摄像头或读取二维码图片。也可以选择「手动输入」，填写对方「手动连接信息」中的地址和 12 位数字配对码。二维码与数字码不设时间限制，共用一次配对机会；刷新、修改互联配置、关闭互联或重启服务端会使旧码失效。数字码每分钟最多尝试 10 次，二维码不受此限制。端口、共享工作目录、其他局域网地址和公网 HTTPS 配置均放在「高级选项」中，首次开启默认使用已有项目的工作目录。

电脑也能连接另一台电脑。连接远程设备后，本机共享监听和 MCP 服务停止，当前设备只作为客户端；设置中显示连接状态和「断开并独立运行」。断开恢复独立运行后可重新开启共享，不会自动重新开放端口。桌面切换时更换本地网关端口并重新加载窗口，保留本机剪贴板和文件导出能力；工作目录来自对方服务器。

手机连接电脑后，首页入口显示实际连接状态，点击可查看电脑名称、切回本机或连接其他电脑。扫码、确认连接和当前连接分别展示，横屏下也保留完整操作区。电脑面板自动更新手机列表和在线状态；手机网关每五秒检查连接，电脑超过十五秒未收到设备活动后显示离线。在线表示最近可以通信，不代表手机处于前台。关闭共享或撤销设备会使手机下次检查显示连接已断开。

连接后重启手机本地入口，页面、项目、模型配置和计算任务来自所选后端，手机原有项目仍留在本机。再次点首页的连接状态按钮可换服务器或切回手机；服务器离线时也提供重试和切回本机入口。切换不会自动迁移、合并项目或同步两端配置；已有流式任务遵循原有断开取消行为。

手机仍运行轻量 Bun 网关以保留 localhost 安全上下文和 Android 导出能力；远程模式不初始化手机业务后端。网关转发完整页面、插件和 API，支持上传、Range、SSE/Agent 响应流及取消。设备凭据仅保存到手机应用私有目录，不交给网页；关闭共享或撤销设备会断开现有连接。

共享监听默认端口为 `43123`，复用桌面同一个后端进程。首次连接需允许该端口通过电脑防火墙，电脑不能关机或休眠。HTTP 适用于可信局域网，传输未加密；公网使用 HTTPS 反向代理指向**设备互联端口**，在面板填写 HTTPS 根地址后生成二维码。代理需保留 `X-Toonflow-Device-Token`、`Authorization` 和原始 Host，关闭响应缓冲并允许长连接。不要将已有未鉴权的 standalone 主端口直接公开。

配对设备可使用该后端的模型配置和业务功能，仅应授权自己的可信设备。共享目录是工作区接口的范围，服务器自带 `data/workspaces` 也可访问；这不是第三方插件或 Agent 代码执行的沙箱。不要让电脑和手机同时编辑同一画布：本次互联不提供多人实时协作或冲突合并。

应用默认横屏运行，使用 `sensorLandscape`，可随设备方向在两个横屏方向之间切换。沉浸式全屏隐藏状态栏与导航栏，边缘滑动可临时唤出系统栏；Agent 保留原有可拖动、调整大小及停靠的悬浮窗。

手机端默认使用 75% 界面缩放，可在「设置 → 界面设置 → 界面缩放」通过滑块调整为 50%–100%，每档 5%。拖动时只显示所选比例，松手后生效并随应用设置保存。使用 WebView 视口缩放，画布和弹出层保持统一坐标，保留原有页面布局与设置侧栏。

使用官方 **Bun 1.4.2 Android** 运行时，仅构建 `arm64-v8a`。打包参考社区 [minapk](https://github.com/jjtseng93/minapk) 的原生库目录启动方式；直接使用 Android SDK 构建，不依赖其终端环境。Bun 运行时随 APK 安装到原生库目录，JS、WASM 和页面复制到应用程序目录，设置与工作区保存在独立的数据目录。来源和许可证见 [thirdParty.md](thirdParty.md)。

启动时先用系统 WebView 加载独立的本地能力预检页面，通过后直接进入 Toonflow，不初始化或下载 X5。检测项与网页入口共用 `@toonflow/web/browserCapabilities`，避免旧内核在加载业务依赖时先白屏。

只有系统 WebView 缺少所需能力时，才初始化腾讯 TBS SDK 并按需下载 X5。下载有进度与失败提示；非 Wi-Fi 网络先确认流量使用。已安装的 X5 可以复用，确认实际使用 X5 后直接进入 Toonflow，不对 X5 再做浏览器能力检测，不接受 SDK 静默回退到不满足要求的系统内核。X5 仅用于移动端；实际内核版本由腾讯服务下发，不添加旧内核 polyfill。安装了新版 Chrome 或另一份 WebView APK，不代表系统已切换到该版本。

## 构建

当前脚本用于 Windows，需要 Bun、JDK 17 或更新版本、Android SDK Platform 34 和 Build Tools 35.0.0。在仓库根目录执行：

```powershell
# 本机已有的 SDK / JDK；其他机器按实际安装路径调整。
$env:ANDROID_HOME = 'D:\SDK'
$env:JAVA_HOME = 'D:\Android Studio\jbr'

bun install
bun run --cwd apps/mobile setup
bun run --cwd apps/mobile typecheck
bun run --cwd apps/mobile build
bun apps/mobile/scripts/verify.ts
```

`setup` 显式下载固定版本 ARM64 Android Bun 和腾讯 `com.tencent.tbs:tbssdk:44286` 接入 SDK，校验 SHA256 后分别缓存到 `build/mobile/runtime`、`build/mobile/tbs`；构建不下载依赖。TBS 接入 SDK 参与 Java / DEX 构建，完整 X5 内核不打进 APK。可通过 `ANDROID_BUILD_TOOLS` 和 `ANDROID_PLATFORM` 调整 SDK 版本。

`build` 先调用根目录的 `build:server`，构建节点、工具、扩展、前端、后端及 MCP，再构建移动端启动入口。APK 的 payload 包含 `server.js`、`web`、`nodes`、`tools`、`ext`、`providers`、`skills`、`mcp` 和 Photon 的 JS/WASM 包；团队保持当前仓库未内置打包的状态。payload 内容生成 `revision.txt`，用于随构建更新内置插件。

`bun apps/mobile/scripts/verify.ts` 需在 Bun 1.4.2 或更新版本运行，与 APK 的运行时保持一致（1.3.14 存在消费请求体后丢失断连通知的问题）。它显式启动真实构建产物，在临时数据目录验证能力预检、正式页面、鉴权、内置资源、工作区边界、扫码配对、重启隔离、远程上传与 Range、POST 流式取消、离线恢复和手机导出。检查不连接模型供应商，不读取已有用户数据，也不自动绑定到构建；它不能代替 Android 相机、X5 下载及系统文件选择器的设备验收。

输出：`build/mobile/toonflowMobile.apk`。包名为 `com.toonflow.mobile`，最低 Android 8 / API 26，目标 API 34。本地和 CI 共用仓库内公开的默认签名 `native/defaultSigning.keystore`，别名为 `androiddebugkey`，密码均为 `android`。沿用此前本地默认签名，不再每次生成密钥，后续版本可直接覆盖安装并保留应用数据。

版本默认沿用 `electrobun.config.ts` 的 `app.version`，可通过 `appVersion` 指定 `X.Y.Z`。Android `versionCode` 按 `X × 1000000 + Y × 1000 + Z` 生成，Y、Z 不超过 999，结果须在 1–2100000000 内；更新时使用更高版本号。

## GitHub Actions

在 Actions 中选择 **Debug build → Run workflow**，将 `target` 设为 `androidArm64` 可单独构建 ARM64 APK，选择 `all` 会同时构建桌面与 Android。版本留空时使用所选标签或项目配置。Android 默认生成 debug 包，可在本次运行的 Artifacts 或 Summary 中下载。开启 `androidRelease` 会关闭 `debuggable` 并去掉文件名中的 `-debug` 后缀，两种模式使用相同默认签名，无需配置 Android Secrets。

现有 **Release Toonflow** 工作流在推送 `vX.Y.Z` 标签或手动发布时，会并行构建桌面与 Android，全部成功后将 `toonflow-X.Y.Z-android-arm64.apk` 附加到同一个 GitHub Release。Android APK 暂不上传到桌面更新托管接口，应用内「前往 GitHub 更新」会打开最新发布页。

CI 使用 Windows 2025 自带 JDK 17 和 Android SDK Manager，显式安装 Platform 34 / Build Tools 35.0.0，再分别执行依赖安装、mobile `setup` 与 `build`。默认签名文件直接来自源码，Android 构建不读取签名 Secrets。X5 的 `config.tbs` 仍需与最终包名及默认签名匹配。

本地需要复现发布构建时，设置 `androidRelease=1`，然后执行同一个 mobile `build` 命令。

## 安装到 ARM64 设备

```powershell
$adb = Join-Path $env:ANDROID_HOME 'platform-tools\adb.exe'
& $adb devices -l
& $adb -s <设备序列号> install --no-incremental -r build/mobile/toonflowMobile.apk
& $adb -s <设备序列号> shell am start -W -n com.toonflow.mobile/.mobileActivity
```

设备序列号以 `adb devices` 输出为准；仅支持运行 ARM64 原生库的设备，不再提供 x86_64 APK。

打开后进入 Toonflow 首页。创建或打开项目后，可检查工作区文件、画布、节点、Agent 和设置是否正常加载；编辑并保存后退出应用，再次打开应保留内容。覆盖安装保留应用数据，卸载会清除。

## 手机工作区与文件

项目使用应用私有目录，文件接口仍复用 Toonflow 的工作区路径校验与原子保存。通过 Android 系统文件选择器导入文件，通过系统保存对话框导出文件；系统选择器返回的 `content://` 地址不作为后端普通文件路径使用。

保存对话框默认请求打开内部存储的 `Download` 目录，用户仍可选择其他位置；系统不支持该初始目录时会使用自身默认位置。本机 MuMu 的「下载」快捷入口存在写入授权异常，测试时请使用「内部存储 → Download」。该位置已完成导出并核对文件一致。

程序资源与用户数据分开存放：更新 APK 可以替换页面和插件，不能覆盖设置、项目或生成素材。需要迁移或卸载前，应先导出需要保留的文件。

```powershell
& $adb -s <设备序列号> logcat -s ToonflowMobile AndroidRuntime
& $adb -s <设备序列号> shell am force-stop com.toonflow.mobile
```

本机开发先执行 `bun run build:server` 准备真实前端和插件，再运行 `bun run --cwd apps/mobile dev`，打开终端打印的完整 URL。开发数据单独保存在 `build/mobile/data`。

## 当前范围

- 复用真实 Toonflow 前后端与插件；Bun 仅监听本机随机端口，应用会话鉴权覆盖页面、接口和流式请求。
- 在线模型和媒体供应商仍需要联网及有效配置；本地安装不等于离线运行云端模型。
- FFmpeg 当前没有 Android 发行包，转码、抽帧等依赖 FFmpeg 的功能暂不可用；不能将 Linux 二进制直接用于 Android。
- Activity 退出时停止 Bun；没有后台长任务或前台服务。
- Bun Android 仍为实验性支持。MuMu 的验证不能代替 ARM64 真机验证；真实手机上的 WebView、内存、媒体编解码及后台行为仍需单独确认。
- 支持 Windows 本地构建和 GitHub Actions APK 构建与签名，不包含应用商店上架流程。
