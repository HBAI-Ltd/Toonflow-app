import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
import fs from "fs";
import path from "path";

declare const __APP_VERSION__: string | undefined;

const router = express.Router();

const APP_VERSION: string = (() => {
  if (typeof __APP_VERSION__ !== "undefined") {
    return __APP_VERSION__;
  }

  const cwdPkgPath = path.resolve(process.cwd(), "package.json");
  const repoPkgPath = path.resolve(__dirname, "..", "..", "..", "..", "package.json");
  const pkgPath = fs.existsSync(cwdPkgPath) ? cwdPkgPath : repoPkgPath;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  return pkg.version;
})();

function parseVersionParts(version: string): [number, number, number] | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    return null;
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

type DownloadCandidate = {
  type?: unknown;
  url?: unknown;
};

function hasDownloadUrl(item: DownloadCandidate | undefined): item is { type: string; url: string } {
  return typeof item?.url === "string" && item.url.length > 0;
}

export default router.post(
  "/",
  validateFields({
    source: z.enum(["toonflow", "github", "gitee", "atomgit"]),
    url: z.url().nullable().optional(),
  }),
  async (req, res) => {
    const { source, url } = req.body;
    const updateUrl = url ?? "https://toonflow.oss-cn-beijing.aliyuncs.com/update.json";

    try {
      const versionInfo = await fetch(updateUrl).then((response) => response.json());
      if (!versionInfo || typeof versionInfo !== "object") {
        return res.status(400).send(error("\u65e0\u6cd5\u83b7\u53d6\u7248\u672c\u4fe1\u606f"));
      }

      const { version: tagger, time, data } = versionInfo as {
        version?: unknown;
        time?: unknown;
        data?: Record<string, unknown>;
      };
      if (typeof tagger !== "string" || !tagger || !data || typeof data !== "object") {
        return res.status(400).send(error("\u65e0\u6cd5\u83b7\u53d6\u7248\u672c\u4fe1\u606f"));
      }

      const sourceData = data[source];
      if (!Array.isArray(sourceData)) {
        return res.status(400).send(error("\u65e0\u6cd5\u83b7\u53d6\u8be5\u6e90\u7684\u4e0b\u8f7d\u4fe1\u606f"));
      }

      const platformType: Record<string, string> = {
        win32: "windows",
        darwin: "macos",
        linux: "linux",
      };

      const zipItem = sourceData.find(
        (item): item is DownloadCandidate => !!item && typeof item === "object" && (item as DownloadCandidate).type === "zip",
      );
      const installerItem = sourceData.find(
        (item): item is DownloadCandidate =>
          !!item && typeof item === "object" && (item as DownloadCandidate).type === platformType[process.platform],
      );
      const taggerList = parseVersionParts(tagger);
      const currentVersionList = parseVersionParts(APP_VERSION);
      if (!taggerList || !currentVersionList) {
        return res.status(400).send(error("\u7248\u672c\u4fe1\u606f\u683c\u5f0f\u9519\u8bef"));
      }

      if (taggerList[0] > currentVersionList[0] || taggerList[1] > currentVersionList[1]) {
        if (!hasDownloadUrl(installerItem)) {
          return res.status(400).send(error("\u8be5\u6e90\u6682\u65e0\u9002\u7528\u4e8e\u5f53\u524d\u7cfb\u7edf\u7684\u5b89\u88c5\u5305"));
        }

        return res
          .status(200)
          .send(success({ needUpdate: true, latestVersion: tagger, reinstall: true, time, url: installerItem.url, version: tagger }));
      }

      if (taggerList[2] > currentVersionList[2]) {
        if (!hasDownloadUrl(zipItem)) {
          return res.status(400).send(error("\u8be5\u6e90\u6682\u65e0\u589e\u91cf\u66f4\u65b0\u5305"));
        }

        return res
          .status(200)
          .send(success({ needUpdate: true, latestVersion: tagger, reinstall: false, time, url: zipItem.url, version: tagger }));
      }

      return res.status(200).send(success({ needUpdate: false, latestVersion: tagger, reinstall: false, time, version: tagger }));
    } catch {
      return res.status(400).send(error("\u65e0\u6cd5\u83b7\u53d6\u7248\u672c\u4fe1\u606f"));
    }
  },
);
