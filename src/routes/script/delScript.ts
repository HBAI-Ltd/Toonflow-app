import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();

// 删除剧本
export default router.post(
  "/",
  validateFields({
    ids: z.array(z.number()),
  }),
  async (req, res) => {
    const { ids } = req.body;
    const locale = await getLocale(req as any);
    const scriptData = await u.db("o_script").whereIn("id", ids);
    if (scriptData && scriptData.length) {
      const scriptProjectId = new Set(scriptData.map((item) => item.projectId));
      await u.db("o_agentWorkData").whereIn("projectId", Array.from(scriptProjectId)).whereIn("episodesId", ids).delete();
    }
    const storyboardData = await u.db("o_storyboard").whereIn("scriptId", ids);
    if (storyboardData.length) {
      await Promise.all(
        storyboardData.map(async (item) => {
          try {
            item.filePath && (await u.oss.deleteFile(item.filePath));
          } catch (e) {}
        }),
      );
      const storyboardIds = storyboardData.map((item) => item.id);
      await u.db("o_assets2Storyboard").whereIn("storyboardId", storyboardIds).delete();
    }
    await u.db("o_scriptAssets").whereIn("scriptId", ids).delete();
    await u.db("o_script").whereIn("id", ids).delete();
    await u.db("o_storyboard").whereIn("scriptId", ids).delete();
    await u.db("o_video").whereIn("scriptId", ids).delete();
    res.status(200).send(success({ message: t("script.delScript.deleted", {}, locale) }));
  },
);
