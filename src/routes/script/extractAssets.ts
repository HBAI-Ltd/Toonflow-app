import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { useSkill } from "@/utils/agent/skillsTools";
import { tool, jsonSchema } from "ai";
import { o_script } from "@/types/database";
import { addTaskProgress } from "@/utils/taskProgress";
import { applyPromptSnapshotToTask, recordPromptUsage, resolveFunctionPrompt } from "@/utils/promptCenter";

const router = express.Router();

/** 新资产：AI 首次识别到的资产，需要完整信息 */
const NewAssetSchema = z.object({
  name: z.string().describe("资产名称,仅为名称不做其他任何表述"),
  desc: z.string().describe("资产描述"),
  prompt: z.string().optional().describe("资产图片生成提示词，优先英文视觉描述"),
  type: z.enum(["role", "tool", "scene"]).describe("资产类型"),
  scriptIds: z.array(z.number()).describe("使用该资产的剧本id数组"),
});

/** 已有资产：数据库中已存在的资产，只需给出名称和关联的剧本 */
const ExistingAssetRefSchema = z.object({
  name: z.string().describe("已有资产的名称,必须与已有资产列表中的名称完全一致"),
  scriptIds: z.array(z.number()).describe("使用该资产的剧本id数组"),
});

export const AssetSchema = z.object({
  name: z.string().describe("资产名称,仅为名称不做其他任何表述"),
  desc: z.string().describe("资产描述"),
  type: z.enum(["role", "tool", "scene"]).describe("资产类型"),
});

