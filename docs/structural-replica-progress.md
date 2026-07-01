# Structural Replica 进度记录

更新时间：2026-07-01

## 已完成功能
- MP4 分片上传、合并、source media 入库。
- Python Analyzer 接入，已可写入 media、transcript、shot detection、frame samples。
- Frame understanding 接入；视觉不可用时生成 `reviewRequired`，支持人工复核后继续流程。
- Story IR 构建、Dialogue Structure 生成与人工修改。
- 核心资产缺口分析、资产绑定、核心资产上传辅助。
- `regenerateStoryboard` 生成可推送的 regenerated storyboard 和 prompt package。
- `checkConsistency` 检查必需资产、prompt package、源实体风险与质量问题。
- `pushToProduction` 写入 Toonflow `o_script`、`o_videoTrack`、`o_storyboard`、`o_assets2Storyboard`、`o_sr_storyboard_mapping`。
- P1 任务记录：新增 `o_sr_job`，将 analyzer、vision、buildIr、assetGap、regenerateStoryboard、checkConsistency、pushToProduction 包装为可记录进度、结果和错误的 job。
- `getTask` 与 `getProgress` 返回 job 列表、active job、latest job 与 job 错误信息。
- 前端 `data/web/structural-replica.html` 增加任务队列视图，展示 job 进度、阶段、错误信息和失败重试按钮。
- 状态机允许 `failed -> understanding_frames`，支持 vision job 失败后从工作台重试。
- 本轮补充 `jobService` 生命周期测试，覆盖 create、run、progress clamp、serialize、fail、attempt 与 active job 查询。
- 1.3.0 可用链路加固：新增 `checkEnvironment`、`checkVisionProvider`、job recover/cancel、启动时 stale job 恢复、下游产物清理。
- 1.4.0 台词层 + 镜头适配：新增 Dialogue Layer v2、台词估时、压缩台词、拆镜头、延长镜头、Shot Adaptation Layer、A/B/C/D 适配等级。
- 1.5.0 多模型网关：新增 Provider Capability 表/API、Provider 探活、Model Router、镜头级模型选择和降级原因。
- 前端 `data/web/structural-replica.html` 增加环境检查、视觉探活、适配、模型路由入口和结果展示。

## 已验证命令和结果
```bash
yarn test tests/structuralReplica
```
结果：通过。覆盖 structuralReplica 服务逻辑和 `o_sr_job` 生命周期测试。
最近验证：2026-07-01，执行 3 个测试文件。

```bash
yarn lint
```
结果：通过。`tsc --noEmit` 无类型错误。
最近验证：2026-07-01。

```bash
node -e "const fs=require('fs'); const html=fs.readFileSync('data/web/structural-replica.html','utf8'); const m=html.match(/<script>([\s\S]*)<\/script>/); new Function(m[1]); console.log('structural-replica.html script syntax ok')"
```
结果：通过。前端静态页脚本语法可解析。
最近验证：2026-07-01。

历史真实 smoke：
```bash
yarn tsx scripts/structuralReplicaSmoke.ts --base http://localhost:10588 --token "<Bearer token>" --projectId <projectId> --mp4Path data/tmp/analyzerSmoke/source.mp4 --bindingsJson data/tmp/codex-sr-check/bindings.json --timeoutSec 900
```
结果：已验证到 `pushed`；`checkConsistency` 无 blocker，`pushToProduction` 返回生产数据 ID。

本轮真实 smoke 状态：

```text
真实 smoke 仍依赖本机服务、token、projectId、MP4 样片和 bindingsJson。脚本和命令已保留，但敏感 token 与本地样片不写入仓库。
```

## 当前未完成模块
- Analyzer 子步骤进度主要按阶段估算，尚未读取 Python analyzer 内部实时 status。
- 每镜头生成队列、多候选、失败重试和 provider fallback 仍未完成，进入 1.6.0。
- 生成后视频质量检查、关键帧抽检、低分镜头重试和 Timeline Composer 属于 1.7.0。

## 1.2.2 后续版本路线

当前 `package.json` 版本为 `1.2.2`。后续开发不再回到旧的 Phase 1/2 重做，按以下版本推进：

