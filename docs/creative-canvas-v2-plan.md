# Toonflow Creative Canvas v2 需求计划（创作级无限画布精修）

## Summary

目标：在已交付的 Creative Canvas v1（全屏画布、pan/zoom、节点 inspector、审计句子级编辑、scriptAgent 接入）基础上，把画布升级到**影视短剧创作级**的视觉与信息密度，对齐目标设计稿：富媒体节点卡（角色/场景资产缩略图组卡、分镜缩略图、视频结果播放 tile）、节点状态徽章、语义化连线、信息完备的右侧 Inspector 与「当前剧集进度」面板、带状态图标/进度条的左侧 Agent 执行历史、Toonflow 品牌头部。

执行规则：每完成一个 Phase 并通过验收后，把 `- [ ]` 改为 `- [x]`，补充完成日期、验证命令、浏览器检查结果。

## Current Facts（v1 已就位，不重建）

- 布局骨架已全：`renderHeader`（项目/剧本选择 + 视图 tab + 刷新/保存布局/关闭）、左侧 Agent 面板 + 执行历史、中部 pan/zoom 节点图 + 贝塞尔曲线连线、右侧 Inspector + 当前剧集进度板。代码在 `data/web/creative-canvas.js`（1876 行）/ `creative-canvas.css`（1059 行）。
- 后端 graph builder `src/utils/creativeCanvas.ts`（658 行）已输出 project/script/storyboardAnalysis/asset/storyboard/videoPrompt/video/auditArtifact/auditSegment/task 节点与语义边、stale 传播、layout 合并。
- **关键缺口**：后端 graph **完全不输出任何图片/缩略图/视频 URL**。资产/分镜/视频节点都是纯文本预览。这是 v2 最大的真实工作量。
- 资产类型字段 `o_assets.type ∈ {role, scene, tool}`；缩略图 URL 用 `oss.getSmallImageUrl(filePath)`（返回 `/oss/...?size=20`），视频/海报用 `oss.getFileUrl(filePath)`。资产候选图在 `o_image`（`assetsId` 关联，`o_assets.imageId` 为选定图）。

## 确认的产品决策

- **「发布」按钮**：仅占位 UI（渲染按钮 + 样式，点击暂不触发后端行为），后续再定义语义。
- **资产节点形态**：按设计稿改为**组卡** —— 角色/场景/道具各聚成一张大卡（卡内缩略图网格 + 数量 + 来源），不再每个资产一个节点。

## Phased Checklist

- [x] Phase 0 - 需求落盘：创建本文件，写入目标、当前事实、确认决策、阶段清单、Key Changes、Test Plan、Assumptions。
  - Completed: 2026-06-16 01:10 CST
- [x] Phase A - 后端节点补齐媒体与状态字段（`src/utils/creativeCanvas.ts`）：
  - 资产按 `type` 聚合为 `assetGroup:role|scene|tool` 组卡，data 含 `count`/`thumbnails[]`（`getSmallImageUrl`）/`items[]`/`sourceLabel`；脚本→资产组、资产组→分镜、提取任务→资产组的边按组卡重连去重。
  - `storyboardAnalysis` 每 shot 补 `thumbnail`，节点 data 增加 `thumbnails[]` + `shotCount`。
  - `video` 节点补 `poster`/`src`（`getFileUrl`）；新增 `videoPromptGroup`/`videoGroup` 概览聚合卡（含 `生成中 x/总数`）。
  - 每节点补 `status`/`version`/`sourceHash`/`updateTime`/`sourceLabel`（version/hash 由审计快照索引推导，无快照时优雅留空）。
  - 扩展 `scripts/test-creative-canvas.ts` 覆盖组卡聚合、缩略图字段、status、聚合卡。
  - Completed: 2026-06-16 CST。Verification: `yarn lint`、`yarn test:creative-canvas`、`yarn test:content-audit`、`yarn test:prompt-center` 全通过。
- [x] Phase B - 前端富节点卡片（`renderNodeContent` 等，`data/web/creative-canvas.js`）：
  - 角色/场景/道具组卡：缩略图网格 + 数量 + 来源 + 状态徽章。
  - 分镜分析：缩略图行 + 溢出计数；storyboard 单卡补宽缩略图。
  - 视频结果聚合卡：播放 tile 网格 + `+N` 溢出 + `生成中 6/18`；视频 Prompt 聚合卡三栏样例。
  - 概览展示聚合卡、分类视图展开个体卡（`OVERVIEW_HIDDEN_TYPES` / `GROUP_TYPES` + 重写 `visibleNodeIds`/`renderNode`）。
  - 资产计数改为按组卡 `items` 聚合（`activeAssetIdsForScript`、进度板同步）。
  - Completed: 2026-06-16 CST。Verification: `node --check`、`yarn lint`、`yarn test:creative-canvas` 通过。
