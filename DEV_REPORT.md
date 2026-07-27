# 东北90年代拟人猫视觉手册开发报告

## 变更摘要

- 新增 `3D_90s_northeast_anthropomorphic_cat` 视觉手册。
- 新增 Toonflow 识别的 12 个 Markdown 字段文件，共 2304 行。
- 锁定 1988—1990 年、北安市红星机械厂家属院、9:16 和每个视频约
  60 秒。
- 锁定小橘、橘爸、花妈、猫奶奶、大勇的外形、服装、关系与表演方式。
- 覆盖七个核心地点、年代道具矩阵、角色/场景衍生、视频标签和导演分镜技法。
- 新增 1672×941 PNG 封面与专项自动化测试。

## 修改文件

- `data/skills/art_skills/3D_90s_northeast_anthropomorphic_cat/`：完整视觉手册
  与封面。
- `tests/visualManual.90sNortheast.test.mjs`：结构、封面、内容和禁用项测试。
- `PLAN.md`
- `DEV_REPORT.md`
- `CODEX_REVIEW.md`

## 测试命令

```bash
node --test tests/visualManual.90sNortheast.test.mjs
yarn lint
git diff --check
```

## 测试结果

- 专项测试 8/8 通过。
- `yarn lint`（`tsc --noEmit`）通过。
- 差异检查通过。
- Toonflow API 返回 12/12 非空字段。
- Toonflow 新建项目界面显示新手册和 12 个编辑页签。
- README、分镜视频、分镜表技法内容加载成功。
- 封面加载完成，自然尺寸 1672×941。

## 风险说明

1. 生成模型对猫爪、尾巴、毛纹、棉服厚度和儿童比例仍可能偶发漂移。
2. 真实品牌、节目、包装或游戏型号进入具体剧本时需要额外年代核验。
3. 封面是风格参考，不是五名角色的正式四视图。

## 回滚方案

删除新增视觉手册目录、专项测试和三份任务文档即可。无需数据库迁移，不影响
现有视觉手册。

## 是否需要人工确认

- 实际批量生成角色、场景、图片或视频会消耗上游资源，需要另行确认。
- PR 必须由人工审核和合并。

---

# 东北90年代拟人猫导演手册开发报告

## 变更摘要

- 新增 `Northeast_90s_anthropomorphic_cat` 导演手册。
- 按 Toonflow 现有规范新增 README、导演规划、分镜表 3 个字段文件，共
  478 行。
- 综合现有喜剧搞笑、家庭温情、青春成长手册的写法，形成适配本系列的
  “儿童小目标→拉同伙→计划升级→抓包/反转→行动传情→生活化笑点”结构。
- 锁定 1988—1990 年、北安市红星机械厂家属院、9:16、每集约 60 秒及
  50%/30%/20% 情绪比例。
- 将小橘、大勇、橘爸、花妈、猫奶奶的固定关系链转化为可执行的调度、
  反应镜头、台词和动作规则。
- 复用配套视觉手册 1672×941 PNG 封面，未触发新的图片生成。
- 新增 8 项专项自动化测试。

## 修改文件

- `data/skills/story_skills/Northeast_90s_anthropomorphic_cat/README.md`
- `data/skills/story_skills/Northeast_90s_anthropomorphic_cat/driector_skills/director_planning_narrative.md`
- `data/skills/story_skills/Northeast_90s_anthropomorphic_cat/driector_skills/director_storyboard_table_narrative.md`
- `data/skills/story_skills/Northeast_90s_anthropomorphic_cat/images/title.png`
- `tests/directorManual.90sNortheast.test.mjs`
- `PLAN.md`
- `DEV_REPORT.md`
- `CODEX_REVIEW.md`

## 测试命令

```bash
node --test tests/directorManual.90sNortheast.test.mjs tests/visualManual.90sNortheast.test.mjs
yarn lint
git diff --check
```

## 测试结果

- 导演手册专项测试 8/8 通过。
- 导演手册与配套视觉手册组合测试 16/16 通过。
- `yarn lint`（`tsc --noEmit`）通过。
- `git diff --check` 通过。
- Toonflow 新建项目界面出现“东北90年代拟人猫 · 导演叙事手法技能包”。
- 列表封面加载成功，自然尺寸 1672×941。
- README、导演规划、分镜表 3 个编辑页签均可加载。
- 应用编辑器保存的三份正文与版本库源文件逐字一致。

## 风险说明

1. 手册能约束生成方向，但首批分镜仍需人工复核年代物件、角色毛纹和猫爪动作。
2. 60 秒节拍是默认骨架，剧情信息较少时不应为了凑镜头数制造碎切。
3. 真实品牌、节目、包装、歌曲或游戏型号进入具体剧本时仍需逐项核验年代。
4. 封面复用视觉手册参考图，不替代正式角色四视图或分镜压力测试。

## 回滚方案

删除新增导演手册目录、专项测试，并回退三份任务文档中的导演手册章节即可。
无需数据库迁移，不影响现有导演手册和视觉手册。

## 是否需要人工确认

- 实际批量生成剧本、分镜、图片或视频会消耗上游资源，需要另行确认。
- Draft PR 必须由人工审核和合并，不自动合并。
