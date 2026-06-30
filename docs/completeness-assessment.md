# Toonflow 完成度评估报告

> 评估日期：2026-07-01 · 评估对象分支：`codex/video-compose-integration`（领先 master 22 提交）
> 面向：项目负责人 / 投资评估 / 新接手的工程师或 AI。读完应能判断"这个项目离可交付产品还有多远、缺口在哪、按什么顺序补"。
> 方法：对 `src/`、`data/`、`docs/` 全量代码路径追踪，逐环节核验"有没有 / 是否 AI 自动 / 是否闭环"。

---

## 0. 一句话结论

> **愿景超前、后段扎实、前段断链、地基薄弱。** 当前是一个**可演示、不可交付**的高潜力原型，综合完成度约 **55–60%**，处于「早期内测」阶段。它在最难的地方（AI 视频一致性与质量门禁）做得出乎意料地扎实，却在最该贯通的地方（端到端自动化）断了链，又在最不该省的地方（工程地基：安全 / 测试 / 沙盒）欠了债。

---

## 1. 全景完成度地图

```
文本导入 ──→ 事件分析 ──→ 剧本 ──→ 资产提取 ──→ 分镜 ──→ 视频生成 ──→ 审核门禁 ──→ 合成
  ✅成熟      ✅成熟      ⚠️断链   ✅成熟      ⚠️断链    ✅成熟       ✅出色      ✅闭环
  (AI)        (AI)      (Agent   (AI)       (Agent    (强约束)     (自动QA)
                        /手工)              /手工)
   └────────── 前段：环节齐全但不连贯 ─────────┘ └───── 后段：真正的护城河 ─────┘

横切层：Creative Canvas 可视化工作台 ✅  +  多级 Agent 框架（决策→执行→监督）✅
地基层：队列 ⚠️ ·  供应商沙盒 🔴 ·  测试 🔴 ·  安全 🔴 ·  可观测 ⚠️
```

---

## 2. 评分总表

| 维度 | 评分 | 状态 | 风险等级 |
|---|:---:|---|:---:|
| 愿景与架构设计 | ⭐⭐⭐⭐⭐ | 押对护城河，骨架先进 | — |
| 后段：视频一致性 / 空间稳态 | ⭐⭐⭐⭐ | 真正的亮点，精度有上限 | 低 |
| 前段：文本→分镜链路 | ⭐⭐⭐ | 环节齐全但断链 | 中 |
| 工程地基：安全 / 测试 / 运维 | ⭐⭐ | 最大短板 | **高 🔴** |
| **综合完成度** | **~55–60%** | **早期内测，不可交付** | — |

---

## 3. 前段创作链路（文本 → 剧本 → 资产 → 分镜）

| 环节 | 自动化 | 闭环 | 成熟度 | 关键文件 | 缺口 |
|---|:---:|:---:|:---:|---|---|
| 原文导入 / 章节管理 | AI 辅助 | ✅ | 成熟 | `src/routes/novel/addNovel.ts` | 无智能拆章建议 |
| 事件分析 | ✅ AI | ✅ | 成熟 | `src/utils/cleanNovel.ts`、`src/routes/novel/event/generateEvents.ts` | 仅章级、无审核 UI |
| 剧本生成 | ❌ 手工/Agent | ❌ | **初期** | `src/agents/scriptAgent/index.ts`、`src/routes/script/batchAddScript.ts` | **无「事件→剧本」自动转写** |
| 资产提取 | ✅ AI | ✅ | 成熟 | `src/routes/script/extractAssets.ts` | 资产属性需二次完善 |
| 分镜生成 | ❌ 手工/Agent | ❌ | **初期** | `src/routes/production/storyboard/batchAddStoryboardInfo.ts`、`batchGenerateImage.ts` | **无「剧本→分镜」自动拆解** |
| Agent 驱动 | ✅ 智能 | ✅ | 高级 | `src/agents/productionAgent/tools.ts` | `storyboardPipeline` 仅别名，无真管道 |

**判断：⚠️ 中等偏低。** 三个环节（导入 / 事件 / 资产）已 AI 自动化且闭环；**剧本与分镜两处断链**——靠用户在 Agent 对话里手工触发 `save_flowData` 落库，缺少端到端自动流水线。各环节是独立 API/Agent，没有贯穿的 DAG。结果：**"一站式 / 全流程"的承诺未兑现**，真实使用门槛高。

---

## 4. 后段：视频一致性与空间稳态（项目护城河）

核心思想：**用结构化"合同"+ 多模态"参考"+ VLM/QA"门禁"，把每个镜头钉死在一个唯一空间真相上。** 不赌模型，用工程约束兜底。

