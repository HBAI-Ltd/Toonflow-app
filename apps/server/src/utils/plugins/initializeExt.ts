import { lstat, mkdir, readFile, readdir, writeAtomic } from "@toonflow/file";
import { resolve } from "node:path";
import { extFileName, extNameFromFile, extPaths, parseExt, resolveExtPath, validateExtSource } from "@/utils/plugins/ext";
import { requireNewerVersion } from "@/utils/plugins/install";
import { lockWorkspaceFiles, writeWorkspaceFile } from "@/utils/workspace/files";

export default async function initializeExt(targetDirectory: string, sourceDirectory: string, revision?: string) {
  const files = await readdir(sourceDirectory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  await mkdir(targetDirectory, { recursive: true });
  if ((await lstat(targetDirectory)).isSymbolicLink()) throw new Error("文件扩展目录不能是符号链接");
  const statePath = resolve(targetDirectory, "bundled.json");
  const saved = await readFile(statePath, "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return "{}";
    throw error;
  });
  const state = JSON.parse(saved) as Record<string, { hash: string; revision?: string }>;
  const names = new Set(files.filter(file => file.isFile()).map(file => extNameFromFile(file.name)).filter((name): name is string => !!name));
  for (const name of names) {
    const path = resolve(targetDirectory, extFileName(name));
    const release = lockWorkspaceFiles(extPaths(name, targetDirectory));
    try {
      const removed = await lstat(resolve(targetDirectory, `${name}.removed`)).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
      });
      if (removed) continue;
      const source = await readFile(await resolveExtPath(name, sourceDirectory), "utf8");
      const incoming = validateExtSource(source, name);
      const current = await lstat(path).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
      if (current && !current.isFile()) continue;
      const installedPath = await resolveExtPath(name, targetDirectory);
      const installed = await lstat(installedPath).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
      if (installed && !installed.isFile()) continue;
      if (installed) {
        const previous = await readFile(installedPath, "utf8");
        if (previous === source) continue;
        let version: string;
        try { version = parseExt(previous, name).version; }
        catch { continue; }
        let newer = false;
        try { requireNewerVersion(version, incoming.version, name); newer = true; }
        catch (error) { if ((error as { status?: number }).status !== 409) throw error; }
        // 同版本只更新仍与上次内置包一致的文件，市场安装或本地修改的包保留。
        const bundled = state[name];
        if (!newer && !(version === incoming.version && bundled?.hash === Bun.hash(previous).toString(16) && bundled.revision !== revision)) continue;
      }
      await writeWorkspaceFile(path, source, !current);
      state[name] = { hash: Bun.hash(source).toString(16), revision };
      await writeAtomic(statePath, JSON.stringify(state), { mode: 0o600 });
    } finally { release(); }
  }
}
