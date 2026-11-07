# FFmpeg 媒体处理

为 Agent 提供 `ffmpeg`、`ffprobe` 和按需查看视频的 `readVideo`，复用插件市场配置的执行程序及节点已有的调用桥接。

## 调用方式

`readVideo` 按需返回带时间戳的抽样画面，完整视频不会进入模型请求：

```json
{ "path": "assets/input.mp4", "start": 10, "end": 20, "frames": 8, "transcribe": true }
```

`start` 默认为 0，省略 `end` 时读取到视频结尾；`frames` 默认为 8，最多 12 张，设为 1 时查看 `start` 附近的画面。需要声音时设置 `transcribe: true`，单次最多转写 120 秒，可用 `language` 指定语言；转写依赖已连接画布及浏览器语音识别支持。抽样画面不等于完整连续视频，分析后保留来源和时间戳摘要，追问时重新读取相关区间。工具只清理本次抽帧和转写产生的临时文件，原视频保留。

`ffprobe` 接收文件路径和可选的原生参数：

```json
{ "path": "assets/input.mp4", "options": ["-count_frames"] }
```

`ffmpeg` 的 `steps` 按顺序调用 fluent 方法，`operation` 指定最后执行的方法，省略时使用 `run()`。例如输出图片序列：

```json
{
  "steps": [
    { "method": "input", "args": ["assets/input.mp4"] },
    { "method": "fps", "args": [1] },
    { "method": "output", "args": ["assets/frame%03d.png"] }
  ]
}
```

也可使用 `operation: { "method": "save", "args": ["assets/output.mp4"] }`，或者原生的 `screenshots`、`concat` 等操作。查询可用编码器、编解码器、格式、滤镜时，省略 `steps`，将 `operation.method` 设为 `availableEncoders`、`availableCodecs`、`availableFormats` 或 `availableFilters`。

`options` 对应宿主支持的 fluent 构造选项：`source`、`cwd`、`niceness`、`priority`、`stdoutLines`、`timeout`。`steps` 支持宿主已有的全部配置方法和别名；`args` 中的 JSON 值保持原样，`undefinedArgs` 可指定要传入 `undefined` 的位置。

## 原生能力与执行

以下规则适用于原生 `ffmpeg`、`ffprobe` 调用。

- 不另设 FFmpeg 参数白名单，不拆分或重写 `inputOptions`、`outputOptions`、滤镜参数。
- 不限制为单文件输出，图片序列、HLS/DASH 分片、多输入多输出均按原生方式处理。
- 不重定向到临时文件，不强制设置执行时长。输出目录按原生要求准备，已有文件的覆盖遵循 FFmpeg 原生规则；未要求覆盖时应使用新文件名。
- 保留宿主已有的显式工作区路径检查、缺少 FFmpeg 时的安装提示、错误传播和转换取消。取消或失败可能留下原生处理产生的部分文件，工具不自动删除素材。

此工具传递 JSON 调用数据，不接收 JavaScript、回调或 Node 流；可执行文件由插件市场配置。宿主只检查显式文件入口，原始参数、滤镜和媒体清单中的间接访问不是文件系统沙箱。FFprobe 和能力查询的原生接口不暴露子进程，取消会停止等待，底层查询自行退出。