### 4.1 三层一致性约束

| 层 | 锚点类型 | 实现 | 关键文件 |
|---|---|---|---|
| 语义锚 | 角色/场景/道具不变特征 | 结构化资产卡 + `constraints.must/avoid` | `src/utils/characterSpec.ts` |
| 空间锚 | 固定锚点 / 站位 / 禁止漂移 | `EffectiveLayout`（唯一空间真相）+ `ContinuityContract` | `src/utils/storyboardContinuity.ts` |
| 视觉锚 | 首尾帧底盘 + 资产参考图 | `resolveVideoReferences()` 带 `role` 标签的有序参考列表 | `src/utils/videoReferences.ts` |

三者在**视频 Prompt 拼接**与**参考图列表**处汇合。`EffectiveLayout` 在 prompt 中附带宪法级声明："*SpatialContract 是唯一空间真相；StateOverlay、Shot 和 Prompt 不得移动固定锚点或重排大件陈设*"（`storyboardContinuity.ts:170`）。镜头 A 的尾帧 → 镜头 B 的首帧约束，实现空间状态的物理传递。

### 4.2 双重 QA 门禁（闭环质量控制）

- **分镜图门禁**（`src/utils/queueHandlers.ts`）：VLM 输出结构化 `passed` / `score` / `hardFailures` / `softWarnings`。`EffectiveLayout` 负责裁决固定锚点、承载关系、站位和禁止漂移；`passed=false` 或任意 `hardFailures` 直接硬拒绝，不能因 score 较高而选中。无 hard failure 但 score < 60 时进入 `needs_review`；连续失败 2 次标记 prompt 待复核。
- **视频合成门禁**（`src/utils/videoReview.ts`）：生成后自动 AI 审核（可播性 + 资产绑定 + 视觉指纹比对），结论 `passed/warning/failed` 存 `o_videoReview`。`assertVideoReviewAllowsCompose()` 在「入队前 / 队列执行前」双重拦截——`failed` 拒绝合成、`warning` 须人工 `acceptVideoReviewWarning()` 放行。`autoSelectBestVideoForTrack()` 多候选按分自动选优。

**判断：⭐⭐⭐⭐ 真正的亮点。** 工程化扎实、可解释、可审计（每步记 `o_generationArtifact` / `o_videoReview`）。

### 4.3 一致性方案的精度天花板

- 视觉一致性校验用 **16×16 像素指纹 + 欧氏距离**（`src/utils/visualSimilarity.ts`，阈值 0.55）——只能抓"完全跑偏"，**抓不住脸型微变、服装细节漂移**。
- **生成后无角色身份回判**，本质仍依赖视频模型遵守 reference 的能力。
- `EffectiveLayout` 质量依赖资产卡空间字段的填写质量——**垃圾进垃圾出**。

---

## 5. 工程地基（生产就绪度）

| 维度 | 评分 | 状态 | 关键文件 | 核心问题 |
|---|:---:|---|---|---|
| 队列系统 | 60 | ⚠️ 凑合 | `src/utils/genQueue.ts`、`queueHandlers.ts`、`composeHandlers.ts` | 有持久化恢复（`recoverQueue`），但断电时"已部分执行"任务**重复执行浪费**；无死信队列、无事务保护 |
| 供应商沙盒 | 30 | 🔴 危险 | `src/utils/vm.ts`、`data/vendor/*.ts` | **`vm2@3.11.4` 已停维护且有未修复 RCE（CVE-2023-30547）**，而 UI 允许编辑 vendor 代码 → 沙盒逃逸风险 |
| 数据库迁移 | 70 | ⚠️ 凑合 | `src/lib/initDB.ts`、`fixDB.ts` | 幂等迁移健全，但无 `schema_migrations` 版本表、无回滚、SQLite alter 依赖删表重建有并发丢数风险 |
| 测试覆盖 | 20 | 🔴 薄弱 | `scripts/test-*.ts` | **无 vitest/jest**，仅 5 个手工冒烟脚本；队列重试、QA 门禁、DB 迁移等核心逻辑**零覆盖** |
| 错误处理/可观测 | 70 | ⚠️ 凑合 | `src/logger.ts`、`src/utils/error.ts` | 有文件日志 + 错误规范化，但无结构化日志 / traceId / 告警 |
| 鉴权与安全 | 40 | 🔴 薄弱 | `src/app.ts`、`src/routes/login/login.ts` | 硬编码 `admin123`；JWT 无过期/刷新/黑名单；`/oss` 仅 compose/merge 校验，其余路径裸奔；CORS 无速率限制 |
| 部署/打包 | 75 | ⚠️ 凑合 | `electron-builder.yml`、`scripts/build.ts` | 主链路完整，但 **ffmpeg/ffprobe 未捆绑**（用户需自装）、无 CI/CD、无数据迁移脚本 |

