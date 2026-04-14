# Toonflow-app 手工 Smoke Runbook

这份 runbook 用来补齐当前自动化基线之外，仍然需要人工确认的运行链路。

目标不是替代 `yarn test` / `yarn test:built`，而是把下面几类“必须看一眼真实运行态”的事项固定成统一步骤：

- `yarn dev` 的固定端口服务启动
- `yarn start` 的构建产物启动
- `yarn dev:gui` 的 Electron 桌面启动与基础登录流程
- `openFolder` 在真实桌面环境里的系统拉起行为
- 改动 `data/**` 或打包链路后的额外手工验收

## 使用时机

建议按下面顺序执行：

1. `corepack yarn install`
2. `node scripts/runLocalYarn.cjs lint`
3. `node scripts/runLocalYarn.cjs test:dockerfile`
4. `node scripts/runLocalYarn.cjs test:workflows`
5. `node scripts/runLocalYarn.cjs test`
6. `node scripts/runLocalYarn.cjs test:built`
7. 再执行这份手工 smoke runbook

如果前六步没有通过，先不要进入手工 smoke。

默认建议直接使用本地 Yarn wrapper：

```powershell
node scripts/runLocalYarn.cjs verify:baseline
```

前提是你已经先执行过一次 `corepack yarn install`，让仓库内的 `node_modules/yarn/bin/yarn.js` 落地。

如仍使用 `corepack yarn <command>`，可能看到 `url.parse()` deprecation warning；该 warning 来自 Corepack 自带 Yarn 1，而不是仓库代码。

## 前置准备

- 推荐环境：`Node 20 LTS` + `Yarn Classic 1.x`
- 工作目录：仓库根目录 `Toonflow-app`
- 默认登录账号：`admin / admin123`
- `yarn dev` 与 `yarn start` 默认监听 `10588`
- 当前仓库自带的是编译后的 `data/web`，不是前端源码；本 runbook 不依赖 `Toonflow-web`
- `yarn dev:gui` 现在会先自动执行一次 `rebuild:electron`，用于在 `.electron-runtime/` 里生成 Electron 专用的 `better-sqlite3` 副本；首次启动会比纯服务模式慢，但不会污染根 `node_modules`
- `yarn dev:gui` 开发态不会固定监听 `10588`，而是由 `scripts/main.ts` 启动一个动态端口的本地服务，并通过 Electron 协议把真实 API 地址注入前端
- 开发态 Electron 直接读取仓库内的 `data/**`；只有打包态 Electron 才读取用户数据目录中的 `data/**`

建议在开始前确认：

- 本机没有其他进程占用 `10588`
- 当前机器允许启动 Electron 窗口
- 如需验证首次启动资源复制，请先备份已有用户数据目录，或在一次性测试环境中执行

## 验收 A：`yarn dev`

### 目标

确认源码入口 `src/app.ts` 可以用固定端口跑起来，并且基础登录与鉴权链路正常。

### 步骤

1. 在仓库根目录执行：

```powershell
node scripts/runLocalYarn.cjs dev
```

2. 等待终端出现服务启动成功日志，并确认端口为 `10588`

3. 新开一个 PowerShell 窗口，执行登录验证：

```powershell
$login = Invoke-RestMethod `
  -Uri 'http://127.0.0.1:10588/api/login/login' `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"username":"admin","password":"admin123"}'

$login.code
$login.data.token
```

4. 继续验证带 token 的受保护接口：

```powershell
$token = $login.data.token

$user = Invoke-RestMethod `
  -Uri 'http://127.0.0.1:10588/api/setting/loginConfig/getUser' `
  -Method Get `
  -Headers @{ Authorization = $token }

$user.code
$user.data.name
```

5. 验证不带 token 的受保护接口会被拒绝：

```powershell
curl.exe -i `
  -X POST 'http://127.0.0.1:10588/api/project/getProject' `
  -H 'Content-Type: application/json' `
  -d '{}'
```

