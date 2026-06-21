# Toonflow Creative Canvas v1 需求计划

## Summary

目标：在现有 Prompt Center 与生成内容审计基础上，新增“创作级无限画布”，把项目、剧本、角色/场景资产、分镜、视频 prompt、生成任务和审计修改关系放到同一张可缩放画布中，支持查看来源、编辑具体文本、标记下游受影响内容。

执行规则：每完成一个 Phase，并通过对应验收后，把文档中的 `- [ ]` 改为 `- [x]`，同时补充完成日期、验证命令、浏览器检查结果。

## Current Facts

- 运行时 prompt 事实已通过 Prompt Center 接入，已有 `o_promptVersion`、`o_promptUsage` 和 `data/web/prompt-center.*`。
- 生成内容审计已通过 `contentAudit` 接入，已有 `o_generationArtifact`、`o_generationSegment`、`o_generationRevision`。
- 生产流已有 `o_agentWorkData.data`，图片流已有 `o_imageFlow.flowData`；Creative Canvas v1 只新增布局状态，不覆盖这些业务事实。
- 前端当前以打包后的静态资源为主，v1 采用 `data/web/creative-canvas.js/css` 非侵入式注入。

## Phased Checklist

- [x] Phase 0 - 需求文档落盘：创建 `docs/creative-canvas-requirements-plan.md`，写入目标、验收标准、阶段清单和当前事实边界。
  - Completed: 2026-06-15 09:21:53 CST
  - Verification: 文件已创建，包含 Summary、Current Facts、Phased Checklist、Key Changes、Test Plan、Assumptions。
- [x] Phase 1 - Canvas 数据与 API：新增画布状态存储与 `/api/creativeCanvas/*` 接口，能返回项目级 graph、保存节点布局、合并审计来源。
  - Completed: 2026-06-15 09:27:40 CST
  - Verification: `yarn test:creative-canvas` 通过，覆盖 graph、layout 保存/恢复、patch 后 stale 标记。
- [x] Phase 2 - Creative Canvas Shell：新增前端入口与全屏无限画布，具备暗色点阵背景、拖拽平移、缩放、顶部视图切换、左侧 Agent 面板、右侧任务面板。
  - Completed: 2026-06-15 09:34:11 CST
  - Verification: `node --check data/web/creative-canvas.js` 与 `yarn lint` 通过。
- [x] Phase 3 - 内容节点与结构化大卡：渲染项目、剧本段落、角色/场景资产、分镜分析、视频 prompt、视频结果等节点，并用连线表达生成关系。
  - Completed: 2026-06-15 09:34:11 CST
  - Verification: `yarn test:creative-canvas` 验证 project/script/asset/storyboardAnalysis/storyboard/videoPrompt/video/auditSegment 节点与资产到分镜边。
- [x] Phase 4 - 句子级审计编辑：点击节点可查看来源、hash/version、生成记录；支持修改具体文本段落，写入 revision，并标记下游节点 stale。
  - Completed: 2026-06-15 09:34:11 CST
  - Verification: `yarn test:creative-canvas` 验证 patch 后写入 revision、更新 `o_script.content`、返回并保留 stale 节点。