type NewAsset = z.infer<typeof NewAssetSchema>;
type ExistingAssetRef = z.infer<typeof ExistingAssetRefSchema>;
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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
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

    if (!scriptIds.length) return res.status(400).send(error("请先选择剧本"));
    const scripts = await u.db("o_script").whereIn("id", scriptIds);
    const modelName = await u.Ai.resolveModelName("universalAi").catch(() => "universalAi");
    const taskModelName = String(modelName).includes(":") ? String(modelName).split(/:(.+)/)[1] : String(modelName);
    const taskDone = await u.task(projectId, "资产提取", taskModelName, {
      describe: `从 ${scriptIds.length} 集剧本提取角色/场景/道具资产`,
      content: { projectId, scriptIds, scriptId: scriptIds[0] ?? null, groupSize, source: "script.extractAssets" },
    });
    const taskId = taskDone.id;
    const progress = (input: {
      scriptId?: number | null;
      phase: string;
      status: "pending" | "running" | "complete" | "warning" | "error";
      message: string;
      current?: number | null;
      total?: number | null;
      meta?: unknown;
    }) =>
      addTaskProgress({
        taskId,
        projectId,
        scriptId: input.scriptId ?? null,
        phase: input.phase,
        status: input.status,
        message: input.message,
        current: input.current,
        total: input.total,
        meta: input.meta,
      });

    // 构建 scriptId -> script 内容的映射
    const scriptMap = new Map(scripts.map((s: o_script) => [s.id, s]));

    await u.db("o_script").whereIn("id", scriptIds).update({
      extractState: 2,
    });
    await progress({
      phase: "submitted",
      status: "pending",
      message: `已提交 ${scriptIds.length} 集资产提取任务`,
      current: 0,
      total: scriptIds.length,
      meta: { scriptIds, groupSize },
    });

    const errors: { scriptId: number; error: string }[] = [];
    let successCount = 0;
    let warningCount = 0;

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
            prompt: asset.prompt || asset.desc,
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
    res.send(success({ taskId, message: "开始提取资产" }));

    async function processGroupItem(itemIds: number[], itemIndex: number, totalItems: number) {
        const validScripts: { id: number; script: o_script }[] = [];
        for (const scriptId of itemIds) {
            const script = scriptMap.get(scriptId);
            if (!script) {
              errors.push({ scriptId, error: "未找到对应剧本" });
              await u.db("o_script").where("id", scriptId).where("projectId", projectId).update({ extractState: -1, errorReason: "未找到对应剧本" });
              await progress({ scriptId, phase: "read_script", status: "error", message: "未找到对应剧本", current: itemIndex, total: totalItems });
            } else {
              // 查看状态是否为等待提取，仅对等待提取进行生成
              const item = await u.db("o_script").where("projectId", projectId).where("id", scriptId).select("extractState").first();
              if (item?.extractState == 2) {
                validScripts.push({ id: scriptId, script });
              }
            }
        }
        if (!validScripts.length) return;
        const validScriptIds = validScripts.map((v) => v.id);
        // 修改状态为正在提取中
        await u.db("o_script").where("projectId", projectId).whereIn("id", validScriptIds).update({
          extractState: 0, // 正在提取
        });
        await Promise.all(
          validScriptIds.map((scriptId) =>
            progress({
              scriptId,
              phase: "read_script",
              status: "complete",
              message: "已读取剧本内容，准备匹配已有资产",
              current: itemIndex,
              total: totalItems,
            }),
          ),
        );
        // 查询当前项目已有的资产列表，提供给 AI 参考
        const existingAssets = await u.db("o_assets").where("projectId", projectId).select("name", "type");
        const existingAssetsList = existingAssets.map((a) => `${a.name}(${a.type})`).join("、");
        const existingLinks = await u.db("o_scriptAssets").whereIn("scriptId", validScriptIds).select("scriptId");
        const existingLinkCount = new Map<number, number>();
        existingLinks.forEach((link: any) => {
          const sid = Number(link.scriptId);
          existingLinkCount.set(sid, (existingLinkCount.get(sid) || 0) + 1);
        });
        await Promise.all(
          validScriptIds.map((scriptId) =>
            progress({
              scriptId,
              phase: "match_existing_assets",
              status: "complete",
              message: existingAssets.length ? `已读取 ${existingAssets.length} 个已有资产作为去重参考` : "当前项目暂无已有资产，按新资产提取",
              current: itemIndex,
              total: totalItems,
            }),
          ),
        );

        // 拼接多集剧本内容，每集用分隔标记
        const scriptsContent = validScripts
          .map(({ id, script }) => `===== 【剧本ID: ${id}】${script.name || ""} =====\n${script.content}`)
          .join("\n\n");

        let collectedNew: NewAsset[] = [];
        let collectedExisting: ExistingAssetRef[] = [];
        try {
          await Promise.all(
            validScriptIds.map((scriptId) =>
              progress({
                scriptId,
                phase: "ai_extract",
                status: "running",
                message: "正在调用资产提取 Prompt，分析角色/场景/道具",
                current: itemIndex,
                total: totalItems,
              }),
            ),
          );
          const resultTool = tool({
            description: "返回结果时必须调用这个工具",
            inputSchema: jsonSchema<{ newAssets: NewAsset[]; existingAssetRefs: ExistingAssetRef[] }>(
              z
                .object({
                  newAssets: z
                    .array(NewAssetSchema)
                    .describe("新发现的资产列表（不在已有资产列表中的），需要完整的 prompt、name、desc、type 和使用该资产的 scriptIds"),
                  existingAssetRefs: z
                    .array(ExistingAssetRefSchema)
                    .describe("已有资产的引用列表（在已有资产列表中已存在的），只需给出资产名称和使用该资产的 scriptIds"),
                })
                .toJSONSchema(),
            ),
            execute: async ({ newAssets, existingAssetRefs }) => {
              if (newAssets?.length) collectedNew = newAssets;
              if (existingAssetRefs?.length) collectedExisting = existingAssetRefs;
              return "无需回复用户任何内容";
            },
          });
          const scriptAssetExtraction = await resolveFunctionPrompt("scriptAssetExtraction");
          await applyPromptSnapshotToTask(taskId, scriptAssetExtraction, taskModelName);
          await recordPromptUsage({
            effectivePrompt: scriptAssetExtraction,
            modelName: taskModelName,
            taskId,
            relatedType: "script:extractAssets",
            relatedId: projectId,
            meta: { scriptIds: validScriptIds },
          });
          const existingHint = existingAssetsList
            ? `\n\n【已有资产列表】：${existingAssetsList}\n对于已有资产，如果在剧本中出现，必须在 existingAssetRefs 中给出资产名称和对应的 scriptIds 数组，无需重复生成 desc/type/prompt。即使没有发现任何新资产，也必须返回剧本中已使用的 existingAssetRefs，禁止 newAssets 和 existingAssetRefs 同时为空。对于新发现的资产（不在已有列表中），请在 newAssets 中给出完整信息。`
            : "";
          await withTimeout(
            u.Ai.Text("universalAi").invoke({
              messages: [
                {
                  role: "system",
                  content:
                    scriptAssetExtraction.content +
                    "\n\n提取剧本中涉及的资产（角色、场景、道具），参考技能 script_assets_extract 规范，结果必须通过 resultTool 工具返回。" +
                    "\n\n如果剧本只使用已有资产，必须返回 existingAssetRefs；禁止因为没有新资产而返回空数组。" +
                    "\n\n注意：本次会同时提供多集剧本，每集剧本以 ===== 【剧本ID: xxx】 ===== 分隔。你需要分析每集剧本使用了哪些资产，并在输出中用 scriptIds 数组标明每个资产在哪些剧本中出现。",
                },
                {
                  role: "user",
                  content: `当前已有资产列表：${existingHint}\n\n请根据以下${validScripts.length}集剧本提取对应的剧本资产（角色、场景、道具）:\n\n${scriptsContent}`,
                },
              ],
              tools: { resultTool },
            }),
            6 * 60 * 1000,
            "资产提取 AI 调用超过 6 分钟未返回，已自动中断",
          );
          await Promise.all(
            validScriptIds.map((scriptId) =>
              progress({
                scriptId,
                phase: "ai_extract",
                status: "complete",
                message: `AI 返回新资产 ${collectedNew.length} 个、已有资产引用 ${collectedExisting.length} 个`,
                current: itemIndex,
                total: totalItems,
                meta: { newAssets: collectedNew.length, existingAssetRefs: collectedExisting.length },
              }),
            ),
          );
          if (!collectedNew.length && !collectedExisting.length) {
            const retainedScripts = validScripts.filter(({ id }) => (existingLinkCount.get(id) || 0) > 0);
            const failedScripts = validScripts.filter(({ id }) => !(existingLinkCount.get(id) || 0));
            for (const { id } of retainedScripts) {
              const retainedCount = existingLinkCount.get(id) || 0;
              warningCount += 1;
              const message = `AI 未返回任何资产，已保留 ${retainedCount} 个原有关联，建议人工复核`;
              await u.db("o_script").where("id", id).where("projectId", projectId).update({ extractState: 1, errorReason: message });
              await progress({
                scriptId: id,
                phase: "retained_existing_assets",
                status: "warning",
                message,
                current: itemIndex + 1,
                total: totalItems,
                meta: { retainedAssetCount: retainedCount },
              });
            }
            for (const { id } of failedScripts) {
              errors.push({ scriptId: id, error: "AI 未返回任何资产" });
              await u.db("o_script").where("id", id).where("projectId", projectId).update({ extractState: -1, errorReason: "AI 未返回任何资产" });
              await progress({ scriptId: id, phase: "failed", status: "error", message: "AI 未返回任何资产", current: itemIndex, total: totalItems });
            }
            return;
          }
          await Promise.all(
            validScriptIds.map((scriptId) =>
              progress({
                scriptId,
                phase: "persist_assets",
                status: "running",
                message: "正在写入资产库并更新剧本资产关联",
                current: itemIndex,
                total: totalItems,
              }),
            ),
          );
          await persistGroupResult({
            batchScriptIds: validScriptIds,
            newAssets: collectedNew,
            existingRefs: collectedExisting,
          });
        } catch (e) {
          console.error(`[extractAssets] group=[${validScriptIds.join(",")}] 提取失败:`, e);
          for (const { id, script } of validScripts) {
            errors.push({ scriptId: id, error: (script.name || "") + ":" + u.error(e).message });
            await u
              .db("o_script")
              .where("id", id)
              .where("projectId", projectId)
              .update({ extractState: -1, errorReason: u.error(e).message });
            await progress({ scriptId: id, phase: "failed", status: "error", message: u.error(e).message, current: itemIndex, total: totalItems });
          }
          return;
        }
        successCount += validScriptIds.length;
        await Promise.all(
          validScriptIds.map((scriptId) =>
            progress({
              scriptId,
              phase: "complete",
              status: "complete",
              message: `资产提取完成：新资产 ${collectedNew.length} 个、已有资产引用 ${collectedExisting.length} 个`,
              current: itemIndex + 1,
              total: totalItems,
            }),
          ),
        );
    }

    async function processGroup(groups: number[][][]) {
      const groupItems = groups.flat();
      await Promise.all(groupItems.map((itemIds, index) => processGroupItem(itemIds, index, groupItems.length)));
      if (errors.length) {
        const reason = errors
          .slice(0, 3)
          .map((item) => `script:${item.scriptId} ${item.error}`)
          .join("; ");
        await progress({ phase: "finished", status: successCount || warningCount ? "warning" : "error", message: successCount || warningCount ? `部分完成，${errors.length} 集失败，${warningCount} 集需复核` : reason || "资产提取失败", current: successCount + warningCount, total: scriptIds.length });
        await taskDone(-1, reason || "资产提取失败");
        return;
      }
      await progress({ phase: "finished", status: warningCount ? "warning" : "complete", message: warningCount ? `资产提取完成，${warningCount} 集保留原有关联并需复核` : `资产提取任务完成，共处理 ${successCount} 集`, current: successCount + warningCount, total: scriptIds.length });
      await taskDone(1);
    }
    processGroup(scriptGroups).catch(async (e) => {
      const reason = u.error(e).message;
      console.error("[extractAssets] 后台任务失败:", e);
      await u.db("o_script").whereIn("id", scriptIds).where("projectId", projectId).update({ extractState: -1, errorReason: reason });
      await progress({ phase: "failed", status: "error", message: reason, current: successCount, total: scriptIds.length });
      await taskDone(-1, reason);
    });
  },
);
