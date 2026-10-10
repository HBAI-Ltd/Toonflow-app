import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join, resolve } from "node:path";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "@toonflow/file";

// 运行：bun apps/desktop/scripts/checkStartupLauncher.ts
// 使用真实启动入口和空目录，验证更新启动失败不会弹框、等待用户或自行兼容重试。
const execFileAsync = promisify(execFile);
const projectDirectory = resolve(import.meta.dir, "../../..");
const buildDirectory = realpathSync(join(projectDirectory, "build/desktop"));
const directory = mkdtempSync(join(buildDirectory, "startupCheck"));
const launcher = join(directory, "app/Resources/app/startupLauncher.exe");
try {
  mkdirSync(join(directory, "app/bin"), { recursive: true });
  mkdirSync(dirname(launcher), { recursive: true });
  await execFileAsync(join(process.env.WINDIR!, "Microsoft.NET/Framework64/v4.0.30319/csc.exe"), [
    "/nologo", "/target:winexe", "/platform:x64", "/reference:System.Windows.Forms.dll", `/out:${launcher}`,
    join(projectDirectory, "apps/desktop/native/startupLauncher.cs"),
  ], { windowsHide: true });
  let exitCode: unknown;
  try {
    await execFileAsync(launcher, [], {
      env: { ...process.env, TOONFLOW_UPDATE_TRANSACTION: "0123456789abcdef0123456789abcdef" },
      windowsHide: true,
      timeout: 5000,
    });
  } catch (error) {
    assert.equal((error as { killed?: boolean }).killed, false, "更新失败不能停留在交互弹窗中");
    exitCode = (error as { code?: unknown }).code;
  }
  assert.equal(exitCode, 2, "缺少原启动器时应返回系统错误 2，由更新助手回滚");
  console.log("启动入口检查通过：更新启动失败直接返回，不弹框或重试。");
} finally {
  if (dirname(realpathSync(directory)) !== buildDirectory) throw new Error("拒绝清理检查目录之外的路径。");
  rmSync(directory, { recursive: true, force: true });
}
