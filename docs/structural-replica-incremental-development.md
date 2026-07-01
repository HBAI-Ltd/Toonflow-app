# Toonflow MP4 结构复刻增量开发方案

## 结论

采用增量补齐现有实现方案。目标不是重写 Toonflow 架构，而是把当前 `structuralReplica` 打通为可验收链路，并继续从 1.6.0 开始补每镜头生成队列：

```text
MP4 上传 -> Analyzer 产物入库 -> Video IR -> 人工复核 -> 资产缺口 -> 资产绑定
-> 镜头级提示词包 -> 一致性检查 -> 推送 Toonflow 工作台
```

当前基线为 Toonflow `1.2.2`，已完成到 `structuralReplica` 1.5.0 能力边界。后续开发已经拆到根目录：

```text
docs/19-post-1.2.2-structural-replica-roadmap.md
docs/20-post-1.2.2-structural-replica-task-plan.md
```

本文件保留为 Toonflow-app 内部增量开发说明，后续每个版本完成后需要与根目录路线图同步。

核心边界：

- 不复制原视频素材、人物脸、品牌、门店、水印、账号、声音。
- 只复刻可复用结构：镜头顺序、节奏、镜头目的、景别、机位、运镜、台词结构、CTA。
- 继续复用 Toonflow 的 `o_storyboard`、`o_videoTrack`、`o_assets2Storyboard` 和生成链路。

## 当前实现基线

已存在并继续沿用：

- 后端服务：`src/services/structuralReplica/`
- API 路由：`src/routes/structuralReplica/`
- 数据表：`o_sr_*`，定义在 `src/lib/initDB.ts`，兼容补表逻辑在 `src/lib/fixDB.ts`
- Python Analyzer：`tools/video-analyzer/`
- 前端静态页：`data/web/structural-replica.html`
- 端到端 smoke：`scripts/structuralReplicaSmoke.ts`

## 当前状态机

```text
draft
source_uploading
source_uploaded
preprocessing
transcribing
detecting_shots
sampling_frames
understanding_frames
ir_built
dialogue_reviewed
asset_gap_ready
assets_bound
storyboard_generated
checked
pushed
failed
```

要求：

- 每个接口必须校验当前状态。
- 任意人工修改 IR、台词或资产绑定后，必须清理下游派生产物。
- `checked` 之前不能推送 Toonflow。
- 一致性检查有 blocker 时不能进入 `pushed`。

## 数据表

当前 `o_sr_*` 表：

- `o_sr_task`
- `o_sr_source_media`
- `o_sr_upload_part`
- `o_sr_transcript`
- `o_sr_shot_detection`
- `o_sr_frame_sample`
- `o_sr_frame_understanding`
- `o_sr_story_ir`
- `o_sr_dialogue_structure`
- `o_sr_asset_gap`
- `o_sr_asset_binding`
- `o_sr_regenerated_storyboard`
- `o_sr_consistency_report`
- `o_sr_storyboard_mapping`
- `o_sr_job`
- `o_sr_shot_adaptation`
- `o_sr_provider_capability`
- `o_sr_model_probe_result`
- `o_sr_model_route`

`o_sr_job` 用于记录 analyzer、vision、buildIr、assetGap、regenerateStoryboard、checkConsistency、pushToProduction 等 job 的进度、结果和错误。本轮已补 1.3.0 可恢复字段：

```text
lockedBy
lockedAt
nextRunAt
recoverable
cancelRequested
应用启动后的 stale job 恢复
```

## API 清单

已接入 `/api/structuralReplica/*`：

- `createTask`
- `sourceUpload/init`
- `sourceUpload/chunk`
- `sourceUpload/complete`
- `startAnalysis`
- `getProgress`
- `runFrameUnderstanding`
- `buildIr`
- `getTask`
- `updateIrShot`
- `updateDialogueStructure`
- `analyzeAssetGaps`
- `bindAssets`
- `regenerateStoryboard`
- `checkConsistency`
- `pushToProduction`
- `uploadCoreAsset`
- `jobs/recover`
- `jobs/cancel`
- `checkEnvironment`
- `checkVisionProvider`
- `dialogueAction`
- `buildShotAdaptations`
- `modelGateway/listProviders`
- `modelGateway/upsertProviderCapability`
- `modelGateway/probeProvider`
- `modelGateway/listModelRoutes`
- `modelGateway/routeModels`

## 开发优先级

