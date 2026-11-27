# MiniMax H3 提示词结构

MiniMax H3 视频提示词的格式与用法。H3 把提示词当一条时间轴按顺序读，音画同遍生成。情绪一律写成部位、顺序、程度，不写抽象情绪词。

**本文是"一律中文"的例外**：键名、镜头标记、标签、词表、固定句式是模型的固定语法，必须原样用英文，不翻译、不改大小写、不造新词。键值里的叙述用中文。

## 一、什么时候选 H3

两套格式的差别在结构载体：H3 是"键 + 一条连续时间线"，Seedance 是"块 + 分层位置"。一条片只用一套。

| 需要 | 选 |
|---|---|
| 音画同遍、口型对准、多语种对白 | H3 |
| 逐个参考写保留程度（完全保留 / 部分保留 / 只迁移动作） | H3 六键 |
| 单条时长或参考数超出 H3 上限 | Seedance |
| 空间地理、照明合同、逐材质物理、成组锁定写得很细 | Seedance |

中途换格式必然丢东西，先认损再转：

| 方向 | 丢什么 | 补救 |
|---|---|---|
| H3 → Seedance | 四级保留词没有等价物 | 在逐张职责句里写"只提供 X，其余由提示词给出" |
| H3 → Seedance | 说话人绑定、收尾动作、锁嘴句 | 落进 Seedance 的台词条件块 |
| Seedance → H3 | 正向锁定、逐材质物理、照明合同、空间地理 | 压成散文和少量否定，精度必损 |
| Seedance → H3 | 六种剪切类型、共用参考编号 | 改成 `[Shot N] At MM:SS.mmm`；改用 Subject / Picture / Video / Audio 四套标签 |

## 二、容量（有时效）

照这个值做；用户或平台界面给了不同的数，按新的算。

| 项 | 出发值 |
|---|---|
| 时长 | 4–15 整数秒 |
| 分辨率 | 768P 或 2K |
| 帧率 | 24fps |
| 音频 | 与画面同遍生成；支持中、英、法、德、意、日、韩、葡、俄、西、阿拉伯语 |
| 画幅 | adaptive、21:9、16:9、4:3、1:1、3:4、9:16；纯文生必须给具体比例 |
| 参考上限 | 9 图 / 3 视频 / 3 音频，单次合计不超过 12 个文件；音频不能是唯一参考 |
| 模式互斥 | 单图锚定与"可复用主体"互斥；首尾双帧锚定只用两张图 |
| 提示词上限 | 7000 字符 |
| 参数面 | 没有 seed、negative prompt、guidance；否定写成散文（见九）；节点参数不进正文 |

## 三、键结构

键顺序固定。三键和六键的区别不是详略，是**有没有参考关系**。

**三键**（没有跨镜复用的主体）：

```
integrated_multimodal_description: {逐镜时间线；说话人 (S1) 与 <d>[语言] 台词</d>；镜头同步声也写在这里}
overall_soundscape: {环境声、动作声、非语言人声；音频参考关系}
non_diegetic_music: {乐器、节奏、动态变化；或 N/A}
```

**六键**（命中下面任一条就升）：同一角色、场景或道具要跨镜复用；需要动作迁移；需要音频复制或参考；需要在 summary 里声明任务类型；需要逐参考写保留程度。

```
subject_definitions:
<Subject 1> {内容}，来自 <Picture 1>，保留 {具体特征}。
<Video 1> 承担 {编辑 / 延续 / 结构角色}（如适用）。
<Audio 1> 为 <Subject 1> (S1) 提供 copy 或 reference（如适用）。

summary:
{任务类型标签 + 主要参考关系，一段话}

retention_analysis:
{每个参考的保留方式}

detailed_description:
{逐镜按播放顺序写，参考标签在生效处内联}

overall_soundscape:
{环境声、动作声、非语言人声；音频参考关系}

non_diegetic_music:
{配乐与参考音频的关系；或 N/A}
```

六个键全部保留；用不到的 `<Video N>` / `<Audio N>` 行删掉；无配乐写 `N/A`。summary 和 retention_analysis 不当画面描述写，否则正文变说明书还挤占字数。

## 四、镜头标记

| 位置 | 写法 |
|---|---|
| 第一镜 | `[Shot 1]`，不带时间戳 |
| 后续每镜 | `[Shot N] At MM:SS.mmm` |
| 时间戳 | 严格递增，不超过总时长 |

时间戳缺失或不递增，会切成幻灯片。距离变化优先用运镜表达，不硬切成新镜。

## 五、内联标签

