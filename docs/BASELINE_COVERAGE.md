# Toonflow-app 基线覆盖盘点

这份文档记录当前 `Toonflow-app` 单仓库的工程基线覆盖情况，目标是帮助后续二开时快速判断：

- 哪些链路已经有自动化 smoke 兜底
- 哪些链路仍然只适合手工 smoke
- 哪些缺口已经缩小到“分支级”而不是“整条路由空白”

## 当前验证命令

- `node scripts/runLocalYarn.cjs lint`
- `node scripts/runLocalYarn.cjs test:dockerfile`
- `node scripts/runLocalYarn.cjs test:workflows`
- `node scripts/runLocalYarn.cjs test`
- `node scripts/runLocalYarn.cjs test:built`
- `node scripts/runLocalYarn.cjs verify:baseline`

说明：

- `yarn test` 走源码入口 `src/app.ts`
- `yarn test:dockerfile` 只验证 `Dockerfile` 的配置基线，不依赖本机已安装 Docker
- `yarn test:workflows` 只验证 GitHub Actions workflow 配置基线，不依赖本机触发远端 CI
- `yarn test:built` 会先 `yarn build`，再走构建产物 `data/serve/app.js`
- 两条路径都通过，才说明“源码可跑”和“构建产物可跑”同时成立
- 如仍使用 `corepack yarn ...`，可能看到外部 Corepack/Yarn 1 带来的 `url.parse()` deprecation warning；这不是仓库运行时代码告警

补充说明：

- `test:dockerfile` 当前钉住的容器基线包括：`Node 20` 基础镜像、`corepack enable`、镜像构建期执行后端 build、`NODE_ENV=prod`，以及容器默认启动 `data/serve/app.js`
- `test:workflows` 当前钉住的 CI 基线包括：`.github/workflows/docker-smoke.yml` 存在且会执行 `verify:baseline + docker build`，以及 `debug.yml` / `release.yml` 都统一使用 `Node 20 + Corepack`
- 它不能替代真实 `docker build`；真实镜像构建仍需在安装了 Docker CLI 的机器上单独执行

## 已纳入源码 smoke

以下链路已经在 `test/api-baseline.test.ts` 中覆盖：

- 登录白名单：`/api/login/login`
- JWT 鉴权保护：未带 token 访问受保护接口会返回 `401`
- `setting/loginConfig`
  - `getUser`
  - `updateUserPwd`
- `setting/dev`
  - `getSwitchAiDevTool`
  - `updateSwitchAiDevTool`
- `setting/promptManage`
  - `getPrompt`
  - `updatePrompt`
- `setting/agentDeploy`
  - `getAgentDeploy`
  - `deployAgentModel`
  - `agentSetKey`
- `setting/about`
  - `checkUpdate`
  - `downloadApp`
- `setting/dbConfig`
  - `clearData`
- `setting/fileManagement`
  - `openFolder`
- `setting/getTextModel`
  - 当前只钉住现状占位返回 `"123"`
- `setting/memoryConfig`
  - `getMemory`
  - `sureMemory`
  - `delAllMemory`
- `setting/skillManagement`
  - `getSkillList`
  - `getSkillContent`
  - `saveSkillContent`
  - 路径穿越拒绝
- `setting/vendorConfig`
  - `getVendorList`
  - `enableVendor`
  - `updateVendorInputs`
  - `addVendorModel`
  - `upVendorModel`
  - `delVendorModel`
  - `addVendor`
  - `updateCode`
  - `modelTest`
  - `getCodeByLink`
  - `deleteVendor`
- `modelSelect`
  - `getModelList`
  - `getModelDetail`
- `artStyle`
  - `getArtStyle`
  - `addArtStyle`
  - `editArtStyle`
- `task`
  - `getProject`
  - `getTaskCategories`
  - `getTaskApi`
  - `taskDetails`
- `general`
  - `getSingleProject`
  - `updateProject`
  - `generalStatistics`
- `production`
  - `getFlowData`
  - `saveFlowData`
  - `getStoryboardData`
  - `workbench/getVideoList`
- `project`
  - `addProject`
  - `editProject`
  - `delProject`
  - `getProject`
- `project/visualManual`
  - `addVisualManual`
  - `getVisualManual`
  - `editVisualManual`
  - `deleteVisualManual`
- `project/directorManual`
  - `addDirectorManual`
  - `queryDirectorManual`
  - `editDirectorlManual`
  - `deleteDirectorManual`
- `script`
  - `addScript`
  - `getScrptApi`
  - `updateScript`
  - `delScript`
- `assets`
  - `addAssets`
  - `getAssetsApi`
  - `updateAssets`
  - `delAssets`
