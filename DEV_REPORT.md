# 治愈系都市女性生活视觉手册与导演手册

## 变更摘要

- 新增可独立选择的视觉手册 `2D_healing_urban_women_vlog`，包含 Toonflow
  固定的 12 个 Markdown 字段和无字封面。
- 新增可独立选择的导演手册 `Healing_urban_women_vlog`，包含 README、
  导演规划、分镜表叙事手法和封面。
- 两套手册覆盖六类故事模型、五名固定人物、四类空间、色板、光线、材质、
  道具状态、时间戳字幕、镜头、转场和声音。
- 新增契约测试，未修改既有业务功能、接口、数据库或前端。

## 修改文件

- `data/skills/art_skills/2D_healing_urban_women_vlog/`
- `data/skills/story_skills/Healing_urban_women_vlog/`
- `tests/healingUrbanWomenVisualManual.test.mjs`
- `PLAN.md`
- `DEV_REPORT.md`
- `CODEX_REVIEW.md`

## 测试命令

```bash
node --test tests/healingUrbanWomenVisualManual.test.mjs
node --test tests/*.test.mjs
yarn lint
curl -sS -o /dev/null -w '%{http_code} %{content_type}\n' \
  http://127.0.0.1:10588/
```

## 测试结果

- 专项契约测试 10/10 通过。
- 当前完整工作区全量 MJS 回归 46 项：45 项通过，1 项真实豆包生成测试按
  环境开关跳过，无失败。
- 本任务独立 PR 工作树 MJS 回归 10/10 通过。
- `yarn lint`（`tsc --noEmit`）通过。
- Toonflow 服务返回 HTTP 200。
- 应用内“新建项目”界面已同时显示新增视觉手册卡片与导演手册卡片。
- 没有点击“确定”，未创建项目、覆盖项目配置或修改用户数据。

## 封面

- 使用内置图像生成工具，根据三支新增参考视频的老街外婆、女性友谊二维质感
  和家庭暖光生成原创封面。
- 最终图片为 1672×941 RGB PNG，写入两套手册各自的 `images/cover.png`。
- 提示词核心：年轻都市女性与外婆在干净、有使用痕迹的薄荷绿旧厨房并排择菜
  和切菜；半写实二维数字插画、柔和网漫、克制赛璐璐、奶油暖光与窗外树影；
  禁止文字、Logo、水印、恋爱编码、疾病死亡、同脸、手指错误、穿模、重影、
  黑边、真人照片和 3D 塑料感。

## 风险说明

1. 视觉与导演手册由两个目录独立读取，共同常量需要同步维护。
2. 封面只代表一种关系场景，不能代替六类故事的完整章节。
3. 图像/视频模型仍需实际项目逐镜检查手部、多人物年龄和状态连续性。
4. 参考音频的具体歌曲与完整口播没有被当作已核验事实。

## 回滚方案

删除两个新增手册目录、专项测试和三份本任务文档即可。无数据库迁移、接口
变更或用户数据清理。

## 是否需要人工确认

手册生成和只读验收已经完成。草稿 PR 需要人工审查并合并；创建项目、覆盖
现有项目手册或批量生成资产属于后续操作，本任务未执行。
