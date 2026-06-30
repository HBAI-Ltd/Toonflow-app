# Toonflow 架构总览

> 面向第一次接触本项目的开发者 / 运维 / 接手的 AI。读完应能理解 Toonflow 是什么、各层怎么协作、从小说到成片的数据如何流转，以及扩展点在哪里。单一切片的细节见文末「深入文档」。

## 1. 这是什么

Toonflow 是一款 **AI 短剧/漫剧生产工具**：把小说自动转化为剧本，再经 AI 生成角色/场景图、分镜图、视频，并合成为成片。

形态上是一个 **单体应用**：

- **后端**：Express 5 + Socket.IO 4（HTTP API + 实时 Agent 流）
- **桌面壳**：Electron 40（也可不打包直接 `node`/`tsx` 跑）
- **前端**：静态站点（`data/web/`，打包产物 + 非侵入式注入脚本）
- **存储**：本地 SQLite（`data/db2.sqlite`），Knex 查询
- **部署**：桌面安装包 或 Docker

## 2. 技术栈

| 层 | 技术 |
|---|---|
| 运行时 | Node.js + TypeScript（`tsx` 直跑，`sucrase` 转译，无独立编译步骤） |
| 后端 | Express 5 · express-ws · Socket.IO 4 |
| 桌面 | Electron 40 · electron-builder |
| 数据库 | better-sqlite3 / sqlite3 + Knex |
| AI | Vercel AI SDK 6 (`ai`) + provider：anthropic / openai / google / xai / deepseek / qwen / zhipu / minimax / openai-compatible |
| 媒体 | sharp（图像）· ffmpeg/ffprobe（视频合成，外部二进制） |
| 沙盒 | vm2（运行用户可配置的 vendor 适配器代码） |

## 3. 请求生命周期（`src/app.ts`）

1. 默认端口 `10588`（`PORT` 可覆盖）。CORS 仅允许 loopback 来源（`localhost` / `127.0.0.1` / `[::1]`）。
   - Electron / GUI 模式若随机端口启动，会在实际 bind 后回写 `process.env.PORT`；Creative Canvas 前端通过 `toonflow://getappurl` 解析当前 API origin，避免继续打旧的 `localhost:0` 或错误端口。
2. 静态资源：`/oss`（生成产物）、`/skills`（仅图片）、`/assets`、`data/web`（前端站点）。
3. `/oss` 下 `compose/`、`merge/` 为敏感路径，额外要求 JWT。`/oss?size=` 支持按需生成缩略图。
4. **全局 JWT 鉴权中间件**：除 `/api/login/login` 白名单外，所有请求校验 token（密钥取自 `o_setting.tokenKey`）。
5. 启动时 `registerQueueHandlers()` + `recoverQueue()`，恢复重启前未完成的生成任务。

## 4. 文件即路由（`src/core.ts` → `src/router.ts`）

- `src/routes/**/*.ts` 被 glob 扫描，文件路径映射为 `/api/<path>`。
- `[param]` → `:param`，`[...x]` → `*`，`index.ts` → 目录本身。
- `src/router.ts` 是**自动生成**的（带 `@routes-hash`，内容变更才重写）—— 不要手改。
- 约 180 个路由文件，按业务域组织：`novel / script / scriptAgent / production / assets / assetsGenerate / artStyle / project / setting / contentAudit / creativeCanvas / task / ...`

## 5. 从小说到成片：数据流与表

完整流水线（35 张表，schema 见 `src/types/database.d.ts`，自动生成带 `@db-hash`）：

```
o_project（项目：画风/导演手册/图像&视频模型/画幅）
  └─ o_novel（小说章节）
       └─ o_script（剧本）
            ├─ o_assets（角色/场景/道具资产） ──> o_image（资产候选图，多候选「抽卡」+ VLM 打分选优）
            └─ o_storyboard（分镜：台词/音效/景别/运镜 + prompt + continuityContract）
                 └─ o_videoTrack（分镜轨道） ──> o_video（生成视频）
                      └─ o_videoCompose（单镜成片：视频+TTS配音+烧录字幕）
                           └─ o_episodeMerge（整集拼接导出）
```

横切的治理/审计表：