- `novel`
  - `addNovel`
  - `getNovel`
  - `getNovelData`
  - `getNovelIndex`
  - `getNovelEventState`
  - `updateNovel`
  - `delNovel`
  - `batchDeleteNovel`
- `novel/event`
  - `getEvent`
  - `deletEvent`
  - `batchDeleteEvent`

## 已纳入 built smoke

以下链路已经在 `test/built-app-smoke.test.ts` 中覆盖：

- `setting/loginConfig`
  - `updateUserPwd`
  - `getUser`
- `setting/getTextModel`
- `setting/about`
  - `checkUpdate`
  - `downloadApp`
- `setting/dbConfig`
  - `clearData`
- `setting/fileManagement`
  - `openFolder`
- `setting/promptManage`
  - `getPrompt`
  - `updatePrompt`
- `setting/agentDeploy`
  - `getAgentDeploy`
  - `deployAgentModel`
  - `agentSetKey`
- `setting/memoryConfig`
  - `getMemory`
  - `sureMemory`
  - `delAllMemory`
- `setting/skillManagement`
  - `getSkillList`
  - `getSkillContent`
  - `saveSkillContent`
- `setting/vendorConfig`
  - `addVendor`
  - `updateCode`
  - `modelTest`
  - `getCodeByLink`
  - `deleteVendor`
- `modelSelect`
  - `getModelList`
  - `getModelDetail`
- `artStyle`
  - `getArtStyle`
  - `addArtStyle`
  - `editArtStyle`
- `task`
  - `getProject`
  - `getTaskCategories`
  - `getTaskApi`
  - `taskDetails`
- `general`
  - `getSingleProject`
  - `updateProject`
  - `generalStatistics`
- `production`
  - `getFlowData`
  - `saveFlowData`
  - `getStoryboardData`
  - `workbench/getVideoList`
- `project`
  - `addProject`
  - `editProject`
  - `delProject`
  - `getProject`
- `project/visualManual`
  - `addVisualManual`
  - `getVisualManual`
  - `editVisualManual`
  - `deleteVisualManual`
- `project/directorManual`
  - `addDirectorManual`
  - `queryDirectorManual`
  - `editDirectorlManual`
  - `deleteDirectorManual`
- `script`
  - `addScript`
  - `getScrptApi`
  - `updateScript`
  - `delScript`
- `assets`
  - `addAssets`
  - `getAssetsApi`
  - `updateAssets`
  - `delAssets`
- `novel`
  - `addNovel`
  - `getNovel`
  - `getNovelData`
  - `getNovelIndex`
  - `getNovelEventState`
  - `updateNovel`
  - `delNovel`
  - `batchDeleteNovel`
- `novel/event`
  - `getEvent`
  - `deletEvent`
  - `batchDeleteEvent`

说明：

- built smoke 的重点不是把所有源码 smoke 全量重复一遍，而是确认构建产物中的关键启动链和代表性业务链没有回归
- 当前已经覆盖“登录 -> 设置域写入 -> 资源下载更新 -> 数据库重建 -> 文件夹打开路由 -> vendor 代码链 -> 美术风格 -> 任务查询 -> production flow 工作区 -> production 分镜/视频列表 -> production generate data 聚合读取 -> 项目/剧本/资产/小说/事件生命周期”这些构建后最容易出问题的路径

## `clearData` 当前验证内容

`setting/dbConfig/clearData` 当前已经在源码态和 built 态同时覆盖，断言点包括：

- 带有效 token 调用清库接口成功
- 旧 token 在清库后立即失效
- 被修改过的登录账号恢复为默认 `admin / admin123`
- 被修改过的 `memoryConfig` 恢复为初始化默认值
- 代表性业务数据会被清空并重新初始化
- 数据库能在同一次请求后继续被后续接口正常读取

这条覆盖的价值在于，它不只是验证“删表没报错”，而是验证“删表 + 重建默认数据 + 鉴权密钥轮换”整条链路没坏。

## `checkUpdate` 当前验证内容

`setting/about/checkUpdate` 当前已经覆盖以下场景：

- patch 新版本时，返回增量更新信息，`reinstall = false`
- 当前已是最新版本时，返回 `needUpdate = false`
- major 新版本时，返回安装包下载信息，`reinstall = true`
- 缺少 zip 增量包时，返回业务 `400`
- 缺少当前平台安装包时，返回业务 `400`
- 命中的 zip 下载项缺少 `url` 等关键字段时，返回业务 `400`
- 命中的当前平台安装项缺少 `url` 等关键字段时，返回业务 `400`
- 上游返回非法 JSON 时，返回业务 `400`
- 上游网络不可达时，返回业务 `400`
- 上游返回缺少 `data[source]` 的 payload 时，返回业务 `400`
- 上游返回缺少 `version` 的 payload 时，返回业务 `400`
- 上游返回非法版本串时，返回业务 `400`

