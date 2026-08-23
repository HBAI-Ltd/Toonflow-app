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
      .db("o_storyboard")
      .whereIn("id", ids)
      .whereNot("state", "生成中") // i18n-ignore — stored o_storyboard.state enum value, not user-facing text
      .select("id", "state", "reason", "filePath", "prompt");
    const result = await Promise.all(
      data.map(async (item: any) => ({
        ...item,
        src: item.filePath ? await u.oss.getSmallImageUrl(item.filePath) : null,
      })),
    );
    res.status(200).send(success(result));
  },
);
