import express from "express";
import { exec } from "child_process";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import getPath, { isEletron } from "@/utils/getPath";

const router = express.Router();

function getOpenFolderCommand(target: string): string {
  if (process.platform === "win32") {
    return `explorer "${target}"`;
  }

  if (process.platform === "darwin") {
    return `open "${target}"`;
  }

  return `xdg-open "${target}"`;
}

async function runOpenFolderCommand(cmd: string): Promise<void> {
  const mockMode = process.env.TOONFLOW_MOCK_OPEN_FOLDER;

  if (mockMode === "success") {
    return;
  }

  if (mockMode === "failure") {
    throw new Error("mock open folder failure");
  }

  await new Promise<void>((resolve, reject) => {
    exec(cmd, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

export default router.post(
  "/",
  validateFields({
    path: z.string(),
  }),
  async (req, res) => {
    if (!isEletron()) {
      return res.status(400).send(error("仅支持客户端打开文件夹"));
    }

    const { path: folderPath } = req.body;
    const target = getPath(folderPath);
    const cmd = getOpenFolderCommand(target);

    try {
      await runOpenFolderCommand(cmd);
      return res.status(200).send(success("打开文件夹成功"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "打开文件夹失败";
      return res.status(200).send(error(message));
    }
  },
);