- [x] Phase C - 前端视觉精修（`creative-canvas.css` + `renderHeader`/`renderInspector`/Agent 历史）：
  - 品牌换为 **Toonflow** + ✦ logo + 项目名；头部补「发布」占位按钮；刷新/保存布局/发布/关闭 样式分级。
  - 语义化连线按 `edge.type` 着色 + 虚线（uses/references 青色、contains/analysis/expands 蓝色、generates/renders 粉色实线）。
  - 节点 source/count、缩略图网格、视频 tile、prompt 三栏样式。
  - Inspector：类型 / ID / 状态点 / 版本 / 更新 / 来源 Hash + 复制按钮 + 内容预览（组卡展示成员列表）。
  - Agent 历史内联进度条（`生成中 x/total · pct%`）+ 进度点呼吸动效。
  - Completed: 2026-06-16 CST。Verification: `node --check`、`yarn lint`、全部 test 通过；index.html cache-buster 升级到 `20260616012015`。
- [x] Phase D - 浏览器验收 + 文档同步：
  - `node --check`、`yarn lint`、`yarn test:creative-canvas`、`yarn test:content-audit`、`yarn test:prompt-center` 全通过。
  - 真实浏览器（Playwright，经 LAN IP `192.168.1.22:10588`，因 loopback 不可达）进入画布：品牌显示 `Toonflow · 十六岁的喜欢`、发布按钮在；概览渲染 3 张资产组卡 + videoGroup + videoPromptGroup + 拉片分析 + 剧本，并正确隐藏个体 asset/video/videoPrompt；状态徽章、8 类语义连线、节点来源、41 张缩略图 `<img>`、Inspector（类型/ID/状态/来源 + 6 行资产成员预览 + 复制按钮）、右侧 7 项剧集进度均渲染；切到资产视图显示组卡、切到视频视图展开 14 个视频 + 18 个 Prompt 个体卡。
  - Browser note: 缩略图/视频 `<img>` 元素 URL 正确（`/oss/...?size=20`），但 Playwright 经 LAN IP 访问时 dev 环境的 `localhost` 资源 URL 不可达，故图片未实际绘制；桌面/同源环境下页面 origin 与 `getLocalServeOrigin()` 一致，图片正常加载。
  - 节点模型有变（新增 assetGroup/videoPromptGroup/videoGroup），已同步更新 `docs/architecture.md` 第 6/9 节相关描述。
  - Completed: 2026-06-16 CST。

## Key Changes

- 后端：graph builder 资产节点由「逐个资产」改为「按 type 组卡」；所有媒体节点补缩略图/海报 URL（复用 `oss.getSmallImageUrl`/`getFileUrl`，不新增静态服务）；节点补 status/version/sourceHash/updateTime/sourceLabel。
- 前端：`renderNodeContent` 分类型渲染富卡片；CSS 重做节点视觉、连线语义配色、点阵背景；Inspector 与进度板补结构化字段；Agent 历史补状态与进度。
- 兼容：不改业务表与生产流，组卡仅为画布聚合视图；layout 仍按 `o_creativeCanvasState` 持久化；v1 已存布局对组卡新 id 做 fallback（无保存位置时用默认排布）。

## v2.1 精修轮（2026-06-16）

对照设计图二次精修：

- [x] **修复连接线不显示（关键 bug）**：根因是 `h()` 用 `document.createElement` 创建 `<svg>`，得到 `HTMLUnknownElement`（xhtml 命名空间），SVG 视口不成立、尺寸塌缩为 0×0，80 条 path 坐标/配色正确但无画布可绘。修复：`h()` 对 `svg/path/g/circle/...` 等标签改用 `createElementNS(SVG_NS)` 并用 `setAttribute('class')`。浏览器验证 80/80 连线可见。
- [x] **左侧图标导航 rail**：新增 56px 竖向 rail（总览/剧本/资产/分镜 4 图标，点击切视图，active 高亮）。
- [x] **EP 选择器**：项目下拉加文件夹图标，剧集下拉做成粉色 EP pill，区别于项目选择。
- [x] **Inspector 头部**：固定「节点详情」段标题 + ✎🔗⋮ 图标行，节点名在下。
- [x] **缩放控件**：补「适配视图」⛶ 按钮（`fitView` 自动居中缩放可见节点）。
- [x] **项目总览节点**：metric 改为 pill chips（集/资产/分镜/视频）。
- [x] **资产组卡缩略图**：改单行 flex 布局（`thumb-grid.is-row`）。
- 头部布局由固定 5 列 grid 改为 flex（适配重组后的 brand/选择器组/tabs/actions 结构），layout 主网格补 rail 列（`56px 330px 1fr 360px`）。
- Verification: `node --check`、`yarn lint`、`yarn test:creative-canvas`、`yarn test:content-audit`、`yarn test:prompt-center` 全通过；真实浏览器确认 80/80 连线、rail、EP pill、Inspector 段标题+3 图标、缩放适配键、4 chips、单行缩略图、header flex、4 列布局。cache-buster 升级到 `20260616020000`。

