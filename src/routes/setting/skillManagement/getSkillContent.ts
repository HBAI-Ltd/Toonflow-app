import express from "express";
import path from "path";
import * as fs from "fs";
import isPathInside from "is-path-inside";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import getPath from "@/utils/getPath";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    path: z.string(),
  }),
  async (req, res) => {
    const { path: relativePath } = req.body;
    const skillsRoot = getPath(["skills"]);
    const filePath = path.join(skillsRoot, relativePath);

    if (!isPathInside(filePath, skillsRoot)) {
      return res.status(400).send(error("无效的路径"));
    }

    const raw = await fs.promises.readFile(filePath, "utf-8");
    res.status(200).send(success(raw));
  },
);
