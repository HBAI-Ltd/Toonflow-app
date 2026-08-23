import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
import { z } from "zod";
const router = express.Router();

import fs from "fs";
import path from "path";

declare const __APP_VERSION__: string | undefined;

const APP_VERSION: string = (() => {
  if (typeof __APP_VERSION__ !== "undefined") {
    return __APP_VERSION__;
  }
  // 开发环境回退：从 package.json 读取
  const pkgPath = path.resolve(process.cwd(), "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  return pkg.version;
})();

export default router.post(
  "/",
  validateFields({
    source: z.enum(["toonflow", "github", "gitee", "atomgit"]),
    url: z.url().nullable().optional(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { source, url } = req.body;

    const getUrl = url ?? "https://toonflow.oss-cn-beijing.aliyuncs.com/update.json";

    const versionInfo = await fetch(getUrl).then((res) => res.json());
    if (!versionInfo) return res.status(400).send(error(t("setting.about.checkUpdate.versionInfoFailed", {}, locale)));
    const { version: tagger, time, data } = versionInfo;

    const sourceData = data[source];
    if (!sourceData) return res.status(400).send(error(t("setting.about.checkUpdate.sourceDownloadInfoFailed", {}, locale)));

    const platformType: Record<string, string> = {
      win32: "windows",
      darwin: "macos",
      linux: "linux",
    };

    const zipItem = sourceData.find((d: any) => d.type === "zip");
    const installerItem = sourceData.find((d: any) => d.type === platformType[process.platform]);

    const taggerList = tagger.split(".").map(Number);
    const currentVersionList = APP_VERSION.split(".").map(Number);
    //对比Major
    if (taggerList[0] > currentVersionList[0]) {
      if (!installerItem) return res.status(400).send(error(t("setting.about.checkUpdate.noInstallerForPlatform", {}, locale)));
      return res
        .status(200)
        .send(success({ needUpdate: true, latestVersion: tagger, reinstall: true, time, url: installerItem.url, version: tagger }));
    }
    //对比Minor
    if (taggerList[1] > currentVersionList[1]) {
      if (!installerItem) return res.status(400).send(error(t("setting.about.checkUpdate.noInstallerForPlatform", {}, locale)));
      return res
        .status(200)
        .send(success({ needUpdate: true, latestVersion: tagger, reinstall: true, time, url: installerItem.url, version: tagger }));
    }
    //Patch
    if (taggerList[2] > currentVersionList[2]) {
      if (!zipItem) return res.status(400).send(error(t("setting.about.checkUpdate.noIncrementalPackage", {}, locale)));
      return res.status(200).send(success({ needUpdate: true, latestVersion: tagger, reinstall: false, time, url: zipItem.url, version: tagger }));
    }
    return res.status(200).send(success({ needUpdate: false, latestVersion: tagger, reinstall: false, time, version: tagger }));
  },
);
