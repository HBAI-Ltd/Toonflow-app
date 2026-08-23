import type { Knex } from "knex";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { t, type Locale } from "@/i18n";
import zhCatalog from "@/i18n/locales/zh.json";
import rawVendorData from "../vendor.json";

const vendorData = rawVendorData as Record<string, string>;

/**
 * o_agentDeploy.name / o_agentDeploy.desc were seeded once in Chinese by an earlier version of
 * initDB.ts and are now seeded in English. Recovered from `git show 692cd4c:src/lib/initDB.ts`
 * (the commit immediately before batch 6f translated these strings). Keyed by o_agentDeploy.key.
 */
// Every "zh" value below is an old Chinese seed string kept only for exact-match comparison
// against existing rows — never displayed to a user. Recovered via `git show 692cd4c:src/lib/initDB.ts`
// (rule 5 in the codebase's i18n conventions: seeded once, translated one-way; the old value must
// stay recoverable here so this migration can detect "still the seed" vs. "user edited it").
const AGENT_DEPLOY_SEED_MAP: Record<string, { name: { zh: string; en: string }; desc: { zh: string; en: string } }> = {
  scriptAgent: {
    name: { zh: "剧本Agent", en: "Script Agent" }, // i18n-ignore — old seed value, comparison-only
    desc: {
      zh: "用于读取原文生成故事骨架、改编策略，建议使用具备强大文本理解和生成能力的模型", // i18n-ignore — old seed value, comparison-only
      en: "Reads the source text to generate the story skeleton and adaptation strategy. A model with strong text comprehension and generation ability is recommended.",
    },
  },
  productionAgent: {
    name: { zh: "生产Agent", en: "Production Agent" }, // i18n-ignore — old seed value, comparison-only
    desc: {
      zh: "对工作流进行调度和管理，建议使用具备较强的逻辑推理和任务管理能力的模型", // i18n-ignore — old seed value, comparison-only
      en: "Schedules and manages the production workflow. A model with strong logical reasoning and task management ability is recommended.",
    },
  },
  universalAi: {
    name: { zh: "通用AI", en: "General AI" }, // i18n-ignore — old seed value, comparison-only
    desc: {
      zh: "用于小说事件提取、资产提示词生成、台词提取等边缘功能，建议使用具备较强文本处理能力的模型", // i18n-ignore — old seed value, comparison-only
      en: "Used for edge tasks such as novel event extraction, asset prompt generation, and dialogue extraction. A model with strong text processing ability is recommended.",
    },
  },
  ttsDubbing: {
    name: { zh: "TTS配音", en: "TTS Dubbing" }, // i18n-ignore — old seed value, comparison-only
    desc: {
      zh: "根据剧本内容生成角色配音，支持多种声音风格和情绪", // i18n-ignore — old seed value, comparison-only
      en: "Generates character dubbing from the script content, supporting a variety of voice styles and emotions.",
    },
  },
  "scriptAgent:decisionAgent": {
    name: { zh: "剧本Agent:决策层", en: "Script Agent: Decision Layer" }, // i18n-ignore — old seed value, comparison-only
    desc: { zh: "决策层", en: "Decision layer" }, // i18n-ignore — old seed value, comparison-only
  },
  "scriptAgent:supervisionAgent": {
    name: { zh: "剧本Agent:监督层", en: "Script Agent: Supervision Layer" }, // i18n-ignore — old seed value, comparison-only
    desc: { zh: "监督层", en: "Supervision layer" }, // i18n-ignore — old seed value, comparison-only
  },
  "scriptAgent:storySkeletonAgent": {
    name: { zh: "剧本Agent:故事骨架", en: "Script Agent: Story Skeleton" }, // i18n-ignore — old seed value, comparison-only
    desc: { zh: "故事骨架生成", en: "Story skeleton generation" }, // i18n-ignore — old seed value, comparison-only
  },
  "scriptAgent:adaptationStrategyAgent": {
    name: { zh: "剧本Agent:改编策略", en: "Script Agent: Adaptation Strategy" }, // i18n-ignore — old seed value, comparison-only
    desc: { zh: "改编策略生成", en: "Adaptation strategy generation" }, // i18n-ignore — old seed value, comparison-only
  },
  "scriptAgent:scriptAgent": {
    name: { zh: "剧本Agent:剧本生成", en: "Script Agent: Script Generation" }, // i18n-ignore — old seed value, comparison-only
    desc: { zh: "剧本生成", en: "Script generation" }, // i18n-ignore — old seed value, comparison-only
  },
  "productionAgent:decisionAgent": {
    name: { zh: "生产Agent:决策层", en: "Production Agent: Decision Layer" }, // i18n-ignore — old seed value, comparison-only
    desc: { zh: "决策层", en: "Decision layer" }, // i18n-ignore — old seed value, comparison-only
  },
  "productionAgent:supervisionAgent": {
    name: { zh: "生产Agent:监督层", en: "Production Agent: Supervision Layer" }, // i18n-ignore — old seed value, comparison-only
    desc: { zh: "监督层", en: "Supervision layer" }, // i18n-ignore — old seed value, comparison-only
  },
  "productionAgent:deriveAssetsAgent": {
    name: { zh: "生产Agent:衍生资产", en: "Production Agent: Derived Assets" }, // i18n-ignore — old seed value, comparison-only
    desc: { zh: "衍生资产", en: "Derived assets" }, // i18n-ignore — old seed value, comparison-only
  },
  "productionAgent:generateAssetsAgent": {
    name: { zh: "生产Agent:生成资产", en: "Production Agent: Asset Generation" }, // i18n-ignore — old seed value, comparison-only
    desc: { zh: "生成资产", en: "Asset generation" }, // i18n-ignore — old seed value, comparison-only
  },
  "productionAgent:directorPlanAgent": {
    name: { zh: "生产Agent:导演规划", en: "Production Agent: Director Planning" }, // i18n-ignore — old seed value, comparison-only
    desc: { zh: "导演规划", en: "Director planning" }, // i18n-ignore — old seed value, comparison-only
  },
  "productionAgent:storyboardGenAgent": {
    name: { zh: "生产Agent:分镜生成", en: "Production Agent: Storyboard Generation" }, // i18n-ignore — old seed value, comparison-only
    desc: { zh: "分镜生成", en: "Storyboard generation" }, // i18n-ignore — old seed value, comparison-only
  },
  "productionAgent:storyboardPanelAgent": {
    name: { zh: "生产Agent:分镜面板", en: "Production Agent: Storyboard Panel" }, // i18n-ignore — old seed value, comparison-only
    desc: { zh: "分镜面板生成", en: "Storyboard panel generation" }, // i18n-ignore — old seed value, comparison-only
  },
  "productionAgent:storyboardTableAgent": {
    name: { zh: "生产Agent:分镜表格", en: "Production Agent: Storyboard Table" }, // i18n-ignore — old seed value, comparison-only
    desc: { zh: "分镜表格生成", en: "Storyboard table generation" }, // i18n-ignore — old seed value, comparison-only
  },
};

