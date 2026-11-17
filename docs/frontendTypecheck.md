# 前端检查的内存边界

2026-11-11 因服务器 OOM 排查并调整。应用业务行为和类型检查强度保持不变。

## 已调整

- 根目录现有 `typecheck` 改为 `bun run --sequential --filter '@toonflow/*' typecheck`，逐包执行，避免工作区检查进程同时占用内存。
- Web 的 `tsconfig.json` 只检查页面源码，启用 TypeScript 原生增量缓存，缓存位于 `apps/web/node_modules/.cache/vue-tsc.tsbuildinfo`，不进入源码仓库。
- `tsconfig.config.json` 单独检查 Vite 及其配置依赖。原有 Web `typecheck` 顺序执行两项，不跳过构建配置检查。
- `appVersion.ts` 提供原有环境变量覆盖和默认版本；Web 构建不再为读取版本引入整份桌面配置及 `.hutch` 生成类型。
- `patches/tdesignTypes.patch` 只修改 TDesign 1.20.7 的两处类型声明：直接引用 `GlobalIconConfig` 和单个图标，避免经图标包总入口加载两千多个无关声明。Bun 锁文件固定该补丁；没有修改库的 JavaScript 或放宽类型。

## 本地验证

Windows、Node 22、TypeScript 6.0.3、vue-tsc 3.3.11。数字来自 `--extendedDiagnostics` 的 `Memory used`，是编译器报告的内存，不是 Linux 容器峰值 RSS 或服务器容量承诺。

| 情况 | 文件数 | 编译器内存 | 结果 |
| --- | ---: | ---: | --- |
| 调整前，单独前端检查 | 7297 | 2007813 KiB，约 1.91 GiB | 完成源码检查后报桌面 `.hutch` 类型缺失 |
| 调整后，首次无缓存检查 | 4846 | 1923582 KiB，约 1.83 GiB | 通过 |
| 调整后，代码未变化的增量检查 | 4846 | 1198319 KiB，约 1.14 GiB | 通过，比原检查约少 40% |
| 独立 Vite 配置检查 | 344 | 77184 KiB，约 75 MiB | 通过 |

现有 Web `typecheck`（源码与配置）和 `build` 均运行通过；`bun install --frozen-lockfile --ignore-scripts --offline` 验证锁文件与补丁一致。

1 GiB 堆上限下的原检查会 OOM，分离配置后但尚未应用图标补丁的 1.5 GiB 堆上限检查也会 OOM。没有保留这类强行压低堆上限的设置。Bun 直接运行 vue-tsc 在当前环境不能正确识别 Vue 文件，没有采用它绕过检查。

## 生产服务器

首次检查仍须容纳约 1.83 GiB 编译器内存，此外还有 Node 原生内存、系统和正在运行的业务服务。缓存失效后也可能恢复到接近首次检查的开销。不能据增量结果宣称首次检查适合 1–2 GiB 的生产主机。

在资源充足的开发机或 CI 使用现有命令：

```sh
bun run --cwd apps/web typecheck
bun run --cwd apps/web build
```

将同一份通过检查的源码与其构建产物用于发布；不要在低内存生产主机同时运行类型检查和构建。生产部署本身及 Linux OOM 复验未在本次修改中执行。
