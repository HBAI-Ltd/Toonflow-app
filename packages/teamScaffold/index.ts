import { randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";
import { teamLimits, teamNameSchema, teamResourcePathSchema, teamSchema, validateTeamResources } from "./src/runtime";

export type { TeamManifest } from "./src/runtime";

async function ensurePlainPath(path: string) {
  const parent = dirname(path);
  if (parent !== path) await ensurePlainPath(parent);
  const info = await lstat(path).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return;
    throw error;
  });
  if (info?.isSymbolicLink()) throw new Error(`团队路径不能是符号链接：${path}`);
  return info;
}

async function publishDirectory(root: string, name: string, files: Record<string, Uint8Array>, overwrite: boolean) {
  root = resolve(root);
  const target = resolve(root, teamNameSchema.parse(name));
  if (dirname(target) !== root) throw new Error("团队输出目录越界");
  await ensurePlainPath(root);
  const previous = await ensurePlainPath(target);
  if (previous && !previous.isDirectory()) throw new Error(`团队安装目标不是目录：${target}`);
  if (previous && !overwrite) return false;
  await mkdir(root, { recursive: true });
  const suffix = randomUUID().replaceAll("-", "");
  const staging = join(root, `teamBuild${suffix}`);
  const backup = join(root, `teamBackup${suffix}`);
  let moved = false;
  try {
    await mkdir(staging);
    for (const [path, content] of Object.entries(files)) {
      const destination = join(staging, ...path.split("/"));
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, content, { flag: "wx" });
    }
    if (previous) {
      await rename(target, backup);
      moved = true;
    }
    try {
      await rename(staging, target);
    } catch (error) {
      if (moved) {
        await rename(backup, target);
        moved = false;
      }
      throw error;
    }
    if (moved) await rm(backup, { recursive: true });
    return true;
  } finally {
    // ACT: 临时目录名由本次构建生成；旧安装只在新目录替换成功后删除。
    if (dirname(staging) !== root) throw new Error("团队暂存目录越界");
    await rm(staging, { recursive: true, force: true });
  }
}

export async function createTeamConfig(configUrl: string, options: { sync?: "missing" | "replace" } = {}) {
  const source = fileURLToPath(new URL(".", configUrl));
  await ensurePlainPath(source);
  const files: Record<string, Uint8Array> = Object.create(null);
  const paths = new Set<string>();
  let bytes = 0;
  let entries = 0;
  async function collect(path: string, optional = false) {
    teamResourcePathSchema.parse(path);
    if (++entries > teamLimits.maxEntries) throw new Error(`团队资源不能超过 ${teamLimits.maxEntries} 个条目`);
    if (paths.has(path.toLowerCase())) throw new Error(`团队路径仅大小写不同：${path}`);
    paths.add(path.toLowerCase());
    const absolute = join(source, ...path.split("/"));
    const info = await lstat(absolute).catch((error: NodeJS.ErrnoException) => {
      if (optional && error.code === "ENOENT") return;
      throw error;
    });
    if (!info) return;
    if (info.isSymbolicLink()) throw new Error(`团队资源不能是符号链接：${path}`);
    if (info.isDirectory()) {
      for (const entry of (await readdir(absolute)).sort()) await collect(`${path}/${entry}`);
      return;
    }
    if (!info.isFile()) throw new Error(`团队资源必须是普通文件：${path}`);
    if (path.startsWith("tools/") && !/^tools\/[a-z][a-zA-Z0-9]*\.tool\.js$/.test(path)) throw new Error("tools/ 只允许直接包含已构建的 .tool.js 文件");
    if (info.size > teamLimits.maxFileBytes) throw new Error(`团队文件不能超过 20 MiB：${path}`);
    const content = await readFile(absolute);
    bytes += content.byteLength;
    if (content.byteLength > teamLimits.maxFileBytes || bytes > teamLimits.maxTotalBytes) throw new Error("团队解包后资源总大小不能超过 20 MiB");
    files[path] = content;
  }
  await collect("team.json");
  await collect("readme.md");
  for (const folder of ["members", "skills", "knowledge", "tools"]) await collect(folder, true);
  const packagePath = join(source, "package.json");
  const packageInfo = await ensurePlainPath(packagePath);
  if (!packageInfo?.isFile() || packageInfo.size > 1024 * 1024) throw new Error("团队 package.json 无效");
  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
  const manifest = teamSchema.parse({ ...JSON.parse(new TextDecoder().decode(files["team.json"])), version: packageJson.version });
  validateTeamResources(manifest, Object.keys(files));
  bytes -= files["team.json"]!.byteLength;
  files["team.json"] = new TextEncoder().encode(`${JSON.stringify(manifest, null, 2)}\n`);
  if (bytes + files["team.json"].byteLength > teamLimits.maxTotalBytes) throw new Error("团队资源总大小不能超过 20 MiB");
  const archive = zipSync(files, { level: 6 });
  if (archive.byteLength > teamLimits.maxTotalBytes) throw new Error("团队压缩包不能超过 20 MiB");
  const buildRoot = fileURLToPath(new URL("../../build/agents/", import.meta.url));
  const dataRoot = fileURLToPath(new URL("../../data/agents/", import.meta.url));
  await publishDirectory(buildRoot, manifest.name, files, true);
  const archivePath = join(buildRoot, `${manifest.name}.agent.zip`);
  await ensurePlainPath(archivePath);
  await writeFile(archivePath, archive);
  let synced = false;
  if (process.env.NODE_ENV === "dev") synced = await publishDirectory(dataRoot, manifest.name, files, options.sync === "replace");
  return { manifest, directory: join(buildRoot, manifest.name), archive: archivePath, synced };
}
