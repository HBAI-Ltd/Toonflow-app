import { lstatSync, mkdirSync, mkdtempSync, realpathSync, renameSync, rmSync, symlink } from "@toonflow/file";
import { file, write } from "@toonflow/file/bun";
import { join, resolve } from "node:path";
import desktopConfig from "../../../electrobun.config";

if (process.platform !== "darwin" || !["x64", "arm64"].includes(process.arch)) {
  throw new Error("macOS 安装包需要在 Mac x64/arm64 环境构建。");
}
// ACT: 外置运行时试验依赖 PKG 安装脚本，DMG 不改为首次启动下载；原实现保留在备份脚本中。
if (process.env.TOONFLOW_EXTERNAL_RUNTIME === "1") {
  throw new Error("DMG 暂不支持外置运行时试验；原 PKG 实现已备份至 packageMacPkg.ts，正式构建继续内置 Bun。");
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
const identity = process.env.ELECTROBUN_DEVELOPER_ID;
if (signed && !identity) throw new Error("DMG 签名缺少 ELECTROBUN_DEVELOPER_ID（Developer ID Application）。");

const stagingParent = resolve(projectDir, "build/desktop/dmg");
mkdirSync(stagingParent, { recursive: true });
const stagingDir = mkdtempSync(join(stagingParent, "payload"));
const appName = `${desktopConfig.app.name.replace(/ /g, "")}.app`;
const outputName = `toonflow-${version}-macos-${process.arch}.dmg`;
try {
  const tarPath = join(stagingDir, "app.tar");
  await write(tarPath, Bun.zstdDecompressSync(await file(join(artifactDir, archiveName)).arrayBuffer()));
  const listing = Bun.spawnSync(["/usr/bin/tar", "-tf", tarPath], { stdout: "pipe", stderr: "inherit" });
  if (listing.exitCode !== 0) throw new Error("无法读取 macOS 应用归档。");
  const members = listing.stdout.toString().trim().split("\n");
  if (members.some(name => name !== appName && !name.startsWith(`${appName}/`) || name.split("/").includes(".."))) {
    throw new Error("macOS 更新归档包含应用目录以外的路径。");
  }
  // ACT: 使用同次更新归档中已签名、公证的真正应用，不恢复旧 Intel SDK 或自解压包装器。
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

  if (signed) {
    await run(["/usr/bin/codesign", "--verify", "--deep", "--strict", "--verbose=2", appPath]);
    if (process.env.ELECTROBUN_SKIP_NOTARIZATION !== "1") await run(["xcrun", "stapler", "validate", appPath]);
  }

  await symlink("/Applications", join(applicationDir, "Applications"));
  const output = join(stagingDir, outputName);
  // ACT: 直接创建只读压缩镜像，无 Finder、挂载或卸载依赖，适用于无桌面的 CI 运行器。
  await run(["/usr/bin/hdiutil", "create", "-volname", desktopConfig.app.name, "-srcfolder", applicationDir,
    "-fs", "HFS+", "-format", "UDZO", output]);
  await run(["/usr/bin/hdiutil", "verify", output]);
  if (signed) {
    await run(["/usr/bin/codesign", "--force", "--timestamp", "--sign", identity!, output]);
    await run(["/usr/bin/codesign", "--verify", "--strict", "--verbose=2", output]);
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
  console.log(`macOS 安装镜像：${join(artifactDir, outputName)}`);
} finally {
  rmSync(stagingDir, { recursive: true, force: true });
}
