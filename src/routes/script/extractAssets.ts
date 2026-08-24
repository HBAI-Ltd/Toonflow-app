import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { useSkill } from "@/utils/agent/skillsTools";
import { tool, jsonSchema } from "ai";
import { o_script } from "@/types/database";
import { t, getLocale, getPromptLanguage } from "@/i18n";

const router = express.Router();

// NewAssetSchema/ExistingAssetRefSchema are Zod tool-schema descriptions read by the model
// (see resultTool below), so they take prompt_language, never content_language.

/** 新资产：AI 首次识别到的资产，需要完整信息 */
const NewAssetSchema = (locale: Awaited<ReturnType<typeof getPromptLanguage>>) =>
  z.object({
    name: z.string().describe(t("agent.script.extractAssets.assetName", {}, locale)),
    desc: z.string().describe(t("agent.script.extractAssets.assetDesc", {}, locale)),
    type: z.enum(["role", "tool", "scene"]).describe(t("agent.script.extractAssets.assetType", {}, locale)),
    scriptIds: z.array(z.number()).describe(t("agent.script.extractAssets.scriptIds", {}, locale)),
  });

/** 已有资产：数据库中已存在的资产，只需给出名称和关联的剧本 */
const ExistingAssetRefSchema = (locale: Awaited<ReturnType<typeof getPromptLanguage>>) =>
  z.object({
    name: z.string().describe(t("agent.script.extractAssets.existingAssetName", {}, locale)),
    scriptIds: z.array(z.number()).describe(t("agent.script.extractAssets.scriptIds", {}, locale)),
  });

export const AssetSchema = z.object({
  name: z.string().describe("资产名称,仅为名称不做其他任何表述"), // i18n-ignore — unused exported schema (no importers in codebase), description never reaches AI or user
  desc: z.string().describe("资产描述"), // i18n-ignore — unused exported schema, see above
  type: z.enum(["role", "tool", "scene"]).describe("资产类型"), // i18n-ignore — unused exported schema, see above
});

type NewAsset = z.infer<ReturnType<typeof NewAssetSchema>>;
type ExistingAssetRef = z.infer<ReturnType<typeof ExistingAssetRefSchema>>;
type Asset = z.infer<typeof AssetSchema>;

/** 每批 AI 调用的结果 */
type GroupResult = {
  batchScriptIds: number[];
  newAssets: NewAsset[];
  existingRefs: ExistingAssetRef[];
} | null;

/** 将 scriptIds 数组按 groupSize 分组 */
function chunkArray(arr: number[], groupSize: number): number[][][] {
  const chunks: number[][] = [];
  for (let i = 0; i < arr.length; i += 5) {
    chunks.push(arr.slice(i, i + 5));
  }
  const groupChunks = [];
  for (let i = 0; i < chunks.length; i += groupSize) {
    groupChunks.push(chunks.slice(i, i + groupSize));
  }
  return groupChunks;
}

