# 音频节点

将音频素材放到画布中试听，并提供给支持音频参考的下游节点。

## 输入与输出

- 导入本地音频文件，单个文件不能为空且不超过 100 MB。
- 输出当前音频素材，可连接支持音频输入的节点。

## 使用方法

1. 点击上传按钮，选择音频文件。
2. 上传完成后，使用节点内的播放器试听、暂停或调整播放进度。
3. 将音频输出连接到需要该素材的节点。
4. 需要换素材时，将鼠标移到节点上，点击“替换音频”。
5. 在“更多 → 音频剪辑”中选择“拼接音频”，可将多条音频按顺序连起来。选择“拆分音频”，在波形上点击可添加切点，再点分界线可移除切点。每段都能单独试听，确认后各生成一个音频节点。要保留同一条录音中的几个片段，点击工具栏的“剪辑音频”。
6. 在“更多 → 人声与字幕”中可以替换一段对白、缩短说话停顿或将语音转成字幕。“分离人声与伴奏”会生成两条 WAV 音轨，缺少模型时会打开安装窗口。该工具使用 Demucs 和模型发布者提供的 [demucs-web](https://github.com/timcsy/demucs-web)。
7. 录音有持续底噪时，在“更多 → 降噪”中选择“减轻背景噪声”。听见低沉的嗡声或尖细的嘶声时，选择“减轻嗡嗡声和嘶嘶声”。对白听不清时可以试试“让人声更清楚”。
8. 在“更多 → 音量与配乐”中可以统一整段音量、让声音淡入淡出，或在说话时压低配乐。“更多 → 变声与音效”可以调节低中高音、升降调或添加空间回响。点击“试听效果”可先听最多 8 秒。确认后会在新节点中处理整段音频，节点上可查看进度或取消。

<details>
<summary>demucs-web 频谱处理组件许可</summary>

MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

</details>
