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
