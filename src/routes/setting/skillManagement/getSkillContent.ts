import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
import isPathInside from "is-path-inside";
import u from "@/utils";
import p from "path";
import * as fs from "fs";
import { t, getLocale } from "@/i18n";

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

    const raw = await fs.promises.readFile(filePath, "utf-8");

    res.status(200).send(success(raw));
  },
);
