import express from "express";
import u from "@/utils";
import * as zod from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();


type ItemType = "characters" | "props" | "scenes";

//润色提示词
export default router.post(
  "/",
  validateFields({
    assetsId: zod.number(),
    projectId: zod.number(),
    type: zod.string(),
    name: zod.string(),
    describe: zod.string(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { assetsId, projectId, type, name, describe } = req.body;
    //获取风格
    const project = await u.db("o_project").where("id", projectId).select("artStyle", "type", "intro").first();
    //如果没有找到对应的项目，返回错误
    if (!project) return res.status(500).send(success({ message: t("assetsGenerate.common.projectEmpty", {}, locale) }));

    await u.db("o_assets").where("id", assetsId).update({ promptState: "生成中" }); // i18n-ignore — stored o_assets.promptState enum value, not user-facing text

    //查询资产是否是衍生资产
    const assetsData = await u.db("o_assets").where("id", assetsId).select("assetsId").first();
    if (!assetsData) return { code: 500, message: t("assetsGenerate.common.assetNotExist", {}, locale) };
    const typeConfig: Record<string, { promptKey: string; itemType: ItemType; label: string; nameLabel: string; visualManual: string }> = {
      role: {
        promptKey: "role-polish",
        itemType: "characters",
        label: "角色标准四视图", // i18n-ignore — unused config field, no runtime effect on user-facing text
        nameLabel: "角色", // i18n-ignore — literal AI prompt fragment, not user-facing text
        visualManual: assetsData.assetsId ? "art_character_derivative" : "art_character",
      },
      scene: {
        promptKey: "scene-polish",
        itemType: "scenes",
        label: "场景图", // i18n-ignore — unused config field, no runtime effect on user-facing text
        nameLabel: "场景", // i18n-ignore — literal AI prompt fragment, not user-facing text
        visualManual: assetsData.assetsId ? "art_scene_derivative" : "art_scene",
      },
      tool: {
        promptKey: "tool-polish",
        itemType: "props",
        label: "道具图", // i18n-ignore — unused config field, no runtime effect on user-facing text
        nameLabel: "道具", // i18n-ignore — literal AI prompt fragment, not user-facing text
        visualManual: assetsData.assetsId ? "art_prop_derivative" : "art_prop",
      },
    };

    const config = typeConfig[type];
    if (!config) return res.status(500).send(error(t("assetsGenerate.common.unsupportedType", {}, locale)));
    if (!config.visualManual) return res.status(500).send(error(t("assetsGenerate.common.visualManualUndefined", {}, locale)));
    //获取到视觉手册
    const visualManual = await u.getArtPrompt(project.artStyle as string, "art_skills", config.visualManual);
    if (!visualManual) return res.status(500).send(error(t("assetsGenerate.common.visualManualUndefined", {}, locale)));
    const systemPrompt = visualManual;
    try {
      const { _output } = (await u.Ai.Text("universalAi").invoke({
        system: systemPrompt,
        messages: [
          {
            role: "user",
            // i18n-ignore — literal AI prompt template, not user-facing text
            content: `**基础参数：**\n      **${config.nameLabel}设定：**\n      - ${config.nameLabel}名称:${name},\n      - ${config.nameLabel}描述:${describe},`,
          },
        ],
      })) as any;

      if (!_output) return res.status(500).send(t("common.failed", {}, locale));
      await u.db("o_assets").where("id", assetsId).update({ prompt: _output, promptState: "已完成" }); // i18n-ignore — stored o_assets.promptState enum value, not user-facing text

      res.status(200).send(success({ prompt: _output, assetsId }));
    } catch (e: any) {
      await u
        .db("o_assets")
        .where("id", assetsId)
        .update({ promptState: "失败", promptErrorReason: u.error(e).message }); // i18n-ignore — stored o_assets.promptState enum value, not user-facing text
      return res.status(500).send(error(e?.data?.error?.message ?? e?.message ?? t("assetsGenerate.common.generateFailed", {}, locale)));
    }
  },
);
