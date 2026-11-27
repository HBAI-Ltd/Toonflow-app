# 路由

所有请求本质都是做视频。先判**手上有什么**，再判**做哪一类**，然后进对应的 SOP。

顺序不能反：手上有什么决定怎么开始，类目决定按哪套方法做完。

## 一、先看该不该接

按优先级从上到下，命中即停：

1. **不归本 skill**：完全不需要生成任何画面的纯剪辑、纯配音、纯字幕，以及翻译 → 直接说明，别硬塞。剪辑为主但要补生成镜头、包装或字卡的（直播切片、访谈切片、赛事集锦这类），照常进对应 SOP
2. **情绪先行**："太难了""我先看看别人""你别嫌我笨" → 先安抚，给一句留门的话
3. **非制作请求**：发票、价格、能不能赚钱 → 秒答后收；不报没见过的界面路径，不说没核过的费用
4. **要的东西做不到**：院线电影、保证播放量、几小时长篇 → 先划边界
5. **材料没到手**："发你了"实际没发、"明天发" → 先答能不能，再要材料
6. 以上都不命中 → 进类目判定

前五条命中，不进类目判定。

## 二、再判手上有什么

这一段决定从哪一步开始，不决定做哪类片。不管从哪开始，都排在类目 SOP 第二节「开工必问」之后：单集时长、集数这些规格先定，再做下表这一格。

| 手上 | 从哪开始 | 做什么 |
|---|---|---|
| 一条任务（领导、甲方、老师、比赛） | 先补需求 | 人群、效果、验收人、交期，写进 S0 |
| 一个想法（点子、情绪、一句设定） | 先立故事 | 开工必问过完、规格定了，再给三条一句话故事，挑一条，进 S1 |
| 小说（两三章以上） | 先选材 | 选段、集纲，不按章号平均切，进 S1 |
| 剧本（有台词 + 场次 + 人物） | 先体检 | 可拍性、场数与时长，进 S1 |
| 素材或成片（要改、要剪、要续） | 先看素材 | 只处理受影响的范围，不重跑整条链 |

判不准看硬条件：能翻到台词才算剧本；两三章以上有连续情节才算小说；两页以内按想法；体量不匹配按体量算，不按用户给的名称算。

**叠加不替换。** 有领导要验收，同时手上又有小说：主线按小说走，把验收要求叠进 S0，不要只算一条。

## 三、再做类目路由

进 `references/sop/` 下对应文件。九个类目、四十八个子类：

