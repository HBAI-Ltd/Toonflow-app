import { copyFileSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync } from "node:fs";
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
const manifestParts = /^([a-zA-Z0-9][a-zA-Z0-9._-]*)-(win|macos)-(x64|arm64)-update\.json$/.exec(manifestName);
if (!manifestParts || manifest.platform !== manifestParts[2] || manifest.arch !== manifestParts[3]) {
  throw new Error("更新清单的平台和架构必须与文件名前缀一致");
}
const prefix = manifestName.slice(0, -"update.json".length);
let archiveName = manifest.artifact?.file;
if (typeof version !== "string" || !/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?(?:\+[a-zA-Z0-9.-]+)?$/.test(version)) {
  throw new Error("更新清单缺少有效 version");
}
if (typeof manifest.hash !== "string" || !manifest.hash) throw new Error("更新清单缺少 hash");
// ACT: 仅兼容已验证的 Intel Mac 旧清单；其他构建必须明确提供 artifact.file。
if (manifest.artifact === undefined && manifest.platform === "macos" && manifest.arch === "x64") {
  const archives = names.filter((name) => name.startsWith(prefix) && name.endsWith(".app.tar.zst"));
  if (archives.length !== 1) throw new Error("Intel Mac 旧清单必须对应且仅对应一个同前缀 .app.tar.zst 归档");
  archiveName = archives[0];
}
if (typeof archiveName !== "string" || !archiveName.startsWith(prefix) || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.tar\.zst$/.test(archiveName) || !names.includes(archiveName)) {
  throw new Error("更新清单引用的同前缀 .tar.zst 归档不存在或文件名无效");
}
const files = [archiveName, ...names.filter((name) => name.startsWith(prefix) && name.endsWith(".patch")), manifestName];
if (files.some((name) => !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name))) throw new Error("补丁文件名无效");
const publicDir = join(serverDir, "public");
const releasesDir = manifest.platform === "macos"
  ? join(serverDir, "releases", manifest.arch === "x64" ? "macX64" : "macArm64")
  : join(serverDir, "releases");
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
