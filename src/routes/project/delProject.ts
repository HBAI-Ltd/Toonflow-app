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

    await db("o_project").where("id", id).delete();
    await db("o_agentWorkData").where("projectId", id).delete();

    const novelData = await db("o_novel").where("projectId", id).select("id");
    const novelIds = novelData.map((item: any) => item.id);
    if (novelIds.length > 0) {
      await db("o_outlineNovel").whereIn("novelId", novelIds).delete();
    }
    await db("o_novel").where("projectId", id).delete();

    const scriptData = await db("o_script").where("projectId", id).select("id");
    const scriptIds = scriptData.map((item: any) => item.id);
    if (scriptIds.length > 0) {
      await db("o_scriptAssets").whereIn("scriptId", scriptIds).delete();
    }
    await db("o_script").where("projectId", id).delete();

    await db("o_outline").where("projectId", id).delete();
    await db("o_tasks").where("projectId", id).delete();

    const storyboardData = await db("o_storyboard").where("projectId", id).select("id");
    const storyboardIds = storyboardData.map((item: any) => item.id);
    if (storyboardIds.length > 0) {
      await db("o_assets2Storyboard").whereIn("storyboardId", storyboardIds).delete();
    }
    await db("o_storyboard").where("projectId", id).delete();

    const assetsData = await db("o_assets").where("projectId", id).select("id");
    const assetsIds = assetsData.map((item: any) => item.id);
    if (assetsIds.length > 0) {
      await db("o_assets").whereIn("id", assetsIds).update({ imageId: null });
      await db("o_image").whereIn("assetsId", assetsIds).delete();
    }
    await db("o_assets").where("projectId", id).delete();

    await db("o_videoTrack").where("projectId", id).delete();
    await db("o_video").where("projectId", id).delete();
    await db("memories").where("isolationKey", "like", `${id}:%`).delete();

    try {
      await oss.deleteDirectory(`${id}/`);
    } catch {
      // Ignore missing OSS directories during local cleanup.
    }

    res.status(200).send(success({ message: "delete project success" }));
  },
);
