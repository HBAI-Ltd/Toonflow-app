import { $ } from "bun";
import { chmod, copyFile, mkdir, mkdtemp, realpath, rename, rm, writeAtomic } from "@toonflow/file";
import { file, write } from "@toonflow/file/bun";
import { dirname, join, resolve } from "node:path";
import desktopConfig from "../../../electrobun.config";
import prepareRuntime from "./prepareRuntime";

if (process.platform !== "linux" || !["x64", "arm64"].includes(process.arch)) {
  throw new Error("Debian 打包需要 Linux x64/arm64 环境。");
}

const projectDir = await realpath(resolve(import.meta.dirname, "../../.."));
const artifactDir = resolve(projectDir, desktopConfig.build.artifactFolder);
const stagingParent = resolve(projectDir, "build/desktop/deb");
const version = desktopConfig.app.version;
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error("Linux 版本号必须为 X.Y.Z。");
const runtime = prepareRuntime();
const prefix = `stable-linux-${process.arch}`;
const manifest = await file(join(artifactDir, `${prefix}-update.json`)).json();
if (manifest.version !== version || manifest.platform !== "linux" || manifest.arch !== process.arch
  || manifest.identifier !== desktopConfig.app.identifier || manifest.channel !== "stable") {
  throw new Error("Linux 构建产物的版本、平台或应用标识不一致，请重新构建。");
}
const archiveName = manifest.artifact?.file;
if (typeof archiveName !== "string" || !archiveName.startsWith(`${prefix}-`)
  || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.tar\.zst$/.test(archiveName)) {
  throw new Error("Linux 更新包名称无效。");
}