- **Prompt 治理**：`o_promptVersion`（版本：草稿/发布/回滚）、`o_promptUsage`（每次使用记录）。
- **生成内容审计**：`o_generationArtifact` / `o_generationSegment` / `o_generationRevision`（句子级来源与修订追踪）。
- **画布布局**：`o_creativeCanvasState`（只存 UI 布局，不覆盖业务事实）。Creative Canvas 的 graph 由 `src/utils/creativeCanvas.ts` 实时聚合业务表生成：概览视图用组卡（`assetGroup` 按角色/场景/道具聚合、`videoPromptGroup`/`videoGroup` 聚合视频链路），分类视图展开个体节点；分镜 Prompt 与分镜图候选拆成一对多节点，视频视图展示「资产/道具/场景/已选中分镜图参考 → 视频 Prompt → 多个视频结果」。节点携带缩略图/海报 URL（复用 `/oss?size=` 缩略图）、status、version/sourceHash（由审计快照推导）。前端是 `data/web/creative-canvas.js/css` 注入层，改动后需同步 `data/web/index.html` cache-buster。
- **任务**：`o_tasks`（AI 调用记录）、`o_genQueue`（生成队列）、`o_taskProgress`（阶段日志）。
- **配置**：`o_setting`（KV）、`o_vendorConfig`（供应商）、`o_agentDeploy`（agent→模型映射）、`memories`（Agent 记忆）。

### 空间合同与 EffectiveLayout

分镜图生成不再只依赖自然语言 Prompt。场景/道具资产卡里的 `spatialContinuity` 会先由 `src/utils/storyboardContinuity.ts` 的 `compileEffectiveLayout` 编译成确定性的 `EffectiveLayout`，再注入分镜图 Prompt。它是下游生成和 QA 的唯一空间执行输入，负责表达固定锚点、物体遮挡、角色站位、镜头轴线、不变量与禁止漂移项。

生成后的图片进入 `storyboardImage` 队列 QA 时，`src/utils/scoreImage.ts` 解析结构化结果：`passed`、`score`、`hardFailures`、`softWarnings`。`src/utils/queueHandlers.ts` 将 `passed=false` 或任意 `hardFailures` 视为硬拒绝，图片不得被标记为已选中，也不得作为后续视频参考。`score` 只作为辅助质量指标，不能覆盖空间合同裁决。

迁移方式：无传统 migration 文件，走 `src/lib/initDB.ts` + `src/lib/fixDB.ts` 的**幂等** `hasTable` / `hasColumn` / `addColumn` / `createTable`。

## 6. 双 Agent 系统（本项目核心）

两个 Socket.IO 命名空间 `/api/socket/scriptAgent` 与 `/api/socket/productionAgent`，各自是一个**「决策层 + 子 Agent」的分层多智能体**：

- **scriptAgent（编剧）**：`decisionAgent` 统筹 → 子 agent：`storySkeleton`（故事骨架）、`adaptationStrategy`（改编策略）、`script`（剧本）、`supervision`（监督审核）。子 agent 通过 XML 标签（`<storySkeleton>` / `<scriptItem>` 等）写回工作区。
- **productionAgent（视频策划）**：`decisionAgent` → 子 agent：衍生资产分析(`deriveAssets`)/生成(`generateAssets`)、导演规划(`directorPlan`)、分镜图生成(`storyboardGen`)、分镜面板(`storyboardPanel`)/表(`storyboardTable`)写入、监制(`supervision`)。分镜标签使用 `storyboardPipeline` 场景，把导演规划、分镜表和分镜节点写入串成一条工作流。结合**项目画风技能(`art_skills`) + 导演手册技能(`story_skills`)** 动态加载 SKILL.md。

关键设计：

- **记忆系统**（`src/utils/agent/memory`）：RAG 检索 + 历史摘要 + 近期对话三层，带 embedding，存 `memories` 表。
- **技能系统**：Markdown frontmatter 描述 + `activate_skill` 工具按需加载完整指令（类似 Claude Skills 机制）。技能存于 `data/skills/`。
- **工具调用守卫**（`src/utils/agent/toolUseGuard`）：按工具名统计调用次数。监督类 agent 若零工具调用则结论作废；生产类子 Agent 可要求必须调用指定工具，例如 `save_flowData` 或 `add_flowData_storyboard`，避免只在聊天里声称完成。

## 6.1 Creative Canvas 工作台布局

创作画布的各标签保持同一交互骨架：

- **左侧 Agent 会话区**：随当前标签切换角色（剧本、角色/场景/道具、分镜、视频、审计），composer 可拖拽调宽并持久化到 `localStorage`。剧本标签接 `scriptAgent` socket；角色/场景/道具与分镜标签接 `productionAgent` socket。分镜链路通过 `save_flowData` 写导演规划/分镜表，通过 `add_flowData_storyboard` 调 `/production/storyboard/batchAddStoryboardInfo` 写真实 `o_storyboard` 行。
- **中间画布区**：展示当前标签相关节点和真实生成链路。Prompt 节点是可编辑图文块，`@` 引用以内嵌 chip 呈现，并通过 fixed 候选浮层选择角色、场景、道具或参考图；原文章节、剧本、资产 Prompt、导演规划和分镜表通过统一 Markdown 编辑器修改。`优化布局` 按业务列和直接连线做确定性排布，分镜→分镜图候选、参考资产→视频 Prompt→视频结果尽量同排，并按节点高度避让重叠。
- **右侧 Inspector / 进度区**：不做聊天，负责节点事实、版本、来源 Hash、内容预览、当前剧集进度和确定性按钮。视频生成设置使用当前视频模型的 `durationResolutionMap` 限制时长/清晰度，默认按分镜轨道时长自动填写，可手动覆盖再恢复自动值。它是可审计状态面板，避免 Agent 回复替代真实业务状态。
- **前端 socket 桥接**：`data/web/creative-canvas.js` 的 Agent bridge 提供 `getFlowData`、`saveFlowData`、`addStoryboard`、`generateStoryboard` 等动作。`addStoryboard` 会把 `shouldGenerateImage` 规范成 REST 接口要求的数字 `0/1`，否则后端参数校验会拒绝写入。

