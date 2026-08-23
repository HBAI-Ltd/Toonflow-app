import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
import isPathInside from "is-path-inside";
import u from "@/utils";
import p from "path";
import * as fs from "fs";
import { t, getLocale, canonicalSkillPath, resolveSkillReadPath } from "@/i18n";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    path: z.string(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { path } = req.body;
    const skillsRoot = u.getPath(["skills"]);
    const filePath = p.join(skillsRoot, path);
    if (!isPathInside(filePath, skillsRoot)) {
      return res.status(400).send(error(t("setting.skillManagement.getSkillContent.invalidPath", {}, locale)));
    }

    // Chấp nhận cả path base lẫn path sidecar do client gửi lên, quy về bản gốc rồi
    // resolve lại theo locale hiện tại: có sidecar thì đọc sidecar, không thì đọc bản gốc.
    const canonicalPath = canonicalSkillPath(filePath);
    const resolvedPath = resolveSkillReadPath(canonicalPath, locale);
    if (!isPathInside(resolvedPath, skillsRoot)) {
      return res.status(400).send(error(t("setting.skillManagement.getSkillContent.invalidPath", {}, locale)));
    }

    const raw = await fs.promises.readFile(resolvedPath, "utf-8");

    res.status(200).send(success(raw));
  },
);
