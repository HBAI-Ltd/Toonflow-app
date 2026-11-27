# 音频生成节点

根据提示词、文本及可选的参考图片或音频生成音频。模型列表来自媒体模型设置，仅显示音频模型。

## 使用方法

1. 选中节点，选择音频模型并输入文本或音频效果描述。
2. 按需连接参考节点。文本数量不限；图片和音频互斥，合计最多连接一个。
3. 打开生成设置，选择中文或英文、采样率及输出格式；具体支持范围由供应商校验。
4. 点击生成，需要中止时点击停止；失败或取消会保留已有输出。
5. 生成后可播放、下载、剪辑音频、调整播放速度或替换音频，与普通音频节点使用相同操作。

生成的音频与普通音频节点共用“更多”菜单。例如，在“更多 → 音频剪辑 → 拆分音频”中可在波形上设置切点，每段生成一个 WAV 节点。在“更多 → 人声与字幕 → 语音转字幕”中可选择对白语言并生成字幕。处理时需启用音频节点插件。裸 PCM 需先填写采样率、声道数和采样格式。

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
