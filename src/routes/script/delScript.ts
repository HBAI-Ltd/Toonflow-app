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
    ids: z.array(z.number()),
  }),
  async (req, res) => {
    const { ids } = req.body;
    const scriptData = await db("o_script").whereIn("id", ids);

    if (scriptData.length) {
      const scriptProjectIds = new Set(scriptData.map((item) => item.projectId));
      await db("o_agentWorkData").whereIn("projectId", Array.from(scriptProjectIds)).whereIn("episodesId", ids).delete();
    }

    const storyboardData = await db("o_storyboard").whereIn("scriptId", ids);
    if (storyboardData.length) {
      await Promise.all(
        storyboardData.map(async (item) => {
          try {
            if (item.filePath) {
              await oss.deleteFile(item.filePath);
            }
          } catch {}
        }),
      );

      await db("o_assets2Storyboard").whereIn(
        "storyboardId",
        storyboardData.map((item) => item.id),
      ).delete();
    }

    await db("o_scriptAssets").whereIn("scriptId", ids).delete();
    await db("o_script").whereIn("id", ids).delete();
    await db("o_storyboard").whereIn("scriptId", ids).delete();
    await db("o_video").whereIn("scriptId", ids).delete();

    return res.status(200).send(success({ message: "删除剧本成功" }));
  },
);
