import { $ } from "bun";
import { cpSync, existsSync, mkdirSync, readdirSync, realpathSync, rmSync, writeAtomicSync } from "@toonflow/file";
import { dirname, resolve } from "node:path";
import copyDocumentPackages from "../../server/scripts/copyDocumentPackages";
import copySandboxPackages from "../../server/scripts/copySandboxPackages";
import signWindows from "./signWindows";
import desktopConfig from "../../../electrobun.config";
import prepareRuntime from "./prepareRuntime";
import prepareMacRuntime from "./prepareMacRuntime";

const projectDir = resolve(import.meta.dir, "../../..");
const mode = process.argv[2];
if (process.argv.length !== 3 || !["build", "dev", "typecheck", "package"].includes(mode!)) {
  throw new Error("用法：bun apps/desktop/scripts/build.ts <build|dev|typecheck|package>");
}
const isMac = process.platform === "darwin";
const isWindows = process.platform === "win32";
// ACT: typecheck 只读取当前源码和已有 SDK 文件，不安装依赖或生成文件。
if (mode === "typecheck") {
  await $`${process.execPath} run tsc --project apps/desktop/tsconfig.json`.cwd(projectDir);
  process.exit(0);
}
if (!["darwin", "win32", "linux"].includes(process.platform) || !["x64", "arm64"].includes(process.arch)) {
  throw new Error("桌面构建需要 Windows、macOS 或 Linux 的 x64/arm64 环境。");
}
if (mode === "dev") process.env.TOONFLOW_DATA_DIR = resolve(projectDir, "data");
if (isMac) {
  const startupTarget = process.arch === "x64" ? "macX64" : "macArm64";
  for (const name of ["libthorvg.dylib", "nativeSplash.dylib"]) {
    if (!existsSync(resolve(projectDir, "packages/startup/assets", startupTarget, name))) {
      throw new Error("缺少当前架构的 macOS 启动库，请先运行 bun packages/startup/scripts/buildMac.ts，再重新构建桌面应用。");
    }
  }
}
const ffmpegBuild = await Bun.build({
  entrypoints: [resolve(projectDir, "packages/ffmpeg/src/ffmpegWorker.ts")],
  outdir: resolve(projectDir, "build/desktop/ffmpeg"),
  target: "bun",
  minify: true,
});
if (!ffmpegBuild.success) throw new AggregateError(ffmpegBuild.logs, "FFmpeg 执行线程构建失败。");
const sandboxBuild = await Bun.build({
  entrypoints: [resolve(projectDir, "packages/tools/sandbox/src/sandboxProcess.ts")],
  outdir: resolve(projectDir, "build/desktop/sandbox"),
  target: "bun",
  minify: true,
  external: ["just-bash"],
});
if (!sandboxBuild.success) throw new AggregateError(sandboxBuild.logs, "沙盒执行进程构建失败。");
if (process.platform === "linux") {
  const launcherBuild = await Bun.build({
    entrypoints: [resolve(projectDir, "apps/desktop/src/linuxLauncher.ts")],
    outdir: resolve(projectDir, "build/desktop/linux"),
    target: "bun",
    minify: true,
  });
  if (!launcherBuild.success) throw new AggregateError(launcherBuild.logs, "Linux 启动器构建失败。");
}
if (isWindows && process.arch === "x64") {
  const startupBuild = await Bun.build({
    entrypoints: [resolve(projectDir, "packages/startup/src/windowsSplashWorker.ts")],
    outdir: resolve(projectDir, "build/desktop/startup"),
    target: "bun",
    minify: true,
  });
  if (!startupBuild.success) throw new AggregateError(startupBuild.logs, "启动动画线程构建失败。");
}
if (isWindows) {
  const protocolDir = resolve(projectDir, "build/desktop/protocol");
  const csc = resolve(process.env.WINDIR!, "Microsoft.NET/Framework64/v4.0.30319/csc.exe");
  // ACT: .NET Framework 4.8.1 的 AnyCPU 助手在 ARM64 原生运行，安装器检查该运行时。
  const helperPlatform = `/platform:${process.arch === "arm64" ? "anycpu" : "x64"}`;
  const version = desktopConfig.app.version;
  if (!/^\d+\.\d+\.\d+$/.test(version) || version.split(".").some(part => Number(part) > 65534)) {
    throw new Error("Windows 版本号必须为 X.Y.Z，每段不超过 65534。");
  }
  mkdirSync(protocolDir, { recursive: true });
  const assemblyInfo = resolve(protocolDir, "assemblyInfo.cs");
  writeAtomicSync(assemblyInfo, [
    "using System.Reflection;",
    '[assembly: AssemblyTitle("Toonflow")]',
    '[assembly: AssemblyProduct("Toonflow")]',
    '[assembly: AssemblyCompany("HBAI-Ltd")]',
    '[assembly: AssemblyDescription("Toonflow desktop component")]',
    '[assembly: AssemblyCopyright("Copyright (c) HBAI-Ltd")]',
    `[assembly: AssemblyVersion("${version}.0")]`,
    `[assembly: AssemblyFileVersion("${version}.0")]`,
    `[assembly: AssemblyInformationalVersion("${version}")]`,
    "",
  ].join("\n"));
  await prepareRuntime();
  await $`${csc} /nologo /target:winexe ${helperPlatform} /optimize+ /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll /out:${resolve(protocolDir, "runtimeDownloader.exe")} ${assemblyInfo} ${resolve(projectDir, "build/desktop/runtime/runtimeConfig.cs")} ${resolve(projectDir, "apps/desktop/native/runtimeDownloader.cs")}`;
  await $`${csc} /nologo /target:winexe ${helperPlatform} /optimize+ /reference:System.Windows.Forms.dll /out:${resolve(protocolDir, "startupLauncher.exe")} ${assemblyInfo} ${resolve(projectDir, "apps/desktop/native/startupLauncher.cs")}`;
  await $`${csc} /nologo /target:winexe ${helperPlatform} /optimize+ /reference:System.Windows.Forms.dll /reference:System.Web.Extensions.dll /out:${resolve(protocolDir, "protocolLauncher.exe")} ${assemblyInfo} ${resolve(projectDir, "apps/desktop/native/protocolLauncher.cs")}`;
  await $`${csc} /nologo /target:winexe ${helperPlatform} /optimize+ /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /out:${resolve(protocolDir, "saveFileDialog.exe")} ${assemblyInfo} ${resolve(projectDir, "apps/desktop/native/saveFileDialog.cs")}`;
  await $`${csc} /nologo /target:winexe ${helperPlatform} /optimize+ /reference:System.Web.Extensions.dll /reference:System.Windows.Forms.dll /reference:Microsoft.CSharp.dll /out:${resolve(protocolDir, "updateHelper.exe")} ${assemblyInfo} ${resolve(projectDir, "apps/desktop/native/updateHelper.cs")}`;
  // ACT: 在 SDK 生成归档、Hash 和增量补丁前签名，避免签名后破坏更新基线。
  if (mode !== "dev") {
    await signWindows(["startupLauncher.exe", "protocolLauncher.exe", "saveFileDialog.exe", "updateHelper.exe", "runtimeDownloader.exe"].map(name => resolve(protocolDir, name)));
  }
}
// ACT: 开发套件随插件内置，清理旧版宿主 SDK 缓存，不改动已安装的用户工具。
rmSync(resolve(projectDir, "build/desktop/pluginSdk"), { recursive: true, force: true });
// ACT: 团队暂不打包；恢复时也在 package.json 的 dev:plugins 中加回 --filter './packages/teams/*'。
if (mode === "dev") {
  await $`${process.execPath} run dev:plugins`.cwd(projectDir);
} else {
  // ACT: Bun 1.4.3 的 --filter 在 Linux 误读小驼峰工作区；修复前按实际目录构建。
  for (const group of ["tools", "nodes", "ext"]) {
    const groupDirectory = resolve(projectDir, "packages", group);
    rmSync(resolve(projectDir, "build", group), { recursive: true, force: true });
    for (const entry of readdirSync(groupDirectory, { withFileTypes: true })) {
      if (!entry.isDirectory() || !existsSync(resolve(groupDirectory, entry.name, "package.json"))) continue;
      await $`${process.execPath} run build`
        .cwd(resolve(groupDirectory, entry.name))
        .env({ ...process.env, NODE_ENV: "production" });
    }
  }
}
await $`${process.execPath} run build`.cwd(resolve(projectDir, "apps/web"));
await $`${process.execPath} run build`.cwd(resolve(projectDir, "packages/mcp"));
const agentDirectory = dirname(realpathSync(Bun.resolveSync("@earendil-works/pi-coding-agent", resolve(projectDir, "apps/server"))));
const photonDirectory = dirname(Bun.resolveSync("@silvia-odwyer/photon-node", agentDirectory));
const photonOutput = resolve(projectDir, "build/desktop/photon");
rmSync(photonOutput, { recursive: true, force: true });
cpSync(photonDirectory, photonOutput, { recursive: true });
await copyDocumentPackages(resolve(projectDir, "build/desktop/node_modules"));
await copySandboxPackages(resolve(projectDir, "build/desktop/node_modules"));
const cli = resolve(projectDir, "apps/desktop/node_modules/electrobun/bin/electrobun.cjs");
if (isMac && mode !== "dev") {
  // ACT: 外置 Bun 的 macOS Bundle 身份尚待实机验证，正式构建继续内置；显式开启仅用于验证精简安装包。
  if (process.env.TOONFLOW_EXTERNAL_RUNTIME === "1") await prepareMacRuntime();
}
// ACT: SDK 调用 Windows PowerShell 压缩产物，避免继承 PowerShell 7 的同名模块。
const buildEnv = { ...process.env };
if (isWindows && mode !== "dev") buildEnv.PSModulePath = resolve(process.env.WINDIR!, "System32/WindowsPowerShell/v1.0/Modules");
await $`${process.execPath} ${cli} ${mode === "dev" ? "dev" : "build"} ${mode === "dev" ? [] : ["--env=stable"]}`.cwd(projectDir).env(buildEnv);
if (mode === "package") {
  await $`${process.execPath} ${resolve(import.meta.dir, isMac ? "packageMac.ts" : isWindows ? "packageWindows.ts" : "packageLinux.ts")}`.cwd(projectDir).env(buildEnv);
}
