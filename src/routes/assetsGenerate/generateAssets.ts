import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { enqueueAssetCandidates } from "@/utils/queueHandlers";

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

// ─── 构建生成提示词 ──────────────────────────────────────────

function buildPrompt(cfg: AssetTypeConfig, artStyle: string, name: string, prompt: string): string {
  return `
    请根据以下参数生成${cfg.promptTitle}：

    **基础参数：**
    - 画风风格: ${artStyle || "未指定"}

    **${cfg.label}设定：**
    - 名称:${name},
    - 提示词:${prompt},

    请严格按照系统规范生成${cfg.promptEnd}。
  `;
}

// ─── 生成资产图片 ────────────────────────────────────────────

const requestSchema = {
  projectId: z.number(),
  model: z.string(),
  resolution: z.string(),
  id: z.number(),
  type: z.enum(["role", "scene", "tool", "storyboard"]),
  name: z.string(),
  prompt: z.string(),
  base64: z.string().optional().nullable(),
  candidateCount: z.number().int().min(1).max(4).optional(), // 抽卡候选张数，默认 1
  enableScore: z.boolean().optional(), // 是否启用 VLM 自动打分预筛
};

export default router.post("/", validateFields(requestSchema), async (req, res) => {
  const { projectId, model, resolution, id, type, name, prompt, base64, candidateCount, enableScore } = req.body;

  // 1. 查询项目 & 获取类型配置
  const project = await u.db("o_project").where("id", projectId).select("artStyle", "type", "intro").first();
  if (!project) return res.status(500).send(success({ message: "项目为空" }));

  const cfg = assetTypeConfig[type as AssetType];
  if (!cfg) return res.status(400).send(error("不支持的类型"));

  // 2. 创建候选占位记录并入队（含 vendor 并发限流、失败自动重试）
  const userPrompt = buildPrompt(cfg, project.artStyle!, name, prompt);
  const describe = `生成${cfg.label}图，名称：${name}，提示词：${prompt}`;
  const count = candidateCount ?? 1;

  const { batchId, imageIds, jobs } = await enqueueAssetCandidates({
    projectId,
    assetsId: id,
    type,
    model,
    resolution: resolution as "1K" | "2K" | "4K",
    aspectRatio: "16:9",
    prompt: userPrompt,
    referenceBase64: base64 ?? null,
    dir: cfg.dir,
    taskClass: cfg.taskClass,
    describe,
    candidateCount: count,
    enableScore: enableScore ?? false,
  });

  // 多候选抽卡：立即返回候选组信息，前端通过 getCandidates 轮询并选定
  if (count > 1) {
    return res.status(200).send(success({ batchId, imageIds, assetsId: id }));
  }

  // 单张：保持原同步响应语义
  try {
    await jobs[0].done;
    const imageData = await u.db("o_image").where("id", imageIds[0]).select("filePath").first();
    if (!imageData?.filePath) return res.status(400).send(error("图片生成失败"));
    const path = await u.oss.getSmallImageUrl(imageData.filePath);
    return res.status(200).send(success({ path, assetsId: id }));
  } catch (e) {
    return res.status(400).send(error(u.error(e).message || "图片生成失败"));
  }
});