/**
 * o_prompt.name was seeded once in Chinese and is now seeded in English. Recovered the same way
 * as AGENT_DEPLOY_SEED_MAP above, from `git show 692cd4c:src/lib/initDB.ts`. Keyed by o_prompt.type,
 * which is stable and not user-editable (unlike name, which the migration must not clobber).
 */
const PROMPT_NAME_SEED_MAP: Record<string, { zh: string; en: string }> = {
  eventExtraction: { zh: "事件提取", en: "Event Extraction" }, // i18n-ignore — old seed value, comparison-only
  scriptAssetExtraction: { zh: "剧本资产提取", en: "Script Asset Extraction" }, // i18n-ignore — old seed value, comparison-only
  videoPromptGeneration: { zh: "视频提示词生成", en: "Video Prompt Generation" }, // i18n-ignore — old seed value, comparison-only
  audioBindPrompt: { zh: "音色绑定", en: "Voice Binding" }, // i18n-ignore — old seed value, comparison-only
};

/**
 * sha256 of the pre-translation content of each data/vendor/<id>.ts file, computed from
 * `git show 67d4e1c:data/vendor/<id>.ts` — 67d4e1c is the parent of 25bd959, the commit that
 * translated src/lib/vendor.json and the checked-in data/vendor/*.ts sources to English.
 * A file on disk in userData is only ever replaced when its hash still matches this table —
 * i.e. it was never edited by the user since being seeded.
 */