当前源码 smoke 已覆盖上述所有主分支和代表性错误分支，built smoke 也覆盖了 patch 成功、缺少 zip 包、命中的下载项缺少关键字段，以及上游非法 JSON / 网络不可达 / 缺字段 payload / 非法版本串的错误场景。

## `downloadApp` 当前验证内容

`setting/about/downloadApp` 当前已经覆盖两类分支：

- `reinstall = true`
  - 只返回“手动下载并安装”的成功提示
  - 不下载文件
  - 不覆盖 `serve/web/skills/models`
  - 不创建残留 `data/temp`
- `reinstall = false`
  - 下载 zip 更新包
  - 解压到 `data/temp`
  - 将 `serve/web/skills/models` 拷贝回正式数据目录
  - 已存在文件被覆盖
  - 临时目录在完成后被清理
  - 下载 URL 不可达时，返回业务 `400`
  - 下载内容不是合法 zip 时，返回业务 `400`
  - 复制阶段文件系统失败时，返回业务 `400`
  - 当前面的目标目录已复制成功、后面的目标目录复制失败时，前面已经写入的目录会回滚到失败前状态
  - 失败后不会覆盖 `serve/web/skills/models`
  - 失败后不会残留 `data/temp`

这条覆盖同时跑在源码态和 built 态，因此已经能较稳定地挡住“更新链路改坏但手工未发现”的回归。

## `vendorConfig` 当前验证内容

`setting/vendorConfig` 当前已经不只覆盖主链增删改查，也补上了代表性的校验失败与边界分支：

- `addVendor`
  - 合法 vendor 脚本可写入配置和本地代码文件
  - schema 校验失败时返回业务 `400`
  - 缺少必需导出时返回 `HTTP 400`
  - `id` 包含冒号时会被 schema 拒绝
  - 重复 `id` 时返回失败
  - 校验失败或重复 `id` 后不会落盘错误文件，也不会把已有配置写坏
- `updateCode`
  - 合法代码更新会同步刷新配置和本地代码文件
  - schema 校验失败时返回业务 `400`
  - 缺少必需导出时返回 `HTTP 400`
  - 非存在 `id` 的更新会返回业务 `400`，且不会新落盘 vendor 文件
  - 请求 `id` 与 `vendor.id` 不一致时会返回业务 `400`
  - 失败后不会覆盖已有 vendor 文件，也不会污染已有配置

补充说明：

- `addVendor` / `updateCode` 的“缺少必需导出”分支，当前历史契约并不统一：
  - `HTTP status = 400`
  - 但响应体仍沿用 `success(...)` 结构，表现为 `code = 200`
- 这类历史不一致当前已经被 smoke 明确钉住，但本轮没有主动修改运行时契约

当前源码 smoke 已覆盖成功链路、schema 校验失败、缺导出失败、重复 `id` 失败，以及失败后“不写坏状态”的断言；built smoke 也覆盖了不存在 `id`、`vendor.id` 不一致等代表性的失败分支。

## `modelSelect` 当前验证内容

`modelSelect` 这条模型选择链路当前已经在源码态和 built 态同时覆盖：

- `modelSelect/getModelList`
  - 在测试内新增并启用自定义 vendor 后，可按 `type = "text"` 返回可选模型列表
  - 列表结果会带出 `id`、`label`、`value`、`type` 与供应商展示名 `name`
- `modelSelect/getModelDetail`
  - 可按前端真实使用的 `${vendorId}:${modelName}` 形式读取单个模型详情
  - 返回结果会带出 `modelName`、`name`、`type` 以及文本模型的 `think` 配置

补充说明：

- 这轮 smoke 刻意不依赖默认种子模型，而是先在测试里通过 `vendorConfig` 动态新增、更新并启用自定义 vendor，再验证 `modelSelect` 链路能否正确读回
- 源码态 smoke 先真实暴露了 `modelSelect/getModelList` 仍依赖 `u.db` 的运行时问题；此前真实请求下会触发 `TypeError: ...db is not a function` 并返回 `500`
- 当前已改为直接依赖命名导出的 `db` 查询启用的 vendor 列表，因此源码态与 built 态都已回归通过

## `artStyle` 当前验证内容

`artStyle` 这条美术风格增改查链路当前已经在源码态和 built 态同时覆盖：

- `artStyle/getArtStyle`
  - 可读取当前风格列表
  - 返回结果中的 `fileUrl` 会被转换成 `/oss/artStyle/...` 的可访问 URL