| 类目 | 子类 | 这一类在做什么 |
|---|---|---|
| **短剧漫剧** | [竖屏短剧](sop/shortDrama/portraitDrama.md) · [横屏短剧](sop/shortDrama/landscapeDrama.md) · [AI漫剧](sop/shortDrama/aiComicDrama.md) · [动态漫](sop/shortDrama/motionComic.md) · [单元情景剧](sop/shortDrama/episodicSitcom.md) · [互动剧](sop/shortDrama/interactiveDrama.md) | 让人想看下一集 |
| **宣传片** | [企业宣传片](sop/promotionalVideos/companyPromo.md) · [产品宣传片](sop/promotionalVideos/productPromo.md) · [招聘宣传片](sop/promotionalVideos/recruitmentPromo.md) · [城市文旅](sop/promotionalVideos/cityTourism.md) · [公益宣传片](sop/promotionalVideos/publicServicePromo.md) · [政务宣传片](sop/promotionalVideos/governmentPromo.md) | 让人信、让人来 |
| **电商广告** | [商品视频](sop/ecommerceAds/productVideo.md) · [带货口播](sop/ecommerceAds/salesPitch.md) · [信息流广告](sop/ecommerceAds/feedAds.md) · [品牌广告](sop/ecommerceAds/brandAds.md) · [直播切片](sop/ecommerceAds/livestreamClips.md) · [种草视频](sop/ecommerceAds/productRecommendation.md) | 让人买、让人点 |
| **知识解说** | [科普讲解](sop/educationalVideos/scienceExplainer.md) · [技能教程](sop/educationalVideos/skillTutorial.md) · [课程视频](sop/educationalVideos/courseVideo.md) · [影视解说](sop/educationalVideos/filmCommentary.md) · [访谈播客](sop/educationalVideos/interviewPodcast.md) · [直播讲课剪辑](sop/educationalVideos/lectureClips.md) | 让人懂 |
| **纪实与活动** | [人物纪实](sop/documentariesAndEvents/personalDocumentary.md) · [过程纪录](sop/documentariesAndEvents/processDocumentary.md) · [活动开场](sop/documentariesAndEvents/eventOpening.md) · [年会回顾](sop/documentariesAndEvents/annualEventRecap.md) · [婚礼纪实](sop/documentariesAndEvents/weddingDocumentary.md) · [旅行纪录](sop/documentariesAndEvents/travelDocumentary.md) | 让人记住这件事 |
| **音乐与包装** | [歌曲MV](sop/musicAndMotion/musicVideo.md) · [卡点混剪](sop/musicAndMotion/beatSyncedMontage.md) · [预告片](sop/musicAndMotion/trailer.md) · [片头包装](sop/musicAndMotion/titleSequence.md) · [歌词版MV](sop/musicAndMotion/lyricVideo.md) · [动态海报包装](sop/musicAndMotion/animatedPoster.md) | 让人跟着节奏走 |
| **游戏与二次元** | [游戏PV](sop/gamingAndAnime/gamePromo.md) · [实况剪辑](sop/gamingAndAnime/gameplayEdit.md) · [角色短片](sop/gamingAndAnime/characterShort.md) · [二创混剪](sop/gamingAndAnime/fanEdit.md) | 让人想玩、想追角色 |
| **美食与生活** | [美食制作](sop/foodAndLifestyle/cookingVideo.md) · [探店](sop/foodAndLifestyle/venueVisit.md) · [生活Vlog](sop/foodAndLifestyle/lifestyleVlog.md) · [好物开箱](sop/foodAndLifestyle/productUnboxing.md) | 让人想吃、想试、想关注 |
| **体育与赛事** | [赛事集锦](sop/sportsAndEvents/eventHighlights.md) · [运动教学](sop/sportsAndEvents/sportsTutorial.md) · [赛事预告](sop/sportsAndEvents/eventPreview.md) · [球迷应援](sop/sportsAndEvents/fanSupport.md) | 让人热血、让学生动作 |

### 怎么选子类

看两件事：**片子的目的、手上素材的形态。**

| 信号 | 落到哪 |
|---|---|
| 要连续追、有集数、要钩子 | 短剧漫剧（先按画风分：二次元、国漫、日漫这类非写实画风走 AI漫剧；写实的真人或 AI 仿真人，单集 60–90 秒走竖屏短剧，单集 5 分钟以上走横屏短剧。再看形态：静帧加动效走动态漫；每集独立走单元情景剧；有选择分支走互动剧） |
| 要介绍公司、产品、岗位、城市 | 宣传片（按对象选；公益走公益片；政府/事业单位走政务片） |
| 要卖货、要点击、要留资 | 电商广告（详情页走商品视频；真人口播走带货口播；投放素材走信息流；品牌记忆走品牌广告；直播回放剪条走直播切片；种草走种草视频） |
| 要把一个道理或操作讲清楚 | 知识解说（概念走科普；动手走教程；系统课走课程；讲影视作品走解说；对谈走访谈播客；直播讲课回放走直播讲课剪辑） |
| 记录真实的人、事、活动 | 纪实与活动（一个人走人物纪实；一件事的过程走过程纪录；现场播放走活动开场；年度回顾走年会回顾；婚礼走婚礼纪实；出行走旅行纪录） |
| 以音乐或品牌节奏为主 | 音乐与包装（整首歌走 MV；踩点集锦走卡点混剪；上线前吊胃口走预告片；片头走片头包装；歌词字幕为主走歌词版 MV；社媒静态包装走动态海报） |
| 游戏、二次元 | 游戏与二次元（宣传片走游戏PV；玩的过程走实况剪辑；角色向走角色短片；混剪二创走二创混剪） |
| 吃、玩、日常 | 美食与生活（做菜走美食制作；店铺走探店；日常记录走生活Vlog；开箱测评走好物开箱） |
| 比赛、运动 | 体育与赛事（高光走赛事集锦；教动作走运动教学；赛前造势走赛事预告；球迷向走球迷应援） |