| 版本 | 目标 | 重点 |
| --- | --- | --- |
| 1.2.3 | 文档与状态同步 | 同步根目录和 Toonflow-app 内部文档，固定当前事实源 |
| 1.3.0 | 可用链路加固 | 真实 smoke、环境诊断、视觉 provider 探活、可恢复 job worker、下游产物清理 |
| 1.4.0 | 台词层 + 镜头适配 | Dialogue Layer v2、台词压缩/拆镜头/延长、A/B/C/D 适配等级、镜头降级改写 |
| 1.5.0 | 多模型网关 | Provider Capability、Model Router、中转站 API 能力探活和降级路由 |
| 1.6.0 | 生成队列 | 每镜头生成、多候选、失败重试、成本和错误记录 |
| 1.7.0 | 生成后质检 + 成片导出 | 视频质量检查、低分镜头重试、Timeline Composer、MP4 导出 |
| 1.8.0 | 产品化与安全 | API key 加密、资产授权、清理归档、权限、打包验收 |

根目录详细文档：

```text
docs/19-post-1.2.2-structural-replica-roadmap.md
docs/20-post-1.2.2-structural-replica-task-plan.md
```

## 下一阶段开发任务
- 1.6.0-1：新增每镜头 generation job/candidate/cost 表。
- 1.6.0-2：从 prompt package + model route 生成 shot control package。
- 1.6.0-3：新增单镜头生成、重试、候选列表和候选选择 API。
- 1.6.0-4：记录 provider/model/latency/cost/errorReason，支持失败后 provider fallback。
- 1.7.0：补生成后质检、低分镜头重试和 Timeline Composer。

## 风险和阻塞点
- `failed -> preprocessing` 主要服务 analyzer 重试；其他阶段失败后的精细回退仍需继续设计。
- 前端静态页存在历史编码异常文本，本阶段只做小步插入，避免大面积改写页面。
- 真实 smoke 依赖本地服务、token、项目 ID、样片和绑定 JSON，不适合作为每次小改后的默认验证。

## 模块状态
| 模块 | 状态 | 说明 |
| --- | --- | --- |
| MP4 上传 | done | 分片上传、合并、source media 入库已跑通。 |
| Analyzer | done | 已接入，并在 P1 中包装为 `analyzer` job。 |
| Vision/frame understanding | done | 已接入，并在 P1 中包装为 `vision` job。 |
| Story IR | done | `buildIr` 已跑通，并包装为 `buildIr` job。 |
| 人工复核 | done | `updateIrShot`、`updateDialogueStructure` 可用。 |
| 资产缺口 | done | `analyzeAssetGaps` 已跑通，并包装为 `assetGap` job。 |
| 资产绑定 | done | `bindAssets` 已跑通。 |
| regenerateStoryboard | done | 已跑通，并包装为 `regenerateStoryboard` job。 |
| checkConsistency | done | 已跑通，并包装为 `checkConsistency` job。 |
| pushToProduction | done | 已跑通，并包装为 `pushToProduction` job。 |
| `o_sr_job` 表 | done | initDB、fixDB、类型定义已补齐。 |
| jobService 生命周期 | done | 已覆盖 create、run、progress、serialize、fail、attempt。 |
| getTask/getProgress job 输出 | done | 已返回 jobs、activeJob、latestJob。 |
| 前端 job 进度工作台 | done | 已补任务列表、错误信息和失败重试按钮；仍需真实服务 smoke。 |
| vision 失败重试 | done | `failed -> understanding_frames` 已放开并补测试。 |
| 可恢复队列 worker | done | 已补锁字段、恢复字段、recover/cancel API 和启动时 stale job 恢复。 |
| Dialogue Layer v2 | done | 已补时长估算、fitsDuration、timingActions 和台词动作。 |
| Shot Adaptation Layer | done | 已补 A/B/C/D 适配等级、降级改写和阻塞原因。 |
| Model Gateway | done | 已补 Provider Capability、探活、Model Router 和降级原因。 |
| 生成队列 | todo | 1.6.0 开发。 |
| P2 生成后质检 | todo | 1.7.0 开发。 |

## 下一次继续开发应该使用的 Codex 指令
```text
请继续在 C:\Users\Administrator\Documents\视频2\external\Toonflow-app 项目中增量开发 structuralReplica。
当前已完成到 1.5.0，进度见 docs/structural-replica-progress.md，完整后续路线见根目录 docs/19 和 docs/20。不要重写现有模块，不要重新做 Phase 1/2。
下一步进入 1.6.0 生成队列：
1. 新增每镜头 generation job/candidate/cost 表。
2. 从 prompt package + model route 生成 shot control package。
3. 新增单镜头生成、重试、候选列表和候选选择 API。
4. 记录 provider/model/latency/cost/errorReason，并支持 provider fallback。
5. 每完成一个小模块更新 docs/structural-replica-progress.md。
6. 每次改动后运行最小验证。
```
