import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

// 获取项目概览统计
export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
  }),
  async (req, res) => {
    const { projectId } = req.body;

    const scripts = await u.db("o_script").where("projectId", projectId).select("id");
    const scriptIds = scripts.map((item: any) => item.id);

    const roleCount: any = await u
      .db("o_assets")
      .where("projectId", projectId)
      .where("type", "角色") // i18n-ignore — internal DB "type" enum literal, not user-facing text
      .count("* as total")
      .first();
    const scriptCount: any = await u.db("o_script").where("projectId", projectId).count("* as total").first();
    const videoCount: any = await u.db("o_video").whereIn("scriptId", scriptIds).count("* as total").first();
    const storyboardCount: any = await u
      .db("o_assets")
      .whereIn("scriptId", scriptIds)
      .where("type", "分镜") // i18n-ignore — internal DB "type" enum literal, not user-facing text
      .count("* as total")
      .first();

    const data = {
      roleCount: roleCount?.total || 0,
      scriptCount: scriptCount?.total || 0,
      videoCount: videoCount?.total || 0,
      storyboardCount: storyboardCount?.total || 0,
    };

    res.status(200).send(success(data));
  }
);