- `artStyle/addArtStyle`
  - 可接收 base64 图片并写入 `data/oss/artStyle`
  - 新增后可在列表中读取到对应记录，且 `label` 会跟随 `name`
- `artStyle/editArtStyle`
  - 可按 `id` 更新风格名称、提示词与图片
  - 更新后会返回新的 OSS 文件 URL，且落盘文件存在

补充说明：

- 这轮 smoke 先真实暴露了 `getArtStyle` 仍依赖 `u.db` 的运行时问题；此前真实请求下会触发 `TypeError: ...db is not a function` 并返回 `500`
- 同一轮 smoke 也暴露了 `addArtStyle` 未写入 `o_artStyle.id` 主键的实现缺口；当前已按仓库现有模式补为 `Date.now()` 整数主键
- 因此当前这条覆盖不只是补了接口断言，也实际修掉了一组此前未被自动化触发出来的运行时与落库问题

## `task` 当前验证内容

`task` 这条任务查询链路当前已经在源码态和 built 态同时覆盖：

- `task/getProject`
  - 可返回当前存在任务项目的项目列表
- `task/getTaskCategories`
  - 可返回去重后的 `taskClass` 分类列表
- `task/getTaskApi`
  - 可按分页读取任务列表
  - 支持按 `taskClass`、`state`、`projectId` 过滤
  - 列表结果会带出关联项目名称
- `task/taskDetails`
  - 可按 `taskId` 读取单条任务详情

补充说明：

- 这轮 smoke 直接暴露并修正了 `task/getProject`、`task/getTaskCategories`、`task/getTaskApi`、`task/taskDetails` 对 `u.db` 的运行时依赖问题；此前真实请求下会触发 `TypeError: ...db is not a function` 并返回 `500`
- 为了让这条链路保持离线闭环，测试通过夹具直接向 `o_tasks` 插入代表性任务数据，再验证接口的分页、过滤与详情读取，而不是引入更重的异步任务执行链路

## `project/general` 当前验证内容

`project` 与 `general` 这条项目生命周期链路当前已经在源码态和 built 态同时覆盖：

- `project/addProject`
  - 可新增项目并在列表中看到新项目
- `general/getSingleProject`
  - 可按 `id` 读取单个项目详情
- `general/updateProject`
  - 可做局部字段更新，且未传字段不会被这条接口意外改坏
- `project/editProject`
  - 可做完整项目信息更新
- `project/delProject`
  - 删除项目后，项目列表与单项目详情都会消失
  - 代表性的项目级关联数据会一起被清理
  - 当前 smoke 已明确覆盖 `o_tasks`、`o_agentWorkData` 与 `memories(isolationKey like "<projectId>:%")` 的级联删除

补充说明：
- 这轮 smoke 顺手暴露并修正了 `general/getSingleProject`、`general/updateProject`、`project/editProject`、`project/delProject` 对 `u.db` 的运行时依赖问题，改为稳定的直接 `db` 引入方式
- 因此当前这条覆盖不只是“新增了一组接口断言”，也实际挡住了一类此前未被触发出来的运行时 `500` 回归

## `general/generalStatistics` 当前验证内容

`general/generalStatistics` 这条项目概览统计链路当前已经在源码态和 built 态同时覆盖：

- 空项目统计
  - 新建项目后立即请求会稳定返回 `roleCount = 0`、`scriptCount = 0`、`videoCount = 0`、`storyboardCount = 0`
  - 当前 smoke 明确钉住了这条聚合查询在“无脚本、无视频、无分镜”场景下不会抛出运行时错误
- 有代表性数据时的聚合统计
  - 通过真实 API 新增 `role` 资产与剧本后，再补最小 `video` 与 `storyboard` 数据，请求会返回 `1 / 1 / 1 / 1`
  - 这条断言覆盖了项目概览页最核心的四个统计字段：角色数、剧本数、视频数、分镜数

补充说明：
- 这轮 smoke 先真实暴露了 `general/generalStatistics` 仍依赖 `u.db` 的运行时问题；此前真实请求下会触发 `TypeError: ...db is not a function` 并返回 `500`
- 同一轮 smoke 也暴露了这条接口仍按中文 `"角色"` / `"分镜"` 查询，而仓库现有真实资产枚举已经统一为 `role` / `storyboard`
- 当前已改为直接依赖命名导出的 `db`，并按仓库现有枚举统计，因此源码态与 built 态都已回归通过

## `production/getFlowData` / `production/saveFlowData` 当前验证内容

`production` 这条工作区链路当前已经在源码态和 built 态同时覆盖：

