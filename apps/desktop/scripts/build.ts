import { $ } from "bun";
import { cpSync, existsSync, mkdirSync, realpathSync, rmSync, writeAtomicSync } from "@toonflow/file";
import { dirname, resolve } from "node:path";
import copyDocumentPackages from "../../server/scripts/copyDocumentPackages";
import copySandboxPackages from "../../server/scripts/copySandboxPackages";
import prepareMacDmg from "./macDmg";
import signWindows from "./signWindows";
import desktopConfig from "../../../electrobun.config";

const projectDir = resolve(import.meta.dir, "../../..");
const mode = process.argv[2];
if (process.argv.length !== 3 || !["build", "dev", "typecheck", "package"].includes(mode!)) {
  throw new Error("用法：bun apps/desktop/scripts/build.ts <build|dev|typecheck|package>");
}
const isMac = process.platform === "darwin";
const isIntelMac = isMac && process.arch === "x64";
// ACT: typecheck 只读取当前源码和已有 SDK 文件，不安装依赖或生成文件。
if (mode === "typecheck") {
  await $`${process.execPath} run tsc --project ${isIntelMac ? "compat/macIntel/tsconfig.json" : "apps/desktop/tsconfig.json"}`.cwd(projectDir);
  process.exit(0);
}
if (!(isMac && ["x64", "arm64"].includes(process.arch)) && !(process.platform === "win32" && process.arch === "x64")) {
  throw new Error("桌面构建需要 Windows x64 或 macOS x64/arm64 环境。");
}
if (mode === "dev") process.env.TOONFLOW_DATA_DIR = resolve(projectDir, "data");
if (isMac) {
  const startupTarget = isIntelMac ? "macX64" : "macArm64";
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
if (!isMac) {
  const startupBuild = await Bun.build({
    entrypoints: [resolve(projectDir, "packages/startup/src/windowsSplashWorker.ts")],
    outdir: resolve(projectDir, "build/desktop/startup"),
    target: "bun",
    minify: true,
  });
  if (!startupBuild.success) throw new AggregateError(startupBuild.logs, "启动动画线程构建失败。");
  const protocolDir = resolve(projectDir, "build/desktop/protocol");
  const csc = resolve(process.env.WINDIR!, "Microsoft.NET/Framework64/v4.0.30319/csc.exe");
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
  await $`${csc} /nologo /target:winexe /platform:x64 /optimize+ /reference:System.Windows.Forms.dll /out:${resolve(protocolDir, "startupLauncher.exe")} ${assemblyInfo} ${resolve(projectDir, "apps/desktop/native/startupLauncher.cs")}`;
  await $`${csc} /nologo /target:winexe /platform:x64 /optimize+ /reference:System.Windows.Forms.dll /reference:System.Web.Extensions.dll /out:${resolve(protocolDir, "protocolLauncher.exe")} ${assemblyInfo} ${resolve(projectDir, "apps/desktop/native/protocolLauncher.cs")}`;
  await $`${csc} /nologo /target:winexe /platform:x64 /optimize+ /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /out:${resolve(protocolDir, "saveFileDialog.exe")} ${assemblyInfo} ${resolve(projectDir, "apps/desktop/native/saveFileDialog.cs")}`;
  await $`${csc} /nologo /target:winexe /platform:x64 /optimize+ /reference:System.Web.Extensions.dll /reference:System.Windows.Forms.dll /reference:Microsoft.CSharp.dll /out:${resolve(protocolDir, "updateHelper.exe")} ${assemblyInfo} ${resolve(projectDir, "apps/desktop/native/updateHelper.cs")}`;
  // ACT: 在 SDK 生成归档、Hash 和增量补丁前签名，避免签名后破坏更新基线。
  if (mode !== "dev") {
    await signWindows(["startupLauncher.exe", "protocolLauncher.exe", "saveFileDialog.exe", "updateHelper.exe"].map(name => resolve(protocolDir, name)));
  }
}
// ACT: 团队暂不打包；恢复时也在 package.json 的 dev:plugins 中加回 --filter './packages/teams/*'。
for (const script of mode === "dev" ? ["dev:plugins"] : [
  "build:tools",
  "build:nodes",
  "build:ext",
  // "build:teams",
]) {
  await $`${process.execPath} run ${script}`.cwd(projectDir);
}
await $`${process.execPath} run --filter @toonflow/web build`.cwd(projectDir);
await $`${process.execPath} run --filter @toonflow/mcp build`.cwd(projectDir);
const agentDirectory = dirname(realpathSync(Bun.resolveSync("@earendil-works/pi-coding-agent", resolve(projectDir, "apps/server"))));
const photonDirectory = dirname(Bun.resolveSync("@silvia-odwyer/photon-node", agentDirectory));
const photonOutput = resolve(projectDir, "build/desktop/photon");
rmSync(photonOutput, { recursive: true, force: true });
cpSync(photonDirectory, photonOutput, { recursive: true });
await copyDocumentPackages(resolve(projectDir, "build/desktop/node_modules"));
await copySandboxPackages(resolve(projectDir, "build/desktop/node_modules"));
if (isIntelMac) {
  // ACT: 共用插件和 Web 构建；Intel Mac 仅将 SDK 适配交给独立的 1.18.1。
  await $`${process.execPath} ${resolve(projectDir, "compat/macIntel/build.ts")} ${mode === "package" ? "build" : mode}`.cwd(projectDir);
  process.exit(0);
}
const cli = resolve(projectDir, "apps/desktop/node_modules/electrobun/bin/electrobun.cjs");
if (isMac && mode !== "dev") await prepareMacDmg();
// ACT: SDK 调用 Windows PowerShell 压缩产物，避免继承 PowerShell 7 的同名模块。
const buildEnv = { ...process.env };
if (!isMac && mode !== "dev") buildEnv.PSModulePath = resolve(process.env.WINDIR!, "System32/WindowsPowerShell/v1.0/Modules");
await $`${process.execPath} ${cli} ${mode === "dev" ? "dev" : "build"} ${mode === "dev" ? [] : ["--env=stable"]}`.cwd(projectDir).env(buildEnv);
if (mode === "package" && !isMac) {
  await $`${process.execPath} ${resolve(import.meta.dir, "packageWindows.ts")}`.cwd(projectDir).env(buildEnv);
}
