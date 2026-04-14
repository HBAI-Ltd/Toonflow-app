# Toonflow-app 工程接手与二开基线

这份文档用于帮助新的实现者先把 `Toonflow-app` 单仓库跑通、读懂，再进入安全的后端二开。范围只覆盖当前仓库，不包含 `Toonflow-web` 前端源码仓库。

## 推荐环境

- Node.js: `20 LTS`
- Yarn: `1.x (Classic)`，首次安装依赖使用 `corepack yarn install`，安装完成后默认通过 `node scripts/runLocalYarn.cjs` 使用
- 首轮健康检查顺序:
  - `corepack yarn install`
  - `node scripts/runLocalYarn.cjs lint`
  - `node scripts/runLocalYarn.cjs build`
  - `node scripts/runLocalYarn.cjs test`
  - `node scripts/runLocalYarn.cjs test:built`

说明:

- 当前仓库的 Electron、TypeScript 和原生依赖，以 Node 20 作为团队统一开发基线更稳妥。
- `yarn test` 会在临时数据目录中启动源码服务，并跳过 embedding 初始化，只用于 API smoke。
- `yarn test:built` 会验证构建产物 `data/serve/app.js`，用于兜住“源码可跑但打包产物回归”的问题。
- 首次依赖安装后，默认建议直接执行 `node scripts/runLocalYarn.cjs <command>`，仓库已固定本地 `yarn@1.22.22`
- 如仍使用 `corepack yarn <command>`，可能看到 `url.parse()` deprecation warning；该 warning 来自 Corepack 自带 Yarn 1，而不是仓库代码

## 命令分工

- `yarn dev`
  - 仅启动本地 API 服务，默认监听 `10588`
  - 不提供前端源码开发能力，只暴露 API 与静态资源
- `yarn dev:gui`
  - 启动 Electron 桌面客户端
  - 同时拉起本地服务，并加载内置的 `data/web` 编译产物
  - 开发态服务端口为动态分配，不应按 `10588` 做假设
- `yarn build`
  - 构建后端服务到 `data/serve/app.js`
  - 构建 Electron 主进程到 `build/main.js`
- `yarn start`
  - 以生产模式运行已构建的服务
- `yarn test`
  - 运行源码入口 `src/app.ts` 的 API 基线 smoke
- `yarn test:dockerfile`
  - 运行 `Dockerfile` 配置 smoke
  - 不依赖本机已安装 Docker
- `yarn test:workflows`
  - 运行 GitHub Actions workflow 配置 smoke
  - 不依赖本机真实触发远端 CI
- `yarn test:built`
  - 先执行 `yarn build`
  - 再运行构建产物 `data/serve/app.js` 的 built-app smoke
- `yarn verify:baseline`
  - 一次性运行 `lint + test + test:built`

## 建议阅读顺序

先按启动链路阅读，再进入业务模块:

1. `scripts/main.ts`
   - Electron 启动入口
   - 首次运行或升级时会把 `data/assets`、`data/models`、`data/serve`、`data/skills`、`data/web`、`data/vendor` 拷贝到用户数据目录
   - GUI 模式默认加载内置 `data/web/index.html`
2. `src/app.ts`
   - Express、Socket.IO、静态资源目录、JWT 白名单
   - 服务入口现在支持显式启动与关闭，便于测试和脚本复用
3. `src/core.ts` 和 `src/routes/**`
   - `src/routes/**/*.ts` 会自动生成 `src/router.ts`
   - 开发态新增路由文件后会在启动时重建路由表
   - 业务域主要集中在 `project`、`novel`、`script`、`production`、`setting`

## 改动落位规则

- 桌面窗口、协议、资源初始化、升级拷贝、打包问题: 优先看 Electron 主进程和打包链路
- 本地业务能力、设置中心、项目/剧本/分镜/出片流程: 优先看 `src/routes/**`
- Skill、供应商脚本、模型资源、内置网页和预置静态资源: 优先看 `data/**`
- 新增后端接口: 沿用 `src/routes/<domain>/<action>.ts` 的现有模式，保持 `/api/...` 增量扩展
- 前端交互源代码改造: 不在本仓库内实现，转到 `Toonflow-web`

