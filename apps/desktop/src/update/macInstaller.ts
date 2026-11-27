import { lstat, realpath } from "@toonflow/file";
import { t } from "@toonflow/server/i18n";
import { execFile } from "node:child_process";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { promisify } from "node:util";
import readMacPackageIdentity from "./macPackageIdentity";

const execFileAsync = promisify(execFile);
const appIdentifier = "local.toonflow.desktop";
type installerTarget = { version: string; hash: string };

export async function verifyMacInstaller(path: string, resourcesDirectory: string, target: installerTarget) {
  if (process.platform !== "darwin" || !isAbsolute(path) || /[\r\n]/.test(path) || !path.endsWith(".pkg")) {
    throw new Error(t`更新包校验失败`);
  }
  const directory = await realpath(dirname(path));
  const pkg = join(directory, basename(path));
  const [folder, before] = await Promise.all([lstat(directory), lstat(pkg, { bigint: true })]);
  const userId = process.getuid!();
  if (!folder.isDirectory() || folder.uid !== userId || (folder.mode & 0o022)
    || !before.isFile() || before.uid !== BigInt(userId) || (before.mode & 0o022n)) {
    throw new Error(t`更新缓存目录权限无效`);
  }
  const options = { env: { ...process.env, LC_ALL: "C", LANG: "C" }, timeout: 120_000, maxBuffer: 64 * 1024 };
  try {
    const [signature, assessment] = await Promise.all([
      execFileAsync("/usr/sbin/pkgutil", ["--check-signature", pkg], options),
      execFileAsync("/usr/sbin/spctl", ["--assess", "--type", "install", "--verbose=4", pkg], options),
    ]);
    const team = /^\s*1\. Developer ID Installer: [^\r\n]+ \(([A-Z0-9]{10})\)\s*$/m.exec(signature.stdout)?.[1];
    if (!team || !/^source=Notarized Developer ID\s*$/m.test(assessment.stderr)) {
      throw new Error("macOS Installer signature or notarization check failed");
    }
    // 用当前安装的应用校验签发团队，第三方更新源只能选择该团队签名的 Toonflow 包。
    const requirement = `anchor apple generic and identifier "${appIdentifier}" and certificate leaf[field.1.2.840.113635.100.6.1.13] exists and certificate leaf[subject.OU] = "${team}"`;
    await execFileAsync("/usr/bin/codesign", ["--verify", "--strict", "--test-requirement", `=${requirement}`, resolve(resourcesDirectory, "../..")], options);
  } catch (cause) {
    throw new Error(t`安装包未通过 macOS 签名或公证验证`, { cause });
  }

  // 系统通过签名及公证检查后，只读取签名包内的发行标识。
  let identity;
  try {
    identity = JSON.parse(await readMacPackageIdentity(pkg));
  } catch (cause) {
    throw new Error(t`更新包版本与清单不一致`, { cause });
  }
  if (identity?.identifier !== appIdentifier || identity.channel !== "stable" || identity.platform !== "macos"
    || identity.arch !== process.arch || identity.version !== target.version || identity.hash !== target.hash) {
    throw new Error(t`更新包版本与清单不一致`);
  }
  const after = await lstat(pkg, { bigint: true });
  if (before.dev !== after.dev || before.ino !== after.ino || before.ctimeNs !== after.ctimeNs || before.size !== after.size) {
    throw new Error(t`更新包校验失败`);
  }
  return pkg;
}

export async function openMacInstaller(path: string, resourcesDirectory: string, target: installerTarget) {
  const pkg = await verifyMacInstaller(path, resourcesDirectory, target);
  try {
    await execFileAsync("/usr/bin/open", ["-b", "com.apple.installer", pkg], { timeout: 30_000 });
  } catch (cause) {
    throw new Error(t`无法打开 macOS 系统安装器`, { cause });
  }
}
