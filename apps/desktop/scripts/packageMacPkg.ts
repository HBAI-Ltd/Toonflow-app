import { chmodSync, copyFileSync, lstatSync, mkdirSync, mkdtempSync, realpathSync, renameSync, rmSync, writeAtomicSync } from "@toonflow/file";
import { file, write } from "@toonflow/file/bun";
import { join, resolve } from "node:path";
import desktopConfig from "../../../electrobun.config";

if (process.platform !== "darwin" || !["x64", "arm64"].includes(process.arch)) {
  throw new Error("macOS 安装包需要在 Mac x64/arm64 环境构建。");
}

async function run(command: string[]) {
  const child = Bun.spawn(command, { stdin: "ignore", stdout: "inherit", stderr: "inherit", timeout: 600000 });
  if (await child.exited !== 0) throw new Error(`macOS 安装包制作失败：${command[0]}`);
}

const projectDir = realpathSync(resolve(import.meta.dirname, "../../.."));
const artifactDir = resolve(projectDir, desktopConfig.build.artifactFolder);
const version = desktopConfig.app.version;
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error("macOS 版本号必须为 X.Y.Z。");
const prefix = `stable-macos-${process.arch}`;
const manifest = await file(join(artifactDir, `${prefix}-update.json`)).json();
if (manifest.version !== version || manifest.platform !== "macos" || manifest.arch !== process.arch
  || manifest.identifier !== desktopConfig.app.identifier || manifest.channel !== "stable") {
  throw new Error("macOS 构建产物的版本、平台或应用标识不一致，请重新构建。");
}
const archiveName = manifest.artifact?.file;
if (typeof archiveName !== "string" || !archiveName.startsWith(`${prefix}-`)
  || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.tar\.zst$/.test(archiveName)) {
  throw new Error("macOS 更新包名称无效。");
}
const signed = process.env.macCodesign === "1";
const installerIdentity = process.env.ELECTROBUN_INSTALLER_ID;
if (signed && !installerIdentity) throw new Error("PKG 签名缺少 ELECTROBUN_INSTALLER_ID（Developer ID Installer）。");