| 标签 | 语义 |
|---|---|
| `<Subject N>` | 从资产提取的可复用内容：人、物、场景、服装、道具、界面、风格、动作、效果 |
| `<Picture N>` | 图片本身作为首帧、尾帧、关键帧、构图锚点或分镜方案 |
| `<Video N>` | 源视频被编辑 / 延续，或提供镜头、节奏、计时结构，或承担动作迁移 |
| `<Audio N>` | 被使用的音频：复制，或参考音色、音乐、节拍 |

- 图片只用来定义角色、产品、场景、服装时，写在 `<Subject N>` 的定义里，不单列 `<Picture N>`；图片本身锚定某帧时才单列。
- 一个 `<Subject N>` 可同时引用图、视频、音频。
- 固定句式里写 `Image 1` / `Video 1` 裸名；其余位置写 `<Picture N>` / `<Video N>`。

## 六、对白与口型

| 形式 | 写法 |
|---|---|
| 单人对白 | `(S1)：<d>[语言] {原文}</d>` |
| 多人同说 | `(S1,S2)：<d>[语言] {原文}</d>` |
| 画外音 | 声明 off-screen，画内可见角色嘴唇闭合 |
| 跨镜续说 | `<scenetrans>` |
| 中途截断 | `<cutoff>` |
| 无对白 | 显式写"无台词，嘴唇全程闭合" |
| 屏幕文字 | 英文双引号引原文：`写着 "{原文}"` |

说话人编号按发声顺序 `(S1)`、`(S2)`，同一人后续镜头复用同一编号；身份、语气、动作写在标签外。

**口型在生成层喂对，不留给后期**：

1. 每镜 `<d>` 里最多一句台词，长句拆镜——长句是口型漂移的第一诱因。
2. 台词后跟一个收尾动作（转头、放下杯子、垂眼），并写嘴唇闭合；否则说完嘴还在动。
3. 对白镜景别在中近景以内，主体太小别赌口型。
4. 声音描述写语气与节奏（低沉地、慢慢地说）；同一角色的音色描述逐镜一字不改。
5. 用音频参考时，剪到目标片段，起止留一点静默，长度与视频匹配。
6. 台词必须进 `<d>`；没进引号，声音会变成画外音、嘴不动。

## 七、固定词表

**任务类型**（summary 用，可用 `+` 组合）：`keyframe completion` / `reference generation` / `video editing` / `video continuation` / `audio reuse` / `audio reference`

**保留词**（retention_analysis 用）：

- 视觉：`fully_preserved`（列出具体不变的特征）/ `partially_preserved`（写明改了哪部分）/ `attribute_transfer` / `weak_reference`（只类别相似）
- 音频：`fully_copy` / `partially_copy` / `reference` / `weak_reference`

**运镜**：

| 类型 | 词 |
|---|---|
| 变焦 | Zoom In / Zoom Out |
| 纵深 | Push In / Pull Out |
| 横移 | Truck Left / Truck Right |
| 升降 | Pedestal Up / Pedestal Down |
| 摇 | Pan Left / Pan Right / Tilt Up / Tilt Down |
| 环绕 | Arc Shot |
| 跟随 | Tracking Shot |
| 主观 | POV |
| 旋转 | Roll Clockwise / Roll Counterclockwise |
| 抖动 | Shake Slightly / Shake Strongly |
| 静止 | Static Shot |

修饰接在运镜词后：幅度 `with small amplitude` / `with large amplitude`，速度 `at slow speed` / `at fast speed`（中等不写）。运镜写成句子，不用括号指令。想锁帧必须写 `Static Shot`。

## 八、固定句式

原样使用，不增删词。对齐句独占一行，写在正文键之前。

```
单图锚定（首帧）：
For the target video, at 0.00 seconds, <Picture 1> from [Shot 1] is fully referenced.

双图锚定（首帧 + 尾帧）：
Picture 1 from [Shot 1] aligns to 0.00 seconds; Picture 2 from the actual final [Shot N] aligns to the exact S.SS-second end time.

单图锚定（仅尾帧）：
<Picture 1> from the actual final [Shot N] aligns to the exact S.SS-second end time.

中途帧锚定：
At {MM:SS.mmm}, the composition aligns to <Picture N>.

动作迁移：
Use Image 1 for the subject's appearance and identity.
Use Video 1 for the body movement only.
The subject from Image 1 performs the same movement as Video 1,
in a plain studio with soft even lighting, full body in frame.
```

无图锚定时没有对齐行，正文从 `integrated_multimodal_description:` 开始。动作迁移的保留声明写进 retention_analysis：`Video 1 的身体动作、节奏与走位被 attribute_transfer 到 <Subject 1>，保留表演时序但不复制画面。`

## 九、否定与参考的能力边界

**没有 negative prompt，散文否定是唯一的负向控制**，写在 detailed_description 末尾或独立一行。必锁三类：

