import express from "express";
import db from "@/utils/db";
import oss from "@/utils/oss";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";

const router = express.Router();

// 获取资产
export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    type: z.string(),
    name: z.string().optional(),
    page: z.number(),
    limit: z.number(),
  }),
  async (req, res) => {
    const { projectId, type, name, page = 1, limit = 10 } = req.body;
    const offset = (page - 1) * limit;
    let query = db("o_assets")
      .leftJoin("o_image", "o_assets.imageId", "o_image.id")
      .select("o_assets.*", "o_image.filePath", "o_image.state")
      .where("o_assets.projectId", projectId)
      .andWhere("o_assets.type", type);

    if (name) {
      query = query.andWhere("name", "like", `%${name}%`);
    }

    const parentAssets = await query.where("o_assets.assetsId", null).offset(offset).limit(limit);

    let childQuery = db("o_assets")
      .leftJoin("o_image", "o_assets.imageId", "o_image.id")
      .select("o_assets.*", "o_image.filePath", "o_image.state", "o_image.errorReason")
      .where("o_assets.projectId", projectId)
      .andWhere("o_assets.type", type)
      .whereNotNull("o_assets.assetsId");

    if (name) {
      childQuery = childQuery.andWhere("o_assets.name", "like", `%${name}%`);
    }

    const childAssets = await childQuery;
    const childAssetsWithSrc = await Promise.all(
      childAssets.map(async (child) => ({
        ...child,
        src: child.filePath && (await oss.getFileUrl(child.filePath!)),
      })),
    );

    const result = await Promise.all(
      parentAssets.map(async (parent) => ({
        ...parent,
        sonAssets: childAssetsWithSrc.filter((child) => child.assetsId === parent.id),
        src: parent.filePath && (await oss.getFileUrl(parent.filePath!)),
        ...(parent.type == "audio" ? { sex: parent.describe?.split("|")[0], describe: parent.describe?.split("|")[1] } : {}),
      })),
    );

    const totalQuery = (await db("o_assets")
      .where("projectId", projectId)
      .andWhere("type", type)
      .andWhere("assetsId", null)
      .andWhere((qb) => {
        if (name) {
          qb.andWhere("name", "like", `%${name}%`);
        }
      })
      .count("* as total")
      .first()) as any;

    return res.status(200).send(success({ data: result, total: totalQuery?.total }));
  },
);
