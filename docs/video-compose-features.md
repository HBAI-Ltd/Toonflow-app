# 视频合成与宫格分镜功能说明

> 本文档描述借鉴 huobao-drama 优势后集成到 Toonflow 的新特性（2026-06），包括单镜成片合成、整集拼接导出、宫格分镜图生成、分镜结构化字段与可选 TTS 配音管线。所有耗时任务均走 Toonflow 原有的持久化生成队列（`o_genQueue`），支持软件重启后状态自动矫正。

## 功能总览

| 特性 | 说明 | 关键模块 |
|------|------|----------|
| 单镜成片合成 | 选定视频 + 可选 TTS 配音 + 烧录台词字幕，输出统一编码的成片片段 | `src/utils/composeHandlers.ts` / `src/utils/ffmpegTool.ts` |
| 整集拼接导出 | 按分镜顺序拼接各镜头视频，自动归一化分辨率/帧率 | 同上 |
| 宫格分镜图 | 一次模型调用生成 rows×cols 宫格图，再切分写回各分镜，风格/角色天然一致 | `src/utils/gridImage.ts` |
| 分镜结构化字段 | 分镜新增台词/音效/景别/运镜四个字段，可独立编辑 | `o_storyboard` 新列 |
| TTS 配音管线 | 合成时可选指定 TTS 模型生成配音，失败优雅降级为仅字幕 | `Ai.Audio` |
| 字幕生成 | 从台词自动生成 SRT（按标点切分、按字数占比分配时间） | `src/utils/subtitle.ts` |

## 环境要求

- 本机需安装 **ffmpeg / ffprobe**（PATH 中可用），可通过环境变量 `FFMPEG_PATH` / `FFPROBE_PATH` 覆盖二进制路径。
- macOS 注意：homebrew 安装的 ffmpeg 若被系统 AMFI 以 SIGKILL 拦截（运行即 `killed`，exit 137），需重新 adhoc 签名：

```bash
codesign --force --sign - "$(readlink -f /opt/homebrew/bin/ffmpeg)" "$(readlink -f /opt/homebrew/bin/ffprobe)"
find /opt/homebrew/Cellar -name "*.dylib" -type f | xargs -n 20 codesign --force --sign -
```

## API 接口

所有接口均为 `POST`，请求/响应遵循项目统一的 `success/error` 信封格式。

### 1. 单镜成片合成

`POST /api/production/workbench/composeVideo`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectId | number | 是 | 项目 ID |
| scriptId | number | 是 | 剧集 ID |
| trackIds | number[] | 是 | 分镜轨道 ID 列表（每个轨道须已选定视频），≥1 |
| ttsModel | string | 否 | TTS 模型（如 `vendor:model` 格式），不传则不配音 |
| voice | string | 否 | 音色 |

返回 `{ composeIds: number[] }`。每个轨道生成一条 `o_videoCompose` 记录并入队，进度轮询 `getComposeList`。

合成流程：
1. 取轨道选定视频（`o_video` 状态须为「生成成功」）；
2. 取该轨道下分镜的台词（`dialogue` 字段优先，否则从 `videoDesc` 中按 `台词：xxx` 正则提取；「无/无台词/音效/BGM」等忽略）；
3. 可选 TTS 生成配音（失败自动降级为无配音，不中断任务）；
4. 生成 SRT 字幕并用 `subtitles` 滤镜烧录；
5. 输出 h264 + aac + yuv420p 成片（无音频自动补静音轨），存至 `/{projectId}/compose/`。

### 2. 合成列表查询

`POST /api/production/workbench/getComposeList`

参数：`projectId`、`scriptId`，可选 `trackId`。按创建时间倒序返回 `o_videoCompose` 记录（状态：合成中 / 已完成 / 合成失败，失败含 `errorReason`）。

### 3. 整集拼接导出

`POST /api/production/workbench/mergeEpisode`

参数：`projectId`、`scriptId`。同一剧集同时只允许一个进行中的拼接任务。

拼接流程：
1. 按 `o_storyboard.index` 顺序取各轨道的视频片段——**最新已完成的合成成片优先**，无合成则回退到轨道选定的原始视频；
2. 以首段分辨率为基准，逐段归一化（scale + pad + setsar + fps30，缺音频补静音）；
3. concat demuxer 无损拼接，输出至 `/{projectId}/merge/`，并写回总时长 `duration`（秒）。

