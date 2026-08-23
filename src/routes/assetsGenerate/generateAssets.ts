import express from "express";
import u from "@/utils";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";

const router = express.Router();

type AssetType = "role" | "scene" | "tool";

interface AssetTypeConfig {
  label: string;
  dir: string;
  promptTitle: string;
  promptEnd: string;
}

const assetTypeConfig: Record<AssetType, AssetTypeConfig> = {
  role: {
    label: "角色", // i18n-ignore — literal AI image-generation prompt fragment (cfg.label is interpolated into buildPrompt)
    dir: "role",
    promptTitle: "角色标准四视图", // i18n-ignore — literal AI image-generation prompt fragment
    promptEnd: "人物角色四视图", // i18n-ignore — literal AI image-generation prompt fragment
  },
  scene: {
    label: "场景", // i18n-ignore — literal AI image-generation prompt fragment (cfg.label is interpolated into buildPrompt)
    dir: "scene",
    promptTitle: "标准场景图", // i18n-ignore — literal AI image-generation prompt fragment
    promptEnd: "标准场景图", // i18n-ignore — literal AI image-generation prompt fragment
  },
  tool: {
    label: "道具", // i18n-ignore — literal AI image-generation prompt fragment (cfg.label is interpolated into buildPrompt)
    dir: "props",
    promptTitle: "标准道具图", // i18n-ignore — literal AI image-generation prompt fragment
    promptEnd: "标准道具图", // i18n-ignore — literal AI image-generation prompt fragment
  },
};

// Translated asset-type labels, used for human-readable task descriptions and task metadata
// (describe, relatedObjects.type) — never fed into the AI prompt
const assetTypeLabelKey: Record<AssetType, string> = {
  role: "assetsGenerate.assetType.role.label",
  scene: "assetsGenerate.assetType.scene.label",
  tool: "assetsGenerate.assetType.tool.label",
};

// Translated o_tasks.taskClass values: the frontend uses this as both the display text and
// the filter value in its filter dropdown, so it must be localized text
const taskClassKey: Record<AssetType, string> = {
  role: "taskClass.characterImage",
  scene: "taskClass.sceneImage",
  tool: "taskClass.propImage",
};

// ─── 构建生成提示词 ──────────────────────────────────────────

function buildPrompt(cfg: AssetTypeConfig, artStyle: string, name: string, prompt: string): string {
  // i18n-ignore — literal AI image-generation prompt template, not user-facing text
  return `\n    请根据以下参数生成${cfg.promptTitle}：\n\n    **基础参数：**\n    - 画风风格: ${artStyle || "未指定"}\n\n    **${cfg.label}设定：**\n    - 名称:${name},\n    - 提示词:${prompt},\n\n    请严格按照系统规范生成${cfg.promptEnd}。\n  `;
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
};

export default router.post("/", validateFields(requestSchema), async (req, res) => {
  const locale = await getLocale(req as any);
  const { projectId, model, resolution, id, type, name, prompt, base64 } = req.body;

  // 1. 查询项目 & 获取类型配置
  const project = await u.db("o_project").where("id", projectId).select("artStyle", "type", "intro").first();
  if (!project) return res.status(500).send(success({ message: t("assetsGenerate.common.projectEmpty", {}, locale) }));

  const cfg = assetTypeConfig[type as AssetType];
  if (!cfg) return res.status(400).send(error(t("assetsGenerate.common.unsupportedType", {}, locale)));

  // 2. 创建图片占位记录
  const [imageId] = await u.db("o_image").insert({
    type,
    state: "生成中", // i18n-ignore — stored o_image.state enum value, not user-facing text
    assetsId: id,
    model: model.split(/:(.+)/)[1],
    resolution,
  });
  await u.db("o_assets").where("id", id).update({ imageId });

  // 3. 准备生成参数
  const imagePath = `/${projectId}/${cfg.dir}/${uuidv4()}.jpg`;
  const userPrompt = buildPrompt(cfg, project.artStyle!, name, prompt);
  const translatedLabel = t(assetTypeLabelKey[type as AssetType], {}, locale);
  const describe = t(
    "assetsGenerate.batchGenerateImageAssets.describe",
    { label: translatedLabel, name, prompt },
    locale,
  );
  const relatedObjects = { id, projectId, type: translatedLabel };

  try {
    const aiImage = u.Ai.Image(model);
    await aiImage.run(
      {
        prompt: userPrompt,
        referenceList: base64 ? [{ type: "image", base64 }] : [],
        size: resolution,
        aspectRatio: "16:9",
      },
      {
        taskClass: t(taskClassKey[type as AssetType], {}, locale),
        describe,
        projectId,
        relatedObjects: JSON.stringify(relatedObjects),
      },
    );
    aiImage.save(imagePath);
    // 5. 更新记录 & 返回结果
    const imageData = await u.db("o_image").where("id", imageId).select("*").first();
    if (!imageData) return res.status(500).send(t("assetsGenerate.common.assetDeleted", {}, locale));
    if (imageData.state === "生成失败") return; // i18n-ignore — stored o_image.state enum value, not user-facing text
    await u
      .db("o_image")
      .where("id", imageId)
      .update({
        state: "已完成", // i18n-ignore — stored o_image.state enum value, not user-facing text
        filePath: imagePath,
        type,
        model: model.split(/:(.+)/)[1],
        resolution,
      });

    const path = await u.oss.getSmallImageUrl(imagePath);
    await u.db("o_assets").where("id", id).update({ imageId });

    return res.status(200).send(success({ path, assetsId: id }));
  } catch (e) {
    await u
      .db("o_image")
      .where("id", imageId)
      .update({ state: "生成失败", errorReason: u.error(e).message }); // i18n-ignore — stored o_image.state enum value, not user-facing text
    return res.status(400).send(error(u.error(e).message || t("assetsGenerate.common.imageGenerateFailed", {}, locale)));
  }
});
