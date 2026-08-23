import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();

// 新增资产
export default router.post(
  "/",
  validateFields({
    assetsId: z.number(),
    audioIds: z.array(z.number()).optional(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { assetsId, audioIds } = req.body;
    if (audioIds && audioIds.length > 1) return res.status(400).send(error(t("cornerScape.updateAssetsAudio.onlyOneVoice", {}, locale)));
    await u.db("o_assetsRole2Audio").where("assetsRoleId", assetsId).delete();
    if (audioIds && audioIds.length) {
      await u.db("o_assetsRole2Audio").insert({ assetsRoleId: assetsId, assetsAudioId: audioIds[0] });
    }
    res.status(200).send(success({ message: t("cornerScape.updateAssetsAudio.updated", {}, locale) }));
  },
);
