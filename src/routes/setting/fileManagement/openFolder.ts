import express from "express";
import { z } from "zod";
import { exec } from "child_process";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { isEletron } from "@/utils/getPath";
import u from "@/utils";
import path from "path";
import { t, getLocale } from "@/i18n";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    path: z.string(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    if (!isEletron()) {
      return res.status(400).send(error(t("setting.fileManagement.openFolder.clientOnly", {}, locale)));
    }
    const { path: folderPath } = req.body;
    const platform = process.platform;
    const target = u.getPath(folderPath);
    const cmd = platform === "win32" ? `explorer "${target}"` : platform === "darwin" ? `open "${target}"` : `xdg-open "${target}"`;
    exec(cmd, (err) => {
      if (err) {
        return res.status(200).send(error(err.message));
      }
      res.status(200).send(success(null, t("setting.fileManagement.openFolder.opened", {}, locale)));
    });
  },
);
