import express from "express";
import db from "@/utils/db";
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

    const scripts = await db("o_script").where("projectId", projectId).select("id");
    const scriptIds = scripts.map((item: any) => item.id);

    const roleCount: any = await db("o_assets").where("projectId", projectId).where("type", "role").count("* as total").first();
    const scriptCount: any = await db("o_script").where("projectId", projectId).count("* as total").first();
    const videoCount: any = await db("o_video").whereIn("scriptId", scriptIds).count("* as total").first();
    const storyboardCount: any = await db("o_assets").whereIn("scriptId", scriptIds).where("type", "storyboard").count("* as total").first();

    const data = {
      roleCount: Number(roleCount?.total || 0),
      scriptCount: Number(scriptCount?.total || 0),
      videoCount: Number(videoCount?.total || 0),
      storyboardCount: Number(storyboardCount?.total || 0),
    };

    res.status(200).send(success(data));
  }
);
