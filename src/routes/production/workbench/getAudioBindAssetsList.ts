import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    assetsIds: z.array(z.number()),
  }),
  async (req, res) => {
    const { assetsIds } = req.body;
    const assets2AudioData = await u.db("o_assetsRole2Audio").whereIn("assetsRoleId", assetsIds).select("assetsAudioId", "assetsRoleId");

    if (assets2AudioData.length) {
      const assetsData = await u
        .db("o_assets")
        .leftJoin("o_image", "o_image.id", "o_assets.imageId")
        .whereIn("o_assets.assetsId", assets2AudioData.map((i) => i.assetsAudioId) as number[])
        .select("o_assets.id", "o_image.filePath", "o_assets.prompt", "o_assets.assetsId");

      await Promise.all(
        assetsData.map(async (i) => {
          i.filePath && (i.src = await u.oss.getFileUrl(i.filePath));
        }),
      );

      return res.status(200).send(
        success(
          assetsData.map((i) => ({
            fileType: "audio",
            sources: "assets",
            src: i.src,
            id: i.id,
            prompt: i.prompt,
          })),
        ),
      );
    }
    res.status(200).send(success());
  },
);
