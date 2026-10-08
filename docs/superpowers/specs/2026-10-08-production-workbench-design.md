# 生产工作台设计

## 目标

在 Toonflow 工作区内提供一个生产控制台，让用户管理生产镜头、启动媒体生成、查看任务状态、重试失败任务，并提交异步成片导出。

## 范围

本阶段只实现生产控制台和现有生产 API 的前端接入，不实现复杂时间线编辑器、字幕编辑器、音频混音器或新的媒体 Provider。

## 用户流程

1. 用户打开工作区的“生产”面板。
2. 面板读取当前工作区的生产清单。
3. 用户查看镜头顺序、标题、提示词、模型和状态。
4. 用户选择一个或多个镜头，提交媒体生成任务。
5. 面板轮询任务状态，并通过同步接口回写镜头状态。
6. 失败镜头显示错误原因，用户可以重试。
7. 用户选择已生成的视频片段提交成片导出。
8. 面板显示导出进度、成功路径或失败原因，并支持取消。

## 页面结构

- 面板标题区：当前工作区名称、刷新、同步状态。
- 镜头工具栏：全选、批量生成、同步状态。
- 镜头表格：顺序、标题、提示词摘要、模型、状态、输出、错误。
- 镜头详情区：编辑标题、提示词、模型、时长和输出目录。
- 导出区：输出路径、选中片段顺序、开始导出、进度和取消。

## 前端状态

生产面板维护以下状态：

- `manifest`：当前生产清单
- `selectedShotIds`：当前选中的镜头
- `mediaTasks`：镜头任务 ID 到任务状态的映射
- `exportTask`：当前导出任务
- `loading`、`saving`、`generating`、`exporting`：操作状态
- `error`：面板级错误

页面刷新后重新读取生产清单和任务列表，不依赖内存状态。

## API 使用

- `GET /api/production/shots/get`
- `PUT /api/production/shots/save`
- `PATCH /api/production/shots/update`
- `POST /api/production/shots/generate`
- `POST /api/production/shots/sync`
- `GET /api/ai/media/taskList`
- `GET /api/ai/media/taskStatus`
- `POST /api/ai/media/taskCancel`
- `POST /api/production/export`
- `GET /api/production/exportStatus`
- `POST /api/production/exportCancel`

所有请求使用当前工作区目录，并沿用现有工作区请求头和错误格式。

## 状态映射

| 媒体任务 | 镜头状态 |
| --- | --- |
| `queued`、`running` | `generating` |
| `completed` | `review` |
| `failed` | `needsRedo` |
| `cancelled` | `draft` |

## 错误处理

- 请求失败显示面板级错误，不清空已加载的清单。
- 单个镜头任务失败只影响该镜头，保留错误原因和重试入口。
- 导出失败保留输入片段和失败原因，不删除已完成的镜头输出。
- 工作区切换或组件卸载时停止轮询并取消前端请求。

## 兼容性

- 现有画布、图片节点、视频节点和文档面板保持不变。
- 新面板只使用生产 API，不直接读写工作区文件。
- 自有组件文件和模板标签遵循仓库小驼峰命名规范。

## 验收标准

- 能在工作区面板读取并展示生产清单。
- 能编辑并保存镜头信息。
- 能批量提交镜头生成任务并显示任务状态。
- 失败任务可从面板重试。
- 导出任务能显示排队、运行、完成、失败和取消状态。
- 页面刷新后可恢复镜头和任务状态。
- 前端类型检查和构建通过。