## 最小验证基线

### 自动化验证

- `test/api-baseline.test.ts`
  - 登录白名单可用，并返回 Bearer Token
  - 未带 Token 访问受保护接口会被拒绝
  - `loginConfig` 的用户信息更新与新凭据重新登录可用
  - `agentDeploy` 的模型部署配置写入与读回可用
  - `about/checkUpdate` 的补丁更新、无更新、整包重装判定可用
  - `getTextModel` 当前占位返回可用
  - `promptManage` 的读取与覆盖写入可用
  - `memoryConfig` 的默认读取、设置写入、记忆表清空可用
  - `skillManagement` 的列表、内容读取、内容保存、路径穿越拒绝可用
  - `project` 创建和读取链路可用
  - `vendorConfig` 基线链路可用:
    - `getVendorList`
    - `enableVendor`
    - `updateVendorInputs`
    - `addVendorModel`
    - `upVendorModel`
    - `delVendorModel`
    - `addVendor -> updateCode -> modelTest -> deleteVendor`
  - `modelSelect` 基线链路可用:
    - `enableVendor -> getModelList -> getModelDetail`
  - `artStyle` 基线链路可用:
    - `getArtStyle -> addArtStyle -> editArtStyle`
  - `project/visualManual` 基线链路可用:
    - `addVisualManual -> getVisualManual -> editVisualManual -> deleteVisualManual`
  - `project/directorManual` 基线链路可用:
    - `addDirectorManual -> queryDirectorManual -> editDirectorlManual -> deleteDirectorManual`
  - `task` 基线链路可用:
    - `getProject -> getTaskCategories -> getTaskApi -> taskDetails`
  - `general/generalStatistics` 基线链路可用:
    - `generalStatistics (empty project) -> generalStatistics (populated project)`
  - `production flow` 基线链路可用:
    - `getFlowData (default workspace) -> saveFlowData -> getFlowData (saved workspace)`
  - `production media list` 基线链路可用:
    - `getStoryboardData -> workbench/getVideoList`
  - `production generate data` 基线链路可用:
    - `workbench/getGenerateData (missing videoModel) -> workbench/getGenerateData (aggregated payload)`
  - 13 条代表性业务链路已纳入自动化:
    - `modelSelect` 模型列表过滤与模型详情读取
    - `artStyle` 增改查与 OSS 文件落盘
    - `project/visualManual` 文件生命周期、README 标题补写与图片落盘
    - `project/directorManual` 文件生命周期、README 标题补写与图片落盘
    - `task` 项目列表、分类列表、分页过滤与详情读取
    - `project/general` 生命周期
    - `general/generalStatistics` 项目概览统计
    - `production flow` 工作区默认态与已保存态回读
    - `production media list` 分镜列表与工作台视频列表读取
    - `production generate data` 工作台聚合读取与资源编排
    - `script` 生命周期与关联清理
    - `assets` 生命周期与图片/子资产清理
    - `novel` 生命周期与章节事件级联清理
    - `novel/event` 的事件列表、搜索、单删与批量删除
