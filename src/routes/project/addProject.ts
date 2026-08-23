import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();

// 新增项目
export default router.post(
  "/",
  validateFields({
    projectType: z.string(),
    name: z.string(),
    intro: z.string(),
    type: z.string(),
    artStyle: z.string(),
    directorManual: z.string(),
    videoRatio: z.string(),
    imageModel: z.string(),
    videoModel: z.string(),
    imageQuality: z.string(),
    mode: z.string(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { projectType, name, intro, type, directorManual, artStyle, videoRatio, imageModel, videoModel, imageQuality, mode } = req.body;

    await u.db("o_project").insert({
      id: Date.now(),
      projectType,
      name,
      intro,
      type,
      artStyle,
      videoRatio,
      directorManual,
      userId: 1,
      imageModel,
      videoModel,
      createTime: Date.now(),
      imageQuality,
      mode,
    });

    res.status(200).send(success({ message: t("project.addProject.added", {}, locale) }));
  },
);
