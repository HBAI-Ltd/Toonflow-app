import express from "express";
import db from "@/utils/db";
import oss from "@/utils/oss";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    id: z.number(),
  }),
  async (req, res) => {
    const { id } = req.body;
    const assetsData = await db("o_image").where("assetsId", id);

    await Promise.all(
      assetsData.map((item) =>
        item.filePath
          ? oss.deleteFile(item.filePath).catch((err) => {
              if (err?.code !== "ENOENT") throw err;
            })
          : Promise.resolve(),
      ),
    );

    const imageIds = assetsData.map((item) => item.id).filter(Boolean);
    if (imageIds.length > 0) {
      await db("o_assets").whereIn("imageId", imageIds).update({ imageId: null });
    }

    await db("o_image").where({ assetsId: id }).delete();
    await db("o_assets").where({ id }).delete();
    await db("o_assets").where("assetsId", id).delete();

    return res.status(200).send(success({ message: "删除资产成功" }));
  },
);
