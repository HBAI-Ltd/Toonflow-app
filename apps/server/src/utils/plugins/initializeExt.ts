import { lstat, mkdir, readFile, readdir } from "@toonflow/file";
import { resolve } from "node:path";
import { parseExt } from "@/utils/plugins/ext";
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
  for (const file of files.filter(file => file.isFile() && /^ext-[a-z][a-zA-Z0-9]*\.umd\.js$/.test(file.name))) {
    const name = file.name.slice(0, -7);
    const path = resolve(targetDirectory, file.name);
    const release = lockWorkspaceFiles([path]);
    try {
      const removed = await lstat(resolve(targetDirectory, `${name}.removed`)).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
      });
      if (removed) continue;
      const source = await readFile(resolve(sourceDirectory, file.name), "utf8");
      const incoming = parseExt(source, name);
      const current = await lstat(path).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
      if (current && !current.isFile()) continue;
      if (current) {
        const previous = await readFile(path, "utf8");
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
      await writeWorkspaceFile(statePath, JSON.stringify(state));
    } finally { release(); }
  }
}