- **台词提到的物品不等于画面物品**：台词说"我记得那把枪"，画面就不该出现枪。
- **不要配乐就显式写"无配乐"**；要配乐就写乐器、节奏、动态，不要同时又写 `N/A`。
- **不该出现的角色或人群单独一条。**

逐条自问：模型最可能多画什么、少画什么、动哪个道具、改哪件衣服。否定写成"不要奇怪的东西"，模型不知道锁什么。

**动作迁移是语义级跟随，不是骨骼级锁定**：迁移句写明 `body movement only`；retention_analysis 用 `attribute_transfer` 并写"不复制画面"；每个动作写谁、做什么、幅度、速度、结束态；旋转或复杂运镜加中途帧锚定；多角色同框每人一句独立动作。只写"参考视频的动作"，外观会一起被搬；保留项写成 `fully_preserved`，整段画面会被复制。

**机位写成空间关系**：机位在哪、朝哪拍、主体面朝哪、背景是什么，四样至少写两样。背景是验证机位的锚点，换机位背景描述要跟着变；正反打两镜方向相反、机位侧成对（甲在右肩后朝乙拍，乙就在左肩后朝甲拍）。只写"过肩拍"会得到随机高度与朝向。

## 十、坏了怎么回查

每个失败对到下面一行，只改那一行的根因。

| 现象 | 根因 | 修法 |
|---|---|---|
| 动作不对、顺序乱 | 没按时间写，一镜多个主变化 | 逐镜逐拍写，每镜一个主变化加结束态 |
| 表情僵硬、像雕像 | 情绪没物理化，非说话角色没给指令 | 补目光、眼睑、嘴角、呼吸、手 |
| 口型乱动、漂移 | 无对白未锁嘴、未绑说话人、长句未拆、台词后无收尾 | 按六节口型六条 |
| 声音变画外音、嘴不动 | 台词没进 `<d>` | 台词进 `<d>` |
| 角色漂移、换装 | 保留项没列具体特征，服装状态未声明 | 补 `<Subject N>` 定义与保留特征；换装就换描述 |
| 镜头乱切、变幻灯片 | 时间戳缺失或不递增 | 时间戳递增，距离变化用运镜 |
| 想锁帧结果在动 | 没写 `Static Shot` | 补 `Static Shot` |
| 音乐不对 | 用抽象词写配乐，或音频键互相矛盾 | 写乐器、节奏、动态，或 `N/A` |
| 背景翻转 | 旋转运镜只给一张背景参考 | 加中途帧锚定 |

终验一句话：逐镜脑补一遍，每一镜都能看到画面、听到声音、知道镜头怎么动。

## 十一、交稿自查

每条提示词交出去之前逐项核。结果在回复里交代，一项一行，每项写依据（比如“参考编号：本条 1–3 连号，定义与正文一致”），拿不准的写“未核”，不写空泛的“全过”，不合成一段话；不粘进提示词正文。

- [ ] 整条提示词全文已经存下：画布上的镜头卡文本节点，或项目目录的工作稿文件；不是只在对话里
- [ ] 一个文件里写几条，每条都是能单独拿去用的全文：不写“同上一条”
- [ ] 描述里没贴画风文字、没重述画风（参考图已经带着风格）；只有这一条完全没有参考图时，才把画风文字放在第一个描述键（三键的 `integrated_multimodal_description`、六键的 `detailed_description`）开头，且与 `AGENTS.md` 的 `## 画风` 一字不差
- [ ] 键名、标签、固定词表照本文写英文，键的顺序没动
- [ ] 否定只以散文出现在描述末尾，正文其余部分是正面状态
- [ ] 逐镜对照开场与第一拍：开场里已经做完的动作，描述里不再做一遍；人物的位置和朝向（脸、躯干、车头）前后一致
- [ ] 只演本条分镜范围里的动作：上一条做完的不再做，下一条的不提前
- [ ] 按相机在哪一侧核一遍：背对相机的人看不到脸，不写脸上的光和表情；上一条在场的人和动物，这一条要么在画里，要么写清去向；一只手同时只拿一样东西
- [ ] 时间戳逐镜递增，各镜加起来等于本条时长；本条时长是整数秒，落在单次范围内
- [ ] 台词全部进 `<d>`，与剧本一字不差；每镜 `<d>` 最多一句；无对白的镜写了嘴唇闭合
- [ ] 每句台词的时间窗够念：字数 ÷ 时间窗秒数不超过 5；逐句算出来写进自查，超了就拆镜或延长
- [ ] `<Subject N>`、`<Picture N>` 从 1 连号，定义与正文一致；还没出图的参考写“待补：{资产名}”，不当成已经绑定
