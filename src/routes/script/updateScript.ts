import express from "express";
import db from "@/utils/db";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    id: z.number(),
    name: z.string(),
    content: z.string(),
    assets: z.array(z.number()),
  }),
  async (req, res) => {
    const { id, name, content, assets } = req.body;

    if (content.length >= 3000) {
      return res.status(400).send(error("内容不能超过3000字"));
    }

    await db("o_script").where({ id }).update({
      name,
      content,
    });

    // Always replace associations so assets=[] truly clears prior links.
    await db("o_scriptAssets").where({ scriptId: id }).delete();

    if (assets.length) {
      const assetsData = await db("o_assets").whereIn("id", assets).select();
      if (assetsData.length) {
        await db("o_scriptAssets").insert(
          assetsData.map((item) => ({
            scriptId: id,
            assetId: item.id,
          })),
        );
      }
    }

    return res.status(200).send(success({ message: "编辑剧本成功" }));
  },
);
