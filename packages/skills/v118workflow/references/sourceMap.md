# 旧版来源与当前迁移

来源固定为 [Toonflow-app v1.1.8](https://github.com/HBAI-Ltd/Toonflow-app/tree/cd3e7c4e83963bea255be2e621eb78d2cd1c2188)，已核对标签解引用提交 `cd3e7c4e83963bea255be2e621eb78d2cd1c2188`。以下路径均相对此提交，不引用后续版本冒充旧版流程。执行任务不必每次联网读取这些来源，本技能已沉淀所需方法。

## 子流程来源

| 本技能 reference | v1.1.8 源文件 |
| --- | --- |
| projectSetup | `data/skills/script_agent_decision.md`；`src/routes/project/addProject.ts` |
| sourceEvents | `src/routes/novel/event/generateEvents.ts`；`src/utils/cleanNovel.ts`；`src/lib/initDB.ts` 的章节事件提示词 |
| storySkeleton | `data/skills/script_execution_skeleton.md`；`data/skills/script_agent_supervision.md` |
| adaptationStrategy | `data/skills/script_execution_adaptation.md`；`data/skills/script_agent_supervision.md` |
| episodeScript | `data/skills/script_execution_script.md`；`src/agents/scriptAgent/index.ts` |
| baseAssets | `src/routes/script/extractAssets.ts`；`src/lib/initDB.ts`、`src/lib/fixDB.ts` 的资产提取提示词 |
| generateAssets | `src/routes/assetsGenerate/polishAssetsPrompt.ts`、`generateAssets.ts`；`data/skills/art_skills/{风格}/art_prompt/art_character.md`、`art_scene.md`、`art_prop.md`；`data/skills/production_execution_generate_assets.md`；`src/routes/production/assets/batchGenerateAssetsImage.ts` |
| directorPlan | `data/skills/production_execution_director_plan.md` |
| deriveAssets | `data/skills/production_execution_derive_assets.md` |
| storyboardTable | `data/skills/production_execution_storyboard_table.md`；`data/skills/production_agent_supervision.md` |
| storyboardPanel | `data/skills/production_execution_storyboard_panel.md`；`data/skills/production_skills/storyboard_prompt_techniques.md` |
| storyboardImages | `data/skills/production_execution_storyboard_gen.md`；`src/routes/production/storyboard/batchGenerateImage.ts` |
| videoProduction | `src/routes/production/workbench/generateVideoPrompt.ts`、`generateVideo.ts`、`batchGenerateVideo.ts`、`selectVideo.ts`；`data/modelPrompt/video/` 的模型/模式提示词 |

旧编剧决策总入口：`data/skills/script_agent_decision.md`。旧制作决策总入口：`data/skills/production_agent_decision.md`。真实旧运行实现：`src/agents/scriptAgent/`、`src/agents/productionAgent/`。

## 阶段产出契约对照

一致性按同一已确认输入、范围、分镜和实际支持的模式判断，核对的是产物结构、内容保真、数量、映射和可用状态。生成模型会作创作选择，即使旧执行技能也说明分镜不追求唯一解；不能保证重新生成的剧本、提示词或媒体逐字逐帧相同。

| 阶段 | v1.1.8 的有效产物 | 当前画布必须保留的契约 |
| --- | --- | --- |
| 章节事件 | 每章一条七字段摘要，存入对应 `o_novel.event` | 剧本画布一章一行：章节、角色、核心事件、主线关系、密度、秒数、情绪标签；细项另附，不能改变汇总行数 |
| 故事骨架 | 故事核、人物弧、三幕、N集分配与删减 | 恰好N集总览，逐集可追溯来源和取舍；章节数不等于集数 |
| 改编策略 | 基于事件与骨架的原则、取舍、世界观呈现 | 独立策略正文，能约束后续本集创作，不以标题或摘要替代 |
| 逐集剧本 | 一次一个完整 `scriptItem`，按项目与集名更新正式剧本 | 每集一份完整正文，来源、范围、前集状态连续；修订原位更新，不变成新集 |
| 基础资产 | 角色/场景/道具实体与出场剧本关联；润色提示词另行生成 | 资产画布唯一实体、名称/别名、类别、描述、出场集/场、真实节点引用；清单不冒充图片 |
| 导演规划 | 六列分场表、逐场注意事项、必要过渡表 | 场次覆盖、台词条数/字数、0～10情绪及基调完整；不提前拆镜 |
| 衍生与图片 | 父子记录、变化描述，以及独立生成结果 | 每个变体有真实父资产、需求依据和状态；已采用图才作正式图片引用，部分/跳过按衍生交接规则处理 |
| 分镜表 | 场→片段→镜、片段级引用、每镜七列、片段≤15秒 | 原事件和台词完整、顺序正确、每镜数值时长、片段时长合计及实际引用；默认4字/秒加停顿与余量，其他表演口径明确确认 |
| 纯文本多参面板 | 每片段一条分镜记录、独立track；描述含全部子镜，默认不出分镜图 | 每片段一个视频单元，完整保存原镜号、子镜文字、台词/音效和片段时长；仍有真实资产参考，不等于无参考的纯文生视频 |
| 首帧面板与出图 | 每镜一条记录、独立track，按镜生成首帧图 | 每镜一个视频单元和一张首帧；原镜号与单镜时长不变。尾帧仅在实际选定模式需要时追加 |
| 视频提示词/生成/采用 | 按track生成提示词与候选视频，另将采用的videoId绑定track | 每单元一份执行提示词；候选数量与采用数量分开；每个完成单元明确采用一个版本，记录原镜/片段归属及真实文件 |

两条路线的数量核算：已确认分镜有片段A（镜1=4秒、镜2=5秒、镜3=3秒，共12秒）、片段B（镜4=6秒、镜5=4秒，共10秒），且模型支持这些时长、每单元首次生成一次：

| 产物 | 文本多参 | 首帧 |
| --- | --- | --- |
| 制作单元/独立track对应 | 2个，分别保留镜1–3、镜4–5 | 5个，分别保留镜1至镜5 |
| 默认分镜图 | 0张 | 5张首帧 |
| 视频提示词 | 2份 | 5份 |
| 首批候选/最终每单元选一个版本 | 2个/2个 | 5个/5个 |
| 计划总时长 | 12+10=22秒 | 4+5+3+6+4=22秒 |

重试增加候选，不能改变制作单元归属；模型不支持某时长时先重新确认方案，不能为凑表格数量删镜或默改时长。部分制作须另列缺口，不把可用子集计为全剧或整集完成。

实际证据链：`production_execution_storyboard_panel.md:56–75,103–130` 定义写入单位 → `src/agents/productionAgent/tools.ts` 的 `add_flowData_storyboard` 发 `addStoryboard` → tag打包前端 `data/web/index.html` 将字段转换后调用 `src/routes/production/storyboard/batchAddStoryboardInfo.ts` → 按track分组、duration求和并关联 `o_videoTrack` → `workbench/getGenerateData.ts` 按track供工作台 → `generateVideoPrompt.ts` / `batchGeneratePrompt.ts` 按track生成提示词 → `generateVideo.ts` / `batchGenerateVideo.ts` 为track创建候选 → `selectVideo.ts` 单独记录采用。

旧运行缺陷不能作为产出等价要求：面板agent仍追加XML指令，但打包前端未在XML回调中处理 `storyboardItem`，有效写入链是上述结构化工具；旧视频界面会把时长夹到模型范围，生成状态也存在“生成成功/已完成”不一致。当前必须实际写入并回读、先确认不兼容参数、区分生成与采用。无父图仍发起衍生、缺图时过滤引用而不回退父图等旧行为也不继承。

因此“核心产物契约一致”不表示操作行为完全相同：本技能还明确增加三类画布归档、逐阶段确认、父图/参考完整性和媒体验收，并保留文末列出的内容方法调整。要报告严格复现时，必须同时列出这些迁移差异及未实际运行的环节。

## 原先依赖的知识如何融合

旧版并非只靠执行步骤。下面各组知识已转为包内 reference，阶段文件要求在实际创作前读取；源目录仅用于追溯，执行无需另装旧技能。

| 包内知识 | 实质内容 | 旧知识来源 |
| --- | --- | --- |
| [scriptCraft](knowledge/scriptCraft.md) | 人物与矛盾、三幕/分集、情绪/信息/情节密度、预期与反转、改编取舍、可演剧本及审核 | `script_execution_skeleton.md`、`script_execution_adaptation.md`、`script_execution_script.md`、`script_agent_supervision.md` 的知识正文 |
| [narrativeGenres](knowledge/narrativeGenres.md) | 12 类叙事的节拍、信息释放、表演、景别/运镜、声音和适用边界 | `data/skills/story_skills/{类型}/driector_skills/director_planning_narrative.md`、`director_storyboard_table_narrative.md`，12 × 2 份 |
| [visualStyles](knowledge/visualStyles.md) | 11 种画风的形态、配色、光影、材质、构图、情绪表达及视频表现 | 每个 `data/skills/art_skills/{风格}/prefix.md`、`driector_skills/` 中 3 份视觉技法、`art_prompt/art_storyboard_video.md` |
| [assetDesign](knowledge/assetDesign.md) | 角色/场景/道具的结构化设计与提示词、参考身份保持、基础/衍生差异和验收 | 11 种风格的 `art_prompt/art_character.md`、`art_scene.md`、`art_prop.md` 及各自 `_derivative.md`，结合对应 prefix |
| [shotCraft](knowledge/shotCraft.md) | 叙事镜头语法、空间/视轴/动作连续、拆并镜、对白计时、转场和具体审阅 | `data/skills/production_skills/storyboard_table_techniques.md`、导演/表/面板执行技能与 `production_agent_supervision.md` |
| [imagePromptCraft](knowledge/imagePromptCraft.md) | 景别词库、首帧语义、站位/朝向/反射面、参考绑定、Seedream 与 Nanobanana 提示词模板 | `data/skills/production_skills/storyboard_prompt_techniques.md`、`production_execution_storyboard_panel.md`，结合所选视觉技法 |
| [videoPromptCraft](knowledge/videoPromptCraft.md) | 首帧、首尾帧、多参模式的动态/镜头/声音/引用结构与模型模板 | `data/modelPrompt/video/` 下通用首尾帧、通用多参、Wan 2.6、Seedance 2 四份文档，结合所选风格 `art_storyboard_video.md` |

实际加载链路也已核对：

1. `src/agents/scriptAgent/index.ts` 分别读取编剧执行技能；知识就在执行文档正文，不是只有阶段工具说明。
2. `src/agents/productionAgent/index.ts` 的 `createArtSkills` 按项目的 `artStyle` 和 `directorManual` 扫描视觉、叙事两个 `driector_skills` 目录；`useProductionSkills` 还把通用 `production_skills` 加入分镜表与面板阶段。
3. `src/routes/assetsGenerate/polishAssetsPrompt.ts` 按角色/场景/道具和是否有父资产选择基础/衍生手册；`src/utils/getArtPrompt.ts` 把风格 `prefix.md` 与该手册拼接。
4. 单条及批量视频提示词路由先选择模型/模式模板，再注入 `getArtPrompt(artStyle, "art_skills", "art_storyboard_video")`，因此视频提示词也要继承美术风格，不只列台词和时长。

12 类来源目录为 `Comedy_humor`、`Coming_of_age`、`Family_warmth`、`Historical_epic`、`Horror_supernatural`、`Hot_blooded_action`、`Mystery_thriller`、`Psychological_drama`、`Scifi_post_apocalypse`、`Sweet_romance_novel`、`Urban_workplace_drama`、`Xianxia_fantasy`。

11 种美术来源目录为 `2D_90s_japanese_anime`、`2D_chinese_guofeng`、`2D_flat_design`、`2D_mature_urban_romance`、`3D_anime_render`、`3D_chinese_traditional`、`3D_clay_stopmotion`、`3D_guofeng_cyber`、`realpeople_ancient_chinese`、`realpeople_modern_city`、`realpeople_urban_modern`。每种风格核对 prefix、7 份 art_prompt 与 3 份导演视觉技法，共 121 份；按共通方法与风格特例融合，不要求把 121 份原稿全量读入每轮制作。

## 保留与调整

- **保留阶段职责。** 章节事件→故事骨架（含分集大纲）→改编策略→逐集剧本；制作为导演规划→衍生分析→可选出图→分镜表→分镜落点→条件出图，最后接视频工作台。
- **每阶段确认是本次迁移要求。** 旧版仅部分阶段自动监督、剧本可静默连续生成。这里统一为成果落画布、回读检查、用户确认；用户已确认的输入和批次不重复确认。
- **统一画布是新的存储映射。** 旧版的 planData、SQLite、剧本文本XML与结构化分镜面板写入改为剧本/资产/每集制作画布。分镜面板XML仅为冲突残留，不宣称它本身可可靠落库；不保留旧调用协议，也不要求当前环境存在同名 subagent。
- **以执行职责消解旧版冲突。** 导演只做分场等规划；衍生分析读取剧本与资产，不强制依赖已被导演执行技能移除的“衍生预划”。分镜以新执行技能的“场→片段→七列表”为准，面板中残留的“组”映射为片段，不额外补造独立朝向列。
- **真实引用优先。** 旧版制作链不处理缺失基础资产；此技能有独立基础资产步骤，可回到资产画布补齐并确认，不编造资产 ID，也不在单集暗建另一套资产库。
- **保留 v1.1.8 的 15 秒片段规划口径与默认估时。** 默认沿用执行层4字/秒、审核层停顿与首尾余量；通用技法3/2字/秒作为已确认表演的选项，不静默改变镜长和片段数量。同时服从实际模型更短的上限，不兼容或改变口径时重新确认。语速等数值只作为估计，不是运行能力承诺。
- **内容先于商业模板。** 只准竖屏、固定付费节奏、金手指密度等旧商业短剧偏好不强制套用；保留用户已确认的类型、画幅、故事与改编边界。原始屏幕文字不擅自改成新增配音，必要过渡提案先确认。
- **保留知识，移除失效的执行控制。** 旧文档“不得加载技能/不得再次读取”的指令，与实际注入的技法库和当前分阶段读取机制有冲突，不继承这些运行时限制。镜头技法中的朝向、视轴等知识映射进七列表的画面描述与运镜，不因旧列被删就连专业内容一起删掉。
- **按类型解释节奏。** 快节奏单线和商业卡点保留为适用项目的方法；青春的双线/碎片、史诗的群像、家庭的日常、仙侠的诗化留白也保留。数字是旧版经验口径，不替代实际对白、动作时长及用户已确认节奏。
- **按阶段区分设计知识和自动提取范围。** 场景手册中的天气/角度/破损、道具衍生方法仍可用于用户明确提出的设计；默认制作 SOP 只自动提取角色整体变化和场景时段变化，不据此抹掉其他已存在的设计知识。
- **共同资产模板与风格差异分开。** 角色四视图是本技能的统一识别资料方案；旧 `3D_guofeng_cyber/art_character.md` 实际是面部超特写模板，不宣称每种旧画风都已有同一四视图。角色的肤色/身高、现代/古代元素按用户已确认身份与世界观，不能被某个 prefix 的例子覆盖。
- **保留国风赛博的场景四方向资料。** 该风格的 `art_prompt/art_scene.md:95–117,150–151` 与 `art_scene_derivative.md:124–129,173–174` 要求同中心点前/右/后/左的 2×2 设定，基础与衍生都适用；其余 10 种画风为单场景图。实际比例服从当前模型，衍生沿用父图视点高度，不把旧衍生文档固定 1.6 米覆盖高空父图；四格仅用于资产资料，不是分镜布局。
- **提示词模板不等于工具协议。** 图像英文 JSON、视频旧式引用标记属于历史内容模板，转换为当前节点提示词和真实媒体引用；不把模板字段当节点配置，不把旧图片张数、视频时长或“不支持某动作”的假设当作当前模型事实。
- **模型由真实能力决定。** 旧视频提示词有模型绑定、Wan、Seedance、通用首尾帧和多参分支，并非强制 Seedance；不套入当前其他 workflow 的默认模型。
- **不虚构成片能力。** 旧 README 提及拼接导出，但已核对制作路由不足以证明有对应通用接口；当前只通过实际可用工具合成，或如实交付有序片段及清单。

## 当前执行契约来源

以下为本技能创建时当前仓库的迁移依据，**不是 v1.1.8 文件**；执行时仍以工具实时 schema 为准：

- `packages/tools/canvas/src/runtime.ts`：画布、节点、连线工具参数。
- `apps/web/src/pages/workspace/panels/canvas/useCanvasTools.ts`、`canvasHost.vue`、`components/canvasMenu.vue`：本轮上下文、画布切换与文件树操作协调。
- `packages/tools/workspace/src/index.ts`：内置工作区文件工具范围。
- `packages/nodes/videoGenerationNode/src/index.vue`：通过节点 `getConfig` 查询当前模型能力。
- `packages/nodes/textNode/src/index.vue`、`imageNode/src/index.vue`、`imageGenerationNode/src/index.vue`、`videoGenerationNode/src/index.vue`：节点公开函数和输出。
- `apps/server/src/agent/assets.ts`、`apps/server/src/utils/assets/index.ts`：全局资产导入与工作区路径。
- `apps/server/src/agent/skills/index.ts`、`apps/server/src/utils/skills/files.ts`：技能读取、新建及编辑契约。

技能保留当前目录与 frontmatter 名称 `v118workflow`，所有知识都位于该包的 `references/knowledge/`，不依赖另一个已安装的旧版技能包。
