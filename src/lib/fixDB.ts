import u from "@/utils";
import path from "path";
import fs from "fs";
import { Knex } from "knex";
import db from "@/utils/db";
import { transform } from "sucrase";
import rawVendorData from "./vendor.json";

const vendorData = rawVendorData as Record<string, string>;

export default async (knex: Knex): Promise<void> => {
  const addColumn = async (table: string, column: string, type: string) => {
    if (!(await knex.schema.hasTable(table))) return;
    if (!(await knex.schema.hasColumn(table, column))) {
      await knex.schema.alterTable(table, (t) => (t as any)[type](column));
    }
  };

  const dropColumn = async (table: string, column: string) => {
    if (!(await knex.schema.hasTable(table))) return;
    if (await knex.schema.hasColumn(table, column)) {
      await knex.schema.alterTable(table, (t) => t.dropColumn(column));
    }
  };

  const alterColumnType = async (table: string, column: string, type: string) => {
    if (!(await knex.schema.hasTable(table))) return;
    if (await knex.schema.hasColumn(table, column)) {
      await knex.schema.alterTable(table, (t) => {
        (t as any)[type](column).alter();
      });
    }
  };
  //矫正因软件异常退出导致的状态不一致问题
  await db("o_novel").where("eventState", 0).update({
    eventState: -1,
    errorReason: "软件退出导致失败",
  });
  await db("o_script").where("extractState", 0).update({
    extractState: -1,
    errorReason: "软件退出导致失败",
  });
  await db("o_assets").where("promptState", "生成中").update({
    promptState: "生成失败",
    promptErrorReason: "软件退出导致失败",
  });
  await db("o_image").where("state", "生成中").update({
    state: "生成失败",
    errorReason: "软件退出导致失败",
  });
  await db("o_storyboard").where("state", "生成中").update({
    state: "生成失败",
    reason: "软件退出导致失败",
  });
  await db("o_video").where("state", "生成中").update({
    state: "生成失败",
    errorReason: "软件退出导致失败",
  });
  //队列任务恢复：异常退出时执行中的任务重新排队（在调度器启动前执行）
  if (await knex.schema.hasTable("o_genQueue")) {
    await db("o_genQueue").where("state", "执行中").update({
      state: "排队中",
      updateTime: Date.now(),
    });
  }
  //合成/拼接记录状态矫正（队列恢复后会重新执行并覆盖状态）
  if (await knex.schema.hasTable("o_videoCompose")) {
    await db("o_videoCompose").where("state", "合成中").update({
      state: "合成失败",
      errorReason: "软件退出导致失败",
    });
  }
  if (await knex.schema.hasTable("o_episodeMerge")) {
    await db("o_episodeMerge").where("state", "拼接中").update({
      state: "拼接失败",
      errorReason: "软件退出导致失败",
    });
  }

  // 添加新字段
  await addColumn("o_prompt", "useData", "text");
  // 抽卡候选组字段
  await addColumn("o_image", "batchId", "text");
  await addColumn("o_image", "selected", "integer");
  await addColumn("o_image", "score", "integer");
  await addColumn("o_image", "scoreReason", "text");
  // 分镜结构化字段（台词/音效/景别/运镜）
  await addColumn("o_storyboard", "dialogue", "text");
  await addColumn("o_storyboard", "soundEffect", "text");
  await addColumn("o_storyboard", "shotType", "text");
  await addColumn("o_storyboard", "cameraMovement", "text");
  // 添加新字段
  await addColumn("o_agentDeploy", "type", "string");
  // 添加新字段
  await addColumn("o_agentDeploy", "temperature", "integer");
  // 添加新字段
  await addColumn("o_agentDeploy", "maxOutputTokens", "integer");
  await addColumn("o_assets", "audioBindState", "integer");
  await addColumn("o_modelPrompt", "fileName", "string");
  await addColumn("o_modelPrompt", "path", "string");
  const vendorDataSelect = await u.db("o_vendorConfig").whereIn("id", ["deepseek", "atlascloud"]).select("*");
  if (!vendorDataSelect.find((i) => i.id == "deepseek")) {
    await u.db("o_vendorConfig").insert({
      id: "deepseek",
      inputValues: "{}",
      models: "[]",
      enable: 0,
    });
  }
  if (!vendorDataSelect.find((i) => i.id == "atlascloud")) {
    await u.db("o_vendorConfig").insert({
      id: "atlascloud",
      inputValues: "{}",
      models: "[]",
      enable: 0,
    });
  }
  //检测是否包含新增音色绑定提示词
  const existAudioPrompt = await db("o_prompt").where("type", "audioBindPrompt").first();
  if (!existAudioPrompt)
    await db("o_prompt").insert({
      name: "音色绑定",
      type: "audioBindPrompt",
      data: `你是一个音色匹配助手。\n你的任务是：根据给定角色资产的名称与描述，从候选音频列表中选出最合适的音色。\n匹配规则：\n1. 优先根据角色性别、年龄、性格等特征与音色描述进行语义匹配；\n2. 同一角色仅可匹配一个音色；\n3. 若候选列表中没有合适的音色，则无需返回 audioId；`,
    });
  //检测o_setting是否有agentUseMode
  const agentUserMode = await u.db("o_setting").where("key", "agentUseMode").first();
  if (!agentUserMode) {
    const allDeployData = await u
      .db("o_agentDeploy")
      .leftJoin("o_vendorConfig", "o_vendorConfig.id", "o_agentDeploy.vendorId")
      .select("o_agentDeploy.*");
    const advancedData = allDeployData.filter((item: any) => item.key?.includes(":"));
    const notValModelData = advancedData.filter((item) => !item.modelName);

    await u.db("o_setting").insert({
      key: "agentUseMode",
      value: notValModelData.length ? "0" : "1",
    });
  }
  //添加数据高级配置
  const advancedAgentList = [
    { key: "scriptAgent:decisionAgent", name: "剧本Agent:决策层", desc: "决策层" },
    { key: "scriptAgent:supervisionAgent", name: "剧本Agent:监督层", desc: "监督层" },
    { key: "scriptAgent:storySkeletonAgent", name: "剧本Agent:故事骨架", desc: "故事骨架生成" },
    { key: "scriptAgent:adaptationStrategyAgent", name: "剧本Agent:改编策略", desc: "改编策略生成" },
    { key: "scriptAgent:scriptAgent", name: "剧本Agent:剧本生成", desc: "剧本生成" },
    { key: "productionAgent:decisionAgent", name: "生产Agent:决策层", desc: "决策层" },
    { key: "productionAgent:supervisionAgent", name: "生产Agent:监督层", desc: "监督层" },
    { key: "productionAgent:deriveAssetsAgent", name: "生产Agent:衍生资产", desc: "衍生资产" },
    { key: "productionAgent:generateAssetsAgent", name: "生产Agent:生成资产", desc: "生成资产" },
    { key: "productionAgent:directorPlanAgent", name: "生产Agent:导演规划", desc: "导演规划" },
    { key: "productionAgent:storyboardGenAgent", name: "生产Agent:分镜生成", desc: "分镜生成" },
    { key: "productionAgent:storyboardPanelAgent", name: "生产Agent:分镜面板", desc: "分镜面板生成" },
    { key: "productionAgent:storyboardTableAgent", name: "生产Agent:分镜表格", desc: "分镜表格生成" },
  ];
  for (const agent of advancedAgentList) {
    const exists = await db("o_agentDeploy").where("key", agent.key).select("*").first();
    if (!exists) {
      await db("o_agentDeploy").insert({
        model: "",
        modelName: "",
        vendorId: null,
        key: agent.key,
        name: agent.name,
        desc: agent.desc,
        temperature: 1,
        maxOutputTokens: 0,
        disabled: false,
      });
    }
  }
  //矫正提示词
  await db("o_prompt").where("type", "scriptAssetExtraction").update({
    data: `---\nname: universal_agent\ndescription: 专注于从剧本内容中提取所使用的资产（角色、场景、道具）并生成结构化资产列表的助手。\n---\n\n# Script Assets Extract\n\n你是一个专业的剧本内容分析助手，专注于从剧本文本中识别和提取所有涉及的资产（角色、场景、道具），并为每项资产生成可供下游制作流程使用的结构化描述和提示词。\n\n## 何时使用\n\n用户提供剧本内容，你需要逐段阅读并提取其中涉及的所有资产（人物角色、场景地点、道具物件），输出为结构化的资产列表。产出的资产描述将用于后续 AI 图片生成和制作流程。\n\n## 与系统的对应关系\n\n- 资产类型：\n  - \`role\` — 角色（对应 \`o_assets.type = "role"\`）\n  - \`scene\` — 场景（对应 \`o_assets.type = "scene"\`）\n  - \`tool\` — 道具（对应 \`o_assets.type = "tool"\`）\n- 下游用途：资产提示词生成 → AI 资产图生成 → 分镜制作\n\n## 输出要求\n\n**必须通过调用 \`resultTool\` 工具返回结果**，禁止以纯文本、Markdown 表格或 JSON 代码块等形式直接输出资产列表。\n\`resultTool\` 的 schema 会对字段类型和枚举值做强校验，调用时请严格按照下方字段定义填写，确保数据结构正确、字段完整、类型匹配。\n\n每个资产对象包含以下字段：\n\n| 字段 | 类型 | 必填 | 说明 |\n| ---- | ---- | ---- | ---- |\n| \`name\` | string | 是 | 资产名称，使用剧本中的原始称呼,不做其他多余描述 |\n| \`desc\` | string | 是 | 资产描述，30-80 字的视觉化描述 |\n| \`prompt\` | string | 是 | 生成提示词，英文，用于 AI 图片生成 |\n| \`type\` | enum | 是 | 资产类型：\`role\` / \`scene\` / \`tool\`  |\n\n## 提取规则\n\n### 角色（role）\n\n- 提取剧本中出现的所有有名字的角色\n- \`desc\`：包含性别、外貌特征、服饰风格、体态气质等视觉要素，需在描述开头明确标注角色性别（如"男性，……"或"女性，……"）\n- \`prompt\`：英文提示词，描述角色的外观特征，需以性别词开头（如 \`a young man, ...\` 或 \`a young woman, ...\`），适用于 AI 角色图生成\n- 同一角色有多个称呼时，取最常用的作为 \`name\`\n- 无名龙套（如"路人甲"、"士兵"）可跳过，除非其造型对剧情有重要视觉意义\n\n### 场景（scene）\n\n- 提取剧本中出现的所有场景/地点\n- \`desc\`：包含空间结构、光照氛围、关键陈设、色调基调等视觉要素\n- \`prompt\`：英文提示词，描述场景的整体视觉风格，适用于 AI 场景图生成\n- 同一场景的不同状态（如白天/夜晚）不重复提取，在 \`desc\` 中注明即可\n\n### 道具（tool）\n\n- 提取剧本中出现的重要道具/物品\n- \`desc\`：包含外观形状、颜色材质、尺寸参考、特殊效果等视觉要素\n- \`prompt\`：英文提示词，描述道具的外观细节，适用于 AI 道具图生成\n- 仅提取有独立视觉意义或剧情功能的道具，通用物品可跳过\n\n\n## 提示词（prompt）生成规范\n\n- 采用逗号分隔的关键词/短语格式\n- 优先描述**视觉特征**，避免抽象概念\n- 包含风格关键词（如 anime style, manga style 等，根据项目风格决定）\n- 角色 prompt 示例：\`a young man, sharp eyebrows, black hair, pale skin, wearing a gray Taoist robe, slender build, cold expression\`\n- 场景 prompt 示例：\`dark cave interior, glowing crystals on walls, misty atmosphere, dim blue lighting, stone altar in center\`\n- 道具 prompt 示例：\`ancient jade pendant, oval shape, translucent green, carved dragon pattern, glowing faintly\`\n\n## 提取流程\n\n1. 通读剧本全文，识别所有出现的角色、场景、道具\n2. 对每个资产生成结构化的 \`name\`、\`desc\`、\`prompt\`、\`type\`\n3. 去重：同一资产不重复提取\n4. **必须通过调用 \`resultTool\` 工具输出完整资产列表**，不要分多次调用，一次性将所有资产放入 \`assetsList\` 数组中提交\n\n## 提取原则\n\n1. **忠于剧本**：所有提取基于剧本中的实际内容，不臆造未出现的资产\n2. **视觉优先**：描述和提示词聚焦视觉特征，便于 AI 图片生成\n3. **精简实用**：只提取对制作有实际意义的资产，避免过度提取\n4. **分类准确**：严格按照 role/scene/tool 分类，不混淆\n5. **提示词质量**：英文提示词应具体、可执行，能直接用于 AI 图片生成\n\n## 注意事项\n\n- 资产列表中**不要包含剧本内容本身**，仅提取所使用到的资产\n- 角色的随身物品如果有独立剧情功能，应单独作为道具提取\n- 场景中的固定陈设不需要单独提取为道具，除非该物件有独立剧情作用`,
  });
  await db("o_prompt").where("type", "videoPromptGeneration").update({
    data: `# 视频提示词生成 Skill\n\n你是**视频提示词生成 Agent**，专门负责根据指定的 AI 视频模型，读取分镜信息并输出该模型对应格式的视频提示词。\n\n---\n\n## 输入格式\n\n### 1. 模型与模式（必选）\n\n\n#### 模式路由规则\n\n| 条件 | 匹配模式 | 说明 |\n|------|----------|------|\n| 模型名为 \`seedance-2-0\` + \`多参:是\` / \`seedance 2.0\` + \`多参:是\` / \`即梦2.0\` + \`多参:是\` | **seedance-2-0*，不包含其他版本比如seedance-1-5/seedance-1-0 | 支持角色/场景/分镜图多参引用 |\n| 模型名为 \`Wan2.6\` / \`wan 2.6\` / \`万象2.6\` | **Wan 2.6** | 固定模式，单图（首帧）+ 叙事文本，无尾帧 |\n| 其他任何模型 + \`多参:是\` | **通用多参模式** | 支持角色/场景/分镜图多参引用 |\n| 其他任何模型/seedance-1-5/seedance-1-0 + \`多参:否\` | **通用首尾帧模式** | 首帧/首尾帧 + 纯文本描述 |\n\n> 模型名仅用于记录，实际提示词格式由匹配到的模式决定。Seedance 2.0 和 Wan 2.6 是指定模型名即确定模式的特例。\n\n### 2. 资产信息\n\n\`\`\`\n资产信息[id, type, name], [id, type, name], ...\n\`\`\`\n\n- \`id\`：资产唯一标识（如 \`A001\`）\n- \`type\`：资产类型，取值 \`role\`（角色）/ \`scene\`（场景）/ \`prop\`（道具）\n- \`name\`：资产名称（如 \`沈辞\`、\`城楼\`、\`长剑\`）\n\n### 3. 分镜信息\n\n分镜以 \`<storyboardItem>\` XML 标签列表的形式传入，每条分镜结构如下：\n\n\`\`\`xml\n<storyboardItem\n  videoDesc='（画面描述、场景、关联资产名称、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效、关联资产ID）'\n  prompt='待生成'\n  track='分组'\n  duration='视频推荐时间'\n  associateAssetsIds="[该分镜所需的资产ID列表]"\n  shouldGenerateImage="true"\n></storyboardItem>\n\`\`\`\n\n#### 输入字段说明\n\n| 属性 | 说明 | 来源 |\n|------|------|------|\n| \`videoDesc\` | **核心输入**：分镜的结构化画面描述，包含画面描述、场景、关联资产名称、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效、关联资产ID | 用户/上游系统填写 |\n| \`prompt\` | **已有字段**：上游生成的分镜图提示词，作为辅助参考上下文，**不修改** | 上游系统已填写 |\n| \`track\` | 分镜分组标识 | 用户/上游系统填写 |\n| \`duration\` | 视频推荐时长（秒） | 用户/上游系统填写 |\n| \`associateAssetsIds\` | 该分镜关联的资产ID列表 | 用户/上游系统填写 |\n| \`shouldGenerateImage\` | 是否需要生成分镜图片，默认 \`true\` | 用户/上游系统填写 |\n\n---\n\n## 任务目标\n\n读取所有 \`<storyboardItem>\` 的属性，结合资产信息，根据指定模型的提示词格式，将全部分镜整合为一个完整的视频提示词。\n\n---\n\n## 输出格式\n\n将所有分镜整合为**一个完整的视频提示词**输出（非逐条独立）：\n\n| 模式 | 整合方式 |\n|------|----------|\n| **通用多参模式** | \`[References]\` 汇总所有 \`@图N \` 引用；\`[Instruction]\` 按时间顺序描述完整叙事 |\n| **通用首尾帧模式** | 纯文本五维度（Visual / Motion / Camera / Audio / Narrative），不使用任何 \`@图N \` 引用，按时间轴连续编排（\`[Motion]\` 0s → 总时长，每段最低 1 秒），全程单一连贯镜头，不切镜 |\n| **Seedance 2.0** | \`生成一个由以下 N 个分镜组成的视频\`，每条对应 \`分镜N{N}s\` 段落 |\n| **Wan 2.6** | 单图首帧模式，每次仅输入一条分镜，输出一段叙事式英文提示词（三段式：风格基调 → 主体动作+场景环境+光线氛围 → 镜头收尾），不使用 \`@图N \` 引用 |\n\n- 仅输出视频提示词文本，不输出 XML 标签，不附加解释\n\n---\n\n## videoDesc 解析规则\n\n从 \`videoDesc\` 括号内按顿号分隔提取以下结构化字段：\n\n\`\`\`\n（{画面描述}、{场景}、{关联资产名称}、{时长}、{景别}、{运镜}、{角色动作}、{情绪}、{光影氛围}、{台词}、{音效}、{关联资产ID}）\n\`\`\`\n\n| 序号 | 字段 | 用途 | 示例 |\n|------|------|------|------|\n| 1 | 画面描述 | prompt 的叙事主干 | 沈辞独立城楼远眺苍茫大地 |\n| 2 | 场景 | 匹配场景资产 | 城楼 |\n| 3 | 关联资产名称 | 匹配角色/道具资产 | 沈辞/城楼 |\n| 4 | 时长 | 控制时长参数 | 4s |\n| 5 | 景别 | 控制镜头景别 | 全景 |\n| 6 | 运镜 | 控制运镜方式 | 静止 |\n| 7 | 角色动作 | prompt 动作描写 | 负手而立衣袂随风飘扬 |\n| 8 | 情绪 | prompt 情绪氛围 | 坚定决绝 |\n| 9 | 光影氛围 | prompt 光影描写 | 黄昏冷调侧逆光 |\n| 10 | 台词 | prompt 台词/音频段 | 无台词 / 具体台词内容 |\n| 11 | 音效 | prompt 音效描写 | 风声衣袂声 |\n| 12 | 关联资产ID | 用于资产ID↔角色标签映射 | A001/A002 |\n\n---\n\n## 资产引用编号规则\n\n所有模型统一使用 \`@图N \` 格式引用资产和分镜图，编号按输入顺序连续递增：\n\n1. **资产**：按资产信息中 \`[id, type, name]\` 的出现顺序，从 \`@图1 \` 开始编号（不区分 role / scene / prop）。**资产类型的出现顺序不固定**——可能先 scene 后 character，也可能 prop 在前、character 在后，或任意交替出现，编号严格按输入位置分配，不按类型归组\n2. **分镜图**：每条 \`<storyboardItem>\` 对应一张分镜图，编号接续资产之后\n3. **跳过无分镜图的条目**：当 \`shouldGenerateImage="false"\` 时，该分镜未生成图片，**不分配**分镜图编号，后续编号顺延\n\n#### 示例\n\n输入 3 个资产 + 2 条分镜：\n\`\`\`\n资产信息[A001, role, 沈辞], [A002, role, 苏锦], [A003, scene, 城楼]\n\`\`\`\n\`\`\`xml\n<storyboardItem ...>  <!-- 分镜1 -->\n<storyboardItem ...>  <!-- 分镜2 -->\n\`\`\`\n\n编号结果：\n\n| 输入项 | 引用标签 | 说明 |\n|--------|----------|------|\n| [A001, role, 沈辞] | \`@图1 \` | 角色·沈辞 参考图 |\n| [A002, role, 苏锦] | \`@图2 \` | 角色·苏锦 参考图 |\n| [A003, scene, 城楼] | \`@图3 \` | 场景·城楼 参考图 |\n| storyboardItem 第1条 | \`@图4 \` | 分镜图1 |\n| storyboardItem 第2条 | \`@图5 \` | 分镜图2 |\n\n**混合顺序示例**\n\n输入 3 个资产（场景在前）+ 2 条分镜：\n\`\`\`\n资产信息[A003, scene, 城楼], [A001, role, 沈辞], [A002, role, 苏锦]\n\`\`\`\n\`\`\`xml\n<storyboardItem ...>  <!-- 分镜1 -->\n<storyboardItem ...>  <!-- 分镜2 -->\n\`\`\`\n\n编号结果：\n\n| 输入项 | 引用标签 | 说明 |\n|--------|----------|------|\n| [A003, scene, 城楼] | \`@图1 \` | 场景·城楼 参考图 |\n| [A001, role, 沈辞] | \`@图2 \` | 角色·沈辞 参考图 |\n| [A002, role, 苏锦] | \`@图3 \` | 角色·苏锦 参考图 |\n| storyboardItem 第1条 | \`@图4 \` | 分镜图1 |\n| storyboardItem 第2条 | \`@图5 \` | 分镜图2 |\n\n> **关键**：此例中 \`@图1 \` 是场景而非角色，\`@图2 \` \`@图3 \` 才是角色。生成提示词时，必须根据资产的实际 \`type\` 字段确定引用方式，而非根据编号大小假定类型。\n\n---\n\n## 模型提示词生成规则\n\n### 一、通用多参模式\n\n#### 核心原则\n- MVL 多模态融合：自然语言 + 图像引用在同一语义空间\n- 分镜图序列负责动作/时间轴/构图，场景参考图负责环境一致性\n- 所有资产和分镜图统一用 \`@图N \` 引用\n- **严格遵循 videoDesc**：提示词内容严格基于 videoDesc 中的画面描述、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效字段生成，不编造额外内容\n- **台词不可缺失**：videoDesc 中有台词的分镜，必须在 Instruction 中体现台词相关描述\n- **台词类型标注**：区分普通对白（dialogue）、内心独白（inner monologue OS）、画外音（voiceover VO），在 Instruction 中用括号标注\n\n#### prompt 生成模板\n\n> **注意**：\`[References]\` 中的 \`@图N\` 编号严格按资产输入顺序分配，角色/场景/道具可能出现在任意编号位置。生成时需根据每个资产的 \`type\` 字段确定其引用方式，不可假定固定的类型-编号对应关系。\n\n\`\`\`\n[References]\n@图{资产1编号} : [{资产1名称}参考图]   ← 可能是 role/scene/prop 中的任意类型\n@图{资产2编号} : [{资产2名称}参考图]\n@图{资产3编号} : [{资产3名称}参考图]\n...\n@图{分镜图编号} : [分镜图1]            ← 分镜图编号接续资产之后\n\n[Instruction]\nBased on the storyboard @图{分镜图编号} :\n@图{角色资产编号} {动作/状态描述（英文）},\nset in the {场景描述（英文）} of @图{场景资产编号} ,\n{镜头/运镜描述（英文）},\n{情感基调（英文）},\n{台词描述（英文，含 dialogue/OS/VO 标注）/ No dialogue},\n{音效描述（英文）}.\n\`\`\`\n\n#### 生成约束\n1. **Instruction 必须用英文**\n2. **严格遵循 videoDesc**：提示词内容严格基于 videoDesc 的画面描述、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效字段，不编造额外信息\n3. **角色动作**从 videoDesc 的「角色动作」字段提取，翻译为简洁英文动作描述\n4. **台词不可缺失**：videoDesc 中有台词的分镜，必须在 Instruction 中体现台词内容（保持原始语言，不翻译）\n5. **台词类型标注**：普通对白标注 \`(dialogue)\`；内心独白标注 \`(inner monologue, OS)\`；画外音标注 \`(voiceover, VO)\`\n6. **镜头风格**使用标准标签：\`cinematic\` / \`wide-angle\` / \`close-up\` / \`slow motion\` / \`surround shooting\` / \`handheld\`\n7. **空间关系**使用标准动词：\`wearing\` / \`holding\` / \`standing on\` / \`following behind\` / \`sitting in\`\n8. 单条分镜对应单个 \`@图N \`，不做多帧跨镜描述\n9. 无需描述角色外观（由参考图负责）\n10. 无时长标注（由模型推断）\n11. **无分镜图时**：当 \`shouldGenerateImage="false"\` 时，该分镜无分镜图，\`[References]\` 中不列出该分镜图，\`[Instruction]\` 中不使用 \`@图N \` 引用该分镜图，改为纯文本描述画面内容\n\n#### KlingOmni 完整示例\n\n输入：\n\`\`\`\n模型：KlingOmni\n资产信息[A001, role, 沈辞], [A002, role, 苏锦], [A003, scene, 城楼]\n\`\`\`\n\`\`\`xml\n<storyboardItem videoDesc='（沈辞独立城楼远眺苍茫大地、城楼、沈辞/城楼、4s、全景、静止、负手而立衣袂随风飘扬、坚定决绝、黄昏冷调侧逆光、无台词、风声衣袂声、A001/A003）' prompt='全景，平视略仰，城楼之上，沈辞负手而立，衣袂飘扬，黄昏冷调侧逆光...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n<storyboardItem videoDesc='（苏锦登上城楼走向沈辞、城楼、苏锦/沈辞/城楼、4s、中景、跟踪、苏锦拾级而上走向沈辞、担忧、黄昏余晖渐暗、无台词、脚步声风声、A001/A002/A003）' prompt='中景，跟踪，苏锦拾级而上走向城楼上的沈辞...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A002&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\n输出：\n\`\`\`\n[References]\n@图1 : [沈辞参考图]\n@图2 : [苏锦参考图]\n@图3 : [城楼参考图]\n@图4 : [分镜图1]\n@图5 : [分镜图2]\n\n[Instruction]\nBased on the storyboard from @图4 to @图5 :\n@图1 standing alone atop the city wall, hands clasped behind back, robes billowing in the wind, gazing across the vast land,\n@图2 ascending the steps toward @图1 , expression worried,\nset in the ancient city wall environment of @图3 ,\nwide shot transitioning to medium tracking shot, cinematic,\nresolute determination shifting to concerned anticipation, dusk cold-toned side-backlit atmosphere fading,\nno dialogue,\nwind howling, fabric flapping, footsteps on stone.\n\`\`\`\n\n---\n\n### 二、通用首尾帧模式\n\n#### 核心原则\n- **纯文本提示词**：提示词内**不使用任何 \`@图N \` 引用**（不引用角色资产、场景资产、也不引用分镜图），全部内容用纯文本描述\n- **五维度结构**：Visual / Motion / Camera / Audio / Narrative\n- **严格遵循 videoDesc**：提示词内容严格基于 videoDesc 中的画面描述、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效字段生成，不编造额外内容\n- **台词不可缺失**：videoDesc 中有台词的分镜，必须在 \`[Audio]\` 中完整输出台词内容\n- **台词类型标注**：区分普通对白（dialogue, lip-sync active）、内心独白（inner monologue OS, silent lips）、画外音（voiceover VO, silent lips），并在 \`[Audio]\` 中明确标注\n- **不说话的主体标注 \`silent\`** — 防止误生口型\n- **全程单一连贯镜头**：从头到尾一个镜头，不存在切镜\n- **时间轴分段**：每段最低 1 秒，用 \`0s-Xs\` 标注\n\n#### prompt 生成模板\n\n\`\`\`\n[Visual]\n{主体A名}: {外观简述}, {站位/姿态}, {说话状态 speaking/silent}.\n{主体B名}: {外观简述}, {站位/姿态}, {说话状态}.\n{场景描述}, {道具描述}.\n{视觉风格标签}.\n\n[Motion]\n0s-{X}s: {主体A名} {动作描述段1}.\n{X}s-{Y}s: {主体B名} {动作描述段2}.\n\n[Camera]\n{镜头类型}, {运镜方式}, {全程单一连贯镜头描述}.\n\n[Audio]\n{Xs-Ys}: "{台词内容}" — {说话者名} ({dialogue / inner monologue OS / voiceover VO}), {lip-sync active / silent lips}.\n{音效描述}.\n\n[Narrative]\n{情节点概述}, {叙事位置}.\n\`\`\`\n\n#### 生成约束\n1. **全部用英文**\n2. **不使用任何 \`@图N \` 引用**：提示词内不引用角色资产、场景资产、分镜图，全部内容用纯文本描述\n3. **主体用文字描述**：在 [Visual] 中简要描述主体外观特征（如服饰、发型等关键辨识特征）\n4. **严格遵循 videoDesc**：提示词内容严格基于 videoDesc 中的画面描述、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效字段，不编造额外信息\n5. **每个主体必须标注说话状态**：\`speaking\` / \`silent\` / \`speaking simultaneously\`\n6. **台词不可缺失**：videoDesc 中有台词的分镜，必须在 \`[Audio]\` 中完整输出台词内容（保持原始语言，不翻译）\n7. **台词类型标注**：普通对白标注 \`dialogue, lip-sync active\`；内心独白标注 \`inner monologue (OS), silent lips\`；画外音标注 \`voiceover (VO), silent lips\`\n8. **Motion 时间轴**每段最低 1 秒，不超过总时长\n9. **全程单一连贯镜头**：Camera 段落描述从头到尾的一个镜头，绝不切镜\n10. **视觉风格**参考 Assistant 中的「视觉风格约束」部分内容\n11. **镜头类型**从以下选取：\`Wide establishing shot / Over-the-shoulder / Medium shot / Close-up / Wide shot / POV / Dutch angle / Crane up / Dolly right / Whip pan / Handheld / Slow motion\`\n\n#### Seedance 1.5 Pro 完整示例\n\n输入：\n\`\`\`\n模型：Seedance1.5\n资产信息[A001, role, 沈辞], [A002, role, 苏锦], [A003, scene, 城楼]\n\`\`\`\n\`\`\`xml\n<storyboardItem videoDesc='（沈辞独立城楼远眺苍茫大地、城楼、沈辞/城楼、4s、全景、静止、负手而立衣袂随风飘扬、坚定决绝、黄昏冷调侧逆光、无台词、风声衣袂声、A001/A003）' prompt='全景，平视略仰，城楼之上，沈辞负手而立，衣袂飘扬，黄昏冷调侧逆光...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n<storyboardItem videoDesc='（苏锦登上城楼走向沈辞、城楼、苏锦/沈辞/城楼、4s、中景、跟踪、苏锦拾级而上走向沈辞、担忧、黄昏余晖渐暗、无台词、脚步声风声、A001/A002/A003）' prompt='中景，跟踪，苏锦拾级而上走向城楼上的沈辞...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A002&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\n输出：\n\`\`\`\n[Visual]\nShen Ci: male, dark flowing robes, hair tied up, standing alone atop city wall, hands clasped behind back, robes billowing, silent.\nSu Jin: female, light-colored dress, hair partially down, ascending steps toward Shen Ci, expression worried, silent.\nAncient city wall, vast open land beyond, dusk sky fading.\nCinematic, photorealistic, 4K, high contrast, desaturated tones, shallow depth of field.\n\n[Motion]\n0s-4s: Shen Ci stands still on city wall edge, robes flutter in wind, hair sways gently. Gaze fixed on distant horizon.\n4s-8s: Su Jin climbs the last few steps onto the wall, walks toward Shen Ci. Shen Ci remains still, unaware. Su Jin slows as she approaches.\n\n[Camera]\nWide establishing shot, static for first 4 seconds capturing the lone figure. Then smooth transition to medium tracking shot following the woman ascending steps, single continuous take throughout, no cuts.\n\n[Audio]\n0s-4s: Wind howling across wall, fabric flapping rhythmically. No dialogue.\n4s-8s: Footsteps on stone, robes rustling. No dialogue.\nShen Ci — silent. Su Jin — silent.\n\n[Narrative]\nLone figure on city wall, then arrival of a companion. Tension between determination and concern. Single continuous take.\n\`\`\`\n\n---\n\n### 三、Seedance 2.0\n\n#### 核心原则\n- **结构化12维编码**：统一用 \`@图N \` 引用资产和分镜图，时长 \`{N}s\`\n- **最前面先定义图片映射**：先输出“图片定义”段，集中声明 \`@图N : 主体名字/场景名字，简述\`；后续分镜正文只使用主体名字，不再写 \`@图N \`\n- **音色参数9维度精细描述**（有台词时必填）\n- **秒级时长控制**：单分镜时长最低 1s\n- **中文提示词**\n- **严格遵循 videoDesc**：每条分镜的描述内容严格基于 videoDesc 中的画面描述、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效字段生成，不编造额外内容\n- **台词不可缺失**：videoDesc 中有台词的分镜，必须完整输出台词和音色描述\n- **台词类型标注**：区分普通对白（直接使用「说：」）、内心独白（使用「内心OS：」）、画外音（使用「画外音VO：」），并匹配对应的嘴型状态描述\n\n#### prompt 生成模板\n\n> **注意**：\`@图{编号}\` 仅用于最前面的“图片定义”段。分镜正文中禁止再写 \`@图{编号}\`，统一改用主体名字/场景名字。\n\n**单分镜模板：**\n\`\`\`\n画面风格和类型: {风格}, {色调}, {类型}\n\n图片定义:\n@图1: {资产1名字}，{简述}\n@图2: {资产2名字}，{简述}\n@图N: {资产N名字}，{简述}\n...\n\n生成一个由以下 1 个分镜组成的视频:\n\n场景:\n分镜过渡: 无\n\n分镜1 {N}s: 时间：{日/夜/晨/黄昏}，场景：{场景名字}，镜头：{景别}，{角度}，{运镜}，{角色名字} {动作/表情/视线朝向/站位描述}。{台词与音色描述（如有）}。{背景环境补充}。{光影氛围}。{运镜补充}。\n\`\`\`\n\n**多分镜模板：**\n\`\`\`\n画面风格和类型: {风格}, {色调}, {类型}\n\n图片定义:\n@图1: {资产1名字}，{简述}\n@图2: {资产2名字}，{简述}\n@图N: {资产N名字}，{简述}\n...\n\n生成一个由以下 {N} 个分镜组成的视频:\n\n场景:\n分镜过渡: {全局过渡描述}\n\n分镜1 {N}s: 时间：{...}，场景：{场景名字}，镜头：{...}，{角色名字} {...}。{...}。\n分镜2{N}s: ...\n...\n\`\`\`\n\n#### 音色生成规则（有台词时必填）\n\n台词格式：\`{角色名字} 说：「{台词内容}」音色：{9维度描述}\`\n\n9维度按顺序填写：\n\`\`\`\n{性别}，{年龄音色}，{音调}，{音色质感}，{声音厚度}，{发音方式}，{气息}，{语速}，{特殊质感}\n\`\`\`\n\n> 当 desc 中未明确音色信息时，根据角色类型从以下参考表推断：\n\n| 角色类型特征 | 默认音色 |\n|------------|---------|\n| 男性权威/霸气角色 | 男声，中年音色，音调低沉，音色浑厚有力，声音厚重，发音标准，气息极其沉稳，语速偏慢 |\n| 女性温柔/甜美角色 | 女声，青年音色，音调中等偏高，音色质感明亮清脆，声音清亮柔和，气息充沛平稳，带温婉真诚感 |\n| 男性年轻/普通角色 | 男声，青年音色，音调中等，音色干净，声音厚度适中，发音清晰，气息平稳，语速适中 |\n| 女性活泼/外向角色 | 女声，青年音色，音调偏高，音色清脆活泼，声音轻盈，气息充沛，语速偏快，带笑意和感染力 |\n| 反派/冷酷角色 | 男声，中年音色，音调低沉，音色质感干燥偏暗，声音带沙砾感，气息平稳，语速极慢，有威胁感 |\n\n#### 无台词分镜处理\n- 不写 \`说：\` 和音色段落\n- 在动作描述后标注 \`无台词\`\n\n#### 台词类型格式\n\n| 台词类型 | 格式 | 嘴型描述 |\n|----------|------|----------|\n| 普通对白 | \`{角色名字} 说：「{台词}」音色：{9维度}\` | 角色嘴部开合说话 |\n| 内心独白 | \`{角色名字} 内心OS：「{台词}」音色：{9维度}\` | 角色嘴部紧闭不动 |\n| 画外音 | \`{角色名字} 画外音VO：「{台词}」音色：{9维度}\` | 角色嘴部紧闭不动（或角色不在画面中） |\n\n#### 生成约束\n1. **中文提示词**\n2. **直接输出视频提示词**：禁止输出任何分析过程、推理步骤、模型匹配说明、资产编号表、分隔线等非提示词内容。第一行必须是 \`画面风格和类型:\`\n3. **严格遵循 videoDesc**：每条分镜内容严格基于 videoDesc 的画面描述、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效字段，不编造额外信息\n4. **台词不可缺失**：videoDesc 中有台词的分镜，必须完整输出台词和音色\n5. **台词类型正确标注**：普通对白用「说：」，内心独白用「内心OS：」，画外音用「画外音VO：」\n6. **先图片定义，后写分镜**：最前面必须先输出"图片定义"段，列出 \`@图N : 名字，描述\`\n7. **分镜正文禁用 \`@图N \`**：正文统一使用角色名/场景名，不写 \`@图1/@图2\` 等编号\n8. **单分镜时长最低 1s**\n9. **时长单位**：直接使用 videoDesc 中的秒数，格式为 \`{N}s\`（如 \`4s\`），最低 1s\n\n#### Seedance 2.0 完整示例\n\n输入：\n\`\`\`\n模型：Seedance2.0\n资产信息[A001, role, 沈辞], [A002, role, 苏锦], [A003, scene, 城楼]\n\`\`\`\n\`\`\`xml\n<storyboardItem videoDesc='（沈辞独立城楼远眺苍茫大地、城楼、沈辞/城楼、4s、全景、静止、负手而立衣袂随风飘扬、坚定决绝、黄昏冷调侧逆光、无台词、风声衣袂声、A001/A003）' prompt='全景，平视略仰，城楼之上，沈辞负手而立，衣袂飘扬，黄昏冷调侧逆光...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n<storyboardItem videoDesc='（苏锦登上城楼走向沈辞、城楼、苏锦/沈辞/城楼、4s、中景、跟踪、苏锦拾级而上走向沈辞、担忧、黄昏余晖渐暗、苏锦说：你又一个人在这里、脚步声风声、A001/A002/A003）' prompt='中景，跟踪，苏锦拾级而上走向城楼上的沈辞...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A002&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\n输出：\n\`\`\`\n画面风格和类型: 真人写实, 电影风格, 冷调, 古风\n\n参考定义:\n@图1: 沈辞，黑色长袍，气质冷峻的青年男性\n@图2: 苏锦，浅色衣裙，神情细腻的青年女性\n@图3: 城楼，古代砖石城楼与台阶场景\n\n生成一个由以下 2 个分镜组成的视频:\n\n场景:\n分镜过渡: 镜头平滑切换，从全景过渡到中景跟踪，焦点从沈辞独处转向苏锦到来。\n\n分镜1 4s: 时间：黄昏，场景：城楼，镜头：全景，平视略仰，静止镜头，沈辞独立城楼之上，负手而立，衣袂随风飘扬，目光远眺苍茫大地，神情肃然面容沉着，眼神坚定目光清冽，眉眼沉静气质凛然。无台词。背景是古城楼砖石纹理清晰，远方大地苍茫辽阔，天际线冷暖交替。黄昏斜射余晖侧逆光，冷调为主，长影拉伸，轮廓光微勾勒人物边缘，光感诗意。镜头静止。\n\n分镜2 4s: 时间：黄昏，场景：城楼，镜头：中景，平视，跟踪拍摄，苏锦拾级而上，走向城楼上的沈辞，面部朝向沈辞方向，神情微愣面色微变，眼神中带着担忧，苏锦说：「你又一个人在这里。」音色：女声，青年音色，音调中等偏高，音色质感明亮清脆，声音清亮柔和，发音方式干净，气息充沛平稳，语速适中，带温婉真诚感。背景城楼台阶纹理清晰，余晖渐暗，天际线冷暖交替加深。镜头跟踪苏锦移动。\n\`\`\`\n\n---\n\n### 四、Wan 2.6\n\n#### 核心原则\n- **单图首帧模式**：归类为首尾帧模式，但仅有首帧（分镜图），无尾帧\n- **单条分镜输入/输出**：每次仅输入一条 \`<storyboardItem>\` 及其关联资产信息，输出也仅为一段完整的叙事式提示词\n- **叙事式英文提示词**：像写小说一样描写画面，不使用标签罗列（不写 \`4K, cinematic, high quality\` 这类堆砌）\n- **三段式结构**：风格基调 → 主体动作 + 场景环境 + 光线氛围 → 镜头收尾\n- **纯文本提示词**：提示词内**不使用任何 \`@图N \` 引用**，全部内容用纯文本描述\n- **严格遵循 videoDesc**：提示词内容严格基于 videoDesc 中的画面描述、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效字段生成，不编造额外内容\n- **台词不可缺失**：videoDesc 中有台词的分镜，必须在提示词中体现台词相关描述\n- **台词类型标注**：区分普通对白（dialogue）、内心独白（inner monologue OS）、画外音（voiceover VO），在提示词中用括号标注\n\n#### prompt 生成模板\n\n每次输入一条分镜，输出一段完整提示词（无编号前缀），格式如下：\n\n\`\`\`\n{风格基调一句话定性},\n{主体名} {外观简述}, {具体动作/姿态描述}, {情绪/表情用动作暗示}.\n{场景背景主体}, {具体环境物件}, {空间感}, {时间/天气}.\n{光线方向/色温} {质感描述}, {情绪暗示光影}.\n{台词描述（如有，含 dialogue/OS/VO 标注）/ No dialogue}.\n{音效描述}.\n{拍摄方式}, {景别}, {视角}, {运镜方式}.\n\`\`\`\n\n#### 叙事式写法要点\n\n| 原则 | 说明 | 示例 |\n|------|------|------|\n| 风格基调放最前 | 一句话定性整体气质 | \`A cinematic epic scene\` / \`A melancholic cinematic scene\` |\n| 主体+动作紧密绑定 | 主体后面直接跟动作，外观细节嵌入主体描述 | \`A young man in dark flowing robes stands alone atop the city wall, hands clasped behind back\` |\n| 情绪用动作暗示 | 不直接陈述「他很悲伤」 | ❌ \`He is sad.\` → ✅ \`head drops slowly, shoulders slumped\` |\n| 环境融入叙事 | 不罗列环境属性 | ❌ \`The sky is blue. The grass is green.\` → ✅ \`hazy blue sky stretches over the emerald valley\` |\n| 光线单独成句 | 光线方向+色温+质感+情绪 | \`Warm golden hour light streams from behind, casting long shadows across the stone floor\` |\n| 镜头语言收尾 | 一句话点睛 | \`Captured in a wide establishing shot from a low-angle perspective, static camera\` |\n| 禁止标签堆砌 | 不写 \`4K, cinematic, high quality\` | \`cinematic\` 融入风格基调即可 |\n\n#### 生成约束\n1. **全部用英文**\n2. **不使用任何 \`@图N \` 引用**：提示词内不引用角色资产、场景资产、分镜图，全部内容用纯文本描述\n3. **叙事式描写**：像写小说一样构建画面，禁止标签罗列和配置清单式写法\n4. **主体用文字描述**：简要描述主体外观特征（如服饰、发型等关键辨识特征），嵌入主体描述中\n5. **严格遵循 videoDesc**：提示词内容严格基于 videoDesc 中的画面描述、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效字段，不编造额外信息\n6. **台词不可缺失**：videoDesc 中有台词的分镜，必须在提示词中完整输出台词内容（保持原始语言，不翻译）\n7. **台词类型标注**：普通对白标注 \`(dialogue)\`；内心独白标注 \`(inner monologue, OS)\`；画外音标注 \`(voiceover, VO)\`\n8. **单条输入/输出**：每次仅处理一条分镜，输出一段提示词，无编号前缀\n9. **无需标注时长**：时长由模型侧控制，提示词中不写时长参数\n10. **镜头描述融入叙事**：不用方括号标签，用完整句子描述镜头\n11. **视觉风格**参考 Assistant 中的「视觉风格约束」部分内容\n\n#### Wan 2.6 完整示例\n\n**示例1：无台词分镜**\n\n输入：\n\`\`\`\n模型：Wan2.6\n资产信息[A001, role, 沈辞], [A003, scene, 城楼]\n\`\`\`\n\`\`\`xml\n<storyboardItem videoDesc='（沈辞独立城楼远眺苍茫大地、城楼、沈辞/城楼、4s、全景、静止、负手而立衣袂随风飘扬、坚定决绝、黄昏冷调侧逆光、无台词、风声衣袂声、A001/A003）' prompt='全景，平视略仰，城楼之上，沈辞负手而立，衣袂飘扬，黄昏冷调侧逆光...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\n输出：\n\`\`\`\nA cinematic epic scene with a cold, desaturn\`ated palette,\nA lone man in dark flowing robes stands atop an ancient city wall, hands clasped behind his back, robes and hair billowing in the wind, gaze fixed on the vast land stretching to the horizon, jaw set firm, eyes unwavering.\nThe weathered stone battlements frame the endless expanse below, rolling terrain fading into haze beneath a heavy dusk sky, clouds layered in muted golds and slate greys.\nCold side-backlight from the setting sun carves a sharp silhouette, long shadows stretching across the stone floor, a faint warm rim outlining the figure against the cool atmosphere.\nNo dialogue.\nWind howling across the open wall, fabric flapping rhythmically.\nCaptured in a wide establishing shot from a slightly low angle, static camera, single continuous take.\n\`\`\`\n\n**示例2：有台词分镜**\n\n输入：\n\`\`\`\n模型：Wan2.6\n资产信息[A001, role, 沈辞], [A002, role, 苏锦], [A003, scene, 城楼]\n\`\`\`\n\`\`\`xml\n<storyboardItem videoDesc='（苏锦登上城楼走向沈辞、城楼、苏锦/沈辞/城楼、4s、中景、跟踪、苏锦拾级而上走向沈辞、担忧、黄昏余晖渐暗、苏锦说：你又一个人在这里、脚步声风声、A001/A002/A003）' prompt='中景，跟踪，苏锦拾级而上走向城楼上的沈辞...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A002&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\n输出：\n\`\`\`\nA melancholic cinematic scene, dusk tones deepening,\nA young woman in a light-colored dress ascends the final stone steps onto the city wall, her gaze locked on the lone figure ahead, brow slightly furrowed, pace slowing as she approaches, lips parting softly.\nThe ancient city wall stretches behind her, weathered stairs leading up from below, the distant skyline dimming as the last traces of golden hour fade into twilight.\nFading warm light mingles with rising cool blue tones, the contrast between the two figures softened by the diffused remnants of sunset.\n"你又一个人在这里。" — Su Jin (dialogue).\nFootsteps on stone, wind sweeping across the battlements, fabric rustling.\nA medium tracking shot follows the woman from behind as she ascends and approaches, handheld camera with subtle movement, single continuous take.\n\`\`\`\n\n---\n\n## 景别 → 镜头标签映射\n\n| videoDesc 中的景别 | KlingOmni（英文标签） | Seedance 1.5（英文标签） | Seedance 2.0（中文描述） | Wan 2.6（英文叙事式） |\n|------|------|------|------|------|\n| 远景 | extreme wide shot | Extreme wide shot | 远景 | an extreme wide shot capturing the vast expanse |\n| 全景 | wide shot | Wide establishing shot | 全景 | a wide establishing shot |\n| 中景 | medium shot | Medium shot | 中景 | a medium shot |\n| 近景 | close-up | Close-up | 近景 | a close-up shot |\n| 特写 | close-up | Close-up | 特写 | a close-up capturing fine detail |\n| 大特写 | extreme close-up | Extreme close-up | 大特写 | an extreme close-up |\n\n## 运镜 → 镜头标签映射\n\n| videoDesc 中的运镜 | KlingOmni（英文标签） | Seedance 1.5（英文标签） | Seedance 2.0（中文描述） | Wan 2.6（英文叙事式） |\n|------|------|------|------|------|\n| 静止 | static camera | Static, no camera movement | 镜头静止 | static camera, locked off |\n| 推进 | dolly in / push in | Slow dolly forward | 镜头缓慢向前推进 | camera slowly pushing in |\n| 拉远 | dolly out / pull back | Slow dolly backward pull | 镜头缓慢向后拉远 | camera gently pulling back |\n| 跟踪 | tracking shot | Tracking shot, handheld | 跟踪拍摄 | tracking shot following the subject |\n| 摇镜 | pan left/right | Slow pan | 镜头缓慢摇移 | smooth pan across the scene |\n| 甩镜 | whip pan | Whip pan | 快速甩镜 | whip pan |\n| 升降 | crane up/down | Crane up/down | 镜头升降 | crane rising / descending |\n| 环绕 | surround shooting | Orbiting shot | 环绕拍摄 | orbiting around the subject |\n\n---\n\n## 执行流程\n\n1. **解析输入**：提取模型名和多参标志，按路由规则匹配模式；提取资产列表\n2. **构建 @图N 编号表**：资产按输入顺序从 \`@图1 \` 起编号，分镜图接续编号；\`shouldGenerateImage="false"\` 的分镜不分配分镜图编号\n3. **逐条解析 \`<storyboardItem>\`**：按 videoDesc 解析规则提取12个字段，结合 \`duration\`、\`associateAssetsIds\` 建立标签映射\n4. **整合为一个完整的视频提示词**：按目标模型格式编排全部分镜\n5. **输出视频提示词**\n\n---\n\n## 约束\n\n- **仅输出视频提示词**：不附加任何解释、注释、分析过程、推理步骤、模型匹配说明、资产编号表、分隔线（\`---\`）或额外说明，只输出视频提示词文本。禁止在提示词前后输出任何非提示词内容\n- **严格遵循 videoDesc**（全模式通用）：提示词内容严格基于 videoDesc 中的画面描述、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效字段生成，不编造额外内容\n- **台词不可缺失**（全模式通用）：videoDesc 中有台词的分镜，必须在提示词中完整体现台词内容，不得遗漏\n- **台词保持原始输入**（全模式通用）：台词内容严禁翻译，必须保持 videoDesc 中的原始语言原样输出\n- **台词类型标注**（全模式通用）：必须区分普通对白（dialogue / 说）、内心独白（OS / 内心OS）、画外音（VO / 画外音VO），并在提示词中正确标注\n- **时间跨度最低 1 秒**（全模式通用）：所有模式中涉及时间分段（Motion 时间轴 / Seedance 2.0 分镜时长 {N}s）的最小粒度为 1 秒（1s），禁止出现 0.5 秒等低于 1 秒的间隔\n- **视觉风格**：风格相关描述参考 Assistant 中的「视觉风格约束」部分内容，不在本 Skill 内自行定义风格\n- **严格按匹配到的模式格式**，不混用不同模式的格式\n- **不修改原始输入**：不改写 \`<storyboardItem>\` 的任何字段；\`prompt\` 已有的分镜图提示词仅作画面参考\n- **不编造资产或台词**：只使用输入中的资产信息；无台词则标注「无台词」/ \`No dialogue\`\n- **时长单位**：Seedance 2.0 的分镜时长直接使用秒，格式为 \`{N}s\`（如 \`4s\`），最低 1s\n`,
  });

  //迁移供应商函数
  const data = await knex("o_vendorConfig").select("*");
  for (const item of data) {
    let { id, code } = item;
    const filename = `${id}.ts`;
    const rootDir = u.getPath("vendor");
    if (!code && fs.existsSync(path.join(rootDir, filename))) continue;
    if (!fs.existsSync(rootDir)) fs.mkdirSync(rootDir, { recursive: true });
    if (!fs.existsSync(path.join(rootDir, filename))) {
      code = vendorData[filename] || code;
      code = code ?? "";
      fs.writeFileSync(path.join(rootDir, filename), code);
    }
  }
  const defList = Object.keys(vendorData).map((filename) => filename.replace(/\.ts$/, ""));
  const existingIds = data.map((i: any) => i.id);
  for (const id of defList) {
    if (!existingIds.includes(id)) {
      const tsCode = vendorData[`${id}.ts`];
      if (tsCode) await tempOnsert(tsCode);
    }
  }

  await dropColumn("o_vendorConfig", "author");
  await dropColumn("o_vendorConfig", "description");
  await dropColumn("o_vendorConfig", "name");
  await dropColumn("o_vendorConfig", "icon");
  await dropColumn("o_vendorConfig", "inputs");
  await dropColumn("o_vendorConfig", "createTime");

  const volcengineVer = await u.vendor.getVendor("volcengine").version;
  if (Number(volcengineVer) < 2.4) {
    u.vendor.writeCode("volcengine", vendorData["volcengine.ts"]);
  }
  const minimaxVer = await u.vendor.getVendor("minimax").version;
  if (Number(minimaxVer) < 2.1) {
    u.vendor.writeCode("minimax", vendorData["minimax.ts"]);
  }
  const toonflowVer = await u.vendor.getVendor("toonflow").version;
  if (Number(toonflowVer) < 3.2) {
    u.vendor.writeCode("toonflow", vendorData["toonflow.ts"]);
  }
};

async function tempOnsert(tsCode: string) {
  const jsCode = transform(tsCode, { transforms: ["typescript"] }).code;
  const exports = u.vm(jsCode);
  const vendor = exports.vendor;
  const data = await u.db("o_vendorConfig").where("id", vendor.id).first();
  if (data) return;
  await u.db("o_vendorConfig").insert({
    id: vendor.id,
    inputValues: JSON.stringify(vendor.inputValues ?? {}),
    models: JSON.stringify([]),
    enable: vendor.id == "toonflow" ? 1 : 0,
  });
  u.vendor.writeCode(vendor.id, tsCode);
}