- [x] Phase 5 - 任务与 Agent 串联：画布右侧展示当前生成任务，节点操作可触发现有生成/重生入口；Agent 面板先作为可用的上下文操作入口。
  - Completed: 2026-06-15 09:34:11 CST
  - Verification: `node --check data/web/creative-canvas.js` 与 `yarn lint` 通过，前端已渲染 Agent 面板、任务/队列面板和节点动作按钮。
  - Follow-up: 2026-06-15 10:44:58 CST，将 Creative Canvas 剧本视图左侧面板接入旧版 `scriptAgent` socket；切换到“剧本”标签后自动连接，发送内容时携带锁定/当前节点上下文，支持停止，并解析旧版 Agent 输出中的 `<storySkeleton>`、`<adaptationStrategy>`、`<scriptItem>` 回写到 `setPlanData`。
  - Follow-up verification: `node --check data/web/creative-canvas.js`、`yarn lint`、`yarn test:prompt-center`、`yarn test:content-audit`、`yarn test:creative-canvas` 通过；HTTP smoke 验证 `/api/scriptAgent/setPlanData` 可写入 `o_agentWorkData`、更新 `o_script.content` 并记录 `o_generationArtifact`。本次未触发真实大模型生成。
  - Follow-up: 2026-06-15 11:25:58 CST，右侧任务区升级为“当前剧集进度”面板，按剧本内容、角色/场景资产、分镜分析、分镜图、视频 Prompt、视频结果、下游复核展示完成/待补齐/需复核状态；进度项可点击定位到对应画布节点，并将当前剧集任务与项目/历史任务分区展示。
  - Follow-up: 2026-06-15 21:34:13 CST，将原流程 `/api/script/extractAssets` 接入 Creative Canvas：右侧“角色/场景资产”进度项提供“提取资产/重新提取/重试提取”动作，剧本节点 Inspector 提供“提取角色/场景/道具”动作；提交后按当前 `projectId + scriptId` 调用原接口，并切换到资产视图等待异步结果刷新。
  - Follow-up: 2026-06-15 22:29:33 CST，资产提取入口增加重提取确认、进行中轮询、重复提交保护和可读布局整理；当旧资产仍存在但最近一次提取失败时，进度板显示“已有资产；最近提取失败”的 `warning/需复核` 状态，而不是把资产整体标记为失败。
  - Follow-up verification: `node --check data/web/creative-canvas.js`、`yarn lint`、`yarn test:creative-canvas`、`yarn test:content-audit`、`yarn test:prompt-center` 通过。
  - Follow-up: 2026-06-15 23:12:04 CST，将角色/场景/道具资产提取收敛为左侧资产 Agent 执行动作：新增 `o_taskProgress` 任务阶段日志表，`/api/script/extractAssets` 提交后返回 `taskId` 并记录 submitted/read_script/match_existing_assets/ai_extract/persist_assets/complete/failed 等阶段；Creative Canvas graph 合并资产提取任务节点、阶段日志和任务到资产产出边；左侧资产 Agent 下方展示当前剧集的资产提取执行过程。
  - Follow-up verification: `node --check data/web/creative-canvas.js`、`yarn lint`、`yarn test:creative-canvas`、`yarn test:content-audit`、`yarn test:prompt-center` 通过；`yarn test:creative-canvas` 覆盖资产提取任务节点、`taskProgress` 阶段日志和任务到资产产出连线。
  - Follow-up: 2026-06-15 23:49:29 CST，排查资产提取任务 #58：任务从 23:24:14 开始 20 分钟停留在 `ai_extract/running`，无 `persist_assets/complete/failed` 后续记录，Node 进程低 CPU 且仍有外部 443 连接，判定为外部 AI 调用长时间未返回。已在资产提取 AI 调用外层增加 6 分钟超时，超时后进入失败分支并写入失败进度；同时在启动恢复中将遗留 `o_tasks.state = 进行中` 标记为 `生成失败`，并写入 `o_taskProgress.recovered/error`，避免任务永久卡住。
  - Follow-up verification: `yarn lint`、`yarn test:creative-canvas`、`yarn test:content-audit`、`yarn test:prompt-center` 通过；数据库确认 #58 已更新为 `生成失败`，脚本 `extractState` 已恢复为 `-1`，重复 recovered 记录已清理且恢复逻辑已做幂等处理。
  - Follow-up: 2026-06-16 00:21:02 CST，排查资产提取任务 #59：AI 返回 `newAssets=0`、`existingAssetRefs=0`，但当前剧本已有 18 个资产关联。后端改为在已有资产关联存在时保留现有关联并标记 `warning/需复核`，不再把资产整体判为失败；同时强化资产提取 Prompt，要求只使用已有资产时也必须返回 `existingAssetRefs`；资产提取任务从画布节点/右侧执行列表移入左侧角色/场景/道具 Agent 对话历史展示。
  - Follow-up verification: `node --check data/web/creative-canvas.js`、`yarn lint`、`yarn test:creative-canvas`、`yarn test:content-audit`、`yarn test:prompt-center` 通过；数据库确认 #59 已修正为 `已完成` 且 reason 为“AI 未返回任何资产，已保留 18 个原有关联，建议人工复核”，对应 `o_taskProgress` 最终阶段为 `warning`。
