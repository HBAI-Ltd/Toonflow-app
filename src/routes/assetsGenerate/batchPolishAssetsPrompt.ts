import express from "express";
import u from "@/utils";
import pLimit from "p-limit";
import * as zod from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();
interface OutlineItem {
  description: string;
  name: string;
}

interface OutlineData {
  chapterRange: number[];
  characters?: OutlineItem[];
  props?: OutlineItem[];
  scenes?: OutlineItem[];
}

interface NovelChapter {
  id: number;
  reel: string;
  chapter: string;
  chapterData: string;
  projectId: number;
}

type ItemType = "characters" | "props" | "scenes";

//润色提示词
export default router.post(
  "/",
  validateFields({
    items: zod.array(
      zod.object({
        assetsId: zod.number(),
        type: zod.string(),
        name: zod.string(),
        describe: zod.string(),
      }),
    ),
    projectId: zod.number(),
    concurrentCount: zod.number().int().min(1).optional(),
    otherTextPrompt: zod.string(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { projectId, items, concurrentCount, otherTextPrompt } = req.body;
    //获取风格
    const project = await u.db("o_project").where("id", projectId).select("artStyle", "type", "intro").first();
    //如果没有找到对应的项目，返回错误
    if (!project) return res.status(500).send(success({ message: t("assetsGenerate.common.projectEmpty", {}, locale) }));

    // 预加载公共数据
    const assetsIds = items.map((item: { assetsId: number }) => item.assetsId);
    //查询所有资产，用于判断每个资产是否是衍生资产
    const assetsDataList = await u.db("o_assets").whereIn("id", assetsIds).select("id", "assetsId");
    if (!assetsDataList || assetsDataList.length === 0) return res.status(500).send(error(t("assetsGenerate.common.assetNotExist", {}, locale)));
    const assetsDataMap = new Map(assetsDataList.map((a: any) => [a.id, a]));
    // 所有前置检测通过后，再批量更新状态为生成中
    await u.db("o_assets").whereIn("id", assetsIds).update({ promptState: "生成中" }); // i18n-ignore — stored o_assets.promptState enum value, not user-facing text

    const getTypeConfig = (
      isDerivative: boolean,
    ): Record<string, { promptKey: string; itemType: ItemType; label: string; nameLabel: string; visualManual: string }> => ({
      role: {
        promptKey: "role-polish",
        itemType: "characters",
        label: "角色标准四视图", // i18n-ignore — unused config field, no runtime effect on user-facing text
        nameLabel: "角色", // i18n-ignore — literal AI prompt fragment, not user-facing text
        visualManual: isDerivative ? "art_character_derivative" : "art_character",
      },
      scene: {
        promptKey: "scene-polish",
        itemType: "scenes",
        label: "场景图", // i18n-ignore — unused config field, no runtime effect on user-facing text
        nameLabel: "场景", // i18n-ignore — literal AI prompt fragment, not user-facing text
        visualManual: isDerivative ? "art_scene_derivative" : "art_scene",
      },
      tool: {
        promptKey: "tool-polish",
        itemType: "props",
        label: "道具图", // i18n-ignore — unused config field, no runtime effect on user-facing text
        nameLabel: "道具", // i18n-ignore — literal AI prompt fragment, not user-facing text
        visualManual: isDerivative ? "art_prop_derivative" : "art_prop",
      },
    });

    // 后台异步并发生成，不阻塞响应
    const limit = pLimit(concurrentCount ?? 1);
    const tasks = items.map((item: { assetsId: number; type: string; name: string; describe: string }) =>
      limit(async () => {
        const assetData = assetsDataMap.get(item.assetsId);
        if (!assetData) return;
        const typeConfig = getTypeConfig(!!assetData.assetsId);
        const config = typeConfig[item.type];
        if (!config) return;
        //获取到视觉手册
        const visualManual = await u.getArtPrompt(project.artStyle as string, "art_skills", config.visualManual);
        if (!visualManual) {
          await u
            .db("o_assets")
            .where("id", item.assetsId)
            .update({ promptState: "生成失败", promptErrorReason: t("assetsGenerate.common.visualManualUndefined", {}, locale) }); // i18n-ignore — promptState is a stored enum value; promptErrorReason text is translated via t() above
          return;
        }
        const systemPrompt = visualManual;
        try {
          const { _output } = (await u.Ai.Text("universalAi").invoke({
            system: systemPrompt + "\n" + otherTextPrompt,
            messages: [
              {
                role: "user",
                // i18n-ignore — literal AI prompt template, not user-facing text
                content: `\n                    **基础参数：**\n      **${config.nameLabel}设定：**\n      - ${config.nameLabel}名称:${item.name},\n      - ${config.nameLabel}描述:${item.describe},`,
              },
            ],
          })) as any;

          if (!_output) {
            await u.db("o_assets").where("id", item.assetsId).update({ promptState: "生成失败" }); // i18n-ignore — stored o_assets.promptState enum value, not user-facing text
            return;
          }

          await u.db("o_assets").where("id", item.assetsId).update({ prompt: _output, promptState: "已完成" }); // i18n-ignore — stored o_assets.promptState enum value, not user-facing text
        } catch (e: any) {
          await u
            .db("o_assets")
            .where("id", item.assetsId)
            .update({ promptState: "失败", promptErrorReason: u.error(e).message }); // i18n-ignore — stored o_assets.promptState enum value, not user-facing text
        }
      }),
    );

    // 后台执行，不等待结果
    Promise.all(tasks).catch((err: any) => {
      res.status(500).send(error(err));
    });

    return res.status(200).send(success({ total: items.length }));
  },
);