export default router.post(
  "/",
  validateFields({
    scriptIds: z.array(z.number()),
    projectId: z.number(),
    groupSize: z.number().min(1).optional(),
  }),
  async (req, res) => {
    const { scriptIds, projectId, groupSize = 5 } = req.body;
    const locale = await getLocale(req as any);
    // Text sent into u.Ai.Text().invoke() below (schema descriptions, tool description/result,
    // system/user prompt content) is model-facing and follows prompt_language instead of
    // `locale` (content_language) — see the resultTool/output block further down.
    const promptLocale = await getPromptLanguage();

    if (!scriptIds.length) return res.status(400).send(error(t("script.extractAssets.selectScriptFirst", {}, locale)));
    const scripts = await u.db("o_script").whereIn("id", scriptIds);

    // 构建 scriptId -> script 内容的映射
    const scriptMap = new Map(scripts.map((s: o_script) => [s.id, s]));

    await u.db("o_script").whereIn("id", scriptIds).update({
      extractState: 2,
    });

    const errors: { scriptId: number; error: string }[] = [];
    let successCount = 0;

    // 将 scriptIds 按 groupSize（默认5）分组，每组一起发给 AI
    const scriptGroups = chunkArray(scriptIds as number[], groupSize);

    /** 一组剧本提取完成后统一入库并建立关联 */
    async function persistGroupResult(result: GroupResult) {
      if (!result) return;
      const { batchScriptIds, newAssets, existingRefs } = result;
      if (!newAssets.length && !existingRefs.length) return;

      // 查询已有资产
      const existingAssets = await u.db("o_assets").where("projectId", projectId).select("id", "name");
      const existingMap = new Map(existingAssets.map((a) => [a.name!, a.id!]));

      // 插入新资产（不在已有列表中的）
      const toInsert = newAssets.filter((asset) => !existingMap.has(asset.name));
      if (toInsert.length) {
        await u.db("o_assets").insert(
          toInsert.map((asset) => ({
            name: asset.name,
            type: asset.type,
            describe: asset.desc,
            projectId: projectId,
            startTime: Date.now(),
          })),
        );
      }

      // 重新查询获取完整的 name -> id 映射
      const allAssets = await u.db("o_assets").where("projectId", projectId).select("id", "name");
      const nameToId = new Map(allAssets.map((a) => [a.name, a.id]));

      // 收集所有资产与剧本的关联关系
      const scriptAssetRows: { scriptId: number; assetId: number }[] = [];

      // 新资产的关联
      for (const asset of newAssets) {
        const assetId = nameToId.get(asset.name);
        if (assetId) {
          for (const sid of asset.scriptIds) {
            scriptAssetRows.push({ scriptId: sid, assetId });
          }
        }
      }

      // 已有资产的关联
      for (const ref of existingRefs) {
        const assetId = nameToId.get(ref.name);
        if (assetId) {
          for (const sid of ref.scriptIds) {
            scriptAssetRows.push({ scriptId: sid, assetId });
          }
        }
      }

      // 去重：相同 scriptId + assetId 只保留一条
      const uniqueRows = [...new Map(scriptAssetRows.map((r) => [`${r.scriptId}_${r.assetId}`, r])).values()];

      // 先删除本批 scriptId 的旧关联，再插入新的
      await u.db("o_scriptAssets").whereIn("scriptId", batchScriptIds).delete();
      if (uniqueRows.length) {
        await u.db("o_scriptAssets").insert(uniqueRows);
      }

      // 本批成功的剧本状态更新为 1（成功）
      await u.db("o_script").whereIn("id", batchScriptIds).where("projectId", projectId).update({
        extractState: 1,
        errorReason: null,
      });
    }
    res.send(success(t("script.extractAssets.started", {}, locale)));

    function processGroup(group: number[][][]) {
      group.map(async (itemIds) => {
        const validScripts: { id: number; script: o_script }[] = [];
        for (const scriptIds of itemIds as number[][]) {
          for (const scriptId of scriptIds) {
            const script = scriptMap.get(scriptId);
            if (!script) {
              const notFoundMsg = t("script.extractAssets.scriptNotFound", {}, locale);
              errors.push({ scriptId, error: notFoundMsg });
              await u.db("o_script").where("id", scriptId).where("projectId", projectId).update({ extractState: -1, errorReason: notFoundMsg });
            } else {
              // 查看状态是否为等待提取，仅对等待提取进行生成
              const item = await u.db("o_script").where("projectId", projectId).where("id", scriptId).select("extractState").first();
              if (item?.extractState == 2) {
                validScripts.push({ id: scriptId, script });
              }
            }
          }
        }
        if (!validScripts.length) return;
        const validScriptIds = validScripts.map((v) => v.id);
        // 修改状态为正在提取中
        await u.db("o_script").where("projectId", projectId).whereIn("id", validScriptIds).update({
          extractState: 0, // 正在提取
        });
        // 查询当前项目已有的资产列表，提供给 AI 参考
        const existingAssets = await u.db("o_assets").where("projectId", projectId).select("name", "type");
        const existingAssetsList = existingAssets.map((a) => `${a.name}(${a.type})`).join("、"); // i18n-ignore — AI-prompt list separator, only interpolated into an agent prompt, never rendered to a user

        // 拼接多集剧本内容，每集用分隔标记
        const scriptsContent = validScripts
          .map(
            ({ id, script }) =>
              `${t("agent.script.extractAssets.scriptMarker", { id, name: script.name || "" }, promptLocale)}\n${script.content}`,
          )
          .join("\n\n");

        let collectedNew: NewAsset[] = [];
        let collectedExisting: ExistingAssetRef[] = [];
        try {
          const resultTool = tool({
            description: t("agent.script.extractAssets.resultToolDescribe", {}, promptLocale),
            inputSchema: jsonSchema<{ newAssets: NewAsset[]; existingAssetRefs: ExistingAssetRef[] }>(
              z
                .object({
                  newAssets: z.array(NewAssetSchema(promptLocale)).describe(t("agent.script.extractAssets.newAssetsDescribe", {}, promptLocale)),
                  existingAssetRefs: z
                    .array(ExistingAssetRefSchema(promptLocale))
                    .describe(t("agent.script.extractAssets.existingAssetRefsDescribe", {}, promptLocale)),
                })
                .toJSONSchema(),
            ),
            execute: async ({ newAssets, existingAssetRefs }) => {
              if (newAssets?.length) collectedNew = newAssets;
              if (existingAssetRefs?.length) collectedExisting = existingAssetRefs;
              return t("agent.script.extractAssets.toolResultReply", {}, promptLocale);
            },
          });
          const promptData = await u.db("o_prompt").where("type", "scriptAssetExtraction").first();
          let scriptAssetExtraction = "" as string | undefined;
          if (promptData && promptData.useData) {
            scriptAssetExtraction = promptData.useData;
          } else {
            scriptAssetExtraction = promptData?.data ?? undefined;
          }
          const existingHint = existingAssetsList
            ? t("agent.script.extractAssets.existingHint", { existingAssetsList }, promptLocale)
            : "";
          const output = await u.Ai.Text("universalAi").invoke({
            messages: [
              {
                role: "system",
                content: scriptAssetExtraction + t("agent.script.extractAssets.systemPromptSuffix", {}, promptLocale),
              },
              {
                role: "user",
                content: t(
                  "agent.script.extractAssets.userPrompt",
                  { existingHint, count: validScripts.length, scriptsContent },
                  promptLocale,
                ),
              },
            ],
            tools: { resultTool },
          });
          await persistGroupResult({
            batchScriptIds: validScriptIds,
            newAssets: collectedNew,
            existingRefs: collectedExisting,
          });
        } catch (e) {
          console.error(`[extractAssets] group=[${validScriptIds.join(",")}] 提取失败:`, e); // i18n-ignore — server-side log message, not user-facing text
          for (const { id, script } of validScripts) {
            errors.push({ scriptId: id, error: (script.name || "") + ":" + u.error(e).message });
            await u
              .db("o_script")
              .where("id", id)
              .where("projectId", projectId)
              .update({ extractState: -1, errorReason: u.error(e).message });
          }
          return;
        }
        if (!collectedNew.length && !collectedExisting.length) {
          const noAssetsMsg = t("script.extractAssets.noAssetsReturned", {}, locale);
          for (const { id } of validScripts) {
            errors.push({ scriptId: id, error: noAssetsMsg });
            await u.db("o_script").where("id", id).where("projectId", projectId).update({ extractState: -1, errorReason: noAssetsMsg });
          }
          return;
        }
      });
    }
    processGroup(scriptGroups);
  },
);
