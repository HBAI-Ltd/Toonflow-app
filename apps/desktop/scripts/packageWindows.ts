import { $ } from "bun";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, realpathSync, renameSync, rmSync } from "@toonflow/file";
import { file, write } from "@toonflow/file/bun";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import desktopConfig from "../../../electrobun.config";
import signWindows from "./signWindows";

if (process.platform !== "win32" || !["x64", "arm64"].includes(process.arch)) {
  throw new Error("NSIS 打包需要 Windows x64/arm64 环境。");
}

const projectDir = realpathSync(resolve(import.meta.dirname, "../../.."));
process.chdir(projectDir);
const nsisDir = resolve("build/desktop/nsis");
const artifactDir = resolve(desktopConfig.build.artifactFolder);
const installerName = `toonflow-${desktopConfig.app.version}${process.arch === "arm64" ? "-win-arm64" : ""}-Setup.exe`;
const outputFile = join(artifactDir, installerName);
const installerDir = resolve("apps/desktop/installer");
const appIcon = resolve("packages/assets/logo.ico");
const makensis = process.env.NSIS_PATH ?? "C:/Program Files (x86)/NSIS/makensis.exe";
const csc = join(process.env.WINDIR!, "Microsoft.NET/Framework64/v4.0.30319/csc.exe");
const helperPlatform = `/platform:${process.arch === "arm64" ? "anycpu" : "x64"}`;
const webViewDir = join(nsisDir, "webview2");
const bootstrapper = join(webViewDir, "MicrosoftEdgeWebview2Setup.exe");
const loader = join(webViewDir, "WebView2Loader.dll");
const webViewSdkVersion = "1.0.4191.47";
const webViewSdkDir = join(nsisDir, `webViewSdk${webViewSdkVersion}`);
const webViewCore = join(webViewDir, "Microsoft.Web.WebView2.Core.dll");
const runningChecker = join(nsisDir, "checkRunning.exe");
const assemblyInfo = resolve("build/desktop/protocol/assemblyInfo.cs");
const initializeInstallScript = join(nsisDir, "initializeInstall.js");
const quotePowerShell = (value: string) => `'${value.replaceAll("'", "''")}'`;
const manifest = await file(join(artifactDir, `stable-win-${process.arch}-update.json`)).json();
if (manifest.version !== desktopConfig.app.version || manifest.platform !== "win" || manifest.arch !== process.arch) {
  throw new Error("构建产物版本或架构不一致，请重新构建。");
}
const assemblySource = await file(assemblyInfo).text();
if (!["AssemblyVersion", "AssemblyFileVersion"].every(name => assemblySource.includes(`[assembly: ${name}("${manifest.version}.0")]`))
    || !assemblySource.includes(`[assembly: AssemblyInformationalVersion("${manifest.version}")]`)) {
  throw new Error("Windows 版本信息与更新归档不一致，请重新运行 package:desktop。");
}

