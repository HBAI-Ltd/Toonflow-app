import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { enqueueAssetCandidates } from "@/utils/queueHandlers";
import { assetCardPrompt } from "@/utils/characterSpec";

const router = express.Router();

type AssetType = "role" | "scene" | "tool";

interface AssetTypeConfig {
  label: string;
  taskClass: string;
  dir: string;
  promptTitle: string;
  promptEnd: string;
}

const assetTypeConfig: Record<AssetType, AssetTypeConfig> = {
  role: {
    label: "角色",
    taskClass: "角色图生成",
    dir: "role",
    promptTitle: "角色标准四视图",
    promptEnd: "人物角色四视图",
  },
  scene: {
    label: "场景",
    taskClass: "场景图生成",
    dir: "scene",
    promptTitle: "标准场景图",
    promptEnd: "标准场景图",
  },
  tool: {
    label: "道具",
    taskClass: "道具图生成",
    dir: "props",
    promptTitle: "标准道具图",
    promptEnd: "标准道具图",
  },
};

function buildPrompt(cfg: AssetTypeConfig, artStyle: string, name: string, prompt: string, assetCard = ""): string {
  return `
    请根据以下参数生成${cfg.promptTitle}：

    **基础参数：**
    - 画风风格: ${artStyle || "未指定"}

    **${cfg.label}设定：**
    - 名称:${name},
    - 提示词:${prompt},
    ${assetCard ? `\n    **资产卡规格：**\n${assetCard}` : ""}

    请严格按照系统规范生成${cfg.promptEnd}。
  `;
}

const requestSchema = {
  projectId: z.number(),
  model: z.string(),
  resolution: z.string(),
  concurrentCount: z.number().int().min(1).optional(), // 已由队列 vendor 限流接管，保留字段兼容老前端
  candidateCount: z.number().int().min(1).max(4).optional(), // 每个资产的抽卡候选张数，默认 1
  enableScore: z.boolean().optional(), // 是否启用 VLM 自动打分预筛
  items: z.array(
    z.object({
      id: z.number(),
      type: z.enum(["role", "scene", "tool", "storyboard"]),
      name: z.string(),
      prompt: z.string(),
      base64: z.string().optional().nullable(),
    }),
  ),
};

export default router.post("/", validateFields(requestSchema), async (req, res) => {
  const { projectId, model, resolution, candidateCount, enableScore, items } = req.body;

  // 1. 查询项目
  const project = await u.db("o_project").where("id", projectId).select("artStyle", "type", "intro").first();
  if (!project) return res.status(500).send(error("项目为空"));

  const assetIds = (items as { id: number }[]).map((item) => item.id);
  const assetRemarks = assetIds.length ? await u.db("o_assets").whereIn("id", assetIds).where({ projectId }).select("id", "remark") : [];
  const remarkByAssetId = new Map(assetRemarks.map((row: any) => [Number(row.id), row.remark]));

  // 2. 逐条创建候选占位记录并入队（队列按 vendor 限流，失败自动重试）
  const batches: { assetsId: number; batchId: string; imageIds: number[] }[] = [];
  for (const item of items as { id: number; type: string; name: string; prompt: string; base64?: string | null }[]) {
    const cfg = assetTypeConfig[item.type as AssetType];
    if (!cfg) continue;

    const userPrompt = buildPrompt(cfg, project.artStyle ?? "", item.name, item.prompt, assetCardPrompt(remarkByAssetId.get(item.id)));
    const describe = `生成${cfg.label}图，名称：${item.name}，提示词：${item.prompt}`;

    const { batchId, imageIds } = await enqueueAssetCandidates({
      projectId,
      assetsId: item.id,
      type: item.type,
      model,
      resolution: resolution as "1K" | "2K" | "4K",
      aspectRatio: "16:9",
      prompt: userPrompt,
      referenceBase64: item.base64 ?? null,
      dir: cfg.dir,
      taskClass: cfg.taskClass,
      describe,
      candidateCount: candidateCount ?? 1,
      enableScore: enableScore ?? false,
    });
    batches.push({ assetsId: item.id, batchId, imageIds });
  }

  return res.status(200).send(success({ total: items.length, batches }));
});
