import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    type: z.array(z.string()).optional(),
  }),
  async (req, res) => {
    const { projectId, type } = req.body;
    const data = await u
      .db("o_assets")
      .leftJoin("o_image", "o_assets.imageId", "o_image.id")
      .select(
        "o_assets.*",
        "o_image.filePath",
        "o_image.state",
        "o_image.model",
        "o_image.resolution",
        "o_image.errorReason",
        "o_image.id as imageId",
      )
      .where("o_assets.projectId", projectId)
      .andWhere("o_assets.type", "<>", "clip")
      .andWhere("o_assets.type", "<>", "audio")
      .andWhere("o_assets.assetsId", null)
      .modify((qb) => {
        if (type && type.length > 0) qb.whereIn("o_assets.type", type);
      })
      .orderByRaw(`CASE o_assets.type WHEN 'role' THEN 1 WHEN 'scene' THEN 2 WHEN 'tool' THEN 3 ELSE 4 END`);
    const assets2AudioData = await u
      .db("o_assetsRole2Audio")
      .leftJoin("o_assets", "o_assets.id", "o_assetsRole2Audio.assetsAudioId")
      .whereIn(
        "o_assetsRole2Audio.assetsRoleId",
        data.map((i: any) => i.id!),
      )
      .select("o_assets.id", "o_assets.name", "o_assetsRole2Audio.assetsRoleId");
    const repleAssets: Record<number, { id: number; name: string }[]> = {};
    assets2AudioData.forEach((item) => {
      if (!repleAssets[item.assetsRoleId]) repleAssets[item.assetsRoleId] = [item];
      else repleAssets[item.assetsRoleId].push(item);
    });
    const result = await Promise.all(
      data.map(async (parent: any) => {
        const historyImages = await u
          .db("o_image")
          .where("assetsId", parent.id)
          .andWhere("state", "已完成") // i18n-ignore — stored o_image.state enum value, not user-facing text
          .select("id", "filePath");
        const historyImagesWithUrl = await Promise.all(
          historyImages.map(async (img: any) => ({
            id: img.id,
            filePath: img.filePath && (await u.oss.getSmallImageUrl(img.filePath)),
          })),
        );
        return {
          ...parent,
          filePath: parent.filePath && (await u.oss.getSmallImageUrl(parent.filePath!)),
          historyImages: historyImagesWithUrl,
          relepedAudio: repleAssets[parent.id] ?? [],
        };
      }),
    );
    res.status(200).send(success(result));
  },
);
