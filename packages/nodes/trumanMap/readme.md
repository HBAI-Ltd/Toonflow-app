# 白模预演TrumanMap

在画布中搭建三维白模场景：用 AI、整套影视景或素材库布景，安排人物走位与对白，自动分镜运镜，并导出预演小样、镜头表和分镜图，适合拍摄前的白模预演。

## 输入与输出

- 输入支持剧本或说明文字；连接后 AI 和按对白分镜以它为准，场景为空时可“按剧本一键预演”。
- 右上角“导出”可勾选导出预演小样（MP4，720p 或 1080p）、镜头表（含每镜截图的网页，可打印或另存 PDF）和分镜到画布。
- 分镜到画布会在节点右侧逐镜创建图片节点，可继续连接图生图、图生视频；需要启用图片节点插件。

## 使用方法

1. 点击节点封面打开场景编辑器。
2. 搭景：空场景可选一键布景中的常见影视景、粘贴剧本，或在对话框描述要求让 AI 搭建；也可从素材库拖入建筑、家具和人物，用画笔铺地形、地貌、道路和河流。
3. 演绎：拖动人物脚底的蓝圈画出走位路线，点击锚点调整到达时间、速度和停靠；也可让 AI 安排表演和动作。
4. 分镜：在时间轴点击“分镜”自动排机位并剪辑，或按对白分镜；在取景窗中调整景别、焦段和运镜。
5. 光照：在“世界 → 光照”一键切换日戏、黄昏、夜戏、阴天或雨夜，再按需细调。
6. 按 Ctrl+S 保存，关闭场景时自动保存；完成后从右上角导出。

## 操作

- 滚轮朝鼠标所指位置推近或拉远；按住右键环视，WASD 飞行，此时滚轮调整移动速度。
- 按住物体可直接拖动；框选多件后可整批拖动，滚轮或 R 旋转，Shift 抬高，Ctrl+D 复制。
- 场景编辑支持撤销和重做。

## AI

- 对话使用 Toonflow Agent 中配置的文本模型，模型需要支持工具调用；每次最多附 4 张参考图。
- 新建造型时使用内置的“白模预演TrumanMap”建模工具；首次使用需联网下载建模引擎，服务端需要 Node.js 22.2 及以上。

场景保存在工作区的 `assets/<节点ID>/scene.json`，生成的模型也保存在该目录；插件不会自动删除作品或缓存。

## 许可

本地素材为原创程序化几何。AI 部分派生自 Holodeck（MIT），其 examples 数据为 CC0，范围见 https://github.com/instruktlabs/holodeck/blob/96eb3121e62f15aa7e761d75cbbfa3efcdbafda2/LICENSING.md 。

人形动作来自 Quaternius 的 Universal Animation Library（https://quaternius.com/packs/universalanimationlibrary.html 及 https://quaternius.com/packs/universalanimationlibrary2.html ），采用 CC0 1.0 Universal，已重定向到插件人物骨架。

以下 MIT 条款适用于 Holodeck 派生内容和加载解压器 fzstd 0.1.1：

MIT License

Holodeck: Copyright (c) 2026 Matthew Kissinger
fzstd: Copyright (c) 2020 Arjun Barrett

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

SunCalc 2.1.1（BSD-2-Clause），来源 https://github.com/mourner/suncalc/tree/v2.1.1 。

Copyright (c) 2026, Volodymyr Agafonkin
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this list of
      conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice, this list
      of conditions and the following disclaimer in the documentation and/or other materials
      provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