### 4. 拼接列表查询

`POST /api/production/workbench/getMergeList`

参数：`projectId`、`scriptId`。倒序返回 `o_episodeMerge` 记录（状态：拼接中 / 已完成 / 拼接失败）。

### 5. 宫格分镜图生成

`POST /api/production/storyboard/generateGridImage`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| projectId | number | 是 | 项目 ID |
| scriptId | number | 是 | 剧集 ID |
| storyboardIds | number[] | 是 | 目标分镜 ID（按序对应宫格单元），数量 ≤ rows×cols |
| model | string | 是 | 图像模型（`vendor:model`，vendor 前缀用于队列限流） |
| prompt | string | 是 | 宫格图提示词（应描述各格内容） |
| rows / cols | number | 是 | 宫格行/列数（1–4） |
| resolution | "1K"\|"2K"\|"4K" | 否 | 默认 2K |
| aspectRatio | string | 否 | 默认 16:9 |

流程：目标分镜置「生成中」→ 模型生成整张宫格图（存 `/{projectId}/assets/{scriptId}/grid_*.jpg`）→ sharp 按行列切分 → 按 `storyboardIds` 顺序写回各分镜 `filePath` 并置「已完成」。失败时仅回滚仍处于「生成中」的分镜。

### 6. 分镜结构化信息更新

`POST /api/production/storyboard/updateStoryboardInfo`

参数：`storyboardId`（必填），以及可选的 `dialogue`（台词）、`soundEffect`（音效）、`shotType`（景别）、`cameraMovement`（运镜），至少传一个。

## 数据库变更

由 `initDB` 自动建表 / `fixDB` 自动补列，老库无需手动迁移。

### `o_storyboard` 新增列

| 列 | 类型 | 说明 |
|----|------|------|
| dialogue | text | 台词（合成字幕/TTS 的首选来源） |
| soundEffect | text | 音效描述 |
| shotType | text | 景别 |
| cameraMovement | text | 运镜 |

### 新表 `o_videoCompose`（单镜合成记录）

`id, projectId, scriptId, trackId, videoId, state, filePath, audioPath, subtitlePath, dialogue, errorReason, createTime`，索引 `[scriptId, trackId]`。

### 新表 `o_episodeMerge`（整集拼接记录）

`id, projectId, scriptId, state, filePath, duration(秒), errorReason, createTime`，索引 `[scriptId]`。

### 崩溃恢复

软件异常退出后，`fixDB` 启动时自动将残留的「合成中」/「拼接中」记录矫正为对应失败状态（errorReason=「软件退出导致失败」）。

## 队列扩展

`src/utils/genQueue.ts` 的 `QueueKind` 新增三种任务类型：

| kind | vendorId | handler |
|------|----------|---------|
| composeVideo | `ffmpeg` | `handleComposeVideo` |
| mergeEpisode | `ffmpeg` | `handleMergeEpisode` |
| gridImage | 模型 vendor 前缀 | `handleGridImage` |

ffmpeg 任务以 `ffmpeg` 作为虚拟 vendor 参与并发限流（`o_setting.vendorConcurrency`），与 AI 生成任务互不抢占。Handler 注册入口：`registerComposeHandlers()`（在 `queueHandlers.ts` 中统一调用）。

## 工具模块

| 模块 | 导出 | 说明 |
|------|------|------|
| `src/utils/ffmpegTool.ts` | `checkFfmpegAvailable` / `probeDuration` / `probeVideoInfo` / `composeShot` / `normalizeSegment` / `concatSegments` | execFile 直调 ffmpeg，报错仅保留 stderr 末 5 行 |
| `src/utils/subtitle.ts` | `extractDialogue` / `isIgnorableDialogue` / `buildSrt` | 台词提取与 SRT 生成（≤20 字/行，约 4 字/秒，受总时长约束） |
| `src/utils/gridImage.ts` | `splitGridImage` | sharp 切割宫格图（jpeg q92，单元格 <16px 报错） |
| `src/utils/composeHandlers.ts` | `registerComposeHandlers` 及三个 payload 类型 | 三个队列 handler 的实现 |
| `src/utils/oss.ts` | `getAbsolutePath`（新增） | 将 oss 相对路径安全解析为绝对路径 |