## v2.2 图片流展开抽屉（2026-06-16）

需求：分镜/资产卡片点开后能看到原生「图片流编辑器」那样的界面（上传图 → 生成图 + 参考图 + prompt + 模型/比例/质量 + 生成）。采用**轻量展开抽屉**方案,复用全部已有后端,与原生编辑器同表(`o_imageFlow`)数据一致,不复刻拖拽连线。

- [x] **E1 后端透出 flowId**：`src/utils/creativeCanvas.ts` 中 storyboard 节点 data 已含 `storyboard.flowId`（`compactRow` 全列）；assetGroup `items[]` 每项补 `flowId`。`scripts/test-creative-canvas.ts` 断言 storyboard 节点与资产组卡成员均含 flowId。
- [x] **E2 图片流抽屉（前端）**：`data/web/creative-canvas.js` 新增 `flowDrawer` 状态与抽屉。分镜节点 Inspector 加「展开图片流」按钮、资产组卡成员行可点击（有 flowId 时）→ 打开抽屉。抽屉调 `POST /api/production/editImage/getImageFlow {id:flowId}` 取流,解析 `upload`/`generated` 节点渲染上传图、生成图、参考图行、prompt 文本域、模型输入 + 比例/质量下拉（默认来自 `getImageDefaultModle`）；「生成」走 `generateFlowImage`,「保存到分镜/资产」走 `updateStoryboardUrl`/`updateAssetsUrl`（干净落库,无需重建 React-Flow 节点图）。无 flowId 时提示尚未建立图片流。配套抽屉 CSS。
- [x] **E3 验收 + 文档**：测试全通过；真实浏览器对真实数据验证 —— 选中分镜 `storyboard:43`（flowId 2）点「展开图片流」,抽屉加载出 2 张 stage 图（上传+生成）、4 张参考图、612 字 prompt、模型 `volcengine:doubao-seedream-5-0-lite-260128`、16:9,生成/保存按钮就位,关闭正常。cache-buster 升级到 `20260616023000`。
- 决策：编辑器深度 = 轻量展开抽屉（用户确认）；不做完整拖拽节点编辑器复刻,后续如需可在此抽屉基础上扩展。

## v2.3 左侧 Agent 改造为会话式交互区（2026-06-16）

需求：把左侧 Agent 面板从「输入框在上 + 消息在下」改成标准会话式布局（参考设计图右侧）。

- [x] `renderAgentPanel` 重构为 `.tfcc-chat` 三段式 grid（`auto / minmax(0,1fr) / auto`）：
  - **顶部 header**：agent 名 + 角色副标题 + 连接状态 pill（绿点「已连接」/ 黄点呼吸「连接中」/「未连接」）。
  - **中部 body**：可滚动会话历史（`overflow-y:auto` 填充剩余高度）；用户气泡靠右、助手卡靠左；资产模式展示提取执行记录。
  - **底部 composer（贴底固定）**：圆角输入 + 内嵌圆形发送钮（`➤`，空文本禁用，运行中变红色停止 `■`）+ 锁定上下文圆钮（`⌖`，锁定时高亮）；`⌘/Ctrl+Enter` 发送。
  - 锁定时在 header 下显示「已锁定上下文 + 解除」横幅。
  - 输入时直接同步发送钮 disabled 态,避免整面板重渲染导致输入框失焦。
  - 保留 `sendAgentMessage`/`stopAgentMessage`/`lockAgentContext`/资产提取动作。
- Verification: `node --check`、`yarn lint`、`yarn test:creative-canvas` 通过；真实浏览器（改造前会话期间）确认三段式 grid、header 状态 pill 已连接、body 可滚动、composer 贴底、剧本/资产两模式均正常、发送钮存在。cache-buster 升级到 `20260616031500`。
- 备注：send-enable 微调（输入即时启用发送钮）后开发服务已被停止,该微调为直接 DOM 切换,逻辑直接；下次启动 `yarn dev` 刷新即可复验。

