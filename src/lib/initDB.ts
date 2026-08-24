import { Knex } from "knex";
import { v4 as uuid } from "uuid";
import { getEmbedding } from "@/utils/agent/embedding";
import { getSeedPrompt } from "@/lib/prompts";
import { FALLBACK_LOCALE } from "@/i18n/types";

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
            // Seeded once; user-editable afterwards, so translated one-way to English rather than routed through the catalog (rule 5).
            name: "Script Agent",
            desc: "Reads the source text to generate the story skeleton and adaptation strategy. A model with strong text comprehension and generation ability is recommended.",
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent",
            name: "Production Agent",
            desc: "Schedules and manages the production workflow. A model with strong logical reasoning and task management ability is recommended.",
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "universalAi",
            name: "General AI",
            desc: "Used for edge tasks such as novel event extraction, asset prompt generation, and dialogue extraction. A model with strong text processing ability is recommended.",
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "ttsDubbing",
            name: "TTS Dubbing",
            desc: "Generates character dubbing from the script content, supporting a variety of voice styles and emotions.",
            disabled: true,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "scriptAgent:decisionAgent",
            name: "Script Agent: Decision Layer",
            desc: "Decision layer",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "scriptAgent:supervisionAgent",
            name: "Script Agent: Supervision Layer",
            desc: "Supervision layer",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "scriptAgent:storySkeletonAgent",
            name: "Script Agent: Story Skeleton",
            desc: "Story skeleton generation",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "scriptAgent:adaptationStrategyAgent",
            name: "Script Agent: Adaptation Strategy",
            desc: "Adaptation strategy generation",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "scriptAgent:scriptAgent",
            name: "Script Agent: Script Generation",
            desc: "Script generation",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:decisionAgent",
            name: "Production Agent: Decision Layer",
            desc: "Decision layer",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:supervisionAgent",
            name: "Production Agent: Supervision Layer",
            desc: "Supervision layer",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:deriveAssetsAgent",
            name: "Production Agent: Derived Assets",
            desc: "Derived assets",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:generateAssetsAgent",
            name: "Production Agent: Asset Generation",
            desc: "Asset generation",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:directorPlanAgent",
            name: "Production Agent: Director Planning",
            desc: "Director planning",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:storyboardGenAgent",
            name: "Production Agent: Storyboard Generation",
            desc: "Storyboard generation",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:storyboardPanelAgent",
            name: "Production Agent: Storyboard Panel",
            desc: "Storyboard panel generation",
            temperature: 1,
            maxOutputTokens: 0,
            disabled: false,
          },
          {
            model: "",
            modelName: "",
            vendorId: null,
            key: "productionAgent:storyboardTableAgent",
            name: "Production Agent: Storyboard Table",
            desc: "Storyboard table generation",
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
            key: "content_language",
            value: "en",
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
        table.primary(["id"]);
        table.unique(["id"]);
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
            // o_prompt.name is displayed as a label in the Prompt Management UI; seeded once and not user-editable there, so translated one-way to English like the agent config names above.
            name: "Event Extraction",
            type: "eventExtraction",
            data: getSeedPrompt("eventExtraction", FALLBACK_LOCALE), // i18n-ignore — AI prompt content, resolved from src/lib/prompts (see that module for translation status); FALLBACK_LOCALE used here because o_setting's content_language is not reliably reachable from inside initDB's table-init loop (o_setting isn't guaranteed to be seeded first for every caller of initDB, e.g. deleteAllData/clearData/importData; see src/lib/prompts and src/lib/migrations/promptSeedSync for the locale-aware guarded sync that runs afterwards in fixDB)
          },
          {
            name: "Script Asset Extraction",
            type: "scriptAssetExtraction",
            data: getSeedPrompt("scriptAssetExtraction", FALLBACK_LOCALE), // i18n-ignore — AI prompt content, resolved from src/lib/prompts (see that module for translation status); FALLBACK_LOCALE used here because o_setting's content_language is not reliably reachable from inside initDB's table-init loop (o_setting isn't guaranteed to be seeded first for every caller of initDB, e.g. deleteAllData/clearData/importData; see src/lib/prompts and src/lib/migrations/promptSeedSync for the locale-aware guarded sync that runs afterwards in fixDB)
          },
          {
            name: "Video Prompt Generation",
            type: "videoPromptGeneration",
            data: getSeedPrompt("videoPromptGeneration", FALLBACK_LOCALE), // i18n-ignore — AI prompt content, resolved from src/lib/prompts (see that module for translation status); FALLBACK_LOCALE used here because o_setting's content_language is not reliably reachable from inside initDB's table-init loop (o_setting isn't guaranteed to be seeded first for every caller of initDB, e.g. deleteAllData/clearData/importData; see src/lib/prompts and src/lib/migrations/promptSeedSync for the locale-aware guarded sync that runs afterwards in fixDB)
          },
          {
            name: "Voice Binding",
            type: "audioBindPrompt",
            data: getSeedPrompt("audioBindPrompt", FALLBACK_LOCALE), // i18n-ignore — AI prompt content, resolved from src/lib/prompts (see that module for translation status); FALLBACK_LOCALE used here because o_setting's content_language is not reliably reachable from inside initDB's table-init loop (o_setting isn't guaranteed to be seeded first for every caller of initDB, e.g. deleteAllData/clearData/importData; see src/lib/prompts and src/lib/migrations/promptSeedSync for the locale-aware guarded sync that runs afterwards in fixDB)
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
        table.primary(["id"]);
        table.unique(["id"]);
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
        table.primary(["id"]);
        table.unique(["id"]);
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
            description: // i18n-ignore — TODO(i18n): skill metadata description seeded into o_skillList, deferred to the skills-translation plan alongside the referenced .md file content
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
            description: // i18n-ignore — TODO(i18n): skill metadata description seeded into o_skillList, deferred to the skills-translation plan alongside the referenced .md file content
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
            description: // i18n-ignore — TODO(i18n): skill metadata description seeded into o_skillList, deferred to the skills-translation plan alongside the referenced .md file content
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
            description: // i18n-ignore — TODO(i18n): skill metadata description seeded into o_skillList, deferred to the skills-translation plan alongside the referenced .md file content
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
            description: // i18n-ignore — TODO(i18n): skill metadata description seeded into o_skillList, deferred to the skills-translation plan alongside the referenced .md file content
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
            description: // i18n-ignore — TODO(i18n): skill metadata description seeded into o_skillList, deferred to the skills-translation plan alongside the referenced .md file content
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
            description: // i18n-ignore — TODO(i18n): skill metadata description seeded into o_skillList, deferred to the skills-translation plan alongside the referenced .md file content
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
            description: // i18n-ignore — TODO(i18n): skill metadata description seeded into o_skillList, deferred to the skills-translation plan alongside the referenced .md file content
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
            description: // i18n-ignore — TODO(i18n): skill metadata description seeded into o_skillList, deferred to the skills-translation plan alongside the referenced .md file content
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
            description: // i18n-ignore — TODO(i18n): skill metadata description seeded into o_skillList, deferred to the skills-translation plan alongside the referenced .md file content
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
            description: // i18n-ignore — TODO(i18n): skill metadata description seeded into o_skillList, deferred to the skills-translation plan alongside the referenced .md file content
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
            description: // i18n-ignore — TODO(i18n): skill metadata description seeded into o_skillList, deferred to the skills-translation plan alongside the referenced .md file content
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
            description: // i18n-ignore — TODO(i18n): skill metadata description seeded into o_skillList, deferred to the skills-translation plan alongside the referenced .md file content
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
            description: // i18n-ignore — TODO(i18n): skill metadata description seeded into o_skillList, deferred to the skills-translation plan alongside the referenced .md file content
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
        console.log("[initDB] Existing table dropped and recreated:", t.name);
      } else {
        console.log("[initDB] Creating table:", t.name);
      }
      await knex.schema.createTable(t.name, t.builder);
      if (t.initData) {
        await t.initData(knex);
        console.log("[initDB] Table data initialized:", t.name);
      }
    }
  }
};
