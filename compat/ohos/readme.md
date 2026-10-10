# Toonflow OHOS

独立鸿蒙兼容构建，复用 `apps/mobile/src/server.ts`、完整网页与内置插件。ArkTS UIAbility/ArkWeb 加载应用内 Bun 在随机 localhost 端口提供的页面；C++ NAPI 只负责启动和回收 Bun。不会启动电脑上的服务来冒充本机后端。

当前固定运行时为 [springmin/bun v1.4.0](https://github.com/springmin/bun/releases/tag/v1.4.0) 的预签名 **OHOS ARM64** ELF，SHA256 为 `f1382157493f24e7876171a8dc5a7453564d8bf379adcd67c646988ff9105cf7`。该二进制对应源码为 [0f78632c38a2280f5f4f29f9f76e30c242d3d34a](https://github.com/springmin/bun/tree/0f78632c38a2280f5f4f29f9f76e30c242d3d34a)，不是同名 Git tag 的旧主线。`bun-v1.4.2-ohos` 发布页目前没有二进制。许可原文见 [bunLicense.md](bunLicense.md)，随 HAP 一起分发。

## 构建

当前构建环境为 Windows、仓库已安装的 Bun 依赖及 DevEco Studio 26。生成工程的最低 API 为 12、目标 API 为 26，设备类型为 phone/tablet。版本沿用根目录 `electrobun.config.ts`，也可设置 `appVersion=X.Y.Z`。

在仓库根目录执行：

```powershell
$env:DEVECO_HOME = 'C:\Program Files\Huawei\DevEco Studio'
bun run --cwd compat/ohos setup
bun run --cwd compat/ohos typecheck
bun run --cwd compat/ohos build
```

`setup` 下载并校验 Bun，然后用 DevEco 自带 OHPM 链接项目自己的 NAPI 类型声明。`build` 复用 `build:server` 构建前后端及插件，然后生成标准 Hvigor 工程、编译原生桥和 ArkTS、打包 HAP。SDK 强制要求的 `build-profile.json5`、`CMakeLists.txt` 等文件只生成到 `build/ohos/project`。构建不会隐式运行 `setup`。

默认产物为 `build/ohos/toonflow-2.0.0-ohos-arm64-v8a-unsigned.hap`，文件名随项目版本变化。程序资源在 `build/ohos/payload`；可用 DevEco Studio 打开 `build/ohos/project` 调试和配置签名。

可选环境变量：

| 变量 | 用途 |
| --- | --- |
| `DEVECO_HOME` | DevEco Studio 安装目录，默认如上 |
| `DEVECO_SDK_HOME` | SDK 根目录，默认 `DEVECO_HOME/sdk` |
| `ohosBunPath` | 已构建并签名的 OHOS Bun ELF 的绝对路径；覆盖默认运行时 |
| `ohosArch` | 默认 `arm64-v8a`；只有另备兼容 OHOS 的 x86_64 ELF 才能选 `x86_64` |
| `ohosSigningConfig` | 一个完整 DevEco `signingConfigs` 配置对象的 JSON 文件路径 |

构建会校验 ELF 架构。Linux、Android Bun 与 OHOS Bun 不可互换；x86_64 模拟器不能运行当前发布的 ARM64 Bun。

## 签名和安装

真机安装需要覆盖目标设备的 HarmonyOS 签名证书与 profile。可先在 DevEco 打开生成工程，连接设备并使用 IDE 的签名配置。命令行构建时，将 DevEco `build-profile.json5` 中 `app.signingConfigs` 数组里的对应对象单独保存为 JSON，使用绝对证书/profile/keystore 路径；文件放在仓库忽略的 `build/ohos/signingConfig.json`，不要提交证书、密码或 profile。

```powershell
$env:ohosSigningConfig = (Resolve-Path build/ohos/signingConfig.json).Path
bun run --cwd compat/ohos build

$hdc = Join-Path $env:DEVECO_HOME 'sdk\default\openharmony\toolchains\hdc.exe'
& $hdc tconn 127.0.0.1:5557
& $hdc list targets
& $hdc -t 127.0.0.1:5557 shell param get const.product.cpu.abilist
& $hdc -t 127.0.0.1:5557 install -r (Resolve-Path build/ohos/toonflow-2.0.0-ohos-arm64-v8a-signed.hap).Path
& $hdc -t 127.0.0.1:5557 shell aa start -b com.toonflow.mobile -a entryAbility
& $hdc -t 127.0.0.1:5557 shell hilog -T ToonflowRuntime
```

设备地址、版本文件名按实际情况替换。Windows HDC 的本地文件参数使用 `Resolve-Path` 返回的绝对反斜杠路径。配置签名后输出 `-signed.hap`；未配置时仍可编译，但 `-unsigned.hap` 不代表可安装包。重新执行命令行 `build` 会重新生成工程配置，IDE 中的签名应按上述方式保存并传入。

## 行为与验证边界

- 程序更新使用 `filesDir/appNext → app` 与 `appPrevious` 回滚，数据单独存于 `filesDir/data`。覆盖安装替换程序资源，不覆盖设置和工作区；卸载会清除应用数据。
- 沿用移动端随机端口、一次启动令牌及 HttpOnly Cookie 鉴权。原生桥仅接受本机同源 `toonflow://save` 和重启请求，外部网页在系统浏览器打开。
- 首次进入网页前执行现有浏览器能力预检；系统 ArkWeb 不满足要求时显示错误。OHOS 不含 Android GeckoView。
- 保留横屏、全屏、文件上传和系统文件保存；设备互联可手输配对码。相机授权和拍摄扫码尚未接入。
- Bun 随 Ability 生命周期运行，没有后台长任务保证。`TOONFLOW_PLATFORM=ohos` 用于避免把该 Bun 报告的 `linux` 误当作 Linux FFmpeg 支持。
- 现存公共验证入口可指定构建资源目录：`bun apps/mobile/scripts/verify.ts build/ohos/payload`。Windows 上要求 Bun 1.4.2；它验证页面、鉴权、插件、文件冲突、上传、Range、SSE 取消和设备互联，不连接模型供应商。主机通过不能证明 HAP 沙箱允许执行 Bun。
- 必须在 ARM64 设备上继续验证 HAP 签名安装、应用沙箱内 `posix_spawn`/ELF 执行/JIT、Bun FFI 与原子文件创建、ArkWeb 实际渲染、系统文件选择及重启持久化。上游终端环境的 Bun 支持不能替代普通 HarmonyOS 手机 HAP 的验证。
