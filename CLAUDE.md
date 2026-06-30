# CLAUDE.md — Toonflow

AI 短剧/漫剧生产工具：小说 → 剧本 → 资产/分镜图 → 视频 → 成片。Express 5 + Socket.IO + Electron + 本地 SQLite。完整架构见 [docs/architecture.md](docs/architecture.md)。

## 命令

| 用途 | 命令 |
|---|---|
| 开发服务（默认 :10588） | `yarn dev` |
| 并行第二实例 | `PORT=10590 yarn dev` |
| Electron GUI 开发 | `yarn dev:gui` |
| 类型检查（唯一的 lint） | `yarn lint`（= `tsc --noEmit`） |
| 构建 | `yarn build` |
| 打包桌面 | `yarn dist:mac` / `dist:win` / `dist:linux` |
| 验证脚本 | `yarn test:prompt-center` · `test:content-audit` · `test:creative-canvas` |
| 写合成演示数据 | `yarn seed:compose-demo` |
| 默认登录 | `admin / admin123` |

## 硬规则（违反会出问题）

- **`src/router.ts` 与 `src/types/database.d.ts` 是自动生成的，禁止手改。** 路由由 `src/core.ts` 扫描 `src/routes/**/*.ts` 生成；DB 类型由脚本生成。
- **新增 API**：在 `src/routes/<域>/<name>.ts` 建文件即注册为 `/api/<域>/<name>`。`[param]`→`:param`，`index.ts`→目录本身。
- **数据库变更**：改 `src/lib/initDB.ts` / `src/lib/fixDB.ts` 的幂等迁移（`hasTable`/`hasColumn`/`addColumn`），无传统 migration 文件。
- **耗时任务必须走生成队列**（`o_genQueue`，见 `src/utils/genQueue.ts`），不要在路由里裸跑 pLimit。新 kind 在 `queueHandlers.ts` / `composeHandlers.ts` 注册。
- **接入新模型供应商是纯配置**：编辑 `data/vendor/<id>.ts`（`node:vm` 沙盒执行，见 `src/utils/vm.ts`），实现 `textRequest/imageRequest/videoRequest/ttsRequest`，不改主代码。沙盒仅暴露白名单注入对象且冻结；`crypto`/`jsonwebtoken` 已收窄为最小子集。经 `updateCode` 写入 vendor 代码会过静态逃逸护栏（禁 `require`/`process`/`eval` 等）。
- **AI 调用统一走 `src/utils/ai.ts`** 的 `Ai.Text/Image/Video/Audio(key)`，`key` 用 agent 语义名或 `vendorId:modelName`。
- **Creative Canvas 前端在 `data/web/creative-canvas.*` 注入实现**；改 JS/CSS 后同步改 `data/web/index.html` cache-buster，并跑 `node --check data/web/creative-canvas.js` + `yarn test:creative-canvas`。视频生成设置的模型/模式/清晰度/时长来自 vendor `durationResolutionMap` 与分镜轨道时长，别硬编码固定秒数。
- **分镜图空间一致性必须走 `EffectiveLayout`**：场景/道具空间约束由 `compileEffectiveLayout` 编译后注入 Prompt，并由 QA hard gate 裁决；`passed=false` 或任意 `hardFailures` 必须拒绝选中，不能只按 score 放行。
- **本地研究产物不进仓**：`output/blender_spatial_continuity/`、`output/commercial_sanguo_ep01_min/` 是本机实验目录，已在 `.gitignore`；不要 `git add -f`。
- **Creative Canvas Agent 工作流要验证真实业务写入**：不要只看会话文本。分镜生产链路走 `/api/socket/productionAgent` 的 `storyboardPipeline`，持久化工具是 `save_flowData` / `add_flowData_storyboard`；`add_flowData_storyboard` 里的 `shouldGenerateImage` 必须传数字 `0/1`，后端 REST 校验不收 boolean/string。
- **鉴权**：除 `/api/login/login` 外所有 API 需 JWT。CORS 仅 loopback。`/oss` 下 `compose/`、`merge/` 敏感路径额外校验 token。
- 视频合成需本机 **ffmpeg/ffprobe** 在 PATH（或 `FFMPEG_PATH`/`FFPROBE_PATH`）。macOS 若 ffmpeg 被 AMFI SIGKILL（exit 137），需 adhoc 重签名，见 [docs/video-compose-features.md](docs/video-compose-features.md)。

## 环境变量

| 变量 | 说明 |
|---|---|
| `NODE_ENV` | `dev`（默认非 Electron）/ `prod`（默认打包） |
| `PORT` | 服务端口，默认 `10588` |
| `FFMPEG_PATH` / `FFPROBE_PATH` | 覆盖 ffmpeg 二进制路径 |
| `VENDOR_VM_TIMEOUT_MS` | vendor 沙盒超时，默认 5000 |
| `GEN_QUEUE_PROJECT_LIMIT` | 单项目队列上限，默认 200 |

## 数据目录（`data/`）

`db2.sqlite`（数据库）· `oss/`（生成产物）· `vendor/`（供应商适配器 .ts）· `skills/`（Agent 技能 SKILL.md + 图片）· `web/`（前端站点 + 注入脚本）· `models/`（本地模型）。

## 深入文档

| 主题 | 文档 |
|---|---|
| 整体架构 / 数据流 / Agent / 队列 | [docs/architecture.md](docs/architecture.md) |
| 视频合成 / 宫格分镜 | [docs/video-compose-features.md](docs/video-compose-features.md) |
| huobao-drama 集成审计 | [docs/huobao-drama-integration-audit.md](docs/huobao-drama-integration-audit.md) |
| Creative Canvas v1 计划 | [docs/creative-canvas-requirements-plan.md](docs/creative-canvas-requirements-plan.md) |
| Creative Canvas 当前实现 / Agent 驱动工作台 | [docs/creative-canvas-v2-plan.md](docs/creative-canvas-v2-plan.md) |
