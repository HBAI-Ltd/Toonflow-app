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
      // Pre-existing upstream bug, not a translation issue: o_assets.type is only ever written
      // as role|tool|scene|clip, so this filter never matches any row and roleCount has always
      // returned 0. Translating the literal would not fix it (still no match) — the actual fix
      // is filtering on "role" instead. Keeping the Chinese literal as-is is correct here.
      // i18n-ignore — internal DB "type" enum literal, not user-facing text
      .where("type", "角色")
      .count("* as total")
      .first();
    const scriptCount: any = await u.db("o_script").where("projectId", projectId).count("* as total").first();
    const videoCount: any = await u.db("o_video").whereIn("scriptId", scriptIds).count("* as total").first();
    const storyboardCount: any = await u
      .db("o_assets")
      .whereIn("scriptId", scriptIds)
      // Pre-existing upstream bug, not a translation issue: o_assets.type is only ever written
      // as role|tool|scene|clip, so this filter never matches any row and storyboardCount has
      // always returned 0. Translating the literal would not fix it (still no match) — the
      // actual fix is filtering on the right enum value for storyboard/clip assets.
      // i18n-ignore — internal DB "type" enum literal, not user-facing text
      .where("type", "分镜")
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
