import express from "express";
import u from "@/utils";
import db from "@/utils/db";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();
import { FlowData } from "@/agents/productionAgent/tools";

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    episodesId: z.number(),
  }),
  async (req, res) => {
    const { projectId, episodesId }: { projectId: number; episodesId: number } = req.body;
    const sqlData = await db("o_agentWorkData")
      .where("projectId", projectId)
      .andWhere("episodesId", episodesId)
      .select("data")
      .first();

    const scriptData = await db("o_script").where("projectId", projectId).where("id", episodesId).first();
    const scriptAssets = await db("o_scriptAssets").where("scriptId", episodesId);
    const assetIds = scriptAssets.map((i) => i.assetId);
    const assetsData = await db("o_assets")
      .leftJoin("o_image", "o_assets.imageId", "o_image.id")
      .select("o_assets.*", "o_image.filePath", "o_image.state", "o_image.errorReason")
      // @ts-ignore
      .where("o_assets.id", "in", assetIds)
      .andWhere("o_assets.assetsId", null)
      .where("o_assets.projectId", projectId);

    let childAssetsData = await db("o_assets")
      .leftJoin("o_image", "o_assets.imageId", "o_image.id")
      .select("o_assets.*", "o_image.filePath", "o_image.state", "o_image.errorReason")
      .where("o_assets.projectId", projectId)
      // @ts-ignore
      .where("o_assets.assetsId", "in", assetIds)
      .whereNotNull("o_assets.assetsId");

    if (!sqlData) {
      const flowData: FlowData = {
        script: scriptData?.content ?? "",
        scriptPlan: "",
        assets: await Promise.all(
          assetsData.map(async (item) => ({
            id: item.id,
            name: item.name ?? "",
            type: item.type ?? "",
            prompt: item.prompt ?? "",
            desc: item.describe ?? "",
            src: item.filePath && (await u.oss.getFileUrl(item.filePath!)),
            derive: await Promise.all(
              childAssetsData
                .filter((child) => child.assetsId === item.id)
                .map(async (child) => ({
                  id: child.id,
                  assetsId: item.id,
                  name: child.name ?? "",
                  type: child.type,
                  prompt: child.prompt,
                  desc: child.describe ?? "",
                  src: child.filePath && (await u.oss.getFileUrl(child.filePath!)),
                  state: child.state ?? "未生成", //todo：矫正状态值
                })),
            ),
          })),
        ),
        storyboardTable: "",
        storyboard: [],
        //todo：矫正workbench数据
        //@ts-ignore
        workbench: {
          videoList: [],
        },
        // //todo：矫正封面数据
        // poster: {
        //   items: [],
        // },
      };
      return res.status(200).send(success(flowData));
    } else {
      try {
        const storyboardData = await db("o_storyboard").where("scriptId", episodesId);
        await Promise.all(
          storyboardData.map(async (i) => {
            if (i.filePath) {
              try {
                i.filePath = await u.oss.getFileUrl(i.filePath);
              } catch {
                i.filePath = "";
              }
            } else {
              i.filePath = "";
            }
          }),
        );
        const storyboardIds = storyboardData.map((i) => i.id);
        const assetsIds = await db("o_assets2Storyboard").whereIn("storyboardId", storyboardIds);
        const assets2StoryboardMap: Record<number, number[]> = {};
        assetsIds.forEach((i) => {
          if (!assets2StoryboardMap[i.storyboardId!]) {
            assets2StoryboardMap[i.storyboardId!] = [];
          }
          assets2StoryboardMap[i.storyboardId!].push(i.assetId!);
        });
        const flowData = JSON.parse(sqlData!.data ?? "{}");
        flowData.assets = await Promise.all(
          assetsData.map(async (item) => ({
            id: item.id,
            name: item.name ?? "",
            type: item.type ?? "",
            prompt: item.prompt ?? "",
            desc: item.describe ?? "",
            src: item.filePath && (await u.oss.getFileUrl(item.filePath!)),
            flowId: item.flowId,
            derive: await Promise.all(
              childAssetsData
                .filter((child) => child.assetsId === item.id)
                .map(async (child) => ({
                  id: child.id,
                  assetsId: item.id,
                  name: child.name ?? "",
                  prompt: child.prompt,
                  type: child.type,
                  desc: child.describe ?? "",
                  src: child.filePath && (await u.oss.getFileUrl(child.filePath!)),
                  state: child.state ?? "未生成",
                  errorReason: child?.errorReason ?? "",
                  flowId: child.flowId,
                })),
            ),
          })),
        );
        flowData.storyboard = storyboardData
          .map((i) => ({
            id: i.id,
            index: i.index,
            duration: i.duration ? +i.duration : 0,
            prompt: i.prompt,
            associateAssetsIds: assets2StoryboardMap[i.id!] ?? [],
            src: i.filePath,
            state: i.state,
            videoDesc: i.videoDesc,
            shouldGenerateImage: i.shouldGenerateImage,
            reason: i?.reason ?? "",
            flowId: i.flowId,
          }))
          .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
        res.status(200).send(success(flowData));
      } catch (err) {
        res.status(400).send(error());
      }
    }
  },
);