- `test/built-app-smoke.test.ts`
  - 登录内置服务入口
  - 验证构建产物中的 `loginConfig` 更新与重新登录链路
  - 验证构建产物中的 `agentDeploy` 配置写入与读回链路
  - 验证构建产物中的 `about/checkUpdate` 补丁更新判定
  - 验证构建产物中的 `getTextModel` 当前占位返回
  - 验证构建产物中的 `promptManage` 覆盖写入链路
  - 验证构建产物中的 `memoryConfig` 设置与清空链路
  - 验证构建产物中的 `skillManagement` 文件读写链路
  - 验证构建产物中的 `vendorConfig` 自定义 vendor 代码链
  - 验证构建产物中的 `modelSelect` 模型列表与详情读取链路
  - 验证自定义 vendor 文件在构建产物环境下的创建和删除
  - 验证构建产物中的 `artStyle` 增改查与 OSS 文件落盘
  - 验证构建产物中的 `project/visualManual` 文件生命周期与 README/图片落盘
  - 验证构建产物中的 `project/directorManual` 文件生命周期与 README/图片落盘
  - 验证构建产物中的 `task` 项目列表、分类列表、分页过滤与详情读取
  - 验证构建产物中的 `general/generalStatistics` 空项目与聚合统计返回
  - 验证构建产物中的 `production flow` 默认工作区与已保存工作区回读
  - 验证构建产物中的 `production media list` 分镜列表与工作台视频列表读取
  - 验证构建产物中的 `production generate data` 缺失模型分支与聚合读取返回
  - 验证构建产物中的 13 条代表性业务链路:
    - `modelSelect` 模型列表过滤与模型详情读取
    - `artStyle` 增改查与 OSS 文件落盘
    - `project/visualManual` 文件生命周期、README 标题补写与图片落盘
    - `project/directorManual` 文件生命周期、README 标题补写与图片落盘
    - `task` 项目列表、分类列表、分页过滤与详情读取
    - `project/general` 生命周期
    - `general/generalStatistics` 项目概览统计
    - `production flow` 工作区默认态与已保存态回读
    - `production media list` 分镜列表与工作台视频列表读取
    - `production generate data` 工作台聚合读取与资源编排
    - `script` 生命周期
    - `assets` 生命周期
    - `novel` 生命周期
    - `novel/event` 的事件列表、搜索、单删与批量删除

### 手工 smoke

- `yarn dev`
  - 确认服务可启动
  - 验证默认账号 `admin / admin123` 可登录
- `yarn dev:gui`
  - 确认 Electron 窗口能打开
  - 确认内置页面能加载
  - 确认登录和设置页可进入
  - 开发态服务端口为动态分配，不应按 `10588` 做假设
- 若改了 `data/**`
  - 必验首次运行和版本升级后的资源同步行为
- 若改了打包链路
  - 至少补一次目标平台打包 smoke
  - 当前 Windows smoke 路径固定为 `node scripts/runLocalYarn.cjs dist:win`，默认验证 `x64 nsis` 安装包产物
  - 如需发布级验证，可继续执行 `node scripts/runLocalYarn.cjs dist:win:arm64` 或 `node scripts/runLocalYarn.cjs dist:win:all`
- 若改了 `Dockerfile`
  - 先执行 `node scripts/runLocalYarn.cjs test:dockerfile`
  - 再在安装了 Docker CLI 的机器上执行真实 `docker build`
- 若改了 `.github/workflows/**`
  - 先执行 `node scripts/runLocalYarn.cjs test:workflows`
  - 再等待远端 CI 真正跑过对应 workflow

## 当前工程约束

- 本仓库自带的是前端编译产物，不是前端源码
- 路由表由生成脚本维护，不要手改 `src/router.ts`
- 数据目录既参与开发态运行，也参与 Electron 打包后的迁移行为
- 数据库初始化较重，自动化测试通过临时目录和测试专用环境变量规避高成本初始化
- 当前仍有一部分非基线路由依赖 `u` 聚合工具，后续扩展覆盖面时建议按域逐步改成直接依赖，而不是一次性全局重构
- 当前 `url.parse()` deprecation warning 的来源是 Corepack 自带的 Yarn 1；它不阻塞基线，也不是仓库运行时代码缺陷
## Manual Runbook

- `yarn dev`、`yarn start`、`yarn dev:gui` 的手工 smoke 执行步骤见 [docs/MANUAL_SMOKE_RUNBOOK.md](./MANUAL_SMOKE_RUNBOOK.md)
- 如果本轮改动涉及 `openFolder`、`data/**` 或打包链路，不要只依赖 API smoke，要按这份 runbook 做对应的手工验收
- 当前 `dist:win`、`dist:win:arm64` 与 `dist:win:all` 已在本机做过一次完整打包 smoke 并产出安装包，可作为这轮 Electron 启动链与打包链收口依据
- 当前 `dist/win-unpacked/ToonFlow.exe` 也已做过一次启动 smoke，已验证打包产物可直接拉起窗口并接受默认账号登录
- 当前 `ToonFlow-1.1.3-win-x64-setup.exe` 也已做过一次安装包级 smoke，已验证安装后启动与卸载链路