**边界不清时看目的，不看题材。** 同一段素材可以是宣传片也可以是纪实：目的是让人信 → 宣传片；目的是让人知道这件事真实发生过 → 纪实。

### 五个常见的分岔

| 容易混 | 判法 |
|---|---|
| 短剧 vs AI漫剧 | 看画风，不看是不是 AI 生成（在这里画面基本都是生成的）：写实的真人或 AI 仿真人 → 竖屏 / 横屏短剧；二次元、国漫、日漫这类非写实画风 → AI漫剧。画风还没定稿就先按用户说的感觉暂定，定稿后复核一次 |
| 宣传片 vs 纪录片 | 有明确主张与 CTA → 宣传片；以真实人物与事件为主、不设 CTA → 纪实 |
| 商品视频 vs 带货口播 | 讲清产品 → 商品视频；靠一个人说服 → 带货口播 |
| 信息流 vs 品牌广告 | 要转化、要 A/B → 信息流；要记忆、要主张 → 品牌广告 |
| 预告片 vs 卡点混剪 | 有正片素材、要控制剧透 → 预告片；纯素材踩点、不承载剧情 → 卡点混剪 |

## 四、SOP 里的数字是出发值

48 份 SOP 都是出发稿，照写着的值做（见 `SKILL.md`「依据与优先级」）。用户明确让你改或查，再按他说的做。

## 五、SOP 怎么用

每份 SOP 同一套十节：适用 / 开工必问 / 规格 / 结构 / 资产 / **方法论调用** / 制作流程 / 验收 / 常见失败 / 示例。

- 先读完选中的那一份，按第二节一次一问。
- 每到一个阶段，按第六节去 `references/methods/` 读列出的文件和节。方法论文件各自独立，只读第六节列出的。
- 拿不准怎么落地时看第十节的示例，照做法不照内容。
- 交付前过第八节；第九节只列本类目特有的坑，通用的坑在 `references/methods/generationAndRevision.md`。
- 新增或修改 SOP 照 `references/sop/sopTemplate.md` 写。

## 六、目录

```
references/
  sopRouting.md            本文件
  sop/
    shortDrama/  portraitDrama.md landscapeDrama.md aiComicDrama.md motionComic.md episodicSitcom.md interactiveDrama.md
    promotionalVideos/    companyPromo.md productPromo.md recruitmentPromo.md cityTourism.md publicServicePromo.md governmentPromo.md
    ecommerceAds/  productVideo.md salesPitch.md feedAds.md brandAds.md livestreamClips.md productRecommendation.md
    educationalVideos/  scienceExplainer.md skillTutorial.md courseVideo.md filmCommentary.md interviewPodcast.md lectureClips.md
    documentariesAndEvents/ personalDocumentary.md processDocumentary.md eventOpening.md annualEventRecap.md weddingDocumentary.md travelDocumentary.md
    musicAndMotion/ musicVideo.md beatSyncedMontage.md trailer.md titleSequence.md lyricVideo.md animatedPoster.md
    gamingAndAnime/ gamePromo.md gameplayEdit.md characterShort.md fanEdit.md
    foodAndLifestyle/ cookingVideo.md venueVisit.md lifestyleVlog.md productUnboxing.md
    sportsAndEvents/ eventHighlights.md sportsTutorial.md eventPreview.md fanSupport.md
    sopTemplate.md          写 SOP 用的模板，制作时不读
  responseStyle.md            怎么跟小白说话
  globalStyle.md            怎么定画风、怎么冻结
  preferences.md                偏好建议值与 AGENTS.md 模板
  methods/                各自独立，由 SOP 第六节调用
    storyDevelopment.md  scriptsAndNarration.md  assetDesign.md  lightingAndColor.md
    shotDesign.md    segmentationAndAssembly.md  actingAndMovement.md  sound.md
    promptWriting.md  generationAndRevision.md  canvasAndDelivery.md
    formatRules/  script.md  assets.md  seedance.md  minimaxH3.md
```

## 七、禁令

- 不替用户选类目又不说明；判完要用一句人话说清走哪条
- 不跨类目混用方法（拿宣传片结构写短剧、拿商品视频结构写纪实）
- 不在材料没到手时开工
