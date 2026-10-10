import { stat } from "@toonflow/file";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import { getRuntimePlatform } from "@/lib/platform";

const router = Router();

export default router.post("/", validateFields({ directory: z.string().min(1).max(4096), path: z.string().max(4096) }), async (req, res) => {
  const desktop = u.desktop.getDesktopRuntime(req);
  const native = !!desktop || getRuntimePlatform().nativeDevelopment;
  if (!native || !u.workspace.isLocalWorkspaceRequest(req)) throw Object.assign(new Error("仅支持桌面客户端或本机开发页面打开文件所在位置"), { status: 403 });
  const { path } = await u.workspaceFile.resolveWorkspaceFile(req, req.body.directory, req.body.path);
  await stat(path);
  if (desktop) desktop.showItemInFolder(path);
  else {
    const child = process.platform === "win32"
      ? spawn(resolve(process.env.WINDIR ?? "C:\\Windows", "explorer.exe"), ["/select,", path], { windowsHide: true, stdio: "ignore" })
      : spawn("/usr/bin/open", ["-R", path], { stdio: "ignore" });
    await new Promise<void>((resolve, reject) => { child.once("error", reject); child.once("spawn", resolve); });
    child.unref();
  }
  res.json(success());
});
