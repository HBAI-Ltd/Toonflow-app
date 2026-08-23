import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();

// 修改项目
export default router.post(
  "/",
  validateFields({
    id: z.number(),
    intro: z.string().optional().nullable(),
    type: z.string().optional().nullable(),
    artStyle: z.string().optional().nullable(),
    videoRatio: z.string().optional().nullable(),
    projectType: z.string().optional().nullable(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { id, intro, type, artStyle, videoRatio, projectType } = req.body;

    await u.db("o_project").where("id", id).update({
      intro,
      type,
      artStyle,
      videoRatio,
      projectType,
    });

    res.status(200).send(success({ message: t("general.updateProject.updated", {}, locale) }));
  },
);