**判断：🚫 原型→内测，不可直接上线。** 安全漏洞堆积 + 可靠性无测试保障 + 运维成本高，是阻断生产部署的硬门槛。

---

## 6. 改进路线图

### 🔴 P0 — 补地基（上线硬门槛，2–4 周）

| 任务 | 动作 | 涉及 |
|---|---|---|
| 替换死亡沙盒 | `vm2` → `isolated-vm` / Node Worker / QuickJS；vendor 代码加签名校验 | `src/utils/vm.ts`、`package.json` |
| 建立测试体系 | 引入 vitest，为队列重试、QA 门禁判定、DB 迁移幂等写测试套件 + 接入 CI | `scripts/`、新增 `*.test.ts` |
| 修鉴权与 OSS | JWT 加过期/刷新/黑名单；移除硬编码密码；全 `/oss` 路径加认证；加速率限制 + CSRF | `src/app.ts`、`src/routes/login/` |

**出口标准**：核心路径测试覆盖 >60%、vendor 沙盒替换完成、安全自查通过 → 方可小范围内测。

### 🟠 P1 — 接通前段链路（兑现"全流程"，3–5 周）

| 任务 | 动作 | 涉及 |
|---|---|---|
| 事件→剧本自动转写器 | 复用 `scriptAgent` 框架，让其自动读取 `o_novel.event` 并落库 `o_script`，去除手工粘贴 | `src/agents/scriptAgent/` |
| 剧本→分镜自动拆解器 | 独立模块（非 Agent）：剧本场景 → 分镜列表 + 镜头描述 + 关键帧 prompt | 新增 `src/utils/storyboardSplitter.ts` |
| 端到端 DAG 流水线 | 把七八个独立 API/Agent 串成可一键触发、可断点续跑的流水线 | `src/utils/genQueue.ts` + 新增编排层 |
| Agent 数据持久化 | `save_flowData` 自动化，避免对话中数据丢失 | `src/agents/productionAgent/tools.ts` |

### 🟡 P2 — 提质与运维（产品打磨，持续）

| 任务 | 动作 | 涉及 |
|---|---|---|
| 一致性精度升级 | 16×16 像素指纹 → CLIP / 人脸 embedding；补生成后角色身份回判 | `src/utils/visualSimilarity.ts`、`videoReview.ts` |
| 可观测性 | 结构化 JSON 日志 + traceId + 错误告警阈值 | `src/logger.ts` |
| 队列健壮性 | 资产/分镜生成阶段加 hash 幂等去重；引入死信队列 | `src/utils/genQueue.ts`、`queueHandlers.ts` |
| 部署完善 | dist `extraResources` 捆绑 ffmpeg/ffprobe，或一键安装脚本 | `electron-builder.yml` |

---

## 7. 关键文件索引

| 主题 | 文件 |
|---|---|
| 资产卡（语义一致性） | `src/utils/characterSpec.ts` |
| 空间合同（空间稳态） | `src/utils/storyboardContinuity.ts` |
| 视频参考（首尾帧/资产图） | `src/utils/videoReferences.ts` |
| 视频审核门禁 | `src/utils/videoReview.ts`、`src/utils/visualSimilarity.ts` |
| 队列调度 | `src/utils/genQueue.ts`、`queueHandlers.ts`、`composeHandlers.ts` |
| 事件分析 | `src/utils/cleanNovel.ts`、`src/routes/novel/event/generateEvents.ts` |
| 资产提取 | `src/routes/script/extractAssets.ts` |
| 分镜生成 | `src/routes/production/storyboard/batchAddStoryboardInfo.ts`、`batchGenerateImage.ts` |
| Agent 工具集 | `src/agents/productionAgent/tools.ts`、`src/agents/scriptAgent/tools.ts` |
| 供应商沙盒 | `src/utils/vm.ts`、`data/vendor/*.ts` |
| 数据库迁移 | `src/lib/initDB.ts`、`src/lib/fixDB.ts` |

---

## 8. 相关文档

| 主题 | 文档 |
|---|---|
| 整体架构 / 数据流 / Agent / 队列 | [architecture.md](architecture.md) |
| 视频合成 / 宫格分镜 | [video-compose-features.md](video-compose-features.md) |
| Creative Canvas 当前实现 | [creative-canvas-v2-plan.md](creative-canvas-v2-plan.md) |
| 分镜 Agent 任务协议 | [storyboard-agent-task-protocol-plan.md](storyboard-agent-task-protocol-plan.md) |
