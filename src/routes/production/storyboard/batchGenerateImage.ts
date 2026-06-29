import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { assetItemSchema } from "@/agents/productionAgent/tools";
import { enqueueJob } from "@/utils/genQueue";
import { recordStoryboardImageArtifact, type StoryboardImagePayload } from "@/utils/queueHandlers";
const router = express.Router();
export type AssetData = z.infer<typeof assetItemSchema>;

interface StoryboardAssetMeta {
  id: number;
  name?: string | null;
  type?: string | null;
}

interface StoryboardStillPromptData {
  prompt: string;
  refImageIds: number[];
}

function isStoryboardMetaLine(line: string): boolean {
  return /^(场景|关联资产名称|关联资产ID|时长|景别|运镜|角色动作|朝向|空间关系|情绪|台词|音效)[:：]/.test(line);
}

function stripShotPrefix(text: string): string {
  return text.replace(/^(?:大远景|远景|全景|中景|中近景|近景|半身|特写|大特写|过肩镜|空镜)(?:[\/／][^—-]+)?[—-]+/, "").trim();
}

function extractSingleKeyframePrompt(source: string): string {
  const lines = String(source || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const numberedLine = lines.find((line) => /^\d+[.、]\s*/.test(line));
  if (numberedLine) {
    const text = stripShotPrefix(numberedLine.replace(/^\d+[.、]\s*/, "").trim());
    if (text) return `单帧画面：${text}`;
  }

  const visualLine = lines.find((line) => !line.startsWith("承接上镜") && !isStoryboardMetaLine(line));
  return visualLine || String(source || "").trim();
}

function normalizeStoryboardImagePrompt(prompt: string, videoDesc: string): string {
  const rawPrompt = String(prompt || "").trim();
  const rawVideoDesc = String(videoDesc || "").trim();
  if (rawPrompt && rawPrompt !== rawVideoDesc) return rawPrompt;
  return extractSingleKeyframePrompt(rawVideoDesc || rawPrompt);
}

function assetTypeLabel(type?: string | null): string {
  if (type === "role") return "角色";
  if (type === "scene") return "场景";
  if (type === "tool") return "道具";
  return type || "资产";
}

function scopeStoryboardPromptReferences(prompt: string, assets: StoryboardAssetMeta[], refImageIds: number[]): { prompt: string; assets: StoryboardAssetMeta[]; refImageIds: number[] } {
  if (!assets.length) return { prompt, assets, refImageIds };

  const promptBodyStart = prompt.indexOf("【画面】");
  const body = promptBodyStart >= 0 ? prompt.slice(promptBodyStart).trim() : prompt;
  const referencedIndexes = Array.from(new Set(Array.from(body.matchAll(/@图(\d+)(?!\d)/g))
    .map((match) => Number(match[1]) - 1)
    .filter((index) => index >= 0 && index < assets.length)));
  if (!referencedIndexes.length) return { prompt, assets, refImageIds };

  const oldToNew = new Map<number, number>();
  referencedIndexes.forEach((index, nextIndex) => oldToNew.set(index + 1, nextIndex + 1));
  const scopedBody = body.replace(/@图(\d+)(?!\d)/g, (matched, imageNo) => {
    const nextNo = oldToNew.get(Number(imageNo));
    return nextNo ? `@图${nextNo}` : matched;
  });
  const scopedAssets = referencedIndexes.map((index) => assets[index]);
  const scopedRefImageIds = referencedIndexes
    .map((index) => refImageIds[index])
    .filter((imageId): imageId is number => imageId != null);
  const prefix = scopedAssets
    .map((asset, index) => `@图${index + 1} 为${asset.name || `资产${asset.id}`}${assetTypeLabel(asset.type)}`)
    .join(" ");

  return {
    prompt: prefix ? `${prefix},\n\n${scopedBody}` : scopedBody,
    assets: scopedAssets,
    refImageIds: scopedRefImageIds,
  };
}

function appendStoryboardStillRequirements(prompt: string, assets: StoryboardAssetMeta[]): string {
  const roleNames = assets.filter((asset) => asset.type === "role" && asset.name).map((asset) => asset.name);
  const roleLine = roleNames.length
    ? `画面人物：${roleNames.join("、")}。画面中可见人物总数必须等于上述人物数量；背影、侧脸、边缘半截人物都计入人数；每个角色只出现一次，不要新增、复制、合并或遗漏人物。`
    : "";
  const layoutLine =
    roleNames.length >= 2
      ? "多人构图要求：人物之间保留清晰间距，脸部和身体互不重叠、不融合、不遮挡；每个人主体完整可见，不出现半截人物；若某角色以背影或前景出现，不要再生成同一角色的正面重复形象。"
      : "构图要求：主体完整可见，不裁切，不出现多余人物。";

  return [
    prompt,
    "",
    "单张关键帧要求：只生成一个可用于视频首帧的静态画面，呈现本分镜的核心瞬间，不要把多段动作拼成多格漫画或连续帧。",
    roleLine,
    layoutLine,
    "质量要求：无重影、无错手、多余肢体、乱码或水印。",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildStoryboardStillPrompt(prompt: string, videoDesc: string, assets: StoryboardAssetMeta[]): string {
  return buildStoryboardStillPromptData(prompt, videoDesc, assets, []).prompt;
}

function buildStoryboardStillPromptData(prompt: string, videoDesc: string, assets: StoryboardAssetMeta[], refImageIds: number[]): StoryboardStillPromptData {
  const normalizedPrompt = normalizeStoryboardImagePrompt(prompt, videoDesc);
  const scoped = scopeStoryboardPromptReferences(normalizedPrompt, assets, refImageIds);
  return {
    prompt: appendStoryboardStillRequirements(scoped.prompt, scoped.assets),
    refImageIds: scoped.refImageIds,
  };
}

export default router.post(
  "/",
  validateFields({
    storyboardIds: z.array(z.number()),
    projectId: z.number(),
    scriptId: z.number(),
    concurrentCount: z.number().min(1).optional(),
    compulsory: z.boolean().optional(),
  }),
  async (req, res) => {
    const {
      storyboardIds,
      projectId,
      scriptId,
      concurrentCount = 5,
      compulsory = false,
    }: {
      storyboardIds: number[];
      projectId: number;
      scriptId: number;
      concurrentCount: number;
      compulsory: boolean;
    } = req.body;
    if (!storyboardIds || storyboardIds.length === 0) return res.status(400).send(error("storyboardIds不能为空"));
    // 当没有 storyboardIds 时，通过 AI 生成新的分镜面板数据
    let finalStoryboardIds: number[] = storyboardIds || [];
    // shouldGenerateImage === 0 的分镜标记为「未生成」，其余标记为「生成中」
    const storyboardData = await u.db("o_storyboard").where("scriptId", scriptId).where("projectId", projectId).whereIn("id", finalStoryboardIds);
    if (!storyboardData.length) return res.status(500).send(error("未查到分镜数据"));
    const storyIds = storyboardData.map((i) => i.id);
    const snapshotRows = compulsory ? storyboardData : storyboardData.filter((item: any) => item.shouldGenerateImage !== 0);
    await Promise.all(snapshotRows.map((item: any) => recordStoryboardImageArtifact({
      storyboardId: Number(item.id),
      projectId,
      prompt: buildStoryboardStillPrompt(item.prompt || "", item.videoDesc || "", []),
      filePath: item.filePath,
      state: item.state || "已完成",
      reason: item.reason || "",
      selected: item.state === "已完成",
      source: "regenerateSnapshot",
    })));
    if (compulsory) {
      await u.db("o_storyboard").whereIn("id", storyIds).where("scriptId", scriptId).update({ state: "生成中", shouldGenerateImage: 1 });
    } else {
      await u.db("o_storyboard").whereIn("id", storyIds).where("scriptId", scriptId).where("shouldGenerateImage", 0).update({ state: "未生成" });
      await u.db("o_storyboard").whereIn("id", storyIds).where("scriptId", scriptId).where("shouldGenerateImage", 1).update({ state: "生成中" });
    }

    const projectSettingData = await u.db("o_project").where("id", projectId).select("imageModel", "imageQuality", "artStyle", "videoRatio").first();

    // 按 rowid 顺序查出每个 storyboard 关联的 assetId 有序列表
    const assets2StoryboardRows = await u
      .db("o_assets2Storyboard")
      .whereIn("storyboardId", storyIds)
      .orderBy("rowid")
      .select("storyboardId", "assetId");

    // 收集所有 assetId，批量查对应的 imageId
    const allAssetIds = [...new Set(assets2StoryboardRows.map((r: any) => r.assetId))];
    const assetImageMap: Record<number, number> = {};
    const assetMetaMap: Record<number, StoryboardAssetMeta> = {};
    if (allAssetIds.length > 0) {
      const assetRows = await u.db("o_assets").whereIn("id", allAssetIds).select("id", "name", "type", "imageId");
      assetRows.forEach((row: any) => {
        assetImageMap[row.id] = row.imageId;
        assetMetaMap[row.id] = { id: row.id, name: row.name, type: row.type };
      });
    }

    // 按 rowid 顺序重建 assetRecord，值为有序的 imageId 列表
    const assetRecord: Record<number, number[]> = {};
    const assetMetaRecord: Record<number, StoryboardAssetMeta[]> = {};
    assets2StoryboardRows.forEach((item: any) => {
      if (!assetRecord[item.storyboardId]) {
        assetRecord[item.storyboardId] = [];
      }
      if (!assetMetaRecord[item.storyboardId]) {
        assetMetaRecord[item.storyboardId] = [];
      }
      const imageId = assetImageMap[item.assetId];
      if (imageId != null) {
        assetRecord[item.storyboardId].push(imageId);
      }
      if (assetMetaMap[item.assetId]) {
        assetMetaRecord[item.storyboardId].push(assetMetaMap[item.assetId]);
      }
    });
    const realStoryData = await u.db("o_storyboard").where("scriptId", scriptId).where("projectId", projectId).whereIn("id", storyIds);
    res.status(200).send(
      success(
        realStoryData.map((i) => ({
          id: i.id,
          prompt: i.prompt,
          associateAssetsIds: assetRecord[i.id!],
          src: null,
          state: i.state,
          videoDesc: i.videoDesc,
          shouldGenerateImage: i.shouldGenerateImage,
        })),
      ),
    );

    // 入队生成（队列按 vendor 限流 + 失败自动重试，参考图在执行时按 refImageIds 实时解析）
    // concurrentCount 参数保留兼容老前端，实际并发由队列 vendor 限流控制
    void concurrentCount;
    let generateList = [];
    if (compulsory) {
      generateList = storyboardData;
    } else {
      generateList = storyboardData.filter((item) => item.shouldGenerateImage !== 0);
    }
    const model = projectSettingData?.imageModel as `${string}:${string}`;
    const vendorId = model?.split(/:(.+)/)[0] ?? "default";
    for (const item of generateList) {
      const promptData = buildStoryboardStillPromptData(
        item.prompt || "",
        item.videoDesc || "",
        assetMetaRecord[item.id!] || [],
        assetRecord[item.id!] || [],
      );
      const payload: StoryboardImagePayload = {
        storyboardId: item.id!,
        scriptId,
        projectId,
        prompt: promptData.prompt,
        refImageIds: promptData.refImageIds,
        model,
        size: projectSettingData?.imageQuality as "1K" | "2K" | "4K",
        aspectRatio: projectSettingData?.videoRatio as `${number}:${number}`,
      };
      await enqueueJob({
        projectId,
        kind: "storyboardImage",
        payload: payload as unknown as Record<string, unknown>,
        vendorId,
      });
    }
  },
);
