import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync } from "@toonflow/file";
import { file } from "@toonflow/file/bun";
import { dirname, join, resolve } from "node:path";

const args = process.argv.slice(2);
if (args.length !== 1) throw new Error("用法：bun run publish <产物目录>");
const artifactDir = resolve(args[0]!);
const serverDir = resolve(import.meta.dir, "..");
const names = readdirSync(artifactDir, { withFileTypes: true }).filter((entry) => entry.isFile()).map((entry) => entry.name);
const manifests = names.filter((name) => name.endsWith("-update.json"));
if (manifests.length !== 1) throw new Error("产物目录必须恰好包含一个 *-update.json");
const manifestName = manifests[0]!;
const manifest = JSON.parse(readFileSync(join(artifactDir, manifestName), "utf8"));
const version = manifest.version;
const manifestParts = /^([a-zA-Z0-9][a-zA-Z0-9._-]*)-(win|macos|linux)-(x64|arm64)-update\.json$/.exec(manifestName);
if (!manifestParts || manifest.platform !== manifestParts[2] || manifest.arch !== manifestParts[3]) {
  throw new Error("更新清单的平台和架构必须与文件名前缀一致");
}
const prefix = manifestName.slice(0, -"update.json".length);
const archiveName = manifest.artifact?.file;
if (typeof version !== "string" || !/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?(?:\+[a-zA-Z0-9.-]+)?$/.test(version)) {
  throw new Error("更新清单缺少有效 version");
}
if (typeof manifest.hash !== "string" || !manifest.hash) throw new Error("更新清单缺少 hash");
if (typeof archiveName !== "string" || !archiveName.startsWith(prefix) || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.tar\.zst$/.test(archiveName) || !names.includes(archiveName)) {
  throw new Error("更新清单引用的同前缀 .tar.zst 归档不存在或文件名无效");
}
const publicDir = join(serverDir, "public");
const files = [archiveName, ...names.filter((name) => name.startsWith(prefix) && name.endsWith(".patch"))];
const checksumName = `${prefix}checksum.json`;
const hasChecksum = names.includes(checksumName);
if (hasChecksum || existsSync(join(publicDir, checksumName))) {
  // 旧产物可能没有校验清单，切换版本前也需确认公开目录不会留下另一版的固定校验文件。
  const checksum = JSON.parse(readFileSync(join(hasChecksum ? artifactDir : publicDir, checksumName), "utf8"));
  if (checksum?.hash !== manifest.hash || typeof checksum.tarSha256 !== "string" || !/^[a-f0-9]{64}$/.test(checksum.tarSha256)
    || !Number.isSafeInteger(checksum.tarSize) || checksum.tarSize <= 0) {
    throw new Error(`归档校验清单无效或与待发布版本不匹配：${checksumName}`);
  }
  if (hasChecksum) files.push(checksumName);
}
files.push(manifestName);
if (manifest.platform === "macos" && manifest.pkg !== undefined) {
  const pkgName = `toonflow-${version}-macos-${manifest.arch}.pkg`;
  if (manifest.pkg?.file !== pkgName || !names.includes(pkgName)) throw new Error("macOS 更新清单引用的 PKG 安装包不存在或文件名无效");
  const pkg = file(join(artifactDir, pkgName));
  if (pkg.size <= 0 || pkg.size !== manifest.pkg.size) throw new Error("macOS 安装包大小与更新清单不一致");
  const digest = new Bun.CryptoHasher("sha256");
  for await (const chunk of pkg.stream()) digest.update(chunk);
  if (digest.digest("hex") !== manifest.pkg.sha256) throw new Error("macOS 安装包摘要与更新清单不一致");
  files.unshift(pkgName);
}
if (manifest.platform === "linux" && manifest.deb) {
  const debName = `toonflow-${version}-linux-${manifest.arch}.deb`;
  if (manifest.deb.file !== debName || !names.includes(debName)) throw new Error("Linux 更新清单引用的 Debian 安装包不存在或文件名无效");
  files.unshift(debName);
}
if (files.some((name) => !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name))) throw new Error("补丁文件名无效");
const targetFolder = manifest.platform === "win" ? manifest.arch === "x64" ? "" : "windowsArm64"
  : `${manifest.platform === "macos" ? "mac" : "linux"}${manifest.arch === "x64" ? "X64" : "Arm64"}`;
const releasesDir = join(serverDir, "releases", targetFolder);
const releaseDir = join(releasesDir, version);
mkdirSync(publicDir, { recursive: true });
mkdirSync(releasesDir, { recursive: true });
mkdirSync(releaseDir);
try {
  for (const name of files) copyFileSync(join(artifactDir, name), join(releaseDir, name));
  // ACT: 单人手动发布；保留历史补丁，文件逐一替换完成后才切换清单，不支持并发发布。
  for (const name of files) {
    const temporaryFile = join(publicDir, `${name}.tmp`);
    try {
      copyFileSync(join(releaseDir, name), temporaryFile);
      renameSync(temporaryFile, join(publicDir, name));
    } finally {
      rmSync(temporaryFile, { force: true });
    }
  }
} catch (error) {
  if (dirname(realpathSync(releaseDir)) !== realpathSync(releasesDir)) throw new Error("拒绝清理发布目录以外的路径。", { cause: error });
  rmSync(releaseDir, { recursive: true });
  throw error;
}
console.log(`已发布 ${version}，hash=${manifest.hash}`);
console.log(`版本快照：${releaseDir}`);