const VENDOR_FILE_SHA256: Record<string, string> = {
  "atlascloud.ts": "d3b6523f05a4e8d82ab1f4da8cc2a78fefd2f6f87bff31bdb10581069381866f",
  "deepseek.ts": "17e34b48e30967e089b7601ebb9b486ef0a30175c768eb6a8f96b6d018b10838",
  "grsai.ts": "e2d236c5b2ec113a3443c1005a7901ad973ae9242aa0fe939f40c092d33ac151",
  "klingai.ts": "8102479f0db3edb60cecdab52f0f94f3cdaa4102c83335bb09a6f8118c447842",
  "minimax.ts": "8b3231a85835a858dab817d88c10a72f82726026b27918eab835eae2e35d7716",
  "null.ts": "d028ed33aac234a01930c359e5c7ca77c6798bd7c19c794835528d7b7deda6fe",
  "openai.ts": "b1f630f0fcc078402781a9dbd9b7a83db656ed64a28ddcf219dcab6fbf6d82b4",
  "toonflow.ts": "290b2871ca007495e78a763e6425a33c9f5b151a7c352f44ccb1a96c4fb94b26",
  "vidu.ts": "3c0986814d99c675a89299d4bff4b0f0ae058d1c9853871d43c7e7e30a3272c5",
  "volcengine.ts": "ea52a748aad41c98482af82820fb607bac32c85d134d09432ecfcb2da7f8203b",
  "volcengineSd2.ts": "15c7f3d27d25e9b0b475b85eac4d8a6bbc7ae035455400adb1a36ebce5d1f024",
};

interface CategoryResult {
  updated: number;
  skipped: number;
}

export interface I18nSeedMigrationResult {
  updated: number;
  skipped: number;
  vendorFiles: CategoryResult;
  agentDeploy: CategoryResult;
  prompt: CategoryResult;
  taskClass: CategoryResult;
}

export interface I18nSeedMigrationOptions {
  /** Directory holding the per-vendor userData source files (`u.getPath("vendor")` in production). */
  vendorDir: string;
  /** Locale to translate o_tasks.taskClass into — from `getLocale()`. */
  locale: Locale;
}

function sha256(content: string): string {
  return crypto.createHash("sha256").update(content, "utf-8").digest("hex");
}

async function migrateVendorFiles(vendorDir: string): Promise<CategoryResult> {
  const result: CategoryResult = { updated: 0, skipped: 0 };
  for (const [filename, oldHash] of Object.entries(VENDOR_FILE_SHA256)) {
    const filePath = path.join(vendorDir, filename);
    if (!fs.existsSync(filePath)) continue; // Nothing seeded yet for this vendor — not this migration's job.
    const onDisk = fs.readFileSync(filePath, "utf-8");
    if (sha256(onDisk) !== oldHash) {
      result.skipped++;
      continue;
    }
    const translated = vendorData[filename];
    if (!translated) {
      result.skipped++;
      continue;
    }
    fs.writeFileSync(filePath, translated);
    result.updated++;
  }
  return result;
}

