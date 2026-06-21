import { Knex } from "knex";
import { v4 as uuid } from "uuid";
import { getEmbedding } from "@/utils/agent/embedding";

interface TableSchema {
  name: string;
  builder: (table: Knex.CreateTableBuilder) => void;
  initData?: (knex: Knex) => Promise<void>;
}

export default async (knex: Knex, forceInit: boolean = false): Promise<void> => {
  const tables: TableSchema[] = [
    // 用户表
    {
      name: "o_user",
      builder: (table) => {
        table.integer("id").notNullable();
        table.text("name");
        table.text("password");
        table.primary(["id"]);
        table.unique(["id"]);
      },
      initData: async (knex) => {
        await knex("o_user").insert([{ id: 1, name: "admin", password: "admin123" }]);
      },
    },
    //项目表
    {
      name: "o_project",
      builder: (table) => {
        table.integer("id");
        table.string("projectType");
        table.string("imageModel");
        table.string("imageQuality");
        table.string("videoModel");
        table.text("name");
        table.text("intro");
        table.text("type");
        table.text("artStyle");
        table.text("directorManual");
        table.text("mode");
        table.text("videoRatio");
        table.integer("createTime");
        table.integer("userId");
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    //风格表
    {
      name: "o_artStyle",
      builder: (table) => {
        table.integer("id").notNullable();
        table.string("name");
        table.text("fileUrl");
        table.text("label");
        table.text("prompt");
        table.primary(["id"]);
        table.unique(["id"]);
      },
      initData: async (knex) => {},
    },
    //Agent配置表
    {
      name: "o_agentDeploy",
      builder: (table) => {
        table.integer("id").notNullable();
        table.string("model");
        table.string("key");
        table.string("modelName");
        table.text("vendorId");
        table.string("desc");
        table.string("name");
        table.integer("temperature");
        table.integer("maxOutputTokens");
        table.boolean("disabled").defaultTo(false);
        table.primary(["id"]);
        table.unique(["id"]);
      },
      initData: async (knex) => {
        await knex("o_agentDeploy").insert([
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "scriptAgent",
            name: "剧本Agent",
            desc: "用于读取原文生成故事骨架、改编策略，建议使用具备强大文本理解和生成能力的模型",
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent",
            name: "生产Agent",
            desc: "对工作流进行调度和管理，建议使用具备较强的逻辑推理和任务管理能力的模型",
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "universalAi",
            name: "通用AI",
            desc: "用于小说事件提取、资产提示词生成、台词提取等边缘功能，建议使用具备较强文本处理能力的模型",
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "ttsDubbing",
            name: "TTS配音",
            desc: "根据剧本内容生成角色配音，支持多种声音风格和情绪",
            disabled: true,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "scriptAgent:decisionAgent",
            name: "剧本Agent:决策层",
            desc: "决策层",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "scriptAgent:supervisionAgent",
            name: "剧本Agent:监督层",
            desc: "监督层",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "scriptAgent:storySkeletonAgent",
            name: "剧本Agent:故事骨架",
            desc: "故事骨架生成",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "scriptAgent:adaptationStrategyAgent",
            name: "剧本Agent:改编策略",
            desc: "改编策略生成",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "scriptAgent:scriptAgent",
            name: "剧本Agent:剧本生成",
            desc: "剧本生成",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:decisionAgent",
            name: "生产Agent:决策层",
            desc: "决策层",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:supervisionAgent",
            name: "生产Agent:监督层",
            desc: "监督层",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:deriveAssetsAgent",
            name: "生产Agent:衍生资产",
            desc: "衍生资产",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:generateAssetsAgent",
            name: "生产Agent:生成资产",
            desc: "生成资产",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:directorPlanAgent",
            name: "生产Agent:导演规划",
            desc: "导演规划",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:storyboardGenAgent",
            name: "生产Agent:分镜生成",
            desc: "分镜生成",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:storyboardPanelAgent",
            name: "生产Agent:分镜面板",
            desc: "分镜面板生成",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:storyboardTableAgent",
            name: "生产Agent:分镜表格",
            desc: "分镜表格生成",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
        ]);
      },
    },
    //设置表
    {
      name: "o_setting",
      builder: (table) => {
        table.text("key");
        table.text("value");
        table.primary(["key"]);
        table.unique(["key"]);
      },
      initData: async (knex) => {
        await knex("o_setting").insert([
          {
            key: "tokenKey",
            value: uuid().slice(0, 8),
          },
          {
            key: "messagesPerSummary",
            value: 10,
          },
          {
            key: "shortTermLimit",
            value: 5,
          },
          {
            key: "summaryMaxLength",
            value: 500,
          },
          {
            key: "summaryLimit",
            value: 10,
          },
          {
            key: "ragLimit",
            value: 3,
          },
          {
            key: "deepRetrieveSummaryLimit",
            value: 5,
          },
          {
            key: "modelOnnxFile",
            value: '["all-MiniLM-L6-v2", "onnx", "model_fp16.onnx"]',
          },
          {
            key: "modelDtype",
            value: "fp16",
          },
          {
            key: "switchAiDevTool",
            value: "0",
          },
        ]);
      },
    },
    //任务中心表
    {
      name: "o_tasks",
      builder: (table) => {
        table.integer("id").notNullable();
        table.integer("projectId");
        table.string("taskClass");
        table.string("relatedObjects");
        table.string("model");
        table.text("describe");
        table.string("state");
        table.integer("startTime");
        table.text("reason");
        table.text("promptHash");
        table.integer("promptVersionId");
        table.text("promptSource");
        table.primary(["id"]);
        table.unique(["id"]);
      },
      initData: async (knex) => {},
    },
    //任务进度事件表
    {
      name: "o_taskProgress",
      builder: (table) => {
        table.integer("id").notNullable();
        table.integer("taskId").notNullable();
        table.integer("projectId").notNullable();
        table.integer("scriptId");
        table.string("phase");
        table.string("status");
        table.text("message");
        table.integer("current");
        table.integer("total");
        table.text("meta");
        table.integer("createTime");
        table.integer("updateTime");
        table.primary(["id"]);
        table.unique(["id"]);
        table.index(["taskId"]);
        table.index(["projectId", "scriptId"]);
      },
      initData: async (knex) => {},
    },
    //提示词表
    {
      name: "o_prompt",
      builder: (table) => {
        table.integer("id").notNullable();
        table.string("name");
        table.string("type");
        table.text("data");
        table.text("useData");
        table.primary(["id"]);
        table.unique(["id"]);
      },
      initData: async (knex) => {
        await knex("o_prompt").insert([
          {
            name: "事件提取",
            type: "eventExtraction",
            data: `# 事件提取指令\n\n你是小说文本分析助手。用户每次提供一个章节的原文，你提取该章的结构化事件信息。\n\n## ⚠️ 输出约束（最高优先级，违反任何一条即为失败）\n\n1. 你的**完整回复**只有一行，以 \`|\` 开头、以 \`|\` 结尾，恰好 7 个字段\n2. 回复的**第一个字符**必须是 \`|\`，**最后一个字符**必须是 \`|\`\n3. \`|\` 之前不许有任何字符——没有引导语、没有解释、没有"根据……"、没有"以下是……"\n4. \`|\` 之后不许有任何字符——没有总结、没有提取说明、没有改编建议\n5. 不输出表头行、分隔线、Markdown 标题、emoji、代码块标记\n\n## 输出格式\n\n\`\`\`\n| 第X章 {章节标题} | {涉及角色} | {核心事件} | {主线关系} | {信息密度} | {预估集长} | {情绪强度} |\n\`\`\`\n\n### 字段规范\n\n| 字段 | 格式要求 | 示例 |\n|------|----------|------|\n| 章节 | \`第X章 {章节标题}\` | \`第1章 职业危机与许愿\` |\n| 涉及角色 | 有实际戏份的角色，顿号分隔 | \`林逸、白有容\` |\n| 核心事件 | 30-60字，必须含动作+结果 | \`林逸因解密风潮事业崩塌，颓废中许愿触发魔法系统绑定\` |\n| 主线关系 | **必须**为 \`强/中/弱（3-8字理由）\` | \`强（动机建立+系统激活）\` |\n| 信息密度 | \`高\` / \`中\` / \`低\` | \`高\` |\n| 预估集长 | **必须**为 \`X秒\`，禁止用分钟 | \`50秒\` |\n| 情绪强度 | 文字标签，\`+\` 连接，禁止星级/数字 | \`转折+悬疑\` |\n\n**主线关系判定**：强＝直接推动主角弧线；中＝补充世界观/人物关系/伏笔；弱＝过渡/气氛。\n\n**预估集长参考**：高密度+高情绪→45-60秒；中→35-45秒；低→25-35秒。\n\n**可用情绪标签**：\`冲突\`、\`恐怖\`、\`情感\`、\`转折\`、\`高潮\`、\`平铺\`、\`喜剧\`、\`悬疑\`、\`情感崩溃\`。\n\n## 输出示例\n\n以下两个示例展示的是**完整回复**——除这一行外没有任何其他内容：\n\n\`\`\`\n| 第1章 职业危机与许愿 | 林逸 | 职业魔术师林逸因解密打假风潮导致事业崩塌，颓废中感慨"如果会魔法就好了"，意外触发神奇魔法系统绑定 | 强（主角动机建立+系统激活） | 高 | 50秒 | 转折+悬疑 |\n\`\`\`\n\`\`\`\n| 第12章 山间小憩 | 凌玄、苏晚卿 | 凌玄与苏晚卿在山间歇脚，苏晚卿回忆幼时往事，两人关系略有缓和但未实质推进 | 弱（气氛过渡） | 低 | 25秒 | 平铺+情感 |\n\`\`\`\n\n## 提取规则\n\n- 忠于原文，不推测、不脑补、不加入原文未出现的情节\n- 角色使用文中主要称呼，保持一致\n- 多条平行事件线时，选对主角影响最大的一条，其余简要带过\n- 对话密集章节，关注对话推动了什么结果，而非复述对话内容`,
          },
          {
            name: "剧本资产提取",
            type: "scriptAssetExtraction",
            data: `---\nname: universal_agent\ndescription: 专注于从剧本内容中提取所使用的资产（角色、场景、道具）并生成结构化资产列表的助手。\n---\n\n# Script Assets Extract\n\n你是一个专业的剧本内容分析助手，专注于从剧本文本中识别和提取所有涉及的资产（角色、场景、道具），并为每项资产生成可供下游制作流程使用的结构化描述和提示词。\n\n## 何时使用\n\n用户提供剧本内容，你需要逐段阅读并提取其中涉及的所有资产（人物角色、场景地点、道具物件），输出为结构化的资产列表。产出的资产描述将用于后续 AI 图片生成和制作流程。\n\n## 与系统的对应关系\n\n- 资产类型：\n  - \`role\` — 角色（对应 \`o_assets.type = "role"\`）\n  - \`scene\` — 场景（对应 \`o_assets.type = "scene"\`）\n  - \`tool\` — 道具（对应 \`o_assets.type = "tool"\`）\n- 下游用途：资产提示词生成 → AI 资产图生成 → 分镜制作\n\n## 输出要求\n\n**必须通过调用 \`resultTool\` 工具返回结果**，禁止以纯文本、Markdown 表格或 JSON 代码块等形式直接输出资产列表。\n\`resultTool\` 的 schema 会对字段类型和枚举值做强校验，调用时请严格按照下方字段定义填写，确保数据结构正确、字段完整、类型匹配。\n\n每个资产对象包含以下字段：\n\n| 字段 | 类型 | 必填 | 说明 |\n| ---- | ---- | ---- | ---- |\n| \`name\` | string | 是 | 资产名称，使用剧本中的原始称呼,不做其他多余描述 |\n| \`desc\` | string | 是 | 资产描述，30-80 字的视觉化描述 |\n| \`prompt\` | string | 是 | 生成提示词，英文，用于 AI 图片生成 |\n| \`type\` | enum | 是 | 资产类型：\`role\` / \`scene\` / \`tool\`  |\n\n## 提取规则\n\n### 角色（role）\n\n- 提取剧本中出现的所有有名字的角色\n- \`desc\`：包含外貌特征、服饰风格、体态气质等视觉要素\n- \`prompt\`：英文提示词，描述角色的外观特征，适用于 AI 角色图生成\n- 同一角色有多个称呼时，取最常用的作为 \`name\`\n- 无名龙套（如"路人甲"、"士兵"）可跳过，除非其造型对剧情有重要视觉意义\n\n### 场景（scene）\n\n- 提取剧本中出现的所有场景/地点\n- \`desc\`：包含空间结构、光照氛围、关键陈设、色调基调等视觉要素\n- \`prompt\`：英文提示词，描述场景的整体视觉风格，适用于 AI 场景图生成\n- 同一场景的不同状态（如白天/夜晚）不重复提取，在 \`desc\` 中注明即可\n\n### 道具（tool）\n\n- 提取剧本中出现的重要道具/物品\n- \`desc\`：包含外观形状、颜色材质、尺寸参考、特殊效果等视觉要素\n- \`prompt\`：英文提示词，描述道具的外观细节，适用于 AI 道具图生成\n- 仅提取有独立视觉意义或剧情功能的道具，通用物品可跳过\n\n\n## 提示词（prompt）生成规范\n\n- 采用逗号分隔的关键词/短语格式\n- 优先描述**视觉特征**，避免抽象概念\n- 包含风格关键词（如 anime style, manga style 等，根据项目风格决定）\n- 角色 prompt 示例：\`a young man, sharp eyebrows, black hair, pale skin, wearing a gray Taoist robe, slender build, cold expression\`\n- 场景 prompt 示例：\`dark cave interior, glowing crystals on walls, misty atmosphere, dim blue lighting, stone altar in center\`\n- 道具 prompt 示例：\`ancient jade pendant, oval shape, translucent green, carved dragon pattern, glowing faintly\`\n\n## 提取流程\n\n1. 通读剧本全文，识别所有出现的角色、场景、道具\n2. 对每个资产生成结构化的 \`name\`、\`desc\`、\`prompt\`、\`type\`\n3. 去重：同一资产不重复提取\n4. **必须通过调用 \`resultTool\` 工具输出完整资产列表**，不要分多次调用，一次性将所有资产放入 \`assetsList\` 数组中提交\n\n## 提取原则\n\n1. **忠于剧本**：所有提取基于剧本中的实际内容，不臆造未出现的资产\n2. **视觉优先**：描述和提示词聚焦视觉特征，便于 AI 图片生成\n3. **精简实用**：只提取对制作有实际意义的资产，避免过度提取\n4. **分类准确**：严格按照 role/scene/tool 分类，不混淆\n5. **提示词质量**：英文提示词应具体、可执行，能直接用于 AI 图片生成\n\n## 注意事项\n\n- 资产列表中**不要包含剧本内容本身**，仅提取所使用到的资产\n- 角色的随身物品如果有独立剧情功能，应单独作为道具提取\n- 场景中的固定陈设不需要单独提取为道具，除非该物件有独立剧情作用`,
          },
          {
            name: "视频提示词生成",
            type: "videoPromptGeneration",
            data: `# 视频提示词生成 Skill\n\n你是**视频提示词生成 Agent**，专门负责根据指定的 AI 视频模型，读取分镜信息并输出该模型对应格式的视频提示词。\n\n---\n\n## 输入格式\n\n### 1. 模型与模式（必选）\n\n\n#### 模式路由规则\n\n| 条件 | 匹配模式 | 说明 |\n|------|----------|------|\n| 模型名为 \`Seedance2.0\` / \`seedance 2.0\` / \`即梦2.0\` | **Seedance 2.0** | 固定模式，无论多参标志如何 |\n| 模型名为 \`Wan2.6\` / \`wan 2.6\` / \`万象2.6\` | **Wan 2.6** | 固定模式，单图（首帧）+ 叙事文本，无尾帧 |\n| 其他任何模型 + \`多参:是\` | **通用多参模式** | 支持角色/场景/分镜图多参引用 |\n| 其他任何模型 + \`多参:否\` | **通用首尾帧模式** | 首帧/首尾帧 + 纯文本描述 |\n\n> 模型名仅用于记录，实际提示词格式由匹配到的模式决定。Seedance 2.0 和 Wan 2.6 是指定模型名即确定模式的特例。\n\n### 2. 资产信息\n\n\`\`\`\n资产信息[id, type, name], [id, type, name], ...\n\`\`\`\n\n- \`id\`：资产唯一标识（如 \`A001\`）\n- \`type\`：资产类型，取值 \`character\`（角色）/ \`scene\`（场景）/ \`prop\`（道具）\n- \`name\`：资产名称（如 \`沈辞\`、\`城楼\`、\`长剑\`）\n\n### 3. 分镜信息\n\n分镜以 \`<storyboardItem>\` XML 标签列表的形式传入，每条分镜结构如下：\n\n\`\`\`xml\n<storyboardItem\n  videoDesc='（画面描述、场景、关联资产名称、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效、关联资产ID）'\n  prompt='待生成'\n  track='分组'\n  duration='视频推荐时间'\n  associateAssetsIds="[该分镜所需的资产ID列表]"\n  shouldGenerateImage="true"\n></storyboardItem>\n\`\`\`\n\n#### 输入字段说明\n\n| 属性 | 说明 | 来源 |\n|------|------|------|\n| \`videoDesc\` | **核心输入**：分镜的结构化画面描述，包含画面描述、场景、关联资产名称、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效、关联资产ID | 用户/上游系统填写 |\n| \`prompt\` | **已有字段**：上游生成的分镜图提示词，作为辅助参考上下文，**不修改** | 上游系统已填写 |\n| \`track\` | 分镜分组标识 | 用户/上游系统填写 |\n| \`duration\` | 视频推荐时长（秒） | 用户/上游系统填写 |\n| \`associateAssetsIds\` | 该分镜关联的资产ID列表 | 用户/上游系统填写 |\n| \`shouldGenerateImage\` | 是否需要生成分镜图片，默认 \`true\` | 用户/上游系统填写 |\n\n---\n\n## 任务目标\n\n读取所有 \`<storyboardItem>\` 的属性，结合资产信息，根据指定模型的提示词格式，将全部分镜整合为一个完整的视频提示词。\n\n---\n\n## 输出格式\n\n将所有分镜整合为**一个完整的视频提示词**输出（非逐条独立）：\n\n| 模式 | 整合方式 |\n|------|----------|\n| **通用多参模式** | \`[References]\` 汇总所有 \`@图N \` 引用；\`[Instruction]\` 按时间顺序描述完整叙事 |\n| **通用首尾帧模式** | 纯文本五维度（Visual / Motion / Camera / Audio / Narrative），不使用任何 \`@图N \` 引用，按时间轴连续编排（\`[Motion]\` 0s → 总时长，每段最低 1 秒），全程单一连贯镜头，不切镜 |\n| **Seedance 2.0** | \`生成一个由以下 N 个分镜组成的视频\`，每条对应 \`分镜N<duration-ms>\` 段落 |\n| **Wan 2.6** | 单图首帧模式，每次仅输入一条分镜，输出一段叙事式英文提示词（三段式：风格基调 → 主体动作+场景环境+光线氛围 → 镜头收尾），不使用 \`@图N \` 引用 |\n\n- 仅输出视频提示词文本，不输出 XML 标签，不附加解释\n\n---\n\n## videoDesc 解析规则\n\n从 \`videoDesc\` 括号内按顿号分隔提取以下结构化字段：\n\n\`\`\`\n（{画面描述}、{场景}、{关联资产名称}、{时长}、{景别}、{运镜}、{角色动作}、{情绪}、{光影氛围}、{台词}、{音效}、{关联资产ID}）\n\`\`\`\n\n| 序号 | 字段 | 用途 | 示例 |\n|------|------|------|------|\n| 1 | 画面描述 | prompt 的叙事主干 | 沈辞独立城楼远眺苍茫大地 |\n| 2 | 场景 | 匹配场景资产 | 城楼 |\n| 3 | 关联资产名称 | 匹配角色/道具资产 | 沈辞/城楼 |\n| 4 | 时长 | 控制时长参数 | 4s |\n| 5 | 景别 | 控制镜头景别 | 全景 |\n| 6 | 运镜 | 控制运镜方式 | 静止 |\n| 7 | 角色动作 | prompt 动作描写 | 负手而立衣袂随风飘扬 |\n| 8 | 情绪 | prompt 情绪氛围 | 坚定决绝 |\n| 9 | 光影氛围 | prompt 光影描写 | 黄昏冷调侧逆光 |\n| 10 | 台词 | prompt 台词/音频段 | 无台词 / 具体台词内容 |\n| 11 | 音效 | prompt 音效描写 | 风声衣袂声 |\n| 12 | 关联资产ID | 用于资产ID↔角色标签映射 | A001/A002 |\n\n---\n\n## 资产引用编号规则\n\n所有模型统一使用 \`@图N \` 格式引用资产和分镜图，编号按输入顺序连续递增：\n\n1. **资产**：按资产信息中 \`[id, type, name]\` 的出现顺序，从 \`@图1 \` 开始编号（不区分 character / scene / prop）\n2. **分镜图**：每条 \`<storyboardItem>\` 对应一张分镜图，编号接续资产之后\n3. **跳过无分镜图的条目**：当 \`shouldGenerateImage="false"\` 时，该分镜未生成图片，**不分配**分镜图编号，后续编号顺延\n\n#### 示例\n\n输入 3 个资产 + 2 条分镜：\n\`\`\`\n资产信息[A001, character, 沈辞], [A002, character, 苏锦], [A003, scene, 城楼]\n\`\`\`\n\`\`\`xml\n<storyboardItem ...>  <!-- 分镜1 -->\n<storyboardItem ...>  <!-- 分镜2 -->\n\`\`\`\n\n编号结果：\n\n| 输入项 | 引用标签 | 说明 |\n|--------|----------|------|\n| [A001, character, 沈辞] | \`@图1 \` | 角色·沈辞 参考图 |\n| [A002, character, 苏锦] | \`@图2 \` | 角色·苏锦 参考图 |\n| [A003, scene, 城楼] | \`@图3 \` | 场景·城楼 参考图 |\n| storyboardItem 第1条 | \`@图4 \` | 分镜图1 |\n| storyboardItem 第2条 | \`@图5 \` | 分镜图2 |\n\n---\n\n## 模型提示词生成规则\n\n### 一、通用多参模式\n\n#### 核心原则\n- MVL 多模态融合：自然语言 + 图像引用在同一语义空间\n- 分镜图序列负责动作/时间轴/构图，场景参考图负责环境一致性\n- 所有资产和分镜图统一用 \`@图N \` 引用\n- **严格遵循 videoDesc**：提示词内容严格基于 videoDesc 中的画面描述、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效字段生成，不编造额外内容\n- **台词不可缺失**：videoDesc 中有台词的分镜，必须在 Instruction 中体现台词相关描述\n- **台词类型标注**：区分普通对白（dialogue）、内心独白（inner monologue OS）、画外音（voiceover VO），在 Instruction 中用括号标注\n\n#### prompt 生成模板\n\n\`\`\`\n[References]\n@图1 : [{角色A名}参考图]\n@图2 : [{角色B名}参考图]\n@图3 : [{场景名}参考图]\n@图4 : [分镜图1]\n\n[Instruction]\nBased on the storyboard @图4 :\n@图1 {动作/状态描述（英文）},\n@图2 {动作/状态描述（英文）},\nset in the {场景描述（英文）} of @图3 ,\n{镜头/运镜描述（英文）},\n{情感基调（英文）},\n{台词描述（英文，含 dialogue/OS/VO 标注）/ No dialogue},\n{音效描述（英文）}.\n\`\`\`\n\n#### 生成约束\n1. **Instruction 必须用英文**\n2. **严格遵循 videoDesc**：提示词内容严格基于 videoDesc 的画面描述、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效字段，不编造额外信息\n3. **角色动作**从 videoDesc 的「角色动作」字段提取，翻译为简洁英文动作描述\n4. **台词不可缺失**：videoDesc 中有台词的分镜，必须在 Instruction 中体现台词内容（保持原始语言，不翻译）\n5. **台词类型标注**：普通对白标注 \`(dialogue)\`；内心独白标注 \`(inner monologue, OS)\`；画外音标注 \`(voiceover, VO)\`\n6. **镜头风格**使用标准标签：\`cinematic\` / \`wide-angle\` / \`close-up\` / \`slow motion\` / \`surround shooting\` / \`handheld\`\n7. **空间关系**使用标准动词：\`wearing\` / \`holding\` / \`standing on\` / \`following behind\` / \`sitting in\`\n8. 单条分镜对应单个 \`@图N \`，不做多帧跨镜描述\n9. 无需描述角色外观（由参考图负责）\n10. 无时长标注（由模型推断）\n11. **无分镜图时**：当 \`shouldGenerateImage="false"\` 时，该分镜无分镜图，\`[References]\` 中不列出该分镜图，\`[Instruction]\` 中不使用 \`@图N \` 引用该分镜图，改为纯文本描述画面内容\n\n#### KlingOmni 完整示例\n\n输入：\n\`\`\`\n模型：KlingOmni\n资产信息[A001, character, 沈辞], [A002, character, 苏锦], [A003, scene, 城楼]\n\`\`\`\n\`\`\`xml\n<storyboardItem videoDesc='（沈辞独立城楼远眺苍茫大地、城楼、沈辞/城楼、4s、全景、静止、负手而立衣袂随风飘扬、坚定决绝、黄昏冷调侧逆光、无台词、风声衣袂声、A001/A003）' prompt='全景，平视略仰，城楼之上，沈辞负手而立，衣袂飘扬，黄昏冷调侧逆光...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n<storyboardItem videoDesc='（苏锦登上城楼走向沈辞、城楼、苏锦/沈辞/城楼、4s、中景、跟踪、苏锦拾级而上走向沈辞、担忧、黄昏余晖渐暗、无台词、脚步声风声、A001/A002/A003）' prompt='中景，跟踪，苏锦拾级而上走向城楼上的沈辞...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A002&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\n输出：\n\`\`\`\n[References]\n@图1 : [沈辞参考图]\n@图2 : [苏锦参考图]\n@图3 : [城楼参考图]\n@图4 : [分镜图1]\n@图5 : [分镜图2]\n\n[Instruction]\nBased on the storyboard from @图4 to @图5 :\n@图1 standing alone atop the city wall, hands clasped behind back, robes billowing in the wind, gazing across the vast land,\n@图2 ascending the steps toward @图1 , expression worried,\nset in the ancient city wall environment of @图3 ,\nwide shot transitioning to medium tracking shot, cinematic,\nresolute determination shifting to concerned anticipation, dusk cold-toned side-backlit atmosphere fading,\nno dialogue,\nwind howling, fabric flapping, footsteps on stone.\n\`\`\`\n\n---\n\n### 二、通用首尾帧模式\n\n#### 核心原则\n- **纯文本提示词**：提示词内**不使用任何 \`@图N \` 引用**（不引用角色资产、场景资产、也不引用分镜图），全部内容用纯文本描述\n- **五维度结构**：Visual / Motion / Camera / Audio / Narrative\n- **严格遵循 videoDesc**：提示词内容严格基于 videoDesc 中的画面描述、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效字段生成，不编造额外内容\n- **台词不可缺失**：videoDesc 中有台词的分镜，必须在 \`[Audio]\` 中完整输出台词内容\n- **台词类型标注**：区分普通对白（dialogue, lip-sync active）、内心独白（inner monologue OS, silent lips）、画外音（voiceover VO, silent lips），并在 \`[Audio]\` 中明确标注\n- **不说话的主体标注 \`silent\`** — 防止误生口型\n- **全程单一连贯镜头**：从头到尾一个镜头，不存在切镜\n- **时间轴分段**：每段最低 1 秒，用 \`0s-Xs\` 标注\n\n#### prompt 生成模板\n\n\`\`\`\n[Visual]\n{主体A名}: {外观简述}, {站位/姿态}, {说话状态 speaking/silent}.\n{主体B名}: {外观简述}, {站位/姿态}, {说话状态}.\n{场景描述}, {道具描述}.\n{视觉风格标签}.\n\n[Motion]\n0s-{X}s: {主体A名} {动作描述段1}.\n{X}s-{Y}s: {主体B名} {动作描述段2}.\n\n[Camera]\n{镜头类型}, {运镜方式}, {全程单一连贯镜头描述}.\n\n[Audio]\n{Xs-Ys}: "{台词内容}" — {说话者名} ({dialogue / inner monologue OS / voiceover VO}), {lip-sync active / silent lips}.\n{音效描述}.\n\n[Narrative]\n{情节点概述}, {叙事位置}.\n\`\`\`\n\n#### 生成约束\n1. **全部用英文**\n2. **不使用任何 \`@图N \` 引用**：提示词内不引用角色资产、场景资产、分镜图，全部内容用纯文本描述\n3. **主体用文字描述**：在 [Visual] 中简要描述主体外观特征（如服饰、发型等关键辨识特征）\n4. **严格遵循 videoDesc**：提示词内容严格基于 videoDesc 中的画面描述、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效字段，不编造额外信息\n5. **每个主体必须标注说话状态**：\`speaking\` / \`silent\` / \`speaking simultaneously\`\n6. **台词不可缺失**：videoDesc 中有台词的分镜，必须在 \`[Audio]\` 中完整输出台词内容（保持原始语言，不翻译）\n7. **台词类型标注**：普通对白标注 \`dialogue, lip-sync active\`；内心独白标注 \`inner monologue (OS), silent lips\`；画外音标注 \`voiceover (VO), silent lips\`\n8. **Motion 时间轴**每段最低 1 秒，不超过总时长\n9. **全程单一连贯镜头**：Camera 段落描述从头到尾的一个镜头，绝不切镜\n10. **视觉风格**参考 Assistant 中的「视觉风格约束」部分内容\n11. **镜头类型**从以下选取：\`Wide establishing shot / Over-the-shoulder / Medium shot / Close-up / Wide shot / POV / Dutch angle / Crane up / Dolly right / Whip pan / Handheld / Slow motion\`\n\n#### Seedance 1.5 Pro 完整示例\n\n输入：\n\`\`\`\n模型：Seedance1.5\n资产信息[A001, character, 沈辞], [A002, character, 苏锦], [A003, scene, 城楼]\n\`\`\`\n\`\`\`xml\n<storyboardItem videoDesc='（沈辞独立城楼远眺苍茫大地、城楼、沈辞/城楼、4s、全景、静止、负手而立衣袂随风飘扬、坚定决绝、黄昏冷调侧逆光、无台词、风声衣袂声、A001/A003）' prompt='全景，平视略仰，城楼之上，沈辞负手而立，衣袂飘扬，黄昏冷调侧逆光...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n<storyboardItem videoDesc='（苏锦登上城楼走向沈辞、城楼、苏锦/沈辞/城楼、4s、中景、跟踪、苏锦拾级而上走向沈辞、担忧、黄昏余晖渐暗、无台词、脚步声风声、A001/A002/A003）' prompt='中景，跟踪，苏锦拾级而上走向城楼上的沈辞...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A002&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\n输出：\n\`\`\`\n[Visual]\nShen Ci: male, dark flowing robes, hair tied up, standing alone atop city wall, hands clasped behind back, robes billowing, silent.\nSu Jin: female, light-colored dress, hair partially down, ascending steps toward Shen Ci, expression worried, silent.\nAncient city wall, vast open land beyond, dusk sky fading.\nCinematic, photorealistic, 4K, high contrast, desaturated tones, shallow depth of field.\n\n[Motion]\n0s-4s: Shen Ci stands still on city wall edge, robes flutter in wind, hair sways gently. Gaze fixed on distant horizon.\n4s-8s: Su Jin climbs the last few steps onto the wall, walks toward Shen Ci. Shen Ci remains still, unaware. Su Jin slows as she approaches.\n\n[Camera]\nWide establishing shot, static for first 4 seconds capturing the lone figure. Then smooth transition to medium tracking shot following the woman ascending steps, single continuous take throughout, no cuts.\n\n[Audio]\n0s-4s: Wind howling across wall, fabric flapping rhythmically. No dialogue.\n4s-8s: Footsteps on stone, robes rustling. No dialogue.\nShen Ci — silent. Su Jin — silent.\n\n[Narrative]\nLone figure on city wall, then arrival of a companion. Tension between determination and concern. Single continuous take.\n\`\`\`\n\n---\n\n### 三、Seedance 2.0\n\n#### 核心原则\n- **结构化12维编码**：统一用 \`@图N \` 引用资产和分镜图，时长 \`<duration-ms>\`\n- **音色参数9维度精细描述**（有台词时必填）\n- **毫秒级时长控制**：单分镜时长最低 1000ms（1 秒）\n- **中文提示词**\n- **严格遵循 videoDesc**：每条分镜的描述内容严格基于 videoDesc 中的画面描述、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效字段生成，不编造额外内容\n- **台词不可缺失**：videoDesc 中有台词的分镜，必须完整输出台词和音色描述\n- **台词类型标注**：区分普通对白（直接使用「说：」）、内心独白（使用「内心OS：」）、画外音（使用「画外音VO：」），并匹配对应的嘴型状态描述\n\n#### prompt 生成模板\n\n**单分镜模板：**\n\`\`\`\n画面风格和类型: {风格}, {色调}, {类型}\n\n生成一个由以下 1 个分镜组成的视频:\n\n场景:\n分镜过渡: 无\n\n分镜1<duration-ms>{毫秒数}</duration-ms>: 时间：{日/夜/晨/黄昏}，场景图片：@图{场景编号} ，镜头：{景别}，{角度}，{运镜}，@图{角色编号} {动作/表情/视线朝向/站位描述}。{台词与音色描述（如有）}。{背景环境补充}。{光影氛围}。{运镜补充}。\n\`\`\`\n\n**多分镜模板：**\n\`\`\`\n画面风格和类型: {风格}, {色调}, {类型}\n\n生成一个由以下 {N} 个分镜组成的视频:\n\n场景:\n分镜过渡: {全局过渡描述}\n\n分镜1<duration-ms>{毫秒数}</duration-ms>: 时间：{...}，场景图片：@图{场景编号} ，镜头：{...}，@图{角色编号} {...}。{...}。\n分镜2<duration-ms>{毫秒数}</duration-ms>: ...\n...\n\`\`\`\n\n#### 音色生成规则（有台词时必填）\n\n台词格式：\`@图{角色编号} 说：「{台词内容}」音色：{9维度描述}\`\n\n9维度按顺序填写：\n\`\`\`\n{性别}，{年龄音色}，{音调}，{音色质感}，{声音厚度}，{发音方式}，{气息}，{语速}，{特殊质感}\n\`\`\`\n\n> 当 desc 中未明确音色信息时，根据角色类型从以下参考表推断：\n\n| 角色类型特征 | 默认音色 |\n|------------|---------|\n| 男性权威/霸气角色 | 男声，中年音色，音调低沉，音色浑厚有力，声音厚重，发音标准，气息极其沉稳，语速偏慢 |\n| 女性温柔/甜美角色 | 女声，青年音色，音调中等偏高，音色质感明亮清脆，声音清亮柔和，气息充沛平稳，带温婉真诚感 |\n| 男性年轻/普通角色 | 男声，青年音色，音调中等，音色干净，声音厚度适中，发音清晰，气息平稳，语速适中 |\n| 女性活泼/外向角色 | 女声，青年音色，音调偏高，音色清脆活泼，声音轻盈，气息充沛，语速偏快，带笑意和感染力 |\n| 反派/冷酷角色 | 男声，中年音色，音调低沉，音色质感干燥偏暗，声音带沙砾感，气息平稳，语速极慢，有威胁感 |\n\n#### 无台词分镜处理\n- 不写 \`说：\` 和音色段落\n- 在动作描述后标注 \`无台词\`\n\n#### 台词类型格式\n\n| 台词类型 | 格式 | 嘴型描述 |\n|----------|------|----------|\n| 普通对白 | \`@图{角色编号} 说：「{台词}」音色：{9维度}\` | 角色嘴部开合说话 |\n| 内心独白 | \`@图{角色编号} 内心OS：「{台词}」音色：{9维度}\` | 角色嘴部紧闭不动 |\n| 画外音 | \`@图{角色编号} 画外音VO：「{台词}」音色：{9维度}\` | 角色嘴部紧闭不动（或角色不在画面中） |\n\n#### 生成约束\n1. **中文提示词**\n2. **严格遵循 videoDesc**：每条分镜内容严格基于 videoDesc 的画面描述、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效字段，不编造额外信息\n3. **台词不可缺失**：videoDesc 中有台词的分镜，必须完整输出台词和音色\n4. **台词类型正确标注**：普通对白用「说：」，内心独白用「内心OS：」，画外音用「画外音VO：」\n5. **单分镜时长最低 1000ms（1 秒）**\n6. **时长单位**：将 videoDesc 中的秒 × 1000 转为毫秒填入 \`<duration-ms>\`\n\n#### Seedance 2.0 完整示例\n\n输入：\n\`\`\`\n模型：Seedance2.0\n资产信息[A001, character, 沈辞], [A002, character, 苏锦], [A003, scene, 城楼]\n\`\`\`\n\`\`\`xml\n<storyboardItem videoDesc='（沈辞独立城楼远眺苍茫大地、城楼、沈辞/城楼、4s、全景、静止、负手而立衣袂随风飘扬、坚定决绝、黄昏冷调侧逆光、无台词、风声衣袂声、A001/A003）' prompt='全景，平视略仰，城楼之上，沈辞负手而立，衣袂飘扬，黄昏冷调侧逆光...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n<storyboardItem videoDesc='（苏锦登上城楼走向沈辞、城楼、苏锦/沈辞/城楼、4s、中景、跟踪、苏锦拾级而上走向沈辞、担忧、黄昏余晖渐暗、苏锦说：你又一个人在这里、脚步声风声、A001/A002/A003）' prompt='中景，跟踪，苏锦拾级而上走向城楼上的沈辞...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A002&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\n输出：\n\`\`\`\n画面风格和类型: 真人写实, 电影风格, 冷调, 古风\n\n生成一个由以下 2 个分镜组成的视频:\n\n场景:\n分镜过渡: 镜头平滑切换，从全景过渡到中景跟踪，焦点从沈辞独处转向苏锦到来。\n\n分镜1<duration-ms>4000</duration-ms>: 时间：黄昏，场景图片：@图3 ，镜头：全景，平视略仰，静止镜头，@图1 独立城楼之上，负手而立，衣袂随风飘扬，目光远眺苍茫大地，神情肃然面容沉着，眼神坚定目光清冽，眉眼沉静气质凛然。无台词。背景是古城楼砖石纹理清晰，远方大地苍茫辽阔，天际线冷暖交替。黄昏斜射余晖侧逆光，冷调为主，长影拉伸，轮廓光微勾勒人物边缘，光感诗意。镜头静止。\n\n分镜2<duration-ms>4000</duration-ms>: 时间：黄昏，场景图片：@图3 ，镜头：中景，平视，跟踪拍摄，@图2 拾级而上，走向城楼上的@图1 ，面部朝向@图1 方向，神情微愣面色微变，眼神中带着担忧，@图2 说：「你又一个人在这里。」音色：女声，青年音色，音调中等偏高，音色质感明亮清脆，声音清亮柔和，发音方式干净，气息充沛平稳，语速适中，带温婉真诚感。背景城楼台阶纹理清晰，余晖渐暗，天际线冷暖交替加深。镜头跟踪苏锦移动。\n\`\`\`\n\n---\n\n### 四、Wan 2.6\n\n#### 核心原则\n- **单图首帧模式**：归类为首尾帧模式，但仅有首帧（分镜图），无尾帧\n- **单条分镜输入/输出**：每次仅输入一条 \`<storyboardItem>\` 及其关联资产信息，输出也仅为一段完整的叙事式提示词\n- **叙事式英文提示词**：像写小说一样描写画面，不使用标签罗列（不写 \`4K, cinematic, high quality\` 这类堆砌）\n- **三段式结构**：风格基调 → 主体动作 + 场景环境 + 光线氛围 → 镜头收尾\n- **纯文本提示词**：提示词内**不使用任何 \`@图N \` 引用**，全部内容用纯文本描述\n- **严格遵循 videoDesc**：提示词内容严格基于 videoDesc 中的画面描述、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效字段生成，不编造额外内容\n- **台词不可缺失**：videoDesc 中有台词的分镜，必须在提示词中体现台词相关描述\n- **台词类型标注**：区分普通对白（dialogue）、内心独白（inner monologue OS）、画外音（voiceover VO），在提示词中用括号标注\n\n#### prompt 生成模板\n\n每次输入一条分镜，输出一段完整提示词（无编号前缀），格式如下：\n\n\`\`\`\n{风格基调一句话定性},\n{主体名} {外观简述}, {具体动作/姿态描述}, {情绪/表情用动作暗示}.\n{场景背景主体}, {具体环境物件}, {空间感}, {时间/天气}.\n{光线方向/色温} {质感描述}, {情绪暗示光影}.\n{台词描述（如有，含 dialogue/OS/VO 标注）/ No dialogue}.\n{音效描述}.\n{拍摄方式}, {景别}, {视角}, {运镜方式}.\n\`\`\`\n\n#### 叙事式写法要点\n\n| 原则 | 说明 | 示例 |\n|------|------|------|\n| 风格基调放最前 | 一句话定性整体气质 | \`A cinematic epic scene\` / \`A melancholic cinematic scene\` |\n| 主体+动作紧密绑定 | 主体后面直接跟动作，外观细节嵌入主体描述 | \`A young man in dark flowing robes stands alone atop the city wall, hands clasped behind back\` |\n| 情绪用动作暗示 | 不直接陈述「他很悲伤」 | ❌ \`He is sad.\` → ✅ \`head drops slowly, shoulders slumped\` |\n| 环境融入叙事 | 不罗列环境属性 | ❌ \`The sky is blue. The grass is green.\` → ✅ \`hazy blue sky stretches over the emerald valley\` |\n| 光线单独成句 | 光线方向+色温+质感+情绪 | \`Warm golden hour light streams from behind, casting long shadows across the stone floor\` |\n| 镜头语言收尾 | 一句话点睛 | \`Captured in a wide establishing shot from a low-angle perspective, static camera\` |\n| 禁止标签堆砌 | 不写 \`4K, cinematic, high quality\` | \`cinematic\` 融入风格基调即可 |\n\n#### 生成约束\n1. **全部用英文**\n2. **不使用任何 \`@图N \` 引用**：提示词内不引用角色资产、场景资产、分镜图，全部内容用纯文本描述\n3. **叙事式描写**：像写小说一样构建画面，禁止标签罗列和配置清单式写法\n4. **主体用文字描述**：简要描述主体外观特征（如服饰、发型等关键辨识特征），嵌入主体描述中\n5. **严格遵循 videoDesc**：提示词内容严格基于 videoDesc 中的画面描述、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效字段，不编造额外信息\n6. **台词不可缺失**：videoDesc 中有台词的分镜，必须在提示词中完整输出台词内容（保持原始语言，不翻译）\n7. **台词类型标注**：普通对白标注 \`(dialogue)\`；内心独白标注 \`(inner monologue, OS)\`；画外音标注 \`(voiceover, VO)\`\n8. **单条输入/输出**：每次仅处理一条分镜，输出一段提示词，无编号前缀\n9. **无需标注时长**：时长由模型侧控制，提示词中不写时长参数\n10. **镜头描述融入叙事**：不用方括号标签，用完整句子描述镜头\n11. **视觉风格**参考 Assistant 中的「视觉风格约束」部分内容\n\n#### Wan 2.6 完整示例\n\n**示例1：无台词分镜**\n\n输入：\n\`\`\`\n模型：Wan2.6\n资产信息[A001, character, 沈辞], [A003, scene, 城楼]\n\`\`\`\n\`\`\`xml\n<storyboardItem videoDesc='（沈辞独立城楼远眺苍茫大地、城楼、沈辞/城楼、4s、全景、静止、负手而立衣袂随风飘扬、坚定决绝、黄昏冷调侧逆光、无台词、风声衣袂声、A001/A003）' prompt='全景，平视略仰，城楼之上，沈辞负手而立，衣袂飘扬，黄昏冷调侧逆光...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\n输出：\n\`\`\`\nA cinematic epic scene with a cold, desaturated palette,\nA lone man in dark flowing robes stands atop an ancient city wall, hands clasped behind his back, robes and hair billowing in the wind, gaze fixed on the vast land stretching to the horizon, jaw set firm, eyes unwavering.\nThe weathered stone battlements frame the endless expanse below, rolling terrain fading into haze beneath a heavy dusk sky, clouds layered in muted golds and slate greys.\nCold side-backlight from the setting sun carves a sharp silhouette, long shadows stretching across the stone floor, a faint warm rim outlining the figure against the cool atmosphere.\nNo dialogue.\nWind howling across the open wall, fabric flapping rhythmically.\nCaptured in a wide establishing shot from a slightly low angle, static camera, single continuous take.\n\`\`\`\n\n**示例2：有台词分镜**\n\n输入：\n\`\`\`\n模型：Wan2.6\n资产信息[A001, character, 沈辞], [A002, character, 苏锦], [A003, scene, 城楼]\n\`\`\`\n\`\`\`xml\n<storyboardItem videoDesc='（苏锦登上城楼走向沈辞、城楼、苏锦/沈辞/城楼、4s、中景、跟踪、苏锦拾级而上走向沈辞、担忧、黄昏余晖渐暗、苏锦说：你又一个人在这里、脚步声风声、A001/A002/A003）' prompt='中景，跟踪，苏锦拾级而上走向城楼上的沈辞...' track='main' duration='4' associateAssetsIds="[&quot;A001&quot;,&quot;A002&quot;,&quot;A003&quot;]" shouldGenerateImage="true" ></storyboardItem>\n\`\`\`\n\n输出：\n\`\`\`\nA melancholic cinematic scene, dusk tones deepening,\nA young woman in a light-colored dress ascends the final stone steps onto the city wall, her gaze locked on the lone figure ahead, brow slightly furrowed, pace slowing as she approaches, lips parting softly.\nThe ancient city wall stretches behind her, weathered stairs leading up from below, the distant skyline dimming as the last traces of golden hour fade into twilight.\nFading warm light mingles with rising cool blue tones, the contrast between the two figures softened by the diffused remnants of sunset.\n"你又一个人在这里。" — Su Jin (dialogue).\nFootsteps on stone, wind sweeping across the battlements, fabric rustling.\nA medium tracking shot follows the woman from behind as she ascends and approaches, handheld camera with subtle movement, single continuous take.\n\`\`\`\n\n---\n\n## 景别 → 镜头标签映射\n\n| videoDesc 中的景别 | KlingOmni（英文标签） | Seedance 1.5（英文标签） | Seedance 2.0（中文描述） | Wan 2.6（英文叙事式） |\n|------|------|------|------|------|\n| 远景 | extreme wide shot | Extreme wide shot | 远景 | an extreme wide shot capturing the vast expanse |\n| 全景 | wide shot | Wide establishing shot | 全景 | a wide establishing shot |\n| 中景 | medium shot | Medium shot | 中景 | a medium shot |\n| 近景 | close-up | Close-up | 近景 | a close-up shot |\n| 特写 | close-up | Close-up | 特写 | a close-up capturing fine detail |\n| 大特写 | extreme close-up | Extreme close-up | 大特写 | an extreme close-up |\n\n## 运镜 → 镜头标签映射\n\n| videoDesc 中的运镜 | KlingOmni（英文标签） | Seedance 1.5（英文标签） | Seedance 2.0（中文描述） | Wan 2.6（英文叙事式） |\n|------|------|------|------|------|\n| 静止 | static camera | Static, no camera movement | 镜头静止 | static camera, locked off |\n| 推进 | dolly in / push in | Slow dolly forward | 镜头缓慢向前推进 | camera slowly pushing in |\n| 拉远 | dolly out / pull back | Slow dolly backward pull | 镜头缓慢向后拉远 | camera gently pulling back |\n| 跟踪 | tracking shot | Tracking shot, handheld | 跟踪拍摄 | tracking shot following the subject |\n| 摇镜 | pan left/right | Slow pan | 镜头缓慢摇移 | smooth pan across the scene |\n| 甩镜 | whip pan | Whip pan | 快速甩镜 | whip pan |\n| 升降 | crane up/down | Crane up/down | 镜头升降 | crane rising / descending |\n| 环绕 | surround shooting | Orbiting shot | 环绕拍摄 | orbiting around the subject |\n\n---\n\n## 执行流程\n\n1. **解析输入**：提取模型名和多参标志，按路由规则匹配模式；提取资产列表\n2. **构建 @图N 编号表**：资产按输入顺序从 \`@图1 \` 起编号，分镜图接续编号；\`shouldGenerateImage="false"\` 的分镜不分配分镜图编号\n3. **逐条解析 \`<storyboardItem>\`**：按 videoDesc 解析规则提取12个字段，结合 \`duration\`、\`associateAssetsIds\` 建立标签映射\n4. **整合为一个完整的视频提示词**：按目标模型格式编排全部分镜\n5. **输出视频提示词**\n\n---\n\n## 约束\n\n- **仅输出视频提示词**：不附加任何解释、注释或额外说明，只输出视频提示词文本\n- **严格遵循 videoDesc**（全模式通用）：提示词内容严格基于 videoDesc 中的画面描述、时长、景别、运镜、角色动作、情绪、光影氛围、台词、音效字段生成，不编造额外内容\n- **台词不可缺失**（全模式通用）：videoDesc 中有台词的分镜，必须在提示词中完整体现台词内容，不得遗漏\n- **台词保持原始输入**（全模式通用）：台词内容严禁翻译，必须保持 videoDesc 中的原始语言原样输出\n- **台词类型标注**（全模式通用）：必须区分普通对白（dialogue / 说）、内心独白（OS / 内心OS）、画外音（VO / 画外音VO），并在提示词中正确标注\n- **时间跨度最低 1 秒**（全模式通用）：所有模式中涉及时间分段（Motion 时间轴 / duration-ms）的最小粒度为 1 秒（1000ms），禁止出现 0.5 秒等低于 1 秒的间隔\n- **视觉风格**：风格相关描述参考 Assistant 中的「视觉风格约束」部分内容，不在本 Skill 内自行定义风格\n- **严格按匹配到的模式格式**，不混用不同模式的格式\n- **不修改原始输入**：不改写 \`<storyboardItem>\` 的任何字段；\`prompt\` 已有的分镜图提示词仅作画面参考\n- **不编造资产或台词**：只使用输入中的资产信息；无台词则标注「无台词」/ \`No dialogue\`\n- **时长单位转换**：Seedance 2.0 的 \`<duration-ms>\` 需将秒 × 1000 转为毫秒\n`,
          },
          {
            name: "音色绑定",
            type: "audioBindPrompt",
            data: `你是一个音色匹配助手。\n你的任务是：根据给定角色资产的名称与描述，从候选音频列表中选出最合适的音色。\n匹配规则：\n1. 优先根据角色性别、年龄、性格等特征与音色描述进行语义匹配；\n2. 同一角色仅可匹配一个音色；\n3. 若候选列表中没有合适的音色，则无需返回 audioId；`,
          },
        ]);
      },
    },
    //模型绑定提示词表
    {
      name: "o_modelPrompt",
      builder: (table) => {
        table.integer("id").notNullable();
        table.string("vendorId");
        table.string("model");
        table.text("fileName");
        table.text("path");
        table.primary(["id"]);
        table.unique(["id"]);
      },
      initData: async (knex) => {},
    },
    //提示词版本表
    {
      name: "o_promptVersion",
      builder: (table) => {
        table.integer("id").notNullable();
        table.string("scope");
        table.string("key");
        table.string("sourceType");
        table.text("sourcePath");
        table.string("promptType");
        table.text("content");
        table.string("hash");
        table.string("status");
        table.text("note");
        table.string("createdBy");
        table.integer("createTime");
        table.integer("publishTime");
        table.primary(["id"]);
        table.unique(["id"]);
        table.index(["scope", "key", "status"]);
      },
      initData: async (knex) => {},
    },
    //提示词使用快照表
    {
      name: "o_promptUsage",
      builder: (table) => {
        table.integer("id").notNullable();
        table.string("scope");
        table.string("key");
        table.string("promptHash");
        table.integer("promptVersionId");
        table.text("promptSource");
        table.text("modelName");
        table.integer("taskId");
        table.string("relatedType");
        table.text("relatedId");
        table.text("meta");
        table.integer("createTime");
        table.primary(["id"]);
        table.unique(["id"]);
        table.index(["scope", "key"]);
        table.index(["promptHash"]);
        table.index(["relatedType", "relatedId"]);
      },
      initData: async (knex) => {},
    },
    //生成内容审计表
    {
      name: "o_generationArtifact",
      builder: (table) => {
        table.integer("id").notNullable();
        table.integer("projectId");
        table.string("artifactType");
        table.string("targetType");
        table.text("targetId");
        table.string("targetField");
        table.text("title");
        table.text("content");
        table.string("contentHash");
        table.text("promptHash");
        table.integer("promptVersionId");
        table.text("promptSource");
        table.text("modelName");
        table.integer("taskId");
        table.integer("promptUsageId");
        table.integer("parentArtifactId");
        table.text("meta");
        table.integer("createTime");
        table.primary(["id"]);
        table.unique(["id"]);
        table.index(["projectId", "artifactType"]);
        table.index(["targetType", "targetId", "targetField"]);
        table.index(["contentHash"]);
      },
      initData: async (knex) => {},
    },
    //生成内容片段表
    {
      name: "o_generationSegment",
      builder: (table) => {
        table.integer("id").notNullable();
        table.integer("artifactId");
        table.integer("projectId");
        table.string("artifactType");
        table.integer("segmentIndex");
        table.string("segmentType");
        table.integer("startOffset");
        table.integer("endOffset");
        table.text("text");
        table.string("hash");
        table.integer("createTime");
        table.primary(["id"]);
        table.unique(["id"]);
        table.index(["artifactId"]);
        table.index(["projectId", "artifactType"]);
        table.index(["hash"]);
      },
      initData: async (knex) => {},
    },
    //生成内容修订表
    {
      name: "o_generationRevision",
      builder: (table) => {
        table.integer("id").notNullable();
        table.integer("artifactId");
        table.integer("segmentId");
        table.integer("projectId");
        table.string("targetType");
        table.text("targetId");
        table.string("targetField");
        table.text("beforeText");
        table.text("afterText");
        table.string("beforeHash");
        table.string("afterHash");
        table.text("note");
        table.string("createdBy");
        table.integer("createTime");
        table.primary(["id"]);
        table.unique(["id"]);
        table.index(["artifactId"]);
        table.index(["segmentId"]);
        table.index(["projectId"]);
      },
      initData: async (knex) => {},
    },
    //小说原文表
    {
      name: "o_novel",
      builder: (table) => {
        table.integer("id").notNullable();
        table.integer("chapterIndex");
        table.text("reel");
        table.text("chapter");
        table.text("chapterData");
        table.integer("projectId");
        table.integer("eventState");
        table.text("event");
        table.text("errorReason");
        table.integer("createTime");
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    //小说事件表
    {
      name: "o_event",
      builder: (table) => {
        table.integer("id").notNullable();
        table.string("name");
        table.string("detail");
        table.integer("createTime");
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    //事件-章节表
    {
      name: "o_eventChapter",
      builder: (table) => {
        table.integer("id").notNullable();
        table.integer("eventId").unsigned().references("id").inTable("o_event");
        table.integer("novelId").unsigned().references("id").inTable("o_novel");
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    //剧本
    {
      name: "o_script",
      builder: (table) => {
        table.integer("id").notNullable();
        table.text("name");
        table.text("content");
        table.integer("projectId");
        table.integer("extractState");
        table.integer("createTime");
        table.text("errorReason");
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    //资产表
    {
      name: "o_assets",
      builder: (table) => {
        table.integer("id").notNullable();
        table.text("name");
        table.text("prompt");
        table.text("remark");
        table.text("type");
        table.text("describe");
        table.integer("scriptId"); //剧本id
        table.integer("imageId").unsigned().references("id").inTable("o_image");
        table.integer("assetsId");
        table.integer("projectId");
        table.integer("flowId"); //工作流id
        table.integer("startTime");
        table.string("promptState");
        table.integer("audioBindState");
        table.text("promptErrorReason");
        table.primary(["id"]);
        table.unique(["id"]);
      },
      initData: async (knex) => {},
    },
    //生成图片表
    {
      name: "o_image",
      builder: (table) => {
        table.integer("id").notNullable();
        table.text("filePath");
        table.text("type");
        table.integer("assetsId");
        table.text("model");
        table.text("resolution");
        table.text("state");
        table.text("errorReason");
        table.text("batchId"); //抽卡候选组ID，同一次生成的多张候选图共享
        table.integer("selected"); //是否为该候选组中被选定的图 0/1
        table.integer("score"); //VLM 自动打分 0-100
        table.text("scoreReason"); //打分理由
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    //生成任务队列表（持久化，重启可恢复）
    {
      name: "o_genQueue",
      builder: (table) => {
        table.integer("id").notNullable();
        table.integer("projectId");
        table.string("kind"); //任务类型：assetImage / storyboardImage
        table.text("payload"); //任务参数 JSON
        table.string("vendorId"); //供应商ID，用于按 vendor 限流
        table.integer("priority"); //优先级，越大越先执行
        table.string("state"); //排队中 / 执行中 / 已完成 / 失败
        table.integer("retryCount"); //已重试次数
        table.integer("maxRetry"); //最大重试次数
        table.text("errorReason");
        table.integer("createTime");
        table.integer("updateTime");
        table.primary(["id"]);
        table.unique(["id"]);
        table.index(["state", "priority"]);
      },
    },
    //分镜
    {
      name: "o_storyboard",
      builder: (table) => {
        table.integer("id").notNullable();
        table.integer("scriptId");
        table.text("prompt");
        table.text("filePath");
        table.text("duration");
        table.text("state");
        table.integer("trackId");
        table.text("reason");
        table.text("track");
        table.text("videoDesc");
        table.integer("shouldGenerateImage"); // 0 否  1 是
        table.integer("projectId");
        table.integer("flowId"); //工作流id
        table.integer("index");
        table.integer("createTime");
        table.text("dialogue"); //台词（结构化，优先于 videoDesc 中的台词段）
        table.text("soundEffect"); //音效描述
        table.text("shotType"); //景别（远景/全景/中景/近景/特写）
        table.text("cameraMovement"); //运镜（固定/推/拉/摇/跟/移）
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    //单镜头合成记录（视频 + TTS配音 + 烧录字幕）
    {
      name: "o_videoCompose",
      builder: (table) => {
        table.integer("id").notNullable();
        table.integer("projectId");
        table.integer("scriptId");
        table.integer("trackId"); //对应 o_videoTrack.id
        table.integer("videoId"); //合成所用的源视频 o_video.id
        table.text("state"); //合成中 / 已完成 / 合成失败
        table.text("filePath"); //合成后视频路径
        table.text("audioPath"); //TTS 音频路径
        table.text("subtitlePath"); //SRT 字幕路径
        table.text("dialogue"); //合成时使用的台词
        table.text("errorReason");
        table.integer("createTime");
        table.primary(["id"]);
        table.unique(["id"]);
        table.index(["scriptId", "trackId"]);
      },
    },
    //整集拼接导出记录
    {
      name: "o_episodeMerge",
      builder: (table) => {
        table.integer("id").notNullable();
        table.integer("projectId");
        table.integer("scriptId");
        table.text("state"); //拼接中 / 已完成 / 拼接失败
        table.text("filePath"); //成片路径
        table.integer("duration"); //成片时长（秒）
        table.text("errorReason");
        table.integer("createTime");
        table.primary(["id"]);
        table.unique(["id"]);
        table.index(["scriptId"]);
      },
    },
    //flowData-剧本
    {
      name: "o_agentWorkData",
      builder: (table) => {
        table.integer("id").notNullable();
        table.integer("projectId");
        table.integer("episodesId");
        table.string("key"); //用户其他方式索引
        table.string("data");
        table.integer("createTime");
        table.integer("updateTime");
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    //创作级画布布局状态
    {
      name: "o_creativeCanvasState",
      builder: (table) => {
        table.integer("id").notNullable();
        table.integer("projectId").notNullable();
        table.integer("scriptId");
        table.string("viewKey");
        table.text("nodesLayout");
        table.text("edgesLayout");
        table.text("viewport");
        table.integer("createTime");
        table.integer("updateTime");
        table.primary(["id"]);
        table.unique(["id"]);
        table.index(["projectId", "scriptId", "viewKey"]);
      },
    },
    //Creative Canvas Agent 会话历史
    {
      name: "o_agentChatHistory",
      builder: (table) => {
        table.integer("id").notNullable();
        table.integer("projectId").notNullable();
        table.integer("scriptId");
        table.string("threadKey").notNullable();
        table.string("agentMode");
        table.text("messages");
        table.text("draft");
        table.text("lockedContext");
        table.integer("createTime");
        table.integer("updateTime");
        table.primary(["id"]);
        table.unique(["id"]);
        table.unique(["threadKey"]);
        table.index(["projectId", "scriptId"]);
      },
    },
    //视频
    {
      name: "o_video",
      builder: (table) => {
        table.integer("id").notNullable();
        table.text("filePath");
        table.text("errorReason");
        table.integer("time");
        table.text("state");
        table.integer("scriptId");
        table.integer("projectId");
        table.integer("videoTrackId");
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    // 视频轨道
    {
      name: "o_videoTrack",
      builder: (table) => {
        table.integer("id").notNullable();
        table.integer("videoId");
        table.integer("projectId");
        table.integer("scriptId");
        table.text("state");
        table.text("reason");
        table.text("prompt");
        table.integer("selectVideoId");
        table.integer("duration");
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    //供应商配置表
    {
      name: "o_vendorConfig",
      builder: (table) => {
        table.string("id").notNullable();
        table.text("inputValues"); // 输入项值 JSON
        table.text("models"); // 模型配置 JSON
        table.integer("enable"); //是否启用供应商
        table.primary(["id"]);
        table.unique(["id"]);
      },
      initData: async (knex) => {
        await knex("o_vendorConfig").insert([
          {
            id: "toonflow",
            inputValues: "{}",
            models: "[]",
            enable: 0,
          },
          {
            id: "deepseek",
            inputValues: "{}",
            models: "[]",
            enable: 0,
          },
          {
            id: "atlascloud",
            inputValues: "{}",
            models: "[]",
            enable: 0,
          },
          {
            id: "volcengine",
            inputValues: "{}",
            models: "[]",
            enable: 0,
          },
          {
            id: "minimax",
            inputValues: "{}",
            models: "[]",
            enable: 0,
          },
          {
            id: "openai",
            inputValues: "{}",
            models: "[]",
            enable: 0,
          },
          {
            id: "klingai",
            inputValues: "{}",
            models: "[]",
            enable: 0,
          },
          {
            id: "vidu",
            inputValues: "{}",
            models: "[]",
            enable: 0,
          },
        ]);
      },
    },
    //图片工作流表
    {
      name: "o_imageFlow",
      builder: (table) => {
        table.integer("id").notNullable();
        table.text("flowData").notNullable();
        table.primary(["id"]);
        table.unique(["id"]);
      },
    },
    {
      name: "o_assets2Storyboard",
      builder: (table) => {
        table.integer("storyboardId").notNullable();
        table.integer("assetId").notNullable();
        table.primary(["storyboardId", "assetId"]);
        table.unique(["storyboardId", "assetId"]);
      },
    },
    {
      name: "o_scriptAssets",
      builder: (table) => {
        table.integer("scriptId").notNullable();
        table.integer("assetId").notNullable();
        table.primary(["scriptId", "assetId"]);
        table.unique(["scriptId", "assetId"]);
      },
    },
    {
      name: "o_skillList",
      builder: (table) => {
        table.text("id").notNullable();
        table.text("md5").notNullable();
        table.text("path").notNullable();
        table.text("name").notNullable(); //文件名
        table.text("description").notNullable(); //描述
        table.text("embedding"); // 向量嵌入 JSON
        table.text("type").notNullable(); // "main" | "references"
        table.integer("createTime").notNullable();
        table.integer("updateTime").notNullable();
        table.integer("state").notNullable(); // 1正常，0正在生成description，-1description为空。-2归属为空,-3md5变动，-4文件不存在
        table.primary(["id"]);
      },
      initData: async (knex) => {
        const list = [
          {
            id: "4fb36012e56e395b425569987f5dab0e",
            md5: "fca3c269c5f325a65dafa663c9bb9773",
            path: "production_agent_decision.md",
            name: "production_agent_decision",
            description: "",
            embedding: "",
            type: "main",
            createTime: 1774447310118,
            updateTime: 1774447310118,
            state: -1,
          },
          {
            id: "017b6338d7aa227cd614ec1fb25fd83e",
            md5: "2610b80abe4bd048fe61c73adc7388ac",
            path: "production_agent_execution.md",
            name: "production_agent_execution",
            description: "",
            embedding: "",
            type: "main",
            createTime: 1774447310118,
            updateTime: 1774447310118,
            state: -1,
          },
          {
            id: "f03c8e67b61580de9ea5b9d166521b67",
            md5: "d41d8cd98f00b204e9800998ecf8427e",
            path: "production_agent_supervision.md",
            name: "production_agent_supervision",
            description: "",
            embedding: "",
            type: "main",
            createTime: 1774447310118,
            updateTime: 1774447310118,
            state: -1,
          },
          {
            id: "50b49d8af5d364665b463c23f6a4d8bb",
            md5: "fbba66e0df2426996277b299710c3033",
            path: "script_agent_decision.md",
            name: "script_agent_decision",
            description: "",
            embedding: "",
            type: "main",
            createTime: 1774447310118,
            updateTime: 1774447310118,
            state: -1,
          },
          {
            id: "427727727e1095c54b6840cd21382d82",
            md5: "7e5911242af7233854d533278c6a8ccb",
            path: "script_agent_execution.md",
            name: "script_agent_execution",
            description: "",
            embedding: "",
            type: "main",
            createTime: 1774447310118,
            updateTime: 1774447310118,
            state: -1,
          },
          {
            id: "02848fb0dd582fd926502c77ecf9679c",
            md5: "7a8b6a311b015cd47bf17cc52b935348",
            path: "script_agent_supervision.md",
            name: "script_agent_supervision",
            description: "",
            embedding: "",
            type: "main",
            createTime: 1774447310118,
            updateTime: 1774447310118,
            state: -1,
          },
          {
            id: "a1e818cc03a0b355b239ac1fb0512969",
            md5: "1fd22029e8047aa30b0dfd703cb837ed",
            path: "universal_agent.md",
            name: "universal_agent",
            description: "",
            embedding: "",
            type: "main",
            createTime: 1774447310118,
            updateTime: 1774447310118,
            state: -1,
          },
          {
            id: "3e5efec258c8d8e6a39bcef12f8ee058",
            md5: "efccb0464cfd472861b49ebf737d4820",
            path: "references/event_extract.md",
            name: "event_extract",
            description:
              "专为小说改编短剧设计的文本分析助手，逐章提取涉及角色、核心事件、主线关系、信息密度、预估集长及情绪强度等结构化信息，以Markdown表格形式输出，并附汇总统计，辅助短剧制作的内容规划与时长估算。",
            embedding: "",
            type: "references",
            createTime: 1774447310118,
            updateTime: 1774450165911,
            state: 1,
          },
          {
            id: "52c51fa8655f899a1b7aae9b6aad7251",
            md5: "783678aaab829b34e7c30a414c356bf6",
            path: "references/novel_character_extract.md",
            name: "novel_character_extract",
            description:
              "专为小说内容分析设计的角色提取助手，从原文中识别并结构化输出所有重要角色的视觉描述信息，包括外貌、服饰、体态、状态变体等字段，供美术制作和AI角色图生成使用。",
            embedding: "",
            type: "references",
            createTime: 1774447310118,
            updateTime: 1774450080903,
            state: 1,
          },
          {
            id: "6d46cdca10b2f49e07e515885d1387a0",
            md5: "10544d12c4ef011e6b3b63a99b8c7fa8",
            path: "references/novel_props_extract.md",
            name: "novel_props_extract",
            description:
              "专注于从小说原文中提取道具物品信息的分析助手，能识别武器、法器、药物等各类道具，生成包含外观、材质、尺寸、功能及状态变体的结构化视觉描述表格，供美术制作和AI绘图使用。",
            embedding: "",
            type: "references",
            createTime: 1774447310118,
            updateTime: 1774450094771,
            state: 1,
          },
          {
            id: "1864df75d1d65f76e275046649ecaef8",
            md5: "65603aa495a541f54c55b7f30e149f45",
            path: "references/novel_scene_extract.md",
            name: "novel_scene_extract",
            description:
              "专注于从小说原文中提取并结构化场景信息的分析助手，可识别各类场景地点，输出包含空间描述、光照氛围、关键陈设、色调基调等字段的标准化场景资产表，用于美术制作和AI绘图的场景概念图生成。",
            embedding: "",
            type: "references",
            createTime: 1774447310118,
            updateTime: 1774450161878,
            state: 1,
          },
          {
            id: "7fbce6f90d7d85496ba9817e9622e640",
            md5: "830559e8f2cd5d0fa8e6df48a164fe2d",
            path: "references/video_dialogue_extract.md",
            name: "video_dialogue_extract",
            description:
              "这是一个专门从视频分镜提示词中提取结构化台词、旁白与音效信息的AI助手配置文档，定义了完整的输出格式（含镜号、角色、台词类型、表演指导等字段）、提取规则及处理流程，用于将视频分镜描述转化为标准化台词表。",
            embedding: "",
            type: "references",
            createTime: 1774447310118,
            updateTime: 1774450180712,
            state: 1,
          },
          {
            id: "31fb5c5a1f514ec1e66b4eba9f22d4db",
            md5: "43e63450efe0c9af8a3a40b036d36cb4",
            path: "references/pipeline.md",
            name: "pipeline",
            description:
              "面向短剧改编项目的四阶段流水线说明文档，涵盖事件提取、故事骨架、改编策略、剧本编写的串行执行流程，定义了决策层、执行层、监督层的协作规范及派发、审核、修复的交互格式与质量门控标准。",
            embedding: "",
            type: "references",
            createTime: 1774451946248,
            updateTime: 1774451984533,
            state: 1,
          },
          {
            id: "27dc2dfc901de2180227d0269217583a",
            md5: "7d353be4bab7a794436d9abff2b9c6ee",
            path: "references/adaptation_format.md",
            name: "adaptation_format",
            description:
              "本文档规定了改编策略输出的标准格式，包括核心改编原则、删除决策和世界观呈现策略三大模块的书写规范，明确各模块所需涵盖的维度与要素，用于指导竖屏短剧等载体的文学改编工作。",
            embedding: "",
            type: "references",
            createTime: 1774452010535,
            updateTime: 1774452022083,
            state: 1,
          },
          {
            id: "d49fa09504fe784a8e6eb102756c6d56",
            md5: "2ef08a7479f29d74986999ceb02092c8",
            path: "references/event_format.md",
            name: "event_format",
            description:
              "本文档规定了影视改编项目中事件表的标准输出格式，包括文件头、事件表格、各字段填写规范（章节、角色、核心事件、主线关系、情绪强度、预估时长）及汇总统计模板，用于指导从原著提取事件并评估改编集数与压缩比的第一阶段工作。",
            embedding: "",
            type: "references",
            createTime: 1774452010535,
            updateTime: 1774452030858,
            state: 1,
          },
          {
            id: "797906c2ddf0750f050bcdeae23eae3d",
            md5: "f5e7fe6db7e05db69d5dc327c4c538f2",
            path: "references/script_format.md",
            name: "script_format",
            description:
              "本文档为竖屏短剧剧本的输出格式规范，定义了文件头、节拍结构、分镜脚本、画面描述、台词、转场标注等标准格式要求，并附有时长控制参数与自查清单，供AI视频生成和导演制作使用。",
            embedding: "",
            type: "references",
            createTime: 1774452010535,
            updateTime: 1774452042934,
            state: 1,
          },
          {
            id: "1abd8675c0c3e62b20c0b151d2ec0fb1",
            md5: "a587532c737ce15022e1522021f099bb",
            path: "references/skeleton_format.md",
            name: "skeleton_format",
            description:
              "本文档定义了故事骨架文件（skeleton.md）的标准化输出格式，涵盖故事核、人物成长隐线、三幕结构、分集决策模板、全局删减记录、付费卡点设计及自查清单，用于指导编剧将章节事件列表转化为结构完整的剧集改编方案。",
            embedding: "",
            type: "references",
            createTime: 1774452010535,
            updateTime: 1774452057184,
            state: 1,
          },
          {
            id: "0b7828d7a6ab458a4b201122f08d6c16",
            md5: "120b3c856f1b2a8a429e11319e8c95fe",
            path: "references/quality_criteria.md",
            name: "quality_criteria",
            description:
              "本文档为影视/短剧项目的质量审核标准手册，涵盖事件表、故事骨架、改编策略和剧本四大模块的详细审核规则，规定了格式规范、角色名称统一、时长合理性、画面可执行性及场景氛围一致性等审核要求，用于确保各阶段产出物的内容准确性与制作可行性。",
            embedding: "",
            type: "references",
            createTime: 1774452068093,
            updateTime: 1774452087877,
            state: 1,
          },
          {
            id: "5c1772b5f9c420d9eae9ca02914ba087",
            md5: "c710ab7d237e1f0c5aa3d208e0f5b484",
            path: "references/plan.md",
            name: "plan",
            description:
              "该文档定义了AI代理生成执行计划的规范，包括任务总览、步骤列表（含编号、名称、详细内容、预期输出及依赖关系）和执行顺序标注，并提供标准回复模板，用于将用户需求拆解为可直接传入子代理工具执行的具体步骤。",
            embedding: "",
            type: "references",
            createTime: 1774452098447,
            updateTime: 1774452109574,
            state: 1,
          },
          {
            id: "75a45cf996015ca819582873887ec301",
            md5: "6045d76873fd58b8b87a914a21a38439",
            path: "references/derive_assets_extraction.md",
            name: "derive_assets_extraction",
            description:
              "本文档是一份技术操作指南，说明如何根据剧本内容和已有资产列表，提取每个资产在剧情中出现的不同视觉状态变体（derive），并通过工具函数读取和写入数据，用于后续图片生成参考。",
            embedding: "",
            type: "references",
            createTime: 1774452119499,
            updateTime: 1774452129516,
            state: 1,
          },
          {
            id: "fce75f69d704c19bebcb356bc1bd6e81",
            md5: "a3b3432854970f22949ba47236a6532f",
            path: "references/storyboard_generation.md",
            name: "storyboard_generation",
            description:
              "根据剧本和资产列表生成结构化分镜面板的工具指南，涵盖分镜拆分原则、字段填写规范及工具调用流程，用于将剧本转化为含画面描述、镜头语言、台词和AI绘图提示词的分镜数据。",
            embedding: "",
            type: "references",
            createTime: 1774452119499,
            updateTime: 1774452140873,
            state: 1,
          },
        ];
        await Promise.all(
          list.map(async (item) => {
            const embedding = await getEmbedding(item.description);
            item.embedding = JSON.stringify(embedding);
          }),
        );
        await knex("o_skillList").insert(list);
      },
    },
    {
      name: "o_skillAttribution",
      builder: (table) => {
        table.text("skillId").notNullable().references("id").inTable("o_skillList").onDelete("CASCADE");
        table.text("attribution").notNullable(); // "production_agent_decision.md" | "production_agent_execution.md" | "production_agent_supervision.md" | "script_agent_decision.md" | "script_agent_execution.md" | "script_agent_supervision.md" | "universal_agent.md"
        table.primary(["skillId", "attribution"]);
        table.index(["attribution"]);
      },
      initData: async (knex) => {
        await knex("o_skillAttribution").insert([
          {
            skillId: "52c51fa8655f899a1b7aae9b6aad7251",
            attribution: "universal_agent.md",
          },
          {
            skillId: "6d46cdca10b2f49e07e515885d1387a0",
            attribution: "universal_agent.md",
          },
          {
            skillId: "1864df75d1d65f76e275046649ecaef8",
            attribution: "universal_agent.md",
          },
          {
            skillId: "3e5efec258c8d8e6a39bcef12f8ee058",
            attribution: "universal_agent.md",
          },
          {
            skillId: "7fbce6f90d7d85496ba9817e9622e640",
            attribution: "universal_agent.md",
          },
          {
            skillId: "31fb5c5a1f514ec1e66b4eba9f22d4db",
            attribution: "script_agent_decision.md",
          },
          {
            skillId: "27dc2dfc901de2180227d0269217583a",
            attribution: "script_agent_execution.md",
          },
          {
            skillId: "d49fa09504fe784a8e6eb102756c6d56",
            attribution: "script_agent_execution.md",
          },
          {
            skillId: "797906c2ddf0750f050bcdeae23eae3d",
            attribution: "script_agent_execution.md",
          },
          {
            skillId: "1abd8675c0c3e62b20c0b151d2ec0fb1",
            attribution: "script_agent_execution.md",
          },
          {
            skillId: "0b7828d7a6ab458a4b201122f08d6c16",
            attribution: "script_agent_supervision.md",
          },
          {
            skillId: "5c1772b5f9c420d9eae9ca02914ba087",
            attribution: "production_agent_decision.md",
          },
          {
            skillId: "75a45cf996015ca819582873887ec301",
            attribution: "production_agent_execution.md",
          },
          {
            skillId: "fce75f69d704c19bebcb356bc1bd6e81",
            attribution: "production_agent_execution.md",
          },
        ]);
      },
    },
    //记忆表（message=原始消息, summary=压缩摘要）
    {
      name: "memories",
      builder: (table) => {
        table.text("id").notNullable();
        table.text("isolationKey").notNullable(); // 记忆隔离键
        table.text("type").notNullable(); // 'message' | 'summary'
        table.text("role"); // 'user' | 'assistant'
        table.text("name");
        table.text("content").notNullable();
        table.text("embedding"); // 向量嵌入 JSON
        table.text("relatedMessageIds"); // summary关联的message id列表 JSON
        table.integer("summarized").defaultTo(0); // message是否已被总结 0/1
        table.integer("createTime").notNullable();
        table.primary(["id"]);
        table.index(["isolationKey", "type"]);
        table.index(["isolationKey", "summarized"]);
      },
    },
    {
      name: "o_assetsRole2Audio",
      builder: (table) => {
        table.integer("assetsRoleId").notNullable();
        table.integer("assetsAudioId").notNullable();
        table.primary(["assetsAudioId", "assetsRoleId"]);
        table.unique(["assetsAudioId", "assetsRoleId"]);
      },
    },
  ];

  for (const t of tables) {
    const tableExists = await knex.schema.hasTable(t.name);
    if (!tableExists || forceInit) {
      if (tableExists && forceInit) {
        await knex.schema.dropTable(t.name);
        console.log("[初始化数据库] 已存在表删除并重建:", t.name);
      } else {
        console.log("[初始化数据库] 创建数据表:", t.name);
      }
      await knex.schema.createTable(t.name, t.builder);
      if (t.initData) {
        await t.initData(knex);
        console.log("[初始化数据库] 表数据初始化:", t.name);
      }
    }
  }
};
