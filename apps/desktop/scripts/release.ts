import { $ } from "bun";
import { copyFileSync, existsSync, mkdirSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import desktopConfig from "../../../electrobun.config";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { initial: { type: "boolean" } },
});
const version = positionals[0];
if (positionals.length !== 1 || !/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error("用法：bun run release:desktop 2.0.0 --initial，后续版本使用 bun run release:desktop 2.0.1");
}
const isMac = process.platform === "darwin";
if ((!isMac || !["x64", "arm64"].includes(process.arch)) && (process.platform !== "win32" || process.arch !== "x64")) {
  throw new Error("增量发布需在 Windows x64 或 macOS x64/arm64 本机执行。");
}

const projectDir = resolve(import.meta.dirname, "../../..");
const platform = isMac ? "macos" : "win";
const targetFolder = isMac ? process.arch === "x64" ? "macX64" : "macArm64" : "";
const releasesDir = join(projectDir, "build/desktop/releases", targetFolder);
const releaseDir = join(releasesDir, version);
const artifactDir = resolve(projectDir, desktopConfig.build.artifactFolder);
const prefix = `stable-${platform}-${process.arch}`;
const manifestName = `${prefix}-update.json`;
if (existsSync(releaseDir)) throw new Error(`版本已保留，请使用新版本号：${releaseDir}`);

let previousHash: string | undefined;
if (!values.initial) {
  const response = await fetch(`${desktopConfig.release.baseUrl.replace(/\/+$/, "")}/${manifestName}`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("更新服务器尚无基线，请先构建并发布 --initial 版本。");
  const previous = await response.json();
  if (!previous || previous.platform !== platform || previous.arch !== process.arch ||
      typeof previous.hash !== "string" || !/^[a-zA-Z0-9]+$/.test(previous.hash) ||
      typeof previous.version !== "string" || !/^\d+\.\d+\.\d+$/.test(previous.version)) {
    throw new Error("更新清单的平台、架构、版本或 Hash 无效。");
  }
  // ACT: Intel 固定使用 1.18.1 旧协议；不向独立发布服务器传递桌面配置。
  const legacy = isMac && process.arch === "x64" && previous.schemaVersion === undefined;
  if (!legacy && (previous.identifier !== desktopConfig.app.identifier || previous.channel !== "stable")) {
    throw new Error("更新清单的应用标识或通道不一致。");
  }
  const archive = legacy ? `${prefix}-${desktopConfig.app.name.replace(/\s/g, "")}.app.tar.zst` : previous.artifact?.file;
  if (typeof archive !== "string" || !archive.startsWith(`${prefix}-`) || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.tar\.zst$/.test(archive)) {
    throw new Error("更新清单的归档名称无效。");
  }
  previousHash = previous.hash;
  const nextParts = version.split(".").map(Number);
  const oldParts = previous.version.split(".").map(Number);
  const changedPart = nextParts.findIndex((part, index) => part !== oldParts[index]);
  if (changedPart < 0 || nextParts[changedPart]! <= oldParts[changedPart]!) {
    throw new Error(`新版本 ${version} 必须高于服务器版本 ${previous.version}。`);
  }
  console.log(`构建增量更新：${previous.version} → ${version}`);
}

await $`${process.execPath} run ${values.initial ? "package:desktop" : "build:desktop"}`
  .cwd(projectDir)
  .env({ ...process.env, appVersion: version, generateUpdatePatch: values.initial ? "0" : "1" });

// ACT: 本机 SDK 产物直接读取，完整清单校验仅用于远程基线。
const manifest = await Bun.file(join(artifactDir, manifestName)).json();
if (manifest.version !== version) {
  throw new Error("本次构建的更新 JSON 与请求版本不一致。");
}
const names: string[] = [isMac && process.arch === "x64"
  ? `${prefix}-${desktopConfig.app.name.replace(/\s/g, "")}.app.tar.zst`
  : manifest.artifact.file];
if (values.initial) {
  if (isMac) {
    const installers = readdirSync(artifactDir).filter((name) => name.endsWith(".dmg"));
    if (installers.length !== 1) throw new Error("Mac 基线必须包含且仅包含一个 DMG 安装包。");
    names.push(installers[0]!);
  } else names.push(`toonflow-${version}-Setup.exe`);
}
if (previousHash) names.push(`${prefix}-${previousHash}.patch`);
for (const name of names) {
  if (!existsSync(join(artifactDir, name))) throw new Error(`构建产物缺失，未创建发布快照：${name}`);
}
mkdirSync(releasesDir, { recursive: true });
mkdirSync(releaseDir);
try {
  for (const name of [...names, manifestName]) copyFileSync(join(artifactDir, name), join(releaseDir, name));
} catch (error) {
  if (dirname(realpathSync(releaseDir)) !== realpathSync(releasesDir)) throw new Error("拒绝清理发布目录以外的路径。", { cause: error });
  rmSync(releaseDir, { recursive: true });
  throw error;
}
console.log(`版本快照：${releaseDir}`);
console.log(`将此目录交给独立更新服务器发布：bun run publish:update ${releaseDir}`);
