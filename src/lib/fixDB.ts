import u from "@/utils";
import path from "path";
import fs from "fs";
import { Knex } from "knex";
import db from "@/utils/db";
import { transform } from "sucrase";
import rawVendorData from "./vendor.json";
import { t, getLocale } from "@/i18n";
import { syncGuardedPromptSeeds, ensureAudioBindPromptSeeded } from "./migrations/promptSeedSync";

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
  // `o_setting` (and its `content_language` row) is always created by initDB before fixDB runs, so getLocale()
  // can safely query the database here — see task-6f-report.md for the full reachability analysis.
  const locale = await getLocale();
  const exitReason = t("lib.fixDB.exitReason", {}, locale);

  //矫正因软件异常退出导致的状态不一致问题
  await db("o_novel").where("eventState", 0).update({
    eventState: -1,
    errorReason: exitReason,
  });
  await db("o_script").where("extractState", 0).update({
    extractState: -1,
    errorReason: exitReason,
  });
  await db("o_assets")
    .where("promptState", "生成中") // i18n-ignore — stored o_assets.promptState enum value, not user-facing text
    .update({
      promptState: "生成失败", // i18n-ignore — stored o_assets.promptState enum value, not user-facing text
      promptErrorReason: exitReason,
    });
  await db("o_image")
    .where("state", "生成中") // i18n-ignore — stored o_image.state enum value, not user-facing text
    .update({
      state: "生成失败", // i18n-ignore — stored o_image.state enum value, not user-facing text
      errorReason: exitReason,
    });
  await db("o_storyboard")
    .where("state", "生成中") // i18n-ignore — stored o_storyboard.state enum value, not user-facing text
    .update({
      state: "生成失败", // i18n-ignore — stored o_storyboard.state enum value, not user-facing text
      reason: exitReason,
    });
  await db("o_video")
    .where("state", "生成中") // i18n-ignore — stored o_video.state enum value, not user-facing text
    .update({
      state: "生成失败", // i18n-ignore — stored o_video.state enum value, not user-facing text
      errorReason: exitReason,
    });

  // 添加新字段
  await addColumn("o_prompt", "useData", "text");
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
  //检测是否包含新增音色绑定提示词（仅在缺失时插入，不覆盖已存在的行）
  await ensureAudioBindPromptSeeded(knex, locale);
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
  // Names/descs match the o_agentDeploy seed translations in initDB.ts (rule 5: seeded once, one-way to English).
  const advancedAgentList = [
    { key: "scriptAgent:decisionAgent", name: "Script Agent: Decision Layer", desc: "Decision layer" },
    { key: "scriptAgent:supervisionAgent", name: "Script Agent: Supervision Layer", desc: "Supervision layer" },
    { key: "scriptAgent:storySkeletonAgent", name: "Script Agent: Story Skeleton", desc: "Story skeleton generation" },
    { key: "scriptAgent:adaptationStrategyAgent", name: "Script Agent: Adaptation Strategy", desc: "Adaptation strategy generation" },
    { key: "scriptAgent:scriptAgent", name: "Script Agent: Script Generation", desc: "Script generation" },
    { key: "productionAgent:decisionAgent", name: "Production Agent: Decision Layer", desc: "Decision layer" },
    { key: "productionAgent:supervisionAgent", name: "Production Agent: Supervision Layer", desc: "Supervision layer" },
    { key: "productionAgent:deriveAssetsAgent", name: "Production Agent: Derived Assets", desc: "Derived assets" },
    { key: "productionAgent:generateAssetsAgent", name: "Production Agent: Asset Generation", desc: "Asset generation" },
    { key: "productionAgent:directorPlanAgent", name: "Production Agent: Director Planning", desc: "Director planning" },
    { key: "productionAgent:storyboardGenAgent", name: "Production Agent: Storyboard Generation", desc: "Storyboard generation" },
    { key: "productionAgent:storyboardPanelAgent", name: "Production Agent: Storyboard Panel", desc: "Storyboard panel generation" },
    { key: "productionAgent:storyboardTableAgent", name: "Production Agent: Storyboard Table", desc: "Storyboard table generation" },
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
  // Guarded re-sync (not an unconditional overwrite): only replaces o_prompt.data for every seed
  // prompt type (SEED_PROMPT_TYPES — eventExtraction, scriptAssetExtraction,
  // videoPromptGeneration, audioBindPrompt) when the stored value still exactly matches a known
  // seed variant (see src/lib/migrations/promptSeedSync.ts) — i.e. it still provably holds seed
  // text, not a hand-edited value. That guard is what makes it safe to re-sync this column on
  // every restart, including after a locale change, without ever clobbering a `data` value someone
  // set by hand; see that module's doc comment for details.
  await syncGuardedPromptSeeds(knex, locale);

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

  // Carries translated seed strings (Tasks 5–8) to machines that already had the app installed.
  // On a fresh install, initDB seeds English directly and this is a no-op; on an existing install,
  // it replaces only values that still match the old Chinese seed exactly, so user edits are never
  // touched. Never allowed to throw — see safeMigrateI18nSeed's doc comment.
  const { safeMigrateI18nSeed } = await import("./migrations/i18nSeed");
  const i18nSeedResult = await safeMigrateI18nSeed(knex, { vendorDir: u.getPath("vendor"), locale });
  if (i18nSeedResult.updated > 0) {
    console.log(
      `[i18n] migrated ${i18nSeedResult.updated} old-install seed value(s) to the current locale ` +
        `(vendor files: ${i18nSeedResult.vendorFiles.updated}, agentDeploy: ${i18nSeedResult.agentDeploy.updated}, ` +
        `prompt: ${i18nSeedResult.prompt.updated}, taskClass: ${i18nSeedResult.taskClass.updated}; ` +
        `skipped ${i18nSeedResult.skipped} value(s) already edited by the user)`,
    );
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
