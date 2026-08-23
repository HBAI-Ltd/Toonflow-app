import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();

// 新增资产
export default router.post(
  "/",
  validateFields({
    name: z.string(),
    describe: z.string(),
    projectId: z.number(),
    assetsItem: z.array(
      z.object({
        base64: z.string(),
        prompt: z.string(),
        describe: z.string(),
        name: z.string(),
      }),
    ),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { name, describe, projectId, assetsItem } = req.body;
    await Promise.all(
      assetsItem.map(async (i: { src?: string; base64: string; prompt: string }) => {
        if (i.base64) {
          const mimeMatch = i.base64.match(/^data:audio\/([^;]+);base64,/);
          const mimeExt = mimeMatch ? mimeMatch[1] : "mp3";
          const mimeToExt: Record<string, string> = {
            mpeg: "mp3",
            "x-wav": "wav",
            "x-aiff": "aiff",
            "x-m4a": "m4a",
            "x-flac": "flac",
          };
          const ext = mimeToExt[mimeExt] ?? mimeExt;
          const savePath = `/${projectId}/assets/audio/${u.uuid()}.${ext}`;
          const base64Data = i.base64.replace(/^data:[^;]+;base64,/, "");
          await u.oss.writeFile(savePath, base64Data);
          i.src = savePath;
        }
      }),
    );

    const [id] = await u.db("o_assets").insert({
      name,
      describe,
      type: "audio",
      projectId,
      startTime: Date.now(),
    });
    for (const item of assetsItem) {
      const [assetsId] = await u.db("o_assets").insert({
        prompt: item.prompt,
        assetsId: id,
        type: "audio",
        describe: item.describe,
        name: item.name,
        projectId,
        startTime: Date.now(),
      });
      const [imageId] = await u.db("o_image").insert({
        filePath: item.src,
        type: "audio",
        assetsId,
        state: "已完成", // i18n-ignore — stored o_image.state enum value, not user-facing text
      });
      await u.db("o_assets").where("id", assetsId).update({
        imageId,
      });
    }

    res.status(200).send(success({ message: t("assets.common.added", {}, locale) }));
  },
);