- [x] Phase 6 - 浏览器验收与稳定化：通过真实浏览器检查画布入口、缩放拖拽、节点查看、文本修改、stale 标记、刷新后布局保持。
  - Completed: 2026-06-15 10:18:34 CST
  - Verification: `node --check data/web/creative-canvas.js`、`yarn lint`、`yarn test:prompt-center`、`yarn test:content-audit`、`yarn test:creative-canvas` 全部通过。
  - Browser check: 使用真实 in-app browser 打开 `http://localhost:10588/?v=202606151017#/project`，入口可见；打开 Creative Canvas 后渲染 9 个节点/8 条边，编辑审计句子后变为 12 个节点/11 条边；下游项目、拉片分析、分镜、视频 prompt、视频结果显示 stale；缩放从 72% 调整到 64%，刷新后 viewport 与 stale 标记保持。
  - Browser follow-up: 2026-06-15 10:44:58 CST，使用真实 in-app browser 打开 `http://localhost:10588/?v=202606151135#/project`，Creative Canvas 入口可见；进入画布后切换“剧本”标签，左侧显示剧本输入占位和“锁定剧本上下文/复制节点/发送/停止”，状态为“已连接旧版 scriptAgent”，浏览器控制台无 error。
  - Browser follow-up: 2026-06-15 11:25:58 CST，使用真实 in-app browser 打开 `http://localhost:10588/?v=202606151117#/project`，新版 `creative-canvas.js/css` 加载成功；进入画布后 EP01 进度显示 18 个资产、18 个分镜、18 条视频 Prompt、14 个视频结果；切换 EP02 后分镜分析、分镜图、视频 Prompt、视频结果显示“待补齐”；点击“分镜分析”后切换到“分镜”视图并选中“拉片分析”节点。
  - Browser follow-up: 2026-06-15 21:34:13 CST，使用真实 in-app browser 打开 `http://localhost:10588/?v=202606152131#/project`，新版 `creative-canvas.js/css` 加载成功；进入 Creative Canvas 后右侧“角色/场景资产”进度项显示“重新提取”按钮；点击“剧本内容”进度行后选中剧本节点，Inspector 显示“提取角色/场景/道具”按钮；浏览器控制台无 error。本次浏览器验收未点击提取按钮，避免触发真实 AI 资产提取任务。
  - Browser follow-up: 2026-06-15 22:29:33 CST，使用真实 in-app browser 打开 `http://localhost:10588/?v=202606152229#/project`，新版 `creative-canvas.js/css` 加载成功；进入 Creative Canvas 并切换“角色/场景”后，左侧显示“角色/场景 Agent”和已接入画布动作状态；右侧“角色/场景资产”进度项显示 `is-warning`、`需复核`、“已有 18 个资产；最近提取失败：AI 未返回任何资产”和“重新提取”按钮；资产节点按 280px 宽卡片分列展示，缩放为 72%；浏览器控制台无 error。
  - Browser follow-up: 2026-06-15 23:12:04 CST，重启 `yarn dev` 后使用真实 in-app browser 打开 `http://localhost:10588/?v=20260615230739#/project`；Creative Canvas 入口可见；进入画布并切换“角色/场景/道具”后，左侧显示“角色/场景/道具 Agent”、资产动作状态、“重新提取当前剧集”按钮和资产提取执行记录区域；当前项目没有新 `o_taskProgress` 记录时显示“暂无资产提取执行记录”；浏览器 console error 为 0。本次未点击重新提取，避免触发真实 AI 调用。
  - Browser follow-up: 2026-06-16 00:21:02 CST，使用真实 in-app browser 刷新 `http://localhost:10588/?v=20260615230739#/project`，进入 Creative Canvas 并切换“角色/场景/道具”后，左侧 Agent 对话历史显示资产提取任务 #58/#59，其中 #59 展示“AI 未返回任何资产，已保留 18 个原有关联，建议人工复核”和 `retained_existing_assets/finished` warning 进度；画布中不再渲染 `assetExtractionTask` 任务卡，右侧“当前剧集执行”不再重复展示资产提取任务，右侧“角色/场景资产”进度显示 `需复核` 和“重新提取”；浏览器 console error 为 0。
  - Data check: 浏览器验收项目中 `o_generationRevision.beforeText/afterText/beforeHash/afterHash` 写入成功，`o_script.content` 更新成功；验收临时项目及其 graph/audit/layout 数据已清理。

