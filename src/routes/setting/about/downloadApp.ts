import express from "express";
import z from "zod";
import { validateFields } from "@/middleware/middleware";
import u from "@/utils";
import fs from "fs";
import axios from "axios";
import compressing from "compressing";
import { success } from "@/lib/responseFormat";
import { t, getLocale } from "@/i18n";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    url: z.url(),
    reinstall: z.boolean(),
    version: z.string(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { reinstall, url, version } = req.body;
    if (reinstall) {
      res.status(200).send(success(null, t("setting.about.downloadApp.manualDownloadRequired", {}, locale)));
    } else {
      const rootDir = u.getPath(["temp"]);
      fs.mkdirSync(rootDir, { recursive: true });
      const zip = await axios.get(url, { responseType: "arraybuffer" }).then((res) => res.data);
      fs.writeFileSync(`${rootDir}/latest.zip`, zip);
      await compressing.zip.uncompress(`${rootDir}/latest.zip`, rootDir);
      const dataDir = u.getPath();
      fs.cpSync(rootDir, dataDir, { recursive: true, force: true });
      fs.rmSync(rootDir, { recursive: true, force: true });
      res.status(200).send(success(null, t("setting.about.downloadApp.updateSuccessRestarting", { version }, locale)));
    }
  },
);
