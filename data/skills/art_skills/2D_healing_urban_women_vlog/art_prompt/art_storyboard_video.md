---
name: healing_urban_women_storyboard_video
description: 治愈系都市女性生活半写实二维动画视频提示词视觉约束
metaData: art_prompt
---

# 视频提示词 · 治愈系都市女性生活视觉约束

生成视频提示词时，必须继承角色、场景、道具与分镜参考图中的固定信息。视频模型只负责让明确的动作发生，不得自行增加恋爱人物、改写关系、换装、换脸、生成字幕或重做场景。

## 一、固定标签

| 模式 | 必加风格标签 |
|---|---|
| 通用多参考模式（英文） | `healing contemporary Chinese urban women's slice-of-life, semi-realistic 2D digital illustration animation, soft webtoon sensibility, restrained cel shading, clean delicate contour lines, lived-in environments, creamy warm interiors and deep navy nights, subtle facial acting, native vertical 3:4 composition, timestamp diary vlog rhythm, relationships expressed through shared actions` |
| 通用首尾帧模式（英文） | `semi-realistic 2D illustrated slice-of-life animation, consistent Chinese female character identity, delicate line art, restrained cel shading, natural body mechanics and object contact, lived-in contemporary interiors, creamy warm practical lighting against deep navy night, native vertical 3:4 framing` |
| 中文视频模型 | `治愈系当代中国都市女性生活，半写实二维数字插画动画，柔和网漫质感，克制赛璐璐明暗，干净细致轮廓线，真实生活空间，奶油暖光与深蓝夜色，细腻克制表演，原生3:4竖幅，时间戳日记式Vlog节奏，共同行动表达关系` |

## 二、视频硬约束

- 母版原生 3:4 竖幅；若平台要求 9:16，只做安全延展或重构，禁止生成 9:16 黑边。
- 完整成片参考为 68—89 秒，默认约 80 秒，由 20—27 个节拍组成。
- 单个视频生成镜头通常 3—4 秒；只承载一个主动作与最多一个清楚反应。
- 保持人物身份、年龄层、脸部结构、肤色、发型色、身高关系和当前服装连续。
- 保持场景结构、门窗、家具、道路、台阶、光源方向和道具位置连续。
- 动作必须包含起始姿态、轨迹、接触、结果和身体响应。
- 表情使用眼神、嘴角、呼吸、肩背和动作停顿，禁止夸张动漫脸。
- 关系戏优先拍共同行动、并肩、递物、等待、目送与报平安。
- 图像/视频生成阶段不生成字幕；时间戳与白字黑描边日记文案由后期添加。

## 三、标准镜头句法

```text
{时长与画幅} + {场景/时段/天气} + {景别、机位、镜头高度} +
{固定角色身份与当前造型} + {起始站位} +
{单一主动作：发力部位、轨迹、接触、结果、用时} +
{克制微表情与身体响应} + {道具状态变化} +
{明确主光、辅光与环境动态} + {单一运镜} +
{承接上一镜与交给下一镜的连续性} + {负向约束}
```

## 四、通用视频提示词模板

```text
时长{3—4秒}，原生3:4竖幅，半写实二维数字插画动画。
场景：{地点、时段、天气}；固定结构为{门窗/家具/道路/台阶}。
角色：{姓名、年龄层、固定脸部与发型、当前服装}，保持参考图身份完全一致。
起始：{角色与关键道具的水平位置、纵深位置、朝向和状态}。
动作：{哪个部位}从{起点}沿{轨迹}移动，在{时间点}接触{对象}并形成{结果}；{衣物、发丝、呼吸、重心}自然响应。
表演：{眼神、嘴角、肩背、停顿}，细腻克制。
光线：主光来自{来源、方向、冷暖}，辅光来自{来源}；同场不改变。
环境动态：仅{风/热/水/车/人物动作}造成{具体动态}。
运镜：{固定/慢推/缓拉/轻跟拍/小幅摇镜}，{起止与用时}。
连续性：保持{脸、发型、服装、站位、道具、光源、时间}，结束于{下一镜可承接姿态}。
禁止新增人物、恋爱对象、霸总或暧昧；禁止同脸、年龄漂移、手指错误、额外肢体、道具穿模、重影、双重身体、过度溶解、错误文字、字幕、Logo、水印、UI和9:16黑边。
```