async function migrateAgentDeploy(knex: Knex): Promise<CategoryResult> {
  const result: CategoryResult = { updated: 0, skipped: 0 };
  if (!(await knex.schema.hasTable("o_agentDeploy"))) return result;
  for (const [key, seed] of Object.entries(AGENT_DEPLOY_SEED_MAP)) {
    const rows = await knex("o_agentDeploy").where("key", key).select("id", "name", "desc");
    for (const row of rows) {
      const nameMatches = row.name === seed.name.zh;
      const descMatches = row.desc === seed.desc.zh;
      if (!nameMatches && !descMatches) {
        result.skipped++;
        continue;
      }
      const update: Record<string, string> = {};
      if (nameMatches) update.name = seed.name.en;
      if (descMatches) update.desc = seed.desc.en;
      await knex("o_agentDeploy").where("id", row.id).update(update);
      result.updated++;
    }
  }
  return result;
}

async function migratePrompt(knex: Knex): Promise<CategoryResult> {
  const result: CategoryResult = { updated: 0, skipped: 0 };
  if (!(await knex.schema.hasTable("o_prompt"))) return result;
  for (const [type, seed] of Object.entries(PROMPT_NAME_SEED_MAP)) {
    const rows = await knex("o_prompt").where("type", type).select("id", "name");
    for (const row of rows) {
      if (row.name !== seed.zh) {
        result.skipped++;
        continue;
      }
      await knex("o_prompt").where("id", row.id).update({ name: seed.en });
      result.updated++;
    }
  }
  return result;
}

async function migrateTaskClass(knex: Knex, locale: Locale): Promise<CategoryResult> {
  const result: CategoryResult = { updated: 0, skipped: 0 };
  if (!(await knex.schema.hasTable("o_tasks"))) return result;
  const zh = zhCatalog as Record<string, string>;
  const taskClassKeys = Object.keys(zh).filter((key) => key.startsWith("taskClass."));
  for (const key of taskClassKeys) {
    const oldValue = zh[key];
    const newValue = t(key, {}, locale);
    if (oldValue === newValue) continue; // Nothing to change for this locale/key pair.
    const affected = await knex("o_tasks").where("taskClass", oldValue).update({ taskClass: newValue });
    if (affected > 0) result.updated += affected;
  }
  // "skipped" for taskClass isn't meaningful per-row without scanning every row up front (there is
  // no bounded set of "old seed values" outside the catalog), so it stays 0 and is reported via updated only.
  return result;
}

export async function migrateI18nSeed(
  knex: Knex,
  options: I18nSeedMigrationOptions,
): Promise<I18nSeedMigrationResult> {
  const [vendorFiles, agentDeploy, prompt, taskClass] = await Promise.all([
    migrateVendorFiles(options.vendorDir),
    migrateAgentDeploy(knex),
    migratePrompt(knex),
    migrateTaskClass(knex, options.locale),
  ]);

  return {
    updated: vendorFiles.updated + agentDeploy.updated + prompt.updated + taskClass.updated,
    skipped: vendorFiles.skipped + agentDeploy.skipped + prompt.skipped + taskClass.skipped,
    vendorFiles,
    agentDeploy,
    prompt,
    taskClass,
  };
}

const EMPTY_RESULT: I18nSeedMigrationResult = {
  updated: 0,
  skipped: 0,
  vendorFiles: { updated: 0, skipped: 0 },
  agentDeploy: { updated: 0, skipped: 0 },
  prompt: { updated: 0, skipped: 0 },
  taskClass: { updated: 0, skipped: 0 },
};

/**
 * Same as migrateI18nSeed, but never throws. This runs inside fixDB's IIFE at module import time
 * (see src/utils/db.ts) — an uncaught error here would stop the app from booting, which is far
 * worse than a machine that keeps showing a handful of untranslated seed strings for one more run.
 */
export async function safeMigrateI18nSeed(
  knex: Knex,
  options: I18nSeedMigrationOptions,
): Promise<I18nSeedMigrationResult> {
  try {
    return await migrateI18nSeed(knex, options);
  } catch (err) {
    // Server-only log, plain English — this path can run before any locale/UI context exists.
    console.error("[i18n] seed migration failed and was skipped; app will continue starting:", err);
    return EMPTY_RESULT;
  }
}
