import { lstat, mkdir, mkdtemp, readFile, rename, rm, writeAtomic } from "@toonflow/file";
import { createHash } from "node:crypto";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "fflate";
import { data, digest } from "pluginDeveloper:bundledSdk";

const resources = join(dirname(fileURLToPath(import.meta.url)), "pluginResources");
const base = join(resources, "pluginDeveloper", "bundled");
const directory = join(base, digest);
let pending: Promise<string> | undefined;

async function ready() {
  try {
    return (await lstat(directory)).isDirectory()
      && (await lstat(join(directory, "pluginBuild.js"))).isFile()
      && (await readFile(join(directory, "digest"), "utf8")) === digest;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return false;
  }
}

async function unpack() {
  for (const path of [resources, dirname(base), base]) {
    await mkdir(path, { recursive: true });
    if (!(await lstat(path)).isDirectory()) throw new Error("内置 SDK 缓存目录无效");
  }
  if (await ready()) return directory;
  const bytes = Buffer.from(data, "base64");
  if (createHash("sha256").update(bytes).digest("hex") !== digest) throw new Error("内置 SDK 的 ZIP 校验失败，请重新安装开发工具");
  const stage = await mkdtemp(join(base, "extract"));
  try {
    for (const [name, content] of Object.entries(unzipSync(bytes))) {
      const output = resolve(stage, name);
      const offset = relative(stage, output);
      if (!offset || offset === ".." || offset.startsWith(`..${sep}`) || isAbsolute(offset)) throw new Error("内置 SDK 文件超出缓存目录");
      await mkdir(dirname(output), { recursive: true });
      await writeAtomic(output, content, { exclusive: true });
    }
    await writeAtomic(join(stage, "digest"), digest, { exclusive: true });
    try { await rename(stage, directory); }
    catch (error) { if (!await ready()) throw error; }
    return directory;
  } finally { await rm(stage, { recursive: true, force: true }); }
}

export async function ensureBundledSdk(signal?: AbortSignal) {
  signal?.throwIfAborted();
  // 解包可以由多个构建共用，一个项目取消仅取消自己的编译。
  pending ??= unpack().finally(() => { pending = undefined; });
  const result = await pending;
  signal?.throwIfAborted();
  return result;
}
