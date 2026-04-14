# Toonflow-app 接手速查表

这份速查表只覆盖 `Toonflow-app` 单仓库，目标是让新的接手者在最短时间内知道：

- 先跑哪些命令
- 启动链路怎么分层理解
- 一次改动应该落在哪
- 改完后最低限度要验什么

## 1. 推荐环境

- Node：`20 LTS`
- Yarn：`1.x Classic`
- 首次安装依赖使用 `corepack yarn install`
- 安装完成后，默认通过 `node scripts/runLocalYarn.cjs` 执行

建议首轮健康检查顺序：

```powershell
corepack yarn install
node scripts/runLocalYarn.cjs lint
node scripts/runLocalYarn.cjs test
node scripts/runLocalYarn.cjs test:built
node scripts/runLocalYarn.cjs verify:baseline
```

如果你仍想沿用 `corepack yarn` 也可以，但默认不再推荐，因为那条 `url.parse()` deprecation warning 来自 Corepack 自带 Yarn 1，而不是仓库代码。

仓库内本地 Yarn wrapper 已验证可用，但它依赖 `node_modules/yarn/bin/yarn.js`，所以第一次必须先执行一次 `corepack yarn install`：

```powershell
node scripts/runLocalYarn.cjs verify:baseline
```

## 2. 命令分工

- `node scripts/runLocalYarn.cjs dev`
  - 启动源码态本地 API
  - 固定监听 `10588`
- `node scripts/runLocalYarn.cjs start`
  - 启动构建产物 `data/serve/app.js`
  - 固定监听 `10588`
- `node scripts/runLocalYarn.cjs dev:gui`
  - 启动 Electron 开发态桌面客户端
  - 前置执行 `rebuild:electron`
  - API 端口为动态分配，不能假设是 `10588`
- `node scripts/runLocalYarn.cjs build`
  - 生成 `data/serve/app.js`
  - 生成 `build/main.js`
- `node scripts/runLocalYarn.cjs dist:win`
  - Windows `x64 nsis` 最小打包 smoke
- `node scripts/runLocalYarn.cjs dist:win:arm64`
  - Windows `arm64 nsis` 打包
- `node scripts/runLocalYarn.cjs dist:win:all`
  - 一次性产出 `x64 + arm64 + universal installer`

## 3. 启动链路

推荐阅读顺序：

1. `scripts/main.ts`
2. `src/app.ts`
3. `src/core.ts`
4. `src/routes/**`

关键事实：

- 开发态 Electron 直接读取仓库内 `data/**`
- 打包态 Electron 读取用户数据目录里的 `data/**`
- 首次运行或升级时，Electron 会复制 `data/assets`、`data/models`、`data/serve`、`data/skills`、`data/web`、`data/vendor`
- 路由通过扫描 `src/routes/**/*.ts` 生成 `src/router.ts`

## 4. 改动落位

- 改窗口、协议、资源复制、升级迁移、打包：优先看 `scripts/main.ts` 和打包链
- 改 API、业务流程、设置中心、本地能力：优先看 `src/routes/**`
- 改 vendor、skills、模型资源、内置静态网页：优先看 `data/**`
- 改前端源代码交互：不在本仓库，转 `Toonflow-web`

## 5. 当前基线

自动化基线已经覆盖：

- `lint`
- 源码态 API smoke
- built 态 smoke
- `production flow`
- `production media list`
- `production workbench getGenerateData`
- `project / script / assets / novel / event / setting / task / artStyle` 代表性链路

真实运行链也已经验证过：

- `yarn dev`
- `yarn start`
- `yarn dev:gui`
- `dist:win`
- `dist:win:arm64`
- `dist:win:all`

## 6. 改完必验

最低要求：

```powershell
node scripts/runLocalYarn.cjs verify:baseline
```

如果改了 Electron、`data/**` 或打包链，还要补手工/运行态 smoke：

- `node scripts/runLocalYarn.cjs dev`
- `node scripts/runLocalYarn.cjs start`
- `node scripts/runLocalYarn.cjs dev:gui`
- 需要时再跑 `node scripts/runLocalYarn.cjs dist:win`

## 7. 默认账号

- 用户名：`admin`
- 密码：`admin123`

## 8. 当前已知约束

- `src/router.ts` 是生成文件，不要手改
- `url.parse()` deprecation warning 只会出现在 `corepack yarn ...` 这条路径里，来源是 Corepack 自带的 Yarn 1，不是仓库运行时代码
- 仓库已经提供 [runLocalYarn.cjs](F:\新会话\Toonflow-app\scripts\runLocalYarn.cjs)，可直接调用本地 `yarn@1.22.22`，绕开 Corepack 那条 warning
- 一些 smoke 临时目录里会出现 `data/web` 不存在提示，这是测试噪音，不是主链路失败
