import express from "express";
import z from "zod";
import { validateFields } from "@/middleware/middleware";
import u from "@/utils";
import fs from "fs";
import path from "path";
import axios from "axios";
import compressing from "compressing";
import { success, error } from "@/lib/responseFormat";

const router = express.Router();

type ManagedTarget = {
  key: "serve" | "web" | "skills" | "models";
  sourcePath: string;
  targetPath: string;
};

type TargetSnapshot = {
  targetPath: string;
  backupPath: string;
  existed: boolean;
};

function snapshotTarget(targetPath: string, backupPath: string): TargetSnapshot {
  const existed = fs.existsSync(targetPath);

  if (existed) {
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.cpSync(targetPath, backupPath, { recursive: true, force: true });
  }

  return {
    targetPath,
    backupPath,
    existed,
  };
}

function restoreTarget(snapshot: TargetSnapshot) {
  fs.rmSync(snapshot.targetPath, { recursive: true, force: true });

  if (snapshot.existed) {
    fs.cpSync(snapshot.backupPath, snapshot.targetPath, { recursive: true, force: true });
  }
}

export default router.post(
  "/",
  validateFields({
    url: z.url(),
    reinstall: z.boolean(),
    version: z.string(),
  }),
  async (req, res) => {
    const { reinstall, url, version } = req.body;

    if (reinstall) {
      return res.status(200).send(success("\u8bf7\u5728\u6d4f\u89c8\u5668\u4e2d\u624b\u52a8\u4e0b\u8f7d\u5e76\u5b89\u88c5\u6700\u65b0\u7248\u672c"));
    }

    const rootDir = u.getPath(["temp"]);
    const backupRoot = path.join(rootDir, "__backup");
    const updatedTargets: TargetSnapshot[] = [];

    try {
      fs.mkdirSync(rootDir, { recursive: true });
      const zip = await axios.get(url, { responseType: "arraybuffer" }).then((response) => response.data);
      fs.writeFileSync(`${rootDir}/latest.zip`, zip);
      await compressing.zip.uncompress(`${rootDir}/latest.zip`, rootDir);

      const managedTargets: ManagedTarget[] = [
        { key: "serve", sourcePath: u.getPath(["temp", "serve"]), targetPath: u.getPath(["serve"]) },
        { key: "web", sourcePath: u.getPath(["temp", "web"]), targetPath: u.getPath(["web"]) },
        { key: "skills", sourcePath: u.getPath(["temp", "skills"]), targetPath: u.getPath(["skills"]) },
        { key: "models", sourcePath: u.getPath(["temp", "models"]), targetPath: u.getPath(["models"]) },
      ];

      // Snapshot touched targets so a later copy failure can restore prior state.
      for (const managedTarget of managedTargets) {
        if (!fs.existsSync(managedTarget.sourcePath)) {
          continue;
        }

        const snapshot = snapshotTarget(managedTarget.targetPath, path.join(backupRoot, managedTarget.key));
        updatedTargets.push(snapshot);
        fs.cpSync(managedTarget.sourcePath, managedTarget.targetPath, { recursive: true, force: true });
      }

      return res.status(200).send(success(`\u66f4\u65b0${version}\u6210\u529f\uff0c3\u79d2\u540e\u91cd\u542f`));
    } catch {
      for (const snapshot of updatedTargets.reverse()) {
        try {
          restoreTarget(snapshot);
        } catch {}
      }

      return res.status(400).send(error("\u66f4\u65b0\u4e0b\u8f7d\u5931\u8d25"));
    } finally {
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  },
);
