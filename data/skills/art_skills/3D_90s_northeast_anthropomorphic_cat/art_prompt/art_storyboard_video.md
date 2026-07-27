# 视频提示词 · 东北90年代拟人猫电影动画视觉约束

生成视频提示词时，必须注入下列固定视觉语义，并保持角色、场景、道具与参考图连续。

## 一、固定标签

| 模式 | 必加风格标签 |
|---|---|
| 通用多参考模式（英文） | `semi-realistic cinematic anthropomorphic cat animation, authentic feline facial anatomy and fur, natural upright body mechanics, late-1980s Northeast China state-owned factory residential compound, lived-in material wear, restrained cinematic lighting, warm tungsten interiors versus cold blue exteriors, vertical 9:16` |
| 通用首尾帧模式（英文） | `semi-realistic cinematic anthropomorphic cat animation, consistent feline character identity, natural paw interaction and tail physics, late-1980s Northeast China, lived-in red-brick factory compound, restrained depth of field, warm interior and cold exterior contrast, vertical 9:16` |
| Seedance 2.0（中文） | `轻写实电影级拟人猫动画，真实猫毛与猫脸结构，自然直立拟人动作，1988—1990年东北国企家属院，生活使用痕迹，室内暖黄与室外冷蓝对比，克制电影光影，9:16竖屏` |

## 二、视频硬约束

- 每个视频约 60 秒；“90年代”仅是时代背景，不得理解为 90 秒时长。
- 9:16 竖屏原生构图，禁止横屏裁切感。
- 情绪比例：50% 家庭和伙伴喜剧、30% 年代回忆、20% 温情与成长。
- 角色毛色、脸部标记、服装层、身高关系和随身物跨镜头一致。
- 猫爪抓握、走路、坐下、骑车、写字、做饭等动作符合重力和接触关系。
- 表情克制，通过眼睑、耳位、胡须、嘴角和身体重心表达，禁止夸张动画鬼脸。
- 环境动态只来自风、热、水、车辆和人物动作；蒸汽、雪、窗帘和衣物有明确来源。
- 木材、棉布、铁器、搪瓷、水磨石、冰雪与蒸汽保持真实生活使用痕迹。
- 结尾以抓包、误会、互相甩锅、藏物露馅或奶奶轻声补刀等生活化笑点收尾，不强行煽情。

## 三、负向约束

英文模式末尾追加：

`no human with cat ears, no human face, no four-legged pet cat, no chibi, no oversized anime eyes, no exaggerated cartoon grimace, no human hands, no character identity drift, no modern smartphone, no LCD television, no modern puffer jacket, no modern sneakers, no takeout box, no modern packaging, no renovated interior, no neon cyberpunk, no candy colors, no large pure-white surfaces, no staged retro studio, no subtitles, no captions, no watermark, no UI text`

中文模式通过正向约束明确：

`禁止真人猫耳、四足宠物猫、Q版萌宠、人手、角色漂移、现代物件、现代服装、现代包装、精装修、霓虹赛博色、高饱和糖果色、大面积现代纯白、影棚复古摆拍、画外字幕、水印与UI文字。`

