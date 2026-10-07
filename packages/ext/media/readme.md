# 音视频预览

在文档页打开 MP4、MP3、WAV、PCM 和 Opus，后缀不区分大小写。提供播放、暂停、进度和音量控件，视频支持全屏；隐藏标签时暂停播放。

MP4、MP3、WAV 和 Ogg 容器的 Opus 使用客户端原生解码能力。不支持的编码或损坏文件会显示播放失败提示。

原始 PCM 默认使用 24000 Hz、单声道、16 位小端整数，可在预览顶部选择实际采样率、单/双声道、8 位无符号或 16/24/32 位整数、32 位浮点及大小端。多声道数据须交错排列，数据必须包含完整采样帧。有符号和浮点格式转换为 16 位 WAV 供播放，非有限浮点值按静音处理。预览只在内存中转换，不改写原文件。

```sh
bun run --cwd packages/ext/media typecheck
bun run --cwd packages/ext/media build --mode development
```

开发构建同步到 `data/ext/ext-media.umd.js`；生产构建输出到 `build/ext/ext-media.umd.js`，随现有扩展打包流程发布。
