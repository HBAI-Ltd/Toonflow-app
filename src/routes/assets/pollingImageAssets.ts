import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    ids: z.array(z.number()),
  }),
  async (req, res) => {
    const { ids } = req.body;
    const data = await u
      .db("o_assets")
      .leftJoin("o_image", "o_assets.imageId", "o_image.id")
      .whereIn("o_assets.id", ids)
      .whereNot("o_image.state", "生成中") // i18n-ignore — stored o_image.state enum value, not user-facing text
      .select("o_image.state", "o_assets.id", "o_image.filePath");
    const result = await Promise.all(
      data.map(async (item: any) => ({
        ...item,
        filePath: item.filePath ? await u.oss.getSmallImageUrl(item.filePath) : null,
      })),
    );
    res.status(200).send(success(result));
  },
);
