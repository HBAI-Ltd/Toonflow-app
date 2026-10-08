# Draw Things MiniMax H3 本地视频 Provider 设计

## 目标

让 Toonflow 的现有视频生成节点可以调用本机 Draw Things Local API，使用用户本地注册的 MiniMax H3 视频模型生成视频，并把结果作为工作区视频资源落盘。接入沿用 Toonflow 的媒体 Provider 协议，不改变已有 TF-router 或视频节点行为。

## 范围

- 新增一个可安装的本地 Draw Things 媒体 Provider。
- 支持文本生成视频和模型已声明的可选首帧输入。
- 支持时长、分辨率、比例和生成音频等通用参数的映射；帧率使用固定 Provider 默认值。
- 将 Draw Things 返回的已编码视频 URL、data URL 或二进制转换为 Provider 可返回的 `MediaAsset[]`。
- 对连接失败、模型未注册和空响应给出清晰错误。

不在本次范围内：修改 Draw Things、修改 Toonflow 视频节点 UI、实现远程 Draw Things、增加新的媒体存储协议或引入新的测试框架。

## 方案

Provider 使用 Draw Things 的本地 HTTP API，默认地址为 `http://127.0.0.1:7888`。MVP 只实现经本机实测确认的请求和响应契约：请求路径、JSON 字段、完成状态和视频字段必须先通过一次真实 Draw Things 请求记录锁定，再写入 Provider。没有该样例时，Provider 不把 `images` 帧数组或任务 ID 当作成功结果。模型名以 Provider 模型 ID 表示，默认值只作为占位，不能视为已验证名称。

Provider 将 Toonflow 的 base64 参考媒体转换为 data URL，仅映射模型元数据已声明的文本和可选首帧模式；尾帧、视频和音频引用在 MVP 中明确拒绝。请求使用 `AbortSignal`，超时和用户取消都会终止 HTTP 请求。

响应解析按以下顺序处理：

1. 真实样例中约定的视频字段中的 HTTP URL、data URL、base64 或二进制结果。
2. 如果真实接口是异步任务，Provider 按样例中的任务创建、状态查询和完成字段轮询，直到得到已编码视频。
3. `images` 帧序列、缺少完成状态的视频任务 ID 和其他未知响应形态均视为空结果并抛出错误；帧序列转 MP4 不在本次范围内。

## 数据流

```text
视频节点
  -> apps/server 媒体生成入口
  -> 本地 Draw Things Provider
  -> POST http://127.0.0.1:7888/<经真实样例确认的路径>
  -> 解析已编码视频结果
  -> MediaAsset[]
  -> Toonflow 工作区写入 assets/generated/*.mp4
```

Provider 不负责写工作区文件，保持现有 `generateMedia` 的统一校验、MIME 检测、命名和回滚行为。

## 配置与模型

Provider 配置项：

- `apiUrl` 固定为 `http://127.0.0.1:7888`，除非实际 Provider 设置表单能够保存该字段；MVP 不要求新增设置 UI。
- `model` 使用 Provider 模型 ID，必须由用户改成 Draw Things 实际注册的模型文件名；默认值只作为占位。
- `timeoutSeconds` 固定为 1800 秒，并由 AbortSignal 控制。

Provider 模型列表只声明一个可编辑 ID 的视频模型，允许文本和可选首帧模式；时长和分辨率范围以真实模型注册信息为准，在未确认前不伪造能力列表。用户通过媒体模型设置编辑模型 ID，以匹配本机注册表。

## 错误处理

- 连接拒绝：提示启动 Draw Things 并开启 Local API Server。
- HTTP 4xx/5xx：提取响应中的 `detail`、`error` 或 `message`；Provider 校验 `apiUrl` 只允许无凭据的 HTTP(S) 地址，并对错误文本中的 query 参数做脱敏。
- 模型白名单错误：保留 Draw Things 返回的模型名提示，指导用户修改 Provider 配置。
- 响应为空、任务未完成或缺少已编码视频结果：返回“未返回视频结果”。
- 所有请求遵循 AbortSignal，取消时不留下工作区文件。

## 验证

- TypeScript 类型检查和 Provider 源码加载校验。
- 以用户提供的真实 Draw Things 请求/响应样例锁定契约后，用最小文本视频请求验证 HTTP、模型参数、轮询和视频解析；接口不可用时验证清晰错误。
- 使用现有 Provider 调试入口或一次性命令验证 URL、data URL、base64、空响应和取消，不新增测试文件或测试框架。
- 运行现有 server 构建。