mkdirSync(webViewDir, { recursive: true });
const stagingDir = mkdtempSync(join(nsisDir, "payload"));
const tarFile = join(stagingDir, "app.tar");
const installerTar = join(stagingDir, "installerPayload.tar");
const updateHelper = join(stagingDir, "updateHelper.exe");
const runtimeDownloader = join(stagingDir, "runtimeDownloader.exe");
const stagedOutputFile = join(stagingDir, installerName);
try {
  const archive = await file(join(artifactDir, manifest.artifact.file)).arrayBuffer();
  await write(tarFile, Bun.zstdDecompressSync(archive));
  const { stdout: archiveListing } = await $`tar.exe -tf ${tarFile}`.quiet();
  const archiveEntries = archiveListing.toString().split(/\r?\n/).filter(Boolean);
  const runtimeMember = `${desktopConfig.app.name.replace(/\s/g, "")}/bin/bun.exe`;
  if (archiveEntries.filter(name => name === runtimeMember).length !== 1) {
    throw new Error("SDK 更新归档必须包含且仅包含一份目标 Bun，请重新运行 package:desktop。");
  }
  // ACT: 旧客户端更新助手只有 120 秒启动预算，更新归档仍保留 Bun；仅 NSIS 排除运行时。
  // bsdtar 的 @archive 直接转存成员，避免在构建目录展开应用或修改 SDK 的 Hash 和增量基线。
  await $`tar.exe -cf ${installerTar} --exclude ${runtimeMember} ${`@${tarFile}`}`.quiet();
  const { stdout: installerListing } = await $`tar.exe -tf ${installerTar}`.quiet();
  const installerEntries = installerListing.toString().split(/\r?\n/).filter(Boolean);
  if (installerEntries.some(name => /(?:^|\/)bun\.exe$/i.test(name))
    || installerEntries.sort().join("\n") !== archiveEntries.filter(name => name !== runtimeMember).sort().join("\n")) {
    throw new Error("安装归档成员不一致，必须仅移除 Bun 并保留其他应用文件。");
  }
  // ACT: 安装器使用归档中的同一份助手；只读取指定成员的字节，不解压归档路径或链接。
  const helpers = ["startupLauncher.exe", "protocolLauncher.exe", "saveFileDialog.exe", "updateHelper.exe", "runtimeDownloader.exe"];
  for (const name of helpers) {
    const member = `${desktopConfig.app.name.replace(/\s/g, "")}/Resources/app/${name}`;
    const { stdout } = await $`tar.exe -xOf ${tarFile} ${member}`.quiet();
    await write(join(stagingDir, name), stdout);
  }
  await $`powershell.exe -NoProfile -NonInteractive -Command ${`
$ErrorActionPreference = 'Stop'
Import-Module "$PSHOME/Modules/Microsoft.PowerShell.Security/Microsoft.PowerShell.Security.psd1"
foreach ($path in @(${helpers.map(name => quotePowerShell(join(stagingDir, name))).join(", ")})) {
  $info = [System.Diagnostics.FileVersionInfo]::GetVersionInfo($path)
  if ($info.ProductVersion -ne ${quotePowerShell(manifest.version)} -or [Version]$info.FileVersion -ne [Version]${quotePowerShell(`${manifest.version}.0`)}) {
    throw "Archived helper version mismatch; rebuild with package:desktop: $path"
  }
  if (${process.env.windowsSigningThumbprint === undefined ? "$false" : "$true"}) {
    $signature = Get-AuthenticodeSignature -LiteralPath $path
    if ($signature.Status -ne 'Valid' -or !$signature.TimeStamperCertificate -or $signature.SignerCertificate.Thumbprint -ne ${quotePowerShell(process.env.windowsSigningThumbprint?.trim() ?? "")}) {
      throw "Archived helper signature mismatch; rebuild with package:desktop: $path"
    }
  }
}`}`;
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
    (item: { type: string; platform: string }) => item.type === "electrobun" && item.platform === `windows-${process.arch}`
  );
  if (!electrobun) throw new Error(`缺少 Windows ${process.arch} 的 Electrobun 原生依赖记录。`);
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
  await $`${csc} /nologo /target:exe ${helperPlatform} /optimize+ /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:${webViewCore} /out:${join(webViewDir, "checkWebView2.exe")} ${assemblyInfo} ${join(installerDir, "checkWebView2.cs")}`;
  await $`${csc} /nologo /target:exe ${helperPlatform} /optimize+ /out:${runningChecker} ${assemblyInfo} ${join(installerDir, "checkRunning.cs")}`;
  await signWindows([join(webViewDir, "checkWebView2.exe"), runningChecker]);
  // ACT: 每次打包刷新微软引导器，验签通过后才替换旧文件，避免长期沿用旧版组件。
  // ACT: 官方短链不可达时，可显式传入它当前重定向的微软 CDN 地址；不关闭 TLS 或复用旧缓存。
  let bootstrapperUrl = new URL(process.env.webView2BootstrapperUrl || "https://go.microsoft.com/fwlink/p/?LinkId=2124703");
  const temporary = `${bootstrapper}.tmp.exe`;
  try {
    const signal = AbortSignal.timeout(120000);
    for (let redirects = 0; ; redirects++) {
      if (bootstrapperUrl.protocol !== "https:" || bootstrapperUrl.username || bootstrapperUrl.password ||
        !["go.microsoft.com", "msedge.sf.dl.delivery.mp.microsoft.com"].includes(bootstrapperUrl.hostname)) {
        throw new Error("WebView2 引导器下载地址必须是微软官方 HTTPS 短链或 CDN 地址。");
      }
      const response = await fetch(bootstrapperUrl, { signal, redirect: "manual" });
      if (response.status >= 300 && response.status < 400) {
        await response.body?.cancel();
        const location = response.headers.get("location");
        if (!location || redirects >= 5) throw new Error("WebView2 引导器下载重定向无效或次数过多。");
        bootstrapperUrl = new URL(location, bootstrapperUrl);
        continue;
      }
      if (!response.ok) throw new Error(`WebView2 引导器下载失败：HTTP ${response.status}`);
      if (!response.body) throw new Error("WebView2 引导器下载内容为空。");
      const chunks: Uint8Array[] = [];
      let size = 0;
      for await (const chunk of response.body) {
        size += chunk.byteLength;
        if (size > 16 * 1024 * 1024) throw new Error("WebView2 引导器超过 16 MiB 下载上限。");
        chunks.push(chunk);
      }
      if (!size) throw new Error("WebView2 引导器下载内容为空。");
      await write(temporary, Buffer.concat(chunks, size));
      break;
    }
    await $`powershell.exe -NoProfile -NonInteractive -Command ${`
  $ErrorActionPreference = 'Stop'
  Import-Module "$PSHOME/Modules/Microsoft.PowerShell.Security/Microsoft.PowerShell.Security.psd1"
  foreach ($file in @(${quotePowerShell(loader)}, ${quotePowerShell(webViewCore)}, ${quotePowerShell(temporary)})) {
    $signature = Get-AuthenticodeSignature -LiteralPath $file
    if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'O=Microsoft Corporation') {
      throw "Microsoft signature verification failed: $file"
    }
  }`}`;
    renameSync(temporary, bootstrapper);
  } finally {
    rmSync(temporary, { force: true });
  }

  const signingArgs = process.env.windowsSigningThumbprint?.trim()
    ? [`/DwindowsSignCommand="${process.execPath}" "${join(import.meta.dirname, "signWindows.ts")}"`]
    : [];
  await $`${makensis} /INPUTCHARSET UTF8 ${signingArgs} /DwebView2Dir=${webViewDir} /DrunningChecker=${runningChecker} /DupdateHelper=${updateHelper} /DruntimeDownloader=${runtimeDownloader} /DappIcon=${appIcon} /DappVersion=${
    desktopConfig.app.version
  } /DappArch=${process.arch} /DappIdentifier=${desktopConfig.app.identifier} /DappTar=${installerTar} /DappHash=${manifest.hash} /DoutputFile=${stagedOutputFile} /DinitializeInstallScript=${initializeInstallScript} ${join(installerDir, "installer.nsi")}`;
  await signWindows([stagedOutputFile]);
  renameSync(stagedOutputFile, outputFile);
  console.log(`NSIS 安装包：${outputFile}`);
} finally {
  if (dirname(realpathSync(stagingDir)) !== realpathSync(nsisDir)) throw new Error("拒绝清理暂存目录以外的路径。");
  rmSync(stagingDir, { recursive: true });
}