- 默认空工作区分支
  - 新建项目、剧本、父资产与子资产后，在没有 `o_agentWorkData` 记录时请求 `getFlowData`，会稳定返回默认工作区结构
  - 当前 smoke 明确钉住了 `script`、空 `scriptPlan`、空 `storyboardTable`、`workbench.videoList = []`
  - 资产列表会带回父资产与 `derive` 子资产，图片路径会统一转换为 `/oss/...`
- 已保存工作区分支
  - 通过最小 `storyboard` 与 `o_assets2Storyboard` 夹具，加上 `saveFlowData -> getFlowData` 回读，验证已保存工作区重建逻辑
  - 当前 smoke 明确覆盖 `scriptPlan`、`storyboardTable`、`workbench.videoList`、分镜排序与 `index`、`associateAssetsIds`、`videoDesc`、`shouldGenerateImage` 以及 `/oss/...` URL 转换

补充说明：

- 这轮 smoke 先真实暴露了 `production/getFlowData` 与 `production/saveFlowData` 仍依赖 `u.db` 的运行时问题；此前真实请求下会触发 `TypeError: ...db is not a function` 并返回 `500`
- 当前已改为直接依赖命名导出的 `db`，并把 `o_agentWorkData` 的 `projectId / episodesId` 查询收敛为直接数值比较，因此源码态与 built 态都已回归通过

## `production/getStoryboardData` / `production/workbench/getVideoList` 当前验证内容

`production` 这条分镜与视频列表读取链路当前已经在源码态和 built 态同时覆盖：

- `getStoryboardData`
  - 通过最小 `storyboard + assets + image` 数据闭环，验证分镜会按 `index` 升序返回
  - 当前 smoke 明确覆盖 `id` 字符串化、`duration` 数值化、`prompt`、`scriptId`、分镜图片 `/oss/...` URL 转换
  - 同时覆盖每条分镜关联角色列表的 `name`、`type` 与头像 `/oss/...` URL 转换
- `workbench/getVideoList`
  - 通过最小 `storyboard.trackId + video.videoTrackId` 数据闭环，验证工作台视频列表能正确读回
  - 当前 smoke 明确覆盖只返回命中当前分镜轨道的 `video`，不会把无关 `videoTrackId` 的视频混进结果
  - 同时覆盖视频 `state` 保留与 `/oss/...` URL 转换

补充说明：

- 这轮 smoke 先真实暴露了 `production/getStoryboardData` 与 `production/workbench/getVideoList` 仍依赖 `u.db` 的运行时问题；此前真实请求下会触发 `TypeError: ...db is not a function` 并返回 `500`
- 当前已改为直接依赖命名导出的 `db`，因此源码态与 built 态都已回归通过

## `production/workbench/getGenerateData` 当前验证内容

`production/workbench/getGenerateData` 这条工作台聚合读取链路当前已经在源码态和 built 态同时覆盖：

- 缺少 `videoModel` 的分支
  - 项目未配置视频模型时，接口会稳定返回业务 `400`
  - 这条断言用于兜住“项目配置缺失时直接抛运行时异常”的回归
- 合法 `vendor + model` 的聚合分支
  - 通过最小 `vendorConfig + vendor.ts + storyboard + assets + videoTrack + video` 数据闭环，验证接口能稳定返回 `storyboardList` 与 `trackList`
  - 当前 smoke 明确覆盖 `storyboardList` 按 `index` 升序、分镜图片 `/oss/...` 路径转换、`track.prompt / duration / state / reason / selectVideoId`
  - 当前 smoke 还明确覆盖 `medias` 的拼装顺序为“有图资产 -> storyboard -> 无图资产”，以及同一 track 下重复资产只保留一次
  - 当前 smoke 同时覆盖 `videoList` 的 `/oss/...` 路径转换和 `已完成 / 生成中` 状态映射

补充说明：

- 这轮 smoke 先真实暴露了 `production/workbench/getGenerateData` 仍依赖 `u.db` 的运行时问题，以及模型缺失时缺少防御分支、`selectVideoId` 读错字段的问题
- 当前已改为直接依赖命名导出的 `db`，补上缺失模型的业务 `400` 分支，并修正 `selectVideoId` 读取，因此源码态与 built 态都已回归通过
- 由于接口当前仍按既有约定生成 `http://127.0.0.1:10588/oss/...` 形式的资源地址，smoke 断言固定比对 URL pathname，而不是临时测试端口

## `project/visualManual` 当前验证内容

`project/visualManual` 这条视觉手册文件型业务链路当前已经在源码态和 built 态同时覆盖：

