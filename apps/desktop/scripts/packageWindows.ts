import { $ } from "bun";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, realpathSync, renameSync, rmSync } from "@toonflow/file";
import { file, write } from "@toonflow/file/bun";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import desktopConfig from "../../../electrobun.config";

if (process.platform !== "win32" || process.arch !== "x64") {
  throw new Error("NSIS 打包需要 Windows x64 环境。");
}

const projectDir = realpathSync(resolve(import.meta.dirname, "../../.."));
process.chdir(projectDir);
const nsisDir = resolve("build/desktop/nsis");
const artifactDir = resolve(desktopConfig.build.artifactFolder);
const outputFile = join(artifactDir, `toonflow-${desktopConfig.app.version}-Setup.exe`);
const installerDir = resolve("apps/desktop/installer");
const appIcon = resolve("packages/assets/logo.ico");
const makensis = process.env.NSIS_PATH ?? "C:/Program Files (x86)/NSIS/makensis.exe";
const csc = join(process.env.WINDIR!, "Microsoft.NET/Framework64/v4.0.30319/csc.exe");
const webViewDir = join(nsisDir, "webview2");
const bootstrapper = join(webViewDir, "MicrosoftEdgeWebview2Setup.exe");
const loader = join(webViewDir, "WebView2Loader.dll");
const webViewSdkVersion = "1.0.4191.47";
const webViewSdkDir = join(nsisDir, `webViewSdk${webViewSdkVersion}`);
const webViewCore = join(webViewDir, "Microsoft.Web.WebView2.Core.dll");
const runningChecker = join(nsisDir, "checkRunning.exe");
const initializeInstallScript = join(nsisDir, "initializeInstall.js");

mkdirSync(webViewDir, { recursive: true });
// ACT: 安装脚本在临时目录执行，先打包文件层依赖，避免依赖开发目录的 node_modules。
const initializeInstallBuild = await Bun.build({
  entrypoints: [join(installerDir, "initializeInstall.ts")],
  outdir: nsisDir,
  target: "bun",
  minify: true,
});
if (!initializeInstallBuild.success) throw new AggregateError(initializeInstallBuild.logs, "安装初始化脚本构建失败。");

const dependencies = await file(".hutch/dependencies.lock").json();
const electrobun = dependencies.objects.find(
  (item: { type: string; platform: string }) => item.type === "electrobun" && item.platform === "windows-x64"
);
const hutchHome = process.env.HUTCH_HOME ?? join(homedir(), ".hutch");
copyFileSync(join(hutchHome, electrobun.relativeRoot, "WebView2Loader.dll"), loader);

// 实际启动检测使用微软 SDK 的 Core 程序集，避免手写 COM 接口；仅随安装器释放。
const sdkCore = join(webViewSdkDir, "lib/net462/Microsoft.Web.WebView2.Core.dll");
const sdkLicense = join(webViewSdkDir, "LICENSE.txt");
const sdkNotice = join(webViewSdkDir, "NOTICE.txt");
if (![sdkCore, sdkLicense, sdkNotice].every(existsSync)) {
  mkdirSync(webViewSdkDir, { recursive: true });
  const sdkArchive = join(webViewSdkDir, "webViewSdk.nupkg");
  try {
    await $`curl.exe --fail --location --max-time 120 --output ${sdkArchive} https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/${webViewSdkVersion}/microsoft.web.webview2.${webViewSdkVersion}.nupkg`;
    await $`tar.exe -xf ${sdkArchive} -C ${webViewSdkDir} lib/net462/Microsoft.Web.WebView2.Core.dll LICENSE.txt NOTICE.txt`;
  } catch (error) {
    rmSync(sdkCore, { force: true });
    throw error;
  } finally {
    rmSync(sdkArchive, { force: true });
  }
}
copyFileSync(sdkCore, webViewCore);
copyFileSync(sdkLicense, join(webViewDir, "webView2SdkLicense.txt"));
copyFileSync(sdkNotice, join(webViewDir, "webView2SdkNotice.txt"));
await $`${csc} /nologo /target:exe /platform:x64 /optimize+ /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:${webViewCore} /out:${join(webViewDir, "checkWebView2.exe")} ${join(installerDir, "checkWebView2.cs")}`;
await $`${csc} /nologo /target:exe /platform:x64 /optimize+ /out:${runningChecker} ${join(installerDir, "checkRunning.cs")}`;
const quotePowerShell = (value: string) => `'${value.replaceAll("'", "''")}'`;
const temporary = existsSync(bootstrapper) ? null : `${bootstrapper}.tmp.exe`;
try {
  if (temporary) {
    await $`curl.exe --fail --location --max-time 120 --output ${temporary} https://go.microsoft.com/fwlink/p/?LinkId=2124703`;
  }
  await $`powershell.exe -NoProfile -NonInteractive -Command ${`
$ErrorActionPreference = 'Stop'
Import-Module "$PSHOME/Modules/Microsoft.PowerShell.Security/Microsoft.PowerShell.Security.psd1"
foreach ($file in @(${quotePowerShell(loader)}, ${quotePowerShell(webViewCore)}, ${quotePowerShell(temporary ?? bootstrapper)})) {
  $signature = Get-AuthenticodeSignature -LiteralPath $file
  if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'O=Microsoft Corporation') {
    throw "Microsoft signature verification failed: $file"
  }
}`}`;
  if (temporary) renameSync(temporary, bootstrapper);
} finally {
  if (temporary) rmSync(temporary, { force: true });
}

const stagingDir = mkdtempSync(join(nsisDir, "payload"));
const tarFile = join(stagingDir, "app.tar");
try {
  const manifest = await file(join(artifactDir, "stable-win-x64-update.json")).json();
  // ACT: 平台、通道和 Hash 由本机 SDK 生成，只检查独立打包时容易遗留的旧版本。
  if (manifest.version !== desktopConfig.app.version) throw new Error("构建产物版本不一致，请重新构建。");
  // ACT: NSIS 仅打包原始 tar，安装时释放应用并保留它作为增量更新基线。
  const archive = await file(join(artifactDir, manifest.artifact.file)).arrayBuffer();
  await write(tarFile, Bun.zstdDecompressSync(archive));
  await $`${makensis} /INPUTCHARSET UTF8 /DwebView2Dir=${webViewDir} /DrunningChecker=${runningChecker} /DappIcon=${appIcon} /DappVersion=${
    desktopConfig.app.version
  } /DappIdentifier=${desktopConfig.app.identifier} /DappTar=${tarFile} /DappHash=${manifest.hash} /DoutputFile=${outputFile} /DinitializeInstallScript=${initializeInstallScript} ${join(installerDir, "installer.nsi")}`;
  console.log(`NSIS 安装包：${outputFile}`);
} finally {
  if (dirname(realpathSync(stagingDir)) !== realpathSync(nsisDir)) throw new Error("拒绝清理暂存目录以外的路径。");
  rmSync(stagingDir, { recursive: true });
}
