import express from "express";
import { z } from "zod";
import { execFile } from "child_process";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { isEletron } from "@/utils/getPath";
import u from "@/utils";
const router = express.Router();

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
    const platform = process.platform;
    const target = u.getPath(folderPath);

    // 使用 execFile 代替 exec 避免命令注入
    // execFile 不通过 shell 解释器，直接传递参数数组
    const cmd = platform === "win32" ? "explorer" : platform === "darwin" ? "open" : "xdg-open";
    execFile(cmd, [target], (err) => {
      if (err) {
        return res.status(200).send(error(err.message));
      }
      res.status(200).send(success("打开文件夹成功"));
    });
  },
);