- `project/addVisualManual`
  - 非法 `name` 包含路径分隔符时会返回业务 `400`，且不会落盘目录
  - 合法请求会在 `data/skills/art_skills/<stylePath>` 下创建 `README.md`、`prefix.md`、`art_prompt/*.md`、`driector_skills/*.md` 与 `images`
  - `README.md` 第一行会写入展示名 `name`
- `project/getVisualManual`
  - 可读回 `name`、`stylePath`、`image` 和 `data`
  - 返回的图片路径会转换成 `/skills/art_skills/...` 的可访问 URL
- `project/editVisualManual`
  - 可更新 README、前缀和代表性视觉提示词文档内容
  - 支持“保留已有 http 图片 + 新增 base64 图片”的混合编辑
- `project/deleteVisualManual`
  - 删除后目录会消失
  - 列表结果中不再返回已删除的视觉手册

补充说明：

- 这轮 smoke 用内置 `data/web` 编译产物反查了真实前端契约，确认新增和编辑时前端会提交完整的视觉手册模板数组，但不会主动把标题行拼进 README
- 因此源码态与 built 态 smoke 都明确钉住了 `README.md` 第一行必须由后端补写 `name`
- 这也真实暴露并修正了 `project/addVisualManual` 的一个行为缺口：旧实现只写 `item.data`，导致新增后 README 标题丢失，与现有前端契约不一致
- 当前删除链路也按前端真实契约验证了 `name` 参数上传的是目录 slug `stylePath`，而不是展示名

## `project/directorManual` 当前验证内容

`project/directorManual` 这条导演手册文件型业务链路当前已经在源码态和 built 态同时覆盖：

- `project/addDirectorManual`
  - 非法 `name` 包含路径分隔符时会返回业务 `400`，且不会落盘目录
  - 合法请求会在 `data/skills/story_skills/<directorManual>` 下创建 `README.md`、`driector_skills/*.md` 与 `images`
  - `README.md` 第一行会写入展示名 `name`
- `project/queryDirectorManual`
  - 可读回 `name`、`directorManual`、`image` 和 `data`
  - 返回的图片路径会转换成 `/skills/story_skills/...` 的可访问 URL
- `project/editDirectorlManual`
  - 可更新 README 与导演叙事文档内容
  - 支持“保留已有 http 图片 + 新增 base64 图片”的混合编辑
- `project/deleteDirectorManual`
  - 删除后目录会消失
  - 列表结果中不再返回已删除的导演手册

补充说明：

- 这轮 smoke 用内置 `data/web` 编译产物反查了真实前端契约，确认新增和编辑时前端传入的 `data` 不会主动把标题行拼进 README
- 因此源码态与 built 态 smoke 都明确钉住了 `README.md` 第一行必须由后端补写 `name`
- 这也真实暴露并修正了 `project/addDirectorManual` 的一个行为缺口：旧实现只写 `item.data`，导致新增后 README 标题丢失，与现有前端契约不一致
- 当前删除链路也按前端真实契约验证了 `name` 参数上传的是目录 slug `directorManual`，而不是展示名

## `script` 当前验证内容

`script` 这条剧本生命周期链路当前已经在源码态和 built 态同时覆盖：

- `script/addScript`
  - 超过 3000 字内容会返回业务 `400`
  - 合法请求可创建剧本并写入 `o_script`
  - 传入 `assets` 时，会只关联真实存在的资产到 `o_scriptAssets`
- `script/getScrptApi`
  - 可按 `projectId` 读取剧本列表
  - 返回结果会拼装 `relatedAssets`
  - 超长创建失败的脏数据不会混进结果列表
- `script/updateScript`
  - 可更新剧本名称和内容
  - 传入 `assets = []` 时，会真正清空既有资产关联，而不是保留旧的 `o_scriptAssets`
- `script/delScript`
  - 删除剧本后，列表中不再能读到该剧本
  - 当前 smoke 已明确覆盖 `o_scriptAssets`、`o_storyboard`、`o_video`、`o_assets2Storyboard` 与按 `projectId + episodesId` 命中的 `o_agentWorkData` 清理

补充说明：

- 这轮 smoke 直接暴露并修正了 `script/addScript`、`script/getScrptApi`、`script/updateScript`、`script/delScript` 对 `u.db` 的运行时依赖问题；在真实请求下此前会触发 `TypeError: ...db is not a function` 并返回 `500`
- 同时顺手修正了 `script/updateScript` 的一个真实回归风险：旧实现只有在 `assets.length > 0` 时才先删关联，导致 `assets = []` 无法清空剧本资产关系
- 因此当前这条覆盖不只是“补了一组接口断言”，也实际拦住了一个已被 smoke 复现出来的运行时 `500` 和一个明确的数据一致性问题

## `assets` 当前验证内容