### 通过标准

- `yarn dev` 终端没有启动期异常退出
- 登录接口返回 `code: 200`
- 返回值里包含 `Bearer ...` token
- `getUser` 返回 `code: 200`
- 未带 token 调用受保护接口时返回 `401 Unauthorized`

### 结束方式

- 在运行 `yarn dev` 的终端按 `Ctrl+C`

## 验收 B：`yarn start`

### 目标

确认构建产物 `data/serve/app.js` 能以生产模式正常运行，而不是只有源码入口可跑。

### 步骤

1. 先构建：

```powershell
node scripts/runLocalYarn.cjs build
```

2. 启动生产服务：

```powershell
node scripts/runLocalYarn.cjs start
```

3. 按“验收 A”里相同的方法重新执行：

- 登录验证
- 带 token 的 `getUser`
- 不带 token 的 `getProject`

### 通过标准

- `yarn start` 可以稳定监听 `10588`
- 登录与鉴权链路和 `yarn dev` 一致
- 不出现“源码可跑、构建产物不可跑”的分叉

### 结束方式

- 在运行 `yarn start` 的终端按 `Ctrl+C`

## 验收 C：`yarn dev:gui`

### 目标

确认 Electron 主进程、本地服务、内置 `data/web` 页面和基础登录流程能一起跑通。

### 步骤

1. 在仓库根目录执行：

```powershell
node scripts/runLocalYarn.cjs dev:gui
```

2. 观察启动过程：

- 先出现加载窗口
- 再出现主窗口
- 终端没有启动期崩溃
- 如需核对开发态服务是否真正启动，不要假设固定端口；应从终端日志里的 `服务启动成功: http://localhost:<port>` 提取真实端口

3. 在 GUI 中完成登录：

- 用户名：`admin`
- 密码：`admin123`

4. 登录后至少确认以下几点：

- 主界面正常加载，没有白屏
- 设置页可以进入
- 设置页中的基础内容可以正常显示
- 如需补充接口侧验证，可直接对日志中的动态端口执行 `admin / admin123` 登录检查

5. 如果本轮改动涉及以下内容，还要做附加检查：

- 改了 `openFolder`
  - 在 GUI 中触发对应入口
  - 观察系统文件管理器是否真的被拉起
- 改了 `data/**`
  - 至少确认一次首次启动或清洁数据目录下的资源复制行为
- 改了 Electron 主进程或打包链路
  - 至少补一次目标平台打包 smoke

### 通过标准

- Electron 窗口能稳定打开
- 内置页面能加载
- 默认账号能登录
- 设置页可进入
- 如本轮修改涉及桌面行为，关联入口在 GUI 中表现符合预期

### 结束方式

- 正常关闭 Electron 窗口
- 确认终端进程一并退出；若未退出，再手动 `Ctrl+C`

## `openFolder` 专项手工 smoke

自动化当前已经覆盖了 `openFolder` 的路由逻辑，但还没有替代真实桌面行为验证。

当你修改了以下任一位置时，建议额外做一次这条专项手工 smoke：

- Electron 主进程相关逻辑
- `src/routes/setting/fileManagement/openFolder.ts`
- 路径处理逻辑，例如 `src/utils/getPath.ts`

### 检查点

- 从 GUI 中触发“打开文件夹”入口
- 系统文件管理器被真实拉起
- 打开的目录是预期目录，不是错误目录
- 不出现无响应、报错弹窗或拉起错误路径

## `data/**` 资源复制专项 smoke

当本轮改动涉及以下目录时，必须补这条检查：

- `data/assets`
- `data/models`
- `data/serve`
- `data/skills`
- `data/web`
- `data/vendor`

### 检查点

1. 在一次性测试环境或已备份用户数据目录的前提下，启动 `yarn dev:gui`
2. 确认首次运行后，内置资源被复制到 Electron 用户数据目录
3. 如果验证的是升级场景，确认旧目录不会阻止新资源同步
4. 至少抽查一项你本轮改过的文件，确认复制结果落到了用户数据目录中

