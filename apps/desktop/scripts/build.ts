import { $ } from "bun";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

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
  // ACT: 本地测试默认 ad-hoc 签名；正式签名身份可通过环境变量覆盖，公证仍需另行配置。
  $.env({ ...process.env, ELECTROBUN_DEVELOPER_ID: process.env.ELECTROBUN_DEVELOPER_ID || "-" });
  const startupTarget = isIntelMac ? "macX64" : "macArm64";
  for (const name of ["libthorvg.dylib", "nativeSplash.dylib"]) {
    if (!existsSync(resolve(projectDir, "packages/startup/assets", startupTarget, name))) {
      throw new Error("缺少当前架构的 macOS 启动库，请先运行 bun packages/startup/scripts/buildMac.ts，再重新构建桌面应用。");
    }
  }
}
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
  mkdirSync(protocolDir, { recursive: true });
  await $`${csc} /nologo /target:winexe /platform:x64 /optimize+ /reference:System.Windows.Forms.dll /reference:System.Web.Extensions.dll /out:${resolve(protocolDir, "protocolLauncher.exe")} ${resolve(projectDir, "apps/desktop/native/protocolLauncher.cs")}`;
  await $`${csc} /nologo /target:winexe /platform:x64 /optimize+ /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /out:${resolve(protocolDir, "saveFileDialog.exe")} ${resolve(projectDir, "apps/desktop/native/saveFileDialog.cs")}`;
  await $`${csc} /nologo /target:winexe /platform:x64 /optimize+ /reference:System.Web.Extensions.dll /reference:System.Windows.Forms.dll /reference:Microsoft.CSharp.dll /out:${resolve(protocolDir, "updateHelper.exe")} ${resolve(projectDir, "apps/desktop/native/updateHelper.cs")}`;
}
// ACT: 团队暂不打包；恢复时也在 package.json 的 dev:plugins 中加回 --filter './packages/teams/*'。
for (const script of mode === "dev" ? ["dev:plugins"] : [
  "build:tools",
  "build:nodes",
  // "build:teams",
]) {
  await $`${process.execPath} run ${script}`.cwd(projectDir);
}
await $`${process.execPath} run --filter @toonflow/web build`.cwd(projectDir);
await $`${process.execPath} run --filter @toonflow/mcp build`.cwd(projectDir);
if (isIntelMac) {
  // ACT: 共用插件和 Web 构建；Intel Mac 仅将 SDK 适配交给独立的 1.18.1。
  await $`${process.execPath} ${resolve(projectDir, "compat/macIntel/build.ts")} ${mode === "package" ? "build" : mode}`.cwd(projectDir);
  process.exit(0);
}
const cli = resolve(projectDir, "apps/desktop/node_modules/electrobun/bin/electrobun.cjs");
await $`${process.execPath} ${cli} ${mode === "dev" ? "dev" : "build"} ${mode === "dev" ? [] : ["--env=stable"]}`.cwd(projectDir);
if (mode === "package" && !isMac) {
  await $`${process.execPath} ${resolve(import.meta.dir, "packageWindows.ts")}`.cwd(projectDir);
}