## 五、六类故事的动作重点

| 故事 | 视频动作重点 | 不应出现 |
|---|---|---|
| 独居自愈 | 进门、换鞋、备菜、烹饪、洗漱、翻书、关灯 | 被动等待恋人、豪宅炫耀 |
| 通勤工作 | 化妆工具接触、穿搭、乘梯、落座、工作 | 霸总办公室、过量产品特写 |
| 独自挑战 | 检查装备、上台阶、喝水、继续、迎日出 | 男性拯救、危险炫技 |
| 女性友谊 | 互拍、共享食物、试衣、按摩、送别、报平安 | 烛光约会、情侣牵手、暧昧凝视 |
| 外婆与旧时光 | 穿老街、择菜、做饭、看旧物、门口目送 | 疾病、死亡、葬礼、贫困奇观 |
| 父母与双向照料 | 搬行李、拿食物、做面、挑衣、女儿买单、看电视 | 催婚冲突、父亲霸总化 |

## 六、光影运动

- 公寓夜晚：窗外深蓝保持稳定，台灯/厨房灯只因开关动作变化。
- 山路夜间：头灯光束与头部方向同步，手电光束与手腕方向同步。
- 日出：冷蓝 → 紫灰 → 橙粉 → 浅金，变化缓慢且方向固定。
- 老宅：窗外绿反光、室内低暖光和旧木反射保持层次，不套整片黄滤镜。
- 车内/停车场：车灯、顶灯和仪表光有明确来源，不使用赛博霓虹。

## 七、运镜约束

- 固定：做饭、化妆、共同行动和家庭多人同框。
- 慢推：发现小满足、递物、等待、抵达和克制情绪。
- 缓拉：从人物回到共享空间，或以门口/客厅关系收束。
- 轻跟拍：通勤、逛街、老街行走、山路前进。
- 小幅摇镜：跟随拿取、递交或视线转移。
- 禁止无目的环绕、急推急拉、旋转、无人机俯冲和一镜叠加多种运镜。

## 八、转场与重影

- 同场动作/反应使用硬切或动作匹配。
- 只有明确时间或地点变化时允许短溶解，单次通常 6—12 帧感受。
- 同一段不连续使用多次溶解。
- 任何溶解都不得留下重影、双重身体、额外脸、幽灵手或上一场景残留。

## 九、声音提示

- 环境声与动作声具体写入：钥匙、鞋、切菜、沸水、餐具、键盘、脚步、风、车门、树叶、电视低声。
- 每镜 1—2 个核心声音，不堆砌。
- 配乐轻柔，给关键动作和关系停顿留空间。
- 输出采用连续立体声；完整成片建议综合响度约 `-16 LUFS`、真峰值不高于 `-1 dBTP`，避免继承参考视频的削波风险。

## 十、负向约束

英文模式末尾追加：

`no photorealism, no 3D plastic render, no flat chibi cartoon, no oversized anime eyes, no identity drift, no same-face women, no age drift, no random outfit change, no extra fingers, no malformed hands, no extra limbs, no object penetration, no duplicated body, no ghosting, no excessive dissolve, no romantic reinterpretation, no domineering CEO trope, no ambiguous couple staging, no illness or death melodrama, no showroom-perfect home, no incorrect signage, no brand logo, no subtitles, no watermark, no UI text, no embedded 9:16 black bars`

中文模式明确：

`禁止真人照片、3D塑料感、纯平涂Q版、大眼动漫脸、身份漂移、女性同脸、年龄漂移、随机换装、手指错误、额外肢体、道具穿模、重影、双重身体、过度溶解、恋爱误读、霸总、暧昧、疾病死亡苦情、样板间、错误招牌、品牌Logo、字幕、水印、UI文字和内嵌9:16黑边。`