## 7. AI 抽象层 + Vendor 沙盒（最关键的扩展点）

`src/utils/ai.ts` 暴露统一入口 `Ai.Text / Image / Video / Audio(key)`：

- `key` 可以是 **agent 语义名**（如 `productionAgent:decisionAgent`）或 **`vendorId:modelName`**。
- **两级模型配置**（`o_setting.agentUseMode`）：简易模式（按主 agent 配模型）/ 高级模式（每个子 agent 单独配），从 `o_agentDeploy` 解析。
- **Vendor 适配器 = 用户可编辑的 TypeScript 代码**，存于 `data/vendor/<id>.ts`。运行时 `sucrase` 转译后丢进 **vm2 沙盒**（默认 5s 超时，无 eval/wasm）执行，实现 `textRequest` / `imageRequest` / `videoRequest` / `ttsRequest` 四个函数。沙盒注入 sharp 工具、`pollTask` 轮询、各 SDK 的 `createXxx` 工厂。
- 视频模型能力以 vendor 的 `durationResolutionMap`、`mode` 和 `audio` 字段为准；前端只做归一化和展示，不在业务代码里硬编码某个供应商的固定秒数。
- 结果：**「接入新模型供应商」是纯配置/插件，无需改主代码**。
- `repairToolName`：中转模型用 PascalCase 调工具时，归一化大小写/分隔符匹配回真名。

## 8. 持久化生成队列（`src/utils/genQueue.ts`）

所有耗时任务走 `o_genQueue` 表，kind ∈ `assetImage` / `storyboardImage` / `composeVideo` / `mergeEpisode` / `gridImage`：

- **按 vendor 维度限流**（`o_setting.vendorConcurrency`，JSON 如 `{"default":5,"volcengine":3}`），替代散落各处的 pLimit。
- 乐观锁占用防重复启动；失败自动重试（`retryCount < maxRetry`），超限标记失败，可经 `retryQueueJob` 手动重排。
- 进程内 `waiters` 让同步路由可 `await` 任务完成。
- **重启恢复**：`fixDB` 把「执行中」重置为「排队中」，`recoverQueue` 恢复调度 —— 解决桌面应用频繁重启导致任务丢失。
- 处理器在 `src/utils/queueHandlers.ts`（图片抽卡）与 `src/utils/composeHandlers.ts`（视频合成/拼接/宫格图）注册。

## 9. 设计取舍与风险（接手须知）

**亮点**：vendor 沙盒插件化 + agent 语义化模型路由（扩展性强）；队列重启恢复 + 幂等迁移（贴合桌面应用现实）；Prompt Center / Content Audit 体现对「AI 生成可追溯/可治理」的重视。

**风险 / 技术债**：

- **vm2 已停止维护**且历史有沙盒逃逸 CVE。执行的是用户自配 vendor 代码，虽限 loopback + JWT，仍是攻击面 —— 加固方向见后续评估。
- **前端源码不在仓库**：Creative Canvas 等新功能靠注入 `data/web/*.js` 实现，native 入口较脆弱（见集成审计文档自评）。
- **测试覆盖薄**：仅 4 个 `tsx` 手写验证脚本（`yarn test:*`），无单测框架，`yarn lint` 实际只是 `tsc --noEmit`。
- 小瑕疵：`database.d.ts` 自动生成时 `o_taskProgress` interface 重复；`src/agents/productionAgent/index.ts` 等存在大量注释掉的旧代码待清理。

## 深入文档

| 主题 | 文档 |
|---|---|
| 视频合成 / 宫格分镜功能与运维 | [video-compose-features.md](video-compose-features.md) |
| huobao-drama 集成完成度审计 | [huobao-drama-integration-audit.md](huobao-drama-integration-audit.md) |
| Creative Canvas v1 需求与阶段计划 | [creative-canvas-requirements-plan.md](creative-canvas-requirements-plan.md) |
| Creative Canvas v2 创作级画布精修 | [creative-canvas-v2-plan.md](creative-canvas-v2-plan.md) |
| 产品介绍 / 安装使用 | [../README.md](../README.md) |