await mkdir(stagingParent, { recursive: true });
const stagingDir = await mkdtemp(join(stagingParent, "payload"));
const outputName = `toonflow-${version}-linux-${process.arch}.deb`;
try {
  const packageRoot = join(stagingDir, "package");
  const appRoot = join(packageRoot, "opt/toonflow");
  const controlDir = join(packageRoot, "DEBIAN");
  const binDir = join(packageRoot, "usr/bin");
  const desktopDir = join(packageRoot, "usr/share/applications");
  const iconDir = join(packageRoot, "usr/share/icons/hicolor/256x256/apps");
  for (const directory of [appRoot, controlDir, binDir, desktopDir, iconDir]) {
    await mkdir(directory, { recursive: true, mode: 0o755 });
  }
  const tarFile = join(stagingDir, "app.tar");
  await write(tarFile, Bun.zstdDecompressSync(await file(join(artifactDir, archiveName)).arrayBuffer()));
  // ACT: 安装器只使用同次构建的更新归档，避免安装包与更新清单包含不同代码。
  const appName = desktopConfig.app.name.replace(/ /g, "");
  const members = (await $`tar -tf ${tarFile}`.text()).trim().split("\n");
  if (members.some(name => name !== appName && !name.startsWith(`${appName}/`) || name.split("/").includes(".."))) {
    throw new Error("Linux 更新归档包含应用目录以外的路径。");
  }
  await $`tar --extract --file ${tarFile} --directory ${appRoot} --strip-components=1 --no-same-owner`;
  for (const name of ["bin/launcher", "bin/bun", "Resources/main.js", "Resources/app/linuxLauncher.js"]) {
    if (!await file(join(appRoot, name)).exists()) throw new Error(`Linux 应用缺少 ${name}，请重新构建。`);
  }
  const appVersion = await file(join(appRoot, "Resources/version.json")).json();
  if (appVersion.version !== version || appVersion.hash !== manifest.hash) throw new Error("Linux 应用与更新清单不一致。");
  await chmod(join(appRoot, "bin/launcher"), 0o755);
  const runtimePath = join(appRoot, "bin/bun");
  const runtimeFile = file(runtimePath);
  if (runtimeFile.size !== runtime.executableSize
    || new Bun.CryptoHasher("sha256").update(await runtimeFile.arrayBuffer()).digest("hex") !== runtime.executableSha256) {
    throw new Error("SDK 中的 Bun 与下载校验清单不一致，拒绝生成 Debian 安装包。");
  }
  // ACT: 空占位保留 dpkg 文件归属；仅 DEB 在安装时补齐 Bun，不改完整更新归档和补丁基线。
  await writeAtomic(runtimePath, "", { mode: 0o755 });
  const installer = await file(resolve(projectDir, "apps/desktop/installer/installLinuxRuntime.sh")).text();
  if (installer.split("# runtimeConfig").length !== 2) throw new Error("Linux 运行时安装脚本缺少唯一配置入口。");
  const runtimeConfig = {
    runtimeVersion: runtime.version,
    runtimeArch: runtime.arch,
    archiveSize: runtime.archiveSize,
    archiveSha256: runtime.archiveSha256,
    executableSize: runtime.executableSize,
    executableSha256: runtime.executableSha256,
    archiveMember: runtime.archiveMember,
  };
  const quoteShell = (value: string | number) => `'${String(value).replaceAll("'", "'\\''")}'`;
  const installerScript = installer.replace("# runtimeConfig", [
    ...Object.entries(runtimeConfig).map(([key, value]) => `${key}=${quoteShell(value)}`),
    `set -- ${runtime.sources.map(source => quoteShell(source.url)).join(" ")}`,
  ].join("\n"));
  for (const name of ["preinst", "postinst"]) {
    await writeAtomic(join(controlDir, name), installerScript, { mode: 0o755 });
  }

  await writeAtomic(join(binDir, "toonflow"), [
    "#!/bin/sh",
    "export TOONFLOW_INSTALL_METHOD=deb",
    'exec /opt/toonflow/bin/bun /opt/toonflow/Resources/app/linuxLauncher.js "$@"',
    "",
  ].join("\n"), { mode: 0o755 });
  await writeAtomic(join(desktopDir, "toonflow.desktop"), [
    "[Desktop Entry]", "Version=1.0", "Type=Application", "Name=Toonflow",
    "Exec=/usr/bin/toonflow %u", "Icon=toonflow", "Terminal=false", "StartupNotify=true",
    "Categories=AudioVideo;Graphics;", "MimeType=x-scheme-handler/toonflow;", "",
  ].join("\n"), { mode: 0o644 });
  await copyFile(resolve(projectDir, "packages/assets/logo.iconset/icon_256x256.png"), join(iconDir, "toonflow.png"));
  await chmod(join(iconDir, "toonflow.png"), 0o644);
  const sizeKiB = (await $`du -sk ${join(packageRoot, "opt")} ${join(packageRoot, "usr")}`.text())
    .trim().split("\n").reduce((sum, line) => sum + Number(line.split(/\s+/)[0]), 0)
    + Math.ceil(runtime.executableSize / 1024);
  await writeAtomic(join(controlDir, "control"), [
    "Package: toonflow", `Version: ${version}`, "Section: graphics", "Priority: optional",
    `Architecture: ${process.arch === "x64" ? "amd64" : "arm64"}`,
    "Maintainer: HBAI-Ltd <ltlctools@outlook.com>",
    `Installed-Size: ${sizeKiB}`,
    "Pre-Depends: ca-certificates, curl, unzip",
    "Depends: libc6 (>= 2.39), libstdc++6, libgcc-s1, libgtk-3-0t64 | libgtk-3-0, libwebkit2gtk-4.1-0, libayatana-appindicator3-1, librsvg2-2, libpipewire-0.3-0t64 | libpipewire-0.3-0, zenity, ffmpeg, util-linux, xdg-utils",
    "Homepage: https://github.com/HBAI-Ltd/Toonflow-app",
    "Description: Toonflow AI creative workspace", " Local AI workflow for scripts, images and video.", "",
  ].join("\n"), { mode: 0o644 });
  // ACT: 包管理器负责 /opt 内的程序升级；安装与卸载均不触碰用户目录中的项目和配置。
  const stagedOutput = join(stagingDir, outputName);
  await $`dpkg-deb --root-owner-group -Zxz --build ${packageRoot} ${stagedOutput}`;
  await rename(stagedOutput, join(artifactDir, outputName));
  console.log(`Debian 安装包：${join(artifactDir, outputName)}`);
} finally {
  if (dirname(await realpath(stagingDir)) !== await realpath(stagingParent)) throw new Error("拒绝清理 Debian 暂存目录以外的路径。");
  await rm(stagingDir, { recursive: true });
}