## 打包专项 smoke

当本轮改动涉及以下内容时，至少补一次目标平台打包验收：

- `scripts/main.ts`
- `electron-builder.yml`
- `data/serve`
- `data/web`
- Electron 资源初始化与升级复制行为

Windows 环境建议执行：

```powershell
node scripts/runLocalYarn.cjs dist:win
```

然后至少确认：

- 打包过程不报错
- 安装包或解压产物能启动
- 登录页能打开
- 设置页能进入

补充说明：

- `node scripts/runLocalYarn.cjs dist:win` 当前固定执行 Windows `x64` 的最小打包 smoke，产物默认是 `nsis` 安装包
- `node scripts/runLocalYarn.cjs dist:win:arm64` 当前用于单独验证 Windows `arm64` 安装包链路
- `node scripts/runLocalYarn.cjs dist:win:all` 当前用于一次性产出 `x64 + arm64 + universal installer` 三类 Windows 安装包
- 当前仓库已经在本机完成过 `dist:win`、`dist:win:arm64` 和 `dist:win:all` 验证，说明 `better-sqlite3` 的多架构原生依赖链已打通
- 当前 `dist/win-unpacked/ToonFlow.exe` 也已做过一次启动 smoke，已验证主窗口可拉起、内置动态端口服务可启动、默认账号 `admin / admin123` 可登录
- 当前 `ToonFlow-1.1.3-win-x64-setup.exe` 也已做过一次安装包级 smoke，已验证“静默安装 -> 安装后启动 -> 默认账号登录 -> 静默卸载”链路可跑通
- 当前实测里，打包态 `ToonFlow.exe` 仍会落到系统真实 `userData` 目录；不要假设单纯覆盖 `APPDATA` 就能完全隔离用户数据
- 当前实测里，NSIS 静默卸载后安装目录删除可能存在几秒延迟；不要把卸载进程刚退出时的短暂目录残留立刻判成失败

## Docker 专项 smoke

当本轮改动涉及以下内容时，建议补这条检查：

- `Dockerfile`
- 容器启动方式
- 容器内依赖安装策略

### 检查点

1. 先执行：

```powershell
node scripts/runLocalYarn.cjs test:dockerfile
```

2. 再在安装了 Docker CLI 的机器上执行：

```powershell
docker build -t toonflow:smoke .
```

3. 如需继续验证运行态，再执行：

```powershell
docker run --rm -p 10588:10588 toonflow:smoke
```

### 通过标准

- `test:dockerfile` 通过
- `docker build` 不报错
- 容器启动后，后端服务可在 `10588` 响应

### 当前已知限制

- `test:dockerfile` 只验证 `Dockerfile` 配置，不替代真实镜像构建
- 如果当前机器未安装 Docker CLI，则只能完成配置 smoke，不能完成真实 `docker build` 验证

## 结果记录模板

建议把每次手工 smoke 的结果按下面格式记下来：

```text
日期：
分支：
执行人：

[dev]
- 启动：通过 / 失败
- 登录：通过 / 失败
- 鉴权：通过 / 失败

[start]
- 启动：通过 / 失败
- 登录：通过 / 失败
- 鉴权：通过 / 失败

[dev:gui]
- 窗口启动：通过 / 失败
- 内置页面加载：通过 / 失败
- 默认账号登录：通过 / 失败
- 设置页进入：通过 / 失败

[专项]
- openFolder：通过 / 未执行 / 不涉及
- data 资源复制：通过 / 未执行 / 不涉及
- 打包 smoke：通过 / 未执行 / 不涉及

备注：
```

## 结论

当前推荐的验收方式是：

- 自动化 smoke 负责兜住后端和构建产物的稳定回归
- 这份 runbook 负责兜住 Electron 真实运行态和系统级行为

两者结合后，`Toonflow-app` 的基线才算完整。
