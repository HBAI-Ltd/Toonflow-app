import express from "express";
import db from "@/utils/db";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    name: z.string(),
    content: z.string(),
    projectId: z.number(),
    assets: z.array(z.number()),
  }),
  async (req, res) => {
    const { name, content, projectId, assets } = req.body;

    if (content.length >= 3000) {
      return res.status(400).send(error("内容不能超过3000字"));
    }

    const [scriptId] = await db("o_script").insert({
      name,
      content,
      projectId,
      createTime: Date.now(),
    });

    if (assets.length) {
      const assetsData = await db("o_assets").whereIn("id", assets).select();
      if (assetsData.length) {
        await db("o_scriptAssets").insert(
          assetsData.map((item) => ({
            scriptId,
            assetId: item.id,
          })),
        );
      }
    }

    return res.status(200).send(success({ message: "添加剧本成功" }));
  },
);
