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
- 1.6.0 生成队列：新增 `o_sr_generation_job`、`o_sr_generation_candidate`、`o_sr_generation_cost`，实现 Shot Control Package、单镜头/全任务生成、多候选、失败重试、候选选择、成本和错误记录。
- 1.7.0 生成后质检 + 成片导出：新增 `o_sr_quality_report`、`o_sr_timeline_export`，实现空文件、黑屏、时长、比例、关键帧可读、人物/场景/产品/字幕安全区、源实体泄漏检查，支持低质量重试建议和 Timeline Composer。
- 1.8.0 产品化与安全：API key 加密存储、provider key 脱敏、资产授权字段、合规提示、临时文件清理、任务日志归档、导出过期策略、基础项目权限边界和版本号 1.8.0。
- 前端 `data/web/structural-replica.html` 增加生成导出 tab，支持候选预览/选择、候选质检、已选候选质检和时间线导出。

## 已验证命令和结果
```bash
yarn test tests/structuralReplica
```
结果：通过。覆盖 structuralReplica 服务逻辑、`o_sr_job` 生命周期、生成队列、质检导出、安全加密、合规清理和权限边界。
最近验证：2026-07-01，执行 5 个测试文件。

```bash
yarn lint
```
结果：通过。`tsc --noEmit` 无类型错误。
最近验证：2026-07-01。

```bash
python -m pytest -q tools/video-analyzer/tests
```
结果：通过。5 passed。
最近验证：2026-07-01。

```bash
node -e "const fs=require('fs'); const html=fs.readFileSync('data/web/structural-replica.html','utf8'); const m=html.match(/<script>([\s\S]*)<\/script>/); new Function(m[1]); console.log('structural-replica.html script syntax ok')"
```
结果：通过。前端静态页脚本语法可解析。
最近验证：2026-07-01。

```bash
yarn build
yarn pack
yarn run pack
yarn dist:win
```
结果：通过。`yarn build` 生成 `build/app.js` 和 `build/main.js`；`yarn pack` 生成 `toonflow-v1.8.0.tgz`；`yarn run pack` 生成 `dist/win-unpacked`；`yarn dist:win` 生成 `dist/ToonFlow-1.8.0-win-x64-setup.exe`。
最近验证：2026-07-01。Electron builder 日志包含 `sqlite3@6.0.1` 的 npm collector warning，但命令退出码为 0。

历史真实 smoke：
```bash
yarn tsx scripts/structuralReplicaSmoke.ts --base http://localhost:10588 --token "<Bearer token>" --projectId <projectId> --mp4Path data/tmp/analyzerSmoke/source.mp4 --bindingsJson data/tmp/codex-sr-check/bindings.json --timeoutSec 900
```
结果：已验证到 `pushed`；`checkConsistency` 无 blocker，`pushToProduction` 返回生产数据 ID。

本轮真实 smoke 状态：

```text
真实 smoke 仍依赖本机服务、token、projectId、MP4 样片和 bindingsJson。脚本和命令已保留，但敏感 token 与本地样片不写入仓库。
```

## 待人工验收和后续模块
- Analyzer 子步骤进度主要按阶段估算，尚未读取 Python analyzer 内部实时 status。
- 真实 smoke 仍依赖本地服务、token、projectId、MP4 样片和 bindingsJson。
- 真实视频生成质量、计费和失败码仍依赖目标 provider。
- 当前权限边界为结构复刻基础项目/资产归属校验，不是完整 RBAC。

## 1.2.2 后续版本路线

当前 `package.json` 版本为 `1.8.0`。后续开发不再回到旧的 Phase 1/2 重做，按以下版本推进：

| 版本 | 目标 | 重点 |
| --- | --- | --- |
| 1.2.3 | 文档与状态同步 | 同步根目录和 Toonflow-app 内部文档，固定当前事实源 |
| 1.3.0 | 可用链路加固 | 真实 smoke、环境诊断、视觉 provider 探活、可恢复 job worker、下游产物清理 |
| 1.4.0 | 台词层 + 镜头适配 | Dialogue Layer v2、台词压缩/拆镜头/延长、A/B/C/D 适配等级、镜头降级改写 |
| 1.5.0 | 多模型网关 | Provider Capability、Model Router、中转站 API 能力探活和降级路由 |
| 1.6.0 | 生成队列 | 已完成。每镜头生成、多候选、失败重试、成本和错误记录 |
| 1.7.0 | 生成后质检 + 成片导出 | 已完成。视频质量检查、低分镜头重试、Timeline Composer、MP4 导出 |
| 1.8.0 | 产品化与安全 | 已完成代码实现。API key 加密、资产授权、清理归档、基础权限边界、打包验收 |

根目录详细文档：

```text
docs/19-post-1.2.2-structural-replica-roadmap.md
docs/20-post-1.2.2-structural-replica-task-plan.md
```

## 下一阶段开发任务
- 在可用本地服务、token、projectId、MP4 样片和 bindingsJson 时跑真实 smoke。
- 在目标 Windows 机器上安装并手工验收打包产物。
- 如果进入多人/多租户场景，继续设计完整 RBAC、审计日志和项目共享权限。
- 接入真实 provider 的计费金额、失败码和质量监控面板。

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
| 生成队列 | done | 已补 generation job/candidate/cost、Shot Control Package、多候选、重试和选择。 |
| P2 生成后质检 | done | 已补质量报告、低质量重试建议、Timeline Composer 和字幕导出。 |
| 产品化与安全 | done | 已补 key 加密、授权字段、合规、清理归档、导出过期和基础权限边界。 |

## 下一次继续开发应该使用的 Codex 指令
```text
请继续在 C:\Users\Administrator\Documents\视频2\external\Toonflow-app 项目中增量开发 structuralReplica。
当前已完成到 1.8.0，进度见 docs/structural-replica-progress.md，完整后续路线见根目录 docs/19 和 docs/20。不要重写现有模块，不要重新做 Phase 1/2。
下一步优先做真实环境验收：
1. 准备本地服务、token、projectId、MP4 样片和 bindingsJson。
2. 运行 scripts/structuralReplicaSmoke.ts 到生成/质检/导出链路。
3. 在目标 Windows 机器安装打包产物并运行环境检查。
4. 如需多人使用，补完整 RBAC、审计日志和项目共享设计。
5. 每次改动后运行最小验证与打包验收。
```
