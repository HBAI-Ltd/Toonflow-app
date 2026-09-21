import { copyFile, cp, mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export default async function initializePlugins(targetDirectory: string, sourceDirectory: string, fileFilter?: RegExp | readonly string[], revision?: string) {
  const marker = resolve(targetDirectory, "initialized");
  const initialized = await readFile(marker, "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (initialized !== null && (revision === undefined || initialized === revision)) return;

  const entries = await readdir(sourceDirectory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!entries) return;
  await mkdir(targetDirectory, { recursive: true });
  const files = entries.filter(file => fileFilter
    ? file.isFile() && (fileFilter instanceof RegExp ? fileFilter.test(file.name) : fileFilter.includes(file.name))
    : file.isDirectory());
  if (!files.length && revision === undefined) return;
  for (const file of files) {
    const source = resolve(sourceDirectory, file.name);
    const target = resolve(targetDirectory, file.name);
    if (revision === undefined) {
      await cp(source, target, { recursive: true, force: false });
      continue;
    }
    // ACT: 版本同步仅覆盖节点和工具单文件；同目录 rename 保留失败时的旧文件。
    const temporary = resolve(targetDirectory, `.pluginSync${crypto.randomUUID()}`);
    try {
      await copyFile(source, temporary);
      await rename(temporary, target);
    } finally {
      await unlink(temporary).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    }
  }
  // 同一构建只同步一次；安装器移除标记以支持同版本重装，构建变化支持升级和降级。
  await writeFile(marker, revision ?? "", { flag: revision === undefined ? "wx" : "w" }).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "EEXIST") throw error;
  });
}