### 当前已完成：打通可验收链路

已完成/需要保持：

- MP4 分片上传并保存 source media。
- Node 调用 Python Analyzer，入库 media/transcript/shots/frames。
- 视觉不可用时生成 `reviewRequired`，允许人工复核后继续。
- 人工复核后可修改镜头目的、结构、景别、机位、运镜、构图、资产槽位、台词。
- 资产缺口分析和绑定 Toonflow 资产。
- 生成独立 prompt package 和 regenerated storyboard。
- 一致性检查拦截 blocker。
- 推送 Toonflow 工作台。

### 1.3.0：提升产品可用性（已完成）

- 静态页补齐失败重试和更清晰的错误展示。
- Analyzer 输出增加更细粒度进度。
- 视觉 provider 支持真实配置校验和模型探活。
- `o_sr_job` 队列化，支持长任务恢复和重跑。
- 环境诊断 API：FFmpeg/ffprobe/Python/sr_analyzer/Whisper/data 目录。
- 人工修改 IR、台词、资产绑定后清理下游派生产物。

### 1.4.0：台词层 + 镜头适配（已完成）

- Dialogue Layer v2：`estimatedSpeechSec`、`fitsDuration`、`timingActions`。
- 台词动作：压缩、拆镜头、延长、同步字幕。
- Shot Adaptation Layer：A/B/C/D 等级、适配策略、`adaptedVisual`。
- 缺资产时自动降级或阻塞，不硬生成。

### 1.5.0：多模型网关（已完成）

- Provider Capability。
- Model Router。
- 中转站 API 探活。
- 按镜头能力需求自动选择模型。
已实现能力不足时的 `fallbackPlan` 和 `downgradeReasons`。

### 1.6.0：生成队列（下一步）

- 每镜头生成任务。
- 多候选。
- 失败重试。
- 成本和错误记录。

### 1.7.0：生成后质检

- 抽取生成视频关键帧。
- 检查角色、场景、产品、字幕、源实体泄漏。
- 生成 `quality_report`。
- 支持只重试低分镜头。
- Timeline Composer 拼接导出 MP4。

### 1.8.0：产品化与安全

- API Key 加密。
- 资产授权字段。
- 临时文件清理。
- 权限边界。
- 打包验收。

## 一致性检查规则

当前 blocker：

- prompt package 缺失。
- 必需资产未绑定。
- 镜头有必需资产槽位但无关联资产。
- bound asset 不存在。
- asset type 与 slot type 不匹配。
- 用户未复核视觉不可用镜头。
- 文本中保留原人物、原品牌、原门店、账号、水印等源实体。

注意：安全声明不应触发源实体风险。例如“禁止出现原视频人物、原品牌、水印”和“必须替换原人物/原品牌”属于负向约束，不是泄漏。

## 本地开发命令

安装依赖：

```bash
yarn install
```

启动服务：

```bash
yarn dev
```

打开静态页：

```text
http://localhost:10588/structural-replica.html
```

Python Analyzer 环境检查：

```bash
cd tools/video-analyzer
python -m sr_analyzer.cli check-env
```

Analyzer dry-run：

```bash
python -m sr_analyzer.cli run-all --input data/tmp/analyzerSmoke/source.mp4 --workdir data/tmp/analyzerSmoke/work --skip-transcribe
```

## 验证命令

```bash
yarn test tests/structuralReplica
yarn lint
python -m pytest -q tools/video-analyzer/tests
```

端到端 smoke：

```bash
yarn tsx scripts/structuralReplicaSmoke.ts --base http://localhost:10588 --token "<Bearer token>" --projectId <projectId> --mp4Path data/tmp/analyzerSmoke/source.mp4 --bindingsJson data/tmp/codex-sr-check/bindings.json --timeoutSec 900
```

验收标准：

- 输出 `taskId`。
- `checkConsistency` 无 blocker。
- `pushToProduction` 返回 `scriptId`、`storyboardIds`、`trackIds`。
- Toonflow 工作台能看到对应分镜。

说明：真实 smoke 依赖本机服务、token、projectId、MP4 样片和 bindingsJson；这些参数不应提交到仓库。

## 本地打包

构建后端服务和 Electron 主进程：

```bash
yarn build
```

生成本地目录包：

```bash
yarn pack
```

生成 Windows 安装包：

```bash
yarn dist:win
```

本阶段交付以 `yarn build` 和 `yarn pack` 通过为最低本地打包标准。