`assets` 这条资产生命周期链路当前已经在源码态和 built 态同时覆盖：

- `assets/addAssets`
  - 可新增资产并写入 `o_assets`
- `assets/getAssetsApi`
  - 可按 `projectId + type` 读取资产列表
  - 支持按 `name` 过滤父级资产
  - 返回结果会携带 `sonAssets`
- `assets/updateAssets`
  - 可更新资产名称、描述、备注与提示词
- `assets/delAssets`
  - 删除父资产后，列表中不再能读到该资产
  - 当前 smoke 已明确覆盖父资产图片文件删除、`o_image` 记录删除、子资产清理，以及其他引用同一 `imageId` 的资产会被回写为 `null`

补充说明：

- 这轮 smoke 直接暴露并修正了 `assets/addAssets`、`assets/getAssetsApi`、`assets/updateAssets`、`assets/delAssets` 对 `u.db` 的运行时依赖问题；在真实请求下此前会触发 `TypeError: ...db is not a function` 并返回 `500`
- 因此当前这条覆盖不只是“补了一组资产接口断言”，也实际拦住了一类此前未被自动化触发出来的运行时 `500`

## `novel` 当前验证内容

`novel` 这条小说原文生命周期链路当前已经在源码态和 built 态同时覆盖：

- `novel/addNovel`
  - 可批量新增章节原文
  - 当前 smoke 会验证新增后能立即读到连续的 `chapterIndex`
- `novel/getNovel`
  - 可按 `projectId` 分页读取章节列表
  - 支持按 `chapter` 关键字搜索
- `novel/getNovelData`
  - 可读取项目下原文完整数据
- `novel/getNovelIndex`
  - 可读取按 `chapterIndex` 排序的索引列表
- `novel/getNovelEventState`
  - 可读取已完成事件提取的章节状态
- `novel/updateNovel`
  - 可更新章节标题、卷名、正文与事件摘要
- `novel/delNovel`
  - 删除单章节后，章节本身与其关联的 `o_eventChapter`、`o_event` 都会被清理
- `novel/batchDeleteNovel`
  - 空 `ids` 会返回业务 `400`
  - 批量删除后，剩余章节与事件关联都能正确清空

补充说明：

- 这轮 smoke 直接暴露并修正了 `novel/addNovel`、`novel/getNovel`、`novel/getNovelData`、`novel/getNovelIndex`、`novel/getNovelEventState`、`novel/updateNovel`、`novel/delNovel`、`novel/batchDeleteNovel` 对 `u.db` 的运行时依赖问题；在真实请求下此前会触发 `TypeError: ...db is not a function` 并返回 `500`
- 为了保持默认工程基线可离线运行，`addNovel` 当前通过测试专用 seam `TOONFLOW_MOCK_CLEAN_NOVEL=1` 跳过真实 AI 文本清洗；正式运行时不设置该环境变量，仍然走真实 `CleanNovel` 流程
- 这轮还顺手修正了 `delNovel` / `batchDeleteNovel` 的一个真实清理 bug：旧实现误用 `o_eventChapter.id` 去删 `o_event`，在 `eventId` 与关联表主键不一致时会残留孤儿事件

## `novel/event` 当前验证内容

`novel/event` 这条小说事件聚合与删除链路当前已经在源码态和 built 态同时覆盖：

- `novel/event/getEvent`
  - 通过直接插入 `o_event` / `o_eventChapter` 关联验证离线闭环
  - 可按 `projectId` 返回事件总数、分页列表、`eventName` 与关联 `chapters`
  - 支持按 `search` 对事件名称过滤
- `novel/event/deletEvent`
  - 删除单个事件后，`o_event` 与 `o_eventChapter` 对应记录都会被清理
- `novel/event/batchDeleteEvent`
  - 批量删除剩余事件后，事件列表会回到空结果

补充说明：

- 这轮 smoke 刻意不触碰 `generateEvents` 等 AI 重路径，只覆盖数据库可离线闭环，保证默认工程基线可稳定回归
- 源码态测试先真实暴露了 `getEvent` 使用默认导出 `db.raw(...)` 的运行时问题；由于 `src/utils/db.ts` 的默认导出不会可靠暴露 Knex 的 `raw` 方法，此前会触发 `TypeError: ...raw is not a function` 并返回 `500`
- 当前已改为事件查询继续走默认查询客户端，`raw` 切换到命名导出的底层 `db`，同时删除接口会先清理关联表再删主表，因此源码态与 built 态均已回归通过

## `agentSetKey` 当前验证内容

`setting/agentDeploy/agentSetKey` 当前已经通过测试专用 mock seam 覆盖：

