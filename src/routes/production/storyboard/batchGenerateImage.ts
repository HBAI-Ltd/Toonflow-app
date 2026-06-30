import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { assetItemSchema } from "@/agents/productionAgent/tools";
import { enqueueJob } from "@/utils/genQueue";
import { recordStoryboardImageArtifact, type StoryboardImagePayload } from "@/utils/queueHandlers";
import { compileEffectiveLayout, formatEffectiveLayoutForPrompt, type EffectiveLayout } from "@/utils/storyboardContinuity";
const router = express.Router();
export type AssetData = z.infer<typeof assetItemSchema>;

interface StoryboardAssetMeta {
  id: number;
  name?: string | null;
  type?: string | null;
  remark?: string | null;
  prompt?: string | null;
  describe?: string | null;
}

interface StoryboardStillPromptData {
  prompt: string;
  refImageIds: number[];
}

type StoryboardFrameRole = "firstFrame" | "lastFrame";

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

function appendStoryboardStillRequirements(prompt: string, assets: StoryboardAssetMeta[], effectiveLayout?: EffectiveLayout | null): string {
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
    formatEffectiveLayoutForPrompt(effectiveLayout),
    "",
    "单张关键帧要求：只生成一个可用于视频首帧的静态画面，呈现本分镜的核心瞬间，不要把多段动作拼成多格漫画或连续帧。",
    roleLine,
    layoutLine,
    "空间硬约束：固定锚点、大件陈设和关键道具必须遵守提示词或场景空间连续性卡中的位置关系；若剧情没有明确移动它们，禁止改变其相对方位、空间层级或承载关系，例如把背景/靠墙/桌后/门旁/窗边/中心等锚点生成到不相容的位置或另一个空间层级。",
    "质量要求：无重影、无错手、多余肢体、乱码或水印。",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildStoryboardStillPrompt(prompt: string, videoDesc: string, assets: StoryboardAssetMeta[]): string {
  return buildStoryboardStillPromptData(prompt, videoDesc, assets, [], null).prompt;
}

function buildStoryboardStillPromptData(prompt: string, videoDesc: string, assets: StoryboardAssetMeta[], refImageIds: number[], effectiveLayout?: EffectiveLayout | null): StoryboardStillPromptData {
  const normalizedPrompt = normalizeStoryboardImagePrompt(prompt, videoDesc);
  const scoped = scopeStoryboardPromptReferences(normalizedPrompt, assets, refImageIds);
  return {
    prompt: appendStoryboardStillRequirements(scoped.prompt, scoped.assets, effectiveLayout),
    refImageIds: scoped.refImageIds,
  };
}

function buildStoryboardLastFramePromptData(prompt: string, videoDesc: string, assets: StoryboardAssetMeta[], refImageIds: number[], effectiveLayout?: EffectiveLayout | null): StoryboardStillPromptData {
  const data = buildStoryboardStillPromptData(prompt, videoDesc, assets, refImageIds, effectiveLayout);
  return {
    ...data,
    prompt: [
      data.prompt,
      "",
      "尾帧图要求：这是同一镜头的结束关键帧。以上传的当前首帧图为人物、服装、场景、构图和光线基准，只表现动作结束后的静态画面。",
      "连续性要求：不要改变角色身份、服装、道具和空间关系；不要生成多格漫画、拼贴图、前后连续动作或额外镜头。",
    ].join("\n"),
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
    frameRole: z.enum(["firstFrame", "lastFrame"]).optional(),
    model: z.string().optional(),
  }),
  async (req, res) => {
    const {
      storyboardIds,
      projectId,
      scriptId,
      concurrentCount = 5,
      compulsory = false,
      frameRole = "firstFrame",
      model: requestedModel,
    }: {
      storyboardIds: number[];
      projectId: number;
      scriptId: number;
      concurrentCount: number;
      compulsory: boolean;
      frameRole?: StoryboardFrameRole;
      model?: string;
    } = req.body;
    const isLastFrame = frameRole === "lastFrame";
    if (!storyboardIds || storyboardIds.length === 0) return res.status(400).send(error("storyboardIds不能为空"));
    // 当没有 storyboardIds 时，通过 AI 生成新的分镜面板数据
    let finalStoryboardIds: number[] = storyboardIds || [];
    // shouldGenerateImage === 0 的分镜标记为「未生成」，其余标记为「生成中」
    const storyboardData = await u.db("o_storyboard").where("scriptId", scriptId).where("projectId", projectId).whereIn("id", finalStoryboardIds);
    if (!storyboardData.length) return res.status(500).send(error("未查到分镜数据"));
    if (isLastFrame && storyboardData.some((item: any) => !item.filePath || item.state !== "已完成")) {
      return res.status(400).send(error("生成尾帧图前，需要先生成并选中该分镜的首帧图"));
    }
    const storyIds = storyboardData.map((i) => i.id);
    const snapshotRows = compulsory ? storyboardData : storyboardData.filter((item: any) => item.shouldGenerateImage !== 0);
    if (!isLastFrame) {
      await Promise.all(snapshotRows.map((item: any) => recordStoryboardImageArtifact({
        storyboardId: Number(item.id),
        projectId,
        prompt: buildStoryboardStillPrompt(item.prompt || "", item.videoDesc || "", []),
        filePath: item.filePath,
        state: item.state || "已完成",
        reason: item.reason || "",
        selected: item.state === "已完成",
        source: "regenerateSnapshot",
        frameRole: "firstFrame",
      })));
      if (compulsory) {
        await u.db("o_storyboard").whereIn("id", storyIds).where("scriptId", scriptId).update({ state: "生成中", shouldGenerateImage: 1 });
      } else {
        await u.db("o_storyboard").whereIn("id", storyIds).where("scriptId", scriptId).where("shouldGenerateImage", 0).update({ state: "未生成" });
        await u.db("o_storyboard").whereIn("id", storyIds).where("scriptId", scriptId).where("shouldGenerateImage", 1).update({ state: "生成中" });
      }
    }

    const projectSettingData = await u.db("o_project").where("id", projectId).select("imageModel", "imageQuality", "artStyle", "videoRatio").first();
    const model = String(requestedModel || projectSettingData?.imageModel || "").trim() as `${string}:${string}`;
    if (!model) return res.status(400).send(error("未配置图片模型"));

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
      const assetRows = await u.db("o_assets").whereIn("id", allAssetIds).select("id", "name", "type", "imageId", "remark", "prompt", "describe");
      assetRows.forEach((row: any) => {
        assetImageMap[row.id] = row.imageId;
        assetMetaMap[row.id] = { id: row.id, name: row.name, type: row.type, remark: row.remark, prompt: row.prompt, describe: row.describe };
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
    if (compulsory || isLastFrame) {
      generateList = storyboardData;
    } else {
      generateList = storyboardData.filter((item) => item.shouldGenerateImage !== 0);
    }
    const vendorId = model?.split(/:(.+)/)[0] ?? "default";
    for (const item of generateList) {
      const effectiveLayout = compileEffectiveLayout({ assets: assetMetaRecord[item.id!] || [] });
      const promptData = isLastFrame ? buildStoryboardLastFramePromptData(
        item.prompt || "",
        item.videoDesc || "",
        assetMetaRecord[item.id!] || [],
        assetRecord[item.id!] || [],
        effectiveLayout,
      ) : buildStoryboardStillPromptData(
        item.prompt || "",
        item.videoDesc || "",
        assetMetaRecord[item.id!] || [],
        assetRecord[item.id!] || [],
        effectiveLayout,
      );
      const payload: StoryboardImagePayload = {
        storyboardId: item.id!,
        scriptId,
        projectId,
        prompt: promptData.prompt,
        refImageIds: promptData.refImageIds,
        referencePaths: isLastFrame && item.filePath ? [item.filePath] : [],
        model,
        size: projectSettingData?.imageQuality as "1K" | "2K" | "4K",
        aspectRatio: projectSettingData?.videoRatio as `${number}:${number}`,
        frameRole,
        effectiveLayout: effectiveLayout ?? undefined,
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
