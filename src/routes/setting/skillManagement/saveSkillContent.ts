import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
import isPathInside from "is-path-inside";
import u from "@/utils";
import p from "path";
import * as fs from "fs";
import { createPromptDraft } from "@/utils/promptCenter";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    path: z.string(),
    content: z.string(),
  }),
  async (req, res) => {
    const { path, content } = req.body;
    const skillsRoot = u.getPath(["skills"]);
    const filePath = p.join(skillsRoot, path);
    if (!isPathInside(filePath, skillsRoot)) {
      return res.status(400).send(error("无效的路径"));
    }

    if (!fs.existsSync(filePath)) {
      return res.status(400).send(error("文件不存在"));
    }

    const draft = await createPromptDraft({
      scope: "skill",
      key: path,
      sourceType: "skillFile",
      sourcePath: path,
      content,
      note: "legacy skillManagement/saveSkillContent",
    });

    res.status(200).send(success({ draftId: draft.id, status: draft.status }, "草稿已保存，发布后生效"));
  },
);
