import { $ } from "bun";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, realpathSync, renameSync, rmSync } from "node:fs";
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
const runningChecker = join(nsisDir, "checkRunning.exe");

mkdirSync(webViewDir, { recursive: true });

const dependencies = await Bun.file(".hutch/dependencies.lock").json();
const electrobun = dependencies.objects.find(
  (item: { type: string; platform: string }) => item.type === "electrobun" && item.platform === "windows-x64"
);
const hutchHome = process.env.HUTCH_HOME ?? join(homedir(), ".hutch");
copyFileSync(join(hutchHome, electrobun.relativeRoot, "WebView2Loader.dll"), loader);

await $`${csc} /nologo /target:exe /platform:x64 /optimize+ /out:${join(webViewDir, "checkWebView2.exe")} ${join(installerDir, "checkWebView2.cs")}`;
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
foreach ($file in @(${quotePowerShell(loader)}, ${quotePowerShell(temporary ?? bootstrapper)})) {
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
  const manifest = await Bun.file(join(artifactDir, "stable-win-x64-update.json")).json();
  // ACT: 平台、通道和 Hash 由本机 SDK 生成，只检查独立打包时容易遗留的旧版本。
  if (manifest.version !== desktopConfig.app.version) throw new Error("构建产物版本不一致，请重新构建。");
  // ACT: NSIS 仅打包原始 tar，安装时释放应用并保留它作为增量更新基线。
  const archive = await Bun.file(join(artifactDir, manifest.artifact.file)).arrayBuffer();
  await Bun.write(tarFile, Bun.zstdDecompressSync(archive));
  await $`${makensis} /INPUTCHARSET UTF8 /DwebView2Dir=${webViewDir} /DrunningChecker=${runningChecker} /DappIcon=${appIcon} /DappVersion=${
    desktopConfig.app.version
  } /DappIdentifier=${desktopConfig.app.identifier} /DappTar=${tarFile} /DappHash=${manifest.hash} /DoutputFile=${outputFile} ${join(installerDir, "installer.nsi")}`;
  console.log(`NSIS 安装包：${outputFile}`);
} finally {
  if (dirname(realpathSync(stagingDir)) !== realpathSync(nsisDir)) throw new Error("拒绝清理暂存目录以外的路径。");
  rmSync(stagingDir, { recursive: true });
}
