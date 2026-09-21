import { lstat, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import conf from "@/utils/conf";
import { decodeText, requireNewerVersion, skillZip } from "@/utils/plugins/install";
import { isWithin } from "@/utils/workspace/files";
import { agentsDirectory, checkName, fingerprint, installRecord, maxBytes, readFiles, validateFiles, withTeamFiles } from "./files";

const require = createRequire(import.meta.url);

export async function installTeam(fileName: string, bytes: Uint8Array, force = false) {
  if (!/^[a-z][a-zA-Z0-9]*\.agent\.zip$/.test(fileName) || fileName.length > 128) {
    throw Object.assign(new Error("请选择小驼峰命名的 .agent.zip 团队包"), { status: 400 });
  }
  if (!bytes.byteLength || bytes.byteLength > maxBytes) throw Object.assign(new Error("团队包不能为空且不能超过 20 MB"), { status: 413 });
  const name = checkName(fileName.slice(0, -10));
  // ACT: 与技能安装共用 ZIP 校验，不执行包内工具或解压到不受控路径。
  const archive = skillZip(bytes);
  const prefix = archive.has("team.json") ? "" : `${name}/`;
  if (!archive.has(`${prefix}team.json`) || [...archive.keys()].some(path => !path.startsWith(prefix))) {
    throw Object.assign(new Error("团队包须在根目录或同名目录下包含 team.json，所有文件须位于该目录内"), { status: 400 });
  }
  const files = new Map([...archive].map(([path, content]) => [path.slice(prefix.length), content]));
  const manifest = validateFiles(name, files);
  return withTeamFiles(async () => {
    const root = dirname(conf.path);
    let temporary: string | undefined;
    let preserveBackup = false;
    try {
      await mkdir(agentsDirectory, { recursive: true });
      if (!(await lstat(agentsDirectory)).isDirectory()) throw Object.assign(new Error("团队目录必须是普通目录"), { status: 403 });
      const existing = (await readdir(agentsDirectory)).find(item => item.toLowerCase() === name.toLowerCase());
      if (Object.keys(conf.get("remoteConnections", {})).some(item => item.toLowerCase() === name.toLowerCase())) {
        throw Object.assign(new Error("已存在同名远端团队连接"), { status: 409 });
      }
      if (existing && existing !== name) throw Object.assign(new Error("团队目录名称大小写冲突"), { status: 409 });
      const target = resolve(agentsDirectory, name);
      const previous = existing ? await readFiles(name) : undefined;
      if (previous && !force) {
        const recordPath = resolve(target, installRecord);
        const info = await lstat(recordPath).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
        let saved: unknown;
        if (info?.isFile() && info.size < 4096) {
          try { saved = JSON.parse(await readFile(recordPath, "utf8")).fingerprint; } catch { /* 无有效安装指纹时不能确认本地内容未修改。 */ }
        }
        if (saved !== fingerprint(previous.files)) {
          throw Object.assign(new Error("团队存在本地修改或缺少安装记录，请先导出备份；确定覆盖时使用开发者强制安装"), { status: 409 });
        }
        let version: unknown;
        try { version = JSON.parse(decodeText(previous.files.get("team.json")!)).version; } catch { /* 版本缺失由共用升级检查提示。 */ }
        requireNewerVersion(version, manifest.version, `团队“${name}”`);
      }
      temporary = await mkdtemp(resolve(root, ".agentInstall"));
      const staged = resolve(temporary, "new");
      for (const [path, content] of files) {
        const destination = resolve(staged, path);
        if (!isWithin(staged, destination)) throw Object.assign(new Error("团队文件路径无效"), { status: 400 });
        await mkdir(dirname(destination), { recursive: true });
        await writeFile(destination, content, { flag: "wx", mode: 0o600 });
      }
      await writeFile(resolve(staged, installRecord), JSON.stringify({ fingerprint: fingerprint(files) }), { flag: "wx", mode: 0o600 });
      const backup = resolve(temporary, "previous");
      if (previous) await rename(target, backup);
      try { await rename(staged, target); }
      catch (error) {
        if (previous) {
          try { await rename(backup, target); }
          catch (restoreError) {
            preserveBackup = true;
            throw new AggregateError([error, restoreError], `团队更新失败，旧版保留在 ${backup}，请恢复后重试`);
          }
        }
        throw error;
      }
      const actualTarget = await realpath(target);
      for (const path of [...(previous?.files.keys() ?? []), ...files.keys()]) {
        if (path.startsWith("tools/")) delete require.cache[resolve(actualTarget, path)];
      }
      return { name };
    } finally {
      if (temporary && !preserveBackup && temporary !== root && isWithin(root, temporary)) {
        await rm(temporary, { recursive: true, force: true }).catch(error => console.warn(`团队安装暂存目录清理失败：${temporary}`, error));
      }
    }
  });
}