- 成功分支
  - `toonflow` vendor 的 `apiKey` 会写入配置
  - `scriptAgent`
  - `productionAgent`
  - `universalAi`
  - 三个 agent 的模型绑定会切回 `toonflow`
- 失败分支
  - `toonflow` vendor 的 `apiKey` 会被清空
  - 已成功写入的 agent 部署结果不会被错误覆盖

说明：

- 只有在测试环境设置 `TOONFLOW_MOCK_AGENT_SET_KEY=success|failure` 时，路由才会走 mock seam
- 正式运行时仍然走真实 `Ai.Text(...)`
- 因此自动化当前覆盖的是“路由逻辑、落库和失败回滚”，不等于覆盖了真实外部 AI 服务可用性

## `openFolder` 当前验证内容

`setting/fileManagement/openFolder` 当前已经通过测试专用 seam 覆盖：

- 非 Electron 上下文会被拒绝
- 在测试环境强制模拟 Electron 上下文时，可覆盖成功分支
- 命令执行失败时，会按现有约定返回业务错误对象

说明：

- 只有在测试环境设置 `TOONFLOW_FORCE_ELECTRON=1` 时，路由才会允许进入“客户端模式”分支
- 只有在测试环境设置 `TOONFLOW_MOCK_OPEN_FOLDER=success|failure` 时，才会跳过真实系统级命令
- 因此自动化当前覆盖的是“路由逻辑与返回行为”，不等于真实桌面环境里一定能成功拉起系统文件管理器

## 仍未自动化覆盖的高风险点

当前已经没有“整条 `setting` 路由完全空白”的情况，剩余高风险点主要是系统级或外部依赖级行为：

- `openFolder`
  - 路由逻辑已纳入自动化
  - 但“是否真的拉起系统文件管理器”仍属于桌面系统级行为，当前保留为手工 smoke
- `agentSetKey`
  - 路由逻辑、落库与失败回滚已纳入自动化
  - 但真实外部 AI 可用性与 key 校验，当前仍未做在线自动化验证

## 仍未完全覆盖的次一级分支

当前这轮明确跟踪的次一级分支缺口已经补齐。若继续补强，更适合转向新的边界问题，而不是继续围绕本轮已收口的更新链路打转。

## 当前手工 smoke 保留项

- `yarn dev:gui`
  - Electron 窗口能打开
  - 内置 `data/web` 页面能加载
  - 默认账号能登录
  - 设置页可进入
- `openFolder`
  - 只在桌面端人工确认是否真正拉起系统文件管理器
- 打包链路
  - 如果改了 Electron 主进程或资源迁移行为，至少补一次目标平台打包 smoke

## Manual Runbook

- `yarn dev`、`yarn start`、`yarn dev:gui` 的手工 smoke 执行步骤见 [docs/MANUAL_SMOKE_RUNBOOK.md](./MANUAL_SMOKE_RUNBOOK.md)
- 当前自动化已经覆盖低风险后端回归，但 Electron 真实运行态与系统级行为仍然要按这份 runbook 手工验收

## 下一步建议顺序

建议继续按下面顺序推进：

1. 保持 `openFolder` 的真实系统拉起验证为手工 smoke，除非后续真的引入 Electron 端到端自动化
2. 如果需要验证 `agentSetKey` 的真实 key 可用性，再单独设计在线验证方案，不要混入默认离线基线
3. 如果继续补自动化，优先选择新的代表性业务边界，而不是重复扩展已经收口的 `checkUpdate` / `downloadApp` 更新链路
4. 如果进入真实功能二开，新增功能必须至少补一条对应的最小自动化测试，再做手工回归

## 结论

截至当前状态，`Toonflow-app` 的工程基线已经不再只依赖“手工点点看”：

- 源码启动链有 smoke 兜底
- 构建产物启动链有 smoke 兜底
- `setting` 域已经没有整条路由级空白
- `clearData`、检查更新、更新下载、vendor 校验、agent 设置和文件夹打开路由都已有可复用的回归框架
- `artStyle`、`task`、`project/general`、`general/generalStatistics`、`production flow`、`production media list`、`production generate data`、`project/visualManual`、`project/directorManual`、`script`、`assets`、`novel`、`novel/event` 十三条代表性业务生命周期链路都已有最小可回归的自动化兜底
- Windows `x64` 的 `dist:win`、Windows `arm64` 的 `dist:win:arm64`，以及双架构聚合的 `dist:win:all` 打包 smoke 都已验证通过，说明当前 Electron 启动链、原生依赖重建与安装包生成链路已经能在 Windows 多架构上稳定闭环

后续继续二开时，优先沿着现有 smoke 框架增量扩展，不建议回到纯手工验证模式。
