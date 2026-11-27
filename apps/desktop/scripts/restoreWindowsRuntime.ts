import { $ } from "bun";
import { copyFileSync, existsSync, readdirSync } from "@toonflow/file";
import { file } from "@toonflow/file/bun";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import prepareRuntime from "./prepareRuntime";

// ACT: SDK 给 bun.exe 嵌入图标会截掉官方签名并留下悬空的证书表；生成更新归档前恢复原版，与安装器下载的运行时一致。
// 取舍：进程图标回到 Bun 原版，窗口图标继续由 src/index.ts 从 app.ico 设置；有自有签名后可改为保留嵌入并重新签名。
const buildDir = process.env.ELECTROBUN_BUILD_DIR;
if (!buildDir) throw new Error("缺少 ELECTROBUN_BUILD_DIR，无法恢复 Bun 运行时。");
const targets = readdirSync(buildDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => join(buildDir, entry.name, "bin/bun.exe"))
  .filter(path => existsSync(path));
if (targets.length !== 1) throw new Error(`应用目录中的 Bun 运行时数量应为 1，实际为 ${targets.length}：${buildDir}`);

const runtime = prepareRuntime();
const source = join(process.env.HUTCH_HOME ?? join(homedir(), ".hutch"), runtime.toolchainRelativeRoot, "bun.exe");
if (new Bun.CryptoHasher("sha256").update(await file(source).arrayBuffer()).digest("hex") !== runtime.executableSha256) {
  throw new Error(`SDK 托管的 Bun 与下载校验清单不一致，已停止构建：${source}`);
}
copyFileSync(source, targets[0]!);
console.log(`已恢复官方 Bun 运行时：${targets[0]}`);

// ACT: onnxruntime.dll 直接依赖 VC++ 2015-2022 运行库，干净系统（如 Windows 沙盒）缺失时加载报错 126。
// 按微软允许的应用本地部署放在 bun.exe 同目录，由 localModelProcess.ts 在加载 ORT 前按绝对路径预加载。
// 上限：这几个 DLL 不随 Windows Update 更新，只随应用版本升级。
const vcRuntimeFiles = ["msvcp140.dll", "msvcp140_1.dll", "vcruntime140.dll", "vcruntime140_1.dll"];
const vswhere = join(process.env["ProgramFiles(x86)"]!, "Microsoft Visual Studio/Installer/vswhere.exe");
const vcComponent = `Microsoft.VisualStudio.Component.VC.Tools.${process.arch === "arm64" ? "ARM64" : "x86.x64"}`;
const vsPath = existsSync(vswhere)
  ? (await $`${vswhere} -latest -products ${"*"} -requires ${vcComponent} -property installationPath`.quiet()).stdout.toString().trim()
  : "";
const redistVersionFile = join(vsPath, "VC/Auxiliary/Build/Microsoft.VCRedistVersion.default.txt");
if (!vsPath || !existsSync(redistVersionFile)) {
  // 开发构建不要求 C++ 生成工具；制作安装包时 packageWindows.ts 会校验归档中必须包含这些文件。
  console.warn(`未找到 Visual Studio C++ 生成工具（${vcComponent}），未附带 VC++ 运行库。`);
} else {
  const redistDir = join(vsPath, "VC/Redist/MSVC", (await file(redistVersionFile).text()).trim(), process.arch === "arm64" ? "arm64" : "x64");
  const crtDirs = readdirSync(redistDir).filter(name => /^Microsoft\.VC\d+\.CRT$/.test(name));
  if (crtDirs.length !== 1) throw new Error(`VC++ 运行库目录应为 1 个，实际为 ${crtDirs.length}：${redistDir}`);
  for (const name of vcRuntimeFiles) copyFileSync(join(redistDir, crtDirs[0]!, name), join(dirname(targets[0]!), name));
  console.log(`已附带 VC++ 运行库：${join(redistDir, crtDirs[0]!)}`);
}