const stagingParent = resolve(projectDir, "build/desktop/pkg");
mkdirSync(stagingParent, { recursive: true });
const stagingDir = mkdtempSync(join(stagingParent, "payload"));
const appName = `${desktopConfig.app.name.replace(/ /g, "")}.app`;
const outputName = `toonflow-${version}-macos-${process.arch}.pkg`;
try {
  const tarPath = join(stagingDir, "app.tar");
  await write(tarPath, Bun.zstdDecompressSync(await file(join(artifactDir, archiveName)).arrayBuffer()));
  const listing = Bun.spawnSync(["/usr/bin/tar", "-tf", tarPath], { stdout: "pipe", stderr: "inherit" });
  if (listing.exitCode !== 0) throw new Error("无法读取 macOS 应用归档。");
  const members = listing.stdout.toString().trim().split("\n");
  if (members.some(name => name !== appName && !name.startsWith(`${appName}/`) || name.split("/").includes(".."))) {
    throw new Error("macOS 更新归档包含应用目录以外的路径。");
  }
  // ACT: 安装器使用同次构建的真正应用，省去首次运行自解压包装器。
  const applicationDir = join(stagingDir, "application");
  mkdirSync(applicationDir);
  await run(["/usr/bin/tar", "-xf", tarPath, "-C", applicationDir]);
  const appPath = join(applicationDir, appName);
  const resources = join(appPath, "Contents/Resources");
  const bunPath = join(appPath, "Contents/MacOS/bun");
  for (const path of [bunPath, join(appPath, "Contents/MacOS/launcher"), join(resources, "main.js"), join(resources, "uninstall")]) {
    const entry = lstatSync(path);
    if (!entry.isFile() || entry.isSymbolicLink()) throw new Error(`macOS 应用归档缺少有效文件：${path}`);
  }
  const appVersion = await file(join(resources, "version.json")).json();
  if (appVersion.version !== version || appVersion.hash !== manifest.hash) throw new Error("macOS 应用与更新清单不一致。");

  const externalRuntime = process.env.TOONFLOW_EXTERNAL_RUNTIME === "1";
  if (externalRuntime) {
    const runtimeDir = join(projectDir, "build/desktop/runtime");
    copyFileSync(join(runtimeDir, "runtimeLauncher"), bunPath);
    chmodSync(bunPath, 0o755);
    const runtimeInfo = join(resources, "runtimeInfo.json");
    copyFileSync(join(runtimeDir, "runtimeInfo.json"), runtimeInfo);
    chmodSync(runtimeInfo, 0o644);
    if (signed) {
      const identity = process.env.ELECTROBUN_DEVELOPER_ID;
      if (!identity) throw new Error("macOS 应用签名缺少 ELECTROBUN_DEVELOPER_ID。");
      const entitlements = join(projectDir, "build/desktop/app", prefix, "entitlements.plist");
      for (const path of [bunPath, appPath]) {
        await run(["/usr/bin/codesign", "--force", "--timestamp", "--options", "runtime", "--entitlements", entitlements, "--sign", identity, path]);
      }
      await run(["/usr/bin/codesign", "--verify", "--deep", "--strict", "--verbose=2", appPath]);
    }
  }

  const output = join(stagingDir, outputName);
  let component: string | undefined;
  if (externalRuntime) {
    const scriptsDir = join(stagingDir, "scripts");
    mkdirSync(scriptsDir);
    copyFileSync(bunPath, join(scriptsDir, "runtimeInstaller"));
    chmodSync(join(scriptsDir, "runtimeInstaller"), 0o755);
    copyFileSync(join(resources, "runtimeInfo.json"), join(scriptsDir, "runtimeInfo.json"));
    chmodSync(join(scriptsDir, "runtimeInfo.json"), 0o644);
    // ACT: 安装前还没有 Bun，使用系统命令把同一原生下载器交给真实登录用户。
    writeAtomicSync(join(scriptsDir, "prepareRuntime"), `#!/bin/sh
set -eu
consoleUser=$(/usr/bin/stat -f '%Su' /dev/console)
case "$consoleUser" in ''|root|loginwindow) echo '请登录 Mac 桌面后重新安装 Toonflow。' >&2; exit 1;; esac
consoleUid=$(/usr/bin/id -u "$consoleUser")
/bin/launchctl print "gui/$consoleUid" >/dev/null
scriptDirectory=$(CDPATH= cd -- "$(/usr/bin/dirname "$0")" && pwd -P)
temporaryDirectory=$(/usr/bin/mktemp -d /private/tmp/toonflowRuntime.XXXXXXXX)
trap '/bin/rm -rf "$temporaryDirectory"' EXIT
trap 'exit 2' HUP INT TERM
/bin/cp "$scriptDirectory/runtimeInstaller" "$temporaryDirectory/runtimeInstaller"
/bin/cp "$scriptDirectory/runtimeInfo.json" "$temporaryDirectory/runtimeInfo.json"
/bin/chmod 755 "$temporaryDirectory" "$temporaryDirectory/runtimeInstaller"
/bin/chmod 644 "$temporaryDirectory/runtimeInfo.json"
/bin/launchctl asuser "$consoleUid" /usr/bin/sudo -H -u "$consoleUser" -- "$temporaryDirectory/runtimeInstaller" --prepare-runtime "$temporaryDirectory" "$$"
`, { mode: 0o755 });
    const componentsPath = join(stagingDir, "components.plist");
    await run(["/usr/bin/pkgbuild", "--analyze", "--root", applicationDir, componentsPath]);
    await run(["/usr/bin/plutil", "-convert", "json", componentsPath]);
    const components = await file(componentsPath).json() as { RootRelativeBundlePath: string; BundleIsRelocatable?: boolean; BundlePreInstallScriptPath?: string; BundleInstallScriptTimeout?: number }[];
    const application = components.find(item => item.RootRelativeBundlePath === appName);
    if (!application) throw new Error("PKG 组件清单缺少 Toonflow 应用。");
    application.BundleIsRelocatable = false;
    application.BundlePreInstallScriptPath = "prepareRuntime";
    application.BundleInstallScriptTimeout = 3600;
    writeAtomicSync(componentsPath, JSON.stringify(components));
    await run(["/usr/bin/plutil", "-convert", "xml1", componentsPath]);
    component = join(stagingDir, "toonflow.pkg");
    await run(["/usr/bin/pkgbuild", "--root", applicationDir, "--component-plist", componentsPath, "--scripts", scriptsDir,
      "--identifier", desktopConfig.app.identifier, "--version", version, "--install-location", "/Applications",
      "--compression", "latest", "--min-os-version", "14.0", component]);
  }
  // ACT: 直接使用系统 Installer 的继续、安装、完成向导，不再生成拖拽 DMG 或兼容脚本。
  await run(["/usr/bin/productbuild", "--identifier", `${desktopConfig.app.identifier}.installer`, "--version", version,
    ...(component ? ["--package", component] : ["--component", appPath, "/Applications"]),
    ...(signed ? ["--sign", installerIdentity!, "--timestamp"] : []), output]);
  if (signed) {
    await run(["/usr/sbin/pkgutil", "--check-signature", output]);
    if (process.env.ELECTROBUN_SKIP_NOTARIZATION !== "1") {
      const { ELECTROBUN_APPLEAPIISSUER: issuer, ELECTROBUN_APPLEAPIKEY: keyId, ELECTROBUN_APPLEAPIKEYPATH: key,
        ELECTROBUN_APPLEID: appleId, ELECTROBUN_APPLEIDPASS: password, ELECTROBUN_TEAMID: teamId } = process.env;
      const credentials = issuer && keyId && key ? ["--key", key, "--key-id", keyId, "--issuer", issuer]
        : appleId && password && teamId ? ["--apple-id", appleId, "--password", password, "--team-id", teamId] : undefined;
      if (!credentials) throw new Error("macOS 安装包缺少现有 Apple 公证凭据。");
      const submission = Bun.spawn(["xcrun", "notarytool", "submit", output, ...credentials, "--wait", "--output-format", "json"], {
        stdin: "ignore", stdout: "pipe", stderr: "inherit", timeout: 1800000,
      });
      const [code, response] = await Promise.all([submission.exited, new Response(submission.stdout).text()]);
      if (code !== 0 || JSON.parse(response).status !== "Accepted") throw new Error("Apple 未接受 macOS 安装包的公证。");
      await run(["xcrun", "stapler", "staple", output]);
      await run(["xcrun", "stapler", "validate", output]);
    }
  }
  renameSync(output, join(artifactDir, outputName));
  // 清理本仓库旧构建生成的拖拽镜像与 hdiutil 包装器。
  rmSync(join(artifactDir, `macos-${process.arch}-${desktopConfig.app.name.replace(/ /g, "")}.dmg`), { force: true });
  rmSync(resolve(projectDir, "build/desktop/macTools"), { recursive: true, force: true });
  console.log(`macOS 安装向导：${join(artifactDir, outputName)}`);
} finally {
  rmSync(stagingDir, { recursive: true, force: true });
}
