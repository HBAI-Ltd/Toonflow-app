import express from "express";
import db from "@/utils/db";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    name: z.string().optional(),
  }),
  async (req, res) => {
    const { projectId, name } = req.body;
    let query = db("o_script").where("projectId", projectId).select("*");
    if (name) {
      query = query.andWhere("name", "like", `%${name}%`);
    }

    const data = await query;
    const assetsData = await db("o_assets")
      .leftJoin("o_scriptAssets", "o_assets.id", "o_scriptAssets.assetId")
      .whereIn(
        "o_scriptAssets.scriptId",
        data.map((item) => item.id!),
      )
      .select("o_assets.id", "o_assets.name", "o_scriptAssets.scriptId");

    const scriptAssetsMap: Record<number, { id: number; name: string }[]> = {};
    assetsData.forEach((item) => {
      if (scriptAssetsMap[item.scriptId]) {
        scriptAssetsMap[item.scriptId].push({ id: item.id, name: item.name });
      } else {
        scriptAssetsMap[item.scriptId] = [{ id: item.id, name: item.name }];
      }
    });

    const returnData = data.map((item) => ({
      id: item.id,
      name: item.name,
      content: item.content,
      extractState: item.extractState,
      errorReason: item.errorReason,
      createTime: item.createTime,
      relatedAssets: scriptAssetsMap[item.id!] || [],
    }));

    return res.status(200).send(success(returnData));
  },
);