## v2.4 会话观感修复 + 深度思考开关（2026-06-17）

修复用户标注的两处问题：

- [x] **消息渲染**：`.tfcc-agent-msg-body` 原有 `max-height:220px; overflow:auto` 把每条助手 markdown 裁成小滚动框,看起来像未格式化的原始文本块。会话区(`.tfcc-chat-body`)内改为 `max-height:none; overflow:visible`,消息自然展开（整个 body 已滚动）。消息头状态英文(pending/complete)改中文（生成中/完成/需复核/失败）,加角色头像（✦ Agent / 你 用户）,气泡按 user/assistant 分色。
- [x] **深度思考开关**：composer 改为两行（工具行 + 输入行）。工具行加「🧠 深度思考」开关 chip（蓝色高亮）与「⌖ 锁定上下文」chip（粉色,点击切换锁/解锁）。`sendAgentMessage` 随 `chat` emit 带 `{think, thinkLevel}`；后端 `src/socket/routes/scriptAgent.ts` 的 chat 事件接收并更新连接级 `thinkConfig`（productionAgent 早已有 `updateThinkConfig` 事件,此处补 chat 内联参数）。
- 范围说明：图片上传 / 模型选择未做 —— scriptAgent socket 只收文本、模型为设置级全局配置（`agentUseMode`/`o_agentDeploy`）,做这两项会是误导性死 UI,需后端改造为会话级才有意义（已与用户确认仅做深度思考开关）。
- Verification: `node --check`、`yarn lint`、`yarn test:creative-canvas` 通过；真实浏览器发送真实消息往返确认 —— 用户气泡（右,粉）+ 助手气泡（左,✦ 头像「统筹」「完成」）markdown 正常渲染为 `<p>` 块、`maxHeight:none`/`overflow:visible` 不再截断；深度思考 chip 可切 开/关、锁定 chip 在位、composer 两行。cache-buster 升级到 `20260617010000`。

## v2.5 总览节点重排为左→右流水线（2026-06-17）

问题：总览节点排布乱 —— `videoPromptGroup`/`videoGroup` 浮在中下方(1180/1600,980)与「分镜→视频」流脱节;资产组卡(x=1840)与 18 个分镜列(x=1840)重叠;18 个分镜 + 18 个 videoPrompt + 14 个 video 个体卡全堆在总览里。

- [x] **重排 fallbackPosition 为列式流水线**（`src/utils/creativeCanvas.ts`）：项目(x=0)→剧本(x=400)→分镜分析(x=860,w=920)→资产组卡 role/scene/tool(x=1860 竖排)→视频Prompt 组卡(x=2260)→视频结果组卡(x=2700)→任务(x=3160)。各列 x 区间互不相交,零重叠。
- [x] **总览只显示聚合卡**：`OVERVIEW_HIDDEN_TYPES` 增加 `storyboard`（个体分镜不再堆在总览,由「分镜分析」聚合卡代表）；个体 storyboard/video/videoPrompt 仍在各自分类视图展开。总览节点数 36→18。
- [x] **清理过期布局**：删除 demo 项目 `o_creativeCanvasState` 的 overview 行（早期测试时以旧坐标保存,会经 `applySavedPosition` 复活乱布局）；新 fallback 生效,后续保存按新布局走。
- Verification: `node --check`、`yarn lint`、`yarn test:creative-canvas` 通过；真实浏览器确认总览 18 节点排成 7 列互不重叠的左→右流水线、连线在列间流动、适配视图(⛶)可整体取景；切「分镜」视图仍展开全部 18 个个体分镜。cache-buster 升级到 `20260617020000`。

## Test Plan

- 单元：`yarn test:creative-canvas` 覆盖组卡聚合（按 type 分组与计数）、缩略图/海报 URL 字段、status 字段、缺图 fallback、stale 传播不回归。
- 回归：`yarn test:content-audit`、`yarn test:prompt-center` 继续通过；`yarn lint` 通过。
- 浏览器：对照设计稿核对富节点、徽章、连线、Inspector、进度板、品牌；缩放/拖拽/刷新后布局保持。

## Assumptions

- v2 仅做视图层精修与组卡聚合，不改 agent 执行架构、不改业务表结构。
- 「发布」为占位 UI，无后端副作用。
- 缩略图走现有 `/oss?size=` 缩略图能力，不引入新的图片管线。
- 设计稿是视觉方向参考，求神似与信息对齐，不追求像素级复刻。