## Key Changes

- 数据层：新增紧凑表 `o_creativeCanvasState`，按 `projectId + scriptId/viewKey` 存储 `nodesLayout`、`edgesLayout`、`viewport`、`updateTime`；新增 `o_taskProgress` 记录生成/提取任务的阶段日志；业务事实仍来自现有项目、剧本、资产、分镜、视频和 `o_generationArtifact/o_generationSegment/o_generationRevision`。
- 后端接口：新增 `POST /api/creativeCanvas/getGraph`、`POST /api/creativeCanvas/saveLayout`、`POST /api/creativeCanvas/patchText`。`getGraph` 负责把业务数据、审计 graph、保存过的布局合并为前端可渲染节点和边。
- 前端实现：采用非侵入式静态注入方式新增 `data/web/creative-canvas.js` 与 `data/web/creative-canvas.css`，在现有项目/创作工作台加入入口，不放在设置页。
- 画布体验：v1 使用全屏 overlay，支持 pan/zoom、节点拖动、曲线连线、节点 inspector、缩放控件；视觉方向参考 Oii 示例，但不追求像素级复刻。
- 审计编辑：文本修改复用已完成的 `contentAudit.patchSegment` 能力；修改后生成 revision，并返回受影响的分镜、视频 prompt、视频节点，由前端展示 `stale` 标记。
- 兼容策略：不重构现有生产流、图片流和 Prompt Center；Creative Canvas 作为新的聚合视图，逐步接管创作工作台体验。

## Test Plan

- 单元测试：覆盖 graph builder 的节点生成、边生成、layout merge、缺失数据 fallback、stale 传播。
- 集成测试：临时创建项目/脚本/审计 segment，验证 `getGraph -> patchText -> getGraph` 后文本、revision、stale 节点正确。
- 回归测试：确认现有 `yarn test:prompt-center`、`yarn test:content-audit` 继续通过。
- 浏览器验收：打开 `http://localhost:10588/#/project`，进入 Creative Canvas，验证入口可见、画布可缩放/拖拽、节点可打开、文本可改、刷新后布局保持。
- 数据验收：修改一句剧本文本后，数据库中能查到 revision，画布上对应下游分镜/视频 prompt 节点显示 stale。

## Assumptions

- v1 只覆盖单项目、单剧本/当前创作上下文，不做跨项目全局画布。
- v1 不做多人协作、实时光标、权限审计和完整发布流。
- v1 的 Agent 面板先承接上下文操作与任务触发，不重写 agent 执行架构。
- 画布布局是运行时 UI 状态；生成内容事实仍以业务表和审计表为准。
- 如果后续找到完整前端源码，可把静态注入实现迁回源码组件；v1 先以最小风险方式交付可用闭环。
